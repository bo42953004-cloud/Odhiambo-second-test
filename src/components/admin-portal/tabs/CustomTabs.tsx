import React, { useState } from 'react';
import { useAdminPortal, TCustomTab } from '../AdminPortalContext';

const CustomTabs: React.FC = () => {
    const { settings, updateSettings } = useAdminPortal();
    const [isAdding, setIsAdding] = useState(false);
    const [form, setForm] = useState<{ name: string; icon: string; url: string }>({
        name: '',
        icon: '🔗',
        url: '',
    });
    const [error, setError] = useState('');

    const handleAdd = () => {
        if (!form.name.trim()) { setError('Tab name is required.'); return; }
        if (!form.url.trim()) { setError('URL is required.'); return; }
        const tab: TCustomTab = {
            id: `ctab-${Date.now()}`,
            name: form.name.trim(),
            icon: form.icon.trim() || '🔗',
            url: form.url.trim(),
        };
        updateSettings({ customTabs: [...settings.customTabs, tab] });
        window.dispatchEvent(new CustomEvent('admin_custom_tabs_updated'));
        setForm({ name: '', icon: '🔗', url: '' });
        setIsAdding(false);
        setError('');
    };

    const handleRemove = (id: string) => {
        updateSettings({ customTabs: settings.customTabs.filter(t => t.id !== id) });
        window.dispatchEvent(new CustomEvent('admin_custom_tabs_updated'));
    };

    const handleMoveUp = (idx: number) => {
        if (idx === 0) return;
        const tabs = [...settings.customTabs];
        [tabs[idx - 1], tabs[idx]] = [tabs[idx], tabs[idx - 1]];
        updateSettings({ customTabs: tabs });
        window.dispatchEvent(new CustomEvent('admin_custom_tabs_updated'));
    };

    const handleMoveDown = (idx: number) => {
        if (idx === settings.customTabs.length - 1) return;
        const tabs = [...settings.customTabs];
        [tabs[idx], tabs[idx + 1]] = [tabs[idx + 1], tabs[idx]];
        updateSettings({ customTabs: tabs });
        window.dispatchEvent(new CustomEvent('admin_custom_tabs_updated'));
    };

    return (
        <div className='admin-tab__custom-tabs'>
            <div className='admin-tab__header'>
                <h2 className='admin-tab__title'>Custom Navigation Tabs</h2>
                <p className='admin-tab__subtitle'>
                    Add any URL as a tab in the main navigation. Links load as iframes inside the site — no new browser tabs. Users can access them just like the built-in tabs.
                </p>
            </div>

            {settings.customTabs.length === 0 && !isAdding && (
                <div className='manage-bots__empty'>No custom tabs added yet. Add one below to get started.</div>
            )}

            <div className='custom-tabs__list'>
                {settings.customTabs.map((tab, idx) => (
                    <div key={tab.id} className='custom-tab-row'>
                        <span className='custom-tab-row__icon'>{tab.icon}</span>
                        <div className='custom-tab-row__info'>
                            <span className='custom-tab-row__name'>{tab.name}</span>
                            <span className='custom-tab-row__url'>{tab.url}</span>
                        </div>
                        <div className='custom-tab-row__actions'>
                            <button className='custom-tab-row__move' onClick={() => handleMoveUp(idx)} disabled={idx === 0} title='Move up'>↑</button>
                            <button className='custom-tab-row__move' onClick={() => handleMoveDown(idx)} disabled={idx === settings.customTabs.length - 1} title='Move down'>↓</button>
                            <button className='manage-bot-row__remove' onClick={() => handleRemove(tab.id)} title='Remove'>✕</button>
                        </div>
                    </div>
                ))}
            </div>

            {!isAdding ? (
                <button className='analysis-tools__add-btn' style={{ marginTop: 16 }} onClick={() => setIsAdding(true)}>
                    + Add Custom Tab
                </button>
            ) : (
                <div className='analysis-tools__form' style={{ marginTop: 16 }}>
                    <h3 className='analysis-tools__form-title'>New Custom Tab</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 12 }}>
                        <div className='admin-form__row'>
                            <label>Icon</label>
                            <input value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} placeholder='🔗' maxLength={4} />
                        </div>
                        <div className='admin-form__row'>
                            <label>Tab Name *</label>
                            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder='e.g. Market News' />
                        </div>
                    </div>
                    <div className='admin-form__row'>
                        <label>URL * (loads as iframe inside the site)</label>
                        <input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder='https://...' type='url' />
                    </div>
                    {error && <p style={{ color: '#f87171', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}
                    <div className='analysis-tools__form-actions'>
                        <button className='admin-btn admin-btn--primary' onClick={handleAdd}>Add Tab</button>
                        <button className='admin-btn admin-btn--ghost' onClick={() => { setIsAdding(false); setError(''); }}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomTabs;
