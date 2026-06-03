/* ===================================================================
   AST NEXT — data store
   Works in two modes:
     • SUPABASE  — when you fill in SUPABASE_URL / SUPABASE_ANON_KEY
                   below. Reads/writes Postgres + live realtime sync
                   across every device.
     • LOCAL     — fallback. Persists to localStorage, syncs across
                   browser tabs. Lets the app work the instant you
                   push to GitHub Pages, before Supabase is set up.
   The UI calls the SAME api in both modes.
=================================================================== */
(function () {
  // ---- 1. CONFIG — paste your Supabase project values here ----------
  const SUPABASE_URL      = ""; // e.g. "https://xxxx.supabase.co"
  const SUPABASE_ANON_KEY = ""; // e.g. "eyJhbGci..."
  // (Run schema.sql in the Supabase SQL editor first — see README.md)

  // ---- 2. tournament definition (seed) ------------------------------
  const DEFAULT_PLAYERS = ["Heath Hagan", "Jason Lewis", "Brack Watters", "Justin Ray"];
  const DEFAULT_EVENTS = [
    { name: "Golf",               ico: "⛳" },
    { name: "Basketball Shooting", ico: "🏀" },
    { name: "Disc Golf",          ico: "🥏" },
    { name: "Pickleball",         ico: "🎾" },
    { name: "Bocce Ball",         ico: "🟢" },
    { name: "Cornhole",           ico: "🌽" },
  ];
  const LOCATIONS = ["Conway", "Fayetteville"];
  const ICO = Object.fromEntries(DEFAULT_EVENTS.map(e => [e.name, e.ico]));

  // ---- 3. seed state (used by LOCAL mode demo) ----------------------
  function seed() {
    return {
      players: DEFAULT_PLAYERS.slice(),
      events: DEFAULT_EVENTS.map(e => e.name),
      // sport -> [player names]
      sportVotes: {
        "Golf": ["Heath Hagan", "Justin Ray"],
        "Basketball Shooting": ["Heath Hagan", "Justin Ray"],
        "Disc Golf": ["Heath Hagan", "Justin Ray"],
        "Pickleball": ["Heath Hagan", "Justin Ray"],
        "Cornhole": ["Heath Hagan", "Justin Ray"],
        "Bocce Ball": ["Justin Ray"],
      },
      // player -> location
      locationVotes: { "Justin Ray": "Conway", "Heath Hagan": "Fayetteville" },
      dateProposals: [
        { id: "d1", label: "July 4th weekend", by: "Heath Hagan", votes: ["Heath Hagan", "Justin Ray"] },
        { id: "d2", label: "Labor Day weekend", by: "Justin Ray", votes: ["Justin Ray"] },
      ],
      // "event||player" -> points
      scores: {
        "Golf||Heath Hagan": 4, "Golf||Jason Lewis": 2, "Golf||Brack Watters": 3, "Golf||Justin Ray": 1,
        "Disc Golf||Heath Hagan": 2, "Disc Golf||Jason Lewis": 4, "Disc Golf||Brack Watters": 1, "Disc Golf||Justin Ray": 3,
        "Cornhole||Heath Hagan": 3, "Cornhole||Jason Lewis": 1, "Cornhole||Brack Watters": 4, "Cornhole||Justin Ray": 2,
      },
    };
  }

  // ---- 4. shared helpers --------------------------------------------
  const LS_KEY = "ast_next_v1";
  const ME_KEY = "ast_next_me";
  const listeners = new Set();
  let state = null;
  let mode = "local";
  let connected = false;
  let sb = null; // supabase client

  function emit() { listeners.forEach(fn => fn(getState())); }

  function getState() {
    return {
      ...state,
      ico: ICO,
      locations: LOCATIONS,
      me: localStorage.getItem(ME_KEY) || "",
      mode, connected,
      standings: computeStandings(),
    };
  }

  function computeStandings() {
    const totals = {};
    state.players.forEach(p => totals[p] = 0);
    Object.entries(state.scores).forEach(([k, v]) => {
      const player = k.split("||")[1];
      if (player in totals) totals[player] += Number(v) || 0;
    });
    return state.players
      .map(p => ({ name: p, points: totals[p] || 0 }))
      .sort((a, b) => b.points - a.points);
  }

  // ================================================================
  //  LOCAL MODE
  // ================================================================
  function localLoad() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      state = raw ? JSON.parse(raw) : seed();
    } catch { state = seed(); }
    if (!state.events) state.events = DEFAULT_EVENTS.map(e => e.name);
    if (!state.players) state.players = DEFAULT_PLAYERS.slice();
  }
  function localSave() {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
    emit();
  }

  const localApi = {
    toggleSport(sport, me) {
      const list = state.sportVotes[sport] || (state.sportVotes[sport] = []);
      const i = list.indexOf(me);
      if (i >= 0) list.splice(i, 1); else list.push(me);
      localSave();
    },
    setLocation(loc, me) { state.locationVotes[me] = loc; localSave(); },
    addDate(label, me) {
      state.dateProposals.push({ id: "d" + Date.now(), label, by: me, votes: me ? [me] : [] });
      localSave();
    },
    toggleDate(id, me) {
      const d = state.dateProposals.find(x => x.id === id); if (!d) return;
      const i = d.votes.indexOf(me);
      if (i >= 0) d.votes.splice(i, 1); else d.votes.push(me);
      localSave();
    },
    setScore(event, player, points) {
      const key = event + "||" + player;
      if (points === "" || points == null) delete state.scores[key];
      else state.scores[key] = Number(points);
      localSave();
    },
    addEvent(name) {
      if (!state.events.includes(name)) state.events.push(name);
      localSave();
    },
    removeEvent(name) {
      state.events = state.events.filter(e => e !== name);
      Object.keys(state.scores).forEach(k => { if (k.split("||")[0] === name) delete state.scores[k]; });
      delete state.sportVotes[name];
      localSave();
    },
  };

  // ================================================================
  //  SUPABASE MODE
  // ================================================================
  async function sbRefetch() {
    const [pl, ev, sv, lv, dp, dv, sc] = await Promise.all([
      sb.from("players").select("*").order("sort"),
      sb.from("events").select("*").order("sort"),
      sb.from("sport_votes").select("*"),
      sb.from("location_votes").select("*"),
      sb.from("date_proposals").select("*").order("id"),
      sb.from("date_votes").select("*"),
      sb.from("scores").select("*"),
    ]);
    const players = (pl.data || []).map(r => r.name);
    const events  = (ev.data || []).map(r => r.name);
    const sportVotes = {};
    (sv.data || []).forEach(r => { (sportVotes[r.sport] ||= []).push(r.player); });
    const locationVotes = {};
    (lv.data || []).forEach(r => { locationVotes[r.player] = r.location; });
    const dProps = (dp.data || []).map(r => ({ id: String(r.id), label: r.label, by: r.proposed_by, votes: [] }));
    (dv.data || []).forEach(r => { const d = dProps.find(x => x.id === String(r.date_id)); if (d) d.votes.push(r.player); });
    const scores = {};
    (sc.data || []).forEach(r => { scores[r.event + "||" + r.player] = Number(r.points); });
    state = { players: players.length ? players : DEFAULT_PLAYERS.slice(),
              events: events.length ? events : DEFAULT_EVENTS.map(e => e.name),
              sportVotes, locationVotes, dateProposals: dProps, scores };
    emit();
  }

  const sbApi = {
    async toggleSport(sport, me) {
      const on = (state.sportVotes[sport] || []).includes(me);
      if (on) await sb.from("sport_votes").delete().match({ player: me, sport });
      else    await sb.from("sport_votes").upsert({ player: me, sport });
    },
    async setLocation(loc, me) { await sb.from("location_votes").upsert({ player: me, location: loc }); },
    async addDate(label, me) {
      const { data } = await sb.from("date_proposals").insert({ label, proposed_by: me }).select().single();
      if (data && me) await sb.from("date_votes").upsert({ date_id: data.id, player: me });
    },
    async toggleDate(id, me) {
      const d = state.dateProposals.find(x => x.id === id);
      const on = d && d.votes.includes(me);
      if (on) await sb.from("date_votes").delete().match({ date_id: id, player: me });
      else    await sb.from("date_votes").upsert({ date_id: id, player: me });
    },
    async setScore(event, player, points) {
      if (points === "" || points == null) await sb.from("scores").delete().match({ event, player });
      else await sb.from("scores").upsert({ event, player, points: Number(points) });
    },
    async addEvent(name) {
      await sb.from("events").insert({ name, sort: state.events.length });
    },
    async removeEvent(name) {
      await sb.from("events").delete().match({ name });
      await sb.from("scores").delete().match({ event: name });
    },
  };

  // ================================================================
  //  INIT
  // ================================================================
  async function init() {
    const hasSupabase = SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase;
    if (hasSupabase) {
      try {
        sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        mode = "supabase";
        await sbRefetch();
        const ch = sb.channel("ast-live");
        ["players","events","sport_votes","location_votes","date_proposals","date_votes","scores"]
          .forEach(t => ch.on("postgres_changes", { event: "*", schema: "public", table: t }, sbRefetch));
        ch.subscribe(status => { connected = status === "SUBSCRIBED"; emit(); });
        return;
      } catch (e) {
        console.warn("[AST] Supabase init failed, using local mode.", e);
      }
    }
    // local fallback
    mode = "local"; connected = false;
    localLoad();
    window.addEventListener("storage", e => { if (e.key === LS_KEY) { localLoad(); emit(); } });
    setTimeout(emit, 0);
  }

  const api = {
    init,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    getState,
    setMe(name) { localStorage.setItem(ME_KEY, name); emit(); },
    // mutations dispatch to the active backend
    toggleSport(s, me) { return (mode === "supabase" ? sbApi : localApi).toggleSport(s, me); },
    setLocation(l, me) { return (mode === "supabase" ? sbApi : localApi).setLocation(l, me); },
    addDate(l, me)     { return (mode === "supabase" ? sbApi : localApi).addDate(l, me); },
    toggleDate(id, me) { return (mode === "supabase" ? sbApi : localApi).toggleDate(id, me); },
    setScore(e, p, v)  { return (mode === "supabase" ? sbApi : localApi).setScore(e, p, v); },
    addEvent(n)        { return (mode === "supabase" ? sbApi : localApi).addEvent(n); },
    removeEvent(n)     { return (mode === "supabase" ? sbApi : localApi).removeEvent(n); },
    resetLocal() { state = seed(); localSave(); },
  };

  window.ASTStore = api;
})();
