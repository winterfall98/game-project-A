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

export { STAGE_11, STAGE_12, STAGE_13, STAGE_14, STAGE_15 };
