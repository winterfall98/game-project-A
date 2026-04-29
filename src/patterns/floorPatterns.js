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
 * 그룹별로 등장 가능한 패턴 풀.
 * randomFloorPatternEvents가 이 풀에서 무작위 추출한다.
 *
 * 새 패턴을 그룹에 등장시키려면 여기에 이름만 추가하면 된다.
 */
export const GROUP_PATTERN_POOLS = {
  tutorial:  ['orbit', 'sweep'],
  growth:    ['orbit', 'sweep', 'checker'],
  challenge: ['orbit', 'sweep', 'checker', 'radial'],
  hell:      ['orbit', 'sweep', 'checker', 'radial', 'scatter'],
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

/**
 * 무작위 burst 이벤트 생성기.
 * 스테이지의 [startTime, endTime] 구간에 count개의 floorPattern 이벤트를
 * 무작위 시간/무작위 패턴으로 분산하여 생성한다. 모듈 로드 시점(=페이지
 * 새로고침)마다 새로 셔플되므로 매 세션 다른 mix가 나온다.
 *
 * 같은 시간/근접 시간에 여러 패턴이 떨어질 수 있어 자연스럽게 시각적으로
 * 겹치는 효과가 난다.
 *
 * @param {string} group - 'tutorial' | 'growth' | 'challenge' | 'hell'
 * @param {object} options
 * @param {number} options.count - 생성할 패턴 수
 * @param {number} options.endTime - 분산 구간 끝(초). 보통 stage.duration - 2.
 * @param {number} [options.startTime=4] - 분산 구간 시작(초). 너무 이르면 0.
 * @param {string[]} [options.pool] - GROUP_PATTERN_POOLS를 덮어쓰고 싶을 때
 * @returns {Array<object>} STAGE_N.events.push(...) 으로 spread 가능한 이벤트 배열
 */
export function randomFloorPatternEvents(group, options) {
  const { count, endTime, startTime = 4, pool = GROUP_PATTERN_POOLS[group] } = options;
  if (!pool || pool.length === 0) {
    throw new Error(`randomFloorPatternEvents: unknown group '${group}'`);
  }
  if (typeof endTime !== 'number') {
    throw new Error('randomFloorPatternEvents: endTime is required');
  }

  const events = [];
  for (let i = 0; i < count; i++) {
    const time = parseFloat((startTime + Math.random() * (endTime - startTime)).toFixed(1));
    const name = pool[Math.floor(Math.random() * pool.length)];
    events.push({
      time,
      type: 'floorPattern',
      params: buildFloorPatternParams(name, group),
    });
  }
  return events;
}

// ─────────────────────────────────────────────────────────
// 패턴 함수들
// 모든 함수 시그니처: (scene, floorManager, params) => void
// 각 함수는 시간차로 floorManager.spawn(...)을 여러 번 호출하여
// 의도된 회피 기믹을 만든다.
// ─────────────────────────────────────────────────────────

/** @type {(scene: Phaser.Scene, floorManager: any, params: object) => void} */
export function orbit(scene, floorManager, params) {
  const cfg = { ...DEFAULTS.orbit, ...params };

  // 호출 시점의 플레이어 위치를 캡쳐 (이후 추적하지 않음)
  const player = scene.player;
  const cx = player ? player.x : GAME_WIDTH / 2;
  const cy = player ? player.y : GAME_HEIGHT / 2;

  const sign = cfg.direction === 'ccw' ? -1 : 1;
  const angleStep = (Math.PI * 2) / cfg.count;

  for (let i = 0; i < cfg.count; i++) {
    const angle = sign * angleStep * i;
    const x = cx + Math.cos(angle) * cfg.radius;
    const y = cy + Math.sin(angle) * cfg.radius;

    scene.time.delayedCall(cfg.step * i, () => {
      floorManager.spawn({
        x, y,
        width: cfg.floorRadius * 2,
        height: cfg.floorRadius * 2,
        shape: 'circle',
        variant: 'normal',
        warningTime: cfg.warningTime,
        activeTime: cfg.activeTime,
      });
    });
  }
}

export function sweep(scene, floorManager, params) {
  const cfg = { ...DEFAULTS.sweep, ...params };
  const horizontal = cfg.axis === 'horizontal';

  // 평행선의 중심선 좌표 계산
  // lines=1: 화면 중앙 한 줄
  // lines=2: 중심에서 ±gap/2
  // lines=3: 중심 + ±gap
  const centers = [];
  if (cfg.lines === 1) {
    centers.push(horizontal ? GAME_HEIGHT / 2 : GAME_WIDTH / 2);
  } else {
    const baseAxisLen = horizontal ? GAME_HEIGHT : GAME_WIDTH;
    const center = baseAxisLen / 2;
    const totalSpan = (cfg.lines - 1) * cfg.gap;
    const start = center - totalSpan / 2;
    for (let i = 0; i < cfg.lines; i++) {
      centers.push(start + cfg.gap * i);
    }
  }

  // 각 선을 시간차로 spawn
  centers.forEach((centerCoord, i) => {
    scene.time.delayedCall(cfg.lineDelay * i, () => {
      const sweepParams = horizontal
        ? {
            x: GAME_WIDTH / 2,
            y: centerCoord,
            width: GAME_WIDTH,
            height: cfg.thickness,
          }
        : {
            x: centerCoord,
            y: GAME_HEIGHT / 2,
            width: cfg.thickness,
            height: GAME_HEIGHT,
          };

      floorManager.spawn({
        ...sweepParams,
        shape: 'rect',
        variant: 'normal',
        warningTime: cfg.warningTime,
        activeTime: cfg.activeTime,
      });
    });
  });
}

export function checker(scene, floorManager, params) {
  const cfg = { ...DEFAULTS.checker, ...params };

  const cellW = GAME_WIDTH / cfg.cols;
  const cellH = GAME_HEIGHT / cfg.rows;
  const innerW = cellW * cfg.cellInset;
  const innerH = cellH * cfg.cellInset;

  // 페이즈별 셀 좌표 수집
  const phase1Cells = [];
  const phase2Cells = [];
  for (let r = 0; r < cfg.rows; r++) {
    for (let c = 0; c < cfg.cols; c++) {
      const x = cellW * c + cellW / 2;
      const y = cellH * r + cellH / 2;
      if ((c + r) % 2 === 0) {
        phase1Cells.push({ x, y });
      } else {
        phase2Cells.push({ x, y });
      }
    }
  }

  const spawnCells = (cells) => {
    cells.forEach((pos) => {
      floorManager.spawn({
        x: pos.x,
        y: pos.y,
        width: innerW,
        height: innerH,
        shape: 'rect',
        variant: 'normal',
        warningTime: cfg.warningTime,
        activeTime: cfg.activeTime,
      });
    });
  };

  // 페이즈 1: 즉시
  spawnCells(phase1Cells);
  // 페이즈 2: phaseDelay 후
  scene.time.delayedCall(cfg.phaseDelay, () => spawnCells(phase2Cells));
}

export function radial(scene, floorManager, params) {
  const cfg = { ...DEFAULTS.radial, ...params };

  for (let r = 0; r < cfg.rings; r++) {
    const ringRadius = cfg.innerRadius + cfg.ringThickness * r;
    const circumference = 2 * Math.PI * ringRadius;
    // ring 둘레에 작은 장판 배치 (ringSegmentSpacing 간격)
    const segCount = Math.max(6, Math.ceil(circumference / cfg.ringSegmentSpacing));
    const angleStep = (Math.PI * 2) / segCount;

    scene.time.delayedCall(cfg.step * r, () => {
      for (let i = 0; i < segCount; i++) {
        const angle = angleStep * i;
        const x = cfg.centerX + Math.cos(angle) * ringRadius;
        const y = cfg.centerY + Math.sin(angle) * ringRadius;
        // 화면 밖으로 나간 segment는 skip (성능 + 시각 정리)
        if (x < -50 || x > GAME_WIDTH + 50 || y < -50 || y > GAME_HEIGHT + 50) continue;

        floorManager.spawn({
          x, y,
          width: cfg.floorRadius * 2,
          height: cfg.floorRadius * 2,
          shape: 'circle',
          variant: 'normal',
          warningTime: cfg.warningTime,
          activeTime: cfg.activeTime,
        });
      }
    });
  }
}

export function scatter(scene, floorManager, params) {
  const cfg = { ...DEFAULTS.scatter, ...params };

  const positions = [];
  for (let i = 0; i < cfg.count; i++) {
    let chosen = null;
    for (let attempt = 0; attempt < cfg.retries; attempt++) {
      const candidate = {
        x: Phaser.Math.Between(cfg.margin, GAME_WIDTH - cfg.margin),
        y: Phaser.Math.Between(cfg.margin, GAME_HEIGHT - cfg.margin),
      };
      const tooClose = positions.some(
        (p) => Phaser.Math.Distance.Between(p.x, p.y, candidate.x, candidate.y) < cfg.minDistance
      );
      if (!tooClose) { chosen = candidate; break; }
      chosen = candidate; // 마지막 후보는 fallback으로 채택
    }
    positions.push(chosen);
  }

  positions.forEach((pos, i) => {
    scene.time.delayedCall(cfg.spawnInterval * i, () => {
      floorManager.spawn({
        x: pos.x,
        y: pos.y,
        width: cfg.floorRadius * 2,
        height: cfg.floorRadius * 2,
        shape: 'circle',
        variant: 'normal',
        warningTime: cfg.warningTime,
        activeTime: cfg.activeTime,
      });
    });
  });
}

// 이름→함수 맵 (GimmickManager가 디스패치에 사용)
export const FLOOR_PATTERNS = { orbit, sweep, checker, radial, scatter };
