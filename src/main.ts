import '@fontsource/noto-sans-thai/400.css';
import '@fontsource/noto-sans-thai/500.css';
import '@fontsource/noto-sans-thai/600.css';
import '@fontsource/mitr/500.css';
import '@fontsource/mitr/600.css';
import '@fontsource/ibm-plex-mono/500.css';
import './styles.css';
import { LotteryPage } from './pages/LotteryPage';
import { registerPwa } from './pwa/register';

const root = document.getElementById('app');
if (!root) throw new Error('Missing application root');
LotteryPage(root);
registerPwa();
