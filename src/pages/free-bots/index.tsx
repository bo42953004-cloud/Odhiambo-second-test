import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import { DBOT_TABS } from '@/constants/bot-contents';
import { ADMIN_BOTS, TAdminBot } from '@/components/admin-portal/bot-data/bots';
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
    Low: '#10b981',
    Medium: '#f59e0b',
    High: '#ef4444',
};

const FreeBots = observer(() => {
    const store = useStore();
    const [bots, setBots] = useState<TAdminBot[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');

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
        try {
            const workspace = (window as any).Blockly?.derivWorkspace;
            if (!workspace) {
                // Workspace not ready — switch to builder tab first, then retry
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
        <div className='free-bots-page'>
            <div className='free-bots-page__header'>
                <h1 className='free-bots-page__title'>🤖 Free Bots</h1>
                <p className='free-bots-page__subtitle'>Select a bot to load it into the Bot Builder — no setup required.</p>
            </div>

            <div className='free-bots-page__controls'>
                <input
                    className='free-bots-page__search'
                    type='text'
                    placeholder='Search bots…'
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
                <div className='free-bots-page__categories'>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`free-bots-page__cat-btn ${selectedCategory === cat ? 'free-bots-page__cat-btn--active' : ''}`}
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {filteredBots.length === 0 ? (
                <div className='free-bots-page__empty'>
                    <span>🤖</span>
                    <p>No bots found{searchQuery ? ` for "${searchQuery}"` : ''}.</p>
                </div>
            ) : (
                <div className='free-bots-page__grid'>
                    {filteredBots.map(bot => (
                        <div
                            key={bot.id}
                            className='bot-card'
                            style={{ '--bot-color': bot.color || '#21cde4' } as React.CSSProperties}
                            onClick={() => handleLoadBot(bot)}
                        >
                            <div className='bot-card__accent' style={{ background: bot.color || '#21cde4' }} />
                            <div className='bot-card__icon'>{bot.icon || '🤖'}</div>
                            <div className='bot-card__content'>
                                <h3 className='bot-card__name'>{bot.name}</h3>
                                <p className='bot-card__desc'>{bot.description}</p>
                            </div>
                            <div className='bot-card__footer'>
                                <span className='bot-card__category'>{bot.category}</span>
                                <span className='bot-card__risk' style={{ color: RISK_COLOR[bot.risk] || '#94a3b8' }}>
                                    ● {bot.risk} Risk
                                </span>
                            </div>
                            <div className='bot-card__cta'>Load into Builder →</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});

export default FreeBots;
