// Node ortamında tarayıcı API'lerini taklit et (oyun modülleri import sırasında okur).
const store = new Map<string, string>();
const g = globalThis as unknown as Record<string, unknown>;
g.matchMedia ??= () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
g.localStorage ??= { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, String(v)), removeItem: (k: string) => void store.delete(k), clear: () => store.clear() };
g.window ??= globalThis;
g.document ??= { createElement: () => ({ style: {}, getContext: () => null, addEventListener() {} }), addEventListener() {} };