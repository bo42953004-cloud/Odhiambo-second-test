// Live market ticker shown beneath the logo mark in the header.
// Subscribes to Deriv API ticks for whichever symbol is active in the bot
// (chart_store.symbol) and re-subscribes whenever the symbol changes.
import { useEffect, useRef, useState } from 'react';
import { reaction } from 'mobx';
import { api_base } from '@/external/bot-skeleton';
import { useStore } from '@/hooks/useStore';

type TickState = {
    price: number;
    dir: 1 | -1 | 0;
};

const HeaderTicker = () => {
    const store = useStore();
    const [tick, setTick] = useState<TickState | null>(null);
    const [symbolDisplay, setSymbolDisplay] = useState('');
    const subIdRef = useRef<string | null>(null);
    const msgSubRef = useRef<{ unsubscribe: () => void } | null>(null);
    const lastPriceRef = useRef<number>(0);
    const currentSymRef = useRef<string>('');

    const subscribeTicks = (symbol: string) => {
        if (!symbol || symbol === currentSymRef.current) return;
        currentSymRef.current = symbol;

        // Cleanup previous subscription
        msgSubRef.current?.unsubscribe();
        msgSubRef.current = null;
        if (subIdRef.current) {
            try { api_base.api?.send({ forget: subIdRef.current }); } catch { /* ignore */ }
            subIdRef.current = null;
        }
        lastPriceRef.current = 0;
        setTick(null);

        // Get display name from active_symbols
        const activeSymbols: any[] = api_base.active_symbols ?? [];
        const symInfo = activeSymbols.find(
            (s: any) => s.symbol === symbol || s.underlying_symbol === symbol
        );
        const display = symInfo?.display_name || symInfo?.symbol_name || symbol;
        setSymbolDisplay(display);

        // Subscribe to live ticks
        try {
            api_base.api?.send({ ticks: symbol, subscribe: 1 });
            const sub = api_base.api?.onMessage().subscribe(({ data }: any) => {
                if (!data) return;
                if (data.msg_type === 'tick' && data.tick?.symbol === symbol) {
                    const price: number = data.tick.quote ?? data.tick.ask ?? 0;
                    const prev = lastPriceRef.current;
                    const dir: 1 | -1 | 0 = prev === 0 ? 0 : price > prev ? 1 : price < prev ? -1 : 0;
                    lastPriceRef.current = price;
                    // Store subscription id for later forget
                    if (data.subscription?.id && !subIdRef.current) {
                        subIdRef.current = data.subscription.id;
                    }
                    const pipSize: number = data.tick.pip_size ?? symInfo?.pip_size ?? 2;
                    setTick({ price: parseFloat(price.toFixed(pipSize)), dir });
                }
            });
            msgSubRef.current = sub as { unsubscribe: () => void };
        } catch { /* API not ready */ }
    };

    useEffect(() => {
        if (!store?.chart_store) return;

        // Subscribe to current symbol immediately
        const sym = store.chart_store.symbol;
        if (sym) subscribeTicks(sym);

        // React to future symbol changes via MobX reaction
        const dispose = reaction(
            () => store.chart_store?.symbol,
            (newSymbol) => {
                if (newSymbol) subscribeTicks(newSymbol);
            }
        );

        return () => {
            dispose();
            msgSubRef.current?.unsubscribe();
            msgSubRef.current = null;
            if (subIdRef.current) {
                try { api_base.api?.send({ forget: subIdRef.current }); } catch { /* ignore */ }
                subIdRef.current = null;
            }
            currentSymRef.current = '';
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [store?.chart_store]);

    if (!tick || !symbolDisplay) return null;

    const dirClass = tick.dir > 0 ? 'up' : tick.dir < 0 ? 'down' : 'flat';

    return (
        <span className={`header-ticker header-ticker--${dirClass}`} title={`${symbolDisplay}: ${tick.price}`}>
            <span className='header-ticker__sym'>{symbolDisplay}</span>
            <span className='header-ticker__price'>{tick.price}</span>
            <span className='header-ticker__arrow'>{tick.dir > 0 ? '▲' : tick.dir < 0 ? '▼' : '●'}</span>
        </span>
    );
};

export default HeaderTicker;
