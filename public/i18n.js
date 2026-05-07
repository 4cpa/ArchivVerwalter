'use strict';

/* ── Translations ─────────────────────────────────────────────────────────── */
const TRANSLATIONS = {
  de: {
    // Navigation
    'nav.files':         'Dateien',
    'nav.duplicates':    'Duplikate',
    'nav.monitor':       'Monitor',
    'nav.stats':         'Statistik',

    // Archives sidebar
    'arch.section':      'ARCHIVE',
    'arch.none':         'Noch keine Archive',
    'arch.name_ph':      'Name, z.B. Fotos 2024',
    'arch.path_ph':      'Pfad, z.B. /home/user/fotos',
    'arch.path_ph_win':  'Pfad, z.B. C:\\Users\\user\\Fotos oder \\\\Server\\Freigabe',
    'arch.add_title':    'Archiv hinzufügen',
    'arch.scan_title':   'Scannen',
    'arch.scan_btn':     'Scan starten',
    'arch.scanning':     'Wird gescannt\u2026',
    'arch.removing':     'Wird entfernt\u2026',
    'arch.remove_title': 'Entfernen',

    // Archive actions / toasts / logs
    'arch.path_required':    'Pfad erforderlich',
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
    'files.filters_reset': 'Filter zur\u00fcckgesetzt',

    // File table
    'files.filter_name_ph': 'Dateiname suchen \u2026',
    'files.filter_ext_ph':  'Typ: pdf, jpg \u2026',
    'files.filter_dups':    'Nur Duplikate',
    'files.col_name':       'Name',
    'files.col_type':       'Typ',
    'files.col_size':       'Gr\u00f6sse',
    'files.col_archive':    'Archiv',
    'files.col_modified':   'Ge\u00e4ndert',
    'files.col_created':    'Erstellt',
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
    'files.refreshed':      'Aktualisiert — {count} Datei(en)',
    'files.select_all_title': 'Alle w\u00e4hlen / abw\u00e4hlen',
    'files.selected':        '{count} ausgew\u00e4hlt',
    'files.deselect_all':    'Auswahl aufheben',
    'files.bulk_del_title':  'Dateien l\u00f6schen?',
    'files.bulk_del_body':   '{count} Datei(en) unwiderruflich von der Festplatte l\u00f6schen?',
    'files.bulk_del_done':     '{count} Datei(en) gel\u00f6scht',
    'files.bulk_del_errors':   '{errors} Fehler beim L\u00f6schen',
    'files.bulk_copy_paths':   'Pfade kopieren',
    'files.bulk_copy_done':    '{count} Pfad(e) kopiert',

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
    'dups.refreshed':    'Aktualisiert \u2014 {count} Gruppe(n) gefunden',
    'dups.dl_title':     'Herunterladen',
    'dups.groups':       'Gruppen',
    'dups.resolve_all':         'Alle auflösen',
    'dups.resolve_all_confirm': 'Alle {groups} Duplikatgruppe(n) auflösen? Jeweils die erste Datei wird behalten, alle anderen unwiderruflich gelöscht.',
    'dups.resolve_all_done':    '{deleted} Datei(en) aus {groups} Gruppe(n) gelöscht',

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

    // Filesystem browser
    'fs.browse':      '\u{1F4C2}',
    'fs.drives':      'Laufwerke & Datentr\u00e4ger',
    'fs.select':      'Diesen Ordner w\u00e4hlen',
    'fs.up':          '\u00dcbergeordneter Ordner',
    'fs.loading':     'L\u00e4dt\u2026',
    'fs.no_dirs':     'Keine Unterordner',
    'fs.no_drives':   'Keine Laufwerke gefunden',
    'fs.err_browse':  'Fehler: {msg}',

    // File preview modal
    'preview.loading':         'L\u00e4dt\u2026',
    'preview.no_preview':      'F\u00fcr diesen Dateityp ist keine Vorschau verf\u00fcgbar.',
    'preview.load_error':      'Vorschau konnte nicht geladen werden.',
    'preview.opening_os':      'Wird mit Standardprogramm ge\u00f6ffnet\u2026',
    'preview.opening_with':    'Wird mit {prog} ge\u00f6ffnet\u2026',
    'preview.open_os_error':   'Datei konnte nicht ge\u00f6ffnet werden.',
    'preview.open_with_title': 'Datei \u00f6ffnen',
    'preview.no_viewer':       'F\u00fcr diesen Dateityp ist kein interner Viewer verf\u00fcgbar.',
    'preview.open_default':    'Mit Standardprogramm \u00f6ffnen',
    'preview.open_custom_ph':  'z.\u202fB. vlc, gimp, libreoffice\u00a0\u2026',
    'preview.open_btn':        '\u00d6ffnen',
    'preview.always_for':      'Immer f\u00fcr {ext}-Dateien verwenden',
    'preview.this_type':       'diesen Dateityp',
    'preview.copy_path':       'Pfad kopieren',

    // Statistics
    'stats.title':           'Statistik',
    'stats.dl_all':          'Log herunterladen',
    'stats.dl_archive':      'Log dieses Archivs',
    'stats.browse_btn':      'Durchsuchen',
    'stats.browser_hint':    'Archiv auswählen, um zu durchsuchen',
    'stats.browser_empty':   'Keine Dateien in diesem Verzeichnis.',
    'stats.browser_loading': 'Lädt…',
    'stats.back':            'Zurück',
    'stats.files':           'Dateien',
    'stats.card_archives':   'Archive',
    'stats.card_files':      'Dateien',
    'stats.card_size':       'Gesamtgrösse',
    'stats.card_dups':       'Duplikat-Gruppen',
    'stats.types':           'Dateitypen',
    'stats.load_error':      'Fehler beim Laden: {msg}',
    'stats.no_archives':     'Noch keine Archive vorhanden.',
    'stats.loading':         'Lädt Statistik…',
    'stats.created':         'Erstellt',
    'stats.modified':        'Geändert',

    // Footer donate
    'footer.donate':      'Spende',

    // General errors
    'error.generic':      'Fehler: {msg}',

    // Help modal
    'help.btn':           'Hilfe',
    'help.title':         'Bedienungshinweise',
    'help.sec.archives':  'Archive',
    'help.arch.add':      'Mit + ein neues Archiv hinzufügen. Pfad direkt eingeben oder per Ordner-Browser wählen.',
    'help.arch.scan':     'Scan starten indexiert alle Dateien im Ordner. Der Fortschritt wird live angezeigt.',
    'help.arch.remove':   'Entfernen löscht das Archiv aus dem Index – Dateien auf der Festplatte bleiben erhalten.',
    'help.sec.files':     'Dateien',
    'help.files.filter':  'Nach Dateiname, Typ (pdf, jpg …) oder nur Duplikate filtern.',
    'help.files.sort':    'Spaltenköpfe anklicken zum Sortieren auf- oder absteigend.',
    'help.files.date':    '⇄ wechselt zwischen Änderungs- und Erstellungsdatum.',
    'help.files.select':  'Checkboxen für Mehrfachauswahl – dann Löschen oder Pfade kopieren.',
    'help.files.actions': 'Zeilensymbole: Vorschau · Herunterladen · Pfad kopieren · Löschen.',
    'help.sec.dups':      'Duplikate',
    'help.dups.groups':   'Dateien mit identischem Inhalt werden nach Hash-Wert gruppiert.',
    'help.dups.keep':     'Behalten markiert die gewünschte Kopie; alle anderen werden gelöscht.',
    'help.dups.all':      'Alle auflösen behält jeweils die erste Datei jeder Gruppe.',
    'help.sec.stats':     'Statistik',
    'help.stats.desc':    'Archivkarte anklicken für Dateitypen-Übersicht und Verzeichnis-Browser. Log herunterladen exportiert alle Einträge.',
    'help.sec.monitor':   'Monitor',
    'help.monitor.desc':  'Echtzeit-Systemdaten (RAM, Uptime, Status) und Aktivitätslog der laufenden Sitzung.',
    'help.tip':           'Klick ausserhalb des Dialogs oder Escape schliesst die Überlagerung.',
  },

  en: {
    'nav.files':         'Files',
    'nav.duplicates':    'Duplicates',
    'nav.monitor':       'Monitor',
    'nav.stats':         'Statistics',

    'arch.section':      'ARCHIVES',
    'arch.none':         'No archives yet',
    'arch.name_ph':      'Name, e.g. Photos 2024',
    'arch.path_ph':      'Path, e.g. /home/user/photos',
    'arch.path_ph_win':  'Path, e.g. C:\\Users\\user\\Photos or \\\\Server\\Share',
    'arch.add_title':    'Add archive',
    'arch.scan_title':   'Scan',
    'arch.scan_btn':     'Start scan',
    'arch.scanning':     'Scanning\u2026',
    'arch.removing':     'Removing\u2026',
    'arch.remove_title': 'Remove',

    'arch.path_required':    'Path is required',
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
    'files.filters_reset': 'Filters reset',

    'files.filter_name_ph': 'Search filename \u2026',
    'files.filter_ext_ph':  'Type: pdf, jpg \u2026',
    'files.filter_dups':    'Duplicates only',
    'files.col_name':       'Name',
    'files.col_type':       'Type',
    'files.col_size':       'Size',
    'files.col_archive':    'Archive',
    'files.col_modified':   'Modified',
    'files.col_created':    'Created',
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
    'files.refreshed':      'Refreshed — {count} file(s)',
    'files.select_all_title': 'Select / deselect all',
    'files.selected':        '{count} selected',
    'files.deselect_all':    'Clear selection',
    'files.bulk_del_title':  'Delete files?',
    'files.bulk_del_body':   'Permanently delete {count} file(s) from disk?',
    'files.bulk_del_done':     '{count} file(s) deleted',
    'files.bulk_del_errors':   '{errors} error(s) during deletion',
    'files.bulk_copy_paths':   'Copy paths',
    'files.bulk_copy_done':    '{count} path(s) copied',

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
    'dups.refreshed':    'Refreshed \u2014 {count} group(s) found',
    'dups.dl_title':     'Download',
    'dups.groups':       'groups',
    'dups.resolve_all':         'Resolve all',
    'dups.resolve_all_confirm': 'Resolve all {groups} duplicate group(s)? The first file in each group is kept; all others are permanently deleted.',
    'dups.resolve_all_done':    '{deleted} file(s) deleted from {groups} group(s)',

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

    // Filesystem browser
    'fs.browse':      '\u{1F4C2}',
    'fs.drives':      'Drives & Volumes',
    'fs.select':      'Select this folder',
    'fs.up':          'Parent folder',
    'fs.loading':     'Loading\u2026',
    'fs.no_dirs':     'No subfolders',
    'fs.no_drives':   'No drives found',
    'fs.err_browse':  'Error: {msg}',

    // File preview modal
    'preview.loading':         'Loading\u2026',
    'preview.no_preview':      'No preview available for this file type.',
    'preview.load_error':      'Failed to load preview.',
    'preview.opening_os':      'Opening with default application\u2026',
    'preview.opening_with':    'Opening with {prog}\u2026',
    'preview.open_os_error':   'Could not open file.',
    'preview.open_with_title': 'Open file',
    'preview.no_viewer':       'No internal viewer available for this file type.',
    'preview.open_default':    'Open with default application',
    'preview.open_custom_ph':  'e.g. vlc, gimp, libreoffice\u00a0\u2026',
    'preview.open_btn':        'Open',
    'preview.always_for':      'Always use for {ext} files',
    'preview.this_type':       'this file type',
    'preview.copy_path':       'Copy path',

    // Statistics
    'stats.title':           'Statistics',
    'stats.dl_all':          'Download log',
    'stats.dl_archive':      'Archive log',
    'stats.browse_btn':      'Browse',
    'stats.browser_hint':    'Select an archive to browse',
    'stats.browser_empty':   'No files in this directory.',
    'stats.browser_loading': 'Loading…',
    'stats.back':            'Back',
    'stats.files':           'files',
    'stats.card_archives':   'Archives',
    'stats.card_files':      'Files',
    'stats.card_size':       'Total size',
    'stats.card_dups':       'Duplicate groups',
    'stats.types':           'File types',
    'stats.load_error':      'Error loading: {msg}',
    'stats.no_archives':     'No archives yet.',
    'stats.loading':         'Loading statistics…',
    'stats.created':         'Created',
    'stats.modified':        'Modified',

    // Footer donate
    'footer.donate':      'Donate',

    'error.generic':      'Error: {msg}',

    // Help modal
    'help.btn':           'Help',
    'help.title':         'How to use',
    'help.sec.archives':  'Archives',
    'help.arch.add':      'Click + to add a new archive. Type a path directly or pick one with the folder browser.',
    'help.arch.scan':     'Start scan indexes all files in the folder. Progress is shown live.',
    'help.arch.remove':   'Remove deletes the archive from the index – files on disk are not affected.',
    'help.sec.files':     'Files',
    'help.files.filter':  'Filter by filename, type (pdf, jpg …) or duplicates only.',
    'help.files.sort':    'Click column headers to sort ascending or descending.',
    'help.files.date':    '⇄ toggles between modified date and created date.',
    'help.files.select':  'Checkboxes for multi-select – then delete or copy paths in bulk.',
    'help.files.actions': 'Row icons: Preview · Download · Copy path · Delete.',
    'help.sec.dups':      'Duplicates',
    'help.dups.groups':   'Files with identical content are grouped by hash value.',
    'help.dups.keep':     'Keep marks the copy to retain; all others will be deleted.',
    'help.dups.all':      'Resolve all keeps the first file of each group.',
    'help.sec.stats':     'Statistics',
    'help.stats.desc':    'Click an archive card for file type details and directory browser. Download log exports all entries.',
    'help.sec.monitor':   'Monitor',
    'help.monitor.desc':  'Live system data (RAM, uptime, status) and an activity log for the current session.',
    'help.tip':           'Click outside a dialog or press Escape to close overlays.',
  },

  fr: {
    'nav.files':         'Fichiers',
    'nav.duplicates':    'Doublons',
    'nav.monitor':       'Moniteur',
    'nav.stats':         'Statistiques',

    'arch.section':      'ARCHIVES',
    'arch.none':         'Aucune archive',
    'arch.name_ph':      'Nom, p.ex. Photos 2024',
    'arch.path_ph':      'Chemin, p.ex. /home/user/photos',
    'arch.path_ph_win':  'Chemin, p.ex. C:\\Users\\user\\Photos ou \\\\Serveur\\Partage',
    'arch.add_title':    'Ajouter une archive',
    'arch.scan_title':   'Scanner',
    'arch.scan_btn':     'Lancer le scan',
    'arch.scanning':     'Scan en cours\u2026',
    'arch.removing':     'Suppression\u2026',
    'arch.remove_title': 'Supprimer',

    'arch.path_required':    'Chemin requis',
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
    'files.filters_reset': 'Filtres r\u00e9initialis\u00e9s',

    'files.filter_name_ph': 'Rechercher un fichier \u2026',
    'files.filter_ext_ph':  'Type\u00a0: pdf, jpg \u2026',
    'files.filter_dups':    'Doublons uniquement',
    'files.col_name':       'Nom',
    'files.col_type':       'Type',
    'files.col_size':       'Taille',
    'files.col_archive':    'Archive',
    'files.col_modified':   'Modifi\u00e9',
    'files.col_created':    'Cr\u00e9\u00e9',
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
    'files.refreshed':      'Actualisé — {count} fichier(s)',
    'files.select_all_title': 'Tout s\u00e9lectionner / d\u00e9s\u00e9lectionner',
    'files.selected':        '{count} s\u00e9lectionn\u00e9(s)',
    'files.deselect_all':    'D\u00e9s\u00e9lectionner',
    'files.bulk_del_title':  'Supprimer les fichiers\u00a0?',
    'files.bulk_del_body':   'Supprimer d\u00e9finitivement {count} fichier(s) du disque\u00a0?',
    'files.bulk_del_done':     '{count} fichier(s) supprim\u00e9(s)',
    'files.bulk_del_errors':   '{errors} erreur(s) lors de la suppression',
    'files.bulk_copy_paths':   'Copier les chemins',
    'files.bulk_copy_done':    '{count} chemin(s) copi\u00e9(s)',

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
    'dups.refreshed':    'Actualis\u00e9 \u2014 {count} groupe(s) trouv\u00e9(s)',
    'dups.dl_title':     'T\u00e9l\u00e9charger',
    'dups.groups':       'groupes',
    'dups.resolve_all':         'Tout résoudre',
    'dups.resolve_all_confirm': 'Résoudre tous les {groups} groupe(s) de doublons ? Le premier fichier de chaque groupe est conservé ; les autres sont supprimés définitivement.',
    'dups.resolve_all_done':    '{deleted} fichier(s) supprimé(s) dans {groups} groupe(s)',

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

    // Filesystem browser
    'fs.browse':      '\u{1F4C2}',
    'fs.drives':      'Lecteurs & volumes',
    'fs.select':      'Choisir ce dossier',
    'fs.up':          'Dossier parent',
    'fs.loading':     'Chargement\u2026',
    'fs.no_dirs':     'Aucun sous-dossier',
    'fs.no_drives':   'Aucun lecteur trouv\u00e9',
    'fs.err_browse':  'Erreur\u00a0: {msg}',

    // File preview modal
    'preview.loading':         'Chargement\u2026',
    'preview.no_preview':      'Aucun aper\u00e7u disponible pour ce type de fichier.',
    'preview.load_error':      'Impossible de charger l\u2019aper\u00e7u.',
    'preview.opening_os':      'Ouverture avec l\u2019application par d\u00e9faut\u2026',
    'preview.opening_with':    'Ouverture avec {prog}\u2026',
    'preview.open_os_error':   'Impossible d\u2019ouvrir le fichier.',
    'preview.open_with_title': 'Ouvrir le fichier',
    'preview.no_viewer':       'Aucun lecteur interne disponible pour ce type de fichier.',
    'preview.open_default':    'Ouvrir avec l\u2019application par d\u00e9faut',
    'preview.open_custom_ph':  'ex.\u202f vlc, gimp, libreoffice\u00a0\u2026',
    'preview.open_btn':        'Ouvrir',
    'preview.always_for':      'Toujours utiliser pour les fichiers {ext}',
    'preview.this_type':       'ce type de fichier',
    'preview.copy_path':       'Copier le chemin',


    // Statistics
    'stats.title':           'Statistiques',
    'stats.dl_all':          'Télécharger le journal',
    'stats.dl_archive':      'Journal de l’archive',
    'stats.browse_btn':      'Parcourir',
    'stats.browser_hint':    'Sélectionner une archive à parcourir',
    'stats.browser_empty':   'Aucun fichier dans ce répertoire.',
    'stats.browser_loading': 'Chargement…',
    'stats.back':            'Retour',
    'stats.files':           'fichiers',
    'stats.card_archives':   'Archives',
    'stats.card_files':      'Fichiers',
    'stats.card_size':       'Taille totale',
    'stats.card_dups':       'Groupes de doublons',
    'stats.types':           'Types de fichiers',
    'stats.load_error':      'Erreur de chargement : {msg}',
    'stats.no_archives':     'Aucune archive.',
    'stats.loading':         'Chargement des statistiques…',
    'stats.created':         'Créé',
    'stats.modified':        'Modifié',
    // Footer donate
    'footer.donate':      'Don',

    'error.generic':      'Erreur\u00a0: {msg}',

    // Help modal
    'help.btn':           'Aide',
    'help.title':         'Mode d\u2019emploi',
    'help.sec.archives':  'Archives',
    'help.arch.add':      'Cliquer + pour ajouter une archive. Saisir le chemin directement ou le choisir avec le navigateur de dossiers.',
    'help.arch.scan':     'Lancer le scan indexe tous les fichiers du dossier. La progression s\u2019affiche en direct.',
    'help.arch.remove':   'Supprimer retire l\u2019archive de l\u2019index \u2013 les fichiers sur le disque restent intacts.',
    'help.sec.files':     'Fichiers',
    'help.files.filter':  'Filtrer par nom, type (pdf, jpg \u2026) ou afficher uniquement les doublons.',
    'help.files.sort':    'Cliquer sur les en-t\u00eates de colonnes pour trier croissant ou d\u00e9croissant.',
    'help.files.date':    '\u21c4 bascule entre la date de modification et la date de cr\u00e9ation.',
    'help.files.select':  'Cases \u00e0 cocher pour la s\u00e9lection multiple \u2013 puis supprimer ou copier les chemins.',
    'help.files.actions': 'Ic\u00f4nes de ligne\u00a0: Aper\u00e7u \u00b7 T\u00e9l\u00e9charger \u00b7 Copier le chemin \u00b7 Supprimer.',
    'help.sec.dups':      'Doublons',
    'help.dups.groups':   'Les fichiers au contenu identique sont regroup\u00e9s par valeur de hachage.',
    'help.dups.keep':     'Conserver marque la copie souhait\u00e9e\u00a0; toutes les autres seront supprim\u00e9es.',
    'help.dups.all':      'Tout r\u00e9soudre conserve le premier fichier de chaque groupe.',
    'help.sec.stats':     'Statistiques',
    'help.stats.desc':    'Cliquer sur une carte d\u2019archive pour les types de fichiers et le navigateur de dossiers. T\u00e9l\u00e9charger le journal exporte toutes les entr\u00e9es.',
    'help.sec.monitor':   'Moniteur',
    'help.monitor.desc':  'Donn\u00e9es syst\u00e8me en temps r\u00e9el (RAM, disponibilit\u00e9, statut) et journal d\u2019activit\u00e9 de la session.',
    'help.tip':           'Cliquer en dehors de la bo\u00eete de dialogue ou appuyer sur \u00c9chap pour fermer les superpositions.',
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
