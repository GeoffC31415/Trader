/**
 * Input Handler
 * 
 * Core input state management and action mapping.
 */

import { INPUT_ACTIONS, DEFAULT_KEY_BINDINGS, type InputAction } from './keyboard_bindings';

export interface InputState {
  pressed: Record<string, boolean>;
  actions: Set<InputAction>;
}

export class InputHandler {
  private bindings: Map<string, InputAction>;
  private pressed: Record<string, boolean> = {};
  private actions: Set<InputAction> = new Set();

  constructor(bindings: Record<string, InputAction> = DEFAULT_KEY_BINDINGS) {
    this.bindings = new Map(Object.entries(bindings));
  }

  /**
   * Handle key down event
   */
  handleKeyDown(key: string): void {
    const normalizedKey = key.toLowerCase();
    this.pressed[normalizedKey] = true;
    
    const action = this.bindings.get(normalizedKey);
    if (action) {
      this.actions.add(action);
    }
  }

  /**
   * Handle key up event
   */
  handleKeyUp(key: string): void {
    const normalizedKey = key.toLowerCase();
    this.pressed[normalizedKey] = false;
    
    const action = this.bindings.get(normalizedKey);
    if (action) {
      this.actions.delete(action);
    }
  }

  /**
   * Get current pressed keys state
   */
  getPressed(): Record<string, boolean> {
    return { ...this.pressed };
  }

  /**
   * Get current active actions
   */
  getActions(): Set<InputAction> {
    return new Set(this.actions);
  }

  /**
   * Check if a specific action is active
   */
  isActionActive(action: InputAction): boolean {
    return this.actions.has(action);
  }

  /**
   * Rebind a key to a different action
   */
  rebind(key: string, action: InputAction): void {
    // Remove old binding if exists
    for (const [k, a] of this.bindings.entries()) {
      if (a === action && k !== key.toLowerCase()) {
        this.bindings.delete(k);
      }
    }
    this.bindings.set(key.toLowerCase(), action);
  }

  /**
   * Get current bindings
   */
  getBindings(): Record<string, InputAction> {
    return Object.fromEntries(this.bindings);
  }
}

