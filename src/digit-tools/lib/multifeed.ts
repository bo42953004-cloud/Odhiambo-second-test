import { useCallback, useEffect, useState } from "react";
import { ENDPOINTS, byId, toDigit } from "./deriv";

/**
 * Multi-market scan feed.
 *
 * IMPORTANT: this deliberately mirrors the single-market `useDerivFeed` message
 * pattern exactly — because that is the code path proven to connect on every
 * network we have tested. Differences from earlier attempts:
 *
 *   · ONE WebSocket for all markets (not one per group) — fewer handshakes,
 *     fewer things to go wrong, and browsers cap parallel sockets.
 *   · The exact working pair per symbol, sent as two messages:
 *         { ticks: SYMBOL, subscribe: 1 }
 *         { ticks_history: SYMBOL, end: "latest", count: N, style: "ticks" }
 *   · Symbols are queued 180ms apart so Deriv never sees a burst, and the first
 *     THREE markets are requested in the same tick as the open event so data
 *     starts arriving immediately.
 *   · Endpoint rotation + reconnect on the single socket.
 */

export type MarketStatus = "pending" | "history" | "live" | "unavailable" | "failed";

export type MultiFeedState = {
  digits: Record<string, number[]>;
  quotes: Record<string, number[]>;
  price: Record<string, number>;
  pip: Record<string, number>;
  status: Record<string, MarketStatus>;
  source: "connecting" | "live" | "sim";
  transport: "wss" | "https" | "sim" | "none";
  detail: string;
  diag: string;
  broken: string[];
  total: number;
  endpoint: string;
  updated: number;
  retry: () => void;
};

const HTTP_ENDPOINT = "https://ws.derivws.com/websockets/v3";
const GAP_MS = 180;

type Msg = {
  error?: { message?: string; code?: string };
  msg_type?: string;
  tick?: { quote?: number; pip_size?: number; symbol?: string; id?: string; epoch?: number };
  history?: { prices?: number[]; times?: number[] };
  echo_req?: { ticks_history?: string; ticks?: string };
};

async function httpGet(params: Record<string, string | number>): Promise<Msg> {
  const qs = new URLSearchParams();
  qs.set("app_id", "1089");
  for (const [k, v] of Object.entries(params)) qs.set(k, String(v));
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), 9000);
  try {
    const r = await fetch(`${HTTP_ENDPOINT}?${qs.toString()}`, { signal: ctrl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return (await r.json()) as Msg;
  } finally {
    window.clearTimeout(t);
  }
}

export function useMultiFeed(ids: string[], cap = 1000, enabled = true): MultiFeedState {
  const key = ids.join("|");
  const [attempt, setAttempt] = useState(0);

  const [state, setState] = useState<Omit<MultiFeedState, "retry">>(() => ({
    digits: {},
    quotes: {},
    price: {},
    pip: {},
    status: {},
    source: "connecting",
    transport: "none",
    detail: "Opening secure connection to Deriv…",
    diag: "",
    broken: [],
    total: 0,
    endpoint: ENDPOINTS[0].name,
    updated: 0,
  }));

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  useEffect(() => {
    if (!enabled) return;
    const symbols = key.split("|").filter(Boolean);
    if (!symbols.length) return;

    let cancelled = false;
    let ep = 0;
    let fails = 0;
    let sawTick = false;
    let simOn = false;
    let ws: WebSocket | null = null;
    let rafId = 0;
    let fallbackT: number | undefined;

    const digits: Record<string, number[]> = {};
    const quotes: Record<string, number[]> = {};
    const price: Record<string, number> = {};
    const pip: Record<string, number> = {};
    const status: Record<string, MarketStatus> = {};
    for (const s of symbols) {
      digits[s] = [];
      quotes[s] = [];
      pip[s] = byId(s).pip;
      status[s] = "pending";
    }

    const seen = new Set<string>();
    const timeouts: number[] = [];
    const intervals: number[] = [];
    const after = (ms: number, fn: () => void) => {
      const t = window.setTimeout(fn, ms);
      timeouts.push(t);
      return t;
    };
    const every = (ms: number, fn: () => void) => {
      const t = window.setInterval(fn, ms);
      intervals.push(t);
      return t;
    };

    let total = 0;
    let gotAny = false;

    const flush = () => {
      rafId = 0;
      setState((st) => ({
        ...st,
        digits: { ...digits },
        quotes: { ...quotes },
        price: { ...price },
        pip: { ...pip },
        status: { ...status },
      }));
    };
    const schedule = () => {
      if (!rafId) rafId = requestAnimationFrame(flush);
    };
    const setDetail = (detail: string) => setState((s) => ({ ...s, detail }));

    /** merge prices into the buffers, de-duplicated by symbol+epoch+quote */
    const addPrices = (sym: string, prices: number[], times?: number[], live = false) => {
      if (!(sym in digits)) return 0;
      const pb = pip[sym] ?? byId(sym).pip;
      const db = digits[sym];
      const qb = quotes[sym];
      let added = 0;
      for (let k = 0; k < prices.length; k++) {
        const tag = `${sym}|${times?.[k] ?? k}|${prices[k]}`;
        if (seen.has(tag)) continue;
        seen.add(tag);
        if (seen.size > 30000) seen.clear();
        qb.push(prices[k]);
        db.push(toDigit(prices[k], pb));
        added++;
      }
      if (qb.length > cap) qb.splice(0, qb.length - cap);
      if (db.length > cap) db.splice(0, db.length - cap);
      if (prices.length) price[sym] = prices[prices.length - 1];
      if (added) {
        total += added;
        gotAny = true;
        status[sym] = live ? "live" : "history";
        schedule();
      }
      return added;
    };

    /* ------------------------------------------------ stage 3: simulation */
    const startSim = (reason: string) => {
      if (cancelled || simOn || gotAny) return;
      simOn = true;
      for (const s of symbols) {
        const m = byId(s);
        const vol = 0.0007 + m.base / 4_000_000;
        let q = m.base;
        digits[s] = [];
        quotes[s] = [];
        for (let i = 0; i < Math.min(cap, 300); i++) {
          q = Math.max(1, q * (1 + (Math.random() - 0.5) * vol));
          quotes[s].push(q);
          digits[s].push(toDigit(q, m.pip));
        }
        price[s] = q;
        status[s] = "live";
      }
      flush();
      setState((st) => ({ ...st, source: "sim", transport: "sim", diag: reason, detail: reason }));
      every(1000, () => {
        for (const s of symbols) {
          const m = byId(s);
          const vol = 0.0007 + m.base / 4_000_000;
          const q = Math.max(1, (price[s] ?? m.base) * (1 + (Math.random() - 0.5) * vol));
          addPrices(s, [q], [Date.now()]);
        }
      });
    };

    /* ------------------------------------------------ stage 2: HTTPS polling */
    let httpOn = false;
    const stopHttp = () => {
      httpOn = false;
    };
    const startHttp = async (reason: string) => {
      if (cancelled || gotAny || httpOn) return;
      httpOn = true;
      setState((s) => ({ ...s, transport: "https", diag: reason, detail: `HTTPS fallback — ${reason}` }));
      try {
        const probe = await httpGet({ ticks_history: symbols[0], count: 5, end: "latest", style: "ticks" });
        if (probe.error || !probe.history?.prices?.length) throw new Error(probe.error?.message ?? "empty response");
      } catch (err) {
        const why = err instanceof Error ? err.message : String(err);
        setState((s) => ({ ...s, diag: `HTTP probe failed: ${why}` }));
        startSim(`WebSocket and HTTPS both refused (${reason} · ${why})`);
        return;
      }
      let i = 0;
      const seed = async () => {
        if (cancelled || !httpOn) return;
        const batch = symbols.slice(i, i + 3);
        i += 3;
        await Promise.all(
          batch.map(async (sym) => {
            try {
              const r = await httpGet({ ticks_history: sym, count: cap, end: "latest", style: "ticks" });
              if (r.error) {
                status[sym] = "unavailable";
                return;
              }
              addPrices(sym, r.history?.prices ?? [], r.history?.times);
            } catch {
              status[sym] = "unavailable";
            }
          }),
        );
        setState((s) => ({
          ...s,
          source: gotAny ? "live" : "connecting",
          broken: symbols.filter((x) => status[x] === "unavailable"),
          detail: `HTTPS seed ${Math.min(i, symbols.length)}/${symbols.length}`,
          updated: Date.now(),
        }));
        schedule();
        if (i < symbols.length) after(140, () => void seed());
        else {
          setState((s) => ({ ...s, source: "live", detail: "Streaming via HTTPS polling" }));
          let round = 0;
          every(1000, async () => {
            if (cancelled || !httpOn) return;
            const b = [0, 1, 2].map((k) => symbols[(round + k) % symbols.length]);
            round += 3;
            await Promise.all(
              b.map(async (sym) => {
                if (status[sym] === "unavailable") return;
                try {
                  const r = await httpGet({ ticks_history: sym, count: 25, end: "latest", style: "ticks" });
                  if (!r.error && addPrices(sym, r.history?.prices ?? [], r.history?.times, true)) {
                    setState((s) => ({ ...s, total: s.total + 1, updated: Date.now() }));
                  }
                } catch {
                  /* keep polling */
                }
              }),
            );
          });
        }
      };
      void seed();
    };

    /* ------------------------------------------------ stage 1: ONE socket */
    if (typeof WebSocket === "undefined") {
      void startHttp("no WebSocket support in this browser");
      return () => {
        cancelled = true;
      };
    }

    const connect = () => {
      if (cancelled) return;
      const target = ENDPOINTS[ep % ENDPOINTS.length];
      setState((s) => ({ ...s, endpoint: target.name, diag: "", attempts: fails + 1 }));
      setDetail(`Connecting to ${target.name}…`);

      try {
        ws = new WebSocket(target.url);
      } catch (err) {
        fails++;
        ep++;
        setState((s) => ({ ...s, diag: `WebSocket blocked: ${String(err)}` }));
        after(800, connect);
        return;
      }

      ws.onopen = () => {
        if (cancelled || !ws) return;
        setDetail(`Connected — loading ${symbols.length} markets…`);
        try {
          // keepalive + a ping so the socket is proven alive straight away
          ws.send(JSON.stringify({ ping: 1 }));
        } catch {
          /* noop */
        }

        let i = 0;
        const sendNext = () => {
          if (cancelled || !ws || ws.readyState !== WebSocket.OPEN) return;
          const sym = symbols[i++];
          try {
            // the exact pair used by the working single-market feed
            ws.send(JSON.stringify({ ticks: sym, subscribe: 1 }));
            ws.send(JSON.stringify({ ticks_history: sym, end: "latest", count: cap, style: "ticks" }));
          } catch {
            /* noop */
          }
          if (i < symbols.length) after(i <= 3 ? 40 : GAP_MS, sendNext);
        };
        sendNext();

        every(20000, () => {
          try {
            if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ ping: 1 }));
          } catch {
            /* noop */
          }
        });
      };

      ws.onmessage = (ev: MessageEvent) => {
        if (cancelled) return;
        let d: Msg;
        try {
          d = JSON.parse(String(ev.data)) as Msg;
        } catch {
          return;
        }

        /* ---- per-symbol errors never kill the socket ---- */
        if (d.error) {
          const sym = d.echo_req?.ticks_history ?? d.echo_req?.ticks ?? null;
          if (sym && sym in digits) {
            status[sym] = "unavailable";
            schedule();
            setState((s) => ({ ...s, broken: symbols.filter((x) => status[x] === "unavailable") }));
            return;
          }
          setState((s) => ({ ...s, diag: `Deriv: ${d.error?.message ?? "rejected"}` }));
          if (!gotAny) {
            fails++;
            ep++;
            try {
              ws?.close();
            } catch {
              /* noop */
            }
          }
          return;
        }

        /* ---- live tick ---- */
        if (d.msg_type === "tick" && d.tick?.quote != null) {
          const sym = d.tick.symbol ?? d.tick.id ?? "";
          if (!(sym in digits)) return;
          const epoch = d.tick.epoch ?? Math.floor(Date.now() / 1000);
          const tag = `${sym}|${epoch}|${d.tick.quote}`;
          if (seen.has(tag)) return;
          seen.add(tag);
          if (typeof d.tick.pip_size === "number") pip[sym] = d.tick.pip_size;

          if (!sawTick) {
            sawTick = true;
            fails = 0;
            if (fallbackT) window.clearTimeout(fallbackT);
            setState((s) => ({
              ...s,
              source: "live",
              transport: "wss",
              diag: "",
              detail: `Live via WebSocket · ${target.name}`,
            }));
          }

          const db = digits[sym];
          const qb = quotes[sym];
          db.push(toDigit(d.tick.quote, pip[sym]));
          qb.push(d.tick.quote);
          if (db.length > cap) db.shift();
          if (qb.length > cap) qb.shift();
          price[sym] = d.tick.quote;
          status[sym] = "live";
          total += 1;
          gotAny = true;
          schedule();
          return;
        }

        /* ---- history backfill (symbol arrives in echo_req) ---- */
        if (d.msg_type === "history" && d.history?.prices?.length) {
          const sym = d.echo_req?.ticks_history ?? "";
          if (!sym || !(sym in digits)) return;
          addPrices(sym, d.history.prices, d.history.times);
          setState((s) => ({
            ...s,
            source: "live",
            transport: "wss",
            detail: `Loaded ${Math.min(total, cap * symbols.length).toLocaleString()} ticks · ${symbols.length} markets`,
            updated: Date.now(),
          }));
        }
      };

      ws.onerror = () => {
        if (!gotAny) setState((s) => ({ ...s, diag: `${target.name} unreachable — next endpoint…` }));
      };

      ws.onclose = (e: CloseEvent) => {
        if (cancelled) return;
        if (gotAny) {
          sawTick = false;
          setState((s) => ({ ...s, source: "connecting", detail: `Stream dropped (${e.code || "network"}) — reconnecting…` }));
          after(1200, connect);
          return;
        }
        fails++;
        ep++;
        const why = `${target.name} closed (code ${e.code || "?"})`;
        setState((s) => ({ ...s, diag: why }));
        if (ep < ENDPOINTS.length) after(700, connect);
        else void startHttp(why);
      };
    };

    // if nothing at all arrives, fall through the ladder
    fallbackT = window.setTimeout(() => {
      if (!cancelled && !gotAny) void startHttp("no ticks within 12s");
    }, 12000);

    connect();

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (fallbackT) window.clearTimeout(fallbackT);
      timeouts.forEach((t) => window.clearTimeout(t));
      intervals.forEach((t) => window.clearInterval(t));
      stopHttp();
      try {
        if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ forget_all: "ticks" }));
        ws?.close();
      } catch {
        /* noop */
      }
    };
  }, [key, cap, attempt, enabled]);

  return { ...state, retry };
}
