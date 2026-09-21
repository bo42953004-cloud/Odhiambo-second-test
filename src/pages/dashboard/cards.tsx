// @ts-nocheck — vendored bot code with known upstream type gaps; see AGENTS.md
import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import GoogleDrive from '@/components/load-modal/google-drive';
import Dialog from '@/components/shared_ui/dialog';
import MobileFullPageModal from '@/components/shared_ui/mobile-full-page-modal';
import Text from '@/components/shared_ui/text';
import { DBOT_TABS } from '@/constants/bot-contents';
import { useStore } from '@/hooks/useStore';
import { Localize, localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import DashboardBotList from './bot-list/dashboard-bot-list';

/* ─── DigitTools Feature Card (corner accent) ─── */
function Corner({ c, pos }: { c: string; pos: string }) {
    const map: Record<string, string> = {
        tl: 'left-0 top-0 border-l-2 border-t-2 rounded-tl-[18px]',
        tr: 'right-0 top-0 border-r-2 border-t-2 rounded-tr-[18px]',
        bl: 'left-0 bottom-0 border-l-2 border-b-2 rounded-bl-[18px]',
        br: 'right-0 bottom-0 border-r-2 border-b-2 rounded-br-[18px]',
    };
    return (
        <span
            className={`pointer-events-none absolute h-6 w-6 opacity-0 transition-all duration-500 group-hover:opacity-100 ${map[pos]}`}
            style={{ borderColor: c, filter: `drop-shadow(0 0 6px ${c})` }}
        />
    );
}

type TCardProps = {
    has_dashboard_strategies: boolean;
    is_mobile: boolean;
};

const Cards = observer(({ is_mobile, has_dashboard_strategies }: TCardProps) => {
    const { dashboard, load_modal, quick_strategy, google_drive } = useStore();
    const { toggleLoadModal, setActiveTabIndex } = load_modal;
    const { is_google_drive_configured } = google_drive;
    const { isDesktop } = useDevice();
    const { onCloseDialog, dialog_options, is_dialog_open, setActiveTab, setPreviewOnPopup } = dashboard;
    const { setFormVisibility } = quick_strategy;

    const openFileLoader = () => {
        toggleLoadModal();
        setActiveTabIndex(is_mobile ? 0 : 1);
        setActiveTab(DBOT_TABS.BOT_BUILDER);
    };

    const openGoogleDriveDialog = () => {
        const google_drive_tab_index = isDesktop ? 2 : 1;
        toggleLoadModal();
        setActiveTabIndex(google_drive_tab_index);
        setActiveTab(DBOT_TABS.BOT_BUILDER);
    };

    const openBotBuilder = () => {
        setActiveTab(DBOT_TABS.BOT_BUILDER);
    };

    const openQuickStrategy = () => {
        setActiveTab(DBOT_TABS.BOT_BUILDER);
        setFormVisibility(true);
    };

    // DigitTools-style feature cards
    const CARDS = [
        {
            n: '01',
            title: 'LOAD BOT',
            sub: 'Import a bot from your computer',
            img: '/icons/load-bot.png',
            c: 'var(--blue)',
            rgb: '47,123,255',
            action: openFileLoader,
            badge: 'Select a file →',
        },
        {
            n: '02',
            title: 'BOT BUILDER',
            sub: 'Build a bot from scratch',
            img: '/icons/manual-trading.png',
            c: 'var(--purple)',
            rgb: '139,92,246',
            action: openBotBuilder,
            badge: 'Open builder →',
            popular: true,
        },
        {
            n: '03',
            title: 'QUICK STRATEGY',
            sub: 'Start with a pre-built strategy',
            img: '/icons/speed-bot.png',
            c: 'var(--cyan)',
            rgb: '41,211,245',
            action: openQuickStrategy,
            badge: 'Choose template →',
        },
        ...(is_google_drive_configured ? [{
            n: '04',
            title: 'GOOGLE DRIVE',
            sub: 'Import from your cloud storage',
            img: '/icons/premium-bots.png',
            c: 'var(--gold)',
            rgb: '245,183,49',
            action: openGoogleDriveDialog,
            badge: 'Connect →',
        }] : []),
    ];

    return (
        <>
            <div className="tab__dashboard__table">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" id="tab__dashboard__table__tiles">
                    {CARDS.map((cd, i) => (
                        <button
                            key={cd.title}
                            onClick={() => cd.action()}
                            aria-label={cd.title}
                            className="dt-card dt-sheen group relative overflow-hidden p-5 text-center active:scale-[.99]"
                            style={{
                                borderColor: `rgba(${cd.rgb},.55)`,
                                boxShadow: `inset 0 1px 0 rgba(255,255,255,.07), 0 0 0 1px rgba(${cd.rgb},.16), 0 30px 70px -34px rgba(${cd.rgb},.75)`,
                                animation: `dt-up .8s cubic-bezier(.22,1,.36,1) ${i * 130}ms both`,
                            }}
                        >
                            {/* number badge */}
                            <span
                                className="absolute right-3.5 top-3.5 grid h-9 w-9 place-items-center rounded-lg border text-[15px] font-extrabold transition-transform duration-500 group-hover:scale-110"
                                style={{
                                    borderColor: `rgba(${cd.rgb},.6)`,
                                    color: cd.c,
                                    background: `rgba(${cd.rgb},.10)`,
                                }}
                            >
                                {cd.n}
                            </span>

                            {cd.popular && (
                                <span
                                    className="absolute left-3.5 top-3.5 flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-black tracking-wider text-white"
                                    style={{ background: 'linear-gradient(90deg,#8b5cf6,#c026d3)', boxShadow: '0 6px 18px -6px #a855f7' }}
                                >
                                    ★ POPULAR
                                </span>
                            )}

                            {/* halo */}
                            <span
                                className="pointer-events-none absolute left-1/2 top-[38%] h-[210px] w-[210px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[46px] A-glow"
                                style={{ background: `radial-gradient(circle, rgba(${cd.rgb},.55), transparent 68%)`, animationDelay: `${i * 400}ms` }}
                            />

                            {/* orbit ring */}
                            <span
                                className="pointer-events-none absolute left-1/2 top-[38%] h-[178px] w-[178px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed A-spin"
                                style={{ borderColor: `rgba(${cd.rgb},.30)`, animationDuration: `${16 + i * 3}s` }}
                            />

                            <div className="relative mx-auto h-[168px] w-[168px]">
                                <img
                                    src={cd.img}
                                    alt={cd.title}
                                    loading="lazy"
                                    className="dt-blend h-full w-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.12] group-hover:-rotate-3"
                                    draggable={false}
                                />
                            </div>

                            <h3
                                className="relative mt-1 text-[19px] font-extrabold tracking-[0.06em] transition-all duration-500 group-hover:tracking-[0.12em]"
                                style={{ color: cd.popular ? '#c9b1ff' : cd.c }}
                            >
                                {cd.title}
                            </h3>
                            <p className="relative mt-1.5 text-[12.5px] leading-snug" style={{ color: 'var(--muted)' }}>
                                {cd.sub}
                            </p>

                            <span
                                className="relative mt-3 inline-block h-[3px] w-8 rounded-full transition-all duration-500 group-hover:w-16"
                                style={{ background: cd.c, boxShadow: `0 0 12px ${cd.c}` }}
                            />

                            <span
                                className="relative mx-auto mt-3 flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider transition-transform duration-500 group-hover:scale-105"
                                style={{ borderColor: `rgba(${cd.rgb},.5)`, background: `rgba(${cd.rgb},.10)`, color: cd.c }}
                            >
                                {cd.badge}
                            </span>

                            <Corner c={cd.c} pos="tl" />
                            <Corner c={cd.c} pos="tr" />
                            <Corner c={cd.c} pos="bl" />
                            <Corner c={cd.c} pos="br" />
                        </button>
                    ))}
                </div>

                {!isDesktop ? (
                    <Dialog
                        title={dialog_options.title}
                        is_visible={is_dialog_open}
                        onCancel={onCloseDialog}
                        is_mobile_full_width
                        className='dc-dialog__wrapper--google-drive'
                        has_close_icon
                    >
                        <GoogleDrive />
                    </Dialog>
                ) : (
                    <MobileFullPageModal
                        is_modal_open={is_dialog_open}
                        className='load-strategy__wrapper'
                        header={localize('Load strategy')}
                        onClickClose={() => {
                            setPreviewOnPopup(false);
                            onCloseDialog();
                        }}
                        height_offset='80px'
                    >
                        <div label='Google Drive' className='google-drive-label'>
                            <GoogleDrive />
                        </div>
                    </MobileFullPageModal>
                )}
                <DashboardBotList />
            </div>
        </>
    );
});

export default Cards;
