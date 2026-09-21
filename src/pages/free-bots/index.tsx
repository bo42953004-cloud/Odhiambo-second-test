import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import { DBOT_TABS } from '@/constants/bot-contents';
import { ADMIN_BOTS, TAdminBot } from '@/components/admin-portal/bot-data/bots';
import { BotsBackdrop } from '@/digit-tools/components/BotsBackdrop';
import './free-bots.scss';

const CUSTOM_BOTS_KEY = 'admin_custom_bots';
const SETTINGS_KEY = 'admin_portal_settings';

function getAllBots(): TAdminBot[] {
    let deletedDefaults: string[] = [];
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            deletedDefaults = parsed.deletedDefaultBots || [];
        }
    } catch { /* ignore */ }

    const defaults = ADMIN_BOTS.filter(b => !deletedDefaults.includes(b.id));

    let customs: TAdminBot[] = [];
    try {
        const raw = localStorage.getItem(CUSTOM_BOTS_KEY);
        if (raw) customs = JSON.parse(raw);
    } catch { /* ignore */ }

    return [...defaults, ...customs];
}

const RISK_COLOR: Record<string, string> = {
    Low: 'var(--green)',
    Medium: 'var(--gold)',
    High: 'var(--red)',
};

/* ─── DigitTools-style bot card ─── */
function DigitBotCard({
    bot,
    index,
    onLoad,
    loaded,
}: {
    bot: TAdminBot;
    index: number;
    onLoad: (bot: TAdminBot) => void;
    loaded: boolean;
}) {
    const color = bot.color || '#21cde4';
    const riskCol = RISK_COLOR[bot.risk] || 'var(--muted)';
    const rgb = hexToRgb(color);

    return (
        <article
            className="dt-card dt-sheen group relative flex h-[286px] flex-col overflow-hidden"
            style={{
                borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,.07), 0 0 0 1px color-mix(in srgb, ${color} 14%, transparent), 0 30px 70px -36px color-mix(in srgb, ${color} 70%, transparent)`,
                animation: `dt-up .75s cubic-bezier(.22,1,.36,1) ${index * 110}ms both`,
            }}
            onClick={() => onLoad(bot)}
        >
            {/* background effects */}
            <div className="pointer-events-none absolute inset-0">
                <span className="absolute inset-0" style={{ background: `radial-gradient(112% 76% at 50% 4%, color-mix(in srgb, ${color} 32%, transparent), transparent 74%)` }} />
                <span
                    className="absolute inset-0 opacity-[.42]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(140,175,255,.10) 1px, transparent 1px), linear-gradient(90deg, rgba(140,175,255,.10) 1px, transparent 1px)',
                        backgroundSize: '22px 22px',
                        maskImage: 'radial-gradient(88% 64% at 50% 26%, #000, transparent 80%)',
                    }}
                />
                <span className="A-glow absolute left-1/2 top-[33%] h-[196px] w-[196px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[40px]" style={{ background: `radial-gradient(circle, ${color}99, transparent 68%)` }} />
                <span
                    className="A-spin absolute left-1/2 top-[33%] h-[168px] w-[168px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed"
                    style={{ borderColor: `color-mix(in srgb, ${color} 42%, transparent)`, animationDuration: `${16 + index * 3}s` }}
                />
                {/* robot emoji as the "render" */}
                <div
                    className="A-float absolute left-1/2 top-[33%] -translate-x-1/2 -translate-y-1/2 text-[72px] transition-transform duration-700 ease-out group-hover:scale-[1.14]"
                    style={{ filter: `drop-shadow(0 0 20px ${color}88)` }}
                >
                    {bot.icon || '🤖'}
                </div>
            </div>

            {/* top row: tier + risk + rank */}
            <div className="relative z-20 flex items-start gap-2 p-2.5">
                <span
                    className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[9.5px] font-black tracking-wider transition-transform duration-500 group-hover:scale-105"
                    style={{ background: 'rgba(18,201,160,.18)', color: 'var(--green)', border: '1px solid rgba(18,201,160,.4)' }}
                >
                    ✓ FREE
                </span>
                <span
                    className="mono flex items-center gap-1.5 rounded-md px-2 py-1 text-[9px] font-black"
                    style={{ background: 'rgba(3,7,22,.72)', color: riskCol, border: '1px solid var(--line)' }}
                >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: riskCol, boxShadow: `0 0 8px ${riskCol}` }} />
                    {bot.risk} risk
                </span>
                <span
                    className="mono ml-auto grid h-8 w-8 place-items-center rounded-xl border text-[13px] font-extrabold transition-transform duration-500 group-hover:scale-110"
                    style={{ borderColor: `color-mix(in srgb, ${color} 60%, transparent)`, color, background: `color-mix(in srgb, ${color} 12%, rgba(6,12,34,.72))` }}
                >
                    {String(index + 1).padStart(2, '0')}
                </span>
            </div>

            {/* text content */}
            <div className="relative z-20 mt-auto">
                <span
                    className="pointer-events-none absolute inset-x-0 -top-14 bottom-0"
                    style={{ background: 'linear-gradient(180deg, transparent, color-mix(in srgb, #060c22 92%, transparent) 34%, #060c22 100%)' }}
                />
                <div className="relative px-3 pb-3" style={{ ['--t-a' as string]: color, ['--t-b' as string]: color }}>
                    <h3 className="bot-title bot-title-sm">{bot.name}</h3>
                    <span className="bot-rule" />
                    <p className="line-clamp-2 mt-1.5 text-[10.5px] leading-snug" style={{ color: '#a9bce0' }}>
                        {bot.description}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        <span className="mono rounded px-1.5 py-0.5 text-[8.5px] font-bold" style={{ background: 'rgba(255,255,255,.10)', color: 'var(--muted)' }}>
                            {bot.category}
                        </span>
                    </div>
                    <div className="mt-2 flex gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); onLoad(bot); }}
                            className="flex-1 rounded-lg py-1.5 text-[10.5px] font-extrabold transition-transform duration-300 hover:-translate-y-0.5"
                            style={{
                                background: loaded ? `color-mix(in srgb, ${color} 22%, transparent)` : color,
                                color: loaded ? color : '#04091f',
                                border: loaded ? `1px solid ${color}` : 'none',
                            }}
                        >
                            {loaded ? '✓ Loaded' : 'Load into Builder'}
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
}

function hexToRgb(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
}

const FreeBots = observer(() => {
    const store = useStore();
    const [bots, setBots] = useState<TAdminBot[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [loadedBotId, setLoadedBotId] = useState<string | null>(null);

    const refreshBots = () => setBots(getAllBots());

    useEffect(() => {
        refreshBots();
        window.addEventListener('admin_bots_updated', refreshBots);
        return () => window.removeEventListener('admin_bots_updated', refreshBots);
    }, []);

    const categories = ['All', ...Array.from(new Set(bots.map(b => b.category).filter(Boolean)))];

    const filteredBots = bots.filter(bot => {
        const matchCategory = selectedCategory === 'All' || bot.category === selectedCategory;
        const matchSearch = !searchQuery || bot.name.toLowerCase().includes(searchQuery.toLowerCase()) || (bot.description ?? '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });

    const handleLoadBot = async (bot: TAdminBot) => {
        if (!bot.xml) return;
        setLoadedBotId(bot.id);
        try {
            const workspace = (window as any).Blockly?.derivWorkspace;
            if (!workspace) {
                store.dashboard?.setActiveTab(DBOT_TABS.BOT_BUILDER);
                setTimeout(() => handleLoadBot(bot), 1200);
                return;
            }
            const { load } = await import('@/external/bot-skeleton/scratch/utils');
            await load({
                block_string: bot.xml,
                strategy_id: `free-bot-${bot.id}`,
                file_name: bot.name,
                workspace,
                from: 'local',
                drop_event: {},
                showIncompatibleStrategyDialog: false,
            });
            store.dashboard?.setActiveTab(DBOT_TABS.BOT_BUILDER);
        } catch (e) {
            console.error('Failed to load bot XML:', e);
        }
    };

    return (
        <div className="relative">
            <BotsBackdrop premium={false} />
            <div className="relative z-10 space-y-5 p-4">
                {/* header panel */}
                <div className="dt-panel A-up flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                        <h1 className="text-[19px] font-extrabold tracking-tight sm:text-[21px]" style={{ color: 'var(--txt)' }}>
                            Free Bots
                        </h1>
                        <p className="mt-0.5 text-[11.5px]" style={{ color: 'var(--muted)' }}>
                            Ready-made strategies with full specs. Load one into the builder and tune it before running.
                        </p>
                    </div>
                </div>

                {/* controls */}
                <div className="dt-panel A-up flex flex-wrap items-center gap-3 p-4">
                    <input
                        type="text"
                        placeholder="Search bots…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="flex-1 min-w-[180px] rounded-xl border px-3 py-2 text-[12px] outline-none transition-colors"
                        style={{
                            borderColor: 'var(--line)',
                            background: 'rgba(255,255,255,.05)',
                            color: 'var(--txt)',
                        }}
                    />
                    <div className="flex flex-wrap gap-1.5">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className="rounded-lg border px-2.5 py-1.5 text-[11px] font-extrabold transition-transform hover:-translate-y-0.5"
                                style={{
                                    borderColor: selectedCategory === cat ? 'var(--cyan)' : 'var(--line)',
                                    color: selectedCategory === cat ? 'var(--cyan)' : 'var(--muted)',
                                    background: selectedCategory === cat ? 'rgba(41,211,245,.12)' : 'transparent',
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* bot grid */}
                {filteredBots.length === 0 ? (
                    <div className="dt-panel A-up p-8 text-center">
                        <span className="text-[48px]">🤖</span>
                        <p className="mt-2 text-[13px]" style={{ color: 'var(--muted)' }}>
                            No bots found{searchQuery ? ` for "${searchQuery}"` : ''}.
                        </p>
                    </div>
                ) : (
                    <div key={`${selectedCategory}-${searchQuery}`} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredBots.map((bot, i) => (
                            <DigitBotCard
                                key={bot.id}
                                bot={bot}
                                index={i}
                                onLoad={handleLoadBot}
                                loaded={loadedBotId === bot.id}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
});

export default FreeBots;
