import { useEffect, useRef } from 'react';
import { InputHandler } from './input_handler';
import { INPUT_ACTIONS } from './keyboard_bindings';

/**
 * React hook for input handling
 * 
 * Manages keyboard input and provides action state.
 */
export function useInput() {
  const handlerRef = useRef(new InputHandler());
  const pressedRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const handler = handlerRef.current;
    
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === ' ' || e.code === 'Space') {
        e.preventDefault(); // Prevent page scroll
      }
      handler.handleKeyDown(key);
      pressedRef.current = handler.getPressed();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      handler.handleKeyUp(key);
      pressedRef.current = handler.getPressed();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  return {
    handler: handlerRef.current,
    getPressed: () => pressedRef.current,
    getActions: () => handlerRef.current.getActions(),
    isActionActive: (action: typeof INPUT_ACTIONS[keyof typeof INPUT_ACTIONS]) => 
      handlerRef.current.isActionActive(action),
  };
}

