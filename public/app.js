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
  addArchive:    (n, p)     => api.post('/api/archives', { name: n, path: p }),
  deleteArchive: (id)       => api.delete(`/api/archives/${id}`),
  scanArchive:   (id)       => api.post(`/api/archives/${id}/scan`),
  getScanStatus: (id)       => api.get(`/api/archives/${id}/scan/status`),
  getFiles:      (params)   => api.get('/api/files?' + new URLSearchParams(params)),
  deleteFile:    (id, dbOnly) => api.delete(`/api/files/${id}${dbOnly ? '?dbOnly=true' : ''}`),
  getDuplicates: ()         => api.get('/api/duplicates'),
  resolveDups:   (keep, del)=> api.post('/api/duplicates/resolve', { keepId: keep, deleteIds: del }),

  downloadUrl: (id) => `/api/files/${id}/download`,
  previewUrl:  (id) => `/api/files/${id}/preview`,
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
    return `
      <li class="archive-item ${active}" data-id="${a.id}">
        <div class="archive-dot ${scanning}"></div>
        <div class="archive-info">
          <div class="archive-name" title="${escHtml(a.path)}">${escHtml(a.name)}</div>
          <div class="archive-meta">${fmtNum(a.file_count)} · ${formatSize(a.total_size)}</div>
        </div>
        <div class="archive-actions">
          <button class="btn-xs" data-action="scan" data-id="${a.id}"
                  title="${escHtml(t('arch.scan_title'))}">↻</button>
          <button class="btn-xs danger" data-action="del-archive" data-id="${a.id}"
                  title="${escHtml(t('arch.remove_title'))}">✕</button>
        </div>
      </li>`;
  }).join('');
}

/* ── Render: File table ───────────────────────────────────────────────────── */
function renderFiles() {
  const tbody = document.getElementById('file-list');
  const stats = document.getElementById('file-stats');

  if (!state.files.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="icon">📂</div><p>${escHtml(t('files.none'))}</p></div></td></tr>`;
    stats.textContent = '';
    return;
  }

  stats.textContent = t('files.stats', { total: fmtNum(state.total), page: state.page });

  tbody.innerHTML = state.files.map(f => {
    const isDup  = f.dup_count > 1;
    const dupTag = isDup ? `<span class="ext-badge dup-badge">${escHtml(t('files.dup_badge', { count: f.dup_count }))}</span>` : '';
    const ext    = f.ext ? `<span class="ext-badge">${escHtml(f.ext.toUpperCase())}</span>` : '\u2014';
    return `
      <tr data-id="${f.id}">
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
function renderDuplicates(groups) {
  const wrap = document.getElementById('dup-list');
  if (!groups.length) {
    wrap.innerHTML = `<div class="dup-empty">${escHtml(t('dups.success'))}</div>`;
    wrap._groups = [];
    return;
  }

  wrap.innerHTML = groups.map((g, gi) => {
    const rows = g.files.map((f, fi) => {
      const isKeeper = fi === 0;
      return `
        <tr class="${isKeeper ? 'keeper' : ''}" data-group="${gi}">
          <td>${isKeeper
            ? `<span style="color:var(--success)">${escHtml(t('dups.keeping'))}</span>`
            : `<button class="btn btn-sm" data-action="keep" data-keep="${f.id}" data-group="${gi}">${escHtml(t('dups.keep'))}</button>`
          }</td>
          <td class="file-name" title="${escHtml(f.path)}">${escHtml(f.name)}</td>
          <td>${escHtml(f.archive_name)}</td>
          <td>${formatSize(f.size)}</td>
          <td>${formatDate(f.modified_at)}</td>
          <td>
            <a href="${api.downloadUrl(f.id)}" class="btn-icon-sm"
               title="${escHtml(t('dups.dl_title'))}" download>\u2193</a>
          </td>
        </tr>`;
    }).join('');

    return `
      <div class="dup-group" id="dup-group-${gi}">
        <div class="dup-group-header">
          <span>${escHtml(t('dups.count', { count: g.count }))}</span>
          <span class="dup-hash">${g.hash.slice(0, 16)}\u2026</span>
          <button class="btn btn-sm btn-danger"
                  data-action="resolve-all" data-group="${gi}">
            ${escHtml(t('dups.resolve_btn'))}
          </button>
        </div>
        <table><tbody>${rows}</tbody></table>
      </div>`;
  }).join('');

  wrap._groups = groups;
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

async function loadDuplicates() {
  try {
    const groups = await api.getDuplicates();
    renderDuplicates(groups);
    const badge = document.getElementById('dup-badge');
    badge.textContent = groups.length > 0 ? String(groups.length) : '';
  } catch (err) {
    toast(t('dups.load_error', { msg: err.message }), 'error');
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

  if (viewName === 'duplicates') loadDuplicates();
  if (viewName === 'monitor')    loadHealth();
}

/* ── Full re-render on language change ────────────────────────────────────── */
function rerender() {
  renderArchives();
  renderFiles();
  if (state.view === 'duplicates') {
    const wrap = document.getElementById('dup-list');
    if (wrap._groups) renderDuplicates(wrap._groups);
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
  });
  document.getElementById('btn-save-archive').addEventListener('click', async () => {
    const name = document.getElementById('archive-name').value.trim();
    const p    = document.getElementById('archive-path').value.trim();
    if (!name || !p) { toast(t('arch.name_required'), 'error'); return; }

    try {
      await api.addArchive(name, p);
      toast(t('arch.added', { name }), 'success');
      log(t('arch.log_added', { name, path: p }));
      document.getElementById('archive-name').value = '';
      document.getElementById('archive-path').value = '';
      addForm.classList.add('hidden');
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
      const arch = state.archives.find(a => a.id === id);
      if (!await confirmDlg(t('arch.remove_dlg_title'), t('arch.remove_dlg_body', { name: arch?.name ?? '' }))) return;
      try {
        await api.deleteArchive(id);
        if (state.selectedArchive === id) state.selectedArchive = null;
        log(t('arch.log_removed', { name: arch?.name ?? '' }));
        toast(t('arch.removed'), 'success');
        await loadArchives();
        await loadFiles();
      } catch (err) { toast(err.message, 'error'); }
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
      window.open(api.previewUrl(e.target.dataset.id), '_blank');
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
    const action   = e.target.dataset.action;
    const groupIdx = parseInt(e.target.dataset.group, 10);
    const wrap     = document.getElementById('dup-list');
    const groups   = wrap._groups;
    if (!groups || isNaN(groupIdx)) return;
    const group = groups[groupIdx];

    // Mark a different file as keeper
    if (action === 'keep') {
      const keepId = parseInt(e.target.dataset.keep, 10);
      const rows   = [...document.querySelectorAll(`tr[data-group="${groupIdx}"]`)];

      rows.forEach(row => {
        const btn = row.querySelector('[data-action="keep"]');
        const rowFileId = btn ? parseInt(btn.dataset.keep, 10) : null;
        const isKeeper  = rowFileId === null ? false : rowFileId === keepId;

        row.classList.toggle('keeper', rowFileId === keepId || (rowFileId === null && !rows.some(r => {
          const b = r.querySelector('[data-action="keep"]');
          return b && parseInt(b.dataset.keep, 10) === keepId;
        })));

        // Swap button ↔ label
        const td = row.cells[0];
        if (rowFileId === keepId) {
          td.innerHTML = `<span style="color:var(--success)">${escHtml(t('dups.keeping'))}</span>`;
        } else if (btn === null && !isKeeper) {
          // This row was the keeper, give it back a keep button
          const file = group.files.find(f => {
            return !rows.some(r => {
              const b = r.querySelector('[data-action="keep"]');
              return b && parseInt(b.dataset.keep, 10) === f.id;
            }) && f.id !== keepId;
          }) || group.files.find(f => f.id !== keepId);
          if (file) td.innerHTML = `<button class="btn btn-sm" data-action="keep" data-keep="${file.id}" data-group="${groupIdx}">${escHtml(t('dups.keep'))}</button>`;
        }
      });
    }

    // Resolve all duplicates in group
    if (action === 'resolve-all') {
      const rows    = [...document.querySelectorAll(`tr[data-group="${groupIdx}"]`)];
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

  // ── Refresh buttons ───────────────────────────────────────────────────────
  document.getElementById('btn-refresh-dups').addEventListener('click', loadDuplicates);
  document.getElementById('btn-refresh-health').addEventListener('click', loadHealth);

  // ── Initial data load ─────────────────────────────────────────────────────
  await Promise.all([loadHealth(), loadArchives()]);
  await loadFiles();

  // Re-fetch health every 60 s when monitor view is active
  setInterval(() => { if (state.view === 'monitor') loadHealth(); }, 60_000);
});
