// src/patterns/floorPatterns.js
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants/game.js';

/**
 * 복합 floor 패턴 모듈
 *
 * 단일 floor 장판을 시간차/공간차로 여러 개 spawn하여
 * 의도된 회피 기믹을 만든다.
 *
 * 모든 magic number는 아래 DEFAULTS / DIFFICULTY_TUNING에 모여 있어
 * 밸런스 조정을 한 곳에서 끝낼 수 있다.
 */

// ─────────────────────────────────────────────────────────
// 패턴별 기본 파라미터. params에 값이 없으면 이 값이 사용된다.
// ─────────────────────────────────────────────────────────
export const DEFAULTS = {
  orbit: {
    count: 8,            // 원주 위 장판 개수
    radius: 100,         // 플레이어로부터의 반경(px)
    floorRadius: 26,     // 각 장판의 반지름(px)
    step: 120,           // 다음 장판 발동까지 시간차(ms)
    direction: 'cw',     // 'cw' | 'ccw'
    warningTime: 800,
    activeTime: 600,
  },
  sweep: {
    axis: 'horizontal',  // 'horizontal' | 'vertical'
    lines: 1,            // 평행선 개수
    thickness: 50,       // 선 두께(px)
    gap: 80,             // 평행선 사이 간격(px)
    warningTime: 1200,
    activeTime: 800,
    lineDelay: 300,      // 선들 사이의 발동 시간차(ms, 0=동시)
  },
  checker: {
    cols: 5,             // 가로 칸 수
    rows: 3,             // 세로 칸 수
    phaseDelay: 700,     // 페이즈 1과 2 사이 ms
    cellInset: 0.8,      // 셀 내부 사용 비율 (1.0=꽉, 0.8=약간 여백)
    warningTime: 900,
    activeTime: 600,
  },
  radial: {
    centerX: GAME_WIDTH / 2,
    centerY: GAME_HEIGHT / 2,
    rings: 4,            // ring 개수
    innerRadius: 60,     // 첫 ring의 안쪽 반지름
    ringThickness: 50,   // ring 두께(=다음 ring과의 거리)
    step: 250,           // ring 사이 발동 시간차(ms)
    ringSegmentSpacing: 40, // ring 둘레의 작은 장판 간 간격
    floorRadius: 22,     // ring 둘레 작은 장판의 반지름
    warningTime: 700,
    activeTime: 500,
  },
  scatter: {
    count: 8,            // 장판 개수
    floorRadius: 32,
    spawnInterval: 80,   // 장판 발동 간 시간차(ms)
    margin: 60,          // 화면 가장자리 여백
    minDistance: 90,     // 동시 활성 장판 간 최소 거리
    retries: 5,          // minDistance 보장 재추첨 횟수
    warningTime: 700,
    activeTime: 500,
  },
};

// ─────────────────────────────────────────────────────────
// 난이도 그룹별 튜닝.
// stagePatterns.js의 헬퍼가 이 값을 default 위에 덮어씌운다.
// ─────────────────────────────────────────────────────────
export const DIFFICULTY_TUNING = {
  tutorial: {  // stages 1-4
    orbit: { count: 6, step: 150, radius: 110 },
    sweep: { lines: 1, lineDelay: 0, warningTime: 1400 },
  },
  growth: {    // stages 6-9
    orbit: { count: 8, step: 130 },
    sweep: { lines: 2, lineDelay: 250 },
    checker: { cols: 5, rows: 3, phaseDelay: 750 },
  },
  challenge: { // stages 11-14
    orbit: { count: 8, step: 110 },
    sweep: { lines: 3, lineDelay: 220 },
    checker: { cols: 6, rows: 3, phaseDelay: 700 },
    radial: { rings: 3, step: 280 },
  },
  hell: {      // stages 16-19
    orbit: { count: 10, step: 95 },
    sweep: { lines: 3, lineDelay: 180 },
    checker: { cols: 7, rows: 4, phaseDelay: 600 },
    radial: { rings: 5, step: 220 },
    scatter: { count: 10, spawnInterval: 70 },
  },
};

/**
 * stagePatterns.js에서 사용하는 헬퍼.
 * 그룹/패턴 이름만 적으면 DIFFICULTY_TUNING이 자동 적용된 params를 만들어준다.
 *
 * @param {string} name  - 'orbit' | 'sweep' | 'checker' | 'radial' | 'scatter'
 * @param {string} group - 'tutorial' | 'growth' | 'challenge' | 'hell'
 * @param {object} overrides - 스테이지별 특수 조정 (선택)
 * @returns {object} GimmickManager에 넘길 params
 */
export function buildFloorPatternParams(name, group, overrides = {}) {
  const groupTuning = (DIFFICULTY_TUNING[group] && DIFFICULTY_TUNING[group][name]) || {};
  return { name, ...groupTuning, ...overrides };
}

// ─────────────────────────────────────────────────────────
// 패턴 함수들 (다음 task부터 구현)
// ─────────────────────────────────────────────────────────

/** @type {(scene: Phaser.Scene, floorManager: any, params: object) => void} */
export function orbit(scene, floorManager, params) {
  // 다음 task에서 구현
}

export function sweep(scene, floorManager, params) {
  // 다음 task에서 구현
}

export function checker(scene, floorManager, params) {
  // 다음 task에서 구현
}

export function radial(scene, floorManager, params) {
  // 다음 task에서 구현
}

export function scatter(scene, floorManager, params) {
  // 다음 task에서 구현
}

// 이름→함수 맵 (GimmickManager가 디스패치에 사용)
export const FLOOR_PATTERNS = { orbit, sweep, checker, radial, scatter };
