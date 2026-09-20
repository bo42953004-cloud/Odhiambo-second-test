import React, { useState } from 'react';
import { useAdminPortal, TSocialLink } from '../AdminPortalContext';

const PLATFORM_META: Record<string, { label: string; emoji: string; placeholder: string }> = {
    telegram:  { label: 'Telegram',  emoji: '✈️',  placeholder: 'https://t.me/yourchannel' },
    youtube:   { label: 'YouTube',   emoji: '▶️',  placeholder: 'https://youtube.com/@yourchannel' },
    tiktok:    { label: 'TikTok',    emoji: '🎵',  placeholder: 'https://tiktok.com/@youraccount' },
    whatsapp:  { label: 'WhatsApp',  emoji: '💬',  placeholder: 'https://wa.me/1234567890' },
    twitter:   { label: 'X / Twitter', emoji: '🐦', placeholder: 'https://x.com/youraccount' },
    instagram: { label: 'Instagram', emoji: '📸',  placeholder: 'https://instagram.com/youraccount' },
    discord:   { label: 'Discord',   emoji: '🎮',  placeholder: 'https://discord.gg/yourserver' },
    facebook:  { label: 'Facebook',  emoji: '👤',  placeholder: 'https://facebook.com/yourpage' },
};

const SocialLinks: React.FC = () => {
    const { settings, updateSettings } = useAdminPortal();
    const [isAdding, setIsAdding] = useState(false);
    const [form, setForm] = useState<{ platform: string; label: string; url: string }>({
        platform: 'telegram',
        label: '',
        url: '',
    });

    const handleAdd = () => {
        if (!form.url.trim()) return;
        const meta = PLATFORM_META[form.platform] ?? PLATFORM_META.telegram;
        const link: TSocialLink = {
            id: `social-${Date.now()}`,
            platform: form.platform as TSocialLink['platform'],
            label: form.label.trim() || meta.label || form.platform,
            url: form.url.trim(),
        };
        updateSettings({ socialLinks: [...settings.socialLinks, link] });
        window.dispatchEvent(new Event('admin_settings_updated'));
        setForm({ platform: 'telegram', label: '', url: '' });
        setIsAdding(false);
    };

    const handleRemove = (id: string) => {
        updateSettings({ socialLinks: settings.socialLinks.filter(l => l.id !== id) });
        window.dispatchEvent(new Event('admin_settings_updated'));
    };

    return (
        <div className='admin-tab__social'>
            <div className='admin-tab__header'>
                <h2 className='admin-tab__title'>Social & Community Links</h2>
                <p className='admin-tab__subtitle'>
                    Add your social media links. A <strong>Telegram</strong> icon will appear next to the site logo — clicking it reveals all your platforms so users can reach you.
                </p>
            </div>

            <div className='social-preview-note'>
                <span>📌</span>
                <span>The <strong>Telegram icon</strong> always appears in the top-left header next to the logo. Clicking it opens a panel with all links below.</span>
            </div>

            {settings.socialLinks.length === 0 && !isAdding && (
                <div className='manage-bots__empty'>No social links added yet. Add one below.</div>
            )}

            <div className='social-links__list'>
                {settings.socialLinks.map(link => {
                    const meta = PLATFORM_META[link.platform];
                    return (
                        <div key={link.id} className='social-link-row'>
                            <span className='social-link-row__emoji'>{meta?.emoji || '🔗'}</span>
                            <div className='social-link-row__info'>
                                <span className='social-link-row__name'>{link.label}</span>
                                <span className='social-link-row__url'>{link.url}</span>
                            </div>
                            <button className='manage-bot-row__remove' onClick={() => handleRemove(link.id)} title='Remove'>✕</button>
                        </div>
                    );
                })}
            </div>

            {!isAdding ? (
                <button className='analysis-tools__add-btn' style={{ marginTop: 16 }} onClick={() => setIsAdding(true)}>
                    + Add Social Link
                </button>
            ) : (
                <div className='analysis-tools__form' style={{ marginTop: 16 }}>
                    <h3 className='analysis-tools__form-title'>Add Social Platform</h3>

                    <div className='admin-form__row'>
                        <label>Platform</label>
                        <select
                            value={form.platform}
                            onChange={e => setForm(p => ({ ...p, platform: e.target.value, url: '' }))}
                            style={{ background: '#1e293b', border: '1.5px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 14, padding: '10px 12px', outline: 'none', width: '100%' }}
                        >
                            {Object.entries(PLATFORM_META).map(([key, meta]) => (
                                <option key={key} value={key}>{meta.emoji} {meta.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className='admin-form__row'>
                        <label>Custom Label (optional)</label>
                        <input
                            value={form.label}
                            onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
                            placeholder={PLATFORM_META[form.platform]?.label || 'e.g. Join our community'}
                        />
                    </div>

                    <div className='admin-form__row'>
                        <label>URL *</label>
                        <input
                            value={form.url}
                            onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                            placeholder={PLATFORM_META[form.platform]?.placeholder || 'https://...'}
                            type='url'
                        />
                    </div>

                    <div className='analysis-tools__form-actions'>
                        <button className='admin-btn admin-btn--primary' onClick={handleAdd}>Add Link</button>
                        <button className='admin-btn admin-btn--ghost' onClick={() => setIsAdding(false)}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SocialLinks;
