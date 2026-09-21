// @ts-nocheck
import React, { useLayoutEffect, useRef, useState, useCallback, useEffect } from 'react';

/**
 * DigitToolsTabs — a drop-in replacement for the shared_ui Tabs component
 * that renders the DigitTools NavRail design (animated pill, glowing icons,
 * entrance animations) while keeping the same children-based API.
 *
 * The DigitTools CSS (index.css) provides all the .dt-rail, .dt-track,
 * .tab, .dt-pill, .dt-trail, .ico, .lbl classes used here.
 */

type TabDef = {
    id: string;
    label: string;
    a: string; // bright accent
    b: string; // deep accent
    paths: string[]; // SVG icon paths
};

const TAB_DEFS: TabDef[] = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        a: '#3b82f6',
        b: '#0d2f92',
        paths: ['M3 10.5 12 3l9 7.5', 'M5.5 9.5V21h13V9.5', 'M9.5 21v-6h5v6'],
    },
    {
        id: 'botbuilder',
        label: 'Bot Builder',
        a: '#29d3f5',
        b: '#0b5f8f',
        paths: [
            'M12 15.6a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z',
            'M19.6 14.6a1.5 1.5 0 0 0 .3 1.7l.1.1a1.9 1.9 0 1 1-2.7 2.7l-.1-.1a1.5 1.5 0 0 0-1.7-.3 1.5 1.5 0 0 0-.9 1.4v.2a1.9 1.9 0 1 1-3.8 0v-.1a1.5 1.5 0 0 0-1-1.4 1.5 1.5 0 0 0-1.7.3l-.1.1a1.9 1.9 0 1 1-2.7-2.7l.1-.1a1.5 1.5 0 0 0 .3-1.7 1.5 1.5 0 0 0-1.4-.9H3.4a1.9 1.9 0 1 1 0-3.8h.1a1.5 1.5 0 0 0 1.4-1 1.5 1.5 0 0 0-.3-1.7l-.1-.1a1.9 1.9 0 1 1 2.7-2.7l.1.1a1.5 1.5 0 0 0 1.7.3h.1a1.5 1.5 0 0 0 .9-1.4V3.4a1.9 1.9 0 1 1 3.8 0v.1a1.5 1.5 0 0 0 .9 1.4 1.5 1.5 0 0 0 1.7-.3l.1-.1a1.9 1.9 0 1 1 2.7 2.7l-.1.1a1.5 1.5 0 0 0-.3 1.7v.1a1.5 1.5 0 0 0 1.4.9h.2a1.9 1.9 0 1 1 0 3.8h-.1a1.5 1.5 0 0 0-1.4.9Z',
        ],
    },
    {
        id: 'free',
        label: 'Free Bots',
        a: '#12c9a0',
        b: '#0b6b58',
        paths: [
            'M12 2.6v2.6',
            'M8.5 12.4h.01M15.5 12.4h.01',
            'M5.6 8.4h12.8a1.8 1.8 0 0 1 1.8 1.8v6.2a1.8 1.8 0 0 1-1.8 1.8H5.6a1.8 1.8 0 0 1-1.8-1.8v-6.2a1.8 1.8 0 0 1 1.8-1.8Z',
            'M8.2 18.2v2M15.8 18.2v2',
        ],
    },
    {
        id: 'analysis',
        label: 'Analysis',
        a: '#a78bfa',
        b: '#5b21b6',
        paths: [
            'M12 20.4a8.4 8.4 0 1 0 0-16.8 8.4 8.4 0 0 0 0 16.8Z',
            'M12 15.9a3.9 3.9 0 1 0 0-7.8 3.9 3.9 0 0 0 0 7.8Z',
            'M12 4.6V12l4.4 2.6',
        ],
    },
    {
        id: 'chart',
        label: 'Charts',
        a: '#fb923c',
        b: '#9a3412',
        paths: ['M3.2 4.6h17.6v11.6H3.2z', 'M8 20.4h8', 'M12 16.2v4.2'],
    },
    {
        id: 'tutorial',
        label: 'Tutorials',
        a: '#38bdf8',
        b: '#0c4a6e',
        paths: ['M13.4 2.6 5.6 14h5.3l-1.4 7.4L17 9.9h-5.3l1.7-7.3Z'],
    },
];

const FALLBACK_TAB: TabDef = {
    id: 'custom',
    label: 'Custom',
    a: '#f5b731',
    b: '#95611a',
    paths: ['M4 7h10M4 12h13M4 17h7'],
};

type DigitToolsTabsProps = {
    active_index: number;
    onTabItemClick: (index: number) => void;
    children: (React.ReactElement | null)[];
    className?: string;
};

export const DigitToolsTabs: React.FC<DigitToolsTabsProps> = ({
    active_index,
    onTabItemClick,
    children,
}) => {
    const railRef = useRef<HTMLDivElement | null>(null);
    const trackRef = useRef<HTMLDivElement | null>(null);
    const [pos, setPos] = useState({ x: 0, w: 0, ready: false });
    const [bursts, setBursts] = useState<{ id: number; x: number; y: number; c: string }[]>([]);
    const idRef = useRef(0);

    const validChildren = children.filter(c => c) as React.ReactElement[];
    const tabDefs = validChildren.map((_, i) => TAB_DEFS[i] || { ...FALLBACK_TAB, id: `tab-${i}` });
    const current = tabDefs[active_index] || tabDefs[0];

    const measure = useCallback((center = false) => {
        const el = trackRef.current?.querySelector<HTMLElement>(`[data-tab="${active_index}"]`);
        if (!el) return;
        setPos({ x: el.offsetLeft, w: el.offsetWidth, ready: true });
        if (center) {
            const railEl = railRef.current;
            if (railEl) railEl.scrollTo({ left: el.offsetLeft - railEl.clientWidth / 2 + el.offsetWidth / 2, behavior: 'smooth' });
        }
    }, [active_index]);

    useLayoutEffect(() => { measure(true); }, [measure]);

    useEffect(() => {
        const onResize = () => measure(false);
        window.addEventListener('resize', onResize);
        const t = window.setTimeout(() => measure(false), 800);
        return () => { window.removeEventListener('resize', onResize); window.clearTimeout(t); };
    }, [measure]);

    const fire = (el: HTMLElement, color: string) => {
        const r = railRef.current?.getBoundingClientRect();
        const b = el.getBoundingClientRect();
        if (!r) return;
        const id = idRef.current++;
        setBursts(l => [...l, { id, x: b.left - r.left + b.width / 2, y: b.height / 2 + 8, c: color }]);
        window.setTimeout(() => setBursts(l => l.filter(x => x.id !== id)), 720);
    };

    return (
        <div className="dc-tabs dt-tabs-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="dt-rail-wrap">
                <div className="dt-rail" ref={railRef}>
                    <div ref={trackRef} className="dt-track">
                        {pos.ready && (
                            <span
                                className="dt-trail"
                                style={{
                                    transform: `translateX(${pos.x}px)`,
                                    width: pos.w,
                                    background: `linear-gradient(135deg, ${current.a}, ${current.b})`,
                                }}
                            />
                        )}
                        {pos.ready && (
                            <span
                                className="dt-pill"
                                style={{
                                    transform: `translateX(${pos.x}px)`,
                                    width: pos.w,
                                    background: `linear-gradient(135deg, ${current.a} 0%, ${current.b} 62%, ${current.b} 100%)`,
                                    boxShadow: `0 16px 38px -14px ${current.a}, 0 0 0 1px color-mix(in srgb, ${current.a} 45%, transparent), inset 0 1px 0 rgba(255,255,255,.35)`,
                                }}
                            />
                        )}
                        {tabDefs.map((t, i) => {
                            const on = i === active_index;
                            return (
                                <button
                                    key={i}
                                    data-tab={i}
                                    data-active={on}
                                    title={t.label}
                                    onClick={(e) => { onTabItemClick(i); fire(e.currentTarget, t.a); }}
                                    onMouseMove={(e) => {
                                        const r = e.currentTarget.getBoundingClientRect();
                                        e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
                                        e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
                                    }}
                                    className="tab"
                                    style={{
                                        ['--i' as string]: i,
                                        color: t.a,
                                        animation: `dt-drop .55s cubic-bezier(.34,1.42,.5,1) ${i * 55}ms both`,
                                    }}
                                >
                                    {on && <span className="halo" aria-hidden />}
                                    <span
                                        className="ico ico-draw"
                                        style={{
                                            color: t.a,
                                            ['--idle-anim' as string]: 'dt-bob',
                                            ['--idle-c' as string]: `${t.a}bb`,
                                        }}
                                    >
                                        <span className="ico-ring" />
                                        <span className="ico-ring2" />
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                                            {t.paths.map((d, j) => <path key={j} d={d} />)}
                                        </svg>
                                    </span>
                                    <span className="lbl">{t.label}</span>
                                    <span className="toptab" />
                                    <span className="trim" />
                                    <span className="dotp" />
                                </button>
                            );
                        })}
                    </div>
                </div>
                {bursts.map(b => (
                    <span key={b.id} className="dt-ring-out" style={{ left: b.x, top: b.y, color: b.c }} />
                ))}
            </div>
            <div className="dc-tabs__content dt-tabs-content" style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                {React.Children.map(children, (child, index) => {
                    if (!child) return null;
                    if (index !== active_index) return undefined;
                    return child.props.children;
                })}
            </div>
        </div>
    );
};

export default DigitToolsTabs;
