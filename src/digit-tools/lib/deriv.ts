import { useCallback, useEffect, useState } from "react";

export type Group = "1HZ" | "R" | "JD";

export type Market = {
  id: string;
  label: string;
  group: Group;
  pip: number;
  base: number;
  sec: number;
};

export const GROUPS: { key: Group; title: string; note: string; color: string }[] = [
  { key: "1HZ", title: "1-Second Indices", note: "1 tick every second · fastest feed", color: "#29d3f5" },
  { key: "R", title: "Standard Volatility ( R_ )", note: "R_ synthetic volatility series", color: "#3b82f6" },
  { key: "JD", title: "Jump Indices ( JD )", note: "Jump volatility series", color: "#8b5cf6" },
];

export const MARKETS: Market[] = [
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

/** Lookup a market, defaulting to Volatility 100 Index (R_100). */
export const byId = (id: string) =>
  MARKETS.find((m) => m.id === id) ?? MARKETS.find((m) => m.id === "R_100") ?? MARKETS[0];

/** Endpoints tried in order until one delivers ticks. */
export const ENDPOINTS = [
  { url: "wss://ws.derivws.com/websockets/v3?app_id=1089&l=EN", name: "derivws/v3" },
  { url: "wss://ws.binaryws.com/websockets/v3?app_id=1089&l=EN", name: "binaryws/v3" },
  { url: "wss://api.derivws.com/trading/v1/options/ws/public", name: "api.derivws/public" },
];



export function toDigit(quote: number, pip: number) {
  const scaled = Math.round(quote * Math.pow(10, pip));
  return ((scaled % 10) + 10) % 10;
}

export type FeedState = {
  digits: number[];
  /** raw quotes aligned with `digits` — used by rise/fall strategies */
  quotes: number[];
  counts: number[];
  liveDigit: number | null;
  price: number | null;
  source: "connecting" | "live" | "sim";
  ticks: number;
  updated: number;
  error: string | null;
  detail: string;
  attempts: number;
  endpoint: string;
  speed: number;
  retry: () => void;
};

const EMPTY_COUNTS = Array.from({ length: 10 }, () => 0);

/** Rolling window of ticks kept for analysis — 1000 for statistically sound digits. */
export const MAX_TICKS = 1000;

/**
 * Live Deriv tick feed:
 * - rotates through public endpoints, retrying automatically
 * - only declares "simulated" after every endpoint has genuinely failed
 * - purges simulated samples the moment real ticks arrive, so stats stay accurate
 */
export function useDerivFeed(market: Market): FeedState {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<Omit<FeedState, "retry">>({
    digits: [],
    quotes: [],
    counts: EMPTY_COUNTS,
    liveDigit: null,
    price: null,
    source: "connecting",
    ticks: 0,
    updated: 0,
    error: null,
    detail: "Opening secure connection to Deriv…",
    attempts: 0,
    endpoint: ENDPOINTS[0].name,
    speed: market.sec,
  });

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let cancelled = false;
    let ep = 0;
    let fails = 0;
    let sawTick = false;
    let simOn = false;
    let simIv: number | undefined;
    let retryT: number | undefined;
    let deadlineT: number | undefined;
    let keepT: number | undefined;
    let pip = market.pip;
    let simPrice = market.base;
    const buf: number[] = [];
    const qbuf: number[] = [];
    const seen = new Set<string>();

    setState({
      digits: [],
      quotes: [],
      counts: EMPTY_COUNTS,
      liveDigit: null,
      price: null,
      source: "connecting",
      ticks: 0,
      updated: Date.now(),
      error: null,
      detail: "Opening secure connection to Deriv…",
      attempts: 0,
      endpoint: ENDPOINTS[0].name,
      speed: market.sec,
    });

    const detail = (d: string) => setState((s) => ({ ...s, detail: d }));

    const commit = (d: number | null, price: number | null, live: boolean) => {
      const counts = [...EMPTY_COUNTS];
      for (const v of buf) counts[v] += 1;
      setState((s) => ({
        ...s,
        digits: [...buf],
        quotes: [...qbuf],
        counts,
        ticks: buf.length,
        liveDigit: live ? d : s.liveDigit,
        price: live ? price : s.price,
        updated: Date.now(),
      }));
    };

    const clearSim = () => {
      window.clearInterval(simIv);
      simIv = undefined;
      if (simOn) {
        simOn = false;
        buf.length = 0;
        qbuf.length = 0;
      }
    };

    const startSim = (reason: string) => {
      if (cancelled || sawTick || simOn) {
        if (reason) detail(reason);
        return;
      }
      simOn = true;
      buf.length = 0;
      simPrice = market.base;
      for (let i = 0; i < MAX_TICKS; i++) {
        simPrice = Math.max(1, simPrice * (1 + (Math.random() - 0.5) * (0.0007 + market.base / 4_000_000)));
        buf.push(toDigit(simPrice, market.pip));
        qbuf.push(simPrice);
      }
      commit(toDigit(simPrice, market.pip), simPrice, true);
      setState((s) => ({ ...s, source: "sim", error: reason, detail: reason }));
      window.clearInterval(deadlineT);
      simIv = window.setInterval(() => {
        simPrice = Math.max(1, simPrice * (1 + (Math.random() - 0.5) * (0.0007 + market.base / 4_000_000)));
        buf.push(toDigit(simPrice, market.pip));
        qbuf.push(simPrice);
        if (buf.length > MAX_TICKS) buf.shift();
        if (qbuf.length > MAX_TICKS) qbuf.shift();
        commit(toDigit(simPrice, market.pip), simPrice, true);
      }, market.sec * 1000);
    };

    if (typeof WebSocket === "undefined") {
      startSim("This browser context has no WebSocket support — simulated ticks");
      return () => undefined;
    }

    const open = () => {
      if (cancelled || sawTick) return;
      const target = ENDPOINTS[ep % ENDPOINTS.length];
      setState((s) => ({ ...s, endpoint: target.name, attempts: fails + 1 }));
      detail(`Connecting to ${target.name}… (attempt ${fails + 1})`);
      try {
        ws = new WebSocket(target.url);
      } catch (err) {
        fails += 1;
        ep += 1;
        detail(`Blocked: ${String(err)}`);
        retryT = window.setTimeout(open, 900);
        return;
      }

      ws.onopen = () => {
        if (cancelled || !ws) return;
        detail(`Connected to ${target.name} — subscribing to ${market.id}…`);
        try {
          ws.send(JSON.stringify({ ticks: market.id, subscribe: 1 }));
          ws.send(JSON.stringify({ ticks_history: market.id, end: "latest", count: 1000, style: "ticks" }));
          ws.send(JSON.stringify({ ping: 1 }));
        } catch (err) {
          detail(`Subscription failed: ${String(err)}`);
        }
        keepT = window.setInterval(() => {
          try {
            if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ ping: 1 }));
          } catch {
            /* noop */
          }
        }, 20000);
      };

      ws.onmessage = (ev: MessageEvent) => {
        if (cancelled) return;
        let d: {
          error?: { message?: string; code?: string };
          msg_type?: string;
          tick?: { quote?: number; pip_size?: number; id?: string; epoch?: number };
          history?: { prices?: number[] };
        };
        try {
          d = JSON.parse(String(ev.data));
        } catch {
          return;
        }

        if (d.error) {
          const msg = d.error.message ?? "Request rejected";
          detail(`Deriv replied: ${msg}`);
          if (!sawTick) {
            fails += 1;
            ep += 1;
            window.clearInterval(keepT);
            if (fails >= ENDPOINTS.length) {
              startSim(`All endpoints failed — last error: ${msg}`);
            } else {
              window.setTimeout(open, 700);
            }
          }
          return;
        }

        if (d.msg_type === "tick" && d.tick?.quote != null) {
          // NOTE: tick.id is the SYMBOL id, so it repeats on every tick —
          // dedupe must key on epoch+quote or genuine ticks get discarded.
          const key = `${d.tick.epoch ?? "?"}-${d.tick.quote}`;
          if (seen.has(key)) return;
          seen.add(key);
          if (seen.size > 4000) seen.clear();
          if (!sawTick) {
            sawTick = true;
            clearSim();
            fails = 0;
            window.clearTimeout(retryT);
            window.clearInterval(deadlineT);
            window.clearInterval(keepT);
            setState((s) => ({ ...s, source: "live", error: null, detail: `Streaming live ${market.id} ticks` }));
          }
          if (typeof d.tick.pip_size === "number") pip = d.tick.pip_size;
          buf.push(toDigit(d.tick.quote, pip));
          qbuf.push(d.tick.quote);
          if (buf.length > MAX_TICKS) buf.shift();
          if (qbuf.length > MAX_TICKS) qbuf.shift();
          commit(toDigit(d.tick.quote, pip), d.tick.quote, true);
          return;
        }

        if (d.msg_type === "history" && d.history?.prices?.length) {
          if (simOn) clearSim();
          const raw = d.history.prices.slice(-1000);
          const hist = raw.map((q) => toDigit(q, pip));
          buf.length = 0;
          qbuf.length = 0;
          buf.push(...hist);
          qbuf.push(...raw);
          commit(null, null, false);
          setState((s) => ({
            ...s,
            source: "live",
            error: null,
            detail: `Loaded ${hist.length} historic ticks from ${target.name}`,
          }));
        }
      };

      // a single error event is NOT fatal — the close/retry path decides
      ws.onerror = () => {
        if (!sawTick) detail(`${target.name} unreachable — trying the next endpoint…`);
      };

      ws.onclose = (e: CloseEvent) => {
        if (cancelled) return;
        window.clearInterval(keepT);
        if (sawTick) {
          sawTick = false;
          setState((s) => ({ ...s, source: "connecting" }));
          detail(`Stream dropped (${e.code || "network"}) — reconnecting…`);
          retryT = window.setTimeout(open, 1200);
          return;
        }
        fails += 1;
        ep += 1;
        if (fails >= ENDPOINTS.length) {
          startSim(
            `Deriv is unreachable from this context (${e.code || "blocked"}) — simulated ticks. Nothing on your side is misconfigured; the browser is refusing the socket.`,
          );
        } else {
          detail(`${target.name} closed (${e.code || "blocked"}) — trying the next endpoint…`);
          retryT = window.setTimeout(open, 900);
        }
      };
    };

    // hard deadline: if nothing arrived on any endpoint, use the labelled fallback
    deadlineT = window.setTimeout(() => {
      if (!sawTick && !cancelled) {
        startSim("No response from Deriv within 15s — simulated ticks (press “Retry live”)");
      }
    }, 15000);

    open();

    return () => {
      cancelled = true;
      window.clearInterval(simIv);
      window.clearInterval(keepT);
      window.clearInterval(deadlineT);
      window.clearTimeout(retryT);
      try {
        if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ forget_all: "ticks" }));
        ws?.close();
      } catch {
        /* noop */
      }
    };
  }, [market.id, market.pip, market.sec, market.base, attempt]);

  return { ...state, retry };
}

/* ------------------------------------------------------------------ multi-market feed */

export type MultiFeedState = {
  digits: Record<string, number[]>;
  quotes: Record<string, number[]>;
  price: Record<string, number>;
  pip: Record<string, number>;
  source: "connecting" | "live" | "sim";
  /** which transport actually delivered the data */
  transport: "wss" | "https" | "sim" | "none";
  detail: string;
  /** raw last error, surfaced in the UI so failures are diagnosable */
  diag: string;
  broken: string[];
  attempts: number;
  endpoint: string;
  total: number;
  updated: number;
  retry: () => void;
};

const HTTP_ENDPOINT = "https://ws.derivws.com/websockets/v3";

async function httpGet(params: Record<string, string | number>): Promise<{
  error?: { message?: string; code?: string };
  msg_type?: string;
  history?: { prices?: number[]; times?: number[] };
  echo_req?: { ticks_history?: string };
}> {
  const qs = new URLSearchParams({ app_id: "1089", ...(params as Record<string, string>) });
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), 9000);
  try {
    const r = await fetch(`${HTTP_ENDPOINT}?${qs.toString()}`, { signal: ctrl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    window.clearTimeout(t);
  }
}

/**
 * One WebSocket, many markets. Subscribes to a tick stream plus history for every
 * requested symbol so the scan board can show all markets at once.
 */
export function useMultiFeed(ids: string[], cap = 1000): MultiFeedState {
  const key = ids.join("|");
  const [attempt, setAttempt] = useState(0);

  const [state, setState] = useState<Omit<MultiFeedState, "retry">>(() => ({
    digits: {},
    quotes: {},
    price: {},
    pip: {},
    source: "connecting",
    transport: "none",
    detail: "Opening secure connection to Deriv…",
    diag: "",
    broken: [],
    attempts: 0,
    endpoint: ENDPOINTS[0].name,
    total: 0,
    updated: 0,
  }));

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  useEffect(() => {
    const symbols = key.split("|").filter(Boolean);
    if (!symbols.length) return;

    let ws: WebSocket | null = null;
    let cancelled = false;
    let ep = 0;
    let fails = 0;
    let sawTick = false;
    let simOn = false;
    let seq = 0;
    let rafId = 0;
    let pingT: number | undefined;
    let retryT: number | undefined;
    let deadlineT: number | undefined;
    const timers: number[] = [];
    const sendTimers: number[] = [];

    const digits: Record<string, number[]> = {};
    const quotes: Record<string, number[]> = {};
    const price: Record<string, number> = {};
    const pip: Record<string, number> = {};
    for (const s of symbols) {
      digits[s] = [];
      quotes[s] = [];
      pip[s] = byId(s).pip;
    }
    const seen = new Set<string>();
    const broken = new Set<string>();

    const flush = () => {
      rafId = 0;
      setState((st) => ({
        ...st,
        digits: { ...digits },
        quotes: { ...quotes },
        price: { ...price },
        pip: { ...pip },
      }));
    };
    const schedule = () => {
      if (!rafId) rafId = requestAnimationFrame(flush);
    };

    const pushTick = (sym: string, quote: number, pips: number) => {
      const d = toDigit(quote, pips);
      const buf = digits[sym];
      const qb = quotes[sym];
      buf.push(d);
      qb.push(quote);
      if (buf.length > cap) buf.shift();
      if (qb.length > cap) qb.shift();
      price[sym] = quote;
      pip[sym] = pips;
      schedule();
    };

    const detail = (d: string) => setState((s) => ({ ...s, detail: d }));
    const setDiag = (d: string) => setState((s) => ({ ...s, diag: d }));

    const stopSim = () => {
      timers.forEach((t) => window.clearInterval(t));
      timers.length = 0;
      if (simOn) {
        simOn = false;
        for (const s of symbols) {
          digits[s] = [];
          quotes[s] = [];
        }
      }
    };

    /* ---------------- stage 2: HTTPS polling ---------------- */
    // Deriv's v3 endpoint also answers plain GET requests. If the socket is blocked
    // (sandboxed preview, strict CSP, corporate proxy) this keeps the board alive.
    let httpOn = false;
    let httpRound = 0;
    const httpTimers: number[] = [];

    const stopHttp = () => {
      httpTimers.forEach((t) => {
        window.clearInterval(t);
        window.clearTimeout(t);
      });
      httpTimers.length = 0;
      httpOn = false;
    };

    const applyPrices = (sym: string, prices: number[], times?: number[]) => {
      const pb = pip[sym] ?? byId(sym).pip;
      const db = digits[sym];
      const qb = quotes[sym];
      let added = 0;
      for (let k = 0; k < prices.length; k++) {
        const stamp = times?.[k] ?? 0;
        const key2 = `${sym}-${stamp}-${prices[k]}-${k}`;
        if (seen.has(key2)) continue;
        seen.add(key2);
        if (seen.size > 12000) seen.clear();
        qb.push(prices[k]);
        db.push(toDigit(prices[k], pb));
        added++;
      }
      if (qb.length > cap) qb.splice(0, qb.length - cap);
      if (db.length > cap) db.splice(0, db.length - cap);
      if (prices.length) price[sym] = prices[prices.length - 1];
      if (added) schedule();
      return added;
    };

    const startHttp = async (reason: string) => {
      if (cancelled || sawTick || httpOn) return;
      httpOn = true;
      setState((s) => ({ ...s, source: "connecting", transport: "https", detail: `Trying HTTPS transport — ${reason}` }));
      try {
        // probe one market first so we don't fire 18 doomed requests
        const probe = await httpGet({ ticks_history: symbols[0], count: 5, end: "latest", style: "ticks" });
        if (probe.error) throw new Error(probe.error.message ?? "rejected");
        if (!probe.history?.prices?.length) throw new Error("empty response");
        setDiag(`HTTPS transport OK — WebSocket was blocked (${reason})`);
      } catch (err) {
        httpOn = false;
        setDiag(`HTTP probe failed: ${err instanceof Error ? err.message : String(err)}`);
        startSim(`Both WebSocket and HTTPS are blocked (${reason}). Simulated scan.`);
        return;
      }

      // seed every market, staggered
      let idx = 0;
      const seedNext = async () => {
        if (cancelled || !httpOn) return;
        const batch = symbols.slice(idx, idx + 3);
        idx += 3;
        await Promise.all(
          batch.map(async (sym) => {
            try {
              const r = await httpGet({ ticks_history: sym, count: cap, end: "latest", style: "ticks" });
              if (r.error) {
                broken.add(sym);
                return;
              }
              broken.delete(sym);
              applyPrices(sym, r.history?.prices ?? [], r.history?.times);
            } catch {
              broken.add(sym);
            }
          }),
        );
        setState((s) => ({
          ...s,
          transport: "https",
          broken: [...broken],
          total: s.total + 1,
          detail: `HTTPS seed ${Math.min(idx, symbols.length)}/${symbols.length} markets × ${cap} ticks`,
          updated: Date.now(),
        }));
        if (idx < symbols.length) httpTimers.push(window.setTimeout(seedNext, 160));
        else {
          setState((s) => ({ ...s, source: "live", detail: `Streaming via HTTPS polling · ${symbols.length - broken.size} markets` }));
          // steady-state polling: small windows, round-robin so rates stay sane
          httpTimers.push(
            window.setInterval(async () => {
              if (cancelled || !httpOn) return;
              const batch = [symbols[httpRound % symbols.length], symbols[(httpRound + 1) % symbols.length], symbols[(httpRound + 2) % symbols.length]];
              httpRound += 3;
              await Promise.all(
                batch.map(async (sym) => {
                  if (broken.has(sym)) return;
                  try {
                    const r = await httpGet({ ticks_history: sym, count: 30, end: "latest", style: "ticks" });
                    if (r.error) return;
                    if (applyPrices(sym, r.history?.prices ?? [], r.history?.times)) {
                      setState((s) => ({ ...s, total: s.total + 1, updated: Date.now() }));
                    }
                  } catch {
                    /* keep polling */
                  }
                }),
              );
            }, 1000),
          );
        }
      };
      void seedNext();
    };

    const startSim = (reason: string) => {
      if (cancelled || sawTick || simOn) return;
      simOn = true;
      for (const s of symbols) {
        const m = byId(s);
        let p = m.base;
        const vol = 0.0007 + m.base / 4_000_000;
        for (let i = 0; i < Math.min(cap, 200); i++) p = Math.max(1, p * (1 + (Math.random() - 0.5) * vol));
        digits[s] = [];
        quotes[s] = [];
        let q = p;
        for (let i = 0; i < Math.min(cap, 200); i++) {
          q = Math.max(1, q * (1 + (Math.random() - 0.5) * vol));
          quotes[s].push(q);
          digits[s].push(toDigit(q, m.pip));
        }
        price[s] = q;
      }
      schedule();
      setState((s) => ({ ...s, source: "sim", detail: reason, attempts: fails + 1 }));
      timers.push(
        window.setInterval(() => {
          seq++;
          for (const s of symbols) {
            const m = byId(s);
            if (m.sec === 2 && seq % 2 === 0) continue;
            const vol = 0.0007 + m.base / 4_000_000;
            const q = Math.max(1, (price[s] ?? m.base) * (1 + (Math.random() - 0.5) * vol));
            pushTick(s, q, m.pip);
            setState((st) => ({ ...st, total: st.total + 1, updated: Date.now() }));
          }
        }, 1000),
      );
    };

    if (typeof WebSocket === "undefined") {
      void startHttp("this browser has no WebSocket support");
      return () => {
        cancelled = true;
        stopHttp();
      };
    }

    const open = () => {
      if (cancelled || sawTick) return;
      const target = ENDPOINTS[ep % ENDPOINTS.length];
      setState((s) => ({ ...s, endpoint: target.name, attempts: fails + 1 }));
      detail(`Scanning ${symbols.length} markets via ${target.name}…`);
      try {
        ws = new WebSocket(target.url);
      } catch (err) {
        fails++;
        ep++;
        detail(`Blocked: ${String(err)}`);
        retryT = window.setTimeout(open, 900);
        return;
      }

      ws.onopen = () => {
        if (cancelled || !ws) return;
        detail(`Connected — pulling ${cap} ticks × ${symbols.length} markets…`);
        // one request per market: history + live subscription in a single call,
        // sent in small batches so Deriv doesn't throttle the flood
        let idx = 0;
        const BATCH = 5;
        const sendNext = () => {
          if (cancelled || !ws || ws.readyState !== WebSocket.OPEN) return;
          try {
            for (let k = 0; k < BATCH && idx < symbols.length; k++, idx++) {
              ws.send(
                JSON.stringify({
                  ticks_history: symbols[idx],
                  end: "latest",
                  count: cap,
                  style: "ticks",
                  subscribe: 1,
                }),
              );
            }
            if (idx >= symbols.length) ws.send(JSON.stringify({ ping: 1 }));
            // dedicated array: the staggered sends must never be cancelled by stopSim()
            else sendTimers.push(window.setTimeout(sendNext, 110));
          } catch {
            /* noop */
          }
        };
        sendNext();
        pingT = window.setInterval(() => {
          try {
            if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ ping: 1 }));
          } catch {
            /* noop */
          }
        }, 20000);
      };

      ws.onmessage = (ev: MessageEvent) => {
        if (cancelled) return;
        let d: {
          error?: { message?: string; code?: string };
          msg_type?: string;
          tick?: { quote?: number; pip_size?: number; symbol?: string; id?: string; epoch?: number };
          history?: { prices?: number[]; symbol?: string; pip_size?: number };
          echo_req?: { ticks_history?: string; ticks?: string };
        };
        try {
          d = JSON.parse(String(ev.data));
        } catch {
          return;
        }

        if (d.error) {
          const sym = d.echo_req?.ticks_history ?? d.echo_req?.ticks ?? null;
          if (sym) {
            // a single market failed (retired / restricted) — never kill the whole scan
            if (!(sym in digits)) return;
            digits[sym] = [];
            quotes[sym] = [];
            broken.add(sym);
            setState((s) => ({
              ...s,
              detail: `${broken.size} of ${symbols.length} markets unavailable (${[...broken].slice(0, 4).join(", ")}${
                broken.size > 4 ? "…" : ""
              }) — the rest are streaming`,
            }));
            return;
          }
          // connection-level error
          if (!sawTick) {
            fails++;
            ep++;
            window.clearInterval(pingT);
            setDiag(`WS error: ${d.error.message ?? "rejected"}`);
            if (fails >= ENDPOINTS.length) void startHttp(`WS error: ${d.error.message ?? "rejected"}`);
            else retryT = window.setTimeout(open, 800);
          }
          return;
        }

        if (d.msg_type === "tick" && d.tick?.quote != null) {
          const sym = d.tick.symbol ?? d.tick.id ?? "";
          if (!(sym in digits)) return;
          const key2 = `${sym}-${d.tick.epoch ?? "?"}-${d.tick.quote}`;
          if (seen.has(key2)) return;
          seen.add(key2);
          if (seen.size > 6000) seen.clear();

          if (!sawTick) {
            sawTick = true;
            stopSim();
            stopHttp();
            fails = 0;
            window.clearTimeout(retryT);
            window.clearTimeout(deadlineT);
            setState((s) => ({
              ...s,
              source: "live",
              transport: "wss",
              detail: `Streaming live ticks for ${symbols.length} markets`,
            }));
          }
          pushTick(sym, d.tick.quote, typeof d.tick.pip_size === "number" ? d.tick.pip_size : pip[sym]);
          setState((st) => ({ ...st, total: st.total + 1, updated: Date.now() }));
          return;
        }

        if (d.msg_type === "history" && d.history?.prices) {
          // ticks_history responses carry the symbol in echo_req (history.symbol is often absent)
          const sym = d.echo_req?.ticks_history ?? d.history.symbol ?? "";
          if (!sym || !(sym in digits)) return;
          if (simOn) stopSim();
          if (typeof d.history.pip_size === "number") pip[sym] = d.history.pip_size;
          const qs = d.history.prices.slice(-cap);
          quotes[sym] = qs.slice();
          digits[sym] = qs.map((q) => toDigit(q, pip[sym]));
          price[sym] = qs[qs.length - 1] ?? price[sym];
          broken.delete(sym);
          setState((st) => ({
            ...st,
            source: "live",
            detail: `Loaded ${qs.length} ticks × ${symbols.length - broken.size} markets`,
            updated: Date.now(),
          }));
          schedule();
        }
      };

      ws.onerror = () => {
        if (!sawTick) detail(`${target.name} unreachable — trying next…`);
      };

      ws.onclose = (e: CloseEvent) => {
        if (cancelled) return;
        window.clearInterval(pingT);
      if (sawTick) {
        sawTick = false;
        setState((s) => ({ ...s, source: "connecting" }));
        detail(`Stream dropped (${e.code || "network"}) — reconnecting…`);
        retryT = window.setTimeout(open, 1200);
        return;
      }
      fails++;
      ep++;
      const why = `${target.name} closed (code ${e.code || "?"}${e.reason ? `: ${e.reason}` : ""})`;
      setDiag(why);
      if (fails >= ENDPOINTS.length) {
        void startHttp(why);
      } else {
        detail(`${why} — next endpoint…`);
        retryT = window.setTimeout(open, 900);
      }
    };
    };

    open();

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.clearInterval(pingT);
      window.clearTimeout(deadlineT);
      window.clearTimeout(retryT);
      timers.forEach((t) => window.clearInterval(t));
      sendTimers.forEach((t) => window.clearTimeout(t));
      stopHttp();
      try {
        if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ forget_all: "ticks" }));
        ws?.close();
      } catch {
        /* noop */
      }
    };
  }, [key, cap, attempt]);

  return { ...state, retry };
}

export function pct(n: number, total: number) {
  return total ? (n / total) * 100 : 0;
}

export function gapSinceLast(digits: number[], digit: number) {
  for (let i = digits.length - 1, k = 0; i >= 0; i--, k++) {
    if (digits[i] === digit) return k;
  }
  return -1;
}

export function parityStreak(digits: number[]) {
  if (!digits.length) return { even: 0, odd: 0 };
  const last = digits[digits.length - 1] % 2 === 0;
  let n = 0;
  for (let i = digits.length - 1; i >= 0; i--) {
    if ((digits[i] % 2 === 0) === last) n++;
    else break;
  }
  return last ? { even: n, odd: 0 } : { even: 0, odd: n };
}
