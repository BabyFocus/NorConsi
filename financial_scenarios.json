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



function renderAlternatives() {
  const container = document.querySelector('[data-alternatives]');
  const alternatives = window.NC_ALTERNATIVES;
  if (!container || !Array.isArray(alternatives)) return;

  const state = {
    search: '',
    score: 'all',
    category: 'all',
    role: 'all',
    view: 'detailed',
    open: new Set(),
  };

  function applyFilters(items) {
    return items.filter((item) => {
      const haystack = normalize([
        item.number,
        item.title,
        item.score,
        item.scoreGroup,
        item.role,
        item.category,
        item.recommendation,
        item.description,
        item.bestFor,
        item.prerequisites,
        ...(item.advantages || []),
        ...(item.disadvantages || []),
        ...(item.risks || []),
      ].join(' '));
      const matchesSearch = !state.search || haystack.includes(normalize(state.search));
      const matchesScore = state.score === 'all' || item.scoreGroup === state.score;
      const matchesCategory = state.category === 'all' || item.category === state.category;
      const matchesRole = state.role === 'all' || item.role === state.role;
      return matchesSearch && matchesScore && matchesCategory && matchesRole;
    });
  }

  function renderAlternativeDashboard(filteredItems) {
    const recommended = alternatives.find((item) => item.recommended) || alternatives[0];
    const highScoreCount = alternatives.filter((item) => item.scoreGroup === 'Høy').length;

    function statCard({ variant = '', icon, label, value, subLabel }) {
      return el('article', { class: `roadmap-stat alternative-stat ${variant}`.trim() }, [
        el('span', { class: 'roadmap-stat-icon', 'aria-hidden': 'true' }, [icon]),
        el('div', { class: 'roadmap-stat-body' }, [
          el('span', { class: 'stat-label' }, [label]),
          el('div', { class: 'stat-value-row' }, [
            el('strong', {}, [String(value)]),
            subLabel ? el('small', {}, [subLabel]) : el('small', { class: 'is-empty' }, ['']),
          ]),
        ]),
      ]);
    }

    return el('section', { class: 'roadmap-dashboard alternatives-dashboard', 'aria-label': 'Alternativer statusoversikt' }, [
      statCard({
        variant: 'primary-stat decision-stat',
        icon: '★',
        label: 'Anbefalt modell',
        value: `Alt. ${recommended.number}`,
        subLabel: recommended.title,
      }),
      statCard({
        variant: 'milestone-stat',
        icon: '◇',
        label: 'Alternativer',
        value: alternatives.length,
        subLabel: `${filteredItems.length} vises`,
      }),
      statCard({
        variant: 'score-stat',
        icon: '↗',
        label: 'Høy vurdering',
        value: highScoreCount,
        subLabel: 'modell',
      }),
      statCard({
        variant: 'filtered-stat',
        icon: '⌕',
        label: 'Aktivt utvalg',
        value: filteredItems.length,
        subLabel: 'treff',
      }),
    ]);
  }

  function renderAlternativeControls() {
    const scores = getUnique(alternatives.map((item) => item.scoreGroup));
    const categories = getUnique(alternatives.map((item) => item.category));
    const roles = getUnique(alternatives.map((item) => item.role));

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
      placeholder: 'Søk i alternativer …',
      value: state.search,
      oninput: (event) => {
        state.search = event.target.value;
        update();
      },
    });

    const scoreSelect = el('select', {
      class: 'control-select',
      onchange: (event) => {
        state.score = event.target.value;
        update();
      },
    }, [option('all', 'Alle vurderinger', state.score), ...scores.map((score) => option(score, score, state.score))]);

    const categorySelect = el('select', {
      class: 'control-select',
      onchange: (event) => {
        state.category = event.target.value;
        update();
      },
    }, [option('all', 'Alle typer', state.category), ...categories.map((category) => option(category, category, state.category))]);

    const roleSelect = el('select', {
      class: 'control-select',
      onchange: (event) => {
        state.role = event.target.value;
        update();
      },
    }, [option('all', 'Alle roller', state.role), ...roles.map((role) => option(role, role, state.role))]);

    const viewButton = el('button', {
      class: `toggle-control ${state.view === 'compact' ? 'is-on' : ''}`,
      type: 'button',
      'aria-pressed': state.view === 'compact' ? 'true' : 'false',
      onclick: () => {
        state.view = state.view === 'detailed' ? 'compact' : 'detailed';
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
        state.score = 'all';
        state.category = 'all';
        state.role = 'all';
        update();
      },
    }, [el('span', { 'aria-hidden': 'true' }, ['↻']), el('span', {}, ['Nullstill filter'])]);

    return el('section', { class: 'roadmap-controls alternatives-controls', role: 'search', 'aria-label': 'Filtrer alternativer' }, [
      el('div', { class: 'search-control' }, [
        el('span', { class: 'search-icon', 'aria-hidden': 'true' }, ['⌕']),
        search,
      ]),
      el('div', { class: 'control-grid' }, [
        selectControl({ icon: '≋', label: 'Vurderingsfilter', select: scoreSelect }),
        selectControl({ icon: '◇', label: 'Typefilter', select: categorySelect }),
        selectControl({ icon: '▱', label: 'Rollefilter', select: roleSelect }),
        viewButton,
        resetButton,
      ]),
    ]);
  }

  function renderConclusion() {
    const recommended = alternatives.find((item) => item.recommended);
    return el('section', { class: 'alternatives-conclusion' }, [
      el('div', { class: 'tag' }, ['Kort konklusjon']),
      el('h2', {}, ['Alternativ 4 bør være hovedmodellen']),
      el('p', {}, ['CSNE + Automasjon gir best balanse mellom teknisk troverdighet, kommersiell tydelighet og strategisk gjennomføringskraft. Alternativ 5 kan brukes som akselerator, men erstatter ikke behovet for intern organisering.']),
      recommended ? el('a', {
        class: 'button primary',
        href: `#${recommended.id}`,
        onclick: (event) => {
          event.preventDefault();
          state.open.add(recommended.id);
          update();
          window.requestAnimationFrame(() => {
            const target = document.getElementById(recommended.id);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        },
      }, ['Gå til anbefalt modell']) : el('span', {}, []),
    ]);
  }

  function renderSummaryTable(items) {
    return el('section', { class: 'alternative-table-card' }, [
      el('div', { class: 'section-title compact-title' }, [
        el('h2', {}, ['Sammenligning']),
        el('p', {}, ['Tabellen oppdateres automatisk når du søker eller filtrerer.']),
      ]),
      el('div', { class: 'table-scroll' }, [
        el('table', { class: 'table alt-summary-table' }, [
          el('thead', {}, [el('tr', {}, [
            el('th', {}, ['Alternativ']),
            el('th', {}, ['Samlet vurdering']),
            el('th', {}, ['Rolle i anbefalt strategi']),
            el('th', {}, ['Type']),
          ])]),
          el('tbody', {}, items.map((item) => el('tr', { class: item.recommended ? 'is-recommended-row' : '' }, [
            el('td', {}, [`${item.number}. ${item.title}`]),
            el('td', {}, [item.score]),
            el('td', {}, [item.role]),
            el('td', {}, [item.category]),
          ]))),
        ]),
      ]),
    ]);
  }

  function renderList(title, items, className) {
    return el('div', { class: className }, [
      el('h4', {}, [title]),
      el('ul', {}, (items || []).map((item) => el('li', {}, [item]))),
    ]);
  }

  function renderAlternativeCard(item) {
    const isOpen = state.open.has(item.id);
    const toggle = () => {
      if (state.open.has(item.id)) state.open.delete(item.id);
      else state.open.add(item.id);
      update();
      window.requestAnimationFrame(() => {
        const active = document.getElementById(item.id);
        if (active && isOpen === false) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    };

    return el('article', { class: `alternative-card alternative-accordion-card ${item.recommended ? 'recommended' : ''} ${isOpen ? 'is-open' : ''}`.trim(), id: item.id }, [
      el('button', {
        class: 'alternative-accordion-trigger',
        type: 'button',
        'aria-expanded': isOpen ? 'true' : 'false',
        'aria-controls': `${item.id}-panel`,
        onclick: toggle,
      }, [
        el('div', { class: 'alternative-accordion-number' }, [`${item.number}`]),
        el('div', { class: 'alternative-accordion-main' }, [
          el('div', { class: 'alternative-card-top' }, [
            el('span', { class: 'tag' }, [`Alternativ ${item.number}`]),
            el('span', { class: `score score-${safeId(item.scoreGroup)}` }, [`Samlet vurdering: ${item.score}`]),
            item.recommended ? el('span', { class: 'recommended-chip' }, ['Anbefalt']) : el('span', { class: 'pill' }, [item.category]),
          ]),
          el('h3', {}, [item.title]),
          el('p', { class: 'alternative-role' }, [item.role]),
        ]),
        el('div', { class: 'alternative-accordion-side' }, [
          el('span', {}, ['Vurdering']),
          el('strong', {}, [item.score]),
          el('em', {}, [isOpen ? 'Lukk' : 'Åpne']),
        ]),
        el('span', { class: 'accordion-chevron', 'aria-hidden': 'true' }, ['⌄']),
      ]),
      el('div', { class: 'alternative-accordion-panel', id: `${item.id}-panel`, 'aria-hidden': isOpen ? 'false' : 'true' }, [
        el('p', { class: 'alternative-recommendation' }, [el('strong', {}, ['Anbefaling: ']), item.recommendation]),
        el('p', { class: 'alternative-description' }, [item.description]),
        el('div', { class: 'alternative-columns' }, [
          renderList('Fordeler', item.advantages, 'alt-list positives'),
          renderList('Ulemper', item.disadvantages, 'alt-list negatives'),
        ]),
        renderList('Viktige risikoer', item.risks, 'alt-list risks'),
        el('div', { class: 'alternative-fit-grid' }, [
          el('div', {}, [el('strong', {}, ['Passer best når']), el('p', {}, [item.bestFor])]),
          el('div', {}, [el('strong', {}, ['Forutsetninger for å lykkes']), el('p', {}, [item.prerequisites])]),
        ]),
      ]),
    ]);
  }

  function renderCompactAlternatives(items) {
    return el('section', { class: 'alternative-compact-grid accordion-compact-grid' }, items.map((item) => {
      const isOpen = state.open.has(item.id);
      return el('article', { class: `alternative-compact-card compact-accordion-card ${item.recommended ? 'recommended' : ''} ${isOpen ? 'is-open' : ''}`.trim(), id: item.id }, [
        el('button', {
          class: 'compact-accordion-trigger',
          type: 'button',
          'aria-expanded': isOpen ? 'true' : 'false',
          onclick: () => {
            if (state.open.has(item.id)) state.open.delete(item.id);
            else state.open.add(item.id);
            update();
          },
        }, [
          el('div', { class: 'alternative-compact-number' }, [`${item.number}`]),
          el('div', {}, [
            el('span', { class: 'pill' }, [item.category]),
            el('h3', {}, [item.title]),
            el('div', { class: 'alternative-compact-meta' }, [
              el('strong', {}, [item.score]),
              el('span', {}, [item.role]),
            ]),
          ]),
          el('span', { class: 'accordion-chevron', 'aria-hidden': 'true' }, ['⌄']),
        ]),
        el('div', { class: 'compact-accordion-panel', 'aria-hidden': isOpen ? 'false' : 'true' }, [
          el('p', {}, [item.recommendation]),
          el('p', {}, [item.description]),
        ]),
      ]);
    }));
  }

  function update() {
    const filteredItems = applyFilters(alternatives);
    container.innerHTML = '';
    container.appendChild(el('section', { class: 'roadmap-command-center alternative-command' }, [
      renderAlternativeDashboard(filteredItems),
      renderAlternativeControls(),
    ]));
    container.appendChild(renderConclusion());

    if (!filteredItems.length) {
      container.appendChild(el('div', { class: 'info-card empty-state' }, [
        el('div', { class: 'tag' }, ['Ingen treff']),
        el('h3', {}, ['Fant ingen alternativer med valgt filter']),
        el('p', {}, ['Prøv å nullstille filteret eller søk på et annet begrep.']),
      ]));
      return;
    }

    container.appendChild(renderSummaryTable(filteredItems));

    if (state.view === 'compact') {
      container.appendChild(renderCompactAlternatives(filteredItems));
      return;
    }

    container.appendChild(el('section', { class: 'alternative-card-grid' }, filteredItems.map(renderAlternativeCard)));
  }

  update();
}



function renderServices() {
  const container = document.querySelector('[data-services]');
  const services = window.NC_SERVICES;
  if (!container || !Array.isArray(services)) return;

  const state = {
    search: '',
    category: 'all',
    level: 'all',
    view: 'detailed',
    open: new Set(),
  };

  function applyFilters(items) {
    return items.filter((item) => {
      const haystack = normalize([
        item.title,
        item.tag,
        item.category,
        item.level,
        item.summary,
        item.purpose,
        item.goodFor,
        ...(item.deliverables || []),
        ...(item.outputs || []),
        ...(item.includes || []),
      ].join(' '));
      const matchesSearch = !state.search || haystack.includes(normalize(state.search));
      const matchesCategory = state.category === 'all' || item.category === state.category;
      const matchesLevel = state.level === 'all' || item.level === state.level;
      return matchesSearch && matchesCategory && matchesLevel;
    });
  }

  function renderServicesDashboard(filteredItems) {
    const categories = getUnique(services.map((item) => item.category)).length;
    const outputs = services.reduce((total, item) => total + (item.outputs || []).length, 0);

    function statCard({ variant = '', icon, label, value, subLabel }) {
      return el('article', { class: `roadmap-stat service-stat ${variant}`.trim() }, [
        el('span', { class: 'roadmap-stat-icon', 'aria-hidden': 'true' }, [icon]),
        el('div', { class: 'roadmap-stat-body' }, [
          el('span', { class: 'stat-label' }, [label]),
          el('div', { class: 'stat-value-row' }, [
            el('strong', {}, [String(value)]),
            subLabel ? el('small', {}, [subLabel]) : el('small', { class: 'is-empty' }, ['']),
          ]),
        ]),
      ]);
    }

    return el('section', { class: 'roadmap-dashboard services-dashboard', 'aria-label': 'Tjenesteoversikt' }, [
      statCard({ variant: 'primary-stat service-main-stat', icon: '▦', label: 'Tjenester', value: services.length, subLabel: `${filteredItems.length} vises` }),
      statCard({ variant: 'service-category-stat', icon: '◇', label: 'Kategorier', value: categories, subLabel: 'fagområder' }),
      statCard({ variant: 'service-output-stat', icon: '✓', label: 'Leveranser', value: outputs, subLabel: 'eksempler' }),
      statCard({ variant: 'filtered-stat', icon: '⌕', label: 'Aktivt utvalg', value: filteredItems.length, subLabel: 'treff' }),
    ]);
  }

  function renderServiceControls() {
    const categories = getUnique(services.map((item) => item.category));
    const levels = getUnique(services.map((item) => item.level));

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
      placeholder: 'Søk i tjenester …',
      value: state.search,
      oninput: (event) => {
        state.search = event.target.value;
        update();
      },
    });

    const categorySelect = el('select', {
      class: 'control-select',
      onchange: (event) => {
        state.category = event.target.value;
        update();
      },
    }, [option('all', 'Alle kategorier', state.category), ...categories.map((category) => option(category, category, state.category))]);

    const levelSelect = el('select', {
      class: 'control-select',
      onchange: (event) => {
        state.level = event.target.value;
        update();
      },
    }, [option('all', 'Alle nivåer', state.level), ...levels.map((level) => option(level, level, state.level))]);

    const viewButton = el('button', {
      class: `toggle-control ${state.view === 'compact' ? 'is-on' : ''}`,
      type: 'button',
      'aria-pressed': state.view === 'compact' ? 'true' : 'false',
      onclick: () => {
        state.view = state.view === 'detailed' ? 'compact' : 'detailed';
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
        state.category = 'all';
        state.level = 'all';
        update();
      },
    }, [el('span', { 'aria-hidden': 'true' }, ['↻']), el('span', {}, ['Nullstill filter'])]);

    return el('section', { class: 'roadmap-controls services-controls', role: 'search', 'aria-label': 'Filtrer tjenester' }, [
      el('div', { class: 'search-control' }, [
        el('span', { class: 'search-icon', 'aria-hidden': 'true' }, ['⌕']),
        search,
      ]),
      el('div', { class: 'control-grid services-control-grid' }, [
        selectControl({ icon: '◇', label: 'Kategorifilter', select: categorySelect }),
        selectControl({ icon: '▱', label: 'Nivåfilter', select: levelSelect }),
        viewButton,
        resetButton,
      ]),
    ]);
  }

  function renderServiceList(title, items, className) {
    return el('div', { class: className }, [
      el('h4', {}, [title]),
      el('ul', {}, (items || []).map((item) => el('li', {}, [item]))),
    ]);
  }

  function renderServiceAccordion(item) {
    const isOpen = state.open.has(item.id);
    const toggle = () => {
      if (state.open.has(item.id)) state.open.delete(item.id);
      else state.open.add(item.id);
      update();
    };

    return el('article', { class: `service-accordion-card ${isOpen ? 'is-open' : ''}`, id: item.id }, [
      el('button', {
        class: 'service-accordion-trigger',
        type: 'button',
        'aria-expanded': isOpen ? 'true' : 'false',
        'aria-controls': `${item.id}-panel`,
        onclick: toggle,
      }, [
        el('div', { class: 'service-icon' }, [item.icon || '▦']),
        el('div', { class: 'service-heading' }, [
          el('div', { class: 'alternative-card-top' }, [
            el('span', { class: 'tag' }, [item.tag]),
            el('span', { class: 'pill' }, [item.category]),
            el('span', { class: 'pill' }, [item.level]),
          ]),
          el('h3', {}, [item.title]),
          el('p', {}, [item.summary]),
        ]),
        el('div', { class: 'service-side' }, [
          el('span', {}, ['Typisk leveranse']),
          el('strong', {}, [item.delivery || 'Rådgivning']),
          el('em', {}, [isOpen ? 'Lukk' : 'Åpne']),
        ]),
        el('span', { class: 'accordion-chevron', 'aria-hidden': 'true' }, ['⌄']),
      ]),
      el('div', { class: 'service-accordion-panel', id: `${item.id}-panel`, 'aria-hidden': isOpen ? 'false' : 'true' }, [
        el('p', { class: 'service-purpose' }, [item.purpose]),
        el('div', { class: 'service-detail-grid' }, [
          renderServiceList('Innhold i tjenesten', item.includes, 'alt-list positives'),
          renderServiceList('Typiske leveranser', item.outputs, 'alt-list'),
        ]),
        el('div', { class: 'alternative-fit-grid service-fit-grid' }, [
          el('div', {}, [el('strong', {}, ['Passer best når']), el('p', {}, [item.goodFor])]),
          el('div', {}, [el('strong', {}, ['Kundefordel']), el('p', {}, [item.value])]),
        ]),
      ]),
    ]);
  }

  function renderCompactServices(items) {
    return el('section', { class: 'services-accordion-list compact-service-list' }, items.map((item) => renderServiceAccordion(item)));
  }

  function update() {
    const filteredItems = applyFilters(services);
    container.innerHTML = '';
    container.appendChild(el('section', { class: 'roadmap-command-center services-command' }, [
      renderServicesDashboard(filteredItems),
      renderServiceControls(),
    ]));

    if (!filteredItems.length) {
      container.appendChild(el('div', { class: 'info-card empty-state' }, [
        el('div', { class: 'tag' }, ['Ingen treff']),
        el('h3', {}, ['Fant ingen tjenester med valgt filter']),
        el('p', {}, ['Prøv å nullstille filteret eller søk på et annet begrep.']),
      ]));
      return;
    }

    container.appendChild(el('section', { class: `services-accordion-list ${state.view === 'compact' ? 'is-compact' : ''}` }, filteredItems.map(renderServiceAccordion)));
  }

  update();
}



function renderMandate() {
  const container = document.querySelector('[data-mandate]');
  const mandate = window.NC_MANDATE;
  if (!container || !mandate || !Array.isArray(mandate.sections)) return;

  const state = {
    search: '',
    category: 'all',
    status: 'all',
    view: 'detailed',
    open: new Set(),
  };

  function applyFilters(items) {
    return items.filter((item) => {
      const haystack = normalize([
        item.tag,
        item.category,
        item.status,
        item.title,
        item.summary,
        item.purpose,
        item.decision,
        ...(item.includes || []),
        ...(item.outputs || []),
      ].join(' '));
      const matchesSearch = !state.search || haystack.includes(normalize(state.search));
      const matchesCategory = state.category === 'all' || item.category === state.category;
      const matchesStatus = state.status === 'all' || item.status === state.status;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }

  function renderMandateDashboard(filteredItems) {
    const categories = getUnique(mandate.sections.map((item) => item.category)).length;
    function statCard({ variant = '', icon, label, value, subLabel }) {
      return el('article', { class: `roadmap-stat mandate-stat ${variant}`.trim() }, [
        el('span', { class: 'roadmap-stat-icon', 'aria-hidden': 'true' }, [icon]),
        el('div', { class: 'roadmap-stat-body' }, [
          el('span', { class: 'stat-label' }, [label]),
          el('div', { class: 'stat-value-row' }, [
            el('strong', {}, [String(value)]),
            subLabel ? el('small', {}, [subLabel]) : el('small', { class: 'is-empty' }, ['']),
          ]),
        ]),
      ]);
    }

    return el('section', { class: 'roadmap-dashboard mandate-dashboard', 'aria-label': 'Mandatoversikt' }, [
      statCard({ variant: 'primary-stat mandate-period-stat', icon: '↗', label: 'Mandatperiode', value: mandate.summary.period, subLabel: 'oppstart' }),
      statCard({ variant: 'mandate-phase-stat', icon: '▦', label: 'Faser', value: mandate.summary.phases, subLabel: 'modenhetsporter' }),
      statCard({ variant: 'mandate-requirement-stat', icon: '✓', label: 'Mandatkrav', value: mandate.summary.requirements, subLabel: `${filteredItems.length} vises` }),
      statCard({ variant: 'filtered-stat', icon: '⌕', label: 'Rapportering', value: mandate.summary.governance, subLabel: `${categories} områder` }),
    ]);
  }

  function renderMandateControls() {
    const categories = getUnique(mandate.sections.map((item) => item.category));
    const statuses = getUnique(mandate.sections.map((item) => item.status));

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
      placeholder: 'Søk i mandat …',
      value: state.search,
      oninput: (event) => {
        state.search = event.target.value;
        update();
      },
    });

    const categorySelect = el('select', {
      class: 'control-select',
      onchange: (event) => {
        state.category = event.target.value;
        update();
      },
    }, [option('all', 'Alle områder', state.category), ...categories.map((category) => option(category, category, state.category))]);

    const statusSelect = el('select', {
      class: 'control-select',
      onchange: (event) => {
        state.status = event.target.value;
        update();
      },
    }, [option('all', 'Alle statuser', state.status), ...statuses.map((status) => option(status, status, state.status))]);

    const viewButton = el('button', {
      class: `toggle-control ${state.view === 'compact' ? 'is-on' : ''}`,
      type: 'button',
      'aria-pressed': state.view === 'compact' ? 'true' : 'false',
      onclick: () => {
        state.view = state.view === 'detailed' ? 'compact' : 'detailed';
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
        state.category = 'all';
        state.status = 'all';
        update();
      },
    }, [el('span', { 'aria-hidden': 'true' }, ['↻']), el('span', {}, ['Nullstill filter'])]);

    return el('section', { class: 'roadmap-controls mandate-controls', role: 'search', 'aria-label': 'Filtrer mandat' }, [
      el('div', { class: 'search-control' }, [
        el('span', { class: 'search-icon', 'aria-hidden': 'true' }, ['⌕']),
        search,
      ]),
      el('div', { class: 'control-grid mandate-control-grid' }, [
        selectControl({ icon: '◇', label: 'Områdefilter', select: categorySelect }),
        selectControl({ icon: '▱', label: 'Statusfilter', select: statusSelect }),
        viewButton,
        resetButton,
      ]),
    ]);
  }

  function renderMandateIntro() {
    return el('section', { class: 'alternatives-conclusion mandate-intro' }, [
      el('div', { class: 'tag' }, ['Kort anbefaling']),
      el('h2', {}, ['Etabler mandatet som en styrt investering']),
      el('p', {}, ['Mandatet bør gi lavere profittkrav i oppstartsfasen, men samtidig stille tydelige krav til pipeline, pilotleveranser, metodeverk, bemanning, rapportering og beslutningsporter. Det viktigste er å skape nok organisatorisk kraft til at satsningen faktisk blir mer enn koordinering.']),
    ]);
  }

  function renderMandateList(title, items, className) {
    return el('div', { class: className }, [
      el('h4', {}, [title]),
      el('ul', {}, (items || []).map((item) => el('li', {}, [item]))),
    ]);
  }

  function renderMandateAccordion(item) {
    const isOpen = state.open.has(item.id);
    const toggle = () => {
      if (state.open.has(item.id)) state.open.delete(item.id);
      else state.open.add(item.id);
      update();
    };

    return el('article', { class: `service-accordion-card mandate-accordion-card ${isOpen ? 'is-open' : ''}`, id: item.id }, [
      el('button', {
        class: 'service-accordion-trigger mandate-accordion-trigger',
        type: 'button',
        'aria-expanded': isOpen ? 'true' : 'false',
        'aria-controls': `${item.id}-panel`,
        onclick: toggle,
      }, [
        el('div', { class: 'service-icon mandate-icon' }, [item.icon || '▦']),
        el('div', { class: 'service-heading mandate-heading' }, [
          el('div', { class: 'alternative-card-top' }, [
            el('span', { class: 'tag' }, [item.tag]),
            el('span', { class: 'pill' }, [item.category]),
            el('span', { class: 'pill' }, [item.status]),
          ]),
          el('h3', {}, [item.title]),
          el('p', {}, [item.summary]),
        ]),
        el('div', { class: 'service-side mandate-side' }, [
          el('span', {}, ['Status']),
          el('strong', {}, [item.status]),
          el('em', {}, [isOpen ? 'Lukk' : 'Åpne']),
        ]),
        el('span', { class: 'accordion-chevron', 'aria-hidden': 'true' }, ['⌄']),
      ]),
      el('div', { class: 'service-accordion-panel mandate-accordion-panel', id: `${item.id}-panel`, 'aria-hidden': isOpen ? 'false' : 'true' }, [
        el('p', { class: 'service-purpose mandate-purpose' }, [item.purpose]),
        el('div', { class: 'service-detail-grid mandate-detail-grid' }, [
          renderMandateList('Dette bør mandatet dekke', item.includes, 'alt-list positives'),
          renderMandateList('Konkrete leveranser', item.outputs, 'alt-list'),
        ]),
        el('div', { class: 'mandate-decision' }, [
          el('strong', {}, ['Anbefalt beslutning']),
          el('p', {}, [item.decision]),
        ]),
      ]),
    ]);
  }

  function update() {
    const filteredItems = applyFilters(mandate.sections);
    container.innerHTML = '';
    container.appendChild(el('section', { class: 'roadmap-command-center mandate-command' }, [
      renderMandateDashboard(filteredItems),
      renderMandateControls(),
    ]));
    container.appendChild(renderMandateIntro());

    if (!filteredItems.length) {
      container.appendChild(el('div', { class: 'info-card empty-state' }, [
        el('div', { class: 'tag' }, ['Ingen treff']),
        el('h3', {}, ['Fant ingen mandatpunkter med valgt filter']),
        el('p', {}, ['Prøv å nullstille filteret eller søk på et annet begrep.']),
      ]));
      return;
    }

    container.appendChild(el('section', { class: `services-accordion-list mandate-accordion-list ${state.view === 'compact' ? 'is-compact' : ''}` }, filteredItems.map(renderMandateAccordion)));
  }

  update();
}

function renderBusinessCase() {
  const container = document.querySelector('[data-business-case]');
  const business = window.NC_BUSINESS_CASE;
  if (!container || !business || !Array.isArray(business.sections)) return;

  const state = {
    search: '',
    category: 'all',
    status: 'all',
    view: 'detailed',
    open: new Set(),
  };

  function applyFilters(items) {
    return items.filter((item) => {
      const haystack = normalize([
        item.tag,
        item.category,
        item.status,
        item.title,
        item.summary,
        item.purpose,
        item.decision,
        ...(item.includes || []),
        ...(item.outputs || []),
      ].join(' '));
      const matchesSearch = !state.search || haystack.includes(normalize(state.search));
      const matchesCategory = state.category === 'all' || item.category === state.category;
      const matchesStatus = state.status === 'all' || item.status === state.status;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }

  function renderBusinessDashboard(filteredItems) {
    function statCard({ variant = '', icon, label, value, subLabel }) {
      return el('article', { class: `roadmap-stat business-stat ${variant}`.trim() }, [
        el('span', { class: 'roadmap-stat-icon', 'aria-hidden': 'true' }, [icon]),
        el('div', { class: 'roadmap-stat-body' }, [
          el('span', { class: 'stat-label' }, [label]),
          el('div', { class: 'stat-value-row' }, [
            el('strong', {}, [String(value)]),
            subLabel ? el('small', {}, [subLabel]) : el('small', { class: 'is-empty' }, ['']),
          ]),
        ]),
      ]);
    }

    return el('section', { class: 'roadmap-dashboard business-dashboard', 'aria-label': 'Business case oversikt' }, [
      statCard({ variant: 'primary-stat business-revenue-stat', icon: '↗', label: 'Omsetning år 5', value: business.summary.yearFiveRevenue, subLabel: 'basis' }),
      statCard({ variant: 'business-result-stat', icon: 'Σ', label: 'Akkumulert resultat', value: business.summary.accumulatedResult, subLabel: '5 år basis' }),
      statCard({ variant: 'business-break-even-stat', icon: '✓', label: 'Break-even', value: business.summary.breakEven, subLabel: 'første positive år' }),
      statCard({ variant: 'filtered-stat', icon: '⌕', label: 'Margin år 5', value: business.summary.yearFiveMargin, subLabel: `${filteredItems.length} seksjoner` }),
    ]);
  }

  function renderBusinessControls() {
    const categories = getUnique(business.sections.map((item) => item.category));
    const statuses = getUnique(business.sections.map((item) => item.status));

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
      placeholder: 'Søk i business case …',
      value: state.search,
      oninput: (event) => {
        state.search = event.target.value;
        update();
      },
    });

    const categorySelect = el('select', {
      class: 'control-select',
      onchange: (event) => {
        state.category = event.target.value;
        update();
      },
    }, [option('all', 'Alle kategorier', state.category), ...categories.map((category) => option(category, category, state.category))]);

    const statusSelect = el('select', {
      class: 'control-select',
      onchange: (event) => {
        state.status = event.target.value;
        update();
      },
    }, [option('all', 'Alle statuser', state.status), ...statuses.map((status) => option(status, status, state.status))]);

    const viewButton = el('button', {
      class: `toggle-control ${state.view === 'compact' ? 'is-on' : ''}`,
      type: 'button',
      'aria-pressed': state.view === 'compact' ? 'true' : 'false',
      onclick: () => {
        state.view = state.view === 'detailed' ? 'compact' : 'detailed';
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
        state.category = 'all';
        state.status = 'all';
        update();
      },
    }, [el('span', { 'aria-hidden': 'true' }, ['↻']), el('span', {}, ['Nullstill filter'])]);

    return el('section', { class: 'roadmap-controls business-controls', role: 'search', 'aria-label': 'Filtrer business case' }, [
      el('div', { class: 'search-control' }, [
        el('span', { class: 'search-icon', 'aria-hidden': 'true' }, ['⌕']),
        search,
      ]),
      el('div', { class: 'control-grid business-control-grid' }, [
        selectControl({ icon: '◇', label: 'Kategorifilter', select: categorySelect }),
        selectControl({ icon: '▱', label: 'Statusfilter', select: statusSelect }),
        viewButton,
        resetButton,
      ]),
    ]);
  }

  function renderBusinessIntro() {
    return el('section', { class: 'alternatives-conclusion business-intro' }, [
      el('div', { class: 'tag' }, ['Kort konklusjon']),
      el('h2', {}, ['Caset forsvarer et styrt oppstartsmandat']),
      el('p', {}, ['Basis-scenarioet viser negativt resultat i etableringsåret, men positiv utvikling fra år 2 dersom satsningen får tydelig mandat, riktig bemanning og repeterbare leveransepakker. Den største risikoen er ikke bare markedsrisiko, men at organiseringen blir for svak til å realisere potensialet.']),
    ]);
  }

  function renderBusinessList(title, items, className) {
    return el('div', { class: className }, [
      el('h4', {}, [title]),
      el('ul', {}, (items || []).map((item) => el('li', {}, [item]))),
    ]);
  }

  function renderFinancialModel() {
    return el('div', { class: 'business-financial-block' }, [
      el('div', { class: 'table-scroll' }, [
        el('table', { class: 'table business-financial-table' }, [
          el('thead', {}, [el('tr', {}, [
            el('th', {}, ['År']),
            el('th', {}, ['Ansatte']),
            el('th', {}, ['Omsetning']),
            el('th', {}, ['Kostnad']),
            el('th', {}, ['Resultat']),
            el('th', {}, ['Margin']),
          ])]),
          el('tbody', {}, (business.financialRows || []).map((row) => el('tr', {}, [
            el('td', {}, [row.year]),
            el('td', {}, [row.employees]),
            el('td', {}, [row.revenue]),
            el('td', {}, [row.cost]),
            el('td', {}, [row.result]),
            el('td', {}, [row.margin]),
          ]))),
        ]),
      ]),
    ]);
  }

  function renderScenarioCards() {
    return el('div', { class: 'business-scenario-grid' }, (business.scenarios || []).map((scenario) => el('article', { class: 'business-scenario-card' }, [
      el('span', { class: 'tag' }, [scenario.name]),
      el('strong', {}, [scenario.value]),
      el('p', {}, [scenario.description]),
    ])));
  }

  function renderSpecialBlock(item) {
    if (item.kind === 'financial-model') return renderFinancialModel();
    if (item.kind === 'scenarios') return renderScenarioCards();
    return el('span', {}, []);
  }

  function renderBusinessAccordion(item) {
    const isOpen = state.open.has(item.id);
    const toggle = () => {
      if (state.open.has(item.id)) state.open.delete(item.id);
      else state.open.add(item.id);
      update();
    };

    return el('article', { class: `service-accordion-card business-accordion-card ${isOpen ? 'is-open' : ''}`, id: item.id }, [
      el('button', {
        class: 'service-accordion-trigger business-accordion-trigger',
        type: 'button',
        'aria-expanded': isOpen ? 'true' : 'false',
        'aria-controls': `${item.id}-panel`,
        onclick: toggle,
      }, [
        el('div', { class: 'service-icon business-icon' }, [item.icon || '▦']),
        el('div', { class: 'service-heading business-heading' }, [
          el('div', { class: 'alternative-card-top' }, [
            el('span', { class: 'tag' }, [item.tag]),
            el('span', { class: 'pill' }, [item.category]),
            el('span', { class: 'pill' }, [item.status]),
          ]),
          el('h3', {}, [item.title]),
          el('p', {}, [item.summary]),
        ]),
        el('div', { class: 'service-side business-side' }, [
          el('span', {}, ['Status']),
          el('strong', {}, [item.status]),
          el('em', {}, [isOpen ? 'Lukk' : 'Åpne']),
        ]),
        el('span', { class: 'accordion-chevron', 'aria-hidden': 'true' }, ['⌄']),
      ]),
      el('div', { class: 'service-accordion-panel business-accordion-panel', id: `${item.id}-panel`, 'aria-hidden': isOpen ? 'false' : 'true' }, [
        el('p', { class: 'service-purpose business-purpose' }, [item.purpose]),
        renderSpecialBlock(item),
        el('div', { class: 'service-detail-grid business-detail-grid' }, [
          renderBusinessList('Hovedpunkter', item.includes, 'alt-list positives'),
          renderBusinessList('Leveranser eller beslutningsunderlag', item.outputs, 'alt-list'),
        ]),
        el('div', { class: 'mandate-decision business-decision' }, [
          el('strong', {}, ['Anbefalt beslutning']),
          el('p', {}, [item.decision]),
        ]),
      ]),
    ]);
  }

  function update() {
    const filteredItems = applyFilters(business.sections);
    container.innerHTML = '';
    container.appendChild(el('section', { class: 'roadmap-command-center business-command' }, [
      renderBusinessDashboard(filteredItems),
      renderBusinessControls(),
    ]));
    container.appendChild(renderBusinessIntro());

    if (!filteredItems.length) {
      container.appendChild(el('div', { class: 'info-card empty-state' }, [
        el('div', { class: 'tag' }, ['Ingen treff']),
        el('h3', {}, ['Fant ingen business case-punkter med valgt filter']),
        el('p', {}, ['Prøv å nullstille filteret eller søk på et annet begrep.']),
      ]));
      return;
    }

    container.appendChild(el('section', { class: `services-accordion-list business-accordion-list ${state.view === 'compact' ? 'is-compact' : ''}` }, filteredItems.map(renderBusinessAccordion)));
  }

  update();
}


document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('js-loaded');
  renderRoadmap();
  renderAlternatives();
  renderServices();
  renderMandate();
  renderBusinessCase();
});
