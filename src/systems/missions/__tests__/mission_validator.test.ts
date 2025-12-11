import { describe, it, expect } from 'vitest';
import { checkMissionCompletion } from '../mission_validator';
import type { Mission } from '../../../domain/types/mission_types';

describe('checkMissionCompletion', () => {
  it('returns true when all required objectives are completed', () => {
    const mission: Mission = {
      id: 'test-mission',
      arcId: 'test-arc',
      stage: 1,
      type: 'deliver',
      status: 'active',
      title: 'Test Mission',
      description: 'Test',
      availableAt: ['station1'],
      objectives: [
        { id: 'obj1', type: 'deliver', description: 'Deliver goods', target: 'commodity1', quantity: 10, current: 10, completed: true },
        { id: 'obj2', type: 'travel', description: 'Go to station', target: 'station1', completed: true },
      ],
      rewards: { credits: 1000, reputationChanges: {} },
    };

    expect(checkMissionCompletion(mission)).toBe(true);
  });

  it('returns false when some required objectives are incomplete', () => {
    const mission: Mission = {
      id: 'test-mission',
      arcId: 'test-arc',
      stage: 1,
      type: 'deliver',
      status: 'active',
      title: 'Test Mission',
      description: 'Test',
      availableAt: ['station1'],
      objectives: [
        { id: 'obj1', type: 'deliver', description: 'Deliver goods', target: 'commodity1', quantity: 10, current: 5, completed: false },
        { id: 'obj2', type: 'travel', description: 'Go to station', target: 'station1', completed: true },
      ],
      rewards: { credits: 1000, reputationChanges: {} },
    };

    expect(checkMissionCompletion(mission)).toBe(false);
  });

  it('ignores optional objectives for completion check', () => {
    const mission: Mission = {
      id: 'test-mission',
      arcId: 'test-arc',
      stage: 1,
      type: 'deliver',
      status: 'active',
      title: 'Test Mission',
      description: 'Test',
      availableAt: ['station1'],
      objectives: [
        { id: 'obj1', type: 'deliver', description: 'Deliver goods', target: 'commodity1', quantity: 10, current: 10, completed: true },
        { id: 'obj2', type: 'travel', description: 'Optional travel', target: 'station2', completed: false, optional: true },
      ],
      rewards: { credits: 1000, reputationChanges: {} },
    };

    expect(checkMissionCompletion(mission)).toBe(true);
  });
});

