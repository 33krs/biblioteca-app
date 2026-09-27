import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Vitest's current jsdom setup does not expose storage as a bare Node global.
// Keep the browser contract available to code and tests that use localStorage.
const storage = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    clear: () => storage.clear(),
    getItem: (key: string) => storage.get(key) ?? null,
    removeItem: (key: string) => storage.delete(key),
    setItem: (key: string, value: string) => storage.set(key, String(value)),
  },
});

afterEach(() => {
  cleanup();
});
