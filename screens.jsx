/* AST NEXT — screens */
const S = window.ASTStore;

/* ---------------- PLAN ---------------- */
function PlanScreen({ state, toast }) {
  const { me, events, sportVotes, locationVotes, players, locations, ico } = state;
  const [dateText, setDateText] = useState("");
  const myLoc = locationVotes[me];

  return (
    <div className="page">
      <PageHead kicker="Step 1 · Plan" title="Lock the plan">
        {me ? <>Voting as <b>{firstName(me)}</b>. Tap to change your picks anytime.</>
            : <>Pick who you are to start voting.</>}
      </PageHead>

      <Section title="Who are you?">
        <div className="who">
          {players.map(p => (
            <button key={p} className={me === p ? "on" : ""} onClick={() => { S.setMe(p); toast("You're " + firstName(p)); }}>
              <Avatar name={p} size={26} />{firstName(p)}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Sports — I'm in" hint={me ? "" : "pick a name first"}>
        <div className="grid2">
          {events.map(ev => {
            const on = (sportVotes[ev] || []).includes(me);
            return (
              <button key={ev} className={"toggle" + (on ? " on" : "")}
                disabled={!me}
                onClick={() => S.toggleSport(ev, me)}>
                <span className="ico">{ico[ev] || "🏅"}</span>
                <span className="label">{ev}</span>
                <span className="check">{Ico.check}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Location">
        <div className="seg">
          {locations.map(loc => {
            const count = Object.values(locationVotes).filter(v => v === loc).length;
            return (
              <button key={loc} className={myLoc === loc ? "on" : ""} disabled={!me}
                onClick={() => S.setLocation(loc, me)}>
                <span>{myLoc === loc && <span className="star">★ </span>}{loc}</span>
                <span className="meta">{count} {count === 1 ? "vote" : "votes"}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Dates that work">
        <div className="card">
          {state.dateProposals.length === 0
            ? <Empty icon="📅" text="No dates proposed yet." />
            : state.dateProposals.map(d => {
                const on = d.votes.includes(me);
                return (
                  <div className="date-row" key={d.id}>
                    <div className="d-label">{d.label}<span className="d-by">proposed by {firstName(d.by)}</span></div>
                    <button className={"date-vote" + (on ? " on" : "")} disabled={!me} onClick={() => S.toggleDate(d.id, me)}>
                      <span>{on ? "✓ In" : "I'm in"}</span><span className="cnt">{d.votes.length}</span>
                    </button>
                  </div>
                );
              })}
        </div>
        <div className="row-add">
          <input className="input" placeholder="Propose a date (e.g. July 4th weekend)"
            value={dateText} onChange={e => setDateText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") add(); }} />
          <button className="btn accent" disabled={!me || !dateText.trim()} onClick={add}>+ Add</button>
        </div>
        {!me && <p className="muted-note">Pick your name above to vote &amp; propose dates.</p>}
      </Section>
    </div>
  );

  function add() {
    if (!me || !dateText.trim()) return;
    S.addDate(dateText.trim(), me); setDateText(""); toast("Date proposed");
  }
}

/* ---------------- RESULTS ---------------- */
function ResultsScreen({ state }) {
  const { events, sportVotes, locationVotes, players, locations } = state;
  const total = players.length;
  const ranked = events.map(ev => ({ ev, voters: sportVotes[ev] || [] }))
    .sort((a, b) => b.voters.length - a.voters.length);
  const locCounts = locations.map(loc => ({
    loc, voters: players.filter(p => locationVotes[p] === loc),
  }));
  const maxLoc = Math.max(...locCounts.map(l => l.voters.length), 0);
  const dates = [...state.dateProposals].sort((a, b) => b.votes.length - a.votes.length);

  return (
    <div className="page">
      <PageHead kicker="Step 2 · Vote tally" title="Where it stands">
        Live results from all {total} players. Updates the moment anyone votes.
      </PageHead>

      <Section title="Sport votes">
        <div className="card">
          {ranked.map(({ ev, voters }) => (
            <div className="vote" key={ev}>
              <div className="vote-top">
                <span className="vote-name">{ev}</span>
                <span className="vote-count"><b>{voters.length}</b> <span className="of">/ {total}</span></span>
              </div>
              <div className="track"><div className="fill" style={{ width: (total ? voters.length / total * 100 : 0) + "%" }}></div></div>
              <div className="voters">
                {voters.length
                  ? <div className="chips">{voters.map(v => <span className="voter" key={v}>{firstName(v)}</span>)}</div>
                  : <span className="empty">no votes yet</span>}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Location votes">
        <div className="loc-res">
          {locCounts.map(({ loc, voters }) => (
            <div className={"card" + (voters.length === maxLoc && maxLoc > 0 ? " win" : "")} key={loc}>
              <div className="place">{loc}</div>
              <div className="big">{voters.length}</div>
              <div className="who-list">{voters.map(firstName).join(", ") || "—"}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Best dates">
        <div className="card">
          {dates.length === 0
            ? <Empty icon="📅" text="No dates proposed yet." />
            : dates.map((d, i) => (
                <div className="date-row" key={d.id}>
                  <div className="d-label">{i === 0 && d.votes.length > 0 ? "🏆 " : ""}{d.label}<span className="d-by">proposed by {firstName(d.by)}</span></div>
                  <span className="date-vote on" style={{ pointerEvents: "none" }}>{d.votes.length} in</span>
                </div>
              ))}
        </div>
      </Section>
    </div>
  );
}

/* ---------------- SCOREBOARD ---------------- */
function BoardScreen({ state, toast }) {
  const { players, events, scores, standings, ico } = state;
  const [newEv, setNewEv] = useState("");
  const leaderPts = standings[0]?.points || 0;
  const medalCls = ["", "silver", "bronze"];

  return (
    <div className="page">
      <PageHead kicker="Step 3 · Game day" title="Scoreboard">
        Enter points per event — standings recompute instantly for everyone.
      </PageHead>

      <Section title="Standings">
        <div className="standings">
          {standings.map((s, i) => (
            <div className={"stand" + (i === 0 && s.points > 0 ? " lead" : "")} key={s.name}>
              <div className={"rank " + (medalCls[i] || "")}>{i + 1}</div>
              <Avatar name={s.name} size={38} />
              <div className="nm">{s.name}{i === 0 && s.points > 0 && <small>★ Tournament leader</small>}</div>
              <div className="pts">{s.points}<span>pts</span></div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Enter scores" hint="tap a cell">
        <div className="score-wrap">
          <table className="score-table">
            <thead>
              <tr>
                <th className="ev">Event</th>
                {players.map(p => <th key={p}>{firstName(p)}</th>)}
              </tr>
            </thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev}>
                  <td className="ev">
                    <span style={{ marginRight: 6 }}>{ico[ev] || "🏅"}</span>{ev}
                  </td>
                  {players.map(p => {
                    const val = scores[ev + "||" + p];
                    return (
                      <td key={p}>
                        <input className={"score-in" + (val != null && val !== "" ? " has" : "")}
                          type="number" inputMode="numeric" value={val ?? ""}
                          onChange={e => S.setScore(ev, p, e.target.value)} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Add event">
        <div className="row-add">
          <input className="input" placeholder="Custom event name…" value={newEv}
            onChange={e => setNewEv(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") addEv(); }} />
          <button className="btn accent" disabled={!newEv.trim()} onClick={addEv}>+ Add</button>
        </div>
      </Section>
    </div>
  );

  function addEv() {
    const n = newEv.trim(); if (!n) return;
    S.addEvent(n); setNewEv(""); toast("Event added");
  }
}

Object.assign(window, { PlanScreen, ResultsScreen, BoardScreen });
