async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function setPaneHTML(paneId, html) {
  const pane = document.getElementById(paneId);
  if (!pane) return;
  pane.innerHTML = html;
}

function renderJsonTree(value, depth = 0) {
  if (value === null || value === undefined) {
    return `<span class="json-null">${value === null ? 'null' : 'undefined'}</span>`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return `<span class="json-empty">[ ]</span>`;
    const open = depth < 1 ? 'open' : '';
    const items = value
      .map((v, i) => `<li><span class="json-index">${i}</span>${renderJsonTree(v, depth + 1)}</li>`)
      .join('');
    return `
      <details class="json-node" ${open}>
        <summary class="json-summary">Array(${value.length})</summary>
        <ul>${items}</ul>
      </details>
    `;
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) return `<span class="json-empty">{ }</span>`;
    const open = depth < 1 ? 'open' : '';
    const items = keys
      .map((k) => {
        const key = escapeHtml(String(k));
        return `<li><span class="json-key">${key}</span>${renderJsonTree(value[k], depth + 1)}</li>`;
      })
      .join('');
    return `
      <details class="json-node" ${open}>
        <summary class="json-summary">Object(${keys.length})</summary>
        <ul>${items}</ul>
      </details>
    `;
  }

  if (typeof value === 'string') return `<span class="json-string">"${escapeHtml(value)}"</span>`;
  if (typeof value === 'number') return `<span class="json-number">${value}</span>`;
  if (typeof value === 'boolean') return `<span class="json-bool">${value}</span>`;
  return `<span class="json-unknown">${escapeHtml(String(value))}</span>`;
}

function renderJsonPane(title, payload) {
  const data = payload && payload.data !== undefined ? payload.data : payload;
  return `
    <section class="card">
      <h2>${escapeHtml(title)}</h2>
      <div class="muted small">AJAX 로드 완료</div>
      <div class="json-tree">${renderJsonTree(data)}</div>
    </section>
  `;
}

function pickListCandidate(data, keys) {
  for (const key of keys) {
    const value = data?.[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function renderArkPane(title, payload, kind) {
  const data = payload && payload.data !== undefined ? payload.data : payload;

  if (!data) {
    return `
      <section class="card">
        <div class="card-head">
          <h2>${escapeHtml(title)}</h2>
          <span class="status warn">준비중</span>
        </div>
        <p class="muted">탭을 클릭하면 데이터를 불러옵니다.</p>
      </section>
    `;
  }

  const available = Boolean(data.available);
  const statusClass = available ? 'ok' : 'warn';
  const statusText = available ? '활성' : '준비중';
  const updatedAt = data.updatedAt ? escapeHtml(String(data.updatedAt)) : '-';
  const core = data.data !== undefined ? data.data : data;
  const primitives = Object.entries(core).filter(([k, v]) => (
    !['available', 'updatedAt', 'message', 'data'].includes(k) &&
    (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')
  ));

  const listKeys = kind === 'arkgrid'
    ? ['nodes', 'items', 'effects', 'Effects']
    : ['passives', 'effects', 'Effects', 'items'];
  const list = pickListCandidate(core, listKeys);

  const primitiveHtml = primitives.length
    ? `
      <div class="kv-grid">
        ${primitives.map(([k, v]) => `
          <div class="kv-item">
            <div class="kv-key">${escapeHtml(String(k))}</div>
            <div class="kv-val">${escapeHtml(String(v))}</div>
          </div>
        `).join('')}
      </div>
    `
    : '';

  const listHtml = list.length
    ? `
      <div class="list-grid">
        ${list.map((it) => {
          const icon = it?.Icon ?? it?.icon ?? null;
          const name = it?.Name ?? it?.Title ?? it?.EffectName ?? it?.Type ?? '항목';
          const level = it?.Level ?? it?.Grade ?? null;
          const desc = it?.Description ?? it?.Effect ?? it?.Tooltip ?? it?.Desc ?? null;
          return `
            <div class="mini-card">
              <div class="mini-row">
                ${icon ? `<img class="mini-icon" src="${escapeHtml(String(icon))}" alt="icon" />` : ''}
                <div class="mini-title">
                  <div class="mini-name">${escapeHtml(String(name))}</div>
                  ${level ? `<span class="badge">Lv. ${escapeHtml(String(level))}</span>` : ''}
                </div>
              </div>
              ${desc ? `<div class="muted small">${escapeHtml(String(desc))}</div>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `
    : '';

  const sectionsHtml = kind === 'arkpassive' ? renderArkPassiveSections(core) : '';
  const listBlock = kind === 'arkpassive' ? '' : listHtml;

  const body = available
    ? `
      ${sectionsHtml}
      ${primitiveHtml}
      ${listBlock}
      <details>
        <summary>${escapeHtml(title)} 원본(JSON)</summary>
        <div class="json-tree">${renderJsonTree(core)}</div>
      </details>
    `
    : `
      <div class="empty-state">
        <div class="empty-title">아직 연결되지 않았어요</div>
        <div class="muted small">${escapeHtml(String(data.message ?? '데이터 준비 중입니다.'))}</div>
      </div>
    `;

  return `
    <section class="card">
      <div class="card-head">
        <h2>${escapeHtml(title)}</h2>
        <span class="status ${statusClass}">${statusText}</span>
      </div>
      <div class="muted small">업데이트: ${updatedAt}</div>
      ${body}
    </section>
  `;
}

function renderArkPassiveSections(core) {
  const sections = ['진화', '깨달음', '도약'];
  const parsed = parseArkPassiveCore(core);

  const cards = sections.map((label) => {
    const info = parsed.points[label] || null;
    const effects = parsed.effects.filter(e => e?.Name === label);
    if (!info && effects.length === 0) {
      return `
        <div class="ark-section-card">
          <div class="ark-section-head">
            <div class="ark-section-title">${label}</div>
            <span class="ark-stage">-단계</span>
          </div>
          <div class="muted small">데이터 없음</div>
        </div>
      `;
    }

    const stageInfo = parseRankLevel(info?.Description || '');
    const stageLabel = stageInfo.rank ? `${stageInfo.rank}랭크` : '-단계';
    const pointLabel = info?.Value !== undefined ? `${info.Value} P` : '-';
    const description = info?.Description ? stripHtml(info.Description) : null;

    const effectsHtml = effects.length
      ? effects.map((e) => {
          const desc = e.Description ? stripHtml(e.Description) : '';
          return `
            <div class="mini-card">
              <div class="mini-row">
                ${e.Icon ? `<img class="mini-icon" src="${escapeHtml(String(e.Icon))}" alt="icon" />` : ''}
                <div class="mini-title">
                  <div class="mini-name">${desc || '효과'}</div>
                </div>
              </div>
            </div>
          `;
        }).join('')
      : '<div class="muted small">선택된 효과 없음</div>';

    return `
      <div class="ark-section-card">
        <div class="ark-section-head">
          <div class="ark-section-title">${label}</div>
          <span class="ark-stage">${stageLabel}</span>
        </div>
        <div class="ark-section-meta">
          <span class="badge">포인트 ${pointLabel}</span>
          ${stageInfo.level ? `<span class="badge badge-ghost">${stageInfo.level}레벨</span>` : ''}
        </div>
        ${description ? `<div class="muted small">${escapeHtml(description)}</div>` : ''}
        <div class="list-grid">
          ${effectsHtml}
        </div>
        <details>
          <summary>${label} 원본</summary>
          <div class="json-tree">${renderJsonTree(info || {})}</div>
        </details>
      </div>
    `;
  }).join('');

  return `<div class="ark-section-grid">${cards}</div>`;
}

function parseArkPassiveCore(core) {
  const points = { 진화: null, 깨달음: null, 도약: null };
  let effects = [];
  const sectionNames = ['진화', '깨달음', '도약'];

  const isPointEntry = (e) => (
    e && typeof e === 'object' &&
    sectionNames.includes(e.Name) &&
    (e.Value !== undefined || e.Description || e.Tooltip)
  );
  const isEffectEntry = (e) => (
    e && typeof e === 'object' &&
    e.Name && e.Description && (e.Icon || e.ToolTip || e.Tooltip)
  );

  if (Array.isArray(core)) {
    core.forEach((entry) => {
      if (isPointEntry(entry)) {
        points[entry.Name] = entry;
      }
      if (isEffectEntry(entry)) effects.push(entry);
      if (Array.isArray(entry?.Effects)) effects = entry.Effects;
    });
  } else if (core && typeof core === 'object') {
    if (core?.Name && points[core.Name] !== undefined) points[core.Name] = core;
    const pointArrays = [
      core?.Points,
      core?.PassivePoints,
      core?.ArkPassivePoints,
    ].filter(Array.isArray);
    pointArrays.forEach((arr) => {
      arr.forEach((p) => {
        if (isPointEntry(p)) points[p.Name] = p;
      });
    });
    sectionNames.forEach((key) => {
      if (core[key]) points[key] = core[key];
    });
    if (Array.isArray(core?.Effects)) effects = core.Effects;

    if (!effects.length) {
      Object.values(core).forEach((val) => {
        if (!Array.isArray(val)) return;
        val.forEach((e) => {
          if (isEffectEntry(e)) effects.push(e);
          if (isPointEntry(e)) points[e.Name] = e;
        });
      });
    }
  }

  return { points, effects };
}

function parseRankLevel(text) {
  const rankMatch = String(text).match(/(\d+)\s*랭크/);
  const levelMatch = String(text).match(/(\d+)\s*레벨/);
  return {
    rank: rankMatch ? rankMatch[1] : null,
    level: levelMatch ? levelMatch[1] : null,
  };
}

function getStageValue(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value !== 'object') return null;
  const candidates = ['Level', 'Stage', 'Step', 'Phase', 'Rank', 'Grade'];
  for (const k of candidates) {
    if (value[k] !== undefined && value[k] !== null && value[k] !== '') {
      const num = Number(value[k]);
      return Number.isFinite(num) ? num : value[k];
    }
  }
  return null;
}

function extractPrimitivePairs(value) {
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).filter(([k, v]) => (
    typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
  ));
}

function stripHtml(input) {
  if (!input) return '';
  return String(input)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .trim();
}

function showPane(id) {
  document.querySelectorAll('.pane').forEach(p => {
    p.style.display = (p.id === id) ? 'block' : 'none';
  });
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === id);
  });
}

async function loadTab(tabBtn) {
  const tabId = tabBtn.dataset.tab;
  const url = tabBtn.dataset.url;
  const urlSecondary = tabBtn.dataset.urlSecondary;
  const target = tabBtn.dataset.target;
  const targetSecondary = tabBtn.dataset.targetSecondary;

  showPane(tabId);

  if (tabBtn.dataset.preloaded === 'true') {
    tabBtn.dataset.loaded = 'true';
    return;
  }
  if (tabBtn.dataset.loaded === 'true') return;

  const pane = document.getElementById(tabId);
  const primaryTarget = target ? document.querySelector(target) : pane;
  const secondaryTarget = targetSecondary ? document.querySelector(targetSecondary) : null;
  const prev = primaryTarget ? primaryTarget.innerHTML : '';
  if (primaryTarget) {
    primaryTarget.innerHTML = `<p class="muted">로딩 중...</p>`;
  }

  try {
    const tasks = [];
    if (url) tasks.push(fetchJSON(url));
    if (urlSecondary) tasks.push(fetchJSON(urlSecondary));
    const results = await Promise.all(tasks);

    const json = results[0];
    if (primaryTarget) {
      if (tabId === 'arkgrid' || tabId === 'arkpassive') {
        primaryTarget.innerHTML = renderArkPane(tabBtn.textContent, json, tabId);
      } else {
        primaryTarget.innerHTML = renderJsonPane(tabBtn.textContent, json);
      }
    }

    if (secondaryTarget && results[1]) {
      secondaryTarget.innerHTML = renderArkPane('아크패시브', results[1], 'arkpassive');
    }
    tabBtn.dataset.loaded = 'true';
  } catch (e) {
    if (primaryTarget) {
      primaryTarget.innerHTML = prev + `<p class="muted">불러오기 실패: ${escapeHtml(String(e.message))}</p>`;
    }
  }
}

function escapeHtml(s) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tab').forEach(btn => {
    if (btn.dataset.preloaded === 'true') {
      btn.dataset.loaded = 'true';
    }
    btn.addEventListener('click', () => loadTab(btn));
  });

  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      try {
        refreshBtn.disabled = true;
        await fetch(`/api/characters/${encodeURIComponent(window.__CHAR_NAME__)}/refresh`, { method: 'POST' });
        location.reload();
      } finally {
        refreshBtn.disabled = false;
      }
    });
  }
});
