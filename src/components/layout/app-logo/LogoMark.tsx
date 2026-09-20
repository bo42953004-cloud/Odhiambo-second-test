// Shared logo + app name "mark" rendered in the header (desktop & mobile, next to the
// hamburger) and in the mobile drawer. Logo priority: live App Builder preview data URL
// → public/logo.<png|jpg|jpeg|webp> → letter-badge fallback. The app name comes from the
// live preview, else the resolved deploy/build name (see getAppName).
import { useEffect, useMemo, useState } from 'react';
import {
    getPreviewAppName,
    getPreviewLogo,
    subscribePreviewAppName,
    subscribePreviewLogo,
} from '@/utils/live-branding-store';
import { isPreviewMode } from '@/utils/is-preview-mode';
import { getAppName, LOGO_CANDIDATES } from '../../../utils/branding';
import type { TLogoTextAnimation } from '@/components/admin-portal/AdminPortalContext';
import HeaderTicker from './HeaderTicker';

type TLogoMarkProps = {
    height?: number;
};

const STORAGE_KEY = 'admin_portal_settings';

function getLogoTextAnimation(): TLogoTextAnimation {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const s = JSON.parse(raw);
            return s.logoTextAnimation ?? 'none';
        }
    } catch { /* ignore */ }
    return 'none';
}

// Split text into individual letter spans for the 'wave' animation
const WaveText = ({ text }: { text: string }) => (
    <>
        {text.split('').map((ch, i) => (
            <span
                key={i}
                className='logo-wave-char'
                style={{ animationDelay: `${i * 0.08}s` }}
            >
                {ch === ' ' ? '\u00a0' : ch}
            </span>
        ))}
    </>
);

export const LogoMark = ({ height = 32 }: TLogoMarkProps) => {
    const [previewLogo, setPreviewLogo] = useState<string | null>(getPreviewLogo());
    const [previewAppName, setPreviewAppName] = useState<string | null>(getPreviewAppName());
    const [candidateIndex, setCandidateIndex] = useState(0);
    const [anim, setAnim] = useState<TLogoTextAnimation>(getLogoTextAnimation);

    useEffect(() => subscribePreviewLogo(setPreviewLogo), []);
    useEffect(() => subscribePreviewAppName(setPreviewAppName), []);

    // Re-read animation whenever admin saves settings
    useEffect(() => {
        const handler = () => setAnim(getLogoTextAnimation());
        window.addEventListener('admin_settings_updated', handler);
        return () => window.removeEventListener('admin_settings_updated', handler);
    }, []);

    // Preview data URL wins, then the deploy-time public/logo.<ext> candidates.
    const candidates = useMemo(() => {
        const fileFallbacks = isPreviewMode() ? [] : LOGO_CANDIDATES;
        return previewLogo ? [previewLogo, ...fileFallbacks] : [...fileFallbacks];
    }, [previewLogo]);

    // Restart probing whenever the candidate list changes
    useEffect(() => setCandidateIndex(0), [candidates]);

    const appName = previewAppName || getAppName();
    const logoSrc = candidateIndex < candidates.length ? candidates[candidateIndex] : null;
    const badgeLetter = appName.trim().charAt(0).toUpperCase() || 'A';

    const textClass = `app-header__logo-text${anim !== 'none' ? ` app-header__logo-text--${anim}` : ''}`;

    return (
        <span className='app-header__logo-mark'>
            <span className='app-header__logo-mark-inner'>
                {logoSrc ? (
                    <img
                        data-logo
                        src={logoSrc}
                        alt={appName}
                        className='app-header__logo-img'
                        style={{ height: `${height}px` }}
                        onError={() => setCandidateIndex((index) => index + 1)}
                    />
                ) : (
                    <span
                        className='app-header__logo-badge'
                        style={{ height: `${height}px`, width: `${height}px` }}
                        aria-hidden='true'
                    >
                        {badgeLetter}
                    </span>
                )}
                {/* Animated brand name */}
                <span className={textClass} data-text={appName}>
                    {anim === 'wave' ? <WaveText text={appName} /> : appName}
                </span>
            </span>
            {/* Live market tick below logo mark */}
            <HeaderTicker />
        </span>
    );
};
