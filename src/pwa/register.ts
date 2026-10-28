import { registerSW } from 'virtual:pwa-register';
import { connectPwaStatus } from '../components/organisms/PwaStatus';

export function registerPwa(): void {
  const status = connectPwaStatus();
  if (import.meta.env.DEV) { status.development(); return; }
  if (!window.isSecureContext || !('serviceWorker' in navigator)) { status.unsupported(); return; }
  let registration: ServiceWorkerRegistration | undefined;
  const update = registerSW({
    immediate: true,
    onOfflineReady: () => status.offlineReady(),
    onNeedRefresh: () => status.needRefresh(),
    onRegisteredSW(_url, sw) {
      registration = sw;
      // Includes returning offline visits where the worker is already installed.
      void navigator.serviceWorker.ready.then(() => status.offlineReady());
    },
    onRegisterError(error: unknown) {
      status.error();
      console.error('PWA registration failed', error);
    },
  });
  status.setUpdater(() => update(true));
  const check = (): void => {
    if (navigator.onLine) void registration?.update().catch(() => {});
  };
  window.addEventListener('online', check);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
}
