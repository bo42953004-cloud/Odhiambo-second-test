import React, { useState } from 'react';

const CHART_SOURCES = [
    { label: 'Deriv Charts', url: 'https://charts.deriv.com' },
    { label: 'TradingView (Full)', url: 'https://www.tradingview.com/chart/?symbol=FOREXCOM:EURUSD' },
    { label: 'TradingView Widget', url: 'https://www.tradingview.com/widgetembed/?symbol=EURUSD&interval=D&theme=dark&style=1&locale=en' },
];

const TradingViewTab: React.FC = () => {
    const [selected, setSelected] = useState(0);
    const [customUrl, setCustomUrl] = useState('');
    const [activeUrl, setActiveUrl] = useState(CHART_SOURCES[0].url);
    const [loading, setLoading] = useState(true);

    const loadCustom = () => {
        if (customUrl.trim()) setActiveUrl(customUrl.trim());
    };

    return (
        <div className='admin-tab__tradingview'>
            <div className='admin-tab__header'>
                <h2 className='admin-tab__title'>TradingView & Charts</h2>
                <p className='admin-tab__subtitle'>Embedded market charts — no external tabs needed.</p>
            </div>

            <div className='tv-controls'>
                <div className='tv-controls__presets'>
                    {CHART_SOURCES.map((src, i) => (
                        <button
                            key={i}
                            className={`tv-preset-btn ${selected === i ? 'tv-preset-btn--active' : ''}`}
                            onClick={() => { setSelected(i); setActiveUrl(src.url); setLoading(true); }}
                        >
                            {src.label}
                        </button>
                    ))}
                </div>
                <div className='tv-controls__custom'>
                    <input
                        className='tv-custom-input'
                        placeholder='Paste any chart URL to embed...'
                        value={customUrl}
                        onChange={e => setCustomUrl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && loadCustom()}
                    />
                    <button className='admin-btn admin-btn--primary' onClick={loadCustom}>
                        Load
                    </button>
                </div>
            </div>

            <div className='tv-frame-wrapper'>
                {loading && (
                    <div className='tv-frame-loader'>
                        <div className='tv-spinner' />
                        <span>Loading chart...</span>
                    </div>
                )}
                <iframe
                    key={activeUrl}
                    src={activeUrl}
                    className='tv-frame'
                    title='Chart'
                    onLoad={() => setLoading(false)}
                    allow='fullscreen'
                    sandbox='allow-scripts allow-same-origin allow-forms allow-popups'
                />
            </div>
        </div>
    );
};

export default TradingViewTab;
