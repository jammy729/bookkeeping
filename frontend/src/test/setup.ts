import '@testing-library/jest-dom';

// Node 22+ ships an experimental `localStorage` global that shadows jsdom's
// (and is undefined unless --localstorage-file is passed). jsdom's window
// normally provides its own storage, but under vitest on recent Node versions
// it can resolve to the broken Node global. Polyfill a working in-memory
// implementation when `window.localStorage` is missing.
if (typeof window !== 'undefined' && !window.localStorage) {
  const store = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    writable: true,
    value: {
      get length() {
        return store.size;
      },
      clear: () => store.clear(),
      getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      removeItem: (key: string) => {
        store.delete(key);
      },
      setItem: (key: string, value: string) => {
        store.set(key, String(value));
      },
    },
  });
}

// jsdom does not implement matchMedia — required by ThemeProvider/useTheme
// (rendered by Layout, Onboarding, Login, Register).
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// jsdom does not implement ResizeObserver — used by recharts
// ResponsiveContainer inside dashboard charts.
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: ResizeObserverMock,
  });
}
