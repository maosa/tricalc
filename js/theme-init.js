/* Runs synchronously in <head>, before first paint, so the page never
   flashes the wrong theme. Kept as an external file (not inline) so the
   Content-Security-Policy in _headers can forbid inline scripts. */
(function () {
    try {
        var saved = localStorage.getItem('tricalc.theme');
        var theme = saved || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
        if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light');
    } catch (e) {}
})();
