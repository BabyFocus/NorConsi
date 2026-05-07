const NC_STORAGE_KEY = 'norconsi-roadmap-completed-v1';

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === 'class') node.className = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key === 'checked') node.checked = Boolean(value);
    else if (key === 'disabled') node.disabled = Boolean(value);
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value);
  });
  children.forEach((child) => node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child));
  return node;
}

function readCompleted() {
  try {
    return new Set(JSON.parse(localStorage.getItem(NC_STORAGE_KEY) || '[]'));
  } catch (_) {
    return new Set();
  }
}

function writeCompleted(completed) {
  localStorage.setItem(NC_STORAGE_KEY, JSON.stringify([...completed]));
}

function normalize(text) {
  return String(text || '').toLowerCase().trim();
}

function safeId(text) {
  return normalize(text).replace(/[^a-z0-9æøå]+/gi, '-').replace(/^-|-$/g, '');
}

function flattenRoadmap(roadmap) {
  return roadmap.phases.flatMap((phase, phaseIndex) =>
    phase.items.map((item, itemIndex) => ({
      ...item,
      id: item.id || `${phase.id}-${itemIndex + 1}`,
      phaseId: phase.id,
      phaseTitle: phase.title,
      phaseKicker: phase.kicker,
      phasePeriod: phase.period,
      phaseIndex,
      itemIndex,
    }))
  );
}

function getUnique(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'no'));
}

function option(value, label, selectedValue) {
  return el('option', { value, selected: value === selectedValue ? 'selected' : undefined }, [label]);
}

function statusClass(status) {
  const value = normalize(status);
  if (value.includes('ferdig')) return 'done';
  if (value.includes('pågår')) return 'active';
  if (value.includes('risiko')) return 'risk';
  return 'planned';
}

function renderRoadmap() {
  const container = document.querySelector('[data-roadmap]');
  const roadmap = window.NC_ROADMAP;
  if (!container || !roadmap || !Array.isArray(roadmap.phases)) return;

  const state = {
    search: '',
    status: 'all',
    tag: 'all',
    phase: 'all',
    view: 'grouped',
    completed: readCompleted(),
  };

  const allItems = flattenRoadmap(roadmap);

  function applyFilters(items) {
    return items.filter((item) => {
      const haystack = normalize([
        item.title,
        item.tag,
        item.status,
        item.owner,
        item.detail,
        item.success,
        item.phaseTitle,
        ...(item.deliverables || []),
      ].join(' '));
      const matchesSearch = !state.search || haystack.includes(normalize(state.search));
      const matchesStatus = state.status === 'all' || item.status === state.status;
      const matchesTag = state.tag === 'all' || item.tag === state.tag;
      const matchesPhase = state.phase === 'all' || item.phaseId === state.phase;
      return matchesSearch && matchesStatus && matchesTag && matchesPhase;
    });
  }

  function renderDashboard(filteredItems) {
    const completedCount = allItems.filter((item) => state.completed.has(item.id)).length;
    const totalCount = allItems.length || 1;
    const progress = Math.round((completedCount / totalCount) * 100);
    const activeCount = allItems.filter((item) => normalize(item.status).includes('pågår')).length;
    const plannedCount = allItems.filter((item) => normalize(item.status).includes('planlagt')).length;

    function statCard({ variant = '', icon, label, value, subLabel, progressValue }) {
      const bodyChildren = [
        el('span', { class: 'stat-label' }, [label]),
        el('div', { class: 'stat-value-row' }, [
          el('strong', {}, [String(value)]),
          subLabel ? el('small', {}, [subLabel]) : el('small', { class: 'is-empty' }, ['']),
        ]),
      ];

      if (typeof progressValue === 'number') {
        bodyChildren.push(el('div', { class: 'progress-track', 'aria-label': `Fremdrift ${progressValue} prosent` }, [
          el('div', { class: 'progress-fill', style: `width:${progressValue}%` }),
        ]));
      }

      return el('article', { class: `roadmap-stat ${variant}`.trim() }, [
        el('span', { class: 'roadmap-stat-icon', 'aria-hidden': 'true' }, [icon]),
        el('div', { class: 'roadmap-stat-body' }, bodyChildren),
      ]);
    }

    return el('section', { class: 'roadmap-dashboard', 'aria-label': 'Roadmap statusoversikt' }, [
      statCard({
        variant: 'primary-stat',
        icon: '↗',
        label: 'Fremdrift lokalt',
        value: `${progress}%`,
        progressValue: progress,
      }),
      statCard({
        variant: 'milestone-stat',
        icon: '⚑',
        label: 'Milepæler',
        value: allItems.length,
        subLabel: `${filteredItems.length} vises`,
      }),
      statCard({
        variant: 'active-stat',
        icon: '•',
        label: 'Pågår',
        value: activeCount,
      }),
      statCard({
        variant: 'planned-stat',
        icon: '□',
        label: 'Planlagt',
        value: plannedCount,
      }),
    ]);
  }

  function renderControls() {
    const statuses = getUnique(allItems.map((item) => item.status));
    const tags = getUnique(allItems.map((item) => item.tag));

    function selectControl({ icon, label, select }) {
      return el('label', { class: 'select-control' }, [
        el('span', { class: 'control-icon', 'aria-hidden': 'true' }, [icon]),
        el('span', { class: 'sr-only' }, [label]),
        select,
        el('span', { class: 'select-arrow', 'aria-hidden': 'true' }, ['⌄']),
      ]);
    }

    const search = el('input', {
      class: 'control-input',
      type: 'search',
      placeholder: 'Søk i roadmap …',
      value: state.search,
      oninput: (event) => {
        state.search = event.target.value;
        update();
      },
    });

    const statusSelect = el('select', {
      class: 'control-select',
      onchange: (event) => {
        state.status = event.target.value;
        update();
      },
    }, [option('all', 'Alle statuser', state.status), ...statuses.map((status) => option(status, status, state.status))]);

    const tagSelect = el('select', {
      class: 'control-select',
      onchange: (event) => {
        state.tag = event.target.value;
        update();
      },
    }, [option('all', 'Alle tema', state.tag), ...tags.map((tag) => option(tag, tag, state.tag))]);

    const phaseSelect = el('select', {
      class: 'control-select',
      onchange: (event) => {
        state.phase = event.target.value;
        update();
      },
    }, [
      option('all', 'Alle faser', state.phase),
      ...roadmap.phases.map((phase) => option(phase.id, `${phase.kicker}: ${phase.period}`, state.phase)),
    ]);

    const viewButton = el('button', {
      class: `toggle-control ${state.view === 'compact' ? 'is-on' : ''}`,
      type: 'button',
      'aria-pressed': state.view === 'compact' ? 'true' : 'false',
      onclick: () => {
        state.view = state.view === 'grouped' ? 'compact' : 'grouped';
        update();
      },
    }, [
      el('span', { class: 'toggle-switch', 'aria-hidden': 'true' }, [el('span', {}, [])]),
      el('span', {}, ['Kompakt visning']),
    ]);

    const resetButton = el('button', {
      class: 'mini-button ghost reset-button',
      type: 'button',
      onclick: () => {
        state.search = '';
        state.status = 'all';
        state.tag = 'all';
        state.phase = 'all';
        update();
      },
    }, [el('span', { 'aria-hidden': 'true' }, ['↻']), el('span', {}, ['Nullstill filter'])]);

    return el('section', { class: 'roadmap-controls', role: 'search', 'aria-label': 'Filtrer roadmap' }, [
      el('div', { class: 'search-control' }, [
        el('span', { class: 'search-icon', 'aria-hidden': 'true' }, ['⌕']),
        search,
      ]),
      el('div', { class: 'control-grid' }, [
        selectControl({ icon: '☷', label: 'Statusfilter', select: statusSelect }),
        selectControl({ icon: '◇', label: 'Temafilter', select: tagSelect }),
        selectControl({ icon: '▱', label: 'Fasefilter', select: phaseSelect }),
        viewButton,
        resetButton,
      ]),
    ]);
  }

  function renderItem(item) {
    const done = state.completed.has(item.id);
    const checkbox = el('input', {
      type: 'checkbox',
      checked: done,
      'aria-label': `Marker ${item.title} som ferdig`,
      onchange: (event) => {
        if (event.target.checked) state.completed.add(item.id);
        else state.completed.delete(item.id);
        writeCompleted(state.completed);
        update();
      },
    });

    const deliverables = (item.deliverables || []).map((deliverable) => el('li', {}, [deliverable]));

    return el('article', { class: `dynamic-item ${done ? 'is-done' : ''}` }, [
      el('div', { class: 'dynamic-item-top' }, [
        el('label', { class: 'done-check' }, [checkbox, el('span', {}, ['Ferdig'])]),
        el('span', { class: `status-chip ${statusClass(item.status)}` }, [item.status || 'Planlagt']),
        el('span', { class: 'pill' }, [item.tag || 'Uten tema']),
      ]),
      el('div', { class: 'dynamic-item-head' }, [
        el('div', {}, [
          el('div', { class: 'date' }, [item.date]),
          el('h4', {}, [item.title]),
        ]),
        el('div', { class: 'owner-box' }, [
          el('span', {}, ['Eier']),
          el('strong', {}, [item.owner || 'Ikke satt']),
        ]),
      ]),
      el('p', { class: 'dynamic-detail' }, [item.detail]),
      el('div', { class: 'dynamic-meta' }, [
        el('div', {}, [el('strong', {}, ['Leveranser']), el('ul', {}, deliverables)]),
        el('div', { class: 'success' }, [el('strong', {}, ['Suksesskriterium: ']), item.success]),
      ]),
    ]);
  }

  function renderPhase(phase, filteredItems) {
    const phaseItems = filteredItems.filter((item) => item.phaseId === phase.id);
    if (!phaseItems.length) return null;

    const completedInPhase = phase.items.filter((item, index) => state.completed.has(item.id || `${phase.id}-${index + 1}`)).length;
    const phaseProgress = Math.round((completedInPhase / phase.items.length) * 100);

    const phaseEl = el('article', { class: 'phase open', id: phase.id }, [
      el('div', { class: 'phase-dot' }),
      el('aside', { class: 'phase-meta' }, [
        el('div', { class: 'phase-kicker' }, [phase.kicker]),
        el('div', { class: 'phase-period' }, [phase.period]),
        el('div', { class: 'phase-progress-small' }, [`${phaseProgress}% lokalt`]),
      ]),
    ]);

    const card = el('div', { class: 'phase-card' });
    const button = el('button', { class: 'phase-button', 'aria-expanded': 'true', type: 'button' }, [
      el('div', {}, [el('h3', {}, [phase.title]), el('p', {}, [phase.summary])]),
      el('div', { class: 'chev' }, ['⌄']),
    ]);
    const panel = el('div', { class: 'phase-panel' }, [
      el('div', { class: 'phase-outcome' }, [el('strong', {}, ['Målbilde: ']), phase.outcome]),
      el('div', { class: 'dynamic-list' }, phaseItems.map(renderItem)),
    ]);

    button.addEventListener('click', () => {
      const isOpen = phaseEl.classList.toggle('open');
      button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    card.appendChild(button);
    card.appendChild(panel);
    phaseEl.appendChild(card);
    return phaseEl;
  }

  function renderCompact(filteredItems) {
    return el('section', { class: 'compact-roadmap' }, [
      el('div', { class: 'compact-line' }),
      ...filteredItems.map((item) => el('div', { class: `compact-node ${statusClass(item.status)} ${state.completed.has(item.id) ? 'done-local' : ''}` }, [
        el('span', { class: 'compact-dot' }),
        el('div', { class: 'compact-card' }, [
          el('div', { class: 'compact-meta' }, [`${item.phaseKicker} • ${item.date} • ${item.status}`]),
          el('h4', {}, [item.title]),
          el('p', {}, [item.detail]),
        ]),
      ])),
    ]);
  }

  function update() {
    const filteredItems = applyFilters(allItems);
    container.innerHTML = '';
    container.appendChild(el('section', { class: 'roadmap-command-center' }, [
      renderDashboard(filteredItems),
      renderControls(),
    ]));

    if (!filteredItems.length) {
      container.appendChild(el('div', { class: 'info-card empty-state' }, [
        el('div', { class: 'tag' }, ['Ingen treff']),
        el('h3', {}, ['Fant ingen milepæler med valgt filter']),
        el('p', {}, ['Prøv å nullstille filteret eller søk på et annet begrep.']),
      ]));
      return;
    }

    if (state.view === 'compact') {
      container.appendChild(renderCompact(filteredItems));
      return;
    }

    roadmap.phases.forEach((phase) => {
      const phaseEl = renderPhase(phase, filteredItems);
      if (phaseEl) container.appendChild(phaseEl);
    });
  }

  update();
}

document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('js-loaded');
  renderRoadmap();
});
