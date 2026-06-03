/* AST NEXT — app root */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#F5B301",
  "theme": "light"
}/*EDITMODE-END*/;

const ACCENT_OPTS = ["#F5B301", "#E8623D", "#2F7DE1", "#16A35A", "#9B59C9"];

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [state, setState] = useState(null);
  const [tab, setTab] = useState(() => localStorage.getItem("ast_tab") || "plan");
  const [toast, toastNode] = useToast();

  useEffect(() => { ASTStore.init(); return ASTStore.subscribe(setState); }, []);
  useEffect(() => { localStorage.setItem("ast_tab", tab); }, [tab]);

  // apply tweaks to :root
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", t.theme);
    root.style.setProperty("--accent", t.accent);
    // derive a slightly lighter accent-2
    root.style.setProperty("--accent-2", t.accent);
  }, [t.accent, t.theme]);

  if (!state) return null;

  return (
    <div className="app">
      <Header state={state} />
      {tab === "plan"    && <PlanScreen   state={state} toast={toast} />}
      {tab === "results" && <ResultsScreen state={state} />}
      {tab === "board"   && <BoardScreen  state={state} toast={toast} />}
      <BottomNav tab={tab} setTab={setTab} />
      {toastNode}

      <TweaksPanel>
        <TweakSection label="Brand" />
        <TweakColor label="Accent" value={t.accent} options={ACCENT_OPTS}
          onChange={v => setTweak("accent", v)} />
        <TweakSection label="Appearance" />
        <TweakRadio label="Theme" value={t.theme} options={["light", "dark"]}
          onChange={v => setTweak("theme", v)} />
        <TweakSection label="Demo data" />
        <TweakButton label="Reset to sample data" onClick={() => { ASTStore.resetLocal(); toast("Reset"); }} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
