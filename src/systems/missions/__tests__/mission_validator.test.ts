import { describe, it, expect } from 'vitest';
import { checkMissionCompletion } from '../mission_validator';
import { createMissionFromTemplate } from '../mission_generator';
import { MISSION_TEMPLATES } from '../../../domain/constants/mission_constants';

describe('mission completion', () => {
  it('requires every required objective', () => {
    const mission = createMissionFromTemplate(MISSION_TEMPLATES.greenfields_stage_4);
    expect(checkMissionCompletion(mission)).toBe(false);
    mission.objectives[0].completed = true;
    expect(checkMissionCompletion(mission)).toBe(false);
    mission.objectives[1].completed = true;
    expect(checkMissionCompletion(mission)).toBe(true);
  });
  it('ignores optional objectives', () => {
    const mission = createMissionFromTemplate(MISSION_TEMPLATES.greenfields_stage_4);
    mission.objectives[0].completed = true;
    mission.objectives[1].optional = true;
    expect(checkMissionCompletion(mission)).toBe(true);
  });
});
