import React, { useEffect, useState } from 'react';
import { useAdminPortal } from '../AdminPortalContext';
import { TAdminBot, ADMIN_BOTS } from '../bot-data/bots';

const CUSTOM_BOTS_KEY = 'admin_custom_bots';

function getCustomBots(): TAdminBot[] {
    try {
        const raw = localStorage.getItem(CUSTOM_BOTS_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return [];
}

function saveCustomBots(bots: TAdminBot[]) {
    localStorage.setItem(CUSTOM_BOTS_KEY, JSON.stringify(bots));
    window.dispatchEvent(new Event('admin_bots_updated'));
}

const RISK_OPTIONS = ['Low', 'Medium', 'High'] as const;

type TFormBot = {
    name: string;
    description: string;
    category: string;
    risk: 'Low' | 'Medium' | 'High';
    icon: string;
    color: string;
    xml: string;
};

const EMPTY_FORM: TFormBot = {
    name: '',
    description: '',
    category: '',
    risk: 'Medium',
    icon: '🤖',
    color: '#21cde4',
    xml: '',
};

type Props = { onClose: () => void };

const FreeBots: React.FC<Props> = ({ onClose }) => {
    const { settings, updateSettings } = useAdminPortal();
    const [customBots, setCustomBots] = useState<TAdminBot[]>(getCustomBots);
    const [isAdding, setIsAdding] = useState(false);
    const [form, setForm] = useState<TFormBot>(EMPTY_FORM);
    const [formError, setFormError] = useState('');

    // Track which default bots are hidden
    const deletedDefaults: string[] = settings.deletedDefaultBots || [];
    const visibleDefaults = ADMIN_BOTS.filter(b => !deletedDefaults.includes(b.id));
    const hiddenDefaults = ADMIN_BOTS.filter(b => deletedDefaults.includes(b.id));

    useEffect(() => {
        setCustomBots(getCustomBots());
    }, []);

    const setField = <K extends keyof TFormBot>(k: K, v: TFormBot[K]) =>
        setForm(p => ({ ...p, [k]: v }));

    const handleAddBot = () => {
        if (!form.name.trim()) { setFormError('Bot name is required.'); return; }
        if (!form.xml.trim()) { setFormError('Bot XML is required.'); return; }
        const newBot: TAdminBot = {
            id: `custom-${Date.now()}`,
            name: form.name.trim(),
            description: form.description.trim(),
            category: form.category.trim() || 'Custom',
            risk: form.risk,
            icon: form.icon || '🤖',
            color: form.color || '#21cde4',
            xml: form.xml.trim(),
        };
        const updated = [...customBots, newBot];
        setCustomBots(updated);
        saveCustomBots(updated);
        setForm(EMPTY_FORM);
        setIsAdding(false);
        setFormError('');
    };

    const handleRemoveCustom = (id: string) => {
        const updated = customBots.filter(b => b.id !== id);
        setCustomBots(updated);
        saveCustomBots(updated);
    };

    const handleRemoveDefault = (id: string) => {
        updateSettings({ deletedDefaultBots: [...deletedDefaults, id] });
        window.dispatchEvent(new Event('admin_bots_updated'));
    };

    const handleRestoreDefault = (id: string) => {
        updateSettings({ deletedDefaultBots: deletedDefaults.filter(x => x !== id) });
        window.dispatchEvent(new Event('admin_bots_updated'));
    };

    const handleXmlFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => setField('xml', ev.target?.result as string || '');
        reader.readAsText(file);
    };

    const riskColor = (r: string) =>
        r === 'High' ? '#ef4444' : r === 'Medium' ? '#f59e0b' : '#10b981';

    return (
        <div className='admin-tab__free-bots'>
            <div className='admin-tab__header'>
                <h2 className='admin-tab__title'>Manage Free Bots</h2>
                <p className='admin-tab__subtitle'>
                    Bots appear on the <strong>Free Bots</strong> tab visible to all users. Click any bot to load it into the Bot Builder.
                    You can remove <strong>any</strong> bot — including defaults.
                </p>
            </div>

            {/* ── Visible Default Bots ─────────────────────────────────────── */}
            <div className='manage-bots__section-title'>
                Default Bots ({visibleDefaults.length})
                <span className='manage-bots__section-badge'>Click ✕ to hide from users</span>
            </div>
            <div className='manage-bots__list'>
                {visibleDefaults.length === 0 && (
                    <div className='manage-bots__empty' style={{ padding: '10px 0' }}>All default bots are hidden.</div>
                )}
                {visibleDefaults.map(bot => (
                    <div key={bot.id} className='manage-bot-row'>
                        <span className='manage-bot-row__icon'>{bot.icon}</span>
                        <div className='manage-bot-row__info'>
                            <span className='manage-bot-row__name'>{bot.name}</span>
                            <span className='manage-bot-row__meta'>
                                {bot.category} · <span style={{ color: riskColor(bot.risk) }}>{bot.risk} Risk</span>
                            </span>
                        </div>
                        <div className='manage-bot-row__bar' style={{ background: bot.color }} />
                        <button
                            className='manage-bot-row__remove'
                            onClick={() => handleRemoveDefault(bot.id)}
                            title='Hide from users'
                        >✕</button>
                    </div>
                ))}
            </div>

            {/* ── Hidden Default Bots (can be restored) ────────────────────── */}
            {hiddenDefaults.length > 0 && (
                <>
                    <div className='manage-bots__section-title' style={{ marginTop: 16, opacity: 0.6 }}>
                        Hidden Default Bots ({hiddenDefaults.length})
                        <span className='manage-bots__section-badge' style={{ background: '#334155' }}>Click ↩ to restore</span>
                    </div>
                    <div className='manage-bots__list manage-bots__list--readonly'>
                        {hiddenDefaults.map(bot => (
                            <div key={bot.id} className='manage-bot-row manage-bot-row--hidden'>
                                <span className='manage-bot-row__icon' style={{ opacity: 0.4 }}>{bot.icon}</span>
                                <div className='manage-bot-row__info'>
                                    <span className='manage-bot-row__name' style={{ opacity: 0.5, textDecoration: 'line-through' }}>{bot.name}</span>
                                </div>
                                <button
                                    className='manage-bot-row__restore'
                                    onClick={() => handleRestoreDefault(bot.id)}
                                    title='Restore bot'
                                >↩ Restore</button>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* ── Custom Bots ───────────────────────────────────────────────── */}
            <div className='manage-bots__section-title' style={{ marginTop: 20 }}>
                Custom Bots ({customBots.length})
            </div>

            {customBots.length === 0 && !isAdding && (
                <div className='manage-bots__empty'>No custom bots added yet. Add one below.</div>
            )}

            {customBots.length > 0 && (
                <div className='manage-bots__list'>
                    {customBots.map(bot => (
                        <div key={bot.id} className='manage-bot-row'>
                            <span className='manage-bot-row__icon'>{bot.icon}</span>
                            <div className='manage-bot-row__info'>
                                <span className='manage-bot-row__name'>{bot.name}</span>
                                <span className='manage-bot-row__meta'>
                                    {bot.category} · <span style={{ color: riskColor(bot.risk) }}>{bot.risk} Risk</span>
                                </span>
                            </div>
                            <div className='manage-bot-row__bar' style={{ background: bot.color }} />
                            <button className='manage-bot-row__remove' onClick={() => handleRemoveCustom(bot.id)} title='Remove bot'>✕</button>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Add Bot Form ──────────────────────────────────────────────── */}
            {!isAdding ? (
                <button className='analysis-tools__add-btn' style={{ marginTop: 16 }} onClick={() => setIsAdding(true)}>
                    + Add New Bot
                </button>
            ) : (
                <div className='analysis-tools__form' style={{ marginTop: 16 }}>
                    <h3 className='analysis-tools__form-title'>Add Custom Bot</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className='admin-form__row'>
                            <label>Icon (emoji)</label>
                            <input value={form.icon} onChange={e => setField('icon', e.target.value)} maxLength={4} placeholder='🤖' />
                        </div>
                        <div className='admin-form__row'>
                            <label>Accent Color</label>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <input type='color' value={form.color} onChange={e => setField('color', e.target.value)} style={{ width: 40, height: 36, padding: 2, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 6 }} />
                                <input value={form.color} onChange={e => setField('color', e.target.value)} style={{ flex: 1 }} />
                            </div>
                        </div>
                    </div>

                    <div className='admin-form__row'>
                        <label>Bot Name *</label>
                        <input value={form.name} onChange={e => setField('name', e.target.value)} placeholder='e.g. My Martingale Bot' />
                    </div>

                    <div className='admin-form__row'>
                        <label>Description</label>
                        <input value={form.description} onChange={e => setField('description', e.target.value)} placeholder='Short description of what this bot does' />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className='admin-form__row'>
                            <label>Category</label>
                            <input value={form.category} onChange={e => setField('category', e.target.value)} placeholder='e.g. Scalping, Conservative' />
                        </div>
                        <div className='admin-form__row'>
                            <label>Risk Level</label>
                            <select
                                value={form.risk}
                                onChange={e => setField('risk', e.target.value as 'Low' | 'Medium' | 'High')}
                                style={{ background: '#1e293b', border: '1.5px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 14, padding: '10px 12px', outline: 'none', width: '100%' }}
                            >
                                {RISK_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className='admin-form__row'>
                        <label>Bot XML * (paste or upload file)</label>
                        <textarea value={form.xml} onChange={e => setField('xml', e.target.value)} placeholder='Paste the Blockly XML content here...' rows={5} style={{ fontFamily: 'monospace', fontSize: 12 }} />
                    </div>

                    <div className='admin-form__row'>
                        <label>Or upload .xml file</label>
                        <input type='file' accept='.xml,text/xml' onChange={handleXmlFile} style={{ background: '#1e293b', border: '1.5px solid #334155', borderRadius: 8, color: '#94a3b8', padding: '8px 12px' }} />
                    </div>

                    {formError && <p style={{ color: '#f87171', fontSize: 13, margin: '0 0 12px' }}>{formError}</p>}

                    <div className='analysis-tools__form-actions'>
                        <button className='admin-btn admin-btn--primary' onClick={handleAddBot}>Add Bot</button>
                        <button className='admin-btn admin-btn--ghost' onClick={() => { setIsAdding(false); setFormError(''); setForm(EMPTY_FORM); }}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FreeBots;
