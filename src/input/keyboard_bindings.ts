/**
 * Keyboard Bindings
 * 
 * Maps keyboard keys to game actions.
 */

export const INPUT_ACTIONS = {
  MOVE_FORWARD: 'moveForward',
  MOVE_BACKWARD: 'moveBackward',
  MOVE_LEFT: 'moveLeft',
  MOVE_RIGHT: 'moveRight',
  MOVE_UP: 'moveUp',
  MOVE_DOWN: 'moveDown',
  DOCK: 'dock',
  UNDOCK: 'undock',
  MINE: 'mine',
  FIRE: 'fire',
} as const;

export type InputAction = typeof INPUT_ACTIONS[keyof typeof INPUT_ACTIONS];

export const DEFAULT_KEY_BINDINGS: Record<string, InputAction> = {
  'w': INPUT_ACTIONS.MOVE_FORWARD,
  's': INPUT_ACTIONS.MOVE_BACKWARD,
  'a': INPUT_ACTIONS.MOVE_LEFT,
  'd': INPUT_ACTIONS.MOVE_RIGHT,
  'r': INPUT_ACTIONS.MOVE_UP,
  'f': INPUT_ACTIONS.MOVE_DOWN,
  'e': INPUT_ACTIONS.DOCK,
  'q': INPUT_ACTIONS.UNDOCK,
  'm': INPUT_ACTIONS.MINE,
  ' ': INPUT_ACTIONS.FIRE,
};

