// Inline <head> script: sets <html data-language> from the saved choice (or the geo-routed
// tb-locale cookie on a first visit) before the first paint. Pages are pre-rendered in the
// bilingual default, so text that has per-language variants (components/LangText.tsx) can pick
// the right one with CSS immediately instead of re-flowing after hydration.
// Keep in sync with LanguageProvider (storage key "toolbox123:language", cookie "tb-locale").
export const languageInitScript = `
(function() {
  try {
    var mode = null;
    var raw = localStorage.getItem('toolbox123:language');
    if (raw) mode = JSON.parse(raw);
    if (!mode) {
      var m = document.cookie.match(/(?:^|; )tb-locale=(en|km)/);
      if (m) mode = m[1];
    }
    if (typeof mode === 'string') document.documentElement.setAttribute('data-language', mode);
  } catch (e) {}
})();
`;
