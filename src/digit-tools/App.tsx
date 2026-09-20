import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { MARKETS } from "./lib/deriv";
import { useMultiFeed } from "./lib/multifeed";
import { scanAll } from "./lib/hot";
import { HotMarketsPanel, HotStrip } from "./components/HotMarkets";
import { TopBar, TickerBar } from "./components/TopBarNav";
import { NavRail, DEFAULT_TAB_ORDER } from "./components/NavRail";
import { FeatureCards } from "./components/FeatureCards";
import { TraderFeedback } from "./components/TraderFeedback";
import { SignalBoard } from "./components/SignalBoard";
import { AIOrb, RiskDisclaimer, Toast } from "./components/Ornaments";
import { CursorGlow } from "./components/CursorGlow";
import { LiveOrb, LiveText } from "./components/LiveOrb";
import { BotsGallery } from "./components/BotsGallery";
import { BotBuilderView } from "./components/BotBuilder";
import { ComingSoonModal, ComingSoonView } from "./components/ComingSoon";
import { SignalAI } from "./components/SignalAI";
import { AutoTrader } from "./components/AutoTrader";
import { BotPickerModal } from "./components/BotModal";
import type { Bot } from "./lib/bots";

const VIEW_LABEL: Record<string, string> = {
  auto: "Auto Trading",
  signal: "Signal AI",
  manual: "Manual Trader",
  bulk: "Bulk Trader",
  clicker: "One-click Trading",
  free: "Free Bots",
  premium: "Premium AI Bots",
  botbuilder: "Bot Builder",
};

const VIEW_BLURB: Record<string, string> = {
  auto: "Set once, let it run. Auto Trading will schedule and manage your loaded bots around sessions, spread conditions and your daily risk limits — fully hands-off.",
  signal: "Live signal calls with confidence scoring, pushed to your dashboard the moment a digit pattern breaks its expected gap.",
  manual: "Full manual control with a fast ticket, barrier pad and one-tap execution on any volatility index.",
  bulk: "Mirror a single setup across every market at once — same stake, same barrier, one click.",
  clicker: "One-click entry for traders who already know their setup and just want the fastest possible path to execution.",
};

export default function App() {
  const [nav, setNav] = useState("dashboard");
  const [loaded, setLoaded] = useState<Bot | null>(null);
  const [picker, setPicker] = useState(false);
  const [soon, setSoon] = useState<{ title: string; blurb: string } | null>(null);
  const [toast, setToast] = useState<{ msg: string; c: string } | null>(null);

  /* ---- bot runner state lives here so its controls can sit in the ticker + status row ---- */
  const [botRunning, setBotRunning] = useState(false);

  const toggleRun = () => {
    const next = !botRunning;
    setBotRunning(next);
    const what = nav === "signal" ? "Signal engine" : "Paper run";
    notify(
      next
        ? nav === "signal"
          ? `${what} armed · signals will be logged as they fire`
          : `${what} armed · contracts settle into Transactions`
        : `${what} stopped`,
      next ? "var(--green)" : "var(--red)",
    );
  };

  /* ---- shared market scan: one feed powers the Analysis Tool AND the fire sign ---- */
  const marketIds = useMemo(() => MARKETS.map((m) => m.id), []);
  const scanFeed = useMultiFeed(marketIds, 1000);
  const [hotOpen, setHotOpen] = useState(false);
  /** false → include warm setups (so the fire actually lights), true → strict 9.9% only */
  const [hotStrict, setHotStrict] = useState(false);

  const hotMarkets = useMemo(
    () => scanAll(MARKETS.map((m) => ({ id: m.id, label: m.label })), scanFeed.digits, scanFeed.price, hotStrict),
    [scanFeed.digits, scanFeed.price, hotStrict],
  );

  /* ---- tab order: user-arrangeable, persisted; falls back to default ---- */
  const [tabOrder, setTabOrder] = useState<string[]>(() => {
    if (typeof localStorage === "undefined") return DEFAULT_TAB_ORDER;
    try {
      const raw = localStorage.getItem("dt-tab-order");
      if (!raw) return DEFAULT_TAB_ORDER;
      const saved = JSON.parse(raw);
      if (!Array.isArray(saved)) return DEFAULT_TAB_ORDER;
      // keep every saved tab that still exists, then append any new ones
      const valid = saved.filter((id: string) => DEFAULT_TAB_ORDER.includes(id));
      const missing = DEFAULT_TAB_ORDER.filter((id) => !valid.includes(id));
      return valid.length ? [...valid, ...missing] : DEFAULT_TAB_ORDER;
    } catch {
      return DEFAULT_TAB_ORDER;
    }
  });

  const saveTabOrder = (o: string[]) => {
    setTabOrder(o);
    try {
      localStorage.setItem("dt-tab-order", JSON.stringify(o));
    } catch {
      /* noop */
    }
    notify("Tab layout saved", "var(--green)");
  };

  const resetTabOrder = () => {
    setTabOrder(DEFAULT_TAB_ORDER);
    try {
      localStorage.removeItem("dt-tab-order");
    } catch {
      /* noop */
    }
    notify("Tab layout reset to default", "var(--cyan)");
  };

  /* ---- theme: dark (default) or light, persisted ---- */
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof localStorage === "undefined") return "dark";
    return (localStorage.getItem("dt-theme") as "dark" | "light") || "dark";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("dt-theme", theme);
    } catch {
      /* noop */
    }
  }, [theme]);

  const notify = (msg: string, c = "var(--cyan)") => {
    setToast({ msg, c });
    window.setTimeout(() => setToast(null), 2700);
  };

  /* ---- pinned header: measure its real height so content never hides under it ---- */
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [headerH, setHeaderH] = useState(170);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const apply = () => {
      setHeaderH(el.offsetHeight);
      // expose the chrome height so toasts can sit directly below the run control
      document.documentElement.style.setProperty("--chrome-h", `${el.offsetHeight}px`);
    };
    apply();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(apply) : null;
    ro?.observe(el);
    window.addEventListener("resize", apply);
    const t = window.setTimeout(apply, 600);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", apply);
      window.clearTimeout(t);
    };
  }, []);

  // first-load welcome
  useEffect(() => {
    const t = window.setTimeout(() => notify("Dashboard synced · 8 markets streaming", "var(--green)"), 900);
    return () => clearTimeout(t);
  }, []);

  const loadBot = (b: Bot) => {
    setLoaded(b);
    setPicker(false);
    setSoon(null);
    setNav("botbuilder");
    notify(`${b.name} loaded into the Bot Builder`, b.a);
  };

  /* ---- dashboard card actions ---- */
  const onCard = (title: string) => {
    if (title === "LOAD BOT") {
      setPicker(true);
      return;
    }
    if (title === "PREMIUM BOTS") {
      notify("Premium AI Bots are being onboarded — showing the free set", "var(--gold)");
      setNav("free");
      return;
    }
    if (title === "SPEED BOT") {
      setSoon({
        title: "Speed Bot",
        blurb:
          "One-click automated trading is in build. It will arm a pre-tuned strategy and fire on the next qualifying tick — no configuration screen at all.",
      });
      return;
    }
    setSoon({
      title: "Manual Trading",
      blurb:
        "The full manual ticket is in build. You'll get barrier pads, strike timing and one-tap execution on any index, with your risk limits still enforced.",
    });
  };

  const browseBots = () => {
    setSoon(null);
    setNav("free");
  };

  const inChromeView =
    nav === "dashboard" || nav === "free" || nav === "botbuilder" || nav === "signal" || nav === "auto";



  return (
    <div className="relative min-h-screen" style={{ background: "var(--app-2)" }}>
      {/* cursor spotlight */}
      <CursorGlow />

      {/* ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="amb-grid-live absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(96,142,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(96,142,255,.045) 1px, transparent 1px)",
            backgroundSize: "58px 58px",
            maskImage: "radial-gradient(120% 80% at 50% 0%, #000 20%, transparent 75%)",
          }}
        />
        <div className="A-float absolute -left-40 top-10 h-[460px] w-[460px] rounded-full blur-[130px]" style={{ background: "rgba(47,123,255,.22)" }} />
        <div className="A-float absolute right-[-140px] top-1/4 h-[420px] w-[420px] rounded-full blur-[130px]" style={{ background: "rgba(139,92,246,.20)", animationDelay: "1.6s" }} />
        <div className="A-float absolute bottom-0 left-1/3 h-[360px] w-[360px] rounded-full blur-[130px]" style={{ background: "rgba(41,211,245,.14)", animationDelay: "3s" }} />
      </div>

      {/* pinned chrome — top bar, tab rail and ticker never move while scrolling */}
      <div ref={headerRef} className="fixed inset-x-0 top-0 z-40" style={{ background: "var(--chrome-bg)" }}>
        <TopBar theme={theme} onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} />
        <NavRail
          active={nav}
          setActive={setNav}
          order={tabOrder}
          onSaveOrder={saveTabOrder}
          onResetOrder={resetTabOrder}
          hotCount={hotMarkets.length}
          hotScanning={scanFeed.source !== "live" && scanFeed.total === 0}
          onOpenHot={() => setHotOpen(true)}
        />
        <TickerBar
          action={
            /* the run control is available on the two live-execution tabs */
            nav === "botbuilder" || nav === "signal" ? (
              <button
                className={`run-top${botRunning ? " on" : ""}`}
                onClick={toggleRun}
                title={
                  nav === "signal"
                    ? botRunning
                      ? "Disarm the signal engine"
                      : "Arm the signal engine"
                    : botRunning
                      ? "Stop the runner"
                      : "Run the loaded strategy"
                }
              >
                <i />
                {botRunning ? "Stop" : "Run"}
              </button>
            ) : null
          }
        />
      </div>

      <div className="relative" style={{ paddingTop: headerH }}>
        <main className="mx-auto max-w-[1600px] space-y-5 px-3 py-5 sm:px-5">
          {nav === "dashboard" && (
            <>
              <div className="A-up flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h1 className="text-[19px] font-extrabold tracking-tight sm:text-[22px]">Trading Workspace</h1>
                  <p className="mt-0.5 text-[12px]" style={{ color: "var(--muted)" }}>
                    Pick a tool to begin — bots, AI signals and manual execution in one place.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {loaded && (
                    <button
                      onClick={() => setNav("botbuilder")}
                      className="flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[11px] font-bold transition-transform hover:-translate-y-0.5"
                      style={{ borderColor: `color-mix(in srgb, ${loaded.a} 55%, transparent)`, color: loaded.a }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: loaded.a }} />
                      Loaded: {loaded.name}
                    </button>
                  )}
                  <div className="flex items-center gap-2.5 rounded-xl border px-2.5 py-1.5" style={{ borderColor: "var(--line)", background: "rgba(10,19,56,.6)" }}>
                    <LiveOrb size={20} />
                    <LiveText tone="#12c9a0" className="text-[11.5px] font-extrabold">
                      Connected to Deriv
                    </LiveText>
                  </div>
                </div>
              </div>

              <HotStrip hot={hotMarkets} scanning={scanFeed.source !== "live" && scanFeed.total === 0} onOpen={() => setHotOpen(true)} />

              <FeatureCards
                onPick={onCard}
                badges={{
                  "LOAD BOT": "Select a bot →",
                  "PREMIUM BOTS": "Free set live",
                  "SPEED BOT": "Coming soon",
                  "MANUAL TRADING": "Coming soon",
                }}
              />
              <SignalBoard />
              <TraderFeedback />
            </>
          )}

          {nav === "free" && <BotsGallery onLoad={loadBot} loadedId={loaded?.id ?? null} />}

          {nav === "botbuilder" && (
            <BotBuilderView bot={loaded} onPickBot={() => setPicker(true)} running={botRunning} onToggleRun={toggleRun} />
          )}

          {nav === "signal" && <SignalAI sharedFeed={scanFeed} running={botRunning} />}

          {nav === "auto" && <AutoTrader />}

          {!inChromeView && (
            <ComingSoonView
              label={VIEW_LABEL[nav] ?? "This section"}
              blurb={VIEW_BLURB[nav] ?? "This section is in build."}
              onBack={() => setNav("dashboard")}
              onBrowse={browseBots}
            />
          )}

          <footer className="pb-24 pt-2 text-center text-[10.5px]" style={{ color: "var(--faint)" }}>
            DigitTools · advanced digit trading tools — demo interface with simulated market data.
            {nav !== "dashboard" && " · only the Dashboard tab is fully themed"}
          </footer>
        </main>
      </div>

      {/* floats on every tab */}
      <AIOrb />
      <RiskDisclaimer />

      <BotPickerModal open={picker} onClose={() => setPicker(false)} onLoad={loadBot} loadedId={loaded?.id ?? null} />

      <HotMarketsPanel
        open={hotOpen}
        onClose={() => setHotOpen(false)}
        hot={hotMarkets}
        scanning={scanFeed.source !== "live" && scanFeed.total === 0}
        total={MARKETS.length}
        source={scanFeed.source}
        detail={scanFeed.detail}
        strict={hotStrict}
        onToggleStrict={() => setHotStrict((s) => !s)}
        onRefresh={scanFeed.retry}
        onOpenSignal={() => {
          setNav("signal");
          notify(`${hotMarkets.length} hot market${hotMarkets.length === 1 ? "" : "s"} flagged — opening Signal AI`, "#ff8a3d");
        }}
      />

      {soon && (
        <ComingSoonModal title={soon.title} blurb={soon.blurb} onClose={() => setSoon(null)} onBrowse={browseBots} />
      )}

      {toast && <Toast msg={toast.msg} c={toast.c} />}
    </div>
  );
}
