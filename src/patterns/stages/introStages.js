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

export { STAGE_1, STAGE_2, STAGE_3, STAGE_4, STAGE_5 };
