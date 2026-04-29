/**
 * Stage Patterns for QTE Dodge Game
 *
 * Defines difficulty progression across 20 stages with varying gimmick combinations.
 * Boss stages (5, 10, 15, 20) have empty events and are handled separately.
 *
 * Game area: 800x600
 */

import { randomFloorPatternEvents } from './floorPatterns.js';

// Difficulty multipliers for each stage
const STAGE_CONFIGS = {
  1: { bulletSpeedMult: 1.0, bulletCountMult: 1.0, warningTimeMult: 1.0, qteTimingMult: 1.0 },
  2: { bulletSpeedMult: 1.05, bulletCountMult: 1.0, warningTimeMult: 1.0, qteTimingMult: 1.0 },
  3: { bulletSpeedMult: 1.0, bulletCountMult: 1.0, warningTimeMult: 1.0, qteTimingMult: 1.0 },
  4: { bulletSpeedMult: 1.0, bulletCountMult: 1.0, warningTimeMult: 1.0, qteTimingMult: 1.0 },
  6: { bulletSpeedMult: 1.1, bulletCountMult: 1.1, warningTimeMult: 0.95, qteTimingMult: 1.0 },
  7: { bulletSpeedMult: 1.15, bulletCountMult: 1.15, warningTimeMult: 0.95, qteTimingMult: 1.0 },
  8: { bulletSpeedMult: 1.2, bulletCountMult: 1.2, warningTimeMult: 0.9, qteTimingMult: 1.05 },
  9: { bulletSpeedMult: 1.25, bulletCountMult: 1.25, warningTimeMult: 0.9, qteTimingMult: 1.05 },
  11: { bulletSpeedMult: 1.3, bulletCountMult: 1.3, warningTimeMult: 0.85, qteTimingMult: 1.1 },
  12: { bulletSpeedMult: 1.35, bulletCountMult: 1.35, warningTimeMult: 0.85, qteTimingMult: 1.1 },
  13: { bulletSpeedMult: 1.4, bulletCountMult: 1.4, warningTimeMult: 0.8, qteTimingMult: 1.15 },
  14: { bulletSpeedMult: 1.5, bulletCountMult: 1.45, warningTimeMult: 0.8, qteTimingMult: 1.15 },
  16: { bulletSpeedMult: 1.6, bulletCountMult: 1.5, warningTimeMult: 0.75, qteTimingMult: 1.2 },
  17: { bulletSpeedMult: 1.65, bulletCountMult: 1.55, warningTimeMult: 0.75, qteTimingMult: 1.25 },
  18: { bulletSpeedMult: 1.7, bulletCountMult: 1.6, warningTimeMult: 0.7, qteTimingMult: 1.3 },
  19: { bulletSpeedMult: 1.8, bulletCountMult: 1.65, warningTimeMult: 0.7, qteTimingMult: 1.35 },
};

/**
 * Stage 1 - INTRO: Floor obstacles only
 * Single gimmick type, slow and generous
 */
const STAGE_1 = {
  stage: 1,
  duration: 30,
  events: [
    {
      time: 3,
      type: 'floor',
      params: {
        x: 300,
        y: 450,
        width: 200,
        height: 80,
        warningTime: 2500,
        activeTime: 3000,
        shape: 'rect',
        variant: 'normal',
      },
    },
    {
      time: 8,
      type: 'floor',
      params: {
        x: 100,
        y: 480,
        width: 150,
        height: 60,
        warningTime: 2500,
        activeTime: 2500,
        shape: 'rect',
        variant: 'normal',
      },
    },
    {
      time: 13,
      type: 'floor',
      params: {
        x: 550,
        y: 470,
        width: 180,
        height: 70,
        warningTime: 2500,
        activeTime: 3000,
        shape: 'circle',
        variant: 'normal',
      },
    },
    {
      time: 18,
      type: 'floor',
      params: {
        x: 400,
        y: 460,
        width: 120,
        height: 60,
        warningTime: 2500,
        activeTime: 2500,
        shape: 'rect',
        variant: 'growing',
        growScale: 1.5,
      },
    },
    {
      time: 23,
      type: 'floor',
      params: {
        x: 200,
        y: 490,
        width: 100,
        height: 50,
        warningTime: 2500,
        activeTime: 3000,
        shape: 'circle',
        variant: 'shrinking',
        growScale: 0.5,
      },
    },
  ],
};

/**
 * Stage 2 - INTRO: Bullet patterns only
 * Single gimmick type, slow and generous
 */
const STAGE_2 = {
  stage: 2,
  duration: 30,
  events: [
    {
      time: 3,
      type: 'bullet',
      params: {
        type: 'fan',
        originX: 400,
        originY: 0,
        count: 3,
        speed: 150,
        angle: 30,
        direction: 270,
        delay: 0,
      },
    },
    {
      time: 8,
      type: 'bullet',
      params: {
        type: 'circle',
        originX: 400,
        originY: 300,
        count: 8,
        speed: 140,
        direction: 0,
        delay: 0,
      },
    },
    {
      time: 13,
      type: 'bullet',
      params: {
        type: 'line',
        originX: 0,
        originY: 300,
        count: 1,
        speed: 160,
        direction: 0,
        spacing: 0,
        delay: 0,
      },
    },
    {
      time: 18,
      type: 'bullet',
      params: {
        type: 'fan',
        originX: 400,
        originY: 0,
        count: 5,
        speed: 150,
        angle: 45,
        direction: 270,
        delay: 300,
      },
    },
    {
      time: 24,
      type: 'bullet',
      params: {
        type: 'circle',
        originX: 400,
        originY: 400,
        count: 6,
        speed: 155,
        direction: 0,
        delay: 0,
      },
    },
  ],
};

/**
 * Stage 3 - INTRO: Laser patterns only
 * Single gimmick type, slow and generous
 */
const STAGE_3 = {
  stage: 3,
  duration: 30,
  events: [
    {
      time: 3,
      type: 'laser',
      params: {
        startX: 0,
        startY: 300,
        endX: 800,
        endY: 300,
        width: 40,
        warningTime: 2500,
        activeTime: 2500,
      },
    },
    {
      time: 8,
      type: 'laser',
      params: {
        startX: 400,
        startY: 0,
        endX: 400,
        endY: 600,
        width: 40,
        warningTime: 2500,
        activeTime: 2500,
      },
    },
    {
      time: 13,
      type: 'laser',
      params: {
        startX: 0,
        startY: 150,
        endX: 800,
        endY: 450,
        width: 35,
        warningTime: 2500,
        activeTime: 3000,
      },
    },
    {
      time: 18,
      type: 'laser',
      params: {
        startX: 800,
        startY: 0,
        endX: 0,
        endY: 600,
        width: 40,
        warningTime: 2500,
        activeTime: 2500,
      },
    },
    {
      time: 23,
      type: 'laser',
      params: {
        startX: 0,
        startY: 500,
        endX: 800,
        endY: 200,
        width: 38,
        warningTime: 2500,
        activeTime: 3000,
      },
    },
  ],
};

/**
 * Stage 4 - INTRO: QTE patterns only
 * Single gimmick type, slow and generous
 */
const STAGE_4 = {
  stage: 4,
  duration: 30,
  events: [
    {
      time: 3,
      type: 'qte',
      params: {
        sequence: ['Q', 'W'],
        timing: 3000,
      },
    },
    {
      time: 8,
      type: 'qte',
      params: {
        sequence: ['W', 'E'],
        timing: 3000,
      },
    },
    {
      time: 13,
      type: 'qte',
      params: {
        sequence: ['Q', 'W', 'E'],
        timing: 3500,
      },
    },
    {
      time: 18,
      type: 'qte',
      params: {
        sequence: ['E', 'Q'],
        timing: 3000,
      },
    },
    {
      time: 23,
      type: 'qte',
      params: {
        sequence: ['W', 'E', 'Q'],
        timing: 3500,
      },
    },
  ],
};

/**
 * Stage 5 - BOSS
 * Handled separately by BossScene
 */
const STAGE_5 = {
  stage: 5,
  duration: 0,
  events: [],
};

/**
 * Stage 6 - INTERMEDIATE: Floor + Bullet combination
 * Moderate speed and density
 */
const STAGE_6 = {
  stage: 6,
  duration: 35,
  events: [
    {
      time: 2,
      type: 'floor',
      params: {
        x: 300,
        y: 450,
        width: 200,
        height: 70,
        warningTime: 1500,
        activeTime: 2500,
        shape: 'rect',
        variant: 'normal',
      },
    },
    {
      time: 5,
      type: 'bullet',
      params: {
        type: 'fan',
        originX: 400,
        originY: 0,
        count: 4,
        speed: 165,
        angle: 35,
        direction: 270,
        delay: 0,
      },
    },
    {
      time: 10,
      type: 'floor',
      params: {
        x: 100,
        y: 480,
        width: 150,
        height: 60,
        warningTime: 1500,
        activeTime: 2500,
        shape: 'circle',
        variant: 'growing',
        growScale: 1.4,
      },
    },
    {
      time: 14,
      type: 'bullet',
      params: {
        type: 'circle',
        originX: 400,
        originY: 300,
        count: 9,
        speed: 160,
        direction: 0,
        delay: 0,
      },
    },
    {
      time: 19,
      type: 'floor',
      params: {
        x: 550,
        y: 460,
        width: 180,
        height: 70,
        warningTime: 1500,
        activeTime: 2500,
        shape: 'rect',
        variant: 'normal',
      },
    },
    {
      time: 23,
      type: 'bullet',
      params: {
        type: 'line',
        originX: 0,
        originY: 250,
        count: 1,
        speed: 175,
        direction: 0,
        spacing: 0,
        delay: 0,
      },
    },
    {
      time: 27,
      type: 'floor',
      params: {
        x: 400,
        y: 470,
        width: 120,
        height: 60,
        warningTime: 1500,
        activeTime: 2500,
        shape: 'rect',
        variant: 'shrinking',
        growScale: 0.6,
      },
    },
    {
      time: 31,
      type: 'bullet',
      params: {
        type: 'fan',
        originX: 400,
        originY: 0,
        count: 5,
        speed: 170,
        angle: 40,
        direction: 270,
        delay: 200,
      },
    },
  ],
};

/**
 * Stage 7 - INTERMEDIATE: Bullet + Laser combination
 * Moderate speed and density
 */
const STAGE_7 = {
  stage: 7,
  duration: 35,
  events: [
    {
      time: 2,
      type: 'bullet',
      params: {
        type: 'fan',
        originX: 400,
        originY: 0,
        count: 4,
        speed: 170,
        angle: 35,
        direction: 270,
        delay: 0,
      },
    },
    {
      time: 6,
      type: 'laser',
      params: {
        startX: 0,
        startY: 300,
        endX: 800,
        endY: 300,
        width: 40,
        warningTime: 1500,
        activeTime: 2500,
      },
    },
    {
      time: 11,
      type: 'bullet',
      params: {
        type: 'circle',
        originX: 400,
        originY: 250,
        count: 8,
        speed: 165,
        direction: 0,
        delay: 0,
      },
    },
    {
      time: 16,
      type: 'laser',
      params: {
        startX: 400,
        startY: 0,
        endX: 400,
        endY: 600,
        width: 40,
        warningTime: 1500,
        activeTime: 2500,
      },
    },
    {
      time: 21,
      type: 'bullet',
      params: {
        type: 'line',
        originX: 0,
        originY: 350,
        count: 1,
        speed: 180,
        direction: 0,
        spacing: 0,
        delay: 0,
      },
    },
    {
      time: 25,
      type: 'laser',
      params: {
        startX: 0,
        startY: 150,
        endX: 800,
        endY: 450,
        width: 38,
        warningTime: 1500,
        activeTime: 2800,
      },
    },
    {
      time: 30,
      type: 'bullet',
      params: {
        type: 'fan',
        originX: 400,
        originY: 0,
        count: 5,
        speed: 175,
        angle: 40,
        direction: 270,
        delay: 150,
      },
    },
  ],
};

/**
 * Stage 8 - INTERMEDIATE: Floor + Bullet + Laser combination
 * Moderate speed and density
 */
const STAGE_8 = {
  stage: 8,
  duration: 35,
  events: [
    {
      time: 2,
      type: 'floor',
      params: {
        x: 300,
        y: 450,
        width: 180,
        height: 70,
        warningTime: 1500,
        activeTime: 2500,
        shape: 'rect',
        variant: 'normal',
      },
    },
    {
      time: 5,
      type: 'bullet',
      params: {
        type: 'fan',
        originX: 400,
        originY: 0,
        count: 4,
        speed: 170,
        angle: 35,
        direction: 270,
        delay: 0,
      },
    },
    {
      time: 10,
      type: 'laser',
      params: {
        startX: 0,
        startY: 350,
        endX: 800,
        endY: 350,
        width: 40,
        warningTime: 1500,
        activeTime: 2400,
      },
    },
    {
      time: 15,
      type: 'floor',
      params: {
        x: 100,
        y: 480,
        width: 150,
        height: 60,
        warningTime: 1500,
        activeTime: 2500,
        shape: 'circle',
        variant: 'growing',
        growScale: 1.4,
      },
    },
    {
      time: 19,
      type: 'bullet',
      params: {
        type: 'circle',
        originX: 400,
        originY: 300,
        count: 8,
        speed: 165,
        direction: 0,
        delay: 0,
      },
    },
    {
      time: 24,
      type: 'laser',
      params: {
        startX: 400,
        startY: 0,
        endX: 400,
        endY: 600,
        width: 40,
        warningTime: 1500,
        activeTime: 2500,
      },
    },
    {
      time: 29,
      type: 'floor',
      params: {
        x: 550,
        y: 470,
        width: 160,
        height: 60,
        warningTime: 1500,
        activeTime: 2500,
        shape: 'rect',
        variant: 'shrinking',
        growScale: 0.6,
      },
    },
    {
      time: 33,
      type: 'bullet',
      params: {
        type: 'line',
        originX: 0,
        originY: 300,
        count: 1,
        speed: 185,
        direction: 0,
        spacing: 0,
        delay: 0,
      },
    },
  ],
};

/**
 * Stage 9 - INTERMEDIATE: All gimmicks including QTE
 * Moderate speed and density with tighter timing
 */
const STAGE_9 = {
  stage: 9,
  duration: 35,
  events: [
    {
      time: 2,
      type: 'floor',
      params: {
        x: 300,
        y: 450,
        width: 180,
        height: 70,
        warningTime: 1500,
        activeTime: 2500,
        shape: 'rect',
        variant: 'normal',
      },
    },
    {
      time: 6,
      type: 'bullet',
      params: {
        type: 'fan',
        originX: 400,
        originY: 0,
        count: 4,
        speed: 170,
        angle: 35,
        direction: 270,
        delay: 0,
      },
    },
    {
      time: 10,
      type: 'laser',
      params: {
        startX: 0,
        startY: 300,
        endX: 800,
        endY: 300,
        width: 40,
        warningTime: 1500,
        activeTime: 2400,
      },
    },
    {
      time: 15,
      type: 'qte',
      params: {
        sequence: ['Q', 'W', 'E'],
        timing: 2800,
      },
    },
    {
      time: 20,
      type: 'bullet',
      params: {
        type: 'circle',
        originX: 400,
        originY: 300,
        count: 9,
        speed: 170,
        direction: 0,
        delay: 0,
      },
    },
    {
      time: 25,
      type: 'floor',
      params: {
        x: 100,
        y: 480,
        width: 140,
        height: 60,
        warningTime: 1500,
        activeTime: 2500,
        shape: 'circle',
        variant: 'growing',
        growScale: 1.3,
      },
    },
    {
      time: 29,
      type: 'laser',
      params: {
        startX: 400,
        startY: 0,
        endX: 400,
        endY: 600,
        width: 40,
        warningTime: 1500,
        activeTime: 2500,
      },
    },
    {
      time: 33,
      type: 'qte',
      params: {
        sequence: ['E', 'W', 'Q'],
        timing: 2800,
      },
    },
  ],
};

/**
 * Stage 10 - BOSS
 * Handled separately by BossScene
 */
const STAGE_10 = {
  stage: 10,
  duration: 0,
  events: [],
};

/**
 * Stage 11 - ADVANCED: Multiple gimmicks with moving floors
 * Increased density and faster speed
 */
const STAGE_11 = {
  stage: 11,
  duration: 40,
  events: [
    {
      time: 2,
      type: 'floor',
      params: {
        x: 300,
        y: 450,
        width: 160,
        height: 60,
        warningTime: 1200,
        activeTime: 2500,
        shape: 'rect',
        variant: 'moving',
        moveToX: 500,
        moveToY: 450,
      },
    },
    {
      time: 6,
      type: 'bullet',
      params: {
        type: 'fan',
        originX: 400,
        originY: 0,
        count: 5,
        speed: 200,
        angle: 40,
        direction: 270,
        delay: 0,
      },
    },
    {
      time: 11,
      type: 'laser',
      params: {
        startX: 0,
        startY: 200,
        endX: 800,
        endY: 400,
        width: 38,
        warningTime: 1200,
        activeTime: 2400,
        bendX: 400,
        bendY: 250,
      },
    },
    {
      time: 16,
      type: 'qte',
      params: {
        sequence: ['Q', 'W', 'E', 'Q'],
        timing: 2500,
      },
    },
    {
      time: 21,
      type: 'bullet',
      params: {
        type: 'circle',
        originX: 400,
        originY: 350,
        count: 10,
        speed: 195,
        direction: 0,
        delay: 0,
      },
    },
    {
      time: 26,
      type: 'floor',
      params: {
        x: 150,
        y: 480,
        width: 140,
        height: 60,
        warningTime: 1200,
        activeTime: 2500,
        shape: 'rect',
        variant: 'moving',
        moveToX: 600,
        moveToY: 480,
      },
    },
    {
      time: 31,
      type: 'laser',
      params: {
        startX: 800,
        startY: 0,
        endX: 0,
        endY: 600,
        width: 40,
        warningTime: 1200,
        activeTime: 2500,
        bendX: 400,
        bendY: 300,
      },
    },
    {
      time: 36,
      type: 'qte',
      params: {
        sequence: ['W', 'E', 'Q', 'W'],
        timing: 2500,
      },
    },
  ],
};

/**
 * Stage 12 - ADVANCED: Multiple gimmicks with varied patterns
 * Increased density and faster speed
 */
const STAGE_12 = {
  stage: 12,
  duration: 40,
  events: [
    {
      time: 2,
      type: 'bullet',
      params: {
        type: 'fan',
        originX: 400,
        originY: 0,
        count: 5,
        speed: 205,
        angle: 40,
        direction: 270,
        delay: 100,
      },
    },
    {
      time: 7,
      type: 'floor',
      params: {
        x: 300,
        y: 450,
        width: 160,
        height: 60,
        warningTime: 1200,
        activeTime: 2400,
        shape: 'circle',
        variant: 'growing',
        growScale: 1.5,
      },
    },
    {
      time: 12,
      type: 'laser',
      params: {
        startX: 0,
        startY: 150,
        endX: 800,
        endY: 500,
        width: 38,
        warningTime: 1200,
        activeTime: 2500,
        bendX: 400,
        bendY: 200,
      },
    },
    {
      time: 17,
      type: 'bullet',
      params: {
        type: 'circle',
        originX: 400,
        originY: 300,
        count: 10,
        speed: 200,
        direction: 0,
        delay: 0,
      },
    },
    {
      time: 22,
      type: 'qte',
      params: {
        sequence: ['Q', 'W', 'E', 'W'],
        timing: 2500,
      },
    },
    {
      time: 27,
      type: 'floor',
      params: {
        x: 100,
        y: 480,
        width: 150,
        height: 60,
        warningTime: 1200,
        activeTime: 2400,
        shape: 'rect',
        variant: 'moving',
        moveToX: 550,
        moveToY: 480,
      },
    },
    {
      time: 32,
      type: 'laser',
      params: {
        startX: 400,
        startY: 0,
        endX: 400,
        endY: 600,
        width: 40,
        warningTime: 1200,
        activeTime: 2500,
      },
    },
    {
      time: 37,
      type: 'qte',
      params: {
        sequence: ['E', 'Q', 'W', 'E'],
        timing: 2500,
      },
    },
  ],
};

/**
 * Stage 13 - ADVANCED: Dense patterns with all gimmick types
 * Fast bullets, tight spacing
 */
const STAGE_13 = {
  stage: 13,
  duration: 40,
  events: [
    {
      time: 2,
      type: 'floor',
      params: {
        x: 300,
        y: 450,
        width: 150,
        height: 60,
        warningTime: 1100,
        activeTime: 2300,
        shape: 'rect',
        variant: 'moving',
        moveToX: 500,
        moveToY: 450,
      },
    },
    {
      time: 6,
      type: 'bullet',
      params: {
        type: 'fan',
        originX: 400,
        originY: 0,
        count: 6,
        speed: 220,
        angle: 45,
        direction: 270,
        delay: 0,
      },
    },
    {
      time: 11,
      type: 'laser',
      params: {
        startX: 0,
        startY: 250,
        endX: 800,
        endY: 350,
        width: 38,
        warningTime: 1100,
        activeTime: 2300,
        bendX: 400,
        bendY: 200,
      },
    },
    {
      time: 16,
      type: 'bullet',
      params: {
        type: 'circle',
        originX: 400,
        originY: 300,
        count: 11,
        speed: 215,
        direction: 0,
        delay: 0,
      },
    },
    {
      time: 21,
      type: 'qte',
      params: {
        sequence: ['Q', 'W', 'E', 'Q', 'W'],
        timing: 2300,
      },
    },
    {
      time: 26,
      type: 'floor',
      params: {
        x: 100,
        y: 480,
        width: 140,
        height: 55,
        warningTime: 1100,
        activeTime: 2300,
        shape: 'circle',
        variant: 'shrinking',
        growScale: 0.5,
      },
    },
    {
      time: 31,
      type: 'laser',
      params: {
        startX: 800,
        startY: 0,
        endX: 0,
        endY: 600,
        width: 40,
        warningTime: 1100,
        activeTime: 2400,
        bendX: 400,
        bendY: 300,
      },
    },
    {
      time: 36,
      type: 'qte',
      params: {
        sequence: ['E', 'W', 'Q', 'E'],
        timing: 2300,
      },
    },
  ],
};

/**
 * Stage 14 - ADVANCED: Complex patterns with tight timing
 * Very fast bullets, dense floor obstacles, complex lasers
 */
const STAGE_14 = {
  stage: 14,
  duration: 40,
  events: [
    {
      time: 2,
      type: 'bullet',
      params: {
        type: 'fan',
        originX: 400,
        originY: 0,
        count: 6,
        speed: 230,
        angle: 45,
        direction: 270,
        delay: 50,
      },
    },
    {
      time: 7,
      type: 'floor',
      params: {
        x: 300,
        y: 450,
        width: 140,
        height: 60,
        warningTime: 1100,
        activeTime: 2300,
        shape: 'rect',
        variant: 'moving',
        moveToX: 500,
        moveToY: 450,
      },
    },
    {
      time: 12,
      type: 'laser',
      params: {
        startX: 0,
        startY: 200,
        endX: 800,
        endY: 400,
        width: 38,
        warningTime: 1100,
        activeTime: 2300,
        bendX: 400,
        bendY: 150,
      },
    },
    {
      time: 17,
      type: 'bullet',
      params: {
        type: 'circle',
        originX: 400,
        originY: 320,
        count: 12,
        speed: 225,
        direction: 0,
        delay: 0,
      },
    },
    {
      time: 22,
      type: 'qte',
      params: {
        sequence: ['Q', 'W', 'E', 'Q', 'W'],
        timing: 2200,
      },
    },
    {
      time: 27,
      type: 'floor',
      params: {
        x: 150,
        y: 480,
        width: 130,
        height: 55,
        warningTime: 1100,
        activeTime: 2300,
        shape: 'circle',
        variant: 'growing',
        growScale: 1.4,
      },
    },
    {
      time: 32,
      type: 'laser',
      params: {
        startX: 400,
        startY: 0,
        endX: 400,
        endY: 600,
        width: 40,
        warningTime: 1100,
        activeTime: 2400,
        bendX: 300,
        bendY: 300,
      },
    },
    {
      time: 37,
      type: 'qte',
      params: {
        sequence: ['W', 'E', 'Q', 'W', 'E'],
        timing: 2200,
      },
    },
  ],
};

/**
 * Stage 15 - BOSS
 * Handled separately by BossScene
 */
const STAGE_15 = {
  stage: 15,
  duration: 0,
  events: [],
};

/**
 * Stage 16 - EXTREME: All gimmick types at high speed
 * Fast bullets (250+), dense patterns, short warnings
 */
const STAGE_16 = {
  stage: 16,
  duration: 45,
  events: [
    {
      time: 2,
      type: 'bullet',
      params: {
        type: 'fan',
        originX: 400,
        originY: 0,
        count: 6,
        speed: 260,
        angle: 45,
        direction: 270,
        delay: 0,
      },
    },
    {
      time: 6,
      type: 'floor',
      params: {
        x: 300,
        y: 450,
        width: 140,
        height: 55,
        warningTime: 1000,
        activeTime: 2200,
        shape: 'rect',
        variant: 'moving',
        moveToX: 500,
        moveToY: 450,
      },
    },
    {
      time: 11,
      type: 'laser',
      params: {
        startX: 0,
        startY: 300,
        endX: 800,
        endY: 300,
        width: 38,
        warningTime: 1000,
        activeTime: 2200,
        bendX: 400,
        bendY: 200,
      },
    },
    {
      time: 16,
      type: 'bullet',
      params: {
        type: 'circle',
        originX: 400,
        originY: 300,
        count: 12,
        speed: 255,
        direction: 0,
        delay: 0,
      },
    },
    {
      time: 21,
      type: 'qte',
      params: {
        sequence: ['Q', 'W', 'E', 'Q'],
        timing: 1800,
      },
    },
    {
      time: 26,
      type: 'floor',
      params: {
        x: 100,
        y: 480,
        width: 130,
        height: 55,
        warningTime: 1000,
        activeTime: 2200,
        shape: 'circle',
        variant: 'shrinking',
        growScale: 0.5,
      },
    },
    {
      time: 31,
      type: 'laser',
      params: {
        startX: 800,
        startY: 0,
        endX: 0,
        endY: 600,
        width: 40,
        warningTime: 1000,
        activeTime: 2300,
        bendX: 400,
        bendY: 300,
      },
    },
    {
      time: 36,
      type: 'bullet',
      params: {
        type: 'fan',
        originX: 400,
        originY: 0,
        count: 7,
        speed: 265,
        angle: 50,
        direction: 270,
        delay: 80,
      },
    },
    {
      time: 41,
      type: 'qte',
      params: {
        sequence: ['E', 'W', 'Q', 'E'],
        timing: 1800,
      },
    },
  ],
};

/**
 * Stage 17 - EXTREME: Very dense patterns with complex interactions
 * Multiple gimmicks overlapping, tight windows
 */
const STAGE_17 = {
  stage: 17,
  duration: 45,
  events: [
    {
      time: 2,
      type: 'bullet',
      params: {
        type: 'fan',
        originX: 400,
        originY: 0,
        count: 7,
        speed: 270,
        angle: 45,
        direction: 270,
        delay: 0,
      },
    },
    {
      time: 6,
      type: 'floor',
      params: {
        x: 300,
        y: 450,
        width: 130,
        height: 55,
        warningTime: 950,
        activeTime: 2100,
        shape: 'rect',
        variant: 'moving',
        moveToX: 500,
        moveToY: 450,
      },
    },
    {
      time: 11,
      type: 'laser',
      params: {
        startX: 0,
        startY: 200,
        endX: 800,
        endY: 400,
        width: 38,
        warningTime: 950,
        activeTime: 2100,
        bendX: 400,
        bendY: 150,
      },
    },
    {
      time: 16,
      type: 'bullet',
      params: {
        type: 'circle',
        originX: 400,
        originY: 300,
        count: 13,
        speed: 265,
        direction: 0,
        delay: 0,
      },
    },
    {
      time: 21,
      type: 'qte',
      params: {
        sequence: ['Q', 'W', 'E', 'Q', 'W'],
        timing: 1700,
      },
    },
    {
      time: 26,
      type: 'floor',
      params: {
        x: 100,
        y: 480,
        width: 130,
        height: 55,
        warningTime: 950,
        activeTime: 2100,
        shape: 'circle',
        variant: 'growing',
        growScale: 1.5,
      },
    },
    {
      time: 31,
      type: 'laser',
      params: {
        startX: 400,
        startY: 0,
        endX: 400,
        endY: 600,
        width: 40,
        warningTime: 950,
        activeTime: 2200,
        bendX: 300,
        bendY: 300,
      },
    },
    {
      time: 37,
      type: 'bullet',
      params: {
        type: 'fan',
        originX: 400,
        originY: 0,
        count: 7,
        speed: 275,
        angle: 50,
        direction: 270,
        delay: 50,
      },
    },
    {
      time: 42,
      type: 'qte',
      params: {
        sequence: ['W', 'E', 'Q', 'W', 'E'],
        timing: 1700,
      },
    },
  ],
};

/**
 * Stage 18 - EXTREME: Overwhelming density with minimal rest
 * Bullets at extreme speeds, multiple simultaneous patterns
 */
const STAGE_18 = {
  stage: 18,
  duration: 45,
  events: [
    {
      time: 2,
      type: 'bullet',
      params: {
        type: 'fan',
        originX: 400,
        originY: 0,
        count: 7,
        speed: 280,
        angle: 50,
        direction: 270,
        delay: 30,
      },
    },
    {
      time: 6,
      type: 'floor',
      params: {
        x: 300,
        y: 450,
        width: 120,
        height: 55,
        warningTime: 900,
        activeTime: 2000,
        shape: 'rect',
        variant: 'moving',
        moveToX: 500,
        moveToY: 450,
      },
    },
    {
      time: 11,
      type: 'laser',
      params: {
        startX: 0,
        startY: 250,
        endX: 800,
        endY: 350,
        width: 38,
        warningTime: 900,
        activeTime: 2000,
        bendX: 400,
        bendY: 200,
      },
    },
    {
      time: 16,
      type: 'bullet',
      params: {
        type: 'circle',
        originX: 400,
        originY: 300,
        count: 14,
        speed: 275,
        direction: 0,
        delay: 0,
      },
    },
    {
      time: 21,
      type: 'qte',
      params: {
        sequence: ['Q', 'W', 'E', 'Q', 'W'],
        timing: 1600,
      },
    },
    {
      time: 26,
      type: 'floor',
      params: {
        x: 150,
        y: 480,
        width: 120,
        height: 50,
        warningTime: 900,
        activeTime: 2000,
        shape: 'circle',
        variant: 'shrinking',
        growScale: 0.5,
      },
    },
    {
      time: 31,
      type: 'laser',
      params: {
        startX: 800,
        startY: 0,
        endX: 0,
        endY: 600,
        width: 40,
        warningTime: 900,
        activeTime: 2100,
        bendX: 400,
        bendY: 300,
      },
    },
    {
      time: 37,
      type: 'bullet',
      params: {
        type: 'fan',
        originX: 400,
        originY: 0,
        count: 8,
        speed: 285,
        angle: 50,
        direction: 270,
        delay: 40,
      },
    },
    {
      time: 42,
      type: 'qte',
      params: {
        sequence: ['E', 'Q', 'W', 'E', 'Q'],
        timing: 1600,
      },
    },
  ],
};

/**
 * Stage 19 - EXTREME: Absolute maximum difficulty
 * Fastest bullets (300+), most dense patterns, minimal warnings
 */
const STAGE_19 = {
  stage: 19,
  duration: 45,
  events: [
    {
      time: 2,
      type: 'bullet',
      params: {
        type: 'fan',
        originX: 400,
        originY: 0,
        count: 8,
        speed: 300,
        angle: 50,
        direction: 270,
        delay: 0,
      },
    },
    {
      time: 6,
      type: 'floor',
      params: {
        x: 300,
        y: 450,
        width: 120,
        height: 50,
        warningTime: 850,
        activeTime: 2000,
        shape: 'rect',
        variant: 'moving',
        moveToX: 500,
        moveToY: 450,
      },
    },
    {
      time: 11,
      type: 'laser',
      params: {
        startX: 0,
        startY: 200,
        endX: 800,
        endY: 400,
        width: 38,
        warningTime: 850,
        activeTime: 2000,
        bendX: 400,
        bendY: 150,
      },
    },
    {
      time: 16,
      type: 'bullet',
      params: {
        type: 'circle',
        originX: 400,
        originY: 300,
        count: 15,
        speed: 295,
        direction: 0,
        delay: 0,
      },
    },
    {
      time: 21,
      type: 'qte',
      params: {
        sequence: ['Q', 'W', 'E', 'Q', 'W'],
        timing: 1500,
      },
    },
    {
      time: 26,
      type: 'floor',
      params: {
        x: 100,
        y: 480,
        width: 120,
        height: 50,
        warningTime: 850,
        activeTime: 1950,
        shape: 'circle',
        variant: 'growing',
        growScale: 1.5,
      },
    },
    {
      time: 31,
      type: 'laser',
      params: {
        startX: 400,
        startY: 0,
        endX: 400,
        endY: 600,
        width: 40,
        warningTime: 850,
        activeTime: 2000,
        bendX: 300,
        bendY: 300,
      },
    },
    {
      time: 37,
      type: 'bullet',
      params: {
        type: 'fan',
        originX: 400,
        originY: 0,
        count: 8,
        speed: 305,
        angle: 55,
        direction: 270,
        delay: 50,
      },
    },
    {
      time: 42,
      type: 'qte',
      params: {
        sequence: ['W', 'E', 'Q', 'W', 'E'],
        timing: 1500,
      },
    },
  ],
};

/**
 * Stage 20 - BOSS
 * Handled separately by BossScene
 */
const STAGE_20 = {
  stage: 20,
  duration: 0,
  events: [],
};

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
// 복합 floor 패턴 이벤트 추가 (난이도 그룹별, 무작위 burst).
//
// 모듈 로드 시점(=페이지 새로고침)마다 randomFloorPatternEvents가
// 그룹의 패턴 풀에서 무작위 추출 + 무작위 시간 분산하여 events에 push한다.
// → 매 세션 다른 패턴 mix, 같은 시간대에 패턴이 자연스럽게 겹쳐 dense한
//    "마구 섞이는" 느낌을 만든다.
//
// count, startTime, endTime 튜닝은 floorPatterns.js의 한 곳에 모인 것은
// 아니지만(stage별로 상이), 그룹 단위로 일관된 값을 쓰므로 조정 시 검색·교체가 쉽다.
// 그룹별 등장 패턴 풀은 floorPatterns.js의 GROUP_PATTERN_POOLS에서 관리.
// ─────────────────────────────────────────────────────────

// Tutorial group (stages 1-4): duration 30s, count 6 → 평균 ~4초 간격
STAGE_1.events.push(...randomFloorPatternEvents('tutorial', { count: 6, endTime: 28 }));
STAGE_2.events.push(...randomFloorPatternEvents('tutorial', { count: 6, endTime: 28 }));
STAGE_3.events.push(...randomFloorPatternEvents('tutorial', { count: 6, endTime: 28 }));
STAGE_4.events.push(...randomFloorPatternEvents('tutorial', { count: 6, endTime: 28 }));

// Growth group (stages 6-9): duration 35s, count 8 → 평균 ~4초 간격
STAGE_6.events.push(...randomFloorPatternEvents('growth', { count: 8, endTime: 33 }));
STAGE_7.events.push(...randomFloorPatternEvents('growth', { count: 8, endTime: 33 }));
STAGE_8.events.push(...randomFloorPatternEvents('growth', { count: 8, endTime: 33 }));
STAGE_9.events.push(...randomFloorPatternEvents('growth', { count: 8, endTime: 33 }));

// Challenge group (stages 11-14): duration 40s, count 10 → 평균 ~3.6초 간격
STAGE_11.events.push(...randomFloorPatternEvents('challenge', { count: 10, endTime: 38 }));
STAGE_12.events.push(...randomFloorPatternEvents('challenge', { count: 10, endTime: 38 }));
STAGE_13.events.push(...randomFloorPatternEvents('challenge', { count: 10, endTime: 38 }));
STAGE_14.events.push(...randomFloorPatternEvents('challenge', { count: 10, endTime: 38 }));

// Hell group (stages 16-19): duration 45s, count 14 → 평균 ~3초 간격
STAGE_16.events.push(...randomFloorPatternEvents('hell', { count: 14, endTime: 43 }));
STAGE_17.events.push(...randomFloorPatternEvents('hell', { count: 14, endTime: 43 }));
STAGE_18.events.push(...randomFloorPatternEvents('hell', { count: 14, endTime: 43 }));
STAGE_19.events.push(...randomFloorPatternEvents('hell', { count: 14, endTime: 43 }));

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

// Export functions and constants
export { getStagePattern, STAGE_CONFIGS, STAGE_PATTERNS };
