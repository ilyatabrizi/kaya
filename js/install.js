// Add to Home Screen.
//
// Chrome fires beforeinstallprompt and lets us ask later; iOS Safari has no
// such event and the user has to go through the share sheet, so the account
// page falls back to telling them how. Both paths lead to an icon named KAYA.

let deferred = null;

addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferred = e;
  document.documentElement.classList.add('can-install');
});

addEventListener('appinstalled', () => {
  deferred = null;
  document.documentElement.classList.remove('can-install');
});

export const canInstall = () => !!deferred;

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches
  || window.navigator.standalone === true;

export async function promptInstall() {
  if (!deferred) return false;
  deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  document.documentElement.classList.remove('can-install');
  return outcome === 'accepted';
}

export function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol === 'file:') return;
  const reg = () => navigator.serviceWorker.register('sw.js')
    .catch(() => { /* not fatal — the app works without it */ });
  // This is called after an await, so `load` has usually already fired and a
  // listener for it would never run.
  if (document.readyState === 'complete') reg();
  else addEventListener('load', reg, { once: true });
}
