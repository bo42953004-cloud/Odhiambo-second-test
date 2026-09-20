import React, { useEffect, useRef, useState } from 'react';
import { STORAGE_KEY, TAdminSettings, TAnnouncementSettings } from '@/components/admin-portal/AdminPortalContext';
import './AnnouncementTicker.scss';

const SESSION_KEY = 'announcement_dismissed_v2';

const DEFAULT_ANN: TAnnouncementSettings = {
    enabled: false,
    text: '',
    bgColor: '#0a1628',
    textColor: '#21cde4',
    speed: 30,
};

function readAnnouncement(): TAnnouncementSettings {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed: Partial<TAdminSettings> = JSON.parse(raw);
            return { ...DEFAULT_ANN, ...(parsed.announcement ?? {}) };
        }
    } catch { /* ignore */ }
    return DEFAULT_ANN;
}

const AnnouncementTicker: React.FC = () => {
    const [ann, setAnn] = useState<TAnnouncementSettings>(readAnnouncement);
    const [visible, setVisible] = useState(false);
    const [exiting, setExiting] = useState(false);
    const trackRef = useRef<HTMLDivElement>(null);

    // Re-read when admin saves settings
    useEffect(() => {
        const handler = () => setAnn(readAnnouncement());
        window.addEventListener('admin_settings_updated', handler);
        window.addEventListener('storage', handler);
        return () => {
            window.removeEventListener('admin_settings_updated', handler);
            window.removeEventListener('storage', handler);
        };
    }, []);

    const isDismissed = () => sessionStorage.getItem(SESSION_KEY) === ann.text;

    useEffect(() => {
        if (ann.enabled && ann.text && !isDismissed()) {
            const t = setTimeout(() => setVisible(true), 300);
            return () => clearTimeout(t);
        } else {
            setVisible(false);
        }
    }, [ann.enabled, ann.text]);

    if (!ann.enabled || !ann.text || !visible) return null;

    const handleDismiss = () => {
        setExiting(true);
        setTimeout(() => {
            sessionStorage.setItem(SESSION_KEY, ann.text);
            setVisible(false);
            setExiting(false);
        }, 400);
    };

    const textColor = ann.textColor || '#21cde4';
    const bgColor = ann.bgColor || '#0a1628';
    const speed = ann.speed || 30;

    const repeated = Array(6).fill(ann.text).join('   ✦   ');

    return (
        <div
            className={`announcement-ticker${exiting ? ' announcement-ticker--exit' : ' announcement-ticker--enter'}`}
            style={{
                '--ticker-color': textColor,
                '--ticker-bg': bgColor,
                '--ticker-speed': `${speed}s`,
                '--ticker-glow': `${textColor}88`,
            } as React.CSSProperties}
            role='marquee'
            aria-live='polite'
        >
            <div className='announcement-ticker__scanner' />

            <div className='announcement-ticker__fade announcement-ticker__fade--left' />

            <div className='announcement-ticker__live-dot'>
                <span className='announcement-ticker__dot' />
                <span className='announcement-ticker__dot-label'>LIVE</span>
            </div>

            <div className='announcement-ticker__track' ref={trackRef}>
                <div className='announcement-ticker__text-wrap'>
                    <span className='announcement-ticker__text'>{repeated}</span>
                    <span className='announcement-ticker__text' aria-hidden='true'>{repeated}</span>
                </div>
            </div>

            <div className='announcement-ticker__fade announcement-ticker__fade--right' />

            <button
                className='announcement-ticker__dismiss'
                onClick={handleDismiss}
                aria-label='Dismiss announcement'
                title='Dismiss'
            >
                ✕
            </button>
        </div>
    );
};

export default AnnouncementTicker;
