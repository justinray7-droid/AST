/* AST NEXT — shared UI components */
const { useState, useEffect, useRef } = React;

/* deterministic avatar color from a name */
const AV_COLORS = ["#E8623D", "#2F7DE1", "#16A35A", "#9B59C9", "#E0A100", "#10A8B8", "#D6447B", "#5A6270"];
function avatarColor(name) {
  let h = 0; for (let i = 0; i < (name || "").length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
  return AV_COLORS[h % AV_COLORS.length];
}
function initials(name) {
  const p = (name || "").trim().split(/\s+/);
  return ((p[0]?.[0] || "") + (p[1]?.[0] || "")).toUpperCase() || "?";
}
function firstName(name) { return (name || "").split(/\s+/)[0]; }

function Avatar({ name, size = 38, cls = "" }) {
  return (
    <div className={"av " + cls} style={{ width: size, height: size, background: avatarColor(name), fontSize: size * .4 }}>
      {initials(name)}
    </div>
  );
}

/* icons */
const Ico = {
  bolt: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4.5 13.5H11l-1 8.5L19.5 10H13l0-8z"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 6.5"/></svg>,
  plan: (on) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={on?2.4:2} strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="17" rx="2.5"/><path d="M8 3v3M16 3v3M8 11h8M8 15h5"/></svg>,
  results: (on) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={on?2.4:2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 20V11M12 20V5M19 20v-6"/></svg>,
  board: (on) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={on?2.4:2} strokeLinecap="round" strokeLinejoin="round"><path d="M7 4h10v4a5 5 0 0 1-10 0V4z"/><path d="M17 5h2.5a1 1 0 0 1 1 1c0 2-1.5 3.5-3.5 3.5M7 5H4.5a1 1 0 0 0-1 1c0 2 1.5 3.5 3.5 3.5"/><path d="M12 13v3M9 20h6M10 20l.5-4M14 20l-.5-4"/></svg>,
};

/* header */
function Header({ state }) {
  const live = state.mode === "supabase" && state.connected;
  return (
    <header className="hdr">
      <div className="brand">
        <div className="bolt">{Ico.bolt}</div>
        <div className="wordmark">AST <span>NEXT</span></div>
      </div>
      <div className={"live" + (live ? " is-live" : "")}>
        <span className="dot"></span>{live ? "Live" : "Local"}
      </div>
    </header>
  );
}

/* bottom nav */
function BottomNav({ tab, setTab }) {
  const items = [
    { id: "plan", label: "Plan", ico: Ico.plan },
    { id: "results", label: "Results", ico: Ico.results },
    { id: "board", label: "Board", ico: Ico.board },
  ];
  return (
    <nav className="nav">
      {items.map(it => (
        <button key={it.id} className={tab === it.id ? "on" : ""} onClick={() => setTab(it.id)}>
          <span className="nav-ico">{it.ico(tab === it.id)}</span>
          {it.label}
        </button>
      ))}
    </nav>
  );
}

function PageHead({ kicker, title, children }) {
  return (
    <div className="page-head">
      {kicker && <div className="page-kicker">{kicker}</div>}
      <h1 className="page-title">{title}</h1>
      {children && <p className="page-sub">{children}</p>}
    </div>
  );
}

function Section({ title, hint, children }) {
  return (
    <>
      <div className="sec"><h2>{title}</h2>{hint && <span className="hint">{hint}</span>}</div>
      {children}
    </>
  );
}

function Empty({ icon, text }) {
  return <div className="empty-box"><div className="e-ico">{icon}</div><p>{text}</p></div>;
}

/* toast hook */
function useToast() {
  const [msg, setMsg] = useState("");
  const t = useRef();
  const show = (m) => { setMsg(m); clearTimeout(t.current); t.current = setTimeout(() => setMsg(""), 2200); };
  const node = <div className={"toast" + (msg ? " show" : "")}>{msg}</div>;
  return [show, node];
}

Object.assign(window, {
  Avatar, avatarColor, initials, firstName, Ico,
  Header, BottomNav, PageHead, Section, Empty, useToast,
});
