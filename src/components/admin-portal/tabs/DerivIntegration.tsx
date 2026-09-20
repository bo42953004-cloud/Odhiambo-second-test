import React, { useState } from 'react';
import { useAdminPortal } from '../AdminPortalContext';
import { generateOAuthURL } from '@/components/shared';

const DerivIntegration: React.FC = () => {
    const { settings, updateSettings } = useAdminPortal();
    const [local, setLocal] = useState({
        derivAppId: settings.derivAppId ?? '',
        derivCallbackDomain: settings.derivCallbackDomain ?? '',
    });
    const [saved, setSaved] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'error'>('idle');

    const envAppId = (process.env.NEXT_PUBLIC_DERIV_APP_ID ?? '').trim();
    const effectiveAppId = local.derivAppId.trim() || envAppId;
    const effectiveDomain = local.derivCallbackDomain.trim() || window.location.origin;

    const handleSave = () => {
        updateSettings({
            derivAppId: local.derivAppId.trim(),
            derivCallbackDomain: local.derivCallbackDomain.trim(),
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const handleTestLogin = async () => {
        if (!effectiveAppId) {
            setTestStatus('error');
            setTimeout(() => setTestStatus('idle'), 3000);
            return;
        }
        setTestStatus('loading');
        try {
            const url = await generateOAuthURL();
            if (url) {
                window.open(url, '_blank', 'noopener,noreferrer');
                setTestStatus('idle');
            } else {
                setTestStatus('error');
                setTimeout(() => setTestStatus('idle'), 3000);
            }
        } catch {
            setTestStatus('error');
            setTimeout(() => setTestStatus('idle'), 3000);
        }
    };

    return (
        <div style={{ padding: '24px', maxWidth: 640 }}>
            <h2 style={{ color: '#21cde4', marginBottom: 4, fontSize: 20 }}>🔑 Deriv Integration</h2>
            <p style={{ color: '#94a3b8', marginBottom: 24, fontSize: 13 }}>
                Configure your Deriv OAuth app. These settings override the build-time defaults and take effect immediately — no redeploy needed.
            </p>

            <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: 13, marginBottom: 6, fontWeight: 600 }}>
                    Deriv App ID
                </label>
                <input
                    type='text'
                    value={local.derivAppId}
                    onChange={e => setLocal(p => ({ ...p, derivAppId: e.target.value }))}
                    placeholder={envAppId || 'e.g. 33FxewyqGJ899zO3Tjwzt'}
                    style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: 8,
                        color: '#f1f5f9',
                        fontSize: 14,
                        fontFamily: 'monospace',
                        boxSizing: 'border-box',
                    }}
                />
                <p style={{ color: '#64748b', fontSize: 11, marginTop: 5 }}>
                    Leave blank to use the built-in app ID
                    {envAppId ? ` (${envAppId.slice(0, 8)}…)` : ' (none configured)'}.
                </p>
            </div>

            <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: 13, marginBottom: 6, fontWeight: 600 }}>
                    Callback Domain (OAuth Redirect URL)
                </label>
                <input
                    type='text'
                    value={local.derivCallbackDomain}
                    onChange={e => setLocal(p => ({ ...p, derivCallbackDomain: e.target.value }))}
                    placeholder='e.g. https://yourapp.replit.app'
                    style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: 8,
                        color: '#f1f5f9',
                        fontSize: 14,
                        fontFamily: 'monospace',
                        boxSizing: 'border-box',
                    }}
                />
                <p style={{ color: '#64748b', fontSize: 11, marginTop: 5 }}>
                    Leave blank to auto-detect (<code style={{ color: '#94a3b8' }}>{window.location.origin}</code>).
                    Must exactly match what is registered in the Deriv developer portal.
                </p>
            </div>

            <button
                onClick={handleSave}
                style={{
                    background: saved ? '#16a34a' : '#21cde4',
                    color: saved ? '#fff' : '#0f172a',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 24px',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                }}
            >
                {saved ? '✓ Saved!' : 'Save Settings'}
            </button>

            <button
                onClick={handleTestLogin}
                disabled={testStatus === 'loading' || !effectiveAppId}
                style={{
                    marginLeft: 12,
                    background: testStatus === 'error' ? '#7f1d1d' : '#1e3a5f',
                    color: testStatus === 'error' ? '#fca5a5' : '#21cde4',
                    border: '1px solid',
                    borderColor: testStatus === 'error' ? '#ef4444' : '#21cde4',
                    borderRadius: 8,
                    padding: '10px 20px',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: effectiveAppId ? 'pointer' : 'not-allowed',
                    opacity: effectiveAppId ? 1 : 0.5,
                    transition: 'all 0.2s',
                }}
                title={!effectiveAppId ? 'Configure an App ID first' : 'Opens Deriv login in a new tab to test the OAuth flow'}
            >
                {testStatus === 'loading' ? '⏳ Opening…' : testStatus === 'error' ? '✕ Failed — check App ID' : '🔐 Test Login'}
            </button>

            {testStatus === 'error' && (
                <p style={{ color: '#fca5a5', fontSize: 12, marginTop: 8 }}>
                    Could not generate login URL. Make sure the App ID is correct and saved.
                </p>
            )}

            <div style={{
                marginTop: 32,
                background: '#0f172a',
                border: '1px solid #1e3a5f',
                borderRadius: 10,
                padding: 20,
            }}>
                <h3 style={{ color: '#21cde4', fontSize: 14, marginBottom: 12, marginTop: 0 }}>
                    ⚡ Active Configuration
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <ConfigRow
                        label='App ID'
                        value={effectiveAppId}
                        source={local.derivAppId.trim() ? 'Admin override' : 'Build-time env'}
                        valid={!!effectiveAppId}
                    />
                    <ConfigRow
                        label='Redirect URI'
                        value={effectiveDomain}
                        source={local.derivCallbackDomain.trim() ? 'Admin override' : 'Auto-detected'}
                        valid={true}
                    />
                </div>
            </div>

            <div style={{
                marginTop: 20,
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 10,
                padding: 20,
            }}>
                <h3 style={{ color: '#f59e0b', fontSize: 14, marginBottom: 10, marginTop: 0 }}>
                    📋 Deriv Developer Portal Checklist
                </h3>
                <ol style={{ color: '#94a3b8', fontSize: 13, paddingLeft: 18, margin: 0, lineHeight: 1.8 }}>
                    <li>Go to <a href='https://developers.deriv.com' target='_blank' rel='noreferrer' style={{ color: '#21cde4' }}>developers.deriv.com</a> and open your app.</li>
                    <li>Set <strong style={{ color: '#f1f5f9' }}>App ID</strong> to: <code style={{ color: '#21cde4', background: '#1e293b', padding: '1px 6px', borderRadius: 4 }}>{effectiveAppId || '—'}</code></li>
                    <li>Add this exact URL to <strong style={{ color: '#f1f5f9' }}>Redirect URL</strong> in the app settings:
                        <div style={{
                            background: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: 6,
                            padding: '8px 12px',
                            marginTop: 6,
                            fontFamily: 'monospace',
                            fontSize: 13,
                            color: '#21cde4',
                            wordBreak: 'break-all',
                        }}>
                            {effectiveDomain}
                        </div>
                    </li>
                    <li>Save the app in the Deriv portal, then test the Login button.</li>
                </ol>
            </div>
        </div>
    );
};

interface ConfigRowProps {
    label: string;
    value: string;
    source: string;
    valid: boolean;
}

const ConfigRow: React.FC<ConfigRowProps> = ({ label, value, source, valid }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: 12 }}>{label}</span>
            <span style={{
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 4,
                background: valid ? '#14532d' : '#450a0a',
                color: valid ? '#4ade80' : '#f87171',
                fontWeight: 600,
            }}>
                {source}
            </span>
        </div>
        <code style={{
            color: value ? '#f1f5f9' : '#ef4444',
            fontSize: 12,
            background: '#1e293b',
            padding: '5px 10px',
            borderRadius: 6,
            wordBreak: 'break-all',
            display: 'block',
        }}>
            {value || 'Not configured'}
        </code>
    </div>
);

export default DerivIntegration;
