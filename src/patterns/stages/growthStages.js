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

export { STAGE_6, STAGE_7, STAGE_8, STAGE_9, STAGE_10 };
