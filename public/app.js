'use strict';

/* ── Formatting helpers ───────────────────────────────────────────────────── */
function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + '\u00a0' + units[i];
}

function formatDate(iso) {
  if (!iso) return '\u2014';
  return new Date(iso).toLocaleDateString(getLocale(), {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function fmtNum(n) {
  return Number(n).toLocaleString(getLocale());
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Toast notifications ──────────────────────────────────────────────────── */
function toast(msg, type = '') {
  const wrap = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* ── Confirm dialog ───────────────────────────────────────────────────────── */
function confirmDlg(title, body) {
  return new Promise((resolve) => {
    const bg = document.createElement('div');
    bg.className = 'overlay-bg';
    bg.innerHTML = `
      <div class="dialog">
        <h3>${escHtml(title)}</h3>
        <p>${escHtml(body)}</p>
        <div class="dialog-btns">
          <button class="btn"        id="dlg-cancel">${escHtml(t('btn.cancel'))}</button>
          <button class="btn btn-danger" id="dlg-ok">${escHtml(t('btn.delete'))}</button>
        </div>
      </div>`;
    document.body.appendChild(bg);
    bg.querySelector('#dlg-cancel').onclick = () => { bg.remove(); resolve(false); };
    bg.querySelector('#dlg-ok').onclick     = () => { bg.remove(); resolve(true);  };
  });
}

/* ── API client ───────────────────────────────────────────────────────────── */
const api = {
  async _fetch(url, opts = {}) {
    const res  = await fetch(url, opts);
    const data = await res.json().catch(() => ({ error: res.statusText }));
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data;
  },
  get:    (url)       => api._fetch(url),
  post:   (url, body) => api._fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }),
  delete: (url)       => api._fetch(url, { method: 'DELETE' }),

  getHealth:     ()         => api.get('/api/health'),
  getArchives:   ()         => api.get('/api/archives'),
  addArchive:    (p)        => api.post('/api/archives', { path: p }),
  deleteArchive: (id)       => api.delete(`/api/archives/${id}`),
  scanArchive:   (id)       => api.post(`/api/archives/${id}/scan`),
  getScanStatus: (id)       => api.get(`/api/archives/${id}/scan/status`),
  getFiles:      (params)   => api.get('/api/files?' + new URLSearchParams(params)),
  deleteFile:    (id, dbOnly) => api.delete(`/api/files/${id}${dbOnly ? '?dbOnly=true' : ''}`),
  getDuplicates: ()         => api.get('/api/duplicates'),
  resolveDups:   (keep, del)=> api.post('/api/duplicates/resolve', { keepId: keep, deleteIds: del }),

  getDrives:  ()     => api.get('/api/fs/drives'),
  browse:     (p)    => api.get('/api/fs/browse?' + new URLSearchParams({ path: p })),

  downloadUrl: (id) => `/api/files/${id}/download`,
  previewUrl:  (id) => `/api/files/${id}/preview`,
  openFileUrl: (id) => `/api/files/${id}/open`,
};

/* ── Application state ────────────────────────────────────────────────────── */
const state = {
  archives:        [],
  selectedArchive: null,
  files:           [],
  total:           0,
  page:            1,
  limit:           50,
  filters:         { name: '', ext: '', dups: false },
  sort:            { col: 'name', order: 'asc' },
  view:            'files',
  scanPollers:     {},
  activityLog:     [],
  serverPlatform:  'linux',  // updated from /api/health
  selectedFiles:   new Set(),
  dupGroups:       [],
  dupPage:         1,
  dupLimit:        30,
};

function log(msg) {
  const time = new Date().toLocaleTimeString(getLocale());
  state.activityLog.unshift(`[${time}] ${msg}`);
  if (state.activityLog.length > 100) state.activityLog.pop();
  const el = document.getElementById('activity-log');
  if (el) el.textContent = state.activityLog.join('\n');
}

/* ── Render: Archive sidebar ──────────────────────────────────────────────── */
function renderArchives() {
  const ul = document.getElementById('archive-list');
  if (!state.archives.length) {
    ul.innerHTML = `<li style="padding:10px 12px;font-size:.78rem;color:rgba(255,255,255,.3)">${escHtml(t('arch.none'))}</li>`;
    return;
  }
  ul.innerHTML = state.archives.map(a => {
    const active    = state.selectedArchive === a.id ? 'active' : '';
    const scanning  = state.scanPollers[a.id] ? 'scanning' : '';
    const scanCtrl  = state.scanPollers[a.id]
      ? `<span class="scan-running-label">${escHtml(t('arch.scanning'))}</span>`
      : `<button class="btn-scan" data-action="scan" data-id="${a.id}"
                 title="${escHtml(t('arch.scan_title'))}">\u25b6 ${escHtml(t('arch.scan_btn'))}</button>`;
    return `
      <li class="archive-item ${active}" data-id="${a.id}">
        <div class="archive-dot ${scanning}"></div>
        <div class="archive-info">
          <div class="archive-name" title="${escHtml(a.path)}">${escHtml(a.name)}</div>
          <div class="archive-meta">${fmtNum(a.file_count)} · ${formatSize(a.total_size)}</div>
          ${scanCtrl}
        </div>
        <div class="archive-actions">
          <button class="btn-xs danger" data-action="del-archive" data-id="${a.id}"
                  title="${escHtml(t('arch.remove_title'))}">✕</button>
        </div>
      </li>`;
  }).join('');
}

/* ── Render: File table ───────────────────────────────────────────────────── */
function updateBatchBar() {
  const bar   = document.getElementById('batch-bar');
  const count = state.selectedFiles.size;
  if (!bar) return;
  if (count === 0) {
    bar.classList.add('hidden');
  } else {
    bar.classList.remove('hidden');
    document.getElementById('batch-count').textContent = t('files.selected', { count });
  }
}

function renderFiles() {
  const tbody = document.getElementById('file-list');
  const stats = document.getElementById('file-stats');

  if (!state.files.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="icon">📂</div><p>${escHtml(t('files.none'))}</p></div></td></tr>`;
    stats.textContent = '';
    updateBatchBar();
    return;
  }

  stats.textContent = t('files.stats', { total: fmtNum(state.total), page: state.page });

  tbody.innerHTML = state.files.map(f => {
    const isDup   = f.dup_count > 1;
    const dupTag  = isDup ? `<span class="ext-badge dup-badge">${escHtml(t('files.dup_badge', { count: f.dup_count }))}</span>` : '';
    const ext     = f.ext ? `<span class="ext-badge">${escHtml(f.ext.toUpperCase())}</span>` : '\u2014';
    const checked = state.selectedFiles.has(f.id) ? ' checked' : '';
    return `
      <tr data-id="${f.id}">
        <td class="col-check"><input type="checkbox" class="row-check" data-id="${f.id}"${checked}></td>
        <td>
          <div class="file-name" title="${escHtml(f.path)}">${escHtml(f.name)}</div>
          <div class="file-path">${escHtml(f.path)}</div>
          ${dupTag}
        </td>
        <td>${ext}</td>
        <td>${formatSize(f.size)}</td>
        <td>${escHtml(f.archive_name)}</td>
        <td>${formatDate(f.modified_at)}</td>
        <td>
          <div class="cell-actions">
            <a href="${api.downloadUrl(f.id)}" class="btn-icon-sm"
               title="${escHtml(t('files.dl_title'))}" download>\u2193</a>
            <button class="btn-icon-sm" data-action="copy-path"
                    data-path="${escHtml(f.path)}"
                    title="${escHtml(t('files.copy_title'))}">\u2398</button>
            <button class="btn-icon-sm" data-action="preview" data-id="${f.id}"
                    title="${escHtml(t('files.preview_title'))}">👁</button>
            <button class="btn-icon-sm red" data-action="delete-file"
                    data-id="${f.id}" data-name="${escHtml(f.name)}"
                    title="${escHtml(t('files.del_title'))}">🗑</button>
          </div>
        </td>
      </tr>`;
  }).join('');

  // Sync select-all checkbox
  const allChecked  = state.files.every(f => state.selectedFiles.has(f.id));
  const someChecked = state.files.some(f => state.selectedFiles.has(f.id));
  const selAll = document.getElementById('select-all-files');
  if (selAll) {
    selAll.checked       = allChecked;
    selAll.indeterminate = !allChecked && someChecked;
  }

  updateBatchBar();
  renderPagination();
  updateSortHeaders();
}

/* ── Render: Pagination ───────────────────────────────────────────────────── */
function renderPagination() {
  const wrap       = document.getElementById('pagination');
  const totalPages = Math.ceil(state.total / state.limit);
  if (totalPages <= 1) { wrap.innerHTML = ''; return; }

  const cur   = state.page;
  const pages = [];

  pages.push(`<button class="page-btn" ${cur === 1 ? 'disabled' : ''} data-page="${cur - 1}">\u2039</button>`);

  const range = new Set([1, totalPages, cur - 1, cur, cur + 1].filter(p => p >= 1 && p <= totalPages));
  let prev = 0;
  for (const p of [...range].sort((a, b) => a - b)) {
    if (prev && p - prev > 1) pages.push(`<span class="page-info">\u2026</span>`);
    pages.push(`<button class="page-btn ${p === cur ? 'active' : ''}" data-page="${p}">${p}</button>`);
    prev = p;
  }

  pages.push(`<button class="page-btn" ${cur === totalPages ? 'disabled' : ''} data-page="${cur + 1}">\u203a</button>`);
  pages.push(`<span class="page-info">${fmtNum(state.total)}</span>`);

  wrap.innerHTML = pages.join('');
}

function updateSortHeaders() {
  document.querySelectorAll('.file-table th.sortable').forEach(th => {
    th.classList.toggle('sorted', th.dataset.col === state.sort.col);
    const icon = th.querySelector('.sort-icon');
    if (icon) {
      icon.textContent = th.dataset.col === state.sort.col
        ? (state.sort.order === 'asc' ? '\u2191' : '\u2193')
        : '\u2195';
    }
  });
}

/* ── Render: Duplicates ───────────────────────────────────────────────────── */
function renderDupPagination() {
  const el     = document.getElementById('dup-pagination');
  if (!el) return;
  const total  = state.dupGroups.length;
  const totalP = Math.ceil(total / state.dupLimit);
  if (totalP <= 1) { el.innerHTML = ''; return; }

  const cur   = state.dupPage;
  const pages = [];
  pages.push(`<button class="page-btn" ${cur === 1 ? 'disabled' : ''} data-page="${cur - 1}">\u2039</button>`);

  const range = new Set([1, totalP, cur - 1, cur, cur + 1].filter(p => p >= 1 && p <= totalP));
  let prev = 0;
  for (const p of [...range].sort((a, b) => a - b)) {
    if (prev && p - prev > 1) pages.push(`<span class="page-info">\u2026</span>`);
    pages.push(`<button class="page-btn ${p === cur ? 'active' : ''}" data-page="${p}">${p}</button>`);
    prev = p;
  }

  pages.push(`<button class="page-btn" ${cur === totalP ? 'disabled' : ''} data-page="${cur + 1}">\u203a</button>`);
  pages.push(`<span class="page-info">${fmtNum(total)}\u00a0${escHtml(t('dups.groups'))}</span>`);
  el.innerHTML = pages.join('');
}

function keepActionHtml(fileId, groupIdx, isKeeper) {
  return isKeeper
    ? `<span class="dup-keeping">${escHtml(t('dups.keeping'))}</span>`
    : `<button class="btn btn-sm" data-action="keep" data-keep="${fileId}" data-group="${groupIdx}">${escHtml(t('dups.keep'))}</button>`;
}

function renderDuplicates(groups) {
  const wrap   = document.getElementById('dup-list');
  const colBar = document.getElementById('dup-col-bar');
  state.dupGroups = groups;

  // Clamp page to valid range after data update
  const totalPages = Math.max(1, Math.ceil(groups.length / state.dupLimit));
  if (state.dupPage > totalPages) state.dupPage = totalPages;

  if (!groups.length) {
    wrap.innerHTML = `<div class="dup-empty">${escHtml(t('dups.success'))}</div>`;
    if (colBar) colBar.hidden = true;
    wrap._groups = [];
    renderDupPagination();
    return;
  }

  // Single column header above the list
  if (colBar) {
    colBar.innerHTML = `<div class="dup-row dup-col-hdr">
      <div class="dr-action"></div>
      <div class="dr-name">${escHtml(t('files.col_name'))}</div>
      <div class="dr-archive">${escHtml(t('files.col_archive'))}</div>
      <div class="dr-size">${escHtml(t('files.col_size'))}</div>
      <div class="dr-date">${escHtml(t('files.col_modified'))}</div>
      <div class="dr-acts"></div>
    </div>`;
    colBar.hidden = false;
  }

  const start      = (state.dupPage - 1) * state.dupLimit;
  const pageGroups = groups.slice(start, start + state.dupLimit);

  wrap.innerHTML = pageGroups.map((g, gi) => {
    const realGi = start + gi;
    const rows = g.files.map((f, fi) => {
      const isKeeper = fi === 0;
      const rowCls   = ['dup-row', isKeeper ? 'keeper' : (fi % 2 ? 'row-odd' : 'row-even')].join(' ');
      const action   = keepActionHtml(f.id, realGi, isKeeper);
      return `<div class="${rowCls}" data-group="${realGi}">
        <div class="dr-action">${action}</div>
        <div class="dr-name" title="${escHtml(f.path)}">${escHtml(f.name)}</div>
        <div class="dr-archive">${escHtml(f.archive_name)}</div>
        <div class="dr-size">${formatSize(f.size)}</div>
        <div class="dr-date">${formatDate(f.modified_at)}</div>
        <div class="dr-acts">
          <a href="${api.downloadUrl(f.id)}" class="btn-icon-sm"
             title="${escHtml(t('dups.dl_title'))}" download>\u2193</a>
          <button class="btn-icon-sm" data-action="dup-copy-path"
                  data-path="${escHtml(f.path)}"
                  title="${escHtml(t('files.copy_title'))}">\u2398</button>
          <button class="btn-icon-sm" data-action="dup-preview"
                  data-id="${f.id}" data-name="${escHtml(f.name)}"
                  data-ext="${escHtml(f.ext || '')}" data-path="${escHtml(f.path)}"
                  title="${escHtml(t('files.preview_title'))}">&#128065;</button>
        </div>
      </div>`;
    }).join('');

    return `
      <div class="dup-group" id="dup-group-${realGi}">
        <div class="dup-group-header">
          <span class="dup-group-title">${escHtml(t('dups.count', { count: g.count }))}</span>
          <span class="dup-hash">${g.hash.slice(0, 16)}\u2026</span>
          <button class="btn btn-sm btn-danger"
                  data-action="resolve-all" data-group="${realGi}">
            ${escHtml(t('dups.resolve_btn'))}
          </button>
        </div>
        ${rows}
      </div>`;
  }).join('');

  wrap._groups = groups;
  renderDupPagination();
}

/* ── Render: Health monitor ───────────────────────────────────────────────── */
function renderHealth(h) {
  const grid = document.getElementById('health-grid');

  function fmtUptime(s) {
    if (s < 60)   return `${s}s`;
    if (s < 3600) return `${Math.round(s / 60)}min`;
    return `${Math.round(s / 3600)}h`;
  }

  grid.innerHTML = [
    { key: 'monitor.status',     value: h.status === 'ok' ? t('monitor.online') : t('monitor.err'), cls: h.status === 'ok' ? 'health-ok' : 'health-warn' },
    { key: 'monitor.archives',   value: h.archives },
    { key: 'monitor.files',      value: fmtNum(h.files) },
    { key: 'monitor.total_size', value: formatSize(h.totalBytes) },
    { key: 'monitor.dup_groups', value: h.duplicateGroups, cls: h.duplicateGroups > 0 ? 'health-warn' : 'health-ok' },
    { key: 'monitor.uptime',     value: fmtUptime(h.uptime) },
    { key: 'monitor.ram',        value: `${h.memoryMB}\u00a0MB` },
    { key: 'monitor.node',       value: h.nodeVersion },
  ].map(c => `
    <div class="health-card ${c.cls || ''}">
      <div class="label">${escHtml(t(c.key))}</div>
      <div class="value">${escHtml(String(c.value))}</div>
    </div>`).join('');
}

/* ── Data loading ─────────────────────────────────────────────────────────── */
async function loadArchives() {
  try {
    state.archives = await api.getArchives();
    renderArchives();
  } catch (err) {
    toast(t('arch.load_error', { msg: err.message }), 'error');
  }
}

async function loadFiles() {
  const params = {
    page: state.page, limit: state.limit,
    sort: state.sort.col, order: state.sort.order,
  };
  if (state.selectedArchive) params.archive = state.selectedArchive;
  if (state.filters.name)    params.name    = state.filters.name;
  if (state.filters.ext)     params.ext     = state.filters.ext;
  if (state.filters.dups)    params.dups    = 'true';

  try {
    const data = await api.getFiles(params);
    state.files = data.files;
    state.total = data.total;
    renderFiles();
  } catch (err) {
    toast(t('files.load_error', { msg: err.message }), 'error');
  }
}

async function loadDuplicates(resetPage = false) {
  if (resetPage) state.dupPage = 1;
  const btn = document.getElementById('btn-refresh-dups');
  if (btn) btn.disabled = true;
  try {
    const groups = await api.getDuplicates();
    renderDuplicates(groups);
    const badge = document.getElementById('dup-badge');
    badge.textContent = groups.length > 0 ? String(groups.length) : '';
    if (resetPage) toast(t('dups.refreshed', { count: groups.length }), 'success');
  } catch (err) {
    toast(t('dups.load_error', { msg: err.message }), 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function loadHealth() {
  try {
    const h = await api.getHealth();
    state.serverPlatform = h.platform || 'linux';
    updatePathPlaceholder();
    renderHealth(h);
  } catch (err) {
    toast(t('monitor.unreachable', { msg: err.message }), 'error');
  }
}

/* Update the path input placeholder based on server OS */
function updatePathPlaceholder() {
  const el = document.getElementById('archive-path');
  if (!el) return;
  const key = state.serverPlatform === 'win32' ? 'arch.path_ph_win' : 'arch.path_ph';
  el.placeholder = t(key);
  el.dataset.i18nPh = key;  // keep in sync for future lang changes
}

/* ── Scan polling ─────────────────────────────────────────────────────────── */
function startScanPoller(archiveId) {
  if (state.scanPollers[archiveId]) return;
  log(t('arch.scan_started', { id: archiveId }));

  state.scanPollers[archiveId] = setInterval(async () => {
    try {
      const status = await api.getScanStatus(archiveId);
      renderArchives(); // update spinning dot

      if (status.status === 'done') {
        clearInterval(state.scanPollers[archiveId]);
        delete state.scanPollers[archiveId];

        const r = status.result || {};
        log(t('arch.scan_done_log', { indexed: r.indexed ?? '?', errors: r.errors ?? 0 }));
        toast(t('arch.scan_done_toast', { indexed: r.indexed ?? '?' }), 'success');

        await loadArchives();
        await loadFiles();
        await loadDuplicates();
      } else if (status.status === 'idle') {
        clearInterval(state.scanPollers[archiveId]);
        delete state.scanPollers[archiveId];
      } else if (status.progress) {
        log(t('arch.scan_progress', { indexed: status.progress.indexed }));
      }
    } catch {
      clearInterval(state.scanPollers[archiveId]);
      delete state.scanPollers[archiveId];
    }
  }, 1500);
}

/* ── View switching ───────────────────────────────────────────────────────── */
function switchView(viewName) {
  state.view = viewName;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  document.getElementById(`view-${viewName}`)?.classList.add('active');
  document.querySelector(`.nav-btn[data-view="${viewName}"]`)?.classList.add('active');

  if (viewName === 'duplicates') loadDuplicates(true);
  if (viewName === 'monitor')    loadHealth();
}

/* ── Full re-render on language change ────────────────────────────────────── */
function rerender() {
  renderArchives();
  renderFiles();
  if (state.view === 'duplicates') {
    if (state.dupGroups.length) renderDuplicates(state.dupGroups);
    else renderDupPagination();
  }
  if (state.view === 'monitor') loadHealth();
  updatePathPlaceholder();

  // Refresh static labels that live outside data-i18n spans
  const statsEl = document.getElementById('file-stats');
  if (statsEl && state.total > 0) {
    statsEl.textContent = t('files.stats', { total: fmtNum(state.total), page: state.page });
  }

  // Update activity log timestamp locale
  const logEl = document.getElementById('activity-log');
  if (logEl && state.activityLog.length) logEl.textContent = state.activityLog.join('\n');
}

/* ── Filesystem browser modal ─────────────────────────────────────────────── */

/** Build a clickable breadcrumb HTML string for the given absolute path. */
function buildCrumbHtml(fullPath) {
  const isWin = /^[A-Za-z]:[\\\/]/.test(fullPath);
  const sep   = isWin ? '\\' : '/';

  let parts; // Array of { label, path }
  if (isWin) {
    const drive = fullPath.slice(0, 3).replace('/', '\\'); // e.g. "C:\"
    const segs  = fullPath.slice(3).split(/[\\/]/).filter(Boolean);
    parts = [
      { label: drive, path: drive },
      ...segs.map((s, i) => ({
        label: s,
        path:  drive + segs.slice(0, i + 1).join('\\'),
      })),
    ];
  } else {
    const segs = fullPath.split('/').filter(Boolean);
    parts = [
      { label: '/', path: '/' },
      ...segs.map((s, i) => ({
        label: s,
        path:  '/' + segs.slice(0, i + 1).join('/'),
      })),
    ];
  }

  return parts.map((p, i) => {
    if (i < parts.length - 1) {
      const escapedSep = escHtml(sep);
      return `<a class="crumb-link" data-path="${escHtml(p.path)}">${escHtml(p.label)}</a>`
           + `<span class="crumb-sep">${escapedSep}</span>`;
    }
    return `<span class="crumb-cur">${escHtml(p.label)}</span>`;
  }).join('');
}

const fsBrowser = {
  _currentPath: null,
  _parentPath:  null,

  /** Open the modal and load the drives list. */
  open() {
    document.getElementById('fs-modal').classList.remove('hidden');
    this.showDrives();
  },

  /** Go back to the root drives list without closing the modal. */
  showDrives() {
    this._currentPath = null;
    this._parentPath  = null;
    document.getElementById('fs-crumb').textContent = t('fs.drives');
    document.getElementById('fs-selected-path').textContent = '';
    document.getElementById('btn-select-dir').disabled = true;
    document.getElementById('fs-btn-up').disabled = true;
    document.getElementById('fs-entries').innerHTML =
      `<div class="fs-entry-empty">${escHtml(t('fs.loading'))}</div>`;

    api.getDrives().then(drives => {
      if (!drives.length) {
        document.getElementById('fs-entries').innerHTML =
          `<div class="fs-entry-empty">${escHtml(t('fs.no_drives'))}</div>`;
        return;
      }
      document.getElementById('fs-entries').innerHTML = drives.map(d => {
        const lbl  = d.label || d.path;
        // Use text badges instead of emoji — emoji rendering is unreliable
        // across Windows font configurations (e.g. U+1F5B4 🖴 is missing from
        // most Windows emoji fonts and renders as a broken placeholder).
        const type = /netz|network|cifs|nfs|smb|sshfs|dav/i.test(lbl) ? 'net'
                   : /usb|removable/i.test(lbl)                        ? 'usb'
                   : /cd|dvd/i.test(lbl)                               ? 'cd'
                   : 'hdd';
        const badge = { hdd: 'HDD', usb: 'USB', net: 'NET', cd: 'CD' }[type];
        return `<div class="fs-entry fs-entry-drive" data-path="${escHtml(d.path)}"><span class="fs-type-badge fs-type-${type}">${badge}</span> ${escHtml(lbl)}</div>`;
      }).join('');
    }).catch(err => {
      document.getElementById('fs-entries').innerHTML =
        `<div class="fs-entry-empty">${escHtml(t('fs.err_browse', { msg: err.message }))}</div>`;
    });
  },

  /** Close the modal. */
  close() {
    document.getElementById('fs-modal').classList.add('hidden');
    this._currentPath = null;
    this._parentPath  = null;
  },

  /** Navigate into a directory, update the modal and the path input. */
  async navigate(dirPath) {
    this._currentPath = null;
    this._parentPath  = null;
    document.getElementById('btn-select-dir').disabled = true;
    document.getElementById('fs-btn-up').disabled = true;
    document.getElementById('fs-crumb').textContent = dirPath;
    document.getElementById('fs-entries').innerHTML =
      `<div class="fs-entry-empty">${escHtml(t('fs.loading'))}</div>`;

    try {
      const data = await api.browse(dirPath);
      this._currentPath = data.path;
      this._parentPath  = (data.parent !== null && data.parent !== undefined)
                          ? data.parent : null;

      document.getElementById('fs-crumb').innerHTML      = buildCrumbHtml(data.path);
      document.getElementById('fs-selected-path').textContent = data.path;
      document.getElementById('btn-select-dir').disabled  = false;
      document.getElementById('fs-btn-up').disabled       = (this._parentPath === null);
      document.getElementById('archive-path').value       = data.path;

      const rows = [];
      if (!data.dirs.length)
        rows.push(`<div class="fs-entry-empty">${escHtml(t('fs.no_dirs'))}</div>`);
      else
        rows.push(...data.dirs.map(d =>
          `<div class="fs-entry" data-path="${escHtml(d.path)}">\uD83D\uDCC1 ${escHtml(d.name)}</div>`
        ));
      document.getElementById('fs-entries').innerHTML = rows.join('');
    } catch (err) {
      toast(t('fs.err_browse', { msg: err.message }), 'error');
      // Show error but allow user to go back to drives via the 🖴 button
      document.getElementById('fs-entries').innerHTML =
        `<div class="fs-entry-empty">${escHtml(t('fs.err_browse', { msg: err.message }))}</div>`;
    }
  },
};

/* ── File preview modal ───────────────────────────────────────────────────── */
const previewModal = {
  // Shown inline via <img> (SVG is safe here — scripts are sandboxed when loaded as img)
  _IMG_EXTS:   new Set(['jpg','jpeg','png','gif','webp','bmp','ico','avif','tiff','tif','heic','svg']),
  // Fetched as text and displayed in <pre> (never executed/rendered as HTML)
  _TEXT_EXTS:  new Set(['txt','md','log','json','xml','yaml','yml','csv','ini','cfg','conf','nfo',
                         'sh','bat','ps1','cmd','py','js','ts','html','htm','css','sql','toml','lock',
                         'gitignore','env','diff','patch','rst']),
  // Native browser video player
  _VIDEO_EXTS: new Set(['mp4','webm','ogv']),
  // Native browser audio player
  _AUDIO_EXTS: new Set(['mp3','wav','ogg','flac','m4a','aac','opus']),

  _PREFS_KEY: 'av_open_with',

  _getPreference(ext) {
    try {
      const p = JSON.parse(localStorage.getItem(this._PREFS_KEY) || '{}');
      return ext in p ? p[ext] : null; // null = never set; '' = OS default
    } catch { return null; }
  },

  _savePreference(ext, prog) {
    try {
      const p = JSON.parse(localStorage.getItem(this._PREFS_KEY) || '{}');
      p[ext] = prog;
      localStorage.setItem(this._PREFS_KEY, JSON.stringify(p));
    } catch {}
  },

  async _doOpen(id, program = '') {
    try {
      const url = program
        ? `${api.openFileUrl(id)}?program=${encodeURIComponent(program)}`
        : api.openFileUrl(id);
      await fetch(url);
    } catch {
      toast(t('preview.open_os_error'), 'error');
    }
  },

  _showOpenDialog(id, fileName, ext, filePath) {
    const extLabel = ext ? `.${ext}` : t('preview.this_type');
    const bg = document.createElement('div');
    bg.className = 'overlay-bg';
    bg.innerHTML = `
      <div class="dialog open-with-dlg">
        <h3>${escHtml(t('preview.open_with_title'))}</h3>
        <p class="open-with-filename">${escHtml(fileName)}</p>
        <p>${escHtml(t('preview.no_viewer'))}</p>
        <div class="open-with-row">
          <button class="btn btn-primary" id="owDefault">${escHtml(t('preview.open_default'))}</button>
        </div>
        <div class="open-with-row">
          <input type="text" id="owProgram" class="ow-input" placeholder="${escHtml(t('preview.open_custom_ph'))}">
          <button class="btn" id="owOpen">${escHtml(t('preview.open_btn'))}</button>
        </div>
        <label class="open-with-always">
          <input type="checkbox" id="owAlways">
          ${escHtml(t('preview.always_for', { ext: extLabel }))}
        </label>
        <div class="dialog-btns">
          <button class="btn" id="owCopyPath">${escHtml(t('preview.copy_path'))}</button>
          <button class="btn" id="owClose">${escHtml(t('btn.cancel'))}</button>
        </div>
      </div>`;
    document.body.appendChild(bg);

    const close   = () => bg.remove();
    const always  = () => bg.querySelector('#owAlways').checked;
    const progVal = () => bg.querySelector('#owProgram').value.trim();

    bg.querySelector('#owDefault').onclick = async () => {
      if (always()) this._savePreference(ext, '');
      close();
      await this._doOpen(id, '');
      toast(t('preview.opening_os'));
    };

    const doCustomOpen = async () => {
      const prog = progVal();
      if (!prog) return;
      if (always()) this._savePreference(ext, prog);
      close();
      await this._doOpen(id, prog);
      toast(t('preview.opening_with', { prog }));
    };
    bg.querySelector('#owOpen').onclick = doCustomOpen;
    bg.querySelector('#owProgram').addEventListener('keydown', e => {
      if (e.key === 'Enter') doCustomOpen();
    });

    bg.querySelector('#owCopyPath').onclick = async () => {
      try {
        await navigator.clipboard.writeText(filePath);
        toast(t('files.copied'), 'success');
      } catch { toast(t('files.copy_failed'), 'error'); }
      close();
    };

    bg.querySelector('#owClose').onclick = close;
    bg.addEventListener('click', e => { if (e.target === bg) close(); });
  },

  open(fileId, fileName, fileExt, filePath = '') {
    const ext = (fileExt || '').toLowerCase();

    // Non-browser-viewable: use stored preference or show the open-with dialog
    if (!this._IMG_EXTS.has(ext) &&
        !this._VIDEO_EXTS.has(ext) && !this._AUDIO_EXTS.has(ext) &&
        !this._TEXT_EXTS.has(ext)) {
      const pref = this._getPreference(ext);
      if (pref !== null) {
        this._doOpen(fileId, pref);
        toast(pref ? t('preview.opening_with', { prog: pref }) : t('preview.opening_os'));
      } else {
        this._showOpenDialog(fileId, fileName, ext, filePath);
      }
      return;
    }

    document.getElementById('preview-modal').classList.remove('hidden');
    document.getElementById('prev-modal-title').textContent = fileName;
    const dl = document.getElementById('prev-btn-download');
    dl.href = api.downloadUrl(fileId);
    dl.setAttribute('download', fileName);
    const body = document.getElementById('prev-modal-body');
    body.innerHTML = `<div class="prev-loading">${escHtml(t('preview.loading'))}</div>`;

    if      (this._IMG_EXTS.has(ext))   this._showImage(body, fileId, fileName);
    else if (this._VIDEO_EXTS.has(ext)) this._showVideo(body, fileId);
    else if (this._AUDIO_EXTS.has(ext)) this._showAudio(body, fileId);
    else                                 this._showText(body, fileId);
  },

  close() {
    document.getElementById('preview-modal').classList.add('hidden');
    const body = document.getElementById('prev-modal-body');
    body.querySelectorAll('video, audio').forEach(m => { m.pause(); m.src = ''; });
    body.innerHTML = '';
  },

  _showImage(body, id, name) {
    const img = document.createElement('img');
    img.className = 'prev-image';
    img.alt = name;
    img.onerror = () => {
      body.innerHTML = `<div class="prev-error">${escHtml(t('preview.load_error'))}</div>`;
    };
    body.innerHTML = '';
    body.appendChild(img);
    img.src = api.previewUrl(id);
  },

  _showPdf(body, id) {
    const iframe = document.createElement('iframe');
    iframe.className = 'prev-iframe';
    iframe.sandbox = 'allow-same-origin allow-scripts';
    iframe.title   = 'PDF Preview';
    body.innerHTML = '';
    body.appendChild(iframe);
    iframe.src = api.previewUrl(id);
  },

  _showVideo(body, id) {
    const video = document.createElement('video');
    video.className = 'prev-video';
    video.controls  = true;
    body.innerHTML  = '';
    body.appendChild(video);
    video.src = api.previewUrl(id);
  },

  _showAudio(body, id) {
    const audio = document.createElement('audio');
    audio.className = 'prev-audio';
    audio.controls  = true;
    body.innerHTML  = '';
    body.appendChild(audio);
    audio.src = api.previewUrl(id);
  },

  async _showText(body, id) {
    try {
      const res  = await fetch(api.previewUrl(id));
      if (!res.ok) throw new Error(res.statusText);
      const text = await res.text();
      const pre  = document.createElement('pre');
      pre.className   = 'prev-text';
      pre.textContent = text.length > 500_000 ? text.slice(0, 500_000) + '\n\n[…]' : text;
      body.innerHTML  = '';
      body.appendChild(pre);
    } catch {
      body.innerHTML = `<div class="prev-error">${escHtml(t('preview.load_error'))}</div>`;
    }
  },

  _showFallback(body) {
    body.innerHTML = `<div class="prev-no-preview">${escHtml(t('preview.no_preview'))}</div>`;
  },
};

/* ── Main init ────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {

  // ── Language switcher ─────────────────────────────────────────────────────
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });
  document.addEventListener('langchange', rerender);

  // ── View switcher ─────────────────────────────────────────────────────────
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // ── Add archive form ──────────────────────────────────────────────────────
  const addForm = document.getElementById('add-archive-form');

  document.getElementById('btn-add-archive').addEventListener('click', () => {
    addForm.classList.toggle('hidden');
  });
  document.getElementById('btn-cancel-archive').addEventListener('click', () => {
    addForm.classList.add('hidden');
    fsBrowser.close();
  });

  // Open the drive browser modal
  document.getElementById('btn-browse-path').addEventListener('click', () => {
    fsBrowser.open();
  });

  // 🖴 button inside modal header — go back to drives list
  document.getElementById('fs-btn-drives').addEventListener('click', () => {
    fsBrowser.showDrives();
  });

  // ↑ button inside modal header — go up one level
  document.getElementById('fs-btn-up').addEventListener('click', () => {
    if (fsBrowser._parentPath) fsBrowser.navigate(fsBrowser._parentPath);
  });

  // Breadcrumb segment clicks — jump to any ancestor directly
  document.getElementById('fs-crumb').addEventListener('click', (e) => {
    const link = e.target.closest('.crumb-link');
    if (link && link.dataset.path) fsBrowser.navigate(link.dataset.path);
  });

  // Escape key closes the preview modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.getElementById('preview-modal').classList.contains('hidden')) {
      previewModal.close();
    }
  });

  // Backspace key while modal is open → go up one level (not inside input fields)
  document.addEventListener('keydown', (e) => {
    if (document.getElementById('fs-modal').classList.contains('hidden')) return;
    if (e.key !== 'Backspace') return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    e.preventDefault();
    if (fsBrowser._parentPath) fsBrowser.navigate(fsBrowser._parentPath);
    else if (!fsBrowser._currentPath) { /* already at drives */ }
    else fsBrowser.showDrives();
  });

  // ── Preview modal close buttons ───────────────────────────────────────────
  document.getElementById('prev-btn-close').addEventListener('click',  () => previewModal.close());
  document.getElementById('prev-btn-close2').addEventListener('click', () => previewModal.close());

  // ✕ button inside modal header
  document.getElementById('fs-btn-close').addEventListener('click', () => {
    fsBrowser.close();
  });

  // Cancel button in modal footer
  document.getElementById('btn-cancel-browse').addEventListener('click', () => {
    fsBrowser.close();
  });

  // Click on a drive or folder entry → navigate into it
  document.getElementById('fs-entries').addEventListener('click', (e) => {
    const entry = e.target.closest('.fs-entry');
    if (!entry || !entry.dataset.path) return;
    fsBrowser.navigate(entry.dataset.path);
  });

  // "Select this folder" button in modal footer
  document.getElementById('btn-select-dir').addEventListener('click', () => {
    if (fsBrowser._currentPath) {
      document.getElementById('archive-path').value = fsBrowser._currentPath;
      fsBrowser.close();
    }
  });
  document.getElementById('btn-save-archive').addEventListener('click', async () => {
    const p = document.getElementById('archive-path').value.trim();
    if (!p) { toast(t('arch.path_required'), 'error'); return; }

    try {
      const arch = await api.addArchive(p);
      toast(t('arch.added', { name: arch.name }), 'success');
      log(t('arch.log_added', { name: arch.name, path: p }));
      document.getElementById('archive-path').value = '';
      addForm.classList.add('hidden');
      fsBrowser.close();
      await loadArchives();
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  // ── Archive list (select / scan / delete) ─────────────────────────────────
  document.getElementById('archive-list').addEventListener('click', async (e) => {
    const action = e.target.dataset.action;
    const item   = e.target.closest('.archive-item');
    const id     = parseInt(item?.dataset.id, 10);
    if (!id) return;

    if (action === 'scan') {
      e.stopPropagation();
      try {
        await api.scanArchive(id);
        startScanPoller(id);
        renderArchives();
      } catch (err) { toast(err.message, 'error'); }
      return;
    }

    if (action === 'del-archive') {
      e.stopPropagation();
      const btn  = e.target.closest('[data-action="del-archive"]');
      const arch = state.archives.find(a => a.id === id);
      if (!await confirmDlg(t('arch.remove_dlg_title'), t('arch.remove_dlg_body', { name: arch?.name ?? '' }))) return;
      // Show loading state while waiting for backend
      if (btn) { btn.disabled = true; btn.textContent = '\u2026'; }
      try {
        await api.deleteArchive(id);
        if (state.selectedArchive === id) state.selectedArchive = null;
        log(t('arch.log_removed', { name: arch?.name ?? '' }));
        toast(t('arch.removed'), 'success');
        await loadArchives();
        await loadFiles();
      } catch (err) {
        if (btn) { btn.disabled = false; btn.textContent = '\u2715'; }
        toast(err.message, 'error');
      }
      return;
    }

    // Toggle selection
    state.selectedArchive = state.selectedArchive === id ? null : id;
    state.page = 1;
    renderArchives();
    await loadFiles();
  });

  // ── Filter inputs (debounced) ─────────────────────────────────────────────
  let filterTimer;
  const debounce = (fn) => { clearTimeout(filterTimer); filterTimer = setTimeout(fn, 300); };

  document.getElementById('filter-name').addEventListener('input', (e) => {
    debounce(async () => { state.filters.name = e.target.value; state.page = 1; await loadFiles(); });
  });
  document.getElementById('filter-ext').addEventListener('input', (e) => {
    debounce(async () => { state.filters.ext = e.target.value; state.page = 1; await loadFiles(); });
  });
  document.getElementById('filter-dups').addEventListener('change', async (e) => {
    state.filters.dups = e.target.checked; state.page = 1; await loadFiles();
  });
  document.getElementById('btn-reset-filters').addEventListener('click', async () => {
    state.filters         = { name: '', ext: '', dups: false };
    state.selectedArchive = null;
    state.page            = 1;
    document.getElementById('filter-name').value  = '';
    document.getElementById('filter-ext').value   = '';
    document.getElementById('filter-dups').checked = false;
    renderArchives();
    await loadFiles();
  });

  // ── Sort columns ──────────────────────────────────────────────────────────
  document.querySelectorAll('.file-table th.sortable').forEach(th => {
    th.addEventListener('click', async () => {
      const col = th.dataset.col;
      state.sort.order = state.sort.col === col && state.sort.order === 'asc' ? 'desc' : 'asc';
      state.sort.col   = col;
      state.page = 1;
      await loadFiles();
    });
  });

  // ── File table actions ────────────────────────────────────────────────────
  document.getElementById('file-list').addEventListener('click', async (e) => {
    const action = e.target.dataset.action;
    if (!action) return;

    if (action === 'copy-path') {
      try {
        await navigator.clipboard.writeText(e.target.dataset.path);
        toast(t('files.copied'), 'success');
      } catch { toast(t('files.copy_failed'), 'error'); }
    }

    if (action === 'preview') {
      const id   = parseInt(e.target.dataset.id, 10);
      const file = state.files.find(f => f.id === id);
      if (file) previewModal.open(id, file.name, file.ext || '', file.path || '');
    }

    if (action === 'delete-file') {
      const id   = parseInt(e.target.dataset.id, 10);
      const name = e.target.dataset.name;
      if (!await confirmDlg(t('files.del_dlg_title'), t('files.del_dlg_body', { name }))) return;
      try {
        await api.deleteFile(id, false);
        log(t('files.log_deleted', { name }));
        toast(t('files.deleted'), 'success');
        await loadFiles();
        await loadArchives();
      } catch (err) { toast(err.message, 'error'); }
    }
  });

  // ── Pagination ────────────────────────────────────────────────────────────
  document.getElementById('pagination').addEventListener('click', async (e) => {
    const page = parseInt(e.target.dataset.page, 10);
    if (!page || e.target.disabled) return;
    state.page = page;
    await loadFiles();
  });

  // ── Duplicates view ───────────────────────────────────────────────────────
  document.getElementById('dup-list').addEventListener('click', async (e) => {
    const btn    = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === 'dup-copy-path') {
      try {
        await navigator.clipboard.writeText(btn.dataset.path);
        toast(t('files.copied'), 'success');
      } catch { toast(t('files.copy_failed'), 'error'); }
      return;
    }

    if (action === 'dup-preview') {
      previewModal.open(parseInt(btn.dataset.id, 10), btn.dataset.name, btn.dataset.ext, btn.dataset.path);
      return;
    }

    const groupIdx = parseInt(btn.dataset.group, 10);
    const wrap     = document.getElementById('dup-list');
    const groups   = wrap._groups;
    if (!groups || isNaN(groupIdx)) return;
    const group = groups[groupIdx];

    // Mark a different file as keeper
    if (action === 'keep') {
      const keepId  = parseInt(btn.dataset.keep, 10);
      const rows    = [...document.querySelectorAll(`div.dup-row[data-group="${groupIdx}"]`)];
      const btnIds  = new Map(rows.map(r => {
        const b = r.querySelector('[data-action="keep"]');
        return [r, b ? parseInt(b.dataset.keep, 10) : null];
      }));

      rows.forEach(row => {
        const rowFileId = btnIds.get(row);
        const isNew     = rowFileId === keepId;
        const wasKeeper = rowFileId === null;

        row.classList.toggle('keeper', isNew || (wasKeeper && !rows.some(r => btnIds.get(r) === keepId)));

        const cell = row.querySelector('.dr-action');
        if (isNew) {
          cell.innerHTML = keepActionHtml(keepId, groupIdx, true);
        } else if (wasKeeper) {
          const file = group.files.find(f => f.id !== keepId && ![...btnIds.values()].includes(f.id))
                    ?? group.files.find(f => f.id !== keepId);
          if (file) cell.innerHTML = keepActionHtml(file.id, groupIdx, false);
        }
      });
    }

    // Resolve all duplicates in group
    if (action === 'resolve-all') {
      const rows    = [...document.querySelectorAll(`div.dup-row[data-group="${groupIdx}"]`)];
      const keeperRow = rows.find(r => r.classList.contains('keeper'));

      // Determine which file ID is the keeper (no keep-button in its first cell)
      let keepId = group.files[0].id;
      if (keeperRow) {
        const btn = keeperRow.querySelector('[data-action="keep"]');
        if (!btn) {
          // keeper row has a label — find its file by exclusion
          const deleteIds = rows
            .filter(r => !r.classList.contains('keeper'))
            .map(r => {
              const b = r.querySelector('[data-action="keep"]');
              return b ? parseInt(b.dataset.keep, 10) : null;
            })
            .filter(Boolean);
          keepId = group.files.find(f => !deleteIds.includes(f.id))?.id ?? group.files[0].id;
        } else {
          keepId = group.files[0].id;
        }
      }

      const deleteIds = group.files.filter(f => f.id !== keepId).map(f => f.id);
      if (!deleteIds.length) return;

      if (!await confirmDlg(t('dups.dlg_title'), t('dups.dlg_body', { count: deleteIds.length }))) return;
      try {
        await api.resolveDups(keepId, deleteIds);
        toast(t('dups.resolved', { count: deleteIds.length }), 'success');
        log(t('dups.log_resolved', { count: deleteIds.length }));
        await loadDuplicates();
        await loadArchives();
        await loadFiles();
      } catch (err) { toast(err.message, 'error'); }
    }
  });

  // ── Duplicates pagination ─────────────────────────────────────────────────
  document.getElementById('dup-pagination').addEventListener('click', (e) => {
    const page = parseInt(e.target.dataset.page, 10);
    if (!page || e.target.disabled) return;
    state.dupPage = page;
    renderDuplicates(state.dupGroups);
    document.getElementById('dup-list').scrollTop = 0;
  });

  // ── Select-all checkbox ───────────────────────────────────────────────────
  document.getElementById('select-all-files').addEventListener('change', (e) => {
    if (e.target.checked) {
      state.files.forEach(f => state.selectedFiles.add(f.id));
    } else {
      state.files.forEach(f => state.selectedFiles.delete(f.id));
    }
    renderFiles();
  });

  // ── Row checkboxes ────────────────────────────────────────────────────────
  document.getElementById('file-list').addEventListener('change', (e) => {
    if (!e.target.classList.contains('row-check')) return;
    const id = parseInt(e.target.dataset.id, 10);
    if (e.target.checked) state.selectedFiles.add(id);
    else state.selectedFiles.delete(id);

    const allChecked  = state.files.every(f => state.selectedFiles.has(f.id));
    const someChecked = state.files.some(f => state.selectedFiles.has(f.id));
    const selAll = document.getElementById('select-all-files');
    selAll.checked       = allChecked;
    selAll.indeterminate = !allChecked && someChecked;
    updateBatchBar();
  });

  // ── Deselect all ──────────────────────────────────────────────────────────
  document.getElementById('btn-deselect-all').addEventListener('click', () => {
    state.selectedFiles.clear();
    renderFiles();
  });

  // ── Bulk copy paths ───────────────────────────────────────────────────────
  document.getElementById('btn-bulk-copy-paths').addEventListener('click', async () => {
    const ids = [...state.selectedFiles];
    if (!ids.length) return;
    const paths = state.files
      .filter(f => state.selectedFiles.has(f.id))
      .map(f => f.path)
      .join('\n');
    try {
      await navigator.clipboard.writeText(paths);
      const count = state.files.filter(f => state.selectedFiles.has(f.id)).length;
      toast(t('files.bulk_copy_done', { count }), 'success');
    } catch {
      toast(t('files.copy_failed'), 'error');
    }
  });

  // ── Bulk delete ───────────────────────────────────────────────────────────
  document.getElementById('btn-bulk-delete').addEventListener('click', async () => {
    const ids = [...state.selectedFiles];
    if (!ids.length) return;
    if (!await confirmDlg(t('files.bulk_del_title'), t('files.bulk_del_body', { count: ids.length }))) return;
    let errors = 0;
    await Promise.all(ids.map(id => api.deleteFile(id, false).catch(() => { errors++; })));
    state.selectedFiles.clear();
    if (errors) toast(t('files.bulk_del_errors', { errors }), 'error');
    else toast(t('files.bulk_del_done', { count: ids.length }), 'success');
    log(t('files.bulk_del_done', { count: ids.length - errors }));
    await loadFiles();
    await loadArchives();
  });

  // ── Refresh buttons ───────────────────────────────────────────────────────
  document.getElementById('btn-refresh-dups').addEventListener('click', () => loadDuplicates(true));
  document.getElementById('btn-refresh-health').addEventListener('click', loadHealth);

  // ── Initial data load ─────────────────────────────────────────────────────
  await Promise.all([loadHealth(), loadArchives()]);
  await loadFiles();

  // Re-fetch health every 60 s when monitor view is active
  setInterval(() => { if (state.view === 'monitor') loadHealth(); }, 60_000);
});
