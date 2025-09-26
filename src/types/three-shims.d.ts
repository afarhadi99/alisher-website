/**
 * Minimal shims to satisfy TypeScript for dynamically imported three.js modules.
 * These are intentionally broad (any) because we only need them to remove TS errors
 * for runtime-only AR functionality.
 */

declare module 'three';

declare module 'three/examples/jsm/webxr/ARButton.js' {
  export const ARButton: any;
}

declare module 'three/examples/jsm/loaders/GLTFLoader.js' {
  export class GLTFLoader {
    load(
      url: string,
      onLoad?: (...args: any[]) => void,
      onProgress?: (...args: any[]) => void,
      onError?: (err: any) => void
    ): void;
  }
}