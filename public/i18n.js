'use strict';

/* ── Translations ─────────────────────────────────────────────────────────── */
const TRANSLATIONS = {
  de: {
    // Navigation
    'nav.files':         'Dateien',
    'nav.duplicates':    'Duplikate',
    'nav.monitor':       'Monitor',

    // Archives sidebar
    'arch.section':      'ARCHIVE',
    'arch.none':         'Noch keine Archive',
    'arch.name_ph':      'Name, z.B. Fotos 2024',
    'arch.path_ph':      'Pfad, z.B. /home/user/fotos',
    'arch.path_ph_win':  'Pfad, z.B. C:\\Users\\user\\Fotos',
    'arch.add_title':    'Archiv hinzufügen',
    'arch.scan_title':   'Scannen',
    'arch.remove_title': 'Entfernen',

    // Archive actions / toasts / logs
    'arch.name_required':    'Name und Pfad erforderlich',
    'arch.added':            'Archiv \u201e{name}\u201c hinzugef\u00fcgt',
    'arch.removed':          'Archiv entfernt',
    'arch.log_added':        'Archiv hinzugef\u00fcgt: {name} \u2192 {path}',
    'arch.log_removed':      'Archiv entfernt: {name}',
    'arch.remove_dlg_title': 'Archiv entfernen?',
    'arch.remove_dlg_body':  '\u201e{name}\u201c wird aus dem Index entfernt. Dateien auf der Festplatte bleiben unber\u00fchrt.',
    'arch.scan_started':     'Scan gestartet f\u00fcr Archiv #{id}',
    'arch.scan_done_log':    'Scan abgeschlossen: {indexed} Dateien indexiert, {errors} Fehler',
    'arch.scan_done_toast':  'Scan abgeschlossen: {indexed} Dateien',
    'arch.scan_progress':    'Fortschritt: {indexed} Dateien \u2026',
    'arch.load_error':       'Archive konnten nicht geladen werden: {msg}',

    // Buttons
    'btn.add':    'Hinzuf\u00fcgen',
    'btn.cancel': 'Abbrechen',
    'btn.delete': 'L\u00f6schen',
    'btn.refresh':'Aktualisieren',
    'btn.reset':  'Zur\u00fccksetzen',

    // File table
    'files.filter_name_ph': 'Dateiname suchen \u2026',
    'files.filter_ext_ph':  'Typ: pdf, jpg \u2026',
    'files.filter_dups':    'Nur Duplikate',
    'files.col_name':       'Name',
    'files.col_type':       'Typ',
    'files.col_size':       'Gr\u00f6sse',
    'files.col_archive':    'Archiv',
    'files.col_modified':   'Ge\u00e4ndert',
    'files.col_actions':    'Aktionen',
    'files.empty':          'Noch kein Archiv gescannt.',
    'files.none':           'Keine Dateien gefunden.',
    'files.stats':          '{total} Dateien \u2014 Seite {page}',
    'files.dup_badge':      'Duplikat \u00d7{count}',
    'files.dl_title':       'Herunterladen',
    'files.copy_title':     'Pfad kopieren',
    'files.preview_title':  'Vorschau',
    'files.del_title':      'L\u00f6schen',
    'files.copied':         'Pfad kopiert',
    'files.copy_failed':    'Kopieren fehlgeschlagen',
    'files.del_dlg_title':  'Datei l\u00f6schen?',
    'files.del_dlg_body':   '\u201e{name}\u201c wird unwiderruflich von der Festplatte gel\u00f6scht.',
    'files.deleted':        'Datei gel\u00f6scht',
    'files.log_deleted':    'Datei gel\u00f6scht: {name}',
    'files.load_error':     'Fehler beim Laden der Dateien: {msg}',

    // Duplicates view
    'dups.title':        'Duplikate',
    'dups.none':         'Keine Duplikate gefunden.',
    'dups.success':      '\uD83C\uDF89 Keine Duplikate gefunden!',
    'dups.count':        '{count} identische Dateien',
    'dups.keep':         'Behalten',
    'dups.keeping':      '\u2713 Behalten',
    'dups.resolve_btn':  'Duplikate l\u00f6schen',
    'dups.dlg_title':    'Duplikate aufl\u00f6sen',
    'dups.dlg_body':     '{count} Datei(en) l\u00f6schen?',
    'dups.resolved':     '{count} Duplikat(e) gel\u00f6scht',
    'dups.log_resolved': 'Duplikatgruppe aufgel\u00f6st: {count} Dateien gel\u00f6scht',
    'dups.load_error':   'Fehler: {msg}',
    'dups.dl_title':     'Herunterladen',

    // Monitor
    'monitor.title':      'Monitor',
    'monitor.status':     'Status',
    'monitor.archives':   'Archive',
    'monitor.files':      'Dateien',
    'monitor.total_size': 'Gesamtgr\u00f6sse',
    'monitor.dup_groups': 'Duplikat-Gruppen',
    'monitor.uptime':     'Uptime',
    'monitor.ram':        'RAM',
    'monitor.node':       'Node',
    'monitor.online':     'Online',
    'monitor.err':        'Fehler',
    'monitor.log':        'Aktivit\u00e4tslog',
    'monitor.unreachable':'Monitor nicht erreichbar: {msg}',

    // General errors
    'error.generic':      'Fehler: {msg}',
  },

  en: {
    'nav.files':         'Files',
    'nav.duplicates':    'Duplicates',
    'nav.monitor':       'Monitor',

    'arch.section':      'ARCHIVES',
    'arch.none':         'No archives yet',
    'arch.name_ph':      'Name, e.g. Photos 2024',
    'arch.path_ph':      'Path, e.g. /home/user/photos',
    'arch.path_ph_win':  'Path, e.g. C:\\Users\\user\\Photos',
    'arch.add_title':    'Add archive',
    'arch.scan_title':   'Scan',
    'arch.remove_title': 'Remove',

    'arch.name_required':    'Name and path are required',
    'arch.added':            'Archive \u201c{name}\u201d added',
    'arch.removed':          'Archive removed',
    'arch.log_added':        'Archive added: {name} \u2192 {path}',
    'arch.log_removed':      'Archive removed: {name}',
    'arch.remove_dlg_title': 'Remove archive?',
    'arch.remove_dlg_body':  '\u201c{name}\u201d will be removed from the index. Files on disk will remain untouched.',
    'arch.scan_started':     'Scan started for archive #{id}',
    'arch.scan_done_log':    'Scan complete: {indexed} files indexed, {errors} errors',
    'arch.scan_done_toast':  'Scan complete: {indexed} files',
    'arch.scan_progress':    'Progress: {indexed} files \u2026',
    'arch.load_error':       'Failed to load archives: {msg}',

    'btn.add':    'Add',
    'btn.cancel': 'Cancel',
    'btn.delete': 'Delete',
    'btn.refresh':'Refresh',
    'btn.reset':  'Reset',

    'files.filter_name_ph': 'Search filename \u2026',
    'files.filter_ext_ph':  'Type: pdf, jpg \u2026',
    'files.filter_dups':    'Duplicates only',
    'files.col_name':       'Name',
    'files.col_type':       'Type',
    'files.col_size':       'Size',
    'files.col_archive':    'Archive',
    'files.col_modified':   'Modified',
    'files.col_actions':    'Actions',
    'files.empty':          'No archive scanned yet.',
    'files.none':           'No files found.',
    'files.stats':          '{total} files \u2014 Page {page}',
    'files.dup_badge':      'Duplicate \u00d7{count}',
    'files.dl_title':       'Download',
    'files.copy_title':     'Copy path',
    'files.preview_title':  'Preview',
    'files.del_title':      'Delete',
    'files.copied':         'Path copied',
    'files.copy_failed':    'Copy failed',
    'files.del_dlg_title':  'Delete file?',
    'files.del_dlg_body':   '\u201c{name}\u201d will be permanently deleted from disk.',
    'files.deleted':        'File deleted',
    'files.log_deleted':    'File deleted: {name}',
    'files.load_error':     'Error loading files: {msg}',

    'dups.title':        'Duplicates',
    'dups.none':         'No duplicates found.',
    'dups.success':      '\uD83C\uDF89 No duplicates found!',
    'dups.count':        '{count} identical files',
    'dups.keep':         'Keep',
    'dups.keeping':      '\u2713 Kept',
    'dups.resolve_btn':  'Delete duplicates',
    'dups.dlg_title':    'Resolve duplicates',
    'dups.dlg_body':     'Delete {count} file(s)?',
    'dups.resolved':     '{count} duplicate(s) deleted',
    'dups.log_resolved': 'Duplicate group resolved: {count} files deleted',
    'dups.load_error':   'Error: {msg}',
    'dups.dl_title':     'Download',

    'monitor.title':      'Monitor',
    'monitor.status':     'Status',
    'monitor.archives':   'Archives',
    'monitor.files':      'Files',
    'monitor.total_size': 'Total size',
    'monitor.dup_groups': 'Duplicate groups',
    'monitor.uptime':     'Uptime',
    'monitor.ram':        'RAM',
    'monitor.node':       'Node',
    'monitor.online':     'Online',
    'monitor.err':        'Error',
    'monitor.log':        'Activity log',
    'monitor.unreachable':'Monitor unreachable: {msg}',

    'error.generic':      'Error: {msg}',
  },

  fr: {
    'nav.files':         'Fichiers',
    'nav.duplicates':    'Doublons',
    'nav.monitor':       'Moniteur',

    'arch.section':      'ARCHIVES',
    'arch.none':         'Aucune archive',
    'arch.name_ph':      'Nom, p.ex. Photos 2024',
    'arch.path_ph':      'Chemin, p.ex. /home/user/photos',
    'arch.path_ph_win':  'Chemin, p.ex. C:\\Users\\user\\Photos',
    'arch.add_title':    'Ajouter une archive',
    'arch.scan_title':   'Scanner',
    'arch.remove_title': 'Supprimer',

    'arch.name_required':    'Le nom et le chemin sont requis',
    'arch.added':            'Archive \u00ab\u00a0{name}\u00a0\u00bb ajout\u00e9e',
    'arch.removed':          'Archive supprim\u00e9e',
    'arch.log_added':        'Archive ajout\u00e9e\u00a0: {name} \u2192 {path}',
    'arch.log_removed':      'Archive supprim\u00e9e\u00a0: {name}',
    'arch.remove_dlg_title': 'Supprimer l\u2019archive\u00a0?',
    'arch.remove_dlg_body':  '\u00ab\u00a0{name}\u00a0\u00bb sera retir\u00e9e de l\u2019index. Les fichiers sur le disque restent intacts.',
    'arch.scan_started':     'Scan d\u00e9marr\u00e9 pour l\u2019archive #{id}',
    'arch.scan_done_log':    'Scan termin\u00e9\u00a0: {indexed} fichiers index\u00e9s, {errors} erreurs',
    'arch.scan_done_toast':  'Scan termin\u00e9\u00a0: {indexed} fichiers',
    'arch.scan_progress':    'Progression\u00a0: {indexed} fichiers \u2026',
    'arch.load_error':       'Impossible de charger les archives\u00a0: {msg}',

    'btn.add':    'Ajouter',
    'btn.cancel': 'Annuler',
    'btn.delete': 'Supprimer',
    'btn.refresh':'Actualiser',
    'btn.reset':  'R\u00e9initialiser',

    'files.filter_name_ph': 'Rechercher un fichier \u2026',
    'files.filter_ext_ph':  'Type\u00a0: pdf, jpg \u2026',
    'files.filter_dups':    'Doublons uniquement',
    'files.col_name':       'Nom',
    'files.col_type':       'Type',
    'files.col_size':       'Taille',
    'files.col_archive':    'Archive',
    'files.col_modified':   'Modifi\u00e9',
    'files.col_actions':    'Actions',
    'files.empty':          'Aucune archive scann\u00e9e.',
    'files.none':           'Aucun fichier trouv\u00e9.',
    'files.stats':          '{total} fichiers \u2014 Page {page}',
    'files.dup_badge':      'Doublon \u00d7{count}',
    'files.dl_title':       'T\u00e9l\u00e9charger',
    'files.copy_title':     'Copier le chemin',
    'files.preview_title':  'Aper\u00e7u',
    'files.del_title':      'Supprimer',
    'files.copied':         'Chemin copi\u00e9',
    'files.copy_failed':    '\u00c9chec de la copie',
    'files.del_dlg_title':  'Supprimer le fichier\u00a0?',
    'files.del_dlg_body':   '\u00ab\u00a0{name}\u00a0\u00bb sera d\u00e9finitivement supprim\u00e9 du disque.',
    'files.deleted':        'Fichier supprim\u00e9',
    'files.log_deleted':    'Fichier supprim\u00e9\u00a0: {name}',
    'files.load_error':     'Erreur lors du chargement\u00a0: {msg}',

    'dups.title':        'Doublons',
    'dups.none':         'Aucun doublon trouv\u00e9.',
    'dups.success':      '\uD83C\uDF89 Aucun doublon trouv\u00e9\u00a0!',
    'dups.count':        '{count} fichiers identiques',
    'dups.keep':         'Conserver',
    'dups.keeping':      '\u2713 Conserv\u00e9',
    'dups.resolve_btn':  'Supprimer les doublons',
    'dups.dlg_title':    'R\u00e9soudre les doublons',
    'dups.dlg_body':     'Supprimer {count} fichier(s)\u00a0?',
    'dups.resolved':     '{count} doublon(s) supprim\u00e9(s)',
    'dups.log_resolved': 'Groupe de doublons r\u00e9solu\u00a0: {count} fichiers supprim\u00e9s',
    'dups.load_error':   'Erreur\u00a0: {msg}',
    'dups.dl_title':     'T\u00e9l\u00e9charger',

    'monitor.title':      'Moniteur',
    'monitor.status':     'Statut',
    'monitor.archives':   'Archives',
    'monitor.files':      'Fichiers',
    'monitor.total_size': 'Taille totale',
    'monitor.dup_groups': 'Groupes de doublons',
    'monitor.uptime':     'Disponibilit\u00e9',
    'monitor.ram':        'RAM',
    'monitor.node':       'Node',
    'monitor.online':     'En ligne',
    'monitor.err':        'Erreur',
    'monitor.log':        'Journal d\u2019activit\u00e9',
    'monitor.unreachable':'Moniteur inaccessible\u00a0: {msg}',

    'error.generic':      'Erreur\u00a0: {msg}',
  },
};

/* ── Locale map ───────────────────────────────────────────────────────────── */
const LOCALES = { de: 'de-CH', en: 'en-GB', fr: 'fr-CH' };

/* ── State ────────────────────────────────────────────────────────────────── */
let _lang = (function () {
  try { return localStorage.getItem('av_lang') || 'de'; } catch { return 'de'; }
})();
if (!TRANSLATIONS[_lang]) _lang = 'de';

/* ── Public API (attached to window for vanilla-JS access) ───────────────── */

/**
 * Translate a key, interpolating {varName} placeholders.
 * Falls back to the German string, then to the raw key.
 */
window.t = function t(key, vars) {
  let str = TRANSLATIONS[_lang]?.[key] ?? TRANSLATIONS.de?.[key] ?? key;
  if (vars) {
    str = str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : `{${k}}`));
  }
  return str;
};

/** Return current language code ('de' | 'en' | 'fr'). */
window.getLang = function getLang() { return _lang; };

/** Return the BCP-47 locale string for the current language. */
window.getLocale = function getLocale() { return LOCALES[_lang] || 'de-CH'; };

/**
 * Switch language, persist to localStorage, apply to DOM and dispatch
 * a 'langchange' event so app.js can re-render dynamic content.
 */
window.setLang = function setLang(lang) {
  if (!TRANSLATIONS[lang]) return;
  _lang = lang;
  try { localStorage.setItem('av_lang', lang); } catch {}
  applyTranslations();
  document.dispatchEvent(new Event('langchange'));
};

/**
 * Walk all [data-i18n], [data-i18n-ph] and [data-i18n-title] elements
 * and update their content / attributes.
 */
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = window.t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    el.placeholder = window.t(el.dataset.i18nPh);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = window.t(el.dataset.i18nTitle);
  });
  // Highlight active language button
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === _lang);
  });
  document.documentElement.lang = _lang;
}

/* Apply translations immediately when the DOM is ready. */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyTranslations);
} else {
  applyTranslations();
}
