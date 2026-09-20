import React, { useRef, useState } from 'react';
import { useAdminPortal, applyColors, THEME_PRESETS, type TLogoTextAnimation, type TThemePreset } from '../AdminPortalContext';

const LOGO_ANIMATIONS: { id: TLogoTextAnimation; label: string; desc: string }[] = [
    { id: 'none',     label: 'None',     desc: 'Static — no animation' },
    { id: 'pulse',    label: 'Pulse',    desc: 'Smooth opacity breathing' },
    { id: 'glow',     label: 'Glow',     desc: 'Color glow surge' },
    { id: 'rainbow',  label: 'Rainbow',  desc: 'Cycling hue gradient' },
    { id: 'neon',     label: 'Neon',     desc: 'Electric neon flicker' },
    { id: 'shimmer',  label: 'Shimmer',  desc: 'Diagonal light sweep' },
    { id: 'wave',     label: 'Wave',     desc: 'Bouncing letter wave' },
    { id: 'glitch',   label: 'Glitch',   desc: 'RGB-split burst glitch' },
];

const SiteCustomization: React.FC = () => {
    const { settings, updateSettings } = useAdminPortal();
    const fileRef = useRef<HTMLInputElement>(null);
    const [saved, setSaved] = useState(false);
    const [local, setLocal] = useState({
        colorActiveTab: settings.colorActiveTab,
        colorInactiveTab: settings.colorInactiveTab,
        colorPrimary: settings.colorPrimary,
        colorBackground: settings.colorBackground,
        themePreset: settings.themePreset,
        siteName: settings.siteName,
        aboutText: settings.aboutText,
        logoTextAnimation: settings.logoTextAnimation as TLogoTextAnimation,
    });
    const [ann, setAnn] = useState({
        enabled: settings.announcement.enabled,
        text: settings.announcement.text,
        bgColor: settings.announcement.bgColor,
        textColor: settings.announcement.textColor,
        speed: settings.announcement.speed,
    });

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            const url = ev.target?.result as string;
            updateSettings({ logoUrl: url });
        };
        reader.readAsDataURL(file);
    };

    const handleSave = () => {
        updateSettings({ ...local, announcement: ann });
        applyColors(local);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleThemeSelect = (themeId: TThemePreset) => {
        const theme = THEME_PRESETS.find(item => item.id === themeId);
        if (!theme) return;
        const next = {
            themePreset: theme.id,
            colorPrimary: theme.colors.primary,
            colorActiveTab: theme.colors.activeTab,
            colorInactiveTab: theme.colors.inactiveTab,
            colorBackground: theme.colors.background,
        };
        setLocal(p => ({ ...p, ...next }));
        updateSettings(next);
        applyColors({ ...local, ...next });
    };

    // Live preview: dispatch animation change immediately so header updates
    const handleAnimChange = (id: TLogoTextAnimation) => {
        setLocal(p => ({ ...p, logoTextAnimation: id }));
        // Immediately push to localStorage + fire event so LogoMark reacts
        try {
            const raw = localStorage.getItem('admin_portal_settings') || '{}';
            const parsed = JSON.parse(raw);
            localStorage.setItem('admin_portal_settings', JSON.stringify({ ...parsed, logoTextAnimation: id }));
            window.dispatchEvent(new Event('admin_settings_updated'));
        } catch { /* ignore */ }
    };

    const clearLogo = () => updateSettings({ logoUrl: '' });

    const handlePasswordChange = () => {
        const current = prompt('Enter current password:');
        if (current !== settings.password) { alert('Wrong password.'); return; }
        const next = prompt('Enter new password (min 6 chars):');
        if (!next || next.length < 6) { alert('Password too short.'); return; }
        const confirm = prompt('Confirm new password:');
        if (next !== confirm) { alert('Passwords do not match.'); return; }
        updateSettings({ password: next });
        alert('Password updated!');
    };

    return (
        <div className='admin-tab__customize'>
            <div className='admin-tab__header'>
                <h2 className='admin-tab__title'>Site Customization</h2>
                <p className='admin-tab__subtitle'>Control branding, colors, and site identity.</p>
            </div>

            <div className='customize-sections'>
                <section className='customize-section'>
                    <h3 className='customize-section__title'>🪄 Automatic Site Themes</h3>
                    <p className='customize-section__hint'>
                        Pick a complete visual direction inspired by modern Deriv trading dashboards. Existing features and tabs stay intact; only the visual system changes.
                    </p>
                    <div className='theme-preset-grid'>
                        {THEME_PRESETS.map(theme => (
                            <button
                                key={theme.id}
                                type='button'
                                className={`theme-preset ${local.themePreset === theme.id ? 'theme-preset--active' : ''}`}
                                onClick={() => handleThemeSelect(theme.id)}
                            >
                                <span
                                    className='theme-preset__swatches'
                                    style={{
                                        background: `linear-gradient(135deg, ${theme.colors.background} 0 52%, ${theme.colors.surface} 52% 100%)`,
                                    }}
                                >
                                    <i style={{ background: theme.colors.primary }} />
                                    <i style={{ background: theme.colors.activeTab }} />
                                    <i style={{ background: theme.colors.surfaceStrong }} />
                                </span>
                                <span className='theme-preset__copy'>
                                    <strong>{theme.label}</strong>
                                    <small>{theme.description}</small>
                                </span>
                                <span className='theme-preset__check'>{local.themePreset === theme.id ? '✓' : '○'}</span>
                            </button>
                        ))}
                    </div>
                </section>

                <section className='customize-section'>
                    <h3 className='customize-section__title'>🖼️ Logo & Branding</h3>
                    <div className='logo-upload'>
                        {settings.logoUrl ? (
                            <div className='logo-preview'>
                                <img src={settings.logoUrl} alt='Site logo' />
                                <button className='admin-btn admin-btn--danger' onClick={clearLogo}>Remove Logo</button>
                            </div>
                        ) : (
                            <div className='logo-placeholder' onClick={() => fileRef.current?.click()}>
                                <span>📷</span>
                                <p>Click to upload logo</p>
                            </div>
                        )}
                        <input ref={fileRef} type='file' accept='image/*' onChange={handleLogoUpload} style={{ display: 'none' }} />
                        <button className='admin-btn admin-btn--secondary' onClick={() => fileRef.current?.click()}>
                            {settings.logoUrl ? 'Change Logo' : 'Upload Logo'}
                        </button>
                    </div>
                    <div className='admin-form__row'>
                        <label>Site Name</label>
                        <input
                            value={local.siteName}
                            onChange={e => setLocal(p => ({ ...p, siteName: e.target.value }))}
                            placeholder='My Trading Bot'
                        />
                    </div>
                    <div className='admin-form__row'>
                        <label>About / Description</label>
                        <textarea
                            value={local.aboutText}
                            onChange={e => setLocal(p => ({ ...p, aboutText: e.target.value }))}
                            placeholder='Describe your platform...'
                            rows={4}
                        />
                    </div>
                </section>

                <section className='customize-section'>
                    <h3 className='customize-section__title'>✨ Logo Text Animation</h3>
                    <p className='customize-section__hint'>
                        Choose an animation for the brand name next to the logo. Changes preview live.
                    </p>
                    <div className='anim-picker'>
                        {LOGO_ANIMATIONS.map(({ id, label, desc }) => (
                            <button
                                key={id}
                                className={`anim-picker__btn ${local.logoTextAnimation === id ? 'anim-picker__btn--active' : ''}`}
                                onClick={() => handleAnimChange(id)}
                                type='button'
                                title={desc}
                            >
                                <span className={`anim-picker__preview app-header__logo-text--${id !== 'none' ? id : ''}`}
                                    data-text={label}>
                                    {label}
                                </span>
                                <span className='anim-picker__desc'>{desc}</span>
                            </button>
                        ))}
                    </div>
                </section>

                <section className='customize-section'>
                    <h3 className='customize-section__title'>🎨 Color Scheme</h3>
                    <div className='color-grid'>
                        {[
                            { key: 'colorActiveTab' as const, label: 'Active Tab Color' },
                            { key: 'colorInactiveTab' as const, label: 'Inactive Tab Color' },
                            { key: 'colorPrimary' as const, label: 'Primary / Accent Color' },
                            { key: 'colorBackground' as const, label: 'Background Color' },
                        ].map(({ key, label }) => (
                            <div key={key} className='color-row'>
                                <label>{label}</label>
                                <div className='color-row__input'>
                                    <input
                                        type='color'
                                        value={local[key]}
                                        onChange={e => setLocal(p => ({ ...p, [key]: e.target.value }))}
                                    />
                                    <input
                                        type='text'
                                        value={local[key]}
                                        onChange={e => setLocal(p => ({ ...p, [key]: e.target.value }))}
                                        maxLength={9}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className='color-preview'>
                        <div className='color-swatch' style={{ background: local.colorBackground }}>
                            <span className='color-swatch__tab' style={{ background: local.colorActiveTab }}>Active</span>
                            <span className='color-swatch__tab' style={{ background: local.colorInactiveTab, opacity: 0.7 }}>Inactive</span>
                            <span className='color-swatch__accent' style={{ color: local.colorPrimary }}>● Accent</span>
                        </div>
                    </div>
                </section>

                <section className='customize-section'>
                    <h3 className='customize-section__title'>📢 Announcement Ticker</h3>
                    <p className='customize-section__hint'>
                        A scrolling notification bar shown below the header to all visitors. Traders can dismiss it per session.
                    </p>

                    <div className='admin-form__row admin-form__row--toggle'>
                        <label>Enable Ticker</label>
                        <button
                            className={`admin-toggle ${ann.enabled ? 'admin-toggle--on' : ''}`}
                            onClick={() => setAnn(p => ({ ...p, enabled: !p.enabled }))}
                            type='button'
                        >
                            <span className='admin-toggle__track' />
                            <span className='admin-toggle__thumb' />
                        </button>
                        <span className='admin-toggle__label'>{ann.enabled ? 'On' : 'Off'}</span>
                    </div>

                    <div className='admin-form__row'>
                        <label>Message</label>
                        <textarea
                            value={ann.text}
                            onChange={e => setAnn(p => ({ ...p, text: e.target.value }))}
                            placeholder='🚀 Special offer today — use code TRADE10 for a bonus!'
                            rows={3}
                        />
                    </div>

                    <div className='color-grid'>
                        {([
                            { key: 'bgColor' as const,   label: 'Background Color' },
                            { key: 'textColor' as const, label: 'Text / Glow Color' },
                        ] as const).map(({ key, label }) => (
                            <div key={key} className='color-row'>
                                <label>{label}</label>
                                <div className='color-row__input'>
                                    <input
                                        type='color'
                                        value={ann[key]}
                                        onChange={e => setAnn(p => ({ ...p, [key]: e.target.value }))}
                                    />
                                    <input
                                        type='text'
                                        value={ann[key]}
                                        onChange={e => setAnn(p => ({ ...p, [key]: e.target.value }))}
                                        maxLength={9}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className='admin-form__row'>
                        <label>Scroll Speed — {ann.speed}s for one full pass (lower = faster)</label>
                        <input
                            type='range'
                            min={8}
                            max={80}
                            step={1}
                            value={ann.speed}
                            onChange={e => setAnn(p => ({ ...p, speed: Number(e.target.value) }))}
                            style={{ width: '100%', accentColor: ann.textColor }}
                        />
                    </div>

                    {ann.text && (
                        <div
                            className='ann-preview'
                            style={{
                                background: ann.bgColor,
                                color: ann.textColor,
                                border: `1px solid ${ann.textColor}44`,
                                textShadow: `0 0 8px ${ann.textColor}88`,
                            }}
                        >
                            📢 {ann.text}
                        </div>
                    )}
                </section>

                <section className='customize-section'>
                    <h3 className='customize-section__title'>🔐 Security</h3>
                    <button className='admin-btn admin-btn--secondary' onClick={handlePasswordChange}>
                        Change Admin Password
                    </button>
                </section>
            </div>

            <div className='customize-footer'>
                <button className={`admin-btn admin-btn--primary ${saved ? 'admin-btn--saved' : ''}`} onClick={handleSave}>
                    {saved ? '✓ Saved!' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};

export default SiteCustomization;
