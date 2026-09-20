import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAdminPortal } from './AdminPortalContext';
import FreeBots from './tabs/FreeBots';
import AnalysisTools from './tabs/AnalysisTools';
import TradingViewTab from './tabs/TradingViewTab';
import SiteCustomization from './tabs/SiteCustomization';
import LoadingAnimations from './tabs/LoadingAnimations';
import PlaceholderTab from './tabs/PlaceholderTab';
import SocialLinks from './tabs/SocialLinks';
import CustomTabs from './tabs/CustomTabs';
import BlockLibrary from './tabs/BlockLibrary';
import DerivIntegration from './tabs/DerivIntegration';
import LandingPageEditor from './tabs/LandingPageEditor';

type TTab = { id: string; label: string; icon: string };

const TABS: TTab[] = [
    { id: 'free-bots',      label: 'Free Bots',      icon: '🤖' },
    { id: 'landing',        label: 'Landing Page',   icon: '🏠' },
    { id: 'analysis',       label: 'Analysis Tools',  icon: '📊' },
    { id: 'custom-tabs',    label: 'Custom Tabs',     icon: '🗂️' },
    { id: 'social',         label: 'Social Links',    icon: '📡' },
    { id: 'tradingview',    label: 'Charts',          icon: '📈' },
    { id: 'customize',      label: 'Customization',   icon: '🎨' },
    { id: 'loaders',        label: 'Animations',      icon: '⚡' },
    { id: 'block-library',  label: 'Block Library',   icon: '🧩' },
    { id: 'deriv',          label: 'Deriv Login',     icon: '🔑' },
    { id: 'signals',        label: 'Signals',         icon: '📡' },
    { id: 'users',          label: 'Users',           icon: '👥' },
];

const AdminPortal: React.FC = () => {
    const { settings, updateSettings, isOpen, setIsOpen, isAuthenticated, setIsAuthenticated } = useAdminPortal();
    const [activeTab, setActiveTab] = useState('free-bots');
    const [passwordInput, setPasswordInput] = useState('');
    const [authError, setAuthError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const passwordRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'A') { e.preventDefault(); setIsOpen(true); }
            if (e.key === 'Escape' && isOpen) handleClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && !isAuthenticated) setTimeout(() => passwordRef.current?.focus(), 100);
    }, [isOpen, isAuthenticated]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setPasswordInput('');
        setAuthError('');
    }, []);

    const handleAuth = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordInput === settings.password) {
            setIsAuthenticated(true);
            setAuthError('');
            setPasswordInput('');
        } else {
            setAuthError('Incorrect password. Try again.');
            setPasswordInput('');
            passwordRef.current?.focus();
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) handleClose();
    };

    const renderTab = () => {
        switch (activeTab) {
            case 'free-bots':   return <FreeBots onClose={handleClose} />;
            case 'landing':     return <LandingPageEditor />;
            case 'analysis':    return <AnalysisTools />;
            case 'custom-tabs': return <CustomTabs />;
            case 'social':      return <SocialLinks />;
            case 'tradingview': return <TradingViewTab />;
            case 'customize':   return <SiteCustomization />;
            case 'loaders':        return <LoadingAnimations />;
            case 'block-library': return <BlockLibrary />;
            case 'deriv':         return <DerivIntegration />;
            case 'signals':       return <PlaceholderTab title='Trading Signals' icon='📡' description='Configure and broadcast real-time trading signals to your users.' />;
            case 'users':         return <PlaceholderTab title='User Management' icon='👥' description='Manage user accounts, permissions, and access levels.' />;
            default:            return null;
        }
    };

    if (!isOpen) return null;

    return (
        <div className='admin-portal__backdrop' onClick={handleBackdropClick}>
            {!isAuthenticated ? (
                <div className='admin-portal__auth-modal'>
                    <div className='admin-portal__auth-logo'><span className='admin-portal__auth-icon'>🔐</span></div>
                    <h2 className='admin-portal__auth-title'>Admin Access</h2>
                    <p className='admin-portal__auth-subtitle'>Enter the admin password to continue.</p>
                    <form onSubmit={handleAuth} className='admin-portal__auth-form'>
                        <div className='admin-portal__auth-input-wrap'>
                            <input
                                ref={passwordRef}
                                type={showPassword ? 'text' : 'password'}
                                value={passwordInput}
                                onChange={e => setPasswordInput(e.target.value)}
                                placeholder='Password'
                                className={`admin-portal__auth-input ${authError ? 'admin-portal__auth-input--error' : ''}`}
                                autoComplete='current-password'
                            />
                            <button type='button' className='admin-portal__auth-eye' onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                        {authError && <p className='admin-portal__auth-error'>{authError}</p>}
                        <button type='submit' className='admin-portal__auth-submit'>Unlock Portal</button>
                        <button type='button' className='admin-portal__auth-cancel' onClick={handleClose}>Cancel</button>
                    </form>
                    <p className='admin-portal__auth-hint'>Shortcut: Ctrl + Shift + A</p>
                </div>
            ) : (
                <div className='admin-portal__modal'>
                    <div className='admin-portal__sidebar'>
                        <div className='admin-portal__sidebar-header'>
                            <div className='admin-portal__sidebar-logo'>
                                {settings.logoUrl ? <img src={settings.logoUrl} alt='logo' /> : <span>⚙️</span>}
                            </div>
                            <div className='admin-portal__sidebar-title'>
                                <span className='admin-portal__sidebar-name'>{settings.siteName}</span>
                                <span className='admin-portal__sidebar-badge'>Admin Portal</span>
                            </div>
                        </div>
                        <nav className='admin-portal__nav'>
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    className={`admin-portal__nav-item ${activeTab === tab.id ? 'admin-portal__nav-item--active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <span className='admin-portal__nav-icon'>{tab.icon}</span>
                                    <span className='admin-portal__nav-label'>{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                        <div className='admin-portal__sidebar-footer'>
                            <button className='admin-portal__logout-btn' onClick={() => { setIsAuthenticated(false); handleClose(); }}>
                                🚪 Lock Portal
                            </button>
                        </div>
                    </div>
                    <div className='admin-portal__content'>
                        <div className='admin-portal__content-header'>
                            <button className='admin-portal__close-btn' onClick={handleClose} title='Close (Esc)'>✕</button>
                        </div>
                        <div className='admin-portal__content-body'>{renderTab()}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPortal;
