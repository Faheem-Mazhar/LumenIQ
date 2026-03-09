/// <reference types="vite/client" />

declare module 'figma:assets/*' {
    const assetUrl: string;
    export default assetUrl;
  }

declare global {
  interface Window {
    UnicornStudio?: {
      init: () => void;
    };
  }
}
  