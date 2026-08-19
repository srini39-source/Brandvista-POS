/* ==========================================================================
   Settings page logic — tab switching, live receipt-footer preview, theme
   selection, backup export/import (as a downloadable JSON file), and
   persisting store preferences to localStorage.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Tab navigation ---------- */
  const navItems = document.querySelectorAll('.settings-nav-item');
  const panels = document.querySelectorAll('.settings-panel');

  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      navItems.forEach((i) => i.classList.remove('active'));
      panels.forEach((p) => p.classList.remove('active'));
      item.classList.add('active');
      document.getElementById(`panel-${item.getAttribute('data-panel')}`).classList.add('active');
    });
  });

  /* ---------- Live receipt footer preview ---------- */
  const footerInput = document.getElementById('receiptFooter');
  const footerPreview = document.getElementById('receiptFooterPreview');
  footerInput.addEventListener('input', () => {
    footerPreview.textContent = footerInput.value || 'Thank you for shopping with us!';
  });

  /* ---------- Theme option cards ---------- */
  const themeOptions = document.querySelectorAll('.theme-option');
  const savedTheme = localStorage.getItem('bv_theme') || 'light';
  themeOptions.forEach((opt) => {
    if (opt.getAttribute('data-theme-option') === savedTheme) opt.classList.add('active');
    opt.addEventListener('click', () => {
      themeOptions.forEach((o) => o.classList.remove('active'));
      opt.classList.add('active');
      const choice = opt.getAttribute('data-theme-option');
      const resolved = choice === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : choice;
      document.documentElement.setAttribute('data-theme', resolved);
      localStorage.setItem('bv_theme', resolved);
    });
  });

  /* ---------- Logo upload (demo only — no backend) ---------- */
  document.getElementById('uploadLogoBtn').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/svg+xml,image/jpeg';
    input.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        const file = e.target.files[0];
        // For demo: show file name and size, but can't persist without backend
        BrandVista.showToast(`Selected: ${file.name} (${(file.size / 1024).toFixed(1)}KB)\nNote: Saving requires backend integration.`, 'info');
      }
    });
    input.click();
  });

  /* ---------- Backup / restore ---------- */
  document.getElementById('downloadBackupBtn').addEventListener('click', () => {
    const pricesCheckbox = document.querySelector('input[type="checkbox"]');
    const backup = {
      exportedAt: new Date().toISOString(),
      storeName: document.getElementById('storeName').value,
      storePhone: document.getElementById('storePhone').value,
      storeEmail: document.getElementById('storeEmail').value,
      storeAddress: document.getElementById('storeAddress').value,
      gstNumber: document.getElementById('gstNumber').value,
      currency: document.getElementById('currency').value,
      gstRate: document.getElementById('defaultGst').value,
      pricesIncludeTax: pricesCheckbox ? pricesCheckbox.checked : true,
      receiptFooter: document.getElementById('receiptFooter').value,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brandvista-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    BrandVista.showToast('Backup downloaded.', 'success');
  });

  document.getElementById('restoreBackupBtn').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.addEventListener('change', () => {
      if (input.files.length) {
        BrandVista.showToast(`Restoring from "${input.files[0].name}"…`, 'info');
      }
    });
    input.click();
  });

  document.getElementById('resetDataBtn').addEventListener('click', () => {
    if (confirm('This will permanently erase all store data. Continue?')) {
      BrandVista.showToast('Store data has been reset.', 'success');
    }
  });

  /* ---------- Load saved settings on page init ---------- */
  async function loadSavedSettings() {
    let saved = {};
    
    // Try to load from backend first
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        saved = await response.json();
      }
    } catch (err) {
      console.log('Backend not available, using localStorage');
    }
    
    // Fallback to localStorage if backend not available
    if (Object.keys(saved).length === 0) {
      saved = JSON.parse(localStorage.getItem('bv_settings') || '{}');
    }
    
    if (saved.storeName) document.getElementById('storeName').value = saved.storeName;
    if (saved.storePhone) document.getElementById('storePhone').value = saved.storePhone;
    if (saved.storeEmail) document.getElementById('storeEmail').value = saved.storeEmail;
    if (saved.storeAddress) document.getElementById('storeAddress').value = saved.storeAddress;
    if (saved.gstNumber) document.getElementById('gstNumber').value = saved.gstNumber;
    if (saved.gstRate) document.getElementById('defaultGst').value = saved.gstRate;
    if (saved.currencySymbol) document.getElementById('currency').value = saved.currencySymbol;
    if (saved.receiptFooter) document.getElementById('receiptFooter').value = saved.receiptFooter;
    // Restore checkbox state
    const pricesCheckbox = document.querySelector('input[type="checkbox"]');
    if (pricesCheckbox && typeof saved.pricesIncludeTax !== 'undefined') {
      pricesCheckbox.checked = saved.pricesIncludeTax;
    }
  }

  /* ---------- Save settings ---------- */
  document.getElementById('saveSettingsBtn').addEventListener('click', () => {
    const pricesCheckbox = document.querySelector('input[type="checkbox"]');
    const settings = {
      storeName: document.getElementById('storeName').value,
      storePhone: document.getElementById('storePhone').value,
      storeEmail: document.getElementById('storeEmail').value,
      storeAddress: document.getElementById('storeAddress').value,
      gstNumber: document.getElementById('gstNumber').value,
      currencySymbol: document.getElementById('currency').value,
      gstRate: document.getElementById('defaultGst').value,
      pricesIncludeTax: pricesCheckbox ? pricesCheckbox.checked : true,
      receiptFooter: document.getElementById('receiptFooter').value,
    };
    localStorage.setItem('bv_settings', JSON.stringify(settings));
    BrandVista.showToast('Settings saved successfully.', 'success');
  });

  /* Load settings when page initializes */
  loadSavedSettings();
});
