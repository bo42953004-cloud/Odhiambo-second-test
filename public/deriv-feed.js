/**
 * deriv-feed.js — drop-in Deriv digit-analysis engine + UI.
 * Zero dependencies. Works in any stack (Replit, Node templates, static HTML, Vue, React).
 *
 *   <script type="module">
 *     import { mountDigitAnalysis } from '/deriv-feed.js';
 *     mountDigitAnalysis(document.getElementById('app'), { symbol: 'R_100' });
 *   </script>
 *
 * Or use the engine only:
 *   import { DerivFeed } from '/deriv-feed.js';
 *   const feed = new DerivFeed({ symbol: 'R_100', onTick, onStatus, onStats });
 */

/* ------------------------------------------------------------------ markets */
export const GROUPS = [
  { key: "1HZ", title: "1-Second Indices ( 1HZ )", color: "#29d3f5" },
  { key: "R", title: "Standard Volatility ( R_ )", color: "#3b82f6" },
  { key: "JD", title: "Jump Indices ( JD )", color: "#8b5cf6" },
];

export const MARKETS = [
  { id: "1HZ10V", label: "Volatility 10 (1s)", group: "1HZ", pip: 2, base: 6543.21, sec: 1 },
  { id: "1HZ15V", label: "Volatility 15 (1s)", group: "1HZ", pip: 2, base: 1804.33, sec: 1 },
  { id: "1HZ25V", label: "Volatility 25 (1s)", group: "1HZ", pip: 2, base: 2371.88, sec: 1 },
  { id: "1HZ30V", label: "Volatility 30 (1s)", group: "1HZ", pip: 2, base: 1120.66, sec: 1 },
  { id: "1HZ50V", label: "Volatility 50 (1s)", group: "1HZ", pip: 2, base: 1845.52, sec: 1 },
  { id: "1HZ75V", label: "Volatility 75 (1s)", group: "1HZ", pip: 2, base: 9214.07, sec: 1 },
  { id: "1HZ90V", label: "Volatility 90 (1s)", group: "1HZ", pip: 2, base: 2774.19, sec: 1 },
  { id: "1HZ100V", label: "Volatility 100 (1s)", group: "1HZ", pip: 2, base: 1532.44, sec: 1 },
  { id: "1HZ150V", label: "Volatility 150 (1s)", group: "1HZ", pip: 2, base: 2064.15, sec: 1 },
  { id: "1HZ250V", label: "Volatility 250 (1s)", group: "1HZ", pip: 2, base: 6410.83, sec: 1 },
  { id: "R_10", label: "Volatility 10 Index", group: "R", pip: 2, base: 6543.21, sec: 2 },
  { id: "R_25", label: "Volatility 25 Index", group: "R", pip: 2, base: 2371.88, sec: 2 },
  { id: "R_50", label: "Volatility 50 Index", group: "R", pip: 2, base: 1845.52, sec: 2 },
  { id: "R_75", label: "Volatility 75 Index", group: "R", pip: 2, base: 9214.07, sec: 2 },
  { id: "R_100", label: "Volatility 100 Index", group: "R", pip: 2, base: 1532.44, sec: 2 },
  { id: "JD10", label: "Jump 10 Index", group: "JD", pip: 2, base: 7021.53, sec: 2 },
  { id: "JD25", label: "Jump 25 Index", group: "JD", pip: 2, base: 3104.86, sec: 2 },
  { id: "JD50", label: "Jump 50 Index", group: "JD", pip: 2, base: 2412.77, sec: 2 },
  { id: "JD75", label: "Jump 75 Index", group: "JD", pip: 2, base: 10654.32, sec: 2 },
  { id: "JD100", label: "Jump 100 Index", group: "JD", pip: 2, base: 1820.64, sec: 2 },
];

export const marketById = (id) =>
  MARKETS.find((m) => m.id === id) ||
  MARKETS.find((m) => m.id === "R_100") ||
  MARKETS[0];

/** Endpoints tried in order until one delivers ticks. */
export const ENDPOINTS = [
  "wss://ws.derivws.com/websockets/v3?app_id=1089&l=EN",
  "wss://ws.binaryws.com/websockets/v3?app_id=1089&l=EN",
  "wss://api.derivws.com/trading/v1/options/ws/public",
];

export const MAX_TICKS = 1000; // rolling window — 1000 ticks for statistically sound digits

/** Accurate digit extraction using the instrument's pip size. */
export function toDigit(quote, pip) {
  const scaled = Math.round(quote * Math.pow(10, pip));
  return ((scaled % 10) + 10) % 10;
}

/* ------------------------------------------------------------------ stats */
export function computeStats(digits, opts = {}) {
  const barrier = opts.barrier == null ? 5 : opts.barrier;
  const sample = opts.sample == null ? MAX_TICKS : opts.sample;
  const used = sample === "all" || sample >= digits.length ? digits : digits.slice(-sample);
  const n = used.length;
  const counts = Array.from({ length: 10 }, () => 0);
  for (const d of used) counts[d] += 1;

  const per = counts.map((c, d) => ({ d, c, p: n ? (c / n) * 100 : 0 }));
  let hot = per[0];
  let cold = per[0];
  for (const x of per) {
    if (x.c > hot.c) hot = x;
    if (x.c < cold.c) cold = x;
  }

  const evenCount = counts.filter((_, d) => d % 2 === 0).reduce((a, b) => a + b, 0);
  const oddCount = n - evenCount;
  const overCount = used.filter((d) => d > barrier).length;
  const underCount = used.filter((d) => d < barrier).length;
  const exactCount = counts[barrier] || 0;

  // parity streak from the live tail
  let streakLabel = "–";
  let streakLen = 0;
  if (digits.length) {
    const lastEven = digits[digits.length - 1] % 2 === 0;
    for (let i = digits.length - 1; i >= 0; i--) {
      if ((digits[i] % 2 === 0) === lastEven) streakLen++;
      else break;
    }
    streakLabel = `${streakLen} × ${lastEven ? "EVEN" : "ODD"}`;
  }

  return {
    n, barrier, counts, per, hot, cold, live: n ? used[n - 1] : null, used,
    even: { c: evenCount, p: n ? (evenCount / n) * 100 : 0 },
    odd: { c: oddCount, p: n ? (oddCount / n) * 100 : 0 },
    over: { c: overCount, p: n ? (overCount / n) * 100 : 0 },
    under: { c: underCount, p: n ? (underCount / n) * 100 : 0 },
    exact: { c: exactCount, p: n ? (exactCount / n) * 100 : 0 },
    hotGap: gapSince(digits, hot.d),
    coldGap: gapSince(digits, cold.d),
    streakLabel, streakLen,
  };
}

export function gapSince(digits, digit) {
  for (let i = digits.length - 1, k = 0; i >= 0; i--, k++) if (digits[i] === digit) return k;
  return -1;
}

/* ------------------------------------------------------------------ engine */
export class DerivFeed {
  constructor(opts = {}) {
    this.maxTicks = opts.maxTicks || MAX_TICKS;
    this.pip = 2;
    this.buf = [];
    this.seen = new Set();
    this.simOn = false;
    this.sawTick = false;
    this.ep = 0;
    this.fails = 0;
    this.stopped = false;
    this.ws = null;
    this.timers = {};
    this.destroyed = false;
    this.market = marketById(opts.symbol || "R_100");
    this.onTick = opts.onTick || (() => {});
    this.onStatus = opts.onStatus || (() => {});
    this.onStats = opts.onStats || (() => {});
    this.select(this.market.id);
  }

  /* public ---------------------------------------------------------------- */
  select(symbol) {
    this.market = marketById(symbol);
    this.stopSocket();
    this.buf = [];
    this.seen.clear();
    this.simOn = false;
    this.sawTick = false;
    this.ep = 0;
    this.fails = 0;
    this.pip = this.market.pip;
    this.status("connecting", "Opening secure connection to Deriv…", 0);
    this.open();
  }

  retry() {
    this.select(this.market.id);
  }

  destroy() {
    this.destroyed = true;
    this.stopSocket();
  }

  get digits() {
    return this.buf.slice();
  }

  /* internals ------------------------------------------------------------ */
  stopSocket() {
    Object.keys(this.timers).forEach((k) => {
      clearTimeout(this.timers[k]);
      clearInterval(this.timers[k]);
      delete this.timers[k];
    });
    try {
      if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify({ forget_all: "ticks" }));
      if (this.ws) this.ws.close();
    } catch (e) { /* noop */ }
    this.ws = null;
  }

  status(source, detail, attempts) {
    this.onStatus({ source, detail, attempts: attempts == null ? this.fails + 1 : attempts });
  }

  emit(commit) {
    this.onStats(computeStats(this.buf, { sample: this.sampleSize || MAX_TICKS, barrier: this.barrier }));
    if (commit) this.onTick(this.buf[this.buf.length - 1], this.price, this.buf.length);
  }

  push(digit, price) {
    this.buf.push(digit);
    if (this.buf.length > this.maxTicks) this.buf.shift();
    this.price = price;
    this.emit(true);
  }

  startSim(reason) {
    if (this.stopped || this.sawTick || this.simOn) return;
    this.simOn = true;
    this.buf = [];
    let p = this.market.base;
    const vol = 0.0007 + this.market.base / 4000000;
    // seed a full window of history so percentages are meaningful immediately
    const seed = [];
    for (let i = 0; i < this.maxTicks; i++) {
      p = Math.max(1, p * (1 + (Math.random() - 0.5) * vol));
      seed.push(toDigit(p, this.market.pip));
    }
    this.buf = seed.slice(-this.maxTicks);
    this.price = p;
    this.emit(true);
    this.status("sim", reason, this.fails + 1);
    this.timers.sim = setInterval(() => {
      p = Math.max(1, p * (1 + (Math.random() - 0.5) * vol));
      this.push(toDigit(p, this.market.pip), p);
    }, this.market.sec * 1000);
  }

  open() {
    if (this.stopped || this.destroyed || this.sawTick) return;
    if (typeof WebSocket === "undefined") {
      this.startSim("No WebSocket support in this context — simulated ticks");
      return;
    }
    const url = ENDPOINTS[this.ep % ENDPOINTS.length];
    const name = url.split("//")[1].split("/")[0] + (url.includes("public") ? "/public" : "/v3");
    this.status("connecting", `Connecting to ${name}… (attempt ${this.fails + 1})`, this.fails + 1);

    try {
      this.ws = new WebSocket(url);
    } catch (err) {
      this.fails++;
      this.ep++;
      this.status("connecting", `Blocked: ${err && err.message ? err.message : err}`, this.fails + 1);
      this.timers.retry = setTimeout(() => this.open(), 900);
      return;
    }

    this.ws.onopen = () => {
      if (this.stopped || this.destroyed || !this.ws) return;
      this.status("connecting", `Connected — subscribing to ${this.market.id}…`, this.fails + 1);
      try {
        this.ws.send(JSON.stringify({ ticks: this.market.id, subscribe: 1 }));
        this.ws.send(JSON.stringify({ ticks_history: this.market.id, end: "latest", count: this.maxTicks, style: "ticks" }));
        this.ws.send(JSON.stringify({ ping: 1 }));
      } catch (e) { /* noop */ }
      this.timers.keep = setInterval(() => {
        try {
          if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify({ ping: 1 }));
        } catch (e) { /* noop */ }
      }, 20000);
    };

    this.ws.onmessage = (ev) => {
      if (this.stopped || this.destroyed) return;
      let d;
      try { d = JSON.parse(ev.data); } catch (e) { return; }

      if (d.error) {
        const msg = (d.error && d.error.message) || "Request rejected";
        this.status(this.sawTick ? "live" : "connecting", `Deriv replied: ${msg}`, this.fails + 1);
        if (!this.sawTick) {
          this.fails++;
          this.ep++;
          clearInterval(this.timers.keep);
          if (this.fails >= ENDPOINTS.length) this.startSim(`All endpoints failed — last error: ${msg}`);
          else this.timers.retry = setTimeout(() => this.open(), 700);
        }
        return;
      }

      if (d.msg_type === "tick" && d.tick && d.tick.quote != null) {
        // dedupe on epoch+quote — tick.id is the SYMBOL, so it repeats every tick
        const key = `${d.tick.epoch == null ? "?" : d.tick.epoch}-${d.tick.quote}`;
        if (this.seen.has(key)) return;
        this.seen.add(key);
        if (this.seen.size > 4000) this.seen.clear();

        if (!this.sawTick) {
          this.sawTick = true;
          clearInterval(this.timers.sim);
          clearTimeout(this.timers.deadline);
          this.timers.sim = undefined;
          if (this.simOn) { this.simOn = false; this.buf = []; }
          this.fails = 0;
          this.status("live", `Streaming live ${this.market.id} ticks`);
        }
        if (typeof d.tick.pip_size === "number") this.pip = d.tick.pip_size;
        this.push(toDigit(d.tick.quote, this.pip), d.tick.quote);
        return;
      }

      if (d.msg_type === "history" && d.history && d.history.prices && d.history.prices.length) {
        if (this.simOn) { clearInterval(this.timers.sim); this.simOn = false; }
        const hist = d.history.prices.slice(-this.maxTicks).map((q) => toDigit(q, this.pip));
        this.buf = hist.slice();
        this.price = d.history.prices[d.history.prices.length - 1];
        this.status("live", `Loaded ${hist.length} historic ticks`);
        this.emit(false);
      }
    };

    this.ws.onerror = () => {
      if (!this.sawTick) this.status("connecting", `${name} unreachable — trying the next endpoint…`, this.fails + 1);
    };

    this.ws.onclose = (e) => {
      if (this.stopped || this.destroyed) return;
      clearInterval(this.timers.keep);
      if (this.sawTick) {
        this.sawTick = false;
        this.status("connecting", `Stream dropped (${e.code || "network"}) — reconnecting…`, this.fails + 1);
        this.timers.retry = setTimeout(() => this.open(), 1200);
        return;
      }
      this.fails++;
      this.ep++;
      if (this.fails >= ENDPOINTS.length) {
        this.startSim(
          `Deriv is unreachable from this context (${e.code || "blocked"}). ` +
          `Your code is fine — the browser/network is refusing the wss:// socket.`
        );
      } else {
        this.status("connecting", `${name} closed (${e.code || "blocked"}) — trying the next endpoint…`, this.fails + 1);
        this.timers.retry = setTimeout(() => this.open(), 900);
      }
    };

    this.timers.deadline = setTimeout(() => {
      if (!this.sawTick && !this.stopped) {
        this.startSim("No response from Deriv within 15s — simulated ticks (tap Retry to try live again)");
      }
    }, 15000);
  }
}

/* ------------------------------------------------------------------ styles */
const CSS = `
.dta{--c:#29d3f5;--g:#12c9a0;--r:#ef3b4a;--y:#ffd400;--mut:#8ba0cf;--faint:#5c6f9c;
  --line:rgba(96,142,255,.16);--line2:rgba(96,142,255,.34);color:#fff;
  font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:linear-gradient(180deg,#0a1338,#050b22);
  border:1px solid var(--line2);border-radius:18px;overflow:hidden;box-shadow:0 40px 90px -40px #000}
.dta *{box-sizing:border-box}
.dta-hdr{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--line)}
.dta-ai{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;font-weight:900;font-size:13px;
  background:linear-gradient(150deg,#c084fc,#7c3aed 60%,#4c1d95);box-shadow:0 0 26px -6px #8b5cf6}
.dta-h h2{margin:0;font-size:17px;font-weight:800;letter-spacing:-.01em}
.dta-pill{display:inline-flex;align-items:center;gap:6px;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:900}
.dta-dot{width:6px;height:6px;border-radius:9px;background:currentColor;animation:dta-blink 1.8s infinite}
.dta-sel{margin-left:auto;background:rgba(10,19,56,.9);color:#fff;border:1px solid var(--line2);border-radius:10px;
  padding:9px 10px;font-size:12.5px;font-weight:700;min-width:210px}
.dta-bar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:11px 16px;border-bottom:1px solid var(--line);background:rgba(8,16,44,.6)}
.dta-tabs{display:flex;gap:4px;background:rgba(255,255,255,.05);border-radius:11px;padding:4px}
.dta-tab{border:0;background:transparent;color:var(--mut);font-weight:800;font-size:12px;padding:7px 14px;border-radius:8px;cursor:pointer;transition:.3s}
.dta-tab.on{background:linear-gradient(135deg,var(--c),#134b96);color:#04091f}
.dta-tab.on.ou{background:linear-gradient(135deg,#8b5cf6,#4c1d95);color:#fff}
.dta-chip{border:1px solid var(--line);background:transparent;color:var(--mut);border-radius:8px;padding:6px 10px;
  font-size:11px;font-weight:800;cursor:pointer;transition:.25s}
.dta-chip:hover{transform:translateY(-2px)}
.dta-chip.on{border-color:var(--c);color:var(--c);background:rgba(41,211,245,.12)}
.dta-body{display:grid;grid-template-columns:1fr;gap:14px;padding:16px}
@media(min-width:1000px){.dta-body{grid-template-columns:1.6fr 1fr}}
.dta-card{border:1px solid var(--line);border-radius:14px;background:linear-gradient(180deg,#081130,#050b22);padding:14px}
.dta-card h3{margin:0 0 2px;font-size:14px;font-weight:800}
.dta-dist{display:flex;align-items:flex-end;gap:6px;margin-top:22px;position:relative}
.dta-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;position:relative}
.dta-pct{font-size:10px;font-weight:800;font-variant-numeric:tabular-nums;color:var(--mut)}
.dta-slot{position:relative;width:100%;height:160px;border-radius:8px;background:rgba(255,255,255,.045);
  display:flex;align-items:flex-end;overflow:hidden}
.dta-fill{width:100%;border-radius:8px;transition:height .3s ease-out,box-shadow .3s,outline .3s}
.dta-fill.hot{background:linear-gradient(180deg,#12c9a0,rgba(18,201,160,.2));box-shadow:0 0 22px #12c9a0}
.dta-fill.cold{background:linear-gradient(180deg,#ef3b4a,rgba(239,59,74,.2));box-shadow:0 0 22px #ef3b4a}
.dta-fill.mid{background:linear-gradient(180deg,#2f6bff,rgba(47,107,255,.18))}
.dta-fill.live{outline:1px solid var(--y);box-shadow:0 0 24px var(--y),0 0 40px rgba(255,212,0,.55)}
.dta-cap{position:absolute;inset:0 0 auto;height:3px;background:var(--y);border-radius:9px;box-shadow:0 0 14px var(--y)}
.dta-ptr{position:absolute;top:-24px;left:50%;transform:translateX(-50%);color:var(--y);font-size:14px;
  filter:drop-shadow(0 0 10px var(--y));animation:dta-pop .26s cubic-bezier(.22,1,.36,1)}
.dta-beam{position:absolute;top:-22px;bottom:0;left:50%;width:2px;transform:translateX(-50%);border-radius:9px;
  background:linear-gradient(180deg,transparent,var(--y));box-shadow:0 0 16px var(--y)}
.dta-dchip{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;font-weight:900;font-size:13px;
  background:rgba(255,255,255,.06);color:#cfdcff;font-variant-numeric:tabular-nums}
.dta-dchip.hot{background:rgba(18,201,160,.22);color:#12c9a0}
.dta-dchip.cold{background:rgba(239,59,74,.22);color:#ef3b4a}
.dta-dchip.live{background:var(--y);color:#1a1400;box-shadow:0 0 0 3px rgba(255,212,0,.25)}
.dta-tag{font-size:8.5px;font-weight:900;text-transform:uppercase;padding:2px 6px;border-radius:5px}
.dta-cnt{font-size:9.5px;color:var(--faint);font-variant-numeric:tabular-nums}
.dta-tape{display:flex;gap:6px;overflow:hidden;margin-top:4px}
.dta-tchip{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;font-size:11px;font-weight:800;flex:0 0 auto}
.dta-big{width:74px;height:74px;border-radius:16px;display:grid;place-items:center;font-size:34px;font-weight:900;
  background:linear-gradient(150deg,rgba(255,212,0,.2),rgba(255,212,0,.05));border:1px solid rgba(255,212,0,.45);
  color:var(--y);box-shadow:0 0 30px -8px var(--y);font-variant-numeric:tabular-nums}
.dta-row{display:flex;justify-content:space-between;align-items:flex-end;margin-top:12px;font-size:12.5px;font-weight:800}
.dta-track{height:10px;border-radius:9px;background:rgba(255,255,255,.07);overflow:hidden;margin-top:6px}
.dta-track > i{display:block;height:100%;border-radius:9px;transition:width .3s ease-out}
.dta-grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.dta-sum{border-radius:14px;padding:13px;border:1px solid}
.dta-sum .k{font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.04em}
.dta-sum .v{font-size:30px;font-weight:900;line-height:1;margin-top:8px;font-variant-numeric:tabular-nums}
.dta-sum .s{font-size:9.5px;color:var(--faint);margin-top:8px;font-variant-numeric:tabular-nums}
.dta-btag{display:inline-block;font-size:8.5px;font-weight:900;padding:2px 6px;border-radius:5px;color:#04091f}
.dta-note{font-size:10.5px;line-height:1.6;color:var(--faint);margin:0}
.dta-ins{border:1px solid rgba(41,211,245,.28);background:rgba(41,211,245,.06);border-radius:12px;padding:10px;
  font-size:11px;line-height:1.6;color:#cfdcff;margin-top:8px;display:flex;gap:8px}
.dta-ins i{width:6px;height:6px;border-radius:9px;background:var(--c);box-shadow:0 0 8px var(--c);margin-top:7px;flex:0 0 auto}
.dta-warn{border:1px solid rgba(245,183,49,.4);background:rgba(245,183,49,.07);border-radius:12px;padding:12px}
.dta-btn{width:100%;margin-top:10px;border:0;border-radius:11px;padding:11px;font-weight:900;font-size:12px;cursor:pointer;
  background:linear-gradient(90deg,#29d3f5,#12c9a0);color:#001a17;transition:transform .25s}
.dta-btn:hover{transform:translateY(-2px)}
.dta-mon{font-variant-numeric:tabular-nums}
.bottom{margin-left:auto}
@keyframes dta-blink{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes dta-pop{0%{transform:translateX(-50%) scale(1.42);opacity:.5}60%{transform:translateX(-50%) scale(.96)}100%{transform:translateX(-50%) scale(1);opacity:1}}
@keyframes dta-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.dta-an{animation:dta-up .5s cubic-bezier(.22,1,.36,1) both}
`;

let cssInjected = false;
function injectCSS() {
  if (cssInjected) return;
  cssInjected = true;
  const s = document.createElement("style");
  s.id = "deriv-feed-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ------------------------------------------------------------------ UI */
const h = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);

/**
 * Mounts the full digit-analysis panel into `root`.
 * @param {HTMLElement} root
 * @param {{symbol?:string}} opts
 * @returns {{destroy:()=>void, feed:DerivFeed}}
 */
export function mountDigitAnalysis(root, opts = {}) {
  injectCSS();
  root.innerHTML = `
  <div class="dta">
    <div class="dta-hdr">
      <div class="dta-ai">AI</div>
      <div>
        <h2 class="dta-h">Deriv Digit Analysis</h2>
        <div style="display:flex;gap:8px;align-items:center;margin-top:4px;flex-wrap:wrap">
          <span class="dta-pill" id="dtaStatus" style="background:rgba(41,211,245,.16);color:#29d3f5">
            <i class="dta-dot"></i><span id="dtaStatusText">Connecting…</span>
          </span>
          <span class="dta-mon" id="dtaMeta" style="font-size:10.5px;color:#5c6f9c"></span>
        </div>
      </div>
      <select class="dta-sel" id="dtaMarket" aria-label="Market">
        ${GROUPS.map((g) => `<optgroup label="${h(g.title)}">
          ${MARKETS.filter((m) => m.group === g.key).map((m) => `<option value="${h(m.id)}">${h(m.id)} — ${h(m.label)}</option>`).join("")}
        </optgroup>`).join("")}
      </select>
    </div>

    <div class="dta-bar">
      <div class="dta-tabs">
        <button class="dta-tab on" data-mode="EO">Even / Odd</button>
        <button class="dta-tab" data-mode="OU">Over / Under</button>
      </div>
      <span style="font-size:10px;font-weight:800;color:#5c6f9c">SAMPLE</span>
      <button class="dta-chip" data-sample="100">100</button>
      <button class="dta-chip" data-sample="250">250</button>
      <button class="dta-chip" data-sample="500">500</button>
      <button class="dta-chip on" data-sample="1000">1000</button>
      <button class="dta-chip" data-sample="all">All</button>
      <span class="dta-mon bottom" id="dtaN" style="font-size:10.5px;color:#5c6f9c"></span>
    </div>

    <div class="dta-body">
      <div style="display:flex;flex-direction:column;gap:14px">
        <section class="dta-card">
          <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
            <h3>Digit Distribution (0 – 9)</h3>
            <div style="display:flex;gap:12px;font-size:10px">
              <span style="color:#12c9a0">■ most appearing</span>
              <span style="color:#ef3b4a">■ least appearing</span>
              <span style="color:#ffd400">▼ live tick</span>
            </div>
          </div>
          <div class="dta-dist" id="dtaDist"></div>
        </section>

        <section class="dta-card">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <h3 style="margin:0">Live Tick Pointer</h3>
            <span class="dta-pill" style="background:rgba(255,212,0,.14);color:#ffd400"><i class="dta-dot"></i>POINTER ACTIVE</span>
            <span class="dta-mon bottom" style="font-size:12px;color:#dbe7ff" id="dtaPrice">—</span>
          </div>
          <div style="display:flex;gap:12px;align-items:center;margin-top:12px;flex-wrap:wrap">
            <span class="dta-big" id="dtaBig">–</span>
            <div style="flex:1;min-width:240px">
              <div class="dta-tape" id="dtaTape"></div>
              <div class="dta-mon" style="margin-top:8px;font-size:10px;color:#5c6f9c" id="dtaTail"></div>
            </div>
          </div>
        </section>
      </div>

      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="dta-grid2">
          <div class="dta-sum" id="dtaHot" style="border-color:rgba(18,201,160,.45);background:rgba(18,201,160,.08)">
            <span class="k" style="color:#12c9a0">Most appearing</span>
            <div class="v" style="color:#12c9a0" id="dtaHotV">–</div>
            <div class="s" id="dtaHotS"></div>
          </div>
          <div class="dta-sum" id="dtaCold" style="border-color:rgba(239,59,74,.45);background:rgba(239,59,74,.08)">
            <span class="k" style="color:#ef3b4a">Least appearing</span>
            <div class="v" style="color:#ef3b4a" id="dtaColdV">–</div>
            <div class="s" id="dtaColdS"></div>
          </div>
        </div>

        <section class="dta-card" id="dtaMode"></section>
        <section class="dta-card" id="dtaIns"></section>
        <div id="dtaWarn"></div>
        <p class="dta-note">Digits are derived from each closed tick using the instrument's pip size.
          Percentages cover the selected sample. The engine keeps a rolling ${MAX_TICKS}-tick window.</p>
      </div>
    </div>
  </div>`;

  const state = { mode: "EO", barrier: 5, sample: 1000 };
  const el = (id) => root.querySelector(id);
  const feed = new DerivFeed({
    symbol: opts.symbol || "R_100",
    onStatus: (s) => {
      const colors = { live: "#12c9a0", sim: "#f5b731", connecting: "#29d3f5" };
      const c = colors[s.source] || colors.connecting;
      const pill = el("#dtaStatus");
      pill.style.background = `color-mix(in srgb, ${c} 16%, transparent)`;
      pill.style.color = c;
      el("#dtaStatusText").textContent =
        s.source === "live" ? "LIVE · Deriv feed" : s.source === "sim" ? "OFFLINE · not connected" : s.detail.split("—")[0].trim();
      el("#dtaWarn").innerHTML =
        s.source === "live"
          ? `<div class="dta-ins" style="border-color:rgba(18,201,160,.4);background:rgba(18,201,160,.08);color:#12c9a0">
               ✓ ${h(s.detail)}</div>`
          : `<div class="dta-warn">
               <div style="display:flex;gap:8px;align-items:center">
                 <i class="dta-dot" style="color:#f5b731"></i>
                 <strong style="font-size:11px;text-transform:uppercase;color:#f5b731">${s.source === "sim" ? "Deriv feed offline" : "Connecting to Deriv"}</strong>
                 <span class="dta-mon bottom" style="font-size:9.5px;color:#5c6f9c">attempt ${s.attempts}</span>
               </div>
               <p class="dta-note" style="color:#cfdcff;margin-top:8px">${h(s.detail)}</p>
               <button class="dta-btn" id="dtaRetry">↻ ${s.source === "sim" ? "Retry live connection" : "Force retry now"}</button>
             </div>`;
      const r = el("#dtaRetry");
      if (r) r.onclick = () => feed.retry();
    },
    onStats: (st) => render(st),
  });

  feed.sampleSize = 1000;
  feed.barrier = 5;

  function render(st) {
    const mode = state.mode;
    const live = st.live;
    el("#dtaMeta").textContent = `${feed.market.id} · ${feed.digits.length} ticks · buffer ${feed.digits.length}/${MAX_TICKS}`;
    el("#dtaN").textContent = `n = ${st.n} ticks · baseline 10.0% / digit`;
    el("#dtaPrice").textContent = feed.price != null ? feed.price.toFixed(feed.market.pip) : "—";

    // distribution
    const maxP = Math.max.apply(null, st.per.map((x) => x.p)) || 1;
    el("#dtaDist").innerHTML = st.per.map((x) => {
      const isLive = live === x.d;
      const cls = isLive ? "live" : x.d === st.hot.d ? "hot" : x.d === st.cold.d ? "cold" : "mid";
      const tagBg = mode === "EO"
        ? (x.d % 2 === 0 ? "background:rgba(41,211,245,.16);color:#29d3f5" : "background:rgba(245,183,49,.16);color:#f5b731")
        : (x.d > state.barrier ? "background:rgba(139,92,246,.18);color:#b79bfb"
          : x.d < state.barrier ? "background:rgba(236,72,153,.18);color:#f9a8d4"
          : "background:rgba(18,201,160,.18);color:#12c9a0");
      const tagTxt = mode === "EO" ? (x.d % 2 === 0 ? "even" : "odd")
        : x.d > state.barrier ? "over" : x.d < state.barrier ? "under" : "exact";
      const pctColor = x.d === st.hot.d ? "#12c9a0" : x.d === st.cold.d ? "#ef3b4a" : "#8ba0cf";
      return `<div class="dta-col dta-an">
        ${isLive ? '<div class="dta-ptr">▼</div><div class="dta-beam"></div>' : ""}
        <span class="dta-pct" style="color:${pctColor}">${x.p.toFixed(1)}%</span>
        <div class="dta-slot">
          <div class="dta-fill ${cls}" style="height:${Math.max(4, (x.p / maxP) * 100)}%">${isLive ? '<span class="dta-cap"></span>' : ""}</div>
        </div>
        <span class="dta-dchip ${isLive ? "live" : x.d === st.hot.d ? "hot" : x.d === st.cold.d ? "cold" : ""}">${x.d}</span>
        <span class="dta-tag" style="${tagBg}">${tagTxt}</span>
        <span class="dta-cnt">${x.c}</span>
      </div>`;
    }).join("");

    // live pointer block
    el("#dtaBig").textContent = live == null ? "–" : live;
    const dt = feed.digits.slice(-46);
    el("#dtaTape").innerHTML = dt.map((d, i) => {
      const newest = i === dt.length - 1;
      let bg, fg;
      if (newest) { bg = "var(--y)"; fg = "#1a1400"; }
      else if (mode === "EO") { bg = d % 2 === 0 ? "rgba(41,211,245,.16)" : "rgba(245,183,49,.16)"; fg = d % 2 === 0 ? "#29d3f5" : "#f5b731"; }
      else { bg = d > state.barrier ? "rgba(139,92,246,.18)" : d < state.barrier ? "rgba(236,72,153,.18)" : "rgba(18,201,160,.18)";
             fg = d > state.barrier ? "#b79bfb" : d < state.barrier ? "#f9a8d4" : "#12c9a0"; }
      return `<span class="dta-tchip" style="background:${bg};color:${fg};${newest ? "transform:scale(1.18);box-shadow:0 0 16px var(--y)" : ""}">${d}</span>`;
    }).join("");
    const tail = feed.digits.length >= MAX_TICKS
      ? `<span style="color:#12c9a0">full ${MAX_TICKS}-tick window</span>`
      : `<span style="color:#f5b731">collecting ${feed.digits.length}/${MAX_TICKS}…</span>`;
    el("#dtaTail").innerHTML = `← oldest · newest on the right → · tick #${feed.digits.length} · ${tail}`;

    // summaries
    el("#dtaHotV").innerHTML = `${h(String(st.hot.d))} <span style="font-size:14px">${st.hot.p.toFixed(1)}%</span>`;
    el("#dtaHotS").innerHTML = `<span class="dta-btag" style="background:#12c9a0">HOT</span> ${st.hotGap} ticks ago`;
    el("#dtaColdV").innerHTML = `${h(String(st.cold.d))} <span style="font-size:14px">${st.cold.p.toFixed(1)}%</span>`;
    el("#dtaColdS").innerHTML = `<span class="dta-btag" style="background:#ef3b4a">COLD</span> ${st.coldGap} ticks ago`;

    // mode panel
    if (mode === "EO") {
      const lead = st.even.c >= st.odd.c ? "EVEN LEADS" : "ODD LEADS";
      const row = (k, v, c, extra) => `<div>
        <div class="dta-row"><span style="color:${c}">${k}${extra || ""}</span>
          <span class="dta-mon" style="color:${c}">${v.p.toFixed(1)}% <span style="font-size:10.5px;color:#5c6f9c">${v.c} ticks</span></span></div>
        <div class="dta-track"><i style="width:${v.p}%;background:linear-gradient(90deg,${c},${c}66);box-shadow:0 0 14px ${c}"></i></div></div>`;
      el("#dtaMode").innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center">
          <h3>Even / Odd Data</h3>
          <span class="dta-tag" style="background:rgba(41,211,245,.14);color:#29d3f5">${lead}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:14px;margin-top:14px">
          ${row("Even", st.even, "#29d3f5", st.even.c >= st.odd.c ? ' <span class="dta-btag" style="background:#12c9a0">LEADING</span>' : "")}
          ${row("Odd", st.odd, "#f5b731", st.odd.c > st.even.c ? ' <span class="dta-btag" style="background:#12c9a0">LEADING</span>' : "")}
        </div>
        <div style="margin-top:14px;display:flex;flex-wrap:wrap;gap:6px">
          ${[0, 2, 4, 6, 8].map((d) => `<span class="dta-cnt" style="border:1px solid var(--line);border-radius:7px;padding:3px 7px;font-weight:700;color:${d === st.hot.d ? "#12c9a0" : d === st.cold.d ? "#ef3b4a" : "#8ba0cf"}">${d} · ${st.counts[d]}</span>`).join("")}
          ${[1, 3, 5, 7, 9].map((d) => `<span class="dta-cnt" style="border:1px solid var(--line);border-radius:7px;padding:3px 7px;font-weight:700;color:${d === st.hot.d ? "#12c9a0" : d === st.cold.d ? "#ef3b4a" : "#8ba0cf"}">${d} · ${st.counts[d]}</span>`).join("")}
        </div>
        <div style="margin-top:14px;border:1px solid var(--line);border-radius:11px;padding:11px;display:flex;justify-content:space-between;font-size:11px">
          <span style="color:#8ba0cf">Current parity streak</span>
          <span class="dta-mon" style="font-weight:900;color:#29d3f5">${st.streakLabel}</span>
        </div>`;
    } else {
      const row = (k, v, c, hint) => `<div>
        <div class="dta-row"><span style="color:${c}">${k} <span style="font-size:9.5px;font-weight:600;color:#5c6f9c">${hint}</span></span>
          <span class="dta-mon" style="color:${c}">${v.p.toFixed(1)}% <span style="font-size:10.5px;color:#5c6f9c">${v.c} ticks</span></span></div>
        <div class="dta-track"><i style="width:${v.p}%;background:linear-gradient(90deg,${c},${c}66);box-shadow:0 0 14px ${c}"></i></div></div>`;
      el("#dtaMode").innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
          <h3>Over / Under Data</h3>
          <span style="font-size:10.5px;color:#5c6f9c">tap your barrier digit</span>
        </div>
        <div style="display:flex;gap:5px;margin-top:12px">
          ${Array.from({ length: 10 }, (_, d) => `<button class="dta-chip ${state.barrier === d ? "on" : ""}" data-barrier="${d}"
             style="flex:1;padding:8px 0;${state.barrier === d ? "background:linear-gradient(135deg,#8b5cf6,#4c1d95);color:#fff;border-color:#8b5cf6" : ""}">${d}</button>`).join("")}
        </div>
        <div style="display:flex;flex-direction:column;gap:14px;margin-top:14px">
          ${row(`Over ${state.barrier}`, st.over, "#8b5cf6", `digits ${state.barrier + 1}–9`)}
          ${row(`Under ${state.barrier}`, st.under, "#ec4899", `digits 0–${Math.max(0, state.barrier - 1)}`)}
          ${row(`Exact ${state.barrier}`, st.exact, "#12c9a0", "matches / differs")}
        </div>`;
    }

    // AI read-out
    const diff = Math.abs(st.even.p - st.odd.p);
    const lead = st.even.c >= st.odd.c ? "EVEN" : "ODD";
    const lines = [
      diff >= 3
        ? `${lead} dominates the sample at ${Math.max(st.even.p, st.odd.p).toFixed(1)}% — a ${diff.toFixed(1)}pp edge.`
        : `Even/Odd is balanced within ${diff.toFixed(1)}pp — no parity edge in this window.`,
      `Digit ${st.hot.d} is hot at ${st.hot.p.toFixed(1)}% (${st.hot.p - 10 >= 0 ? "+" : ""}${(st.hot.p - 10).toFixed(1)}pp vs baseline), last seen ${st.hotGap} ticks ago.`,
      `Digit ${st.cold.d} is coldest at ${st.cold.p.toFixed(1)}%, last seen ${st.coldGap} ticks ago.`,
      state.mode === "EO"
        ? `Live streak: ${st.streakLabel}.`
        : `Over ${state.barrier} covers ${st.over.p.toFixed(1)}%, under ${st.under.p.toFixed(1)}%, exact ${st.exact.p.toFixed(1)}%.`,
    ];
    el("#dtaIns").innerHTML = `<h3>AI Read-out</h3>
      ${lines.map((t) => `<div class="dta-ins"><i></i><span>${h(t)}</span></div>`).join("")}`;
  }

  /* interactions */
  const sel = el("#dtaMarket");
  sel.value = feed.market.id;
  sel.onchange = () => feed.select(sel.value);

  root.querySelectorAll("[data-mode]").forEach((b) => {
    b.onclick = () => {
      state.mode = b.dataset.mode;
      root.querySelectorAll("[data-mode]").forEach((x) => {
        x.classList.toggle("on", x === b);
        x.classList.toggle("ou", x === b && state.mode === "OU");
      });
      render(computeStats(feed.digits, { sample: state.sample, barrier: state.barrier }));
    };
  });

  root.querySelectorAll("[data-sample]").forEach((b) => {
    b.onclick = () => {
      const v = b.dataset.sample;
      state.sample = v === "all" ? "all" : Number(v);
      feed.sampleSize = state.sample;
      root.querySelectorAll("[data-sample]").forEach((x) => x.classList.toggle("on", x === b));
      render(computeStats(feed.digits, { sample: state.sample, barrier: state.barrier }));
    };
  });

  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-barrier]");
    if (!b) return;
    state.barrier = Number(b.dataset.barrier);
    feed.barrier = state.barrier;
    render(computeStats(feed.digits, { sample: state.sample, barrier: state.barrier }));
  });

  return { feed, destroy: () => { root.innerHTML = ""; feed.destroy(); } };
}

export default { DerivFeed, mountDigitAnalysis, computeStats, MARKETS, GROUPS, toDigit };
