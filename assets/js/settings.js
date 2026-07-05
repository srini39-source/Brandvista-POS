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
    BrandVista.showToast('Logo upload requires a connected backend.', 'info');
  });

  /* ---------- Backup / restore ---------- */
  document.getElementById('downloadBackupBtn').addEventListener('click', () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      storeName: document.getElementById('storeName').value,
      currency: document.getElementById('currency').value,
      gstRate: document.getElementById('defaultGst').value,
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

  /* ---------- Save settings ---------- */
  document.getElementById('saveSettingsBtn').addEventListener('click', () => {
    const settings = {
      storeName: document.getElementById('storeName').value,
      currencySymbol: document.getElementById('currency').value,
      gstRate: document.getElementById('defaultGst').value,
      receiptFooter: document.getElementById('receiptFooter').value,
    };
    localStorage.setItem('bv_settings', JSON.stringify(settings));
    BrandVista.showToast('Settings saved successfully.', 'success');
  });
});
