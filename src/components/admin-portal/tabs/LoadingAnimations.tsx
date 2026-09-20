import React from 'react';
import { useAdminPortal, TLoaderStyle } from '../AdminPortalContext';

type TLoaderOption = {
    id: TLoaderStyle;
    label: string;
    description: string;
    isAdvanced?: boolean;
};

const LOADERS: TLoaderOption[] = [
    { id: 'pulse', label: 'Pulse', description: 'A smooth breathing pulse ring.' },
    { id: 'spin', label: 'Spin', description: 'Classic rotating spinner arc.' },
    { id: 'dots', label: 'Dots', description: 'Three bouncing dots in sequence.' },
    { id: 'bars', label: 'Bars', description: 'Animated vertical audio bars.' },
    { id: 'wave', label: 'Wave', description: 'Flowing wave animation.' },
    { id: 'matrix', label: 'Matrix', description: 'Full-screen matrix digital rain with branding.', isAdvanced: true },
    { id: 'neon', label: 'Neon Glow', description: 'Full-screen neon pulse with progress bar and logo.', isAdvanced: true },
    { id: 'cinematic', label: 'Cinematic', description: 'Full-screen cinematic reveal with particles and percentage.', isAdvanced: true },
    { id: 'hologram', label: 'Hologram', description: 'Sci-fi holographic rings with scanline sweep and data streams.', isAdvanced: true },
    { id: 'glitch', label: 'Glitch', description: 'Cyberpunk RGB-split glitch effect with corrupted text.', isAdvanced: true },
    { id: 'neural', label: 'Neural Net', description: 'Animated neural-network nodes and connections visualisation.', isAdvanced: true },
];

export const LoaderPreview: React.FC<{ style: TLoaderStyle; size?: 'sm' | 'md' }> = ({ style, size = 'md' }) => {
    const cls = `loader-preview loader-preview--${style} loader-preview--${size}`;
    if (style === 'pulse') {
        return (
            <div className={cls}>
                <div className='lp-pulse__ring' />
                <div className='lp-pulse__dot' />
            </div>
        );
    }
    if (style === 'spin') {
        return (
            <div className={cls}>
                <div className='lp-spin__track' />
                <div className='lp-spin__arc' />
            </div>
        );
    }
    if (style === 'dots') {
        return (
            <div className={cls}>
                <div className='lp-dot' style={{ animationDelay: '0s' }} />
                <div className='lp-dot' style={{ animationDelay: '0.15s' }} />
                <div className='lp-dot' style={{ animationDelay: '0.3s' }} />
            </div>
        );
    }
    if (style === 'bars') {
        return (
            <div className={cls}>
                {[0, 0.1, 0.2, 0.3, 0.4].map((d, i) => (
                    <div key={i} className='lp-bar' style={{ animationDelay: `${d}s` }} />
                ))}
            </div>
        );
    }
    if (style === 'wave') {
        return (
            <div className={cls}>
                {[0, 0.1, 0.2, 0.3, 0.4, 0.5].map((d, i) => (
                    <div key={i} className='lp-wave-dot' style={{ animationDelay: `${d}s` }} />
                ))}
            </div>
        );
    }
    if (style === 'matrix') {
        return (
            <div className={cls}>
                <div className='lp-matrix'>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className='lp-matrix__col' style={{ animationDelay: `${i * 0.12}s` }}>
                            {['01', '10', '11', '00', '01'][i]}
                        </span>
                    ))}
                </div>
            </div>
        );
    }
    if (style === 'neon') {
        return (
            <div className={cls}>
                <div className='lp-neon__ring' />
                <div className='lp-neon__inner' />
            </div>
        );
    }
    if (style === 'cinematic') {
        return (
            <div className={cls}>
                <div className='lp-cinematic__bar' />
                <div className='lp-cinematic__line' />
            </div>
        );
    }
    if (style === 'hologram') {
        return (
            <div className={cls}>
                <div className='lp-hologram__ring lp-hologram__ring--1' />
                <div className='lp-hologram__ring lp-hologram__ring--2' />
                <div className='lp-hologram__core' />
            </div>
        );
    }
    if (style === 'glitch') {
        return (
            <div className={cls}>
                <span className='lp-glitch__text' data-text='LOAD'>LOAD</span>
            </div>
        );
    }
    if (style === 'neural') {
        return (
            <div className={cls}>
                {[0, 1, 2, 3, 4].map(i => (
                    <div key={i} className='lp-neural__node' style={{ animationDelay: `${i * 0.18}s` }} />
                ))}
            </div>
        );
    }
    return null;
};

// ─── Full-screen Advanced Loaders ─────────────────────────────────────────────

const MatrixLoader: React.FC<{ message?: string }> = ({ message }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [progress, setProgress] = React.useState(0);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const cols = Math.floor(canvas.width / 20);
        const drops = Array(cols).fill(1);
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@%&*';

        const draw = () => {
            ctx.fillStyle = 'rgba(0,0,0,0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#0f0';
            ctx.font = '14px monospace';
            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * 20, drops[i] * 20);
                if (drops[i] * 20 > canvas.height && Math.random() > 0.975) drops[i] = 0;
                drops[i]++;
            }
        };
        const interval = setInterval(draw, 33);
        return () => clearInterval(interval);
    }, []);

    React.useEffect(() => {
        const timer = setInterval(() => setProgress(p => Math.min(p + 2, 95)), 60);
        return () => clearInterval(timer);
    }, []);

    const siteName = (() => { try { const s = JSON.parse(localStorage.getItem('admin_portal_settings') || '{}'); return s.siteName || 'EMPIRE TRADER'; } catch { return 'EMPIRE TRADER'; } })();

    return (
        <div className='adv-loader adv-loader--matrix'>
            <canvas ref={canvasRef} className='adv-loader__canvas' />
            <div className='adv-loader__content'>
                <div className='adv-loader__brand adv-loader__brand--matrix'>{siteName}</div>
                <div className='adv-loader__message'>{message || 'Initializing...'}</div>
                <div className='adv-loader__progress-track'>
                    <div className='adv-loader__progress-fill adv-loader__progress-fill--matrix' style={{ width: `${progress}%` }} />
                </div>
                <div className='adv-loader__pct'>{progress}%</div>
            </div>
        </div>
    );
};

const NeonLoader: React.FC<{ message?: string }> = ({ message }) => {
    const [progress, setProgress] = React.useState(0);
    const siteName = (() => { try { const s = JSON.parse(localStorage.getItem('admin_portal_settings') || '{}'); return s.siteName || 'EMPIRE TRADER'; } catch { return 'EMPIRE TRADER'; } })();

    React.useEffect(() => {
        const timer = setInterval(() => setProgress(p => Math.min(p + 1.8, 95)), 55);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className='adv-loader adv-loader--neon'>
            <div className='adv-loader__neon-bg' />
            <div className='adv-loader__particles'>
                {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className='adv-loader__particle' style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 3}s`, animationDuration: `${3 + Math.random() * 4}s` }} />
                ))}
            </div>
            <div className='adv-loader__content'>
                <div className='adv-loader__neon-rings'>
                    <div className='adv-loader__neon-ring adv-loader__neon-ring--1' />
                    <div className='adv-loader__neon-ring adv-loader__neon-ring--2' />
                    <div className='adv-loader__neon-ring adv-loader__neon-ring--3' />
                    <div className='adv-loader__neon-core' />
                </div>
                <div className='adv-loader__brand adv-loader__brand--neon'>{siteName}</div>
                <div className='adv-loader__message'>{message || 'Loading platform...'}</div>
                <div className='adv-loader__progress-track adv-loader__progress-track--neon'>
                    <div className='adv-loader__progress-fill adv-loader__progress-fill--neon' style={{ width: `${progress}%` }} />
                    <div className='adv-loader__progress-glow' style={{ left: `${progress}%` }} />
                </div>
                <div className='adv-loader__pct adv-loader__pct--neon'>{Math.round(progress)}%</div>
            </div>
        </div>
    );
};

const CinematicLoader: React.FC<{ message?: string }> = ({ message }) => {
    const [progress, setProgress] = React.useState(0);
    const [phase, setPhase] = React.useState(0);
    const siteName = (() => { try { const s = JSON.parse(localStorage.getItem('admin_portal_settings') || '{}'); return s.siteName || 'EMPIRE TRADER'; } catch { return 'EMPIRE TRADER'; } })();

    React.useEffect(() => {
        const timer = setInterval(() => setProgress(p => { const next = Math.min(p + 1.5, 95); if (next > 30) setPhase(1); if (next > 70) setPhase(2); return next; }), 50);
        return () => clearInterval(timer);
    }, []);

    const phases = ['CONNECTING', 'LOADING DATA', 'READY'];

    return (
        <div className='adv-loader adv-loader--cinematic'>
            <div className='adv-loader__cinematic-grid' />
            <div className='adv-loader__cinematic-scan' />
            <div className='adv-loader__content adv-loader__content--cinematic'>
                <div className='adv-loader__cinematic-top'>
                    <span className='adv-loader__cinematic-tag'>SYS.BOOT</span>
                    <span className='adv-loader__cinematic-tag'>v2.0.1</span>
                </div>
                <div className='adv-loader__brand adv-loader__brand--cinematic'>{siteName}</div>
                <div className='adv-loader__cinematic-phase'>{phases[phase]}</div>
                <div className='adv-loader__progress-track adv-loader__progress-track--cinematic'>
                    <div className='adv-loader__progress-fill adv-loader__progress-fill--cinematic' style={{ width: `${progress}%` }} />
                </div>
                <div className='adv-loader__cinematic-stats'>
                    <span>{Math.round(progress)}%</span>
                    <span>{message || 'Initializing modules...'}</span>
                </div>
                <div className='adv-loader__cinematic-dots'>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className='adv-loader__cinematic-dot' style={{ animationDelay: `${i * 0.3}s` }} />
                    ))}
                </div>
            </div>
        </div>
    );
};

// ─── Hologram Loader ──────────────────────────────────────────────────────────

const HologramLoader: React.FC<{ message?: string }> = ({ message }) => {
    const [progress, setProgress] = React.useState(0);
    const [scanLine, setScanLine] = React.useState(0);
    const siteName = (() => { try { const s = JSON.parse(localStorage.getItem('admin_portal_settings') || '{}'); return s.siteName || 'TRADING BOT'; } catch { return 'TRADING BOT'; } })();

    React.useEffect(() => {
        const t1 = setInterval(() => setProgress(p => Math.min(p + 1.2, 95)), 50);
        const t2 = setInterval(() => setScanLine(p => (p + 2) % 100), 16);
        return () => { clearInterval(t1); clearInterval(t2); };
    }, []);

    return (
        <div className='adv-loader adv-loader--hologram'>
            <div className='adv-loader__hologram-bg' />
            {/* Scan line sweep */}
            <div className='adv-loader__hologram-scan' style={{ top: `${scanLine}%` }} />
            <div className='adv-loader__content adv-loader__content--hologram'>
                {/* Concentric rotating rings */}
                <div className='adv-loader__hologram-rings'>
                    <div className='adv-loader__hologram-ring adv-loader__hologram-ring--1' />
                    <div className='adv-loader__hologram-ring adv-loader__hologram-ring--2' />
                    <div className='adv-loader__hologram-ring adv-loader__hologram-ring--3' />
                    <div className='adv-loader__hologram-core'>
                        <span className='adv-loader__hologram-icon'>◈</span>
                    </div>
                </div>
                <div className='adv-loader__hologram-grid' />
                <div className='adv-loader__brand adv-loader__brand--hologram'>{siteName}</div>
                <div className='adv-loader__hologram-status'>
                    {['SYS_INIT', 'DATA_LINK', 'SYNCING'][Math.floor(progress / 35)] || 'SYNCING'}
                </div>
                {/* Data stream columns */}
                <div className='adv-loader__hologram-streams'>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className='adv-loader__hologram-stream' style={{ animationDelay: `${i * 0.2}s` }}>
                            {Array.from({ length: 4 }).map((_, j) => (
                                <span key={j}>{Math.random() > 0.5 ? '1' : '0'}</span>
                            ))}
                        </div>
                    ))}
                </div>
                <div className='adv-loader__progress-track adv-loader__progress-track--hologram'>
                    <div className='adv-loader__progress-fill adv-loader__progress-fill--hologram' style={{ width: `${progress}%` }} />
                </div>
                <div className='adv-loader__hologram-footer'>
                    <span>SIGNAL: LOCKED</span>
                    <span>{Math.round(progress)}%</span>
                    <span>{message || 'CONNECTING'}</span>
                </div>
            </div>
        </div>
    );
};

// ─── Glitch Loader ────────────────────────────────────────────────────────────

const GlitchLoader: React.FC<{ message?: string }> = ({ message }) => {
    const [progress, setProgress] = React.useState(0);
    const [glitching, setGlitching] = React.useState(false);
    const siteName = (() => { try { const s = JSON.parse(localStorage.getItem('admin_portal_settings') || '{}'); return s.siteName || 'TRADING BOT'; } catch { return 'TRADING BOT'; } })();

    React.useEffect(() => {
        const t1 = setInterval(() => setProgress(p => Math.min(p + 1.5, 95)), 55);
        // Random glitch bursts
        const t2 = setInterval(() => {
            setGlitching(true);
            setTimeout(() => setGlitching(false), 150 + Math.random() * 200);
        }, 1200 + Math.random() * 1500);
        return () => { clearInterval(t1); clearInterval(t2); };
    }, []);

    return (
        <div className={`adv-loader adv-loader--glitch ${glitching ? 'adv-loader--glitching' : ''}`}>
            <div className='adv-loader__glitch-bg' />
            {/* Diagonal scan bars */}
            <div className='adv-loader__glitch-bars'>
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className='adv-loader__glitch-bar' style={{ animationDelay: `${i * 0.15}s`, top: `${i * 13}%` }} />
                ))}
            </div>
            <div className='adv-loader__content adv-loader__content--glitch'>
                {/* RGB-split brand text */}
                <div className='adv-loader__glitch-brand' data-text={siteName}>
                    <span className='adv-loader__glitch-r'>{siteName}</span>
                    <span className='adv-loader__glitch-g'>{siteName}</span>
                    <span className='adv-loader__glitch-b'>{siteName}</span>
                </div>
                <div className='adv-loader__glitch-subtitle'>
                    {['SYSTEM BOOT', 'ERROR CORRECTING', 'ACCESS GRANTED', 'LOADING'][Math.floor(progress / 25)]}
                </div>
                {/* Corrupted code lines */}
                <div className='adv-loader__glitch-code'>
                    {['> INIT_SEQUENCE...', '> DECRYPT_KEYS....', '> LOAD_MODULES...', '> READY__________'].map((line, i) => (
                        <div key={i} className='adv-loader__glitch-line' style={{ opacity: progress > i * 25 ? 1 : 0.2, animationDelay: `${i * 0.2}s` }}>
                            {line}
                        </div>
                    ))}
                </div>
                <div className='adv-loader__progress-track adv-loader__progress-track--glitch'>
                    <div className='adv-loader__progress-fill adv-loader__progress-fill--glitch' style={{ width: `${progress}%` }} />
                    <div className='adv-loader__glitch-progress-noise' />
                </div>
                <div className='adv-loader__glitch-pct'>{String(Math.round(progress)).padStart(3, '0')}%</div>
                <div className='adv-loader__glitch-msg'>{message || 'CALIBRATING SYSTEMS'}</div>
            </div>
        </div>
    );
};

// ─── Neural Loader ────────────────────────────────────────────────────────────

const NeuralLoader: React.FC<{ message?: string }> = ({ message }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [progress, setProgress] = React.useState(0);
    const [nodeCount, setNodeCount] = React.useState(20);
    const siteName = (() => { try { const s = JSON.parse(localStorage.getItem('admin_portal_settings') || '{}'); return s.siteName || 'TRADING BOT'; } catch { return 'TRADING BOT'; } })();

    React.useEffect(() => {
        const t1 = setInterval(() => setProgress(p => Math.min(p + 1.3, 95)), 52);
        return () => clearInterval(t1);
    }, []);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Build a layered neural net layout
        const layers = [3, 5, 5, 4, 3];
        const nodes: { x: number; y: number; pulse: number }[] = [];
        setNodeCount(layers.reduce((a, b) => a + b, 0));
        const W = canvas.width, H = canvas.height;
        layers.forEach((count, li) => {
            const x = (W * 0.2) + (li / (layers.length - 1)) * (W * 0.6);
            for (let ni = 0; ni < count; ni++) {
                const y = H * 0.25 + (ni / (count - 1 || 1)) * H * 0.5;
                nodes.push({ x, y, pulse: Math.random() * Math.PI * 2 });
            }
        });

        // Build edges between adjacent layers
        const edges: [number, number][] = [];
        let offset = 0;
        for (let li = 0; li < layers.length - 1; li++) {
            const a = layers[li], b = layers[li + 1];
            for (let i = 0; i < a; i++) for (let j = 0; j < b; j++) edges.push([offset + i, offset + a + j]);
            offset += a;
        }

        let t = 0;
        let animId: number;
        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            t += 0.02;

            // Draw edges
            edges.forEach(([a, b]) => {
                const na = nodes[a], nb = nodes[b];
                const pulse = (Math.sin(t + na.pulse) + 1) / 2;
                ctx.beginPath();
                ctx.moveTo(na.x, na.y);
                ctx.lineTo(nb.x, nb.y);
                ctx.strokeStyle = `rgba(33, 205, 228, ${0.06 + pulse * 0.18})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            });

            // Draw nodes
            nodes.forEach(n => {
                const pulse = (Math.sin(t + n.pulse) + 1) / 2;
                const r = 4 + pulse * 4;
                ctx.beginPath();
                ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(33, 205, 228, ${0.5 + pulse * 0.5})`;
                ctx.fill();
                // Glow
                const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 3);
                grad.addColorStop(0, `rgba(33, 205, 228, ${0.3 * pulse})`);
                grad.addColorStop(1, 'rgba(33, 205, 228, 0)');
                ctx.beginPath();
                ctx.arc(n.x, n.y, r * 3, 0, Math.PI * 2);
                ctx.fillStyle = grad;
                ctx.fill();
            });

            animId = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(animId);
    }, []);

    return (
        <div className='adv-loader adv-loader--neural'>
            <canvas ref={canvasRef} className='adv-loader__canvas' />
            <div className='adv-loader__content adv-loader__content--neural'>
                <div className='adv-loader__neural-label'>NEURAL NETWORK</div>
                <div className='adv-loader__brand adv-loader__brand--neural'>{siteName}</div>
                <div className='adv-loader__neural-status'>
                    {progress < 30 ? 'INITIALISING NODES' : progress < 65 ? 'TRAINING PATHWAYS' : 'OPTIMISING WEIGHTS'}
                </div>
                <div className='adv-loader__progress-track adv-loader__progress-track--neural'>
                    <div className='adv-loader__progress-fill adv-loader__progress-fill--neural' style={{ width: `${progress}%` }} />
                </div>
                <div className='adv-loader__neural-stats'>
                    <span>NODES: {nodeCount}</span>
                    <span>{Math.round(progress)}%</span>
                    <span>{message || 'PROCESSING'}</span>
                </div>
            </div>
        </div>
    );
};

export const AdvancedLoader: React.FC<{ style: TLoaderStyle; message?: string }> = ({ style, message }) => {
    if (style === 'matrix') return <MatrixLoader message={message} />;
    if (style === 'neon') return <NeonLoader message={message} />;
    if (style === 'cinematic') return <CinematicLoader message={message} />;
    if (style === 'hologram') return <HologramLoader message={message} />;
    if (style === 'glitch') return <GlitchLoader message={message} />;
    if (style === 'neural') return <NeuralLoader message={message} />;
    return null;
};

const LoadingAnimations: React.FC = () => {
    const { settings, updateSettings } = useAdminPortal();

    const basicLoaders = LOADERS.filter(l => !l.isAdvanced);
    const advancedLoaders = LOADERS.filter(l => l.isAdvanced);

    return (
        <div className='admin-tab__loaders'>
            <div className='admin-tab__header'>
                <h2 className='admin-tab__title'>Loading Animations</h2>
                <p className='admin-tab__subtitle'>Choose the site-wide loading animation shown during page loads.</p>
            </div>

            <h3 className='loaders-section-title'>Basic Loaders</h3>
            <div className='loaders-grid'>
                {basicLoaders.map(loader => (
                    <button
                        key={loader.id}
                        className={`loader-option ${settings.loaderStyle === loader.id ? 'loader-option--active' : ''}`}
                        onClick={() => updateSettings({ loaderStyle: loader.id })}
                    >
                        <div className='loader-option__preview'>
                            <LoaderPreview style={loader.id} />
                        </div>
                        <div className='loader-option__info'>
                            <span className='loader-option__name'>{loader.label}</span>
                            <span className='loader-option__desc'>{loader.description}</span>
                        </div>
                        {settings.loaderStyle === loader.id && <span className='loader-option__check'>✓</span>}
                    </button>
                ))}
            </div>

            <h3 className='loaders-section-title loaders-section-title--advanced'>
                ⚡ Advanced Full-Screen Loaders
                <span className='loaders-advanced-badge'>PRO</span>
            </h3>
            <p className='loaders-section-subtitle'>Full-screen professional loading screens with animations, progress bars, and your site branding.</p>
            <div className='loaders-grid loaders-grid--advanced'>
                {advancedLoaders.map(loader => (
                    <button
                        key={loader.id}
                        className={`loader-option loader-option--advanced ${settings.loaderStyle === loader.id ? 'loader-option--active' : ''}`}
                        onClick={() => updateSettings({ loaderStyle: loader.id })}
                    >
                        <div className='loader-option__preview loader-option__preview--advanced'>
                            <LoaderPreview style={loader.id} />
                        </div>
                        <div className='loader-option__info'>
                            <span className='loader-option__name'>{loader.label}</span>
                            <span className='loader-option__desc'>{loader.description}</span>
                        </div>
                        {settings.loaderStyle === loader.id && <span className='loader-option__check'>✓</span>}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default LoadingAnimations;
