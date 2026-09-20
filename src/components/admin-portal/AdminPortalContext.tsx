import React, { createContext, useContext, useEffect, useState } from 'react';
import { setPreviewLogo, setPreviewAppName } from '@/utils/live-branding-store';

export type TLoaderStyle = 'pulse' | 'spin' | 'dots' | 'bars' | 'wave' | 'matrix' | 'neon' | 'cinematic' | 'hologram' | 'glitch' | 'neural' | 'orbit';
export type TLogoTextAnimation = 'none' | 'pulse' | 'glow' | 'rainbow' | 'neon' | 'shimmer' | 'wave' | 'glitch';
export type TThemePreset = 'dbot-neon' | 'empire-gold' | 'money-ai' | 'midnight-terminal';

export type TThemeDefinition = {
    id: TThemePreset;
    label: string;
    description: string;
    colors: {
        primary: string;
        activeTab: string;
        inactiveTab: string;
        background: string;
        surface: string;
        surfaceStrong: string;
        text: string;
        muted: string;
        border: string;
    };
};

export const THEME_PRESETS: TThemeDefinition[] = [
    {
        id: 'dbot-neon',
        label: 'D-Bot Neon',
        description: 'Deep blue workspace with cyan energy and glass panels.',
        colors: {
            primary: '#21cde4', activeTab: '#21cde4', inactiveTab: '#334155',
            background: '#071521', surface: '#0d2231', surfaceStrong: '#102d40',
            text: '#f4fbff', muted: '#86a6b8', border: '#1b4459',
        },
    },
    {
        id: 'empire-gold',
        label: 'Empire Gold',
        description: 'Executive navy surfaces with warm gold trading accents.',
        colors: {
            primary: '#e5b84b', activeTab: '#f5c957', inactiveTab: '#4b5563',
            background: '#0d1018', surface: '#171b27', surfaceStrong: '#222838',
            text: '#fffaf0', muted: '#a9a6a0', border: '#5a4a29',
        },
    },
    {
        id: 'money-ai',
        label: 'AI Money',
        description: 'Futuristic violet glass with mint-green action states.',
        colors: {
            primary: '#8b7cff', activeTab: '#a78bfa', inactiveTab: '#4b5563',
            background: '#100c1d', surface: '#1b1630', surfaceStrong: '#282044',
            text: '#fbfaff', muted: '#afa7ca', border: '#51417f',
        },
    },
    {
        id: 'midnight-terminal',
        label: 'Midnight Terminal',
        description: 'High-contrast black terminal with lime execution signals.',
        colors: {
            primary: '#a3e635', activeTab: '#bef264', inactiveTab: '#3f4a35',
            background: '#080b09', surface: '#111713', surfaceStrong: '#192219',
            text: '#f3fce9', muted: '#93a88d', border: '#344b32',
        },
    },
];

// ─── Landing page settings ────────────────────────────────────────────────────
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

export type TAnalysisTool = {
    id: string;
    name: string;
    description: string;
    url: string;
    icon: string;
};

export type TSocialLink = {
    id: string;
    platform: 'telegram' | 'youtube' | 'tiktok' | 'whatsapp' | 'twitter' | 'instagram' | 'discord' | 'facebook';
    label: string;
    url: string;
};

export type TCustomTab = {
    id: string;
    name: string;
    icon: string;
    url: string;
};

export type TAnnouncementSettings = {
    enabled: boolean;
    text: string;
    bgColor: string;
    textColor: string;
    speed: number;
};

export type TCustomBlock = {
    id: string;
    name: string;
    code: string;
};

export type TAdminSettings = {
    password: string;
    logoUrl: string;
    siteName: string;
    aboutText: string;
    colorActiveTab: string;
    colorInactiveTab: string;
    colorPrimary: string;
    colorBackground: string;
    themePreset: TThemePreset;
    loaderStyle: TLoaderStyle;
    logoTextAnimation: TLogoTextAnimation;
    analysisTools: TAnalysisTool[];
    socialLinks: TSocialLink[];
    customTabs: TCustomTab[];
    deletedDefaultBots: string[];
    announcement: TAnnouncementSettings;
    customBlocks: TCustomBlock[];
    derivAppId: string;
    derivCallbackDomain: string;
    landingPage: TLandingPage;
};

const DEFAULT_ANALYSIS_TOOLS: TAnalysisTool[] = [
    { id: 'tradingview', name: 'TradingView Chart', description: 'Advanced charting with 100+ indicators and drawing tools.', url: 'https://charts.deriv.com', icon: '📊' },
    { id: 'volatility-calculator', name: 'Volatility Calculator', description: 'Calculate historical volatility and implied volatility metrics.', url: 'https://deriv.com/trading-tools/', icon: '📐' },
    { id: 'economic-calendar', name: 'Economic Calendar', description: 'Track market-moving economic events and announcements.', url: 'https://deriv.com/economic-calendar/', icon: '📅' },
    { id: 'pip-calculator', name: 'Pip & Profit Calculator', description: 'Calculate pip value and potential profit/loss before trading.', url: 'https://deriv.com/trading-tools/', icon: '🧮' },
];

const DEFAULT_LANDING_PAGE: TLandingPage = {
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
        { id: '1', icon: '🤖', title: 'Ready-Made Bots', description: 'Launch proven trading strategies instantly from our free bot library.' },
        { id: '2', icon: '🧩', title: 'Visual Bot Builder', description: 'Drag-and-drop Blockly interface — no code required.' },
        { id: '3', icon: '⚡', title: 'Reliable Execution', description: 'Run your strategy through the platform’s normal, stable trade execution flow.' },
        { id: '4', icon: '📊', title: 'Advanced Charts', description: 'TradingView integration with 100+ indicators.' },
        { id: '5', icon: '🔒', title: 'Secure & Regulated', description: 'Powered by Deriv, regulated and trusted worldwide.' },
        { id: '6', icon: '🌍', title: 'Global Markets', description: 'Forex, crypto, synthetic indices, stocks & commodities.' },
    ],
    showHowItWorks: true,
    howItWorks: [
        { step: '01', title: 'Create an Account', description: 'Sign up with Deriv for free in under 2 minutes.' },
        { step: '02', title: 'Choose or Build a Bot', description: 'Pick a pre-built strategy or design your own.' },
        { step: '03', title: 'Run & Profit', description: 'Deploy your bot and let automation do the heavy lifting.' },
    ],
    footerText: '© 2025 Trading Bot. Powered by Deriv. Trading involves risk. Please trade responsibly.',
};

const DEFAULT_SETTINGS: TAdminSettings = {
    password: 'admin123',
    logoUrl: '',
    siteName: 'Trading Bot',
    aboutText: 'A powerful automated trading platform built on the Deriv ecosystem.',
    colorActiveTab: '#21cde4',
    colorInactiveTab: '#334155',
    colorPrimary: '#21cde4',
    colorBackground: '#0f172a',
    themePreset: 'dbot-neon',
    loaderStyle: 'pulse',
    logoTextAnimation: 'none' as const,
    analysisTools: DEFAULT_ANALYSIS_TOOLS,
    socialLinks: [],
    customTabs: [],
    deletedDefaultBots: [],
    announcement: {
        enabled: false,
        text: '🚀 Welcome to Brian the Trader — your automated trading platform!',
        bgColor: '#0a1628',
        textColor: '#21cde4',
        speed: 30,
    },
    customBlocks: [],
    derivAppId: '',
    derivCallbackDomain: '',
    landingPage: DEFAULT_LANDING_PAGE,
};

export const STORAGE_KEY = 'admin_portal_settings';

function loadSettingsFromStorage(): TAdminSettings {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            return {
                ...DEFAULT_SETTINGS,
                ...parsed,
                announcement: { ...DEFAULT_SETTINGS.announcement, ...(parsed.announcement ?? {}) },
                customBlocks: parsed.customBlocks ?? [],
                derivAppId: parsed.derivAppId ?? '',
                derivCallbackDomain: parsed.derivCallbackDomain ?? '',
                logoTextAnimation: parsed.logoTextAnimation ?? 'none',
                themePreset: parsed.themePreset ?? 'dbot-neon',
                landingPage: { ...DEFAULT_LANDING_PAGE, ...(parsed.landingPage ?? {}) },
            };
        }
    } catch { /* ignore */ }
    return { ...DEFAULT_SETTINGS };
}

function saveSettingsToStorage(settings: TAdminSettings) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch { /* ignore */ }
}

async function fetchServerSettings(): Promise<TAdminSettings | null> {
    try {
        const res = await fetch('/api/settings', { cache: 'no-store' });
        if (!res.ok) return null;
        const data = await res.json();
        if (!data) return null;
        return {
            ...DEFAULT_SETTINGS,
            ...data,
            announcement: { ...DEFAULT_SETTINGS.announcement, ...(data.announcement ?? {}) },
            customBlocks: data.customBlocks ?? [],
            derivAppId: data.derivAppId ?? '',
            derivCallbackDomain: data.derivCallbackDomain ?? '',
            logoTextAnimation: data.logoTextAnimation ?? 'none',
            themePreset: data.themePreset ?? 'dbot-neon',
            landingPage: { ...DEFAULT_LANDING_PAGE, ...(data.landingPage ?? {}) },
        };
    } catch {
        return null;
    }
}

async function saveServerSettings(settings: TAdminSettings): Promise<void> {
    try {
        await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings),
        });
    } catch { /* ignore */ }
}

type TAdminPortalContext = {
    settings: TAdminSettings;
    updateSettings: (patch: Partial<TAdminSettings>) => void;
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
    isAuthenticated: boolean;
    setIsAuthenticated: (v: boolean) => void;
};

const AdminPortalContext = createContext<TAdminPortalContext | null>(null);

export const AdminPortalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<TAdminSettings>(loadSettingsFromStorage);
    const [isOpen, setIsOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Push initial logo/name from localStorage into live-branding store so LogoMark
    // shows the admin-configured logo immediately, before the server fetch completes.
    useEffect(() => {
        const initial = loadSettingsFromStorage();
        if (initial.logoUrl) setPreviewLogo(initial.logoUrl);
        if (initial.siteName) setPreviewAppName(initial.siteName);
    }, []);

    useEffect(() => {
        fetchServerSettings().then(serverSettings => {
            if (serverSettings) {
                setSettings(serverSettings);
                saveSettingsToStorage(serverSettings);
                applyColors(serverSettings);
                // Push admin logo/name into live-branding store so LogoMark (in the
                // header, outside AdminPortalProvider) reflects the admin setting.
                setPreviewLogo(serverSettings.logoUrl || null);
                setPreviewAppName(serverSettings.siteName || null);
            }
        });
    }, []);

    const updateSettings = (patch: Partial<TAdminSettings>) => {
        setSettings(prev => {
            const next = { ...prev, ...patch };
            saveSettingsToStorage(next);
            saveServerSettings(next);
            // Keep live-branding store in sync so the header logo updates instantly.
            setPreviewLogo(next.logoUrl || null);
            setPreviewAppName(next.siteName || null);
            return next;
        });
    };

    useEffect(() => {
        applyColors(settings);
    }, [settings.colorActiveTab, settings.colorInactiveTab, settings.colorPrimary, settings.colorBackground, settings.themePreset]);

    useEffect(() => {
        const handleThemeChange = () => applyColors(settings);
        window.addEventListener('theme_changed', handleThemeChange);
        return () => window.removeEventListener('theme_changed', handleThemeChange);
    }, [settings.colorActiveTab, settings.colorInactiveTab, settings.colorPrimary, settings.colorBackground, settings.themePreset]);

    // Register custom Blockly blocks once Blockly is available
    useEffect(() => {
        if (!settings.customBlocks?.length) return;
        const tryRegister = () => {
            const Blockly = (window as any).Blockly;
            if (!Blockly?.Blocks) return false;
            settings.customBlocks.forEach(block => {
                try {
                    // eslint-disable-next-line no-new-func
                    new Function(block.code)();
                } catch { /* silently skip invalid blocks */ }
            });
            return true;
        };
        if (tryRegister()) return;
        const id = setInterval(() => { if (tryRegister()) clearInterval(id); }, 500);
        return () => clearInterval(id);
    }, [settings.customBlocks]);

    return (
        <AdminPortalContext.Provider value={{ settings, updateSettings, isOpen, setIsOpen, isAuthenticated, setIsAuthenticated }}>
            {children}
        </AdminPortalContext.Provider>
    );
};

export function useAdminPortal() {
    const ctx = useContext(AdminPortalContext);
    if (!ctx) throw new Error('useAdminPortal must be used inside AdminPortalProvider');
    return ctx;
}

export function applyColors(settings: Pick<TAdminSettings, 'colorActiveTab' | 'colorInactiveTab' | 'colorPrimary' | 'colorBackground'> & Partial<Pick<TAdminSettings, 'themePreset'>>) {
    const root = document.documentElement;
    const targets = [root, document.body].filter(Boolean) as HTMLElement[];
    const selectedTheme = THEME_PRESETS.find(theme => theme.id === settings.themePreset) ?? THEME_PRESETS[0];
    const isLight = root.classList.contains('theme--light') || document.body?.classList.contains('theme--light');
    const theme = isLight
        ? {
              ...selectedTheme.colors,
              background: '#f8fafc',
              surface: '#ffffff',
              surfaceStrong: '#eef2f7',
              text: '#0f172a',
              muted: '#64748b',
              border: '#cbd5e1',
          }
        : selectedTheme.colors;
    targets.forEach(target => {
        target.style.setProperty('--admin-color-active-tab', settings.colorActiveTab);
        target.style.setProperty('--admin-color-inactive-tab', settings.colorInactiveTab);
        target.style.setProperty('--admin-color-primary', settings.colorPrimary);
        target.style.setProperty('--admin-color-background', isLight ? theme.background : settings.colorBackground);
        target.style.setProperty('--admin-theme-surface', theme.surface);
        target.style.setProperty('--admin-theme-surface-strong', theme.surfaceStrong);
        target.style.setProperty('--admin-theme-text', theme.text);
        target.style.setProperty('--admin-theme-muted', theme.muted);
        target.style.setProperty('--admin-theme-border', theme.border);
        target.style.setProperty('--general-main-1', theme.background);
        target.style.setProperty('--general-main-2', theme.surface);
        target.style.setProperty('--general-section-1', theme.surface);
        target.style.setProperty('--general-section-2', theme.surfaceStrong);
        target.style.setProperty('--general-section-3', theme.surfaceStrong);
        target.style.setProperty('--general-section-6', theme.border);
        target.style.setProperty('--text-general', theme.text);
        target.style.setProperty('--text-less-prominent', theme.muted);
        target.style.setProperty('--border-normal', theme.border);
        target.dataset.adminTheme = selectedTheme.id;
        target.dataset.themeMode = isLight ? 'light' : 'dark';
        target.style.setProperty('color-scheme', isLight ? 'light' : 'dark');
        target.style.setProperty('--color-brand-secondary-color', settings.colorPrimary);
        target.style.setProperty('--brand-red-coral', settings.colorPrimary);
        target.style.setProperty('--admin-color-active-tab-bg', hexToRgba(settings.colorActiveTab, 0.13));
    });
    window.dispatchEvent(new Event('admin_settings_updated'));
}

export function applyStoredColors() {
    applyColors(loadSettingsFromStorage());
}

function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16) || 33;
    const g = parseInt(hex.slice(3, 5), 16) || 205;
    const b = parseInt(hex.slice(5, 7), 16) || 228;
    return `rgba(${r},${g},${b},${alpha})`;
}

export function getLoaderStyle(): TLoaderStyle {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) { const parsed = JSON.parse(raw); return parsed.loaderStyle || 'pulse'; }
    } catch { /* ignore */ }
    return 'pulse';
}

export function getSocialLinks(): TSocialLink[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) { const parsed = JSON.parse(raw); return parsed.socialLinks || []; }
    } catch { /* ignore */ }
    return [];
}

export function getCustomTabs(): TCustomTab[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) { const parsed = JSON.parse(raw); return parsed.customTabs || []; }
    } catch { /* ignore */ }
    return [];
}
