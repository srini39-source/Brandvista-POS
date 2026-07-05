/* ==========================================================================
   POS Billing screen logic — product grid rendering, cart management with
   live subtotal/GST/discount/total calculations, payment method selection,
   keyboard shortcuts, and the checkout flow.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const GST_RATE = 0.05;

  /* ---------- Catalog ----------
     Pulled fresh from the same localStorage-backed store that the Products,
     Add Product and Edit Product pages read from/write to, so anything
     added, edited, or re-categorized there shows up here the next time this
     page loads — no separate hardcoded list to fall out of sync. */
  let catalog = BrandVista.getProducts();

  // Category tabs come from the shared category list too, so a category
  // added on the Categories page appears here immediately (it'll just show
  // an empty grid until a product is assigned to it).
  const categoryNames = BrandVista.getCategories().map((c) => c.name);
  const categories = ['All', ...categoryNames];
  let activeCategory = 'All';
  let cart = []; // { id, name, price, qty, color }
  let activePayment = 'Cash';

  /* ---------- Category tabs ---------- */
  const categoryTabs = document.getElementById('categoryTabs');
  categoryTabs.innerHTML = categories.map((c, i) =>
    `<button class="pos-category-tab ${i === 0 ? 'active' : ''}" data-cat="${c}">${c}</button>`
  ).join('');

  categoryTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.pos-category-tab');
    if (!btn) return;
    activeCategory = btn.getAttribute('data-cat');
    document.querySelectorAll('.pos-category-tab').forEach((t) => t.classList.remove('active'));
    btn.classList.add('active');
    renderGrid();
  });

  /* ---------- Product grid ---------- */
  const productGrid = document.getElementById('productGrid');
  const searchInput = document.getElementById('posSearch');

  function renderGrid() {
    const q = searchInput.value.trim().toLowerCase();
    const filtered = catalog.filter((p) =>
      (activeCategory === 'All' || p.category === activeCategory) &&
      (!q || p.name.toLowerCase().includes(q))
    );

    if (filtered.length === 0) {
      productGrid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <h4>No products match</h4><p>Try a different search or category.</p>
      </div>`;
      return;
    }

    productGrid.innerHTML = filtered.map((p) => `
      <div class="pos-product-card ${p.stock <= 0 ? 'out-of-stock' : ''}" data-id="${p.id}">
        ${p.stock <= 0 ? '<span class="stock-tag">Sold out</span>' : ''}
        ${p.image
          ? `<img class="pos-product-thumb" style="object-fit:cover;" src="${p.image}" alt="${p.name}">`
          : `<div class="pos-product-thumb" style="background:${p.color};">${p.name.charAt(0)}</div>`}
        <h5>${p.name}</h5>
        <span class="price">₹${p.price.toFixed(2)}</span>
      </div>
    `).join('');
  }

  productGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.pos-product-card');
    if (!card || card.classList.contains('out-of-stock')) return;
    addToCart(parseInt(card.getAttribute('data-id')));
  });

  searchInput.addEventListener('input', renderGrid);

  /* ---------- Cart logic ---------- */
  const cartItemsEl = document.getElementById('cartItems');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const checkoutAmount = document.getElementById('checkoutAmount');

  function addToCart(id) {
    const product = catalog.find((p) => p.id === id);
    if (!product) return;
    const existing = cart.find((c) => c.id === id);
    if (existing) {
      if (existing.qty >= product.stock) {
        BrandVista.showToast('No more stock available for this item.', 'error');
        return;
      }
      existing.qty += 1;
    } else {
      cart.push({ id: product.id, name: product.name, price: product.price, qty: 1, color: product.color, image: product.image });
    }
    renderCart();
  }

  function changeQty(id, delta) {
    const item = cart.find((c) => c.id === id);
    if (!item) return;
    if (delta > 0) {
      const product = catalog.find((p) => p.id === id);
      if (product && item.qty >= product.stock) {
        BrandVista.showToast('No more stock available for this item.', 'error');
        return;
      }
    }
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter((c) => c.id !== id);
    renderCart();
  }

  function removeFromCart(id) {
    cart = cart.filter((c) => c.id !== id);
    renderCart();
  }

  function renderCart() {
    if (cart.length === 0) {
      cartItemsEl.innerHTML = `<div class="pos-cart-empty" id="cartEmptyState">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1.4"/><circle cx="18" cy="21" r="1.4"/><path d="M2.5 3h2.6l2.6 12.6a2 2 0 0 0 2 1.6h8a2 2 0 0 0 2-1.5l1.6-7.2H6.4"/></svg>
        <p>Cart is empty</p><p class="text-sm">Tap a product to add it</p>
      </div>`;
    } else {
      cartItemsEl.innerHTML = cart.map((item) => `
        <div class="cart-item" data-id="${item.id}">
          ${item.image
            ? `<img class="cart-item-thumb" style="object-fit:cover;" src="${item.image}" alt="${item.name}">`
            : `<div class="cart-item-thumb" style="background:${item.color};">${item.name.charAt(0)}</div>`}
          <div class="cart-item-info">
            <h5>${item.name}</h5>
            <span>₹${item.price.toFixed(2)} each</span>
          </div>
          <div class="cart-qty-control">
            <button class="qty-btn" data-decrease="${item.id}">−</button>
            <span class="cart-qty-value">${item.qty}</span>
            <button class="qty-btn" data-increase="${item.id}">+</button>
          </div>
          <div class="cart-item-total">₹${(item.price * item.qty).toFixed(2)}</div>
          <button class="cart-item-remove" data-remove="${item.id}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `).join('');
    }
    updateSummary();
  }

  cartItemsEl.addEventListener('click', (e) => {
    const inc = e.target.closest('[data-increase]')?.getAttribute('data-increase');
    const dec = e.target.closest('[data-decrease]')?.getAttribute('data-decrease');
    const rem = e.target.closest('[data-remove]')?.getAttribute('data-remove');
    if (inc) changeQty(parseInt(inc), 1);
    if (dec) changeQty(parseInt(dec), -1);
    if (rem) removeFromCart(parseInt(rem));
  });

  document.getElementById('clearCartBtn').addEventListener('click', () => {
    cart = [];
    renderCart();
  });

  /* ---------- Summary calculations ---------- */
  const discountType = document.getElementById('discountType');
  const discountValue = document.getElementById('discountValue');

  function updateSummary() {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const tax = subtotal * GST_RATE;

    let discount = 0;
    const dVal = parseFloat(discountValue.value) || 0;
    if (discountType.value === 'pct') {
      discount = (subtotal + tax) * (dVal / 100);
    } else {
      discount = dVal;
    }
    discount = Math.min(discount, subtotal + tax);

    const total = Math.max(0, subtotal + tax - discount);

    document.getElementById('sumSubtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('sumTax').textContent = `₹${tax.toFixed(2)}`;
    document.getElementById('sumTotal').textContent = `₹${total.toFixed(2)}`;
    checkoutAmount.textContent = `₹${total.toFixed(2)}`;
    checkoutBtn.disabled = cart.length === 0;
  }

  discountType.addEventListener('change', updateSummary);
  discountValue.addEventListener('input', updateSummary);

  /* ---------- Payment method selection ---------- */
  document.querySelectorAll('.payment-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.payment-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      activePayment = tab.getAttribute('data-payment');
    });
  });

  /* ---------- Checkout flow ---------- */
  const checkoutModal = document.getElementById('checkoutModal');

  checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) return;
    const orderId = Math.floor(10000 + Math.random() * 89999);
    const totalText = document.getElementById('sumTotal').textContent;
    document.getElementById('checkoutSummaryText').textContent = `Order #${orderId} · ${totalText} paid via ${activePayment}`;

    // Deduct sold quantities from the shared catalog and persist, so stock
    // levels drop consistently on the Products page and here on refresh.
    cart.forEach((item) => {
      const product = catalog.find((p) => p.id === item.id);
      if (product) {
        product.stock = Math.max(0, product.stock - item.qty);
        product.status = BrandVista.computeStockStatus(product.stock, product.low);
      }
    });
    BrandVista.saveProducts(catalog);

    checkoutModal.classList.add('open');
  });

  document.getElementById('newSaleBtn').addEventListener('click', () => {
    cart = [];
    discountValue.value = 0;
    renderCart();
    renderGrid(); // reflect the stock that checkout just deducted
    checkoutModal.classList.remove('open');
    BrandVista.showToast('Ready for a new sale.', 'success');
  });

  /* ---------- Keyboard shortcuts ---------- */
  document.addEventListener('keydown', (e) => {
    // Ignore shortcuts while typing in the discount field to allow normal editing
    if (e.key === 'F2') {
      e.preventDefault();
      searchInput.focus();
    }
    if (e.key === 'F4') {
      e.preventDefault();
      if (!checkoutBtn.disabled) checkoutBtn.click();
    }
    if (e.key === 'Escape' && document.activeElement !== searchInput) {
      cart = [];
      renderCart();
    }
  });

  renderGrid();
  renderCart();
});
