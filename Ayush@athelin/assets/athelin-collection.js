/**
 * Athelin Collection Page Interactive Engine
 * Handles full-collection client-side faceting, background multi-page hydration,
 * price slider, active filter pills, client-side pagination, mobile bottom sheet,
 * Shoe Finder quiz, and Watch Finder advisor.
 */
document.addEventListener('DOMContentLoaded', () => {
  function getActiveGrid() {
    const grids = Array.from(document.querySelectorAll('[data-collection-grid]'));
    return grids.find(g => g.offsetParent !== null) || grids[0] || null;
  }

  const collectionGrid = getActiveGrid();
  if (!collectionGrid) return;

  const PAGE_SIZE = parseInt(collectionGrid.dataset.pageSize || '48', 10) || 48;
  const paginationNav = document.querySelector('[data-client-pagination]');
  const filterEmptyNotice = collectionGrid.querySelector('[data-filter-empty]');
  const promoCard = collectionGrid.querySelector('.shoe-finder-card, .watch-finder-card');

  // Master array of all product cards in the collection
  let allCollectionCards = Array.from(collectionGrid.querySelectorAll('[data-product-card]'));
  allCollectionCards.forEach((card, idx) => {
    card.dataset.initialOrder = String(idx);
  });

  function getProductCards() {
    return allCollectionCards;
  }

  const activePillsContainer = document.querySelector('[data-active-pills]');
  const filterCountBadges = document.querySelectorAll('[data-filter-count]');
  const mobileApplyBtn = document.querySelector('.collection-sidebar__drawer-apply');
  const sortSelect = document.querySelector('[data-collection-sort]');

  // Determine collection price bounds (Always starts from ₹0 as requested)
  let minCollectionPrice = 0;
  let maxCollectionPrice = 300000;
  function recalculatePriceBounds(preserveUserSelection = false) {
    const cards = getProductCards();
    if (cards.length > 0) {
      const prices = cards
        .map(c => parseInt(c.dataset.price || '0', 10) / 100)
        .filter(p => p > 0);
      if (prices.length > 0) {
        minCollectionPrice = 0;
        const maxFound = Math.max(...prices);
        maxCollectionPrice = Math.max(Math.ceil(maxFound / 10000) * 10000, 30000);
      }
    }
    if (preserveUserSelection && state) {
      const wasAtMax = state.maxPrice >= state.initialMaxPrice;
      state.initialMaxPrice = maxCollectionPrice;
      if (wasAtMax) {
        state.maxPrice = maxCollectionPrice;
      }
    }
  }
  recalculatePriceBounds(false);

  // Filter State (Empty by default so all products are visible)
  const state = {
    surface: [],
    cushioning: [],
    size: [],
    drop: [],
    width: [],
    series: [],
    display: [],
    watchSize: [],
    activity: [],
    brand: [],
    availableOnly: false,
    minPrice: minCollectionPrice,
    maxPrice: maxCollectionPrice,
    initialMinPrice: minCollectionPrice,
    initialMaxPrice: maxCollectionPrice,
    sortBy: 'manual',
    currentPage: 1
  };

  /* ------------------------------------------------------------------------
     0. BACKGROUND HYDRATION FOR LARGE COLLECTIONS (>250 PRODUCTS)
     ------------------------------------------------------------------------ */
  async function hydrateRemainingCollectionPages() {
    const totalPages = parseInt(collectionGrid.dataset.totalPages || '1', 10);
    if (totalPages <= 1) return;

    const seenIds = new Set(
      allCollectionCards.map(c => c.dataset.productId || c.dataset.productHandle).filter(Boolean)
    );
    const baseUrl = collectionGrid.dataset.fetchBaseUrl || window.location.pathname;

    try {
      const pageNumbers = [];
      for (let p = 2; p <= totalPages; p++) {
        pageNumbers.push(p);
      }

      const responses = await Promise.all(
        pageNumbers.map(pageNum => {
          const url = new URL(baseUrl, window.location.origin);
          url.searchParams.set('page', String(pageNum));
          return fetch(url.toString(), { credentials: 'same-origin' })
            .then(r => (r.ok ? r.text() : ''))
            .catch(() => '');
        })
      );

      const parser = new DOMParser();
      let addedAny = false;

      responses.forEach(html => {
        if (!html) return;
        const doc = parser.parseFromString(html, 'text/html');
        const fetchedCards = Array.from(doc.querySelectorAll('[data-collection-grid] [data-product-card]'));
        fetchedCards.forEach(card => {
          const key = card.dataset.productId || card.dataset.productHandle;
          if (key && seenIds.has(key)) return;
          if (key) seenIds.add(key);

          card.dataset.initialOrder = String(allCollectionCards.length);
          card.style.display = 'none';
          if (filterEmptyNotice) {
            collectionGrid.insertBefore(card, filterEmptyNotice);
          } else {
            collectionGrid.appendChild(card);
          }
          allCollectionCards.push(card);
          addedAny = true;
        });
      });

      if (addedAny) {
        recalculatePriceBounds(true);
        syncSidebarInputs();
        updateCollection(false);
      }
    } catch (err) {
      // Fail gracefully if offline
    }
  }

  /* ------------------------------------------------------------------------
     1. FORMAT CURRENCY (INR)
     ------------------------------------------------------------------------ */
  function formatINR(val) {
    return '₹' + Number(val).toLocaleString('en-IN');
  }

  function hasActiveFilters() {
    return (
      state.surface.length > 0 ||
      state.cushioning.length > 0 ||
      state.size.length > 0 ||
      state.drop.length > 0 ||
      state.width.length > 0 ||
      state.series.length > 0 ||
      state.display.length > 0 ||
      state.watchSize.length > 0 ||
      state.activity.length > 0 ||
      state.brand.length > 0 ||
      state.availableOnly ||
      state.minPrice > state.initialMinPrice ||
      state.maxPrice < state.initialMaxPrice
    );
  }

  /* ------------------------------------------------------------------------
     2. APPLY FILTERS, SORT & CLIENT-SIDE PAGINATION ACROSS FULL COLLECTION
     ------------------------------------------------------------------------ */
  function updateCollection(resetPage = true) {
    if (resetPage) {
      state.currentPage = 1;
    }

    const currentCards = getProductCards();
    const matchingCards = [];

    currentCards.forEach(card => {
      const cardBrand = (card.dataset.brand || '').toLowerCase();
      const cardSurface = (card.dataset.surface || '').toLowerCase();
      const cardCushioning = (card.dataset.cushioning || '').toLowerCase();
      const cardSizes = (card.dataset.size || '')
        .toString()
        .toLowerCase()
        .split(/[\s,]+/)
        .filter(Boolean);
      const cardDrop = (card.dataset.drop || '').toLowerCase();
      const cardWidth = (card.dataset.width || '').toLowerCase();
      const cardPrice = parseInt(card.dataset.price || '0', 10) / 100; // in Rupees
      const cardAvailable = card.dataset.available === 'true';

      const cardSeries = (card.dataset.series || '').toLowerCase();
      const cardDisplay = (card.dataset.display || '').toLowerCase();
      const cardWatchSize = (card.dataset.watchSize || '').toLowerCase();
      const cardActivity = (card.dataset.activity || '').toLowerCase();

      let matches = true;

      // Surface (Shoes)
      if (state.surface.length > 0 && !state.surface.some(s => cardSurface.includes(s))) {
        matches = false;
      }

      // Cushioning (Shoes)
      if (matches && state.cushioning.length > 0 && !state.cushioning.some(c => cardCushioning.includes(c))) {
        matches = false;
      }

      // Size (Shoes - match against any available variant size on the product)
      if (matches && state.size.length > 0 && !state.size.some(sz => cardSizes.includes(sz.toLowerCase()))) {
        matches = false;
      }

      // Heel-to-Toe Drop (Shoes)
      if (matches && state.drop.length > 0 && !state.drop.some(d => cardDrop.includes(d))) {
        matches = false;
      }

      // Width (Shoes)
      if (matches && state.width.length > 0 && !state.width.some(w => cardWidth.includes(w))) {
        matches = false;
      }

      // Watch Series
      if (matches && state.series.length > 0 && !state.series.some(s => cardSeries.includes(s))) {
        matches = false;
      }

      // Watch Display (AMOLED / Solar)
      if (matches && state.display.length > 0 && !state.display.some(d => cardDisplay.includes(d))) {
        matches = false;
      }

      // Watch Case Size (41-43, 45-47, 50-51)
      if (matches && state.watchSize.length > 0 && !state.watchSize.includes(cardWatchSize)) {
        matches = false;
      }

      // Watch Sport & Activity Focus
      if (matches && state.activity.length > 0 && !state.activity.some(a => cardActivity.includes(a))) {
        matches = false;
      }

      // Brand
      if (matches && state.brand.length > 0 && !state.brand.some(b => cardBrand.includes(b))) {
        matches = false;
      }

      // Price range
      if (matches && cardPrice > 0 && (cardPrice < state.minPrice || cardPrice > state.maxPrice)) {
        matches = false;
      }

      // Availability
      if (matches && state.availableOnly && !cardAvailable) {
        matches = false;
      }

      if (matches) {
        matchingCards.push(card);
      } else {
        card.style.display = 'none';
      }
    });

    // Sort all matching cards across the entire collection
    if (state.sortBy === 'price-ascending') {
      matchingCards.sort((a, b) => parseInt(a.dataset.price || '0', 10) - parseInt(b.dataset.price || '0', 10));
    } else if (state.sortBy === 'price-descending') {
      matchingCards.sort((a, b) => parseInt(b.dataset.price || '0', 10) - parseInt(a.dataset.price || '0', 10));
    } else if (state.sortBy === 'created-descending') {
      matchingCards.sort((a, b) => parseInt(b.dataset.created || '0', 10) - parseInt(a.dataset.created || '0', 10));
    } else {
      matchingCards.sort((a, b) => parseInt(a.dataset.initialOrder || '0', 10) - parseInt(b.dataset.initialOrder || '0', 10));
    }

    // Reorder matching cards in the DOM so sorted order applies across pages
    matchingCards.forEach((card, idx) => {
      if (filterEmptyNotice) {
        collectionGrid.insertBefore(card, filterEmptyNotice);
      } else {
        collectionGrid.appendChild(card);
      }
      // Keep promo advisor card after the 4th card on page 1
      if (promoCard && idx === 3) {
        if (filterEmptyNotice) {
          collectionGrid.insertBefore(promoCard, filterEmptyNotice);
        } else {
          collectionGrid.appendChild(promoCard);
        }
      }
    });

    // Paginate matching cards client-side
    const totalMatching = matchingCards.length;
    const totalPages = Math.max(1, Math.ceil(totalMatching / PAGE_SIZE));
    if (state.currentPage > totalPages) {
      state.currentPage = totalPages;
    }

    const startIdx = (state.currentPage - 1) * PAGE_SIZE;
    const endIdx = startIdx + PAGE_SIZE;

    matchingCards.forEach((card, idx) => {
      card.style.display = idx >= startIdx && idx < endIdx ? '' : 'none';
    });

    if (promoCard) {
      promoCard.style.display = state.currentPage === 1 && totalMatching >= 4 && !hasActiveFilters() ? '' : 'none';
    }

    if (filterEmptyNotice) {
      filterEmptyNotice.style.display = totalMatching === 0 && currentCards.length > 0 ? '' : 'none';
    }

    // Update Pills, Counters & Client Pagination
    renderActivePills();
    updateCounterBadges(totalMatching);
    renderClientPagination(totalMatching, totalPages);
  }

  function renderClientPagination(totalMatching, totalPages) {
    if (!paginationNav) return;
    if (totalPages <= 1) {
      paginationNav.style.display = 'none';
      paginationNav.innerHTML = '';
      return;
    }

    paginationNav.style.display = 'flex';
    paginationNav.innerHTML = '';

    const createPageBtn = (label, targetPage, className, isCurrent = false) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = className + (isCurrent ? ' current' : '');
      btn.textContent = label;
      btn.style.background = isCurrent ? '#000000' : '#ffffff';
      btn.style.cursor = 'pointer';
      if (isCurrent) {
        btn.setAttribute('aria-current', 'page');
      }
      btn.addEventListener('click', () => {
        if (targetPage === state.currentPage) return;
        state.currentPage = targetPage;
        updateCollection(false);
        collectionGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return btn;
    };

    if (state.currentPage > 1) {
      paginationNav.appendChild(createPageBtn('← Previous', state.currentPage - 1, 'prev'));
    }

    for (let p = 1; p <= totalPages; p++) {
      paginationNav.appendChild(createPageBtn(String(p), p, 'page', p === state.currentPage));
    }

    if (state.currentPage < totalPages) {
      paginationNav.appendChild(createPageBtn('Next →', state.currentPage + 1, 'next'));
    }
  }

  /* ------------------------------------------------------------------------
     3. RENDER ACTIVE PILLS
     ------------------------------------------------------------------------ */
  function renderActivePills() {
    if (!activePillsContainer) return;
    activePillsContainer.innerHTML = '';

    const addPill = (label, onRemove) => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'collection-active-pill';
      pill.innerHTML = `<span>${label}</span><span class="collection-active-pill__close" aria-hidden="true">✕</span>`;
      pill.addEventListener('click', onRemove);
      activePillsContainer.appendChild(pill);
    };

    // Surfaces
    state.surface.forEach(s => {
      addPill(s.charAt(0).toUpperCase() + s.slice(1), () => {
        state.surface = state.surface.filter(x => x !== s);
        syncSidebarInputs();
        updateCollection();
      });
    });

    // Cushioning
    state.cushioning.forEach(c => {
      addPill(c.charAt(0).toUpperCase() + c.slice(1), () => {
        state.cushioning = state.cushioning.filter(x => x !== c);
        syncSidebarInputs();
        updateCollection();
      });
    });

    // Sizes
    state.size.forEach(sz => {
      addPill(`UK ${sz}`, () => {
        state.size = state.size.filter(x => x !== sz);
        syncSidebarInputs();
        updateCollection();
      });
    });

    // Drop
    const dropNames = {
      '0-4': '0–4mm Drop',
      '5-8': '5–8mm Drop',
      '9plus': '9mm+ Drop'
    };
    state.drop.forEach(d => {
      addPill(dropNames[d] || `${d}mm`, () => {
        state.drop = state.drop.filter(x => x !== d);
        syncSidebarInputs();
        updateCollection();
      });
    });

    // Width
    state.width.forEach(w => {
      addPill(w.charAt(0).toUpperCase() + w.slice(1) + ' Width', () => {
        state.width = state.width.filter(x => x !== w);
        syncSidebarInputs();
        updateCollection();
      });
    });

    // Watch Series
    const seriesNames = {
      forerunner: 'Forerunner®',
      fenix: 'Fēnix® & Epix™',
      instinct: 'Instinct®',
      marq: 'MARQ®',
      venu: 'Venu® & Fitness',
      approach: 'Approach® Golf',
      edge: 'Edge®'
    };
    state.series.forEach(s => {
      addPill(seriesNames[s] || (s.charAt(0).toUpperCase() + s.slice(1)), () => {
        state.series = state.series.filter(x => x !== s);
        syncSidebarInputs();
        updateCollection();
      });
    });

    // Watch Display
    state.display.forEach(d => {
      addPill(d === 'amoled' ? 'AMOLED' : 'Solar MIP', () => {
        state.display = state.display.filter(x => x !== d);
        syncSidebarInputs();
        updateCollection();
      });
    });

    // Watch Size
    const watchSizeNames = {
      '41-43': '42mm Case',
      '45-47': '47mm Case',
      '50-51': '51mm Case'
    };
    state.watchSize.forEach(sz => {
      addPill(watchSizeNames[sz] || `${sz}mm`, () => {
        state.watchSize = state.watchSize.filter(x => x !== sz);
        syncSidebarInputs();
        updateCollection();
      });
    });

    // Watch Activity
    state.activity.forEach(a => {
      addPill(a.charAt(0).toUpperCase() + a.slice(1), () => {
        state.activity = state.activity.filter(x => x !== a);
        syncSidebarInputs();
        updateCollection();
      });
    });

    // Brand
    state.brand.forEach(b => {
      addPill(b.charAt(0).toUpperCase() + b.slice(1), () => {
        state.brand = state.brand.filter(x => x !== b);
        syncSidebarInputs();
        updateCollection();
      });
    });

    // Availability
    if (state.availableOnly) {
      addPill('In stock only', () => {
        state.availableOnly = false;
        syncSidebarInputs();
        updateCollection();
      });
    }

    // Price Pill if non-default
    if (state.minPrice > state.initialMinPrice || state.maxPrice < state.initialMaxPrice) {
      addPill(`${formatINR(state.minPrice)} – ${formatINR(state.maxPrice)}`, () => {
        state.minPrice = state.initialMinPrice;
        state.maxPrice = state.initialMaxPrice;
        syncSidebarInputs();
        updateCollection();
      });
    }
  }

  function updateCounterBadges(count) {
    const activeFiltersCount =
      state.surface.length +
      state.cushioning.length +
      state.size.length +
      state.drop.length +
      state.width.length +
      state.series.length +
      state.display.length +
      state.watchSize.length +
      state.activity.length +
      state.brand.length +
      (state.availableOnly ? 1 : 0) +
      (state.minPrice > state.initialMinPrice || state.maxPrice < state.initialMaxPrice ? 1 : 0);

    filterCountBadges.forEach(badge => {
      badge.textContent = activeFiltersCount;
      badge.style.display = activeFiltersCount > 0 ? 'inline-flex' : 'none';
    });

    if (mobileApplyBtn) {
      mobileApplyBtn.textContent = `Show ${count} products`;
    }
  }

  /* ------------------------------------------------------------------------
     4. SYNC UI FORM CONTROLS WITH STATE
     ------------------------------------------------------------------------ */
  function syncSidebarInputs() {
    // Checkboxes
    document.querySelectorAll('.filter-checkbox__input[name="surface"]').forEach(input => {
      input.checked = state.surface.includes(input.value.toLowerCase());
    });

    document.querySelectorAll('.filter-checkbox__input[name="series"]').forEach(input => {
      input.checked = state.series.includes(input.value.toLowerCase());
    });

    document.querySelectorAll('.filter-checkbox__input[name="brand"]').forEach(input => {
      input.checked = state.brand.includes(input.value.toLowerCase());
    });

    document.querySelectorAll('.filter-checkbox__input[name="availability"]').forEach(input => {
      input.checked = state.availableOnly;
    });

    // Cushioning Pills (Shoes)
    document.querySelectorAll('[data-filter-pill="cushioning"]').forEach(pill => {
      const val = (pill.dataset.value || '').toLowerCase();
      pill.classList.toggle('filter-pill--active', state.cushioning.includes(val));
    });

    // Display Pills (Watches: AMOLED / Solar)
    document.querySelectorAll('[data-filter-pill="display"]').forEach(pill => {
      const val = (pill.dataset.value || '').toLowerCase();
      pill.classList.toggle('filter-pill--active', state.display.includes(val));
    });

    // Size Buttons (Shoes)
    document.querySelectorAll('[data-filter-size]').forEach(btn => {
      const sz = btn.dataset.filterSize;
      btn.classList.toggle('filter-size-btn--active', state.size.includes(sz));
    });

    // Watch Size Buttons (42mm, 47mm, 51mm)
    document.querySelectorAll('[data-filter-watch-size]').forEach(btn => {
      const sz = btn.dataset.filterWatchSize;
      btn.classList.toggle('filter-size-btn--active', state.watchSize.includes(sz));
    });

    // Drop Links (Shoes)
    document.querySelectorAll('[data-filter-drop]').forEach(link => {
      const d = (link.dataset.filterDrop || '').toLowerCase();
      link.classList.toggle('filter-link--active', state.drop.includes(d));
    });

    // Width Links (Shoes)
    document.querySelectorAll('[data-filter-width]').forEach(link => {
      const w = (link.dataset.filterWidth || '').toLowerCase();
      link.classList.toggle('filter-link--active', state.width.includes(w));
    });

    // Activity Focus Links (Watches)
    document.querySelectorAll('[data-filter-activity]').forEach(link => {
      const act = (link.dataset.filterActivity || '').toLowerCase();
      link.classList.toggle('filter-link--active', state.activity.includes(act));
    });

    // Brands (Shoes & Apparel)
    document.querySelectorAll('[data-filter-brand]').forEach(link => {
      const b = (link.dataset.filterBrand || '').toLowerCase();
      link.classList.toggle('filter-link--active', state.brand.includes(b));
    });

    // Price slider inputs
    document.querySelectorAll('[data-price-min]').forEach(slider => {
      slider.min = state.initialMinPrice;
      slider.max = state.initialMaxPrice;
      slider.value = state.minPrice;
    });
    document.querySelectorAll('[data-price-max]').forEach(slider => {
      slider.min = state.initialMinPrice;
      slider.max = state.initialMaxPrice;
      slider.value = state.maxPrice;
    });
    document.querySelectorAll('[data-price-label]').forEach(label => {
      label.textContent = `${formatINR(state.minPrice)} — ${formatINR(state.maxPrice)}`;
    });
    updatePriceFill();
  }

  /* ------------------------------------------------------------------------
     5. PRICE RANGE SLIDER SETUP
     ------------------------------------------------------------------------ */
  function updatePriceFill() {
    const range = state.initialMaxPrice - state.initialMinPrice || 1;
    const minPercent = ((state.minPrice - state.initialMinPrice) / range) * 100;
    const maxPercent = ((state.maxPrice - state.initialMinPrice) / range) * 100;

    document.querySelectorAll('[data-price-range-fill]').forEach(fill => {
      fill.style.left = `${Math.max(0, Math.min(100, minPercent))}%`;
      fill.style.right = `${Math.max(0, Math.min(100, 100 - maxPercent))}%`;
    });
  }

  document.querySelectorAll('.filter-price').forEach(container => {
    const minInput = container.querySelector('[data-price-min]');
    const maxInput = container.querySelector('[data-price-max]');
    const label = container.querySelector('[data-price-label]');

    if (!minInput || !maxInput) return;

    function handlePriceChange() {
      let minVal = parseInt(minInput.value, 10);
      let maxVal = parseInt(maxInput.value, 10);

      if (minVal > maxVal) {
        const temp = minVal;
        minVal = maxVal;
        maxVal = temp;
      }

      state.minPrice = minVal;
      state.maxPrice = maxVal;

      if (label) {
        label.textContent = `${formatINR(minVal)} — ${formatINR(maxVal)}`;
      }

      updatePriceFill();
      updateCollection();
    }

    minInput.addEventListener('input', handlePriceChange);
    maxInput.addEventListener('input', handlePriceChange);
  });

  /* ------------------------------------------------------------------------
     6. SIDEBAR EVENT LISTENERS
     ------------------------------------------------------------------------ */
  // Checkboxes
  document.addEventListener('change', e => {
    if (e.target.matches('.filter-checkbox__input[name="surface"]')) {
      const val = e.target.value.toLowerCase();
      if (e.target.checked) {
        if (!state.surface.includes(val)) state.surface.push(val);
      } else {
        state.surface = state.surface.filter(x => x !== val);
      }
      updateCollection();
    }

    if (e.target.matches('.filter-checkbox__input[name="series"]')) {
      const val = e.target.value.toLowerCase();
      if (e.target.checked) {
        if (!state.series.includes(val)) state.series.push(val);
      } else {
        state.series = state.series.filter(x => x !== val);
      }
      updateCollection();
    }

    if (e.target.matches('.filter-checkbox__input[name="brand"]')) {
      const val = e.target.value.toLowerCase();
      if (e.target.checked) {
        if (!state.brand.includes(val)) state.brand.push(val);
      } else {
        state.brand = state.brand.filter(x => x !== val);
      }
      updateCollection();
    }

    if (e.target.matches('.filter-checkbox__input[name="availability"]')) {
      state.availableOnly = e.target.checked;
      updateCollection();
    }
  });

  // Cushioning pill clicks (Shoes)
  document.addEventListener('click', e => {
    const pill = e.target.closest('[data-filter-pill="cushioning"]');
    if (pill) {
      const val = (pill.dataset.value || '').toLowerCase();
      if (state.cushioning.includes(val)) {
        state.cushioning = state.cushioning.filter(x => x !== val);
      } else {
        state.cushioning.push(val);
      }
      syncSidebarInputs();
      updateCollection();
    }
  });

  // Display pill clicks (Watches: AMOLED / Solar)
  document.addEventListener('click', e => {
    const pill = e.target.closest('[data-filter-pill="display"]');
    if (pill) {
      const val = (pill.dataset.value || '').toLowerCase();
      if (state.display.includes(val)) {
        state.display = state.display.filter(x => x !== val);
      } else {
        state.display.push(val);
      }
      syncSidebarInputs();
      updateCollection();
    }
  });

  // Size buttons clicks (Shoes)
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-filter-size]');
    if (btn) {
      const sz = btn.dataset.filterSize;
      if (state.size.includes(sz)) {
        state.size = state.size.filter(x => x !== sz);
      } else {
        state.size.push(sz);
      }
      syncSidebarInputs();
      updateCollection();
    }
  });

  // Watch size buttons clicks (42mm, 47mm, 51mm)
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-filter-watch-size]');
    if (btn) {
      const sz = btn.dataset.filterWatchSize;
      if (state.watchSize.includes(sz)) {
        state.watchSize = state.watchSize.filter(x => x !== sz);
      } else {
        state.watchSize.push(sz);
      }
      syncSidebarInputs();
      updateCollection();
    }
  });

  // Drop link clicks (Shoes)
  document.addEventListener('click', e => {
    const dropLink = e.target.closest('[data-filter-drop]');
    if (dropLink) {
      const d = (dropLink.dataset.filterDrop || '').toLowerCase();
      if (state.drop.includes(d)) {
        state.drop = state.drop.filter(x => x !== d);
      } else {
        state.drop.push(d);
      }
      syncSidebarInputs();
      updateCollection();
    }
  });

  // Width link clicks (Shoes)
  document.addEventListener('click', e => {
    const widthLink = e.target.closest('[data-filter-width]');
    if (widthLink) {
      const w = (widthLink.dataset.filterWidth || '').toLowerCase();
      if (state.width.includes(w)) {
        state.width = state.width.filter(x => x !== w);
      } else {
        state.width.push(w);
      }
      syncSidebarInputs();
      updateCollection();
    }
  });

  // Activity link clicks (Watches)
  document.addEventListener('click', e => {
    const actLink = e.target.closest('[data-filter-activity]');
    if (actLink) {
      const act = (actLink.dataset.filterActivity || '').toLowerCase();
      if (state.activity.includes(act)) {
        state.activity = state.activity.filter(x => x !== act);
      } else {
        state.activity.push(act);
      }
      syncSidebarInputs();
      updateCollection();
    }
  });

  // Brand link clicks
  document.addEventListener('click', e => {
    const brandLink = e.target.closest('[data-filter-brand]');
    if (brandLink) {
      const b = (brandLink.dataset.filterBrand || '').toLowerCase();
      if (state.brand.includes(b)) {
        state.brand = state.brand.filter(x => x !== b);
      } else {
        state.brand.push(b);
      }
      syncSidebarInputs();
      updateCollection();
    }
  });

  // Clear filters
  document.querySelectorAll('[data-filters-clear]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.surface = [];
      state.cushioning = [];
      state.size = [];
      state.drop = [];
      state.width = [];
      state.series = [];
      state.display = [];
      state.watchSize = [];
      state.activity = [];
      state.brand = [];
      state.minPrice = state.initialMinPrice;
      state.maxPrice = state.initialMaxPrice;
      state.availableOnly = false;
      syncSidebarInputs();
      updateCollection();
    });
  });

  /* ------------------------------------------------------------------------
     7. SORT HANDLER (SORTS ACROSS THE FULL COLLECTION)
     ------------------------------------------------------------------------ */
  if (sortSelect) {
    sortSelect.addEventListener('change', e => {
      state.sortBy = e.target.value;
      updateCollection(true);
    });
  }

  /* ------------------------------------------------------------------------
     8. MOBILE DRAWER TOGGLE
     ------------------------------------------------------------------------ */
  const mobileDrawer = document.querySelector('.collection-sidebar--mobile');
  const mobileOpenBtn = document.querySelector('[data-mobile-filter-open]');

  if (mobileDrawer && mobileOpenBtn) {
    mobileOpenBtn.addEventListener('click', () => {
      mobileDrawer.classList.add('collection-sidebar--open');
      document.body.style.overflow = 'hidden';
    });

    document.querySelectorAll('[data-mobile-drawer-close]').forEach(el => {
      el.addEventListener('click', () => {
        mobileDrawer.classList.remove('collection-sidebar--open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ------------------------------------------------------------------------
     9. SHOE FINDER QUIZ MODAL
     ------------------------------------------------------------------------ */
  const shoeModal = document.querySelector('[data-shoe-finder-modal]');
  const openShoeBtns = document.querySelectorAll('[data-open-shoe-finder]');
  const closeShoeBtns = document.querySelectorAll('[data-close-shoe-finder]');
  const quizSteps = document.querySelectorAll('[data-quiz-step]');
  const quizProgress = document.querySelector('[data-quiz-progress]');
  const quizStepText = document.querySelector('[data-quiz-step-text]');
  const applyQuizBtn = document.querySelector('[data-quiz-apply-btn]');

  let shoeStep = 1;
  const shoeAnswers = {};

  function openShoeQuiz() {
    if (!shoeModal) return;
    shoeStep = 1;
    showShoeStep(1);
    shoeModal.classList.add('shoe-finder-modal--open');
    shoeModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeShoeQuiz() {
    if (!shoeModal) return;
    shoeModal.classList.remove('shoe-finder-modal--open');
    shoeModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function showShoeStep(step) {
    shoeStep = step;
    quizSteps.forEach(s => {
      s.classList.toggle('quiz-step--active', parseInt(s.dataset.quizStep, 10) === step);
    });
    if (quizProgress) quizProgress.style.width = `${(step / 4) * 100}%`;
    if (quizStepText) quizStepText.textContent = step <= 4 ? `Question ${step} of 4` : 'Recommendation Ready';
  }

  openShoeBtns.forEach(btn => btn.addEventListener('click', openShoeQuiz));
  closeShoeBtns.forEach(btn => btn.addEventListener('click', closeShoeQuiz));

  document.querySelectorAll('[data-quiz-select]').forEach(btn => {
    btn.addEventListener('click', () => {
      const field = btn.dataset.quizSelect;
      shoeAnswers[field] = btn.dataset.value;
      if (shoeStep < 4) {
        showShoeStep(shoeStep + 1);
      } else {
        showShoeStep(5);
      }
    });
  });

  if (applyQuizBtn) {
    applyQuizBtn.addEventListener('click', () => {
      if (shoeAnswers.surface) state.surface = [shoeAnswers.surface];
      if (shoeAnswers.cushioning) state.cushioning = [shoeAnswers.cushioning];
      syncSidebarInputs();
      updateCollection();
      closeShoeQuiz();
      collectionGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ------------------------------------------------------------------------
     10. WATCH FINDER QUIZ MODAL
     ------------------------------------------------------------------------ */
  const watchModal = document.querySelector('[data-watch-finder-modal]');
  const openWatchBtns = document.querySelectorAll('[data-open-watch-finder]');
  const closeWatchBtns = document.querySelectorAll('[data-close-watch-finder]');
  const watchSteps = document.querySelectorAll('[data-watch-step]');
  const watchProgress = document.querySelector('[data-watch-progress]');
  const watchStepText = document.querySelector('[data-watch-step-text]');
  const applyWatchBtn = document.querySelector('[data-watch-apply-btn]');

  let watchStepNum = 1;
  const watchAnswers = {};

  function openWatchQuiz() {
    if (!watchModal) return;
    watchStepNum = 1;
    showWatchStep(1);
    watchModal.classList.add('watch-finder-modal--open');
    watchModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeWatchQuiz() {
    if (!watchModal) return;
    watchModal.classList.remove('watch-finder-modal--open');
    watchModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function showWatchStep(step) {
    watchStepNum = step;
    watchSteps.forEach(s => {
      s.classList.toggle('watch-quiz-step--active', parseInt(s.dataset.watchStep, 10) === step);
    });
    if (watchProgress) watchProgress.style.width = `${(step / 3) * 100}%`;
    if (watchStepText) watchStepText.textContent = step <= 3 ? `Question ${step} of 3` : 'Shortlist Ready';
  }

  openWatchBtns.forEach(btn => btn.addEventListener('click', openWatchQuiz));
  closeWatchBtns.forEach(btn => btn.addEventListener('click', closeWatchQuiz));

  document.querySelectorAll('[data-watch-select]').forEach(btn => {
    btn.addEventListener('click', () => {
      const field = btn.dataset.watchSelect;
      watchAnswers[field] = btn.dataset.value;
      if (watchStepNum < 3) {
        showWatchStep(watchStepNum + 1);
      } else {
        showWatchStep(4);
      }
    });
  });

  if (applyWatchBtn) {
    applyWatchBtn.addEventListener('click', () => {
      if (watchAnswers.display) state.display = [watchAnswers.display];
      if (watchAnswers.distance === 'triathlon') state.activity = ['triathlon'];
      else if (watchAnswers.distance === 'ultra') state.activity = ['trail'];
      else if (watchAnswers.distance === 'marathon') state.activity = ['running'];
      syncSidebarInputs();
      updateCollection();
      closeWatchQuiz();
      collectionGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // Initial Sync, Render & Background Full-Collection Hydration
  syncSidebarInputs();
  updateCollection();
  hydrateRemainingCollectionPages();
});
