import { getLoaderStyle } from '@/components/admin-portal/AdminPortalContext';
import { LoaderPreview, AdvancedLoader } from '@/components/admin-portal/tabs/LoadingAnimations';
import '@/components/admin-portal/AdminPortal.scss';

const ADVANCED_STYLES = ['matrix', 'neon', 'cinematic'];

export default function ChunkLoader({ message }: { message: string }) {
    const style = getLoaderStyle();
    if (ADVANCED_STYLES.includes(style)) {
        return <AdvancedLoader style={style as any} message={message} />;
    }
    return (
        <div className='app-root admin-loader'>
            <LoaderPreview style={style} />
            <div className='admin-loader__message'>{message}</div>
        </div>
    );
}
