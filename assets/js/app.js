/* ==========================================================================
   BrandVista POS — Shared application logic
   Loaded on every page. Handles: sidebar mobile toggle, active nav link,
   dark/light theme (persisted), notification dropdown stub, toast helper,
   and small formatting utilities used across pages.
   ========================================================================== */

const BrandVista = (() => {
  const STORAGE_THEME_KEY = 'bv_theme';
  const STORAGE_CATEGORIES_KEY = 'bv_categories';

  /* ---------- Shared category store ----------
     Categories are the one piece of "master data" referenced from several
     pages (Categories, Products, Add/Edit Product). Since this is a static
     multi-page site with no backend, we persist them to localStorage so an
     Add/Edit made on categories.html survives a page reload and is visible
     from the Category dropdown on the product pages too. */
  const DEFAULT_CATEGORIES = [
    { id: 1, name: 'Beverages', icon: '☕', count: 186, color: '#dbeafe', fg: '#2563eb', desc: 'Coffee, tea, juices & soft drinks' },
    { id: 2, name: 'Bakery', icon: '🥐', count: 94, color: '#fef3c7', fg: '#b45309', desc: 'Bread, pastries & cakes' },
    { id: 3, name: 'Dairy', icon: '🧀', count: 142, color: '#dcfce7', fg: '#15803d', desc: 'Milk, cheese, yogurt & eggs' },
    { id: 4, name: 'Pantry', icon: '🍚', count: 231, color: '#ede9fe', fg: '#7c3aed', desc: 'Rice, grains, oils & spices' },
    { id: 5, name: 'Snacks', icon: '🍪', count: 178, color: '#fee2e2', fg: '#b91c1c', desc: 'Chips, biscuits & confectionery' },
    { id: 6, name: 'Household', icon: '🧺', count: 112, color: '#e0f2fe', fg: '#0369a1', desc: 'Cleaning & home essentials' },
    { id: 7, name: 'Personal Care', icon: '🧴', count: 158, color: '#fce7f3', fg: '#be185d', desc: 'Hygiene & wellness products' },
    { id: 8, name: 'Frozen Foods', icon: '🧊', count: 47, color: '#e2e8f0', fg: '#334155', desc: 'Frozen meals & ice cream' },
  ];

  function getCategories() {
    const stored = localStorage.getItem(STORAGE_CATEGORIES_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      } catch (e) { /* fall through to defaults below */ }
    }
    saveCategories(DEFAULT_CATEGORIES);
    return DEFAULT_CATEGORIES.slice();
  }

  function saveCategories(categories) {
    localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(categories));
  }

  // Fills a <select> element with <option> tags built from the shared
  // category list, keeping the currently selected value if it still exists.
  function populateCategorySelect(selectEl, selectedName) {
    if (!selectEl) return;
    const categories = getCategories();
    const current = selectedName || selectEl.value;
    selectEl.innerHTML = categories.map((c) => `<option value="${c.name}">${c.name}</option>`).join('');
    if (current && categories.some((c) => c.name === current)) {
      selectEl.value = current;
    }
  }

  /* ---------- Shared product catalog ----------
     Same idea as categories: Products, Add Product, Edit Product and the POS
     Billing screen all need to see the same catalog. Everything reads from
     and writes to this localStorage-backed list so a product added on one
     page (or its stock/price edited) is immediately visible everywhere else
     the next time that page loads. */
  const STORAGE_PRODUCTS_KEY = 'bv_products';

  const DEFAULT_PRODUCTS = [
    { id: 1, name: 'Colombian Roast Coffee 250g', barcode: '8901234567890', category: 'Beverages', price: 420, stock: 86, low: 20, status: 'active', color: '#2563eb', image: null },
    { id: 2, name: 'Organic Almond Milk 1L', barcode: '8901234567891', category: 'Dairy', price: 210, stock: 54, low: 15, status: 'active', color: '#22c55e', image: null },
    { id: 3, name: 'Artisan Sourdough Loaf', barcode: '8901234567892', category: 'Bakery', price: 180, stock: 32, low: 10, status: 'active', color: '#f59e0b', image: null },
    { id: 4, name: 'Free Range Eggs (12)', barcode: '8901234567893', category: 'Dairy', price: 145, stock: 8, low: 15, status: 'low', color: '#7c3aed', image: null },
    { id: 5, name: 'Cold Brew Concentrate', barcode: '8901234567894', category: 'Beverages', price: 320, stock: 0, low: 10, status: 'out', color: '#ef4444', image: null },
    { id: 6, name: 'Oat Milk 1L', barcode: '8901234567895', category: 'Dairy', price: 195, stock: 4, low: 10, status: 'low', color: '#0ea5e9', image: null },
    { id: 7, name: 'Basmati Rice 5kg', barcode: '8901234567896', category: 'Pantry', price: 650, stock: 7, low: 12, status: 'low', color: '#a855f7', image: null },
    { id: 8, name: 'Dark Chocolate 100g', barcode: '8901234567897', category: 'Snacks', price: 150, stock: 63, low: 15, status: 'active', color: '#f97316', image: null },
    { id: 9, name: 'Green Tea Bags (25)', barcode: '8901234567898', category: 'Beverages', price: 210, stock: 18, low: 10, status: 'active', color: '#14b8a6', image: null },
    { id: 10, name: 'Greek Yogurt 400g', barcode: '8901234567899', category: 'Dairy', price: 130, stock: 15, low: 10, status: 'active', color: '#eab308', image: null },
    { id: 11, name: 'Croissant (pack of 4)', barcode: '8901234567900', category: 'Bakery', price: 160, stock: 24, low: 10, status: 'active', color: '#fb923c', image: null },
    { id: 12, name: 'Extra Virgin Olive Oil 500ml', barcode: '8901234567901', category: 'Pantry', price: 480, stock: 11, low: 12, status: 'low', color: '#84cc16', image: null },
    { id: 13, name: 'Salted Potato Chips 150g', barcode: '8901234567902', category: 'Snacks', price: 60, stock: 92, low: 20, status: 'active', color: '#ec4899', image: null },
    { id: 14, name: 'Sparkling Water 1L', barcode: '8901234567903', category: 'Beverages', price: 90, stock: 47, low: 15, status: 'active', color: '#06b6d4', image: null },
    { id: 15, name: 'Cheddar Cheese Block 200g', barcode: '8901234567904', category: 'Dairy', price: 260, stock: 29, low: 10, status: 'active', color: '#f43f5e', image: null },
    { id: 16, name: 'Trail Mix 250g', barcode: '8901234567905', category: 'Snacks', price: 220, stock: 38, low: 10, status: 'active', color: '#8b5cf6', image: null },
  ];

  function getProducts() {
    const stored = localStorage.getItem(STORAGE_PRODUCTS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      } catch (e) { /* fall through to defaults below */ }
    }
    saveProducts(DEFAULT_PRODUCTS);
    return DEFAULT_PRODUCTS.slice();
  }

  function saveProducts(products) {
    localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(products));
  }

  // Derives a product's status ('active' | 'low' | 'out') from its stock
  // level relative to its own low-stock threshold, so callers never have to
  // remember to keep the two fields in sync by hand.
  function computeStockStatus(stock, low) {
    if (stock <= 0) return 'out';
    if (stock <= low) return 'low';
    return 'active';
  }

  /* ---------- Theme ---------- */
  function initTheme() {
    const saved = localStorage.getItem(STORAGE_THEME_KEY);
    const theme = saved || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeToggleUI(theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE_THEME_KEY, next);
    updateThemeToggleUI(next);
  }

  function updateThemeToggleUI(theme) {
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      const sun = btn.querySelector('.icon-sun');
      const moon = btn.querySelector('.icon-moon');
      if (sun && moon) {
        sun.style.display = theme === 'dark' ? 'block' : 'none';
        moon.style.display = theme === 'dark' ? 'none' : 'block';
      }
    });
  }

  /* ---------- Sidebar (mobile) ---------- */
  function initSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.querySelector('.sidebar-backdrop');
    const toggles = document.querySelectorAll('[data-menu-toggle]');

    const open = () => {
      sidebar?.classList.add('open');
      backdrop?.classList.add('open');
    };
    const close = () => {
      sidebar?.classList.remove('open');
      backdrop?.classList.remove('open');
    };

    toggles.forEach((btn) => btn.addEventListener('click', open));
    backdrop?.addEventListener('click', close);
  }

  /* ---------- Active nav link ---------- */
  function markActiveNav() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.sidebar-link').forEach((link) => {
      const href = link.getAttribute('href');
      if (href === current) {
        link.classList.add('active');
      }
    });
  }

  /* ---------- Notification / profile dropdowns ---------- */
  function initDropdowns() {
    document.querySelectorAll('[data-dropdown-trigger]').forEach((trigger) => {
      const targetId = trigger.getAttribute('data-dropdown-trigger');
      const panel = document.getElementById(targetId);
      if (!panel) return;
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.dropdown-panel.open').forEach((p) => {
          if (p !== panel) p.classList.remove('open');
        });
        panel.classList.toggle('open');
      });
    });
    document.addEventListener('click', (e) => {
      document.querySelectorAll('.dropdown-panel.open').forEach((panel) => {
        if (!panel.contains(e.target)) panel.classList.remove('open');
      });
    });
  }

  /* ---------- Toasts ---------- */
  function ensureToastStack() {
    let stack = document.querySelector('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    return stack;
  }

  const TOAST_ICONS = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  };

  function showToast(message, type = 'success', duration = 3200) {
    const stack = ensureToastStack();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-icon">${TOAST_ICONS[type] || TOAST_ICONS.info}</span><span>${message}</span>`;
    stack.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  /* ---------- Formatters ---------- */
  function formatCurrency(amount) {
    const settings = JSON.parse(localStorage.getItem('bv_settings') || '{}');
    const symbol = settings.currencySymbol || '₹';
    return `${symbol}${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  /* ---------- Generic slide-over / modal helpers ---------- */
  function openPanel(panelEl, overlayEl) {
    overlayEl?.classList.add('open');
    panelEl?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closePanel(panelEl, overlayEl) {
    overlayEl?.classList.remove('open');
    panelEl?.classList.remove('open');
    document.body.style.overflow = '';
  }

  function initGenericClosers() {
    document.querySelectorAll('[data-close-panel]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const panel = btn.closest('.slide-over, .modal');
        const overlay = document.querySelector('.overlay.open') || panel;
        panel?.classList.remove('open');
        document.querySelector('.overlay')?.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.slide-over.open, .modal.open').forEach((p) => p.classList.remove('open'));
        document.querySelector('.overlay')?.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  function init() {
    initTheme();
    initSidebar();
    markActiveNav();
    initDropdowns();
    initGenericClosers();

    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.addEventListener('click', toggleTheme);
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  return {
    showToast, formatCurrency, formatDate, openPanel, closePanel, toggleTheme,
    getCategories, saveCategories, populateCategorySelect,
    getProducts, saveProducts, computeStockStatus,
  };
})();
