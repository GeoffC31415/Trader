// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

beforeEach(() => { vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function Broken(): never { throw new Error('render failed'); }

it('renders its children normally', () => {
  render(<ErrorBoundary><div>Flight controls</div></ErrorBoundary>);
  expect(screen.getByText('Flight controls')).toBeTruthy();
});

it('shows a fallback, reports the error, and can retry a transient render failure', () => {
  let broken = true;
  function Transient() { return broken ? <Broken /> : <div>Recovered</div>; }
  const onError = vi.fn();
  render(<ErrorBoundary onError={onError}><Transient /></ErrorBoundary>);
  expect(screen.getByText('Something went wrong.')).toBeTruthy();
  expect(onError).toHaveBeenCalledTimes(1);
  expect(onError.mock.calls[0][0].message).toBe('render failed');
  broken = false;
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(screen.getByText('Recovered')).toBeTruthy();
});

it('does not let an error-reporting callback break recovery', () => {
  render(<ErrorBoundary onError={() => { throw new Error('reporting failed'); }}><Broken /></ErrorBoundary>);
  expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
});

it.each([
  ['element', <div key="fallback">Custom fallback</div>], ['null', null], ['false', false],
] as const)('honors an explicit %s fallback', (_, fallback) => {
  const { container } = render(<ErrorBoundary fallback={fallback}><Broken /></ErrorBoundary>);
  expect(screen.queryByText('Something went wrong.')).toBeNull();
  expect(container.textContent).toBe(fallback ? 'Custom fallback' : '');
});
