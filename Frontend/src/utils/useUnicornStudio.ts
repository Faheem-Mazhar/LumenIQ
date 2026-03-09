import { useEffect } from 'react';

const SCRIPT_ATTR = 'data-unicornstudio';
const VENDOR_SCRIPT_SRC = '/vendor/unicornStudio.umd.js';

/**
 * Loads the UnicornStudio animation library from the vendored local copy.
 * Using a local vendor file eliminates supply-chain risk from the external CDN
 * and ensures consistent behaviour regardless of CDN availability.
 */
export function useUnicornStudio() {
  useEffect(() => {
    const existingScript = document.querySelector(`script[${SCRIPT_ATTR}]`);
    if (existingScript) {
      window.UnicornStudio?.init();
      return;
    }

    const script = document.createElement('script');
    script.src = VENDOR_SCRIPT_SRC;
    script.async = true;
    script.dataset.unicornstudio = 'true';

    script.onload = () => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          window.UnicornStudio?.init();
        });
      } else {
        window.UnicornStudio?.init();
      }
    };

    script.onerror = () => {
      console.error('UnicornStudio: failed to load animation library.');
    };

    (document.head || document.body).appendChild(script);
  }, []);
}
