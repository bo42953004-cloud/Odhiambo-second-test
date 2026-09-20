import { lazy, Suspense } from 'react';
import React from 'react';
import { createBrowserRouter, createRoutesFromElements, Navigate, Route, RouterProvider } from 'react-router-dom';
import { cleanupUrl, handleOAuthCallback } from '@/external/deriv-core';
import ChunkLoader from '@/components/loader/chunk-loader';
import LocalStorageSyncWrapper from '@/components/localStorage-sync-wrapper';
import RoutePromptDialog from '@/components/route-prompt-dialog';
import { useAccountSwitching } from '@/hooks/useAccountSwitching';
import { useLanguageFromURL } from '@/hooks/useLanguageFromURL';
import { StoreProvider } from '@/hooks/useStore';
import { isPreviewMode, PREVIEW_BASE_PATH } from '@/utils/is-preview-mode';
import { localize, TranslationProvider } from '@deriv-com/translations';
import CoreStoreProvider from './CoreStoreProvider';
import i18nInstance from './i18n';
import { applyStoredColors } from '@/components/admin-portal/AdminPortalContext';
import './app-root.scss';
import '@/styles/automatic-themes.scss';

const Layout = lazy(() => import('../components/layout'));
const AppRoot = lazy(() => import('./app-root'));
const LandingPage = lazy(() => import('../pages/landing'));

/**
 * Component wrapper to handle language URL parameter
 * Uses the useLanguageFromURL hook to process language switching
 */
const LanguageHandler = ({ children }: { children: React.ReactNode }) => {
    useLanguageFromURL();
    return <>{children}</>;
};

const MainRoute = () => {
    const [canEnter] = React.useState(() => {
        try {
            const entered = sessionStorage.getItem('app_entered') === '1';
            const isOAuthCallback = new URLSearchParams(window.location.search).has('code');
            if (entered) sessionStorage.removeItem('app_entered');
            return entered || isOAuthCallback;
        } catch {
            return false;
        }
    });

    if (!canEnter) return <Navigate to='/landing' replace />;

    return (
        <Suspense fallback={<ChunkLoader message={localize('Please wait while we connect to the server...')} />}>
            <TranslationProvider defaultLang='EN' i18nInstance={i18nInstance}>
                <LanguageHandler>
                    <StoreProvider>
                        <LocalStorageSyncWrapper>
                            <RoutePromptDialog />
                            <CoreStoreProvider>
                                <Layout />
                            </CoreStoreProvider>
                        </LocalStorageSyncWrapper>
                    </StoreProvider>
                </LanguageHandler>
            </TranslationProvider>
        </Suspense>
    );
};

// The static preview build is served under /bot/preview (see rsbuild.config.ts
// assetPrefix), so React Router must resolve routes under that prefix. Standalone
// partner deploys are served at the root, so no basename there.
const routerBasename = isPreviewMode() ? PREVIEW_BASE_PATH : undefined;

const router = createBrowserRouter(
    createRoutesFromElements(
        <>
            {/* Public landing / marketing page — standalone, no app shell */}
            <Route
                path='/landing'
                element={
                    <Suspense fallback={<ChunkLoader message='Loading...' />}>
                        <LandingPage />
                    </Suspense>
                }
            />
            {/* Main app shell (Layout + Outlet) */}
            <Route
                path='/'
                element={<MainRoute />}
            >
                {/* All child routes will be passed as children to Layout */}
                <Route index element={<AppRoot />} />
                {/* App Builder embeds the template at /preview — render the same app shell */}
                <Route path='preview' element={<AppRoot />} />
                {/* Direct URL to bot builder tab */}
                <Route path='bot-builder' element={<AppRoot />} />
            </Route>
        </>
    ),
    { basename: routerBasename }
);

/**
 * Main App component
 *
 * Responsibilities:
 * 1. OAuth callback handling (via vendored deriv-core handleOAuthCallback)
 * 2. Account switching from URL (via useAccountSwitching hook)
 * 3. Router provider setup
 */
function App() {
    // Handle account switching via URL parameter
    useAccountSwitching();

    React.useEffect(() => {
        applyStoredColors();
    }, []);

    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.has('code')) return;

        const handleCallback = async () => {
            try {
                let derivAppId = process.env.NEXT_PUBLIC_DERIV_APP_ID || '';
                let derivCallbackDomain = window.location.origin;
                try {
                    const raw = localStorage.getItem('admin_portal_settings');
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (parsed.derivAppId?.trim()) derivAppId = parsed.derivAppId.trim();
                        if (parsed.derivCallbackDomain?.trim()) derivCallbackDomain = parsed.derivCallbackDomain.trim();
                    }
                } catch { /* ignore */ }

                const authInfo = await handleOAuthCallback(window.location.href, {
                    clientId: derivAppId,
                    redirectUri: derivCallbackDomain,
                    scopes: 'trade',
                });

                const { DerivWSAccountsService } = await import('@/services/derivws-accounts.service');
                const accounts = await DerivWSAccountsService.fetchAccountsList(authInfo.access_token);

                if (accounts && accounts.length > 0) {
                    DerivWSAccountsService.storeAccounts(accounts);
                    const firstAccount = accounts[0];
                    localStorage.setItem('active_loginid', firstAccount.account_id);
                    const isDemo =
                        firstAccount.account_id.startsWith('VRT') || firstAccount.account_id.startsWith('VRTC');
                    localStorage.setItem('account_type', isDemo ? 'demo' : 'real');

                    const { api_base } = await import('@/external/bot-skeleton');
                    await api_base.init(true);
                } else {
                    console.error('No accounts returned after authentication');
                }
            } catch (error) {
                console.error('OAuth callback error:', error);
            } finally {
                cleanupUrl(window.location.origin);
            }
        };

        handleCallback();
    }, []);

    return <RouterProvider router={router} />;
}

export default App;
