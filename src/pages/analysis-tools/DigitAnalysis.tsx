/**
 * DigitAnalysis — real-time digit statistics for Deriv synthetic indices.
 * Shows digit distribution (0-9), live last tick, even/odd, over/under,
 * streak analysis, and recent digit history.  Adapts to dark/light theme.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { reaction } from 'mobx';
import { api_base } from '@/external/bot-skeleton';
import { useStore } from '@/hooks/useStore';
import './digit-analysis.scss';

// ─── Types ────────────────────────────────────────────────────────────────────
type DigitCounts = number[]; // index = digit 0-9

type MarketInfo = {
    symbol: string;
    display_name: string;
    pip_size: number;
    group: '1HZ' | 'R' | 'JD';
};

type BarColor =
    | 'most'
    | 'second-most'
    | 'second-least'
    | 'least'
    | 'neutral';

type AnalysisTab =
    | 'distribution'
    | 'evenodd'
    | 'overunder'
    | 'streaks'
    | 'recent'
    | 'signals'
    | 'summary';

// ─── Constants ────────────────────────────────────────────────────────────────
const TICK_WINDOWS = [100, 250, 500, 1000, 2000, 5000] as const;
const DEFAULT_WINDOW = 1000;

const DIGIT_SYMBOLS: { symbol: string; group: '1HZ' | 'R' | 'JD' }[] = [
    // 1HZ
    { symbol: '1HZ10V',  group: '1HZ' },
    { symbol: '1HZ15V',  group: '1HZ' },
    { symbol: '1HZ25V',  group: '1HZ' },
    { symbol: '1HZ30V',  group: '1HZ' },
    { symbol: '1HZ50V',  group: '1HZ' },
    { symbol: '1HZ75V',  group: '1HZ' },
    { symbol: '1HZ90V',  group: '1HZ' },
    { symbol: '1HZ100V', group: '1HZ' },
    // R_ (Volatility)
    { symbol: 'R_10',  group: 'R' },
    { symbol: 'R_25',  group: 'R' },
    { symbol: 'R_50',  group: 'R' },
    { symbol: 'R_75',  group: 'R' },
    { symbol: 'R_100', group: 'R' },
    // JD (Jump Diffusion)
    { symbol: 'JD10',  group: 'JD' },
    { symbol: 'JD25',  group: 'JD' },
    { symbol: 'JD50',  group: 'JD' },
    { symbol: 'JD75',  group: 'JD' },
    { symbol: 'JD100', group: 'JD' },
];

const GROUP_LABELS: Record<string, string> = {
    '1HZ': '1 Hz',
    R:     'Volatility',
    JD:    'Jump',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDecimalPlaces(pipSize: number | undefined, price?: number): number {
    if (typeof pipSize === 'number' && Number.isFinite(pipSize)) {
        // Deriv may expose pip_size as either decimal places (3) or a
        // decimal increment (0.001). Normalize both forms.
        if (pipSize >= 0 && Number.isInteger(pipSize)) return pipSize;
        if (pipSize > 0 && pipSize < 1) {
            const exponent = pipSize.toExponential().split('e-')[1];
            if (exponent) return Number(exponent);
        }
    }
    if (typeof price === 'number') {
        const value = String(price);
        const decimal = value.indexOf('.');
        if (decimal >= 0) return value.length - decimal - 1;
    }
    return 2;
}

function getLastDigit(price: number, pipSize: number): number {
    const s = price.toFixed(getDecimalPlaces(pipSize, price));
    return parseInt(s[s.length - 1], 10);
}

function buildCounts(digits: number[]): DigitCounts {
    const c = new Array(10).fill(0) as number[];
    digits.forEach(d => { if (d >= 0 && d <= 9) c[d]++; });
    return c;
}

function rankBarColors(counts: DigitCounts): BarColor[] {
    const indexed = counts.map((c, d) => ({ d, c }));
    const sorted = [...indexed].sort((a, b) => b.c - a.c || a.d - b.d);
    const rank: BarColor[] = new Array(10).fill('neutral');
    rank[sorted[0].d]  = 'most';
    if (sorted.length > 1) rank[sorted[1].d] = 'second-most';
    if (sorted.length > 8) rank[sorted[8].d] = 'second-least';
    if (sorted.length > 9) rank[sorted[9].d] = 'least';
    return rank;
}

function calcStreak(digits: number[]): { current: number; digit: number | null; max: number } {
    if (!digits.length) return { current: 0, digit: null, max: 0 };
    const last = digits[digits.length - 1];
    let cur = 0;
    for (let i = digits.length - 1; i >= 0; i--) {
        if (digits[i] === last) cur++;
        else break;
    }
    let max = 1, run = 1;
    for (let i = 1; i < digits.length; i++) {
        if (digits[i] === digits[i - 1]) { run++; if (run > max) max = run; }
        else run = 1;
    }
    return { current: cur, digit: last, max };
}

// ─── Main Component ───────────────────────────────────────────────────────────
const DigitAnalysis: React.FC = () => {
    const store = useStore();

    // ── state ─────────────────────────────────────────────────────────────────
    const [markets, setMarkets]           = useState<MarketInfo[]>([]);
    const [activeSymbol, setActiveSymbol] = useState<string>('');
    const [tickWindow, setTickWindow]     = useState<number>(DEFAULT_WINDOW);
    const [digits, setDigits]             = useState<number[]>([]);
    const [lastPrice, setLastPrice]       = useState<number | null>(null);
    const [pipSize, setPipSize]           = useState<number>(2);
    const [activeTab, setActiveTab]       = useState<AnalysisTab>('distribution');
    const [loading, setLoading]           = useState(false);

    // ── refs ──────────────────────────────────────────────────────────────────
    const subIdRef      = useRef<string | null>(null);
    const msgSubRef     = useRef<{ unsubscribe: () => void } | null>(null);
    const currentSymRef = useRef<string>('');
    const pipSizeRef    = useRef<number>(2);
    const windowRef     = useRef<number>(DEFAULT_WINDOW);

    // ── build market list from active_symbols ─────────────────────────────────
    const refreshMarkets = useCallback(() => {
        const as: any[] = api_base.active_symbols ?? [];
        const list: MarketInfo[] = [];
        DIGIT_SYMBOLS.forEach(({ symbol, group }) => {
            const info = as.find(
                (s: any) => s.symbol === symbol || s.underlying_symbol === symbol
            );
            if (info) {
                list.push({
                    symbol,
                    display_name: info.display_name || info.symbol_name || symbol,
                    pip_size:     getDecimalPlaces(info?.pip_size, 2),
                    group,
                });
            } else {
                // Include even if not in active_symbols (offline markets still useful)
                list.push({ symbol, display_name: symbol, pip_size: 2, group });
            }
        });
        setMarkets(list);
        return list;
    }, []);

    // ── cleanup old subscription ──────────────────────────────────────────────
    const cleanupSub = useCallback(() => {
        msgSubRef.current?.unsubscribe();
        msgSubRef.current = null;
        if (subIdRef.current) {
            try { api_base.api?.send({ forget: subIdRef.current }); } catch { /* */ }
            subIdRef.current = null;
        }
    }, []);

    // ── subscribe + fetch history for a symbol ────────────────────────────────
    const loadSymbol = useCallback(async (symbol: string, window_: number) => {
        if (!symbol) return;
        cleanupSub();
        currentSymRef.current = symbol;
        setLoading(true);
        setDigits([]);
        setLastPrice(null);

        // Determine pip size
        const as: any[] = api_base.active_symbols ?? [];
        const info = as.find((s: any) => s.symbol === symbol || s.underlying_symbol === symbol);
        const ps = getDecimalPlaces(info?.pip_size, 2);
        setPipSize(ps);
        pipSizeRef.current = ps;

        // Track history response & live ticks
        let historyLoaded = false;
        const collectedDigits: number[] = [];
        const seenEpochs = new Set<number>();

        const sub = api_base.api?.onMessage().subscribe(({ data }: any) => {
            if (!data || currentSymRef.current !== symbol) return;

            // ── Ticks history response ──────────────────────────────────────
            if (data.msg_type === 'history' && !historyLoaded) {
                historyLoaded = true;
                const prices: number[] = (data.history?.prices ?? []).map(Number);
                const times: number[] = (data.history?.times ?? []).map(Number);
                const historyPairs = prices.map((price, index) => ({
                    price,
                    epoch: Number.isFinite(times[index]) ? times[index] : index,
                }));
                const uniquePairs = historyPairs.filter(({ epoch }) => {
                    if (seenEpochs.has(epoch)) return false;
                    seenEpochs.add(epoch);
                    return true;
                });
                const ds = uniquePairs.map(({ price }) => getLastDigit(price, ps));
                // Keep last `window_` items
                const trimmed = ds.slice(-window_);
                collectedDigits.push(...trimmed);
                if (prices.length > 0) {
                    setLastPrice(uniquePairs[uniquePairs.length - 1]?.price ?? prices[prices.length - 1]);
                }
                setDigits([...collectedDigits]);
                setLoading(false);
            }

            // ── Live tick ───────────────────────────────────────────────────
            if (data.msg_type === 'tick' && data.tick?.symbol === symbol) {
                const price: number = data.tick.quote ?? data.tick.ask ?? 0;
                const epoch = Number(data.tick.epoch);
                if (Number.isFinite(epoch) && seenEpochs.has(epoch)) return;
                if (Number.isFinite(epoch)) seenEpochs.add(epoch);
                const livePipSize = getDecimalPlaces(data.tick.pip_size, price);
                if (livePipSize !== ps) {
                    pipSizeRef.current = livePipSize;
                    setPipSize(livePipSize);
                }
                setLastPrice(price);
                const d = getLastDigit(price, livePipSize);
                if (data.subscription?.id && !subIdRef.current) {
                    subIdRef.current = data.subscription.id;
                }
                setDigits(prev => {
                    const next = [...prev, d];
                    return next.length > windowRef.current ? next.slice(-windowRef.current) : next;
                });
            }
        });

        msgSubRef.current = sub as { unsubscribe: () => void };

        // Fetch history
        try {
            api_base.api?.send({
                ticks_history: symbol,
                count: window_,
                end: 'latest',
                style: 'ticks',
            });
        } catch { setLoading(false); }

        // Subscribe to live ticks
        try {
            api_base.api?.send({ ticks: symbol, subscribe: 1 });
        } catch { /* */ }
    }, [cleanupSub]);

    // ── symbol change ─────────────────────────────────────────────────────────
    const handleSelectSymbol = useCallback((symbol: string) => {
        setActiveSymbol(symbol);
        loadSymbol(symbol, windowRef.current);
    }, [loadSymbol]);

    // ── tick window change ────────────────────────────────────────────────────
    const handleWindowChange = useCallback((w: number) => {
        windowRef.current = w;
        setTickWindow(w);
        if (activeSymbol) loadSymbol(activeSymbol, w);
    }, [activeSymbol, loadSymbol]);

    // ── initial setup + MobX reaction ─────────────────────────────────────────
    useEffect(() => {
        const mList = refreshMarkets();
        windowRef.current = DEFAULT_WINDOW;

        // The bot's current market is the source of truth. Use the first
        // supported synthetic market only before the bot has selected one.
        const botSym = store?.chart_store?.symbol ?? '';
        const initial = botSym || mList[0]?.symbol || '';
        if (initial) {
            setActiveSymbol(initial);
            loadSymbol(initial, DEFAULT_WINDOW);
        }

        // Sync with bot market changes
        let dispose = () => {};
        if (store?.chart_store) {
            dispose = reaction(
                () => store.chart_store?.symbol,
                (newSym: string) => {
                    if (!newSym) return;
                    setActiveSymbol(newSym);
                    loadSymbol(newSym, windowRef.current);
                }
            );
        }

        return () => {
            dispose();
            cleanupSub();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [store?.chart_store]);

    // ── derived stats ─────────────────────────────────────────────────────────
    const total  = digits.length;
    const counts = buildCounts(digits);
    const colors = rankBarColors(counts);
    const lastDigit = total > 0 ? digits[digits.length - 1] : null;

    const pct = (n: number) => total === 0 ? '0.0' : ((n / total) * 100).toFixed(1);

    const evenCount = digits.filter(d => d % 2 === 0).length;
    const oddCount  = total - evenCount;

    const overCounts: Record<number, number> = {};
    const underCounts: Record<number, number> = {};
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(threshold => {
        overCounts[threshold]  = digits.filter(d => d > threshold).length;
        underCounts[threshold] = digits.filter(d => d < threshold).length;
    });

    const streak = calcStreak(digits);
    const rankedDigits = counts
        .map((count, digit) => ({
            digit,
            count,
            percentage: total ? (count / total) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count || a.digit - b.digit);
    const hottest = rankedDigits[0];
    const coldest = rankedDigits[rankedDigits.length - 1];
    const lastTen = digits.slice(-10);
    const lastTenDistinct = new Set(lastTen).size;
    const lastTenEven = lastTen.filter(d => d % 2 === 0).length;

    // ── market grouping ───────────────────────────────────────────────────────
    const groups = ['1HZ', 'R', 'JD'] as const;
    const grouped: Record<string, MarketInfo[]> = { '1HZ': [], R: [], JD: [] };
    markets.forEach(m => { if (grouped[m.group]) grouped[m.group].push(m); });

    // ── format price ─────────────────────────────────────────────────────────
    const fmtPrice = lastPrice !== null ? lastPrice.toFixed(pipSize) : '—';

    // ── render ────────────────────────────────────────────────────────────────
    return (
        <div className='da'>
            {/* ── Header bar ──────────────────────────────────────────────── */}
            <div className='da__header'>
                <div className='da__header-left'>
                    <span className='da__title'>🎯 Digit Analysis</span>
                    <div className='da__price-badge'>
                        <span className='da__price-label'>Last Price</span>
                        <span className='da__price-value'>{fmtPrice}</span>
                        {lastDigit !== null && (
                            <span className={`da__last-digit da__last-digit--${colors[lastDigit]}`}>
                                {lastDigit}
                            </span>
                        )}
                    </div>
                </div>
                <div className='da__header-right'>
                    <label className='da__window-label'>Ticks:</label>
                    <div className='da__window-pills'>
                        {TICK_WINDOWS.map(w => (
                            <button
                                key={w}
                                className={`da__window-pill ${tickWindow === w ? 'da__window-pill--active' : ''}`}
                                onClick={() => handleWindowChange(w)}
                            >
                                {w}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Market selector ─────────────────────────────────────────── */}
            <div className='da__markets'>
                {activeSymbol && !markets.some(m => m.symbol === activeSymbol) && (
                    <div className='da__active-market-note'>
                        <span>Bot market</span>
                        <strong>{activeSymbol}</strong>
                    </div>
                )}
                {groups.map(g => (
                    <div key={g} className='da__market-group'>
                        <span className='da__market-group-label'>{GROUP_LABELS[g]}</span>
                        <div className='da__market-chips'>
                            {grouped[g].map(m => (
                                <button
                                    key={m.symbol}
                                    className={`da__market-chip ${activeSymbol === m.symbol ? 'da__market-chip--active' : ''}`}
                                    onClick={() => handleSelectSymbol(m.symbol)}
                                    title={m.display_name}
                                >
                                    <span className='da__market-chip-name'>
                                        {m.symbol.startsWith('1HZ') ? m.symbol.replace('1HZ', '').replace('V', '') :
                                         m.symbol.startsWith('R_')  ? m.symbol.replace('R_', '') :
                                         m.symbol.replace('JD', '')}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Sub-tabs ─────────────────────────────────────────────────── */}
            <div className='da__tabs'>
                {(['distribution', 'evenodd', 'overunder', 'streaks', 'recent', 'signals', 'summary'] as AnalysisTab[]).map(t => (
                    <button
                        key={t}
                        className={`da__tab ${activeTab === t ? 'da__tab--active' : ''}`}
                        onClick={() => setActiveTab(t)}
                    >
                        {{
                            distribution: '◉ Circles',
                            evenodd: '⚖️ Even/Odd',
                            overunder: '↕ Over/Under',
                            streaks: '🔥 Streaks',
                            recent: '🕐 Recent',
                            signals: '📡 Signals',
                            summary: '🧭 Summary',
                        }[t]}
                    </button>
                ))}
            </div>

            {/* ── Content ──────────────────────────────────────────────────── */}
            {loading ? (
                <div className='da__loading'>
                    <div className='da__spinner' />
                    <span>Loading {total < tickWindow ? `${total} / ${tickWindow}` : tickWindow} ticks…</span>
                </div>
            ) : (
                <div className='da__content'>
                    {/* ── DISTRIBUTION TAB ──────────────────────────────── */}
                    {activeTab === 'distribution' && (
                        <div className='da__distribution'>
                            <div className='da__circle-board'>
                                <div className='da__circle-board-heading'>
                                    <div>
                                        <strong>Last-digit circles</strong>
                                        <span>Live percentages from the latest {tickWindow.toLocaleString()} ticks</span>
                                    </div>
                                    <span className='da__circle-board-market'>{activeSymbol || 'Waiting for bot market'}</span>
                                </div>
                                <div className='da__circles'>
                                    {Array.from({ length: 10 }, (_, d) => {
                                        const count = counts[d];
                                        const pctVal = total === 0 ? 0 : (count / total) * 100;
                                        const color = colors[d];
                                        const isLast = lastDigit === d;
                                        const rank = rankedDigits.findIndex(item => item.digit === d);
                                        const rankLabel =
                                            rank === 0 ? 'Most appearing' :
                                            rank === 1 ? '2nd most' :
                                            rank === 8 ? '2nd least' :
                                            rank === 9 ? 'Least appearing' : '';
                                        return (
                                            <div key={d} className={`da__circle-item ${isLast ? 'da__circle-item--last' : ''}`}>
                                                <div
                                                    className={`da__digit-circle da__digit-circle--${color}`}
                                                    style={{ '--da-circle-pct': `${Math.max(8, pctVal * 3.3)}px` } as React.CSSProperties}
                                                    title={`Digit ${d}: ${pctVal.toFixed(1)}% (${count} of ${total})`}
                                                >
                                                    <span className='da__digit-circle-number'>{d}</span>
                                                    {isLast && <span className='da__digit-circle-cursor'>▲</span>}
                                                </div>
                                                <strong className='da__circle-pct'>{pctVal.toFixed(1)}%</strong>
                                                <span className='da__circle-count'>{count}</span>
                                                {rankLabel && <span className='da__circle-rank'>{rankLabel}</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className='da__bars'>
                                {Array.from({ length: 10 }, (_, d) => {
                                    const count  = counts[d];
                                    const pctVal = total === 0 ? 0 : (count / total) * 100;
                                    const color  = colors[d];
                                    const isLast = lastDigit === d;
                                    return (
                                        <div key={d} className={`da__bar-col ${isLast ? 'da__bar-col--cursor' : ''}`}>
                                            <span className='da__bar-pct'>{pctVal.toFixed(1)}%</span>
                                            <div className='da__bar-track'>
                                                <div
                                                    className={`da__bar-fill da__bar-fill--${color}`}
                                                    style={{ height: `${Math.max(2, pctVal * 3.2)}px` }}
                                                />
                                            </div>
                                            <div className={`da__bar-digit ${isLast ? 'da__bar-digit--active' : ''}`}>
                                                {d}
                                                {isLast && <span className='da__cursor'>▲</span>}
                                            </div>
                                            <span className='da__bar-count'>{count}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div className='da__legend'>
                                <span className='da__legend-item da__legend-item--most'>● Most</span>
                                <span className='da__legend-item da__legend-item--second-most'>● 2nd Most</span>
                                <span className='da__legend-item da__legend-item--second-least'>● 2nd Least</span>
                                <span className='da__legend-item da__legend-item--least'>● Least</span>
                                <span className='da__tick-count'>{total} ticks</span>
                            </div>
                        </div>
                    )}

                    {/* ── EVEN/ODD TAB ──────────────────────────────────── */}
                    {activeTab === 'evenodd' && (
                        <div className='da__evenodd'>
                            <div className='da__eo-cards'>
                                <div className='da__eo-card da__eo-card--even'>
                                    <div className='da__eo-icon'>2</div>
                                    <div className='da__eo-label'>Even</div>
                                    <div className='da__eo-pct'>{pct(evenCount)}%</div>
                                    <div className='da__eo-count'>{evenCount} / {total}</div>
                                    <div className='da__eo-bar-wrap'>
                                        <div className='da__eo-bar da__eo-bar--even' style={{ width: `${total ? (evenCount / total) * 100 : 50}%` }} />
                                    </div>
                                    <div className='da__eo-digits'>Digits: 0, 2, 4, 6, 8</div>
                                </div>
                                <div className='da__eo-card da__eo-card--odd'>
                                    <div className='da__eo-icon'>3</div>
                                    <div className='da__eo-label'>Odd</div>
                                    <div className='da__eo-pct'>{pct(oddCount)}%</div>
                                    <div className='da__eo-count'>{oddCount} / {total}</div>
                                    <div className='da__eo-bar-wrap'>
                                        <div className='da__eo-bar da__eo-bar--odd' style={{ width: `${total ? (oddCount / total) * 100 : 50}%` }} />
                                    </div>
                                    <div className='da__eo-digits'>Digits: 1, 3, 5, 7, 9</div>
                                </div>
                            </div>

                            <div className='da__eo-table'>
                                <div className='da__table-title'>Even digits breakdown</div>
                                <table className='da__table'>
                                    <thead>
                                        <tr><th>Digit</th><th>Count</th><th>%</th><th>Bar</th></tr>
                                    </thead>
                                    <tbody>
                                        {[0, 2, 4, 6, 8].map(d => (
                                            <tr key={d} className={lastDigit === d ? 'da__table-row--active' : ''}>
                                                <td className='da__table-digit'>{d}{lastDigit === d && ' ▲'}</td>
                                                <td>{counts[d]}</td>
                                                <td>{pct(counts[d])}%</td>
                                                <td><div className='da__table-bar-wrap'><div className='da__table-bar da__table-bar--even' style={{ width: `${total ? (counts[d] / total) * 100 * 5 : 0}%` }} /></div></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className='da__table-title' style={{ marginTop: '16px' }}>Odd digits breakdown</div>
                                <table className='da__table'>
                                    <thead>
                                        <tr><th>Digit</th><th>Count</th><th>%</th><th>Bar</th></tr>
                                    </thead>
                                    <tbody>
                                        {[1, 3, 5, 7, 9].map(d => (
                                            <tr key={d} className={lastDigit === d ? 'da__table-row--active' : ''}>
                                                <td className='da__table-digit'>{d}{lastDigit === d && ' ▲'}</td>
                                                <td>{counts[d]}</td>
                                                <td>{pct(counts[d])}%</td>
                                                <td><div className='da__table-bar-wrap'><div className='da__table-bar da__table-bar--odd' style={{ width: `${total ? (counts[d] / total) * 100 * 5 : 0}%` }} /></div></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── OVER/UNDER TAB ────────────────────────────────── */}
                    {activeTab === 'overunder' && (
                        <div className='da__overunder'>
                            <div className='da__ou-info'>
                                <span>📌 "Over X" = last digit &gt; X &nbsp;|&nbsp; "Under X" = last digit &lt; X</span>
                            </div>
                            <div className='da__ou-grid'>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(threshold => {
                                    const oc = overCounts[threshold];
                                    const uc = underCounts[threshold];
                                    const op = total ? (oc / total) * 100 : 0;
                                    const up = total ? (uc / total) * 100 : 0;
                                    const dominated = op > up ? 'over' : op < up ? 'under' : 'equal';
                                    return (
                                        <div key={threshold} className={`da__ou-card da__ou-card--${dominated}`}>
                                            <div className='da__ou-threshold'>Threshold {threshold}</div>
                                            <div className='da__ou-rows'>
                                                <div className='da__ou-row'>
                                                    <span className='da__ou-tag da__ou-tag--over'>Over {threshold}</span>
                                                    <div className='da__ou-bar-wrap'>
                                                        <div className='da__ou-bar da__ou-bar--over' style={{ width: `${op}%` }} />
                                                    </div>
                                                    <span className='da__ou-val'>{op.toFixed(1)}%</span>
                                                </div>
                                                <div className='da__ou-row'>
                                                    <span className='da__ou-tag da__ou-tag--under'>Under {threshold}</span>
                                                    <div className='da__ou-bar-wrap'>
                                                        <div className='da__ou-bar da__ou-bar--under' style={{ width: `${up}%` }} />
                                                    </div>
                                                    <span className='da__ou-val'>{up.toFixed(1)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── STREAKS TAB ───────────────────────────────────── */}
                    {activeTab === 'streaks' && (
                        <div className='da__streaks'>
                            <div className='da__streak-cards'>
                                <div className='da__streak-card da__streak-card--current'>
                                    <div className='da__streak-icon'>🔥</div>
                                    <div className='da__streak-value'>{streak.current}</div>
                                    <div className='da__streak-label'>Current streak</div>
                                    {streak.digit !== null && (
                                        <div className='da__streak-digit'>Digit: <strong>{streak.digit}</strong></div>
                                    )}
                                </div>
                                <div className='da__streak-card da__streak-card--max'>
                                    <div className='da__streak-icon'>🏆</div>
                                    <div className='da__streak-value'>{streak.max}</div>
                                    <div className='da__streak-label'>Longest streak</div>
                                    <div className='da__streak-digit'>in {total} ticks</div>
                                </div>
                                <div className='da__streak-card da__streak-card--info'>
                                    <div className='da__streak-icon'>📈</div>
                                    <div className='da__streak-value'>
                                        {total === 0 ? '—' : (total / 10).toFixed(1)}
                                    </div>
                                    <div className='da__streak-label'>Expected each digit</div>
                                    <div className='da__streak-digit'>at 10% probability</div>
                                </div>
                            </div>

                            {/* Per-digit stats table */}
                            <div className='da__streak-table-wrap'>
                                <div className='da__table-title'>Per-digit frequency vs expectation</div>
                                <table className='da__table'>
                                    <thead>
                                        <tr>
                                            <th>Digit</th>
                                            <th>Count</th>
                                            <th>Actual %</th>
                                            <th>Expected</th>
                                            <th>Deviation</th>
                                            <th>Signal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from({ length: 10 }, (_, d) => {
                                            const c = counts[d];
                                            const actual = total ? (c / total) * 100 : 0;
                                            const expected = 10;
                                            const dev = actual - expected;
                                            const signal = dev > 3 ? { label: '🔥 Hot', cls: 'hot' } :
                                                           dev < -3 ? { label: '🥶 Cold', cls: 'cold' } :
                                                           { label: '— Neutral', cls: 'neutral' };
                                            return (
                                                <tr key={d} className={lastDigit === d ? 'da__table-row--active' : ''}>
                                                    <td className='da__table-digit'>{d}{lastDigit === d && ' ▲'}</td>
                                                    <td>{c}</td>
                                                    <td>{actual.toFixed(2)}%</td>
                                                    <td>10.00%</td>
                                                    <td className={dev > 0 ? 'da__td--pos' : dev < 0 ? 'da__td--neg' : ''}>
                                                        {dev > 0 ? '+' : ''}{dev.toFixed(2)}%
                                                    </td>
                                                    <td className={`da__signal da__signal--${signal.cls}`}>{signal.label}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── RECENT DIGITS TAB ─────────────────────────────── */}
                    {activeTab === 'recent' && (
                        <div className='da__recent'>
                            <div className='da__recent-info'>
                                Showing last <strong>{Math.min(digits.length, 100)}</strong> digits
                                (newest on right, cursor = last)
                            </div>
                            <div className='da__recent-grid'>
                                {digits.slice(-100).map((d, i, arr) => {
                                    const isLast = i === arr.length - 1;
                                    const color = colors[d];
                                    return (
                                        <div
                                            key={i}
                                            className={`da__recent-cell da__recent-cell--${color} ${isLast ? 'da__recent-cell--last' : ''}`}
                                            title={`Tick ${digits.length - arr.length + i + 1}: ${d}`}
                                        >
                                            {d}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Matches / Differs summary */}
                            <div className='da__md-section'>
                                <div className='da__table-title'>Matches &amp; Differs recommendations</div>
                                <p className='da__md-hint'>
                                    "Matches X" wins when last digit = X. "Differs X" wins when last digit ≠ X.
                                    Recommendation is based on frequency deviation from 10%.
                                </p>
                                <div className='da__md-grid'>
                                    {Array.from({ length: 10 }, (_, d) => {
                                        const c = counts[d];
                                        const p = total ? (c / total) * 100 : 10;
                                        const differsP = 100 - p;
                                        const rec = differsP > 88 ? '✅ Differs' : p > 13 ? '✅ Matches' : '⚖️ Neutral';
                                        const recCls = differsP > 88 ? 'differs' : p > 13 ? 'matches' : 'neutral';
                                        return (
                                            <div key={d} className={`da__md-card da__md-card--${recCls}`}>
                                                <div className='da__md-digit'>{d}</div>
                                                <div className='da__md-pct'>{p.toFixed(1)}%</div>
                                                <div className='da__md-rec'>{rec}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── SIGNALS TAB ───────────────────────────────────── */}
                    {activeTab === 'signals' && (
                        <div className='da__signals'>
                            <div className='da__signal-banner'>
                                <strong>Statistical signals</strong>
                                <span>Descriptive frequency analysis only — not a guaranteed prediction.</span>
                            </div>
                            <div className='da__signal-grid'>
                                <div className='da__signal-panel da__signal-panel--hot'>
                                    <span className='da__signal-panel-icon'>🔥</span>
                                    <span className='da__signal-panel-label'>Most frequent digit</span>
                                    <strong>{hottest ? hottest.digit : '—'}</strong>
                                    <span>{hottest ? `${hottest.percentage.toFixed(1)}% · ${hottest.count} hits` : 'Waiting for ticks'}</span>
                                </div>
                                <div className='da__signal-panel da__signal-panel--cold'>
                                    <span className='da__signal-panel-icon'>❄️</span>
                                    <span className='da__signal-panel-label'>Least frequent digit</span>
                                    <strong>{coldest ? coldest.digit : '—'}</strong>
                                    <span>{coldest ? `${coldest.percentage.toFixed(1)}% · ${coldest.count} hits` : 'Waiting for ticks'}</span>
                                </div>
                                <div className='da__signal-panel da__signal-panel--balance'>
                                    <span className='da__signal-panel-icon'>⚖️</span>
                                    <span className='da__signal-panel-label'>Parity bias</span>
                                    <strong>{evenCount > oddCount ? 'Even' : evenCount < oddCount ? 'Odd' : 'Balanced'}</strong>
                                    <span>{pct(Math.max(evenCount, oddCount))}% of the window</span>
                                </div>
                                <div className='da__signal-panel da__signal-panel--last'>
                                    <span className='da__signal-panel-icon'>📍</span>
                                    <span className='da__signal-panel-label'>Last digit</span>
                                    <strong>{lastDigit ?? '—'}</strong>
                                    <span>{lastPrice !== null ? fmtPrice : 'Waiting for tick'}</span>
                                </div>
                            </div>
                            <div className='da__signal-table-wrap'>
                                <div className='da__table-title'>Frequency ranking</div>
                                <table className='da__table'>
                                    <thead>
                                        <tr><th>Rank</th><th>Digit</th><th>Hits</th><th>Actual %</th><th>Distance from 10%</th><th>Class</th></tr>
                                    </thead>
                                    <tbody>
                                        {rankedDigits.map((item, index) => {
                                            const deviation = item.percentage - 10;
                                            return (
                                                <tr key={item.digit} className={lastDigit === item.digit ? 'da__table-row--active' : ''}>
                                                    <td>#{index + 1}</td>
                                                    <td className='da__table-digit'>{item.digit}{lastDigit === item.digit && ' ▲'}</td>
                                                    <td>{item.count}</td>
                                                    <td>{item.percentage.toFixed(2)}%</td>
                                                    <td className={deviation >= 0 ? 'da__td--pos' : 'da__td--neg'}>
                                                        {deviation >= 0 ? '+' : ''}{deviation.toFixed(2)}%
                                                    </td>
                                                    <td><span className={`da__rank-pill da__rank-pill--${colors[item.digit]}`}>{index < 2 ? 'Hot rank' : index > 7 ? 'Cold rank' : 'Neutral'}</span></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── SUMMARY TAB ───────────────────────────────────── */}
                    {activeTab === 'summary' && (
                        <div className='da__summary'>
                            <div className='da__summary-head'>
                                <div>
                                    <strong>Market snapshot</strong>
                                    <span>{activeSymbol || 'No bot market selected'} · {total.toLocaleString()} unique ticks</span>
                                </div>
                                <div className='da__summary-price'>{fmtPrice}<small> last price</small></div>
                            </div>
                            <div className='da__summary-metrics'>
                                <div><span>Window coverage</span><strong>{tickWindow ? `${((total / tickWindow) * 100).toFixed(0)}%` : '0%'}</strong></div>
                                <div><span>Unique digits (last 10)</span><strong>{lastTenDistinct}/10</strong></div>
                                <div><span>Even in last 10</span><strong>{lastTen.length ? `${((lastTenEven / lastTen.length) * 100).toFixed(0)}%` : '—'}</strong></div>
                                <div><span>Current streak</span><strong>{streak.current}{streak.digit !== null ? ` × ${streak.digit}` : ''}</strong></div>
                            </div>
                            <div className='da__summary-sequence'>
                                <div className='da__table-title'>Last 10 digits</div>
                                <div className='da__summary-digits'>
                                    {lastTen.length ? lastTen.map((digit, index) => (
                                        <span key={`${digit}-${index}`} className={`da__summary-digit da__summary-digit--${colors[digit]}`}>{digit}</span>
                                    )) : <span className='da__summary-empty'>Waiting for live ticks…</span>}
                                </div>
                            </div>
                            <div className='da__summary-note'>
                                <strong>How to read this:</strong> each digit is expected to appear close to 10% over a large sample.
                                The rank colours describe the current window; they do not change the independent probability of the next tick.
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DigitAnalysis;
