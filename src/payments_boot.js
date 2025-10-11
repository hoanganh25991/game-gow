/**
 * payments_boot.js
 * Encapsulates payment initialization and TWA license messaging for app-priced distribution,
 * with optional Digital Goods SKU mode. Exposes helper methods on window for UI triggers.
 *
 * Public API:
 *   import { initPaymentsBootstrap } from './payments_boot.js';
 *   initPaymentsBootstrap({ payments, storageKey });
 *
 * Behavior:
 * - Initializes Digital Goods if available (harmless if unsupported)
 * - Supports two modes:
 *   1) SKU mode (PRODUCT_IDS non-empty): checks owned products and sets entitlement
 *   2) App-priced mode (PRODUCT_IDS empty): trusts TWA wrapper license status messaging
 * - Exposes:
 *   - window.requestLicenseStatus(): asks wrapper to post TWA_LICENSE_STATUS back
 *   - window.restorePurchases(): re-checks SKU ownership or re-requests license status
 *   - window.__appPurchased: boolean entitlement flag (persisted in localStorage)
 */
export function initPaymentsBootstrap({ payments, storageKey }) {
  // Configure product SKUs here if you're using in-app products.
  // For an app-priced distribution (one-time paid app with no SKUs), leave PRODUCT_IDS empty.
  const PRODUCT_IDS = []; // Example: ['com.example.app.productId'] for SKU mode.

  // Helper: persist entitlement flag
  function setEntitled(entitled) {
    try { localStorage.setItem(storageKey("app.purchased"), entitled ? '1' : '0'); } catch (_) {}
    window.__appPurchased = !!entitled;
  }

  // Initialize entitlement from any persisted local state as a baseline
  try {
    window.__appPurchased = !!localStorage.getItem(storageKey("app.purchased"));
  } catch (_) {
    window.__appPurchased = false;
  }

  // Expose a helper that the page/Settings UI can call to request wrapper license state
  window.requestLicenseStatus = function requestLicenseStatus() {
    try {
      window.postMessage({ type: 'REQUEST_TWA_LICENSE_STATUS' }, '*');
    } catch (e) {
      console.warn('[payments_boot] requestLicenseStatus failed', e);
    }
  };

  // Listen for license status posted by the Android TWA wrapper
  window.addEventListener('message', async (ev) => {
    try {
      const data = ev.data;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'TWA_LICENSE_STATUS') {
        const entitled = !!data.entitled;
        setEntitled(entitled);
        console.info('[payments_boot] received TWA_LICENSE_STATUS', { entitled });

        // If the wrapper provides a token suitable for server-side verification (Play Integrity or LVL),
        // verify it on your server for stronger security.
        if (data.licenseToken) {
          try {
            const resp = await payments.verifyLicenseOnServer({ licenseData: data.licenseToken });
            if (resp && resp.ok && resp.entitled) {
              setEntitled(true);
              console.info('[payments_boot] server verified license token OK');
            } else {
              console.warn('[payments_boot] server license verification returned not-entitled', resp);
            }
          } catch (e) {
            console.warn('[payments_boot] license verify on server failed', e);
          }
        }
      }
    } catch (e) {
      console.warn('[payments_boot] message handler error', e);
    }
  }, false);

  // Initialize Digital Goods API if present, then resolve entitlement by mode
  (async () => {
    try {
      await payments.initDigitalGoods(); // harmless if unsupported

      if (Array.isArray(PRODUCT_IDS) && PRODUCT_IDS.length > 0) {
        // SKU mode
        const purchases = await payments.checkOwned(PRODUCT_IDS);
        if (Array.isArray(purchases) && purchases.length > 0) {
          setEntitled(true);
          console.info('[payments_boot] detected owned product(s):', purchases.map(p => p.itemId));
          // Optionally verify purchase tokens on server:
          // for (const p of purchases) await payments.verifyOnServer({ packageName: 'com.example.app', productId: p.itemId, purchaseToken: p.purchaseToken });
        } else {
          // Fall back to previously-saved local state (window.__appPurchased already set above)
        }
      } else {
        // App-priced mode: ask wrapper for current license state (non-blocking)
        try { window.requestLicenseStatus(); } catch (_) {}
      }
    } catch (e) {
      console.warn('[payments_boot] initialization failed', e);
      // Keep baseline __appPurchased loaded from localStorage
    }
  })();

  // Expose restore helper to re-check purchases or re-request license
  window.restorePurchases = async function restorePurchases() {
    try {
      await payments.initDigitalGoods();
      if (Array.isArray(PRODUCT_IDS) && PRODUCT_IDS.length > 0) {
        // SKU mode: enumerate owned purchases again
        const all = await payments.listPurchases();
        if (Array.isArray(all) && all.length) {
          const found = all.some(p => p && PRODUCT_IDS.includes(p.itemId));
          if (found) setEntitled(true);
        }
        return all;
      } else {
        // App-priced mode: request wrapper license status again
        try {
          window.requestLicenseStatus && window.requestLicenseStatus();
          return { ok: true, note: 'Requested wrapper license status' };
        } catch (err) {
          console.warn('[payments_boot] restorePurchases (app priced) failed', err);
          throw err;
        }
      }
    } catch (err) {
      console.warn('[payments_boot] restorePurchases failed', err);
      throw err;
    }
  };
}
