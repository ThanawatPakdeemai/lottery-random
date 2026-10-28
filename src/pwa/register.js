import { registerSW } from 'virtual:pwa-register';
export function registerPwa(status) {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) {
    status.error(); return;
  }
  if (import.meta.env.DEV) return; // Verify offline behavior against build + preview.
  let registration;
  const update = registerSW({
    immediate: true,
    onOfflineReady: () => status.offlineReady(),
    onNeedRefresh: () => status.needRefresh(),
    onRegisterError: () => status.error(),
    onRegisteredSW(_url, sw) {
      registration = sw;
      // ready resolves after install/activation, including a returning offline visit.
      navigator.serviceWorker.ready.then(() => status.offlineReady());
    },
  });
  status.setUpdater(update);
  // Avoid reloading in the middle of a draw. Updates activate only on user request.
  const check = () => { if (navigator.onLine) registration?.update().catch(() => {}); };
  window.addEventListener('online', check);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
}
