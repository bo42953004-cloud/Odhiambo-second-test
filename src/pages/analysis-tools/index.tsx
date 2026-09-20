import React, { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { TAnalysisTool } from '@/components/admin-portal/AdminPortalContext';
import DigitAnalysis from './DigitAnalysis';
import './analysis-tools.scss';

const SETTINGS_KEY = 'admin_portal_settings';

// Built-in native tools (rendered as React components, not iframes)
const NATIVE_TOOLS: (TAnalysisTool & { native: true })[] = [
    {
        id:          'digit-analysis',
        name:        'Digit Analysis',
        description: 'Live digit distribution, streaks, even/odd, over/under & more.',
        url:         '',
        icon:        '🎯',
        native:      true,
    },
];

function getIframeTools(): TAnalysisTool[] {
    const defaults: TAnalysisTool[] = [
        { id: 'tradingview',     name: 'TradingView Chart',  description: 'Advanced charting with 100+ indicators.',     url: 'https://charts.deriv.com',           icon: '📊' },
        { id: 'econ-calendar',  name: 'Economic Calendar',  description: 'Market-moving events and announcements.',      url: 'https://deriv.com/economic-calendar/', icon: '📅' },
        { id: 'volatility-chart', name: 'Deriv Charts',     description: 'Official Deriv embedded charts.',              url: 'https://charts.deriv.com',           icon: '📈' },
        { id: 'pip-calc',       name: 'Trading Tools',      description: 'Market data, news, and analysis.',             url: 'https://deriv.com/trading-tools/',    icon: '🧮' },
    ];
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.analysisTools?.length) return parsed.analysisTools;
        }
    } catch { /* ignore */ }
    return defaults;
}

type AnyTool = TAnalysisTool & { native?: boolean };

const AnalysisTools = observer(() => {
    const [iframeTools, setIframeTools] = useState<TAnalysisTool[]>([]);
    const [activeTool, setActiveTool]   = useState<AnyTool>(NATIVE_TOOLS[0]);
    const [iframeLoading, setIframeLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        const refresh = () => {
            const t = getIframeTools();
            setIframeTools(t);
        };
        refresh();
        window.addEventListener('admin_settings_updated', refresh);
        return () => window.removeEventListener('admin_settings_updated', refresh);
    }, []);

    const allTools: AnyTool[] = [...NATIVE_TOOLS, ...iframeTools];

    const handleSelectTool = (tool: AnyTool) => {
        if (tool.id === activeTool?.id) return;
        if (!tool.native) setIframeLoading(true);
        setActiveTool(tool);
    };

    return (
        <div className='analysis-page'>
            {/* Collapsible sidebar */}
            <div className={`analysis-page__sidebar ${sidebarOpen ? '' : 'analysis-page__sidebar--collapsed'}`}>
                <button
                    className='analysis-page__sidebar-toggle'
                    onClick={() => setSidebarOpen(v => !v)}
                    title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                    {sidebarOpen ? '◀' : '▶'}
                </button>

                {sidebarOpen && (
                    <>
                        <div className='analysis-page__sidebar-header'>
                            <h2 className='analysis-page__sidebar-title'>📊 Tools</h2>
                        </div>
                        <div className='analysis-page__tool-list'>
                            {allTools.map(tool => (
                                <button
                                    key={tool.id}
                                    className={`analysis-tool-btn ${activeTool?.id === tool.id ? 'analysis-tool-btn--active' : ''} ${(tool as any).native ? 'analysis-tool-btn--native' : ''}`}
                                    onClick={() => handleSelectTool(tool)}
                                    title={tool.name}
                                >
                                    <span className='analysis-tool-btn__icon'>{tool.icon}</span>
                                    <div className='analysis-tool-btn__info'>
                                        <span className='analysis-tool-btn__name'>{tool.name}</span>
                                        <span className='analysis-tool-btn__desc'>{tool.description}</span>
                                    </div>
                                    {activeTool?.id === tool.id && <span className='analysis-tool-btn__active-dot' />}
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {!sidebarOpen && (
                    <div className='analysis-page__sidebar-icons'>
                        {allTools.map(tool => (
                            <button
                                key={tool.id}
                                className={`analysis-sidebar-icon ${activeTool?.id === tool.id ? 'analysis-sidebar-icon--active' : ''}`}
                                onClick={() => { handleSelectTool(tool); setSidebarOpen(true); }}
                                title={tool.name}
                            >
                                {tool.icon}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Main content area */}
            <div className='analysis-page__frame-area'>
                {activeTool ? (
                    <>
                        {/* Header bar for iframe tools only */}
                        {!activeTool.native && (
                            <div className='analysis-page__frame-header'>
                                <button
                                    className='analysis-page__sidebar-toggle-inline'
                                    onClick={() => setSidebarOpen(v => !v)}
                                    title={sidebarOpen ? 'Hide tools panel' : 'Show tools panel'}
                                >
                                    {sidebarOpen ? '⬅' : '☰'}
                                </button>
                                <span className='analysis-page__frame-icon'>{activeTool.icon}</span>
                                <span className='analysis-page__frame-name'>{activeTool.name}</span>
                                <span className='analysis-page__frame-desc'>{activeTool.description}</span>
                            </div>
                        )}

                        {/* Native component rendering */}
                        {activeTool.native ? (
                            <div className='analysis-page__native-area'>
                                {activeTool.id === 'digit-analysis' && <DigitAnalysis />}
                            </div>
                        ) : (
                            /* Iframe rendering */
                            <div className='analysis-page__frame-wrapper'>
                                {iframeLoading && (
                                    <div className='analysis-page__frame-loader'>
                                        <div className='analysis-page__frame-spinner' />
                                        <span>Loading {activeTool.name}…</span>
                                    </div>
                                )}
                                <iframe
                                    key={activeTool.url}
                                    ref={iframeRef}
                                    src={activeTool.url}
                                    title={activeTool.name}
                                    className='analysis-page__iframe'
                                    onLoad={() => setIframeLoading(false)}
                                    allow='fullscreen'
                                    sandbox='allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox'
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <div className='analysis-page__placeholder'>
                        <span>📊</span>
                        <p>Select an analysis tool from the left to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
});

export default AnalysisTools;
