import React, { useState } from 'react';
import { useAdminPortal } from '../AdminPortalContext';
import { DEFAULT_LANDING, TLandingFeature, TLandingStat, TLandingStep } from '../../../pages/landing';

const uid = () => Math.random().toString(36).slice(2, 10);

const LandingPageEditor: React.FC = () => {
    const { settings, updateSettings } = useAdminPortal();
    const lp = settings.landingPage ?? DEFAULT_LANDING;
    const [saved, setSaved] = useState(false);

    const patch = (p: Partial<typeof lp>) => {
        updateSettings({ landingPage: { ...lp, ...p } });
        setSaved(true);
        setTimeout(() => setSaved(false), 1800);
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    const updateFeature = (id: string, p: Partial<TLandingFeature>) => {
        patch({ features: lp.features.map(f => f.id === id ? { ...f, ...p } : f) });
    };
    const addFeature = () => patch({ features: [...lp.features, { id: uid(), icon: '⭐', title: 'New Feature', description: 'Describe this feature.' }] });
    const removeFeature = (id: string) => patch({ features: lp.features.filter(f => f.id !== id) });

    const updateStat = (id: string, p: Partial<TLandingStat>) => {
        patch({ stats: lp.stats.map(s => s.id === id ? { ...s, ...p } : s) });
    };
    const addStat = () => patch({ stats: [...lp.stats, { id: uid(), value: '0+', label: 'New Stat' }] });
    const removeStat = (id: string) => patch({ stats: lp.stats.filter(s => s.id !== id) });

    const updateStep = (i: number, p: Partial<TLandingStep>) => {
        patch({ howItWorks: lp.howItWorks.map((s, idx) => idx === i ? { ...s, ...p } : s) });
    };
    const addStep = () => patch({ howItWorks: [...lp.howItWorks, { step: String(lp.howItWorks.length + 1).padStart(2, '0'), title: 'New Step', description: 'Describe this step.' }] });
    const removeStep = (i: number) => patch({ howItWorks: lp.howItWorks.filter((_, idx) => idx !== i) });

    return (
        <div className='admin-tab__landing'>
            <div className='admin-tab__header'>
                <h2 className='admin-tab__title'>Landing Page</h2>
                <p className='admin-tab__subtitle'>Configure the public-facing landing page at <code>/landing</code>.</p>
            </div>

            {saved && <div className='landing-editor__saved'>✓ Saved automatically</div>}

            {/* ── Visibility ─────────────────────────────────────────────── */}
            <section className='landing-editor__section'>
                <h3 className='landing-editor__section-title'>🔘 Visibility</h3>
                <label className='landing-editor__toggle'>
                    <input type='checkbox' checked={lp.enabled} onChange={e => patch({ enabled: e.target.checked })} />
                    <span>Enable landing page at <code>/landing</code></span>
                </label>
                <p className='landing-editor__hint'>Users can always visit <code>/landing</code> directly. When enabled you can also link it from elsewhere.</p>
            </section>

            {/* ── Hero ───────────────────────────────────────────────────── */}
            <section className='landing-editor__section'>
                <h3 className='landing-editor__section-title'>🦸 Hero Section</h3>
                <div className='admin-form__row'>
                    <label>Main Headline</label>
                    <input value={lp.heroTitle} onChange={e => patch({ heroTitle: e.target.value })} placeholder='Automate Your Trading' />
                </div>
                <div className='admin-form__row'>
                    <label>Subtitle</label>
                    <textarea rows={2} value={lp.heroSubtitle} onChange={e => patch({ heroSubtitle: e.target.value })} placeholder='Describe your platform...' />
                </div>
                <div className='admin-form__row'>
                    <label>Tagline (small accent text)</label>
                    <input value={lp.heroTagline} onChange={e => patch({ heroTagline: e.target.value })} placeholder='No coding required. Results from day one.' />
                </div>
            </section>

            {/* ── Button Links ───────────────────────────────────────────── */}
            <section className='landing-editor__section'>
                <h3 className='landing-editor__section-title'>🔗 Buttons & Links</h3>
                <div className='landing-editor__grid-2'>
                    <div className='admin-form__row'>
                        <label>Login Button Text</label>
                        <input value={lp.loginText} onChange={e => patch({ loginText: e.target.value })} placeholder='Log In' />
                    </div>
                    <div className='admin-form__row'>
                        <label>Login URL (Deriv)</label>
                        <input value={lp.loginUrl} onChange={e => patch({ loginUrl: e.target.value })} placeholder='https://oauth.deriv.com/...' />
                    </div>
                    <div className='admin-form__row'>
                        <label>Sign Up Button Text</label>
                        <input value={lp.signupText} onChange={e => patch({ signupText: e.target.value })} placeholder='Sign Up Free' />
                    </div>
                    <div className='admin-form__row'>
                        <label>Sign Up URL (Deriv)</label>
                        <input value={lp.signupUrl} onChange={e => patch({ signupUrl: e.target.value })} placeholder='https://deriv.com/signup/' />
                    </div>
                </div>
                <div className='admin-form__row'>
                    <label>Continue to Site Button Text</label>
                    <input value={lp.continueText} onChange={e => patch({ continueText: e.target.value })} placeholder='Continue to Site' />
                </div>
            </section>

            {/* ── Stats ──────────────────────────────────────────────────── */}
            <section className='landing-editor__section'>
                <h3 className='landing-editor__section-title'>📊 Stats Bar</h3>
                <label className='landing-editor__toggle'>
                    <input type='checkbox' checked={lp.showStats} onChange={e => patch({ showStats: e.target.checked })} />
                    <span>Show stats section</span>
                </label>
                {lp.showStats && (
                    <>
                        <div className='landing-editor__list'>
                            {lp.stats.map(s => (
                                <div key={s.id} className='landing-editor__list-item'>
                                    <input style={{ width: 90 }} value={s.value} onChange={e => updateStat(s.id, { value: e.target.value })} placeholder='1M+' />
                                    <input style={{ flex: 1 }} value={s.label} onChange={e => updateStat(s.id, { label: e.target.value })} placeholder='Label' />
                                    <button className='landing-editor__remove-btn' onClick={() => removeStat(s.id)}>✕</button>
                                </div>
                            ))}
                        </div>
                        <button className='admin-btn admin-btn--secondary' onClick={addStat}>+ Add Stat</button>
                    </>
                )}
            </section>

            {/* ── Features ───────────────────────────────────────────────── */}
            <section className='landing-editor__section'>
                <h3 className='landing-editor__section-title'>⚡ Feature Cards</h3>
                <label className='landing-editor__toggle'>
                    <input type='checkbox' checked={lp.showFeatures} onChange={e => patch({ showFeatures: e.target.checked })} />
                    <span>Show features section</span>
                </label>
                {lp.showFeatures && (
                    <>
                        <div className='landing-editor__features-list'>
                            {lp.features.map(f => (
                                <div key={f.id} className='landing-editor__feature-item'>
                                    <div className='landing-editor__feature-row'>
                                        <input style={{ width: 50 }} value={f.icon} onChange={e => updateFeature(f.id, { icon: e.target.value })} placeholder='🤖' />
                                        <input style={{ flex: 1 }} value={f.title} onChange={e => updateFeature(f.id, { title: e.target.value })} placeholder='Feature title' />
                                        <button className='landing-editor__remove-btn' onClick={() => removeFeature(f.id)}>✕</button>
                                    </div>
                                    <textarea rows={2} value={f.description} onChange={e => updateFeature(f.id, { description: e.target.value })} placeholder='Feature description' />
                                </div>
                            ))}
                        </div>
                        <button className='admin-btn admin-btn--secondary' onClick={addFeature}>+ Add Feature</button>
                    </>
                )}
            </section>

            {/* ── How It Works ───────────────────────────────────────────── */}
            <section className='landing-editor__section'>
                <h3 className='landing-editor__section-title'>🗺️ How It Works</h3>
                <label className='landing-editor__toggle'>
                    <input type='checkbox' checked={lp.showHowItWorks} onChange={e => patch({ showHowItWorks: e.target.checked })} />
                    <span>Show how it works section</span>
                </label>
                {lp.showHowItWorks && (
                    <>
                        <div className='landing-editor__list'>
                            {lp.howItWorks.map((s, i) => (
                                <div key={i} className='landing-editor__step-item'>
                                    <div className='landing-editor__feature-row'>
                                        <input style={{ width: 50 }} value={s.step} onChange={e => updateStep(i, { step: e.target.value })} placeholder='01' />
                                        <input style={{ flex: 1 }} value={s.title} onChange={e => updateStep(i, { title: e.target.value })} placeholder='Step title' />
                                        <button className='landing-editor__remove-btn' onClick={() => removeStep(i)}>✕</button>
                                    </div>
                                    <textarea rows={2} value={s.description} onChange={e => updateStep(i, { description: e.target.value })} placeholder='Step description' />
                                </div>
                            ))}
                        </div>
                        <button className='admin-btn admin-btn--secondary' onClick={addStep}>+ Add Step</button>
                    </>
                )}
            </section>

            {/* ── Footer ─────────────────────────────────────────────────── */}
            <section className='landing-editor__section'>
                <h3 className='landing-editor__section-title'>📄 Footer Text</h3>
                <div className='admin-form__row'>
                    <label>Footer / Copyright Line</label>
                    <textarea rows={2} value={lp.footerText} onChange={e => patch({ footerText: e.target.value })} placeholder='© 2025 My Trading Bot...' />
                </div>
            </section>

            {/* ── Preview link ───────────────────────────────────────────── */}
            <section className='landing-editor__section landing-editor__section--preview'>
                <a href='/landing' target='_blank' rel='noopener noreferrer' className='admin-btn admin-btn--primary'>
                    🚀 Preview Landing Page
                </a>
            </section>
        </div>
    );
};

export default LandingPageEditor;
