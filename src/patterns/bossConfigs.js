/**
 * Boss configuration data for stages 5, 10, 15, 20
 * Each config defines HP, phases, attack patterns, and counter QTE windows
 */

import { GAME_WIDTH, GAME_HEIGHT } from '../constants/game.js';

/**
 * Boss 1 - Stage 5 (GUARDIAN)
 * 1 phase, basic patterns: charge + fan bullets
 */
const BOSS_1 = {
  bossIndex: 0,
  maxHP: 400,
  attackCooldown: { min: 2500, max: 4000 },
  phases: [
    {
      hpThreshold: 1.0,
      speedMult: 1.0,
      patterns: ['charge', 'fan_bullets', 'fan_bullets'],
    },
  ],
  attacks: {
    charge: {
      damage: 20,
      speed: 250,
      counterWindow: 1200,
    },
    fan_bullets: {
      count: 8,
      speed: 150,
      angle: 160,
    },
  },
  qteInterval: 10000,
  qteDamage: 40,
  qteCount: 3,
  qteTiming: 1500,
};

/**
 * Boss 2 - Stage 10 (WARDEN)
 * 2 phases: adds laser at phase 2, speed 1.3x
 */
const BOSS_2 = {
  bossIndex: 1,
  maxHP: 600,
  attackCooldown: { min: 2000, max: 3500 },
  phases: [
    {
      hpThreshold: 1.0,
      speedMult: 1.0,
      patterns: ['charge', 'fan_bullets', 'laser'],
    },
    {
      hpThreshold: 0.5,
      speedMult: 1.3,
      patterns: ['charge', 'fan_bullets', 'laser', 'floor', 'circle_bullets'],
    },
  ],
  attacks: {
    charge: { damage: 25, speed: 300, counterWindow: 1000 },
    fan_bullets: { count: 12, speed: 180, angle: 180 },
    laser: {
      width: 28,
      warningTime: 1000,
      activeTime: 700,
    },
    floor: {
      width: 120, height: 120,
      warningTime: 1200, activeTime: 1000,
    },
    circle_bullets: { count: 20, speed: 140 },
  },
  qteInterval: 8000,
  qteDamage: 50,
  qteCount: 3,
  qteTiming: 1400,
};

/**
 * Boss 3 - Stage 15 (OVERLORD)
 * 3 phases: increasing aggression, floor density in phase 3
 */
const BOSS_3 = {
  bossIndex: 2,
  maxHP: 800,
  attackCooldown: { min: 1800, max: 3000 },
  phases: [
    {
      hpThreshold: 1.0,
      speedMult: 1.0,
      patterns: ['charge', 'fan_bullets', 'laser', 'floor'],
    },
    {
      hpThreshold: 0.6,
      speedMult: 1.2,
      patterns: ['charge', 'circle_bullets', 'laser', 'floor', 'aimed_bullets'],
    },
    {
      hpThreshold: 0.3,
      speedMult: 1.5,
      patterns: ['charge', 'circle_bullets', 'laser', 'floor', 'aimed_bullets', 'multi_laser'],
    },
  ],
  attacks: {
    charge: { damage: 30, speed: 350, counterWindow: 900 },
    fan_bullets: { count: 14, speed: 200, angle: 200 },
    circle_bullets: { count: 24, speed: 160 },
    aimed_bullets: { count: 6, speed: 220, spread: 40, delay: 100 },
    laser: { width: 24, warningTime: 900, activeTime: 600 },
    multi_laser: { count: 3, width: 20, warningTime: 800, activeTime: 600 },
    floor: { width: 130, height: 130, warningTime: 1000, activeTime: 1200 },
  },
  qteInterval: 7000,
  qteDamage: 60,
  qteCount: 4,
  qteTiming: 1300,
};

/**
 * Boss 4 - Stage 20 (FINAL BOSS)
 * Time limit 90s, arena shrinks, final QTE sequence at 0 HP
 */
const BOSS_4 = {
  bossIndex: 3,
  maxHP: 1000,
  attackCooldown: { min: 1500, max: 2500 },
  timeLimit: 90,
  arenaShrink: true,
  phases: [
    {
      hpThreshold: 1.0,
      speedMult: 1.0,
      patterns: ['charge', 'fan_bullets', 'laser', 'floor'],
    },
    {
      hpThreshold: 0.7,
      speedMult: 1.2,
      patterns: ['charge', 'circle_bullets', 'multi_laser', 'floor', 'aimed_bullets'],
    },
    {
      hpThreshold: 0.4,
      speedMult: 1.4,
      patterns: ['charge', 'circle_bullets', 'multi_laser', 'floor', 'aimed_bullets', 'fan_bullets'],
    },
    {
      hpThreshold: 0.15,
      speedMult: 1.7,
      patterns: ['charge', 'circle_bullets', 'multi_laser', 'aimed_bullets', 'barrage'],
    },
  ],
  attacks: {
    charge: { damage: 35, speed: 400, counterWindow: 800 },
    fan_bullets: { count: 16, speed: 220, angle: 220 },
    circle_bullets: { count: 28, speed: 180 },
    aimed_bullets: { count: 8, speed: 250, spread: 50, delay: 80 },
    laser: { width: 28, warningTime: 800, activeTime: 600 },
    multi_laser: { count: 4, width: 22, warningTime: 700, activeTime: 500 },
    floor: { width: 140, height: 140, warningTime: 900, activeTime: 1500 },
    barrage: { count: 32, speed: 200 },
  },
  qteInterval: 6000,
  qteDamage: 80,
  qteCount: 5,
  qteTiming: 1100,
  finalQTE: {
    count: 7,
    timing: 1000,
    failHPRecover: 100,
  },
};

/**
 * Get boss config by stage number
 */
export function getBossConfig(stage) {
  switch (stage) {
    case 5:  return BOSS_1;
    case 10: return BOSS_2;
    case 15: return BOSS_3;
    case 20: return BOSS_4;
    default: return null;
  }
}

export { BOSS_1, BOSS_2, BOSS_3, BOSS_4 };
