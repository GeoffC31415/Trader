import { afterEach, vi } from 'vitest';

// Simulation tests run without a DOM, a GPU, or real audio hardware.
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});
