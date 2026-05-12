/**
 * Stage Patterns for QTE Dodge Game
 *
 * Defines difficulty progression across 20 stages with varying gimmick combinations.
 * Boss stages (5, 10, 15, 20) have empty events and are handled separately.
 *
 * Game area: 800x600
 */

import { randomFloorPatternEvents } from './floorPatterns.js';
import { STAGE_CONFIGS } from './stages/stageConfigs.js';
import { STAGE_1, STAGE_2, STAGE_3, STAGE_4, STAGE_5 } from './stages/introStages.js';
import { STAGE_6, STAGE_7, STAGE_8, STAGE_9, STAGE_10 } from './stages/growthStages.js';
import { STAGE_11, STAGE_12, STAGE_13, STAGE_14, STAGE_15 } from './stages/challengeStages.js';
import { STAGE_16, STAGE_17, STAGE_18, STAGE_19, STAGE_20 } from './stages/hellStages.js';

// Pattern map for all stages
const STAGE_PATTERNS = {
  1: STAGE_1,
  2: STAGE_2,
  3: STAGE_3,
  4: STAGE_4,
  5: STAGE_5,
  6: STAGE_6,
  7: STAGE_7,
  8: STAGE_8,
  9: STAGE_9,
  10: STAGE_10,
  11: STAGE_11,
  12: STAGE_12,
  13: STAGE_13,
  14: STAGE_14,
  15: STAGE_15,
  16: STAGE_16,
  17: STAGE_17,
  18: STAGE_18,
  19: STAGE_19,
  20: STAGE_20,
};

// ─────────────────────────────────────────────────────────
// 복합 floor 패턴 이벤트 추가 (난이도 그룹별, 무작위 burst)
// ─────────────────────────────────────────────────────────

// Tutorial group (stages 1-4): count 감소, 종료 구간 완화
STAGE_1.events.push(...randomFloorPatternEvents('tutorial', { count: 4, endTime: 26 }));
STAGE_2.events.push(...randomFloorPatternEvents('tutorial', { count: 4, endTime: 26 }));
STAGE_3.events.push(...randomFloorPatternEvents('tutorial', { count: 4, endTime: 26 }));
STAGE_4.events.push(...randomFloorPatternEvents('tutorial', { count: 4, endTime: 26 }));

// Growth group (stages 6-9): count 감소, 종료 구간 완화
STAGE_6.events.push(...randomFloorPatternEvents('growth', { count: 6, endTime: 31 }));
STAGE_7.events.push(...randomFloorPatternEvents('growth', { count: 6, endTime: 31 }));
STAGE_8.events.push(...randomFloorPatternEvents('growth', { count: 6, endTime: 31 }));
STAGE_9.events.push(...randomFloorPatternEvents('growth', { count: 6, endTime: 31 }));

// Challenge group (stages 11-14): count 감소, 종료 구간 완화
STAGE_11.events.push(...randomFloorPatternEvents('challenge', { count: 8, endTime: 36 }));
STAGE_12.events.push(...randomFloorPatternEvents('challenge', { count: 8, endTime: 36 }));
STAGE_13.events.push(...randomFloorPatternEvents('challenge', { count: 8, endTime: 36 }));
STAGE_14.events.push(...randomFloorPatternEvents('challenge', { count: 8, endTime: 36 }));

// Hell group (stages 16-19): count 감소, 종료 구간 완화
STAGE_16.events.push(...randomFloorPatternEvents('hell', { count: 12, endTime: 41 }));
STAGE_17.events.push(...randomFloorPatternEvents('hell', { count: 12, endTime: 41 }));
STAGE_18.events.push(...randomFloorPatternEvents('hell', { count: 12, endTime: 41 }));
STAGE_19.events.push(...randomFloorPatternEvents('hell', { count: 12, endTime: 41 }));

/**
 * Get the pattern for a specific stage
 * @param {number} stageNumber - Stage number (1-20)
 * @returns {object} Pattern object containing stage, duration, and events
 */
function getStagePattern(stageNumber) {
  const pattern = STAGE_PATTERNS[stageNumber];
  if (!pattern) {
    console.warn(`Stage ${stageNumber} not found, returning empty pattern`);
    return { stage: stageNumber, duration: 0, events: [] };
  }
  return pattern;
}

export { getStagePattern, STAGE_CONFIGS, STAGE_PATTERNS };
