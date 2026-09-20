import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './landing.scss';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type TLandingFeature = { id: string; icon: string; title: string; description: string };
export type TLandingStat    = { id: string; value: string; label: string };
export type TLandingStep    = { step: string; title: string; description: string };
export type TLandingPage = {
    enabled: boolean;
    heroTitle: string;
    heroSubtitle: string;
    heroTagline: string;
    loginUrl: string;
    signupUrl: string;
    loginText: string;
    signupText: string;
    continueText: string;
    stats: TLandingStat[];
    features: TLandingFeature[];
    howItWorks: TLandingStep[];
    footerText: string;
    showStats: boolean;
    showFeatures: boolean;
    showHowItWorks: boolean;
};

export const DEFAULT_LANDING: TLandingPage = {
    enabled: true,
    heroTitle: 'Automate Your Trading',
    heroSubtitle: 'Professional-grade trading bots powered by the Deriv ecosystem. Build, backtest, and deploy in minutes.',
    heroTagline: 'No coding required. Results from day one.',
    loginUrl: 'https://oauth.deriv.com/oauth2/authorize?app_id=',
    signupUrl: 'https://deriv.com/signup/',
    loginText: 'Log In',
    signupText: 'Sign Up Free',
    continueText: 'Continue to Site',
    showStats: true,
    stats: [
        { id: '1', value: '50K+', label: 'Active Traders' },
        { id: '2', value: '1M+', label: 'Trades Executed' },
        { id: '3', value: '99.9%', label: 'Uptime' },
        { id: '4', value: '24/7', label: 'Market Access' },
    ],
    showFeatures: true,
    features: [
        { id: '1', icon: '🤖', title: 'Ready-Made Bots', description: 'Launch proven trading strategies instantly from our free bot library — no setup needed.' },
        { id: '2', icon: '🧩', title: 'Visual Bot Builder', description: 'Drag-and-drop Blockly interface lets you build custom strategies without writing a single line of code.' },
        { id: '3', icon: '⚡', title: 'Reliable Execution', description: 'Run your strategy through the platform’s normal, stable trade execution flow.' },
        { id: '4', icon: '📊', title: 'Advanced Charts', description: 'Integrated TradingView charts with 100+ indicators to sharpen your market analysis.' },
        { id: '5', icon: '🔒', title: 'Secure & Regulated', description: 'Powered by Deriv, a regulated broker trusted by millions worldwide for over 20 years.' },
        { id: '6', icon: '🌍', title: 'Global Markets', description: 'Trade forex, stocks, crypto, synthetic indices and commodities — all in one place.' },
    ],
    showHowItWorks: true,
    howItWorks: [
        { step: '01', title: 'Create an Account', description: 'Sign up with Deriv for free in under 2 minutes and get access to your trading dashboard.' },
        { step: '02', title: 'Choose a Bot or Build One', description: 'Pick a pre-built strategy from our free bot library or design your own with the visual builder.' },
        { step: '03', title: 'Run & Profit', description: 'Deploy your bot, monitor performance in real time, and let automation do the heavy lifting.' },
    ],
    footerText: '© 2025 Trading Bot. Powered by Deriv. Trading involves risk. Please trade responsibly.',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getLandingSettings(): TLandingPage {
    try {
        const raw = localStorage.getItem('admin_portal_settings');
        if (raw) {
            const s = JSON.parse(raw);
            if (s.landingPage) {
                return { ...DEFAULT_LANDING, ...s.landingPage };
            }
        }
    } catch { /* ignore */ }
    return DEFAULT_LANDING;
}

function getLogoUrl(): string {
    try {
        const raw = localStorage.getItem('admin_portal_settings');
        if (raw) { const s = JSON.parse(raw); return s.logoUrl || ''; }
    } catch { /* ignore */ }
    return '';
}

function getSiteName(): string {
    try {
        const raw = localStorage.getItem('admin_portal_settings');
        if (raw) { const s = JSON.parse(raw); return s.siteName || 'Trading Bot'; }
    } catch { /* ignore */ }
    return 'Trading Bot';
}

function getPrimaryColor(): string {
    try {
        const raw = localStorage.getItem('admin_portal_settings');
        if (raw) { const s = JSON.parse(raw); return s.colorPrimary || '#21cde4'; }
    } catch { /* ignore */ }
    return '#21cde4';
}

// ─── Particle canvas ──────────────────────────────────────────────────────────

const ParticleCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animId: number;
        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        resize();
        window.addEventListener('resize', resize);

        const count = Math.min(Math.floor(window.innerWidth / 12), 80);
        const particles = Array.from({ length: count }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: 0.5 + Math.random() * 1.5,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            opacity: 0.2 + Math.random() * 0.5,
        }));

        const color = getPrimaryColor();

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = color + Math.floor(p.opacity * 255).toString(16).padStart(2, '0');
                ctx.fill();
            });
            // Draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = color + Math.floor((1 - dist / 120) * 40).toString(16).padStart(2, '0');
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
            animId = requestAnimationFrame(draw);
        };
        draw();
        return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
    }, []);

    return <canvas ref={canvasRef} className='landing__particle-canvas' />;
};

// ─── Counter animation hook ────────────────────────────────────────────────────

function useCountUp(target: string, inView: boolean) {
    const [display, setDisplay] = useState('0');
    useEffect(() => {
        if (!inView) return;
        const numeric = parseFloat(target.replace(/[^0-9.]/g, ''));
        const suffix = target.replace(/[0-9.]/g, '');
        if (isNaN(numeric)) { setDisplay(target); return; }
        let start = 0;
        const step = numeric / 40;
        const timer = setInterval(() => {
            start = Math.min(start + step, numeric);
            const rounded = numeric < 10 ? start.toFixed(1) : Math.round(start).toString();
            setDisplay(rounded + suffix);
            if (start >= numeric) clearInterval(timer);
        }, 40);
        return () => clearInterval(timer);
    }, [inView, target]);
    return display;
}

// ─── Stat card ────────────────────────────────────────────────────────────────

const StatCard: React.FC<{ stat: TLandingStat; inView: boolean }> = ({ stat, inView }) => {
    const value = useCountUp(stat.value, inView);
    return (
        <div className='landing__stat'>
            <span className='landing__stat-value'>{value}</span>
            <span className='landing__stat-label'>{stat.label}</span>
        </div>
    );
};

// ─── Main component ───────────────────────────────────────────────────────────

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [lp, setLp] = useState<TLandingPage>(getLandingSettings);
    const [logoUrl, setLogoUrl] = useState(getLogoUrl);
    const [siteName, setSiteName] = useState(getSiteName);
    const [statsInView, setStatsInView] = useState(false);
    const statsRef = useRef<HTMLDivElement>(null);

    // Re-read settings when admin saves
    useEffect(() => {
        const handler = () => {
            setLp(getLandingSettings());
            setLogoUrl(getLogoUrl());
            setSiteName(getSiteName());
        };
        window.addEventListener('admin_settings_updated', handler);
        return () => window.removeEventListener('admin_settings_updated', handler);
    }, []);

    // Intersection observer for stats counter
    useEffect(() => {
        const el = statsRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) setStatsInView(true);
        }, { threshold: 0.3 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    const primaryColor = getPrimaryColor();

    return (
        <div className='landing' style={{ '--landing-accent': primaryColor } as React.CSSProperties}>
            {/* ── Hero ──────────────────────────────────────────────────────── */}
            <section className='landing__hero'>
                <ParticleCanvas />
                <div className='landing__hero-glow landing__hero-glow--1' />
                <div className='landing__hero-glow landing__hero-glow--2' />

                <nav className='landing__nav'>
                    <div className='landing__nav-brand'>
                        {logoUrl
                            ? <img src={logoUrl} alt={siteName} className='landing__nav-logo' />
                            : <span className='landing__nav-badge'>{siteName.charAt(0).toUpperCase()}</span>
                        }
                        <span className='landing__nav-name'>{siteName}</span>
                    </div>
                    <div className='landing__nav-actions'>
                        {lp.loginUrl && (
                            <a href={lp.loginUrl} className='landing__nav-login' target='_blank' rel='noopener noreferrer'>
                                {lp.loginText || 'Log In'}
                            </a>
                        )}
                        {lp.signupUrl && (
                            <a href={lp.signupUrl} className='landing__btn landing__btn--outline-sm' target='_blank' rel='noopener noreferrer'>
                                {lp.signupText || 'Sign Up'}
                            </a>
                        )}
                    </div>
                </nav>

                <div className='landing__hero-content'>
                    <div className='landing__hero-eyebrow'>
                        <span className='landing__eyebrow-dot' />
                        Automated Trading Platform
                    </div>
                    <h1 className='landing__hero-title'>
                        {lp.heroTitle || 'Automate Your Trading'}
                    </h1>
                    <p className='landing__hero-subtitle'>{lp.heroSubtitle}</p>
                    {lp.heroTagline && (
                        <p className='landing__hero-tagline'>{lp.heroTagline}</p>
                    )}

                    <div className='landing__hero-ctas'>
                        {lp.signupUrl && (
                            <a href={lp.signupUrl} className='landing__btn landing__btn--primary' target='_blank' rel='noopener noreferrer'>
                                <span>🚀</span> {lp.signupText || 'Sign Up Free'}
                            </a>
                        )}
                        {lp.loginUrl && (
                            <a href={lp.loginUrl} className='landing__btn landing__btn--secondary' target='_blank' rel='noopener noreferrer'>
                                <span>🔑</span> {lp.loginText || 'Log In'}
                            </a>
                        )}
                        <button className='landing__btn landing__btn--ghost' onClick={() => { sessionStorage.setItem('app_entered', '1'); navigate('/'); }}>
                            <span>⚡</span> {lp.continueText || 'Continue to Site'}
                        </button>
                    </div>

                    <div className='landing__hero-trust'>
                        <span>✓ Free to start</span>
                        <span>✓ No credit card</span>
                        <span>✓ Regulated broker</span>
                    </div>
                </div>

                <div className='landing__hero-scroll'>
                    <div className='landing__scroll-indicator' />
                </div>
            </section>

            {/* ── Stats ─────────────────────────────────────────────────────── */}
            {lp.showStats && lp.stats.length > 0 && (
                <section className='landing__stats-section' ref={statsRef}>
                    <div className='landing__container'>
                        <div className='landing__stats-grid'>
                            {lp.stats.map(stat => (
                                <StatCard key={stat.id} stat={stat} inView={statsInView} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── Features ──────────────────────────────────────────────────── */}
            {lp.showFeatures && lp.features.length > 0 && (
                <section className='landing__section landing__features'>
                    <div className='landing__container'>
                        <div className='landing__section-header'>
                            <span className='landing__section-tag'>CAPABILITIES</span>
                            <h2 className='landing__section-title'>Everything you need to trade smarter</h2>
                            <p className='landing__section-subtitle'>
                                A complete automated trading toolkit built on Deriv's powerful infrastructure.
                            </p>
                        </div>
                        <div className='landing__features-grid'>
                            {lp.features.map((f, i) => (
                                <div key={f.id} className='landing__feature-card' style={{ animationDelay: `${i * 0.08}s` }}>
                                    <div className='landing__feature-icon'>{f.icon}</div>
                                    <h3 className='landing__feature-title'>{f.title}</h3>
                                    <p className='landing__feature-desc'>{f.description}</p>
                                    <div className='landing__feature-line' />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── How It Works ──────────────────────────────────────────────── */}
            {lp.showHowItWorks && lp.howItWorks.length > 0 && (
                <section className='landing__section landing__how'>
                    <div className='landing__container'>
                        <div className='landing__section-header'>
                            <span className='landing__section-tag'>PROCESS</span>
                            <h2 className='landing__section-title'>Get started in three steps</h2>
                        </div>
                        <div className='landing__steps'>
                            {lp.howItWorks.map((step, i) => (
                                <div key={i} className='landing__step'>
                                    <div className='landing__step-number'>{step.step}</div>
                                    <div className='landing__step-connector' />
                                    <div className='landing__step-content'>
                                        <h3 className='landing__step-title'>{step.title}</h3>
                                        <p className='landing__step-desc'>{step.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── Markets strip ─────────────────────────────────────────────── */}
            <section className='landing__markets'>
                <div className='landing__container'>
                    <div className='landing__section-header'>
                        <span className='landing__section-tag'>MARKETS</span>
                        <h2 className='landing__section-title'>Trade any market, any time</h2>
                    </div>
                    <div className='landing__markets-grid'>
                        {[
                            { icon: '💱', label: 'Forex', desc: '70+ currency pairs' },
                            { icon: '📈', label: 'Synthetic Indices', desc: '24/7 volatility markets' },
                            { icon: '🪙', label: 'Crypto', desc: 'BTC, ETH & more' },
                            { icon: '🏢', label: 'Stocks', desc: 'US & global equities' },
                            { icon: '🛢️', label: 'Commodities', desc: 'Gold, oil, silver' },
                            { icon: '📊', label: 'Basket Indices', desc: 'Currency & stock baskets' },
                        ].map((m, i) => (
                            <div key={i} className='landing__market-chip'>
                                <span className='landing__market-icon'>{m.icon}</span>
                                <span className='landing__market-label'>{m.label}</span>
                                <span className='landing__market-desc'>{m.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA Section ───────────────────────────────────────────────── */}
            <section className='landing__cta-section'>
                <div className='landing__cta-glow' />
                <div className='landing__container'>
                    <div className='landing__cta-content'>
                        <h2 className='landing__cta-title'>Ready to automate your trading?</h2>
                        <p className='landing__cta-subtitle'>
                            Join thousands of traders who have already automated their strategies.
                            Start free, no credit card required.
                        </p>
                        <div className='landing__cta-buttons'>
                            {lp.signupUrl && (
                                <a href={lp.signupUrl} className='landing__btn landing__btn--primary landing__btn--large' target='_blank' rel='noopener noreferrer'>
                                    🚀 {lp.signupText || 'Sign Up Free'}
                                </a>
                            )}
                            <button className='landing__btn landing__btn--ghost landing__btn--large' onClick={() => { sessionStorage.setItem('app_entered', '1'); navigate('/'); }}>
                                ⚡ {lp.continueText || 'Continue to Site'}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Risk Disclosure ───────────────────────────────────────────── */}
            <section className='landing__disclosure'>
                <div className='landing__container'>
                    <p>
                        <strong>Risk Disclosure:</strong> Trading involves significant risk. Past performance
                        is not indicative of future results. Automated trading does not guarantee profit.
                        Only trade with funds you can afford to lose. Please ensure you understand the risks
                        before trading.
                    </p>
                </div>
            </section>

            {/* ── Footer ────────────────────────────────────────────────────── */}
            <footer className='landing__footer'>
                <div className='landing__container'>
                    <div className='landing__footer-brand'>
                        {logoUrl
                            ? <img src={logoUrl} alt={siteName} className='landing__footer-logo' />
                            : <span className='landing__footer-badge'>{siteName.charAt(0).toUpperCase()}</span>
                        }
                        <span className='landing__footer-name'>{siteName}</span>
                    </div>
                    <p className='landing__footer-text'>{lp.footerText}</p>
                    <div className='landing__footer-links'>
                        {lp.loginUrl && <a href={lp.loginUrl} target='_blank' rel='noopener noreferrer'>{lp.loginText || 'Log In'}</a>}
                        {lp.signupUrl && <a href={lp.signupUrl} target='_blank' rel='noopener noreferrer'>{lp.signupText || 'Sign Up'}</a>}
                        <button onClick={() => { sessionStorage.setItem('app_entered', '1'); navigate('/'); }}>Enter Platform</button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
