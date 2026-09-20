import { useEffect } from 'react';
import { useStore } from '@/hooks/useStore';
import { useDevice } from '@deriv-com/ui';
import { applyStoredColors } from '@/components/admin-portal/AdminPortalContext';
import './main-body.scss';

type TMainBodyProps = {
    children: React.ReactNode;
};

const MainBody: React.FC<TMainBodyProps> = ({ children }) => {
    const current_theme = localStorage.getItem('theme') ?? 'light';
    const { ui } = useStore() ?? {
        ui: {
            setDevice: () => {},
        },
    };
    const { setDevice } = ui;
    const { isDesktop, isMobile, isTablet } = useDevice();

    useEffect(() => {
        const body = document.querySelector('body');
        const root = document.documentElement;
        if (!body) return;
        const theme = current_theme === 'light' ? 'light' : 'dark';
        [root, body].forEach(element => {
            element.classList.remove('theme--light', 'theme--dark');
            element.classList.add(`theme--${theme}`);
            element.setAttribute('data-theme-mode', theme);
        });
        applyStoredColors();
        window.dispatchEvent(new Event('theme_changed'));
    }, [current_theme]);

    useEffect(() => {
        if (isMobile) {
            setDevice('mobile');
        } else if (isTablet) {
            setDevice('tablet');
        } else {
            setDevice('desktop');
        }
    }, [isDesktop, isMobile, isTablet, setDevice]);

    return <div className='main-body'>{children}</div>;
};

export default MainBody;
