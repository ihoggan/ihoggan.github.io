/* sw-register.js — switches on offline support (see sw.js).
   Does nothing in browsers that don't support it, and nothing
   when a page is opened straight from a downloaded copy (file://). */
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {
      /* Offline support is a bonus; the page works without it. */
    });
  });
}
