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

export { STAGE_16, STAGE_17, STAGE_18, STAGE_19, STAGE_20 };
