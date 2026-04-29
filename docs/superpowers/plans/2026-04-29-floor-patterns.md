# Floor Patterns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phaser 3 게임에 5종의 복합 floor 패턴(ORBIT/SWEEP/CHECKER/RADIAL/SCATTER)을 추가하고, 난이도 그룹별로 등장하도록 stage events를 갱신한다.

**Architecture:** 새 모듈 `src/patterns/floorPatterns.js`에 패턴 함수 5개 + 튜닝 가능한 const 객체(`DEFAULTS`, `DIFFICULTY_TUNING`) + 헬퍼 함수를 둔다. GimmickManager는 `'floorPattern'` 이벤트 타입을 받아 패턴 함수에 디스패치한다. stagePatterns.js는 새 헬퍼로 깔끔하게 이벤트를 추가한다.

**Tech Stack:** JavaScript ES Modules, Phaser 3.90, Vite 8 (테스트 프레임워크 없음 — 검증은 빌드 + 시각 확인).

**테스트 전략 메모:** 이 코드베이스에는 단위 테스트 인프라가 없다(package.json에 vitest/jest 없음). 따라서 TDD 사이클 대신 **빌드 + 콘솔 검증 + 사용자 플레이 테스트**로 검증한다. 새 의존성 추가는 spec scope 밖이므로 도입하지 않는다.

**참고 spec:** [docs/superpowers/specs/2026-04-29-floor-patterns-design.md](../specs/2026-04-29-floor-patterns-design.md)

---

## File Structure

| 파일 | 역할 | 작업 |
|-----|------|-----|
| `src/patterns/floorPatterns.js` | 5개 패턴 함수 + 상수 + 헬퍼 | 신규 |
| `src/systems/GimmickManager.js` | `'floorPattern'` 케이스 디스패치 | 수정 |
| `src/patterns/stagePatterns.js` | 그룹별 floorPattern 이벤트 추가 | 수정 |

---

### Task 1: floorPatterns.js 모듈 골격 + 상수

**Files:**
- Create: `src/patterns/floorPatterns.js`

목적: 빈 모듈을 만들고 spec에 정의된 모든 magic number를 한 곳에 모은
`DEFAULTS`, `DIFFICULTY_TUNING` 객체와 헬퍼 함수를 정의한다. 패턴 함수
본체는 비워두고 다음 task부터 채운다.

- [ ] **Step 1: 파일 생성 (전체 내용)**

```javascript
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
```

- [ ] **Step 2: 빌드 검증**

Run:
```bash
npm run build
```
Expected: `✓ built in <Ns>` (no errors)

- [ ] **Step 3: 커밋**

```bash
git add src/patterns/floorPatterns.js
git commit -m "feat(floor-patterns): scaffold module with DEFAULTS and DIFFICULTY_TUNING

Adds empty pattern functions, tunable constants for all 5 patterns,
difficulty-group tuning table, and buildFloorPatternParams helper.
Pattern bodies are filled in subsequent commits.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 2: ORBIT 패턴 구현

**Files:**
- Modify: `src/patterns/floorPatterns.js`

목적: 플레이어 현재 위치를 원점으로, 반경 R의 원주에 N개 작은 원형 장판을
시계/반시계 방향 차례로 발동.

- [ ] **Step 1: orbit() 함수 본체 구현**

`floorPatterns.js`의 `orbit` 함수 자리(`// 다음 task에서 구현` placeholder)를 다음으로 교체:

```javascript
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
```

- [ ] **Step 2: 빌드 검증**

Run: `npm run build`
Expected: `✓ built` (no errors)

- [ ] **Step 3: 콘솔 sanity check (선택)**

dev 서버에서 `window.__test_orbit = () => { ... }` 같은 디버그 호출은
이 작업에선 추가하지 않는다 (코드 노이즈 방지). 대신 Task 8 이후 stage
이벤트로 등장하므로 그때 직접 확인한다.

- [ ] **Step 4: 커밋**

```bash
git add src/patterns/floorPatterns.js
git commit -m "feat(floor-patterns): implement ORBIT pattern

Spawns N circular floors around the player's captured position,
sequentially in cw/ccw direction with time step.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 3: SWEEP 패턴 구현

**Files:**
- Modify: `src/patterns/floorPatterns.js`

목적: 길고 얇은 직사각형 장판이 맵을 가로 또는 세로 방향으로 한 줄 또는
평행 다중선으로 가로지름.

- [ ] **Step 1: sweep() 함수 본체 구현**

`floorPatterns.js`의 `sweep` placeholder를 다음으로 교체:

```javascript
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
      const params = horizontal
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
        ...params,
        shape: 'rect',
        variant: 'normal',
        warningTime: cfg.warningTime,
        activeTime: cfg.activeTime,
      });
    });
  });
}
```

- [ ] **Step 2: 빌드 검증**

Run: `npm run build`
Expected: `✓ built` (no errors)

- [ ] **Step 3: 커밋**

```bash
git add src/patterns/floorPatterns.js
git commit -m "feat(floor-patterns): implement SWEEP pattern

Spawns 1+ thin parallel rectangle floors crossing the map
horizontally or vertically, with optional time offset between lines.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 4: CHECKER 패턴 구현

**Files:**
- Modify: `src/patterns/floorPatterns.js`

목적: 맵을 cols×rows 격자로 나눠 체크무늬 절반 칸 동시 발동 후, 잠시 뒤
나머지 절반 칸 발동.

- [ ] **Step 1: checker() 함수 본체 구현**

`floorPatterns.js`의 `checker` placeholder를 다음으로 교체:

```javascript
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
```

- [ ] **Step 2: 빌드 검증**

Run: `npm run build`
Expected: `✓ built` (no errors)

- [ ] **Step 3: 커밋**

```bash
git add src/patterns/floorPatterns.js
git commit -m "feat(floor-patterns): implement CHECKER pattern

Splits the map into cols x rows grid, spawns checkerboard half
simultaneously, then the other half after phaseDelay.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 5: RADIAL 패턴 구현

**Files:**
- Modify: `src/patterns/floorPatterns.js`

목적: 중심점에서 점점 큰 ring이 외곽으로 차례 확산. ring은 둘레의 작은
원형 장판들로 근사.

- [ ] **Step 1: radial() 함수 본체 구현**

`floorPatterns.js`의 `radial` placeholder를 다음으로 교체:

```javascript
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
```

- [ ] **Step 2: 빌드 검증**

Run: `npm run build`
Expected: `✓ built` (no errors)

- [ ] **Step 3: 커밋**

```bash
git add src/patterns/floorPatterns.js
git commit -m "feat(floor-patterns): implement RADIAL pattern

Concentric expanding rings approximated by small circular floors
spaced around each ring circumference, expanding outward over time.
Off-screen segments are skipped.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 6: SCATTER 패턴 구현

**Files:**
- Modify: `src/patterns/floorPatterns.js`

목적: 맵 전체에 무작위 위치로 작은 원형 장판들이 짧은 시간차로 발동. 동시
활성 장판 간 minDistance를 보장(최대 5회 재추첨).

- [ ] **Step 1: scatter() 함수 본체 구현**

`floorPatterns.js`의 `scatter` placeholder를 다음으로 교체:

```javascript
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
```

- [ ] **Step 2: 빌드 검증**

Run: `npm run build`
Expected: `✓ built` (no errors)

- [ ] **Step 3: 커밋**

```bash
git add src/patterns/floorPatterns.js
git commit -m "feat(floor-patterns): implement SCATTER pattern

Spawns N small circular floors at random positions with minDistance
spacing (up to 5 retries per slot, fallback to last candidate),
each delayed by spawnInterval.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 7: GimmickManager에 'floorPattern' 디스패치 추가

**Files:**
- Modify: `src/systems/GimmickManager.js`

목적: stagePatterns의 events에서 `type: 'floorPattern'`이 들어오면 새 패턴
함수로 라우팅. 추가로 `_amplifyPattern` / `_convertToEasy`가 floorPattern을
의도치 않게 변형하지 않도록 가드.

GimmickManager의 `_randomizeParams`는 switch 문에 명시되지 않은 type은
그대로 통과시키므로 별도 가드 불필요(자동 통과).

- [ ] **Step 1: import 추가**

`src/systems/GimmickManager.js`의 상단 import 블록(line 1~2):

기존:
```javascript
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants/game.js';
```

다음 줄을 추가:
```javascript
import { FLOOR_PATTERNS } from '../patterns/floorPatterns.js';
```

- [ ] **Step 2: `_spawnGimmick` switch에 케이스 추가**

`_spawnGimmick(type, params)` 메서드의 switch 블록(line 64~94)에서, `case 'qte':` 블록과 `default:` 사이에 다음 케이스 추가:

```javascript
case 'floorPattern': {
  const fn = FLOOR_PATTERNS[p.name];
  if (!fn) {
    console.warn('[GimmickManager] unknown floorPattern:', p.name);
    break;
  }
  fn(this.scene, this.floorManager, p);
  break;
}
```

(주의: `p`는 `_randomizeParams`를 거친 변수. floorPattern은 switch에 없어서 그대로 통과되므로 spawn 위치를 패턴 자체가 결정한다.)

- [ ] **Step 3: `_convertToEasy`에서 floorPattern 제외**

`_convertToEasy(events)` 메서드(line 173~209)의 switch 블록에 `case 'floorPattern':` 추가하여 easy 모드에서는 패턴을 제거:

기존:
```javascript
        switch (e.type) {
          case 'bullet':
            ...
            break;

          case 'floor':
            floorCount++;
            if (floorCount > 2) return null;
            break;
```

위 switch의 `case 'floor':` 직후에 추가:

```javascript
          case 'floorPattern':
            // easy 모드에서는 복합 패턴 제거 (난이도 단순화)
            return null;
```

- [ ] **Step 4: `_amplifyPattern`이 floorPattern을 복제하지 않도록 가드**

`_amplifyPattern(events, stage, duration)` 메서드(line 218~277)에서 `nonQteEvents` 정의를 수정:

기존(line 233):
```javascript
    const nonQteEvents = events.filter((ev) => ev.type !== 'qte');
```

다음으로 교체:
```javascript
    // floorPattern은 시간 오프셋만 다른 복제가 의미가 없으므로 제외
    const nonQteEvents = events.filter((ev) => ev.type !== 'qte' && ev.type !== 'floorPattern');
```

`_hardenParams`는 switch에 floorPattern 케이스가 없으므로 그대로 통과(별도 가드 불필요).

- [ ] **Step 5: 빌드 검증**

Run: `npm run build`
Expected: `✓ built` (no errors)

- [ ] **Step 6: 커밋**

```bash
git add src/systems/GimmickManager.js
git commit -m "feat(gimmick-manager): dispatch 'floorPattern' events to floor patterns

Adds 'floorPattern' switch case routing to FLOOR_PATTERNS map.
Easy mode filters them out (simplified difficulty), and
_amplifyPattern excludes them from time-offset duplication
(spawn position matters per-pattern).

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 8: stagePatterns.js 갱신 — 그룹별 floorPattern 이벤트 추가

**Files:**
- Modify: `src/patterns/stagePatterns.js`

목적: 5개 패턴이 난이도 그룹별로 등장하도록 events 배열에 새 이벤트 추가.
spec의 매핑 표를 따른다. 기존 floor 이벤트는 모두 유지.

이 task는 다른 task보다 길지만, 모든 패턴은 `buildFloorPatternParams()`
헬퍼 한 줄로 표현되므로 줄 수 자체는 작다.

- [ ] **Step 1: import 추가**

`src/patterns/stagePatterns.js` 상단(파일 첫 줄)에 import 추가:

```javascript
import { buildFloorPatternParams } from './floorPatterns.js';
```

- [ ] **Step 2: 튜토리얼 그룹 (stages 1-4)에 ORBIT/SWEEP 추가**

각 스테이지의 `events` 배열 끝에 다음 이벤트들을 추가한다. 시간(`time`)은
해당 스테이지의 `duration` 안에서 기존 이벤트와 1초 이상 떨어지도록 배치.
스테이지별 정확한 time을 정하기 위해 우선 각 스테이지의 duration과 마지막
event time을 확인한다.

```bash
grep -n "stage:\|duration:\|time:" src/patterns/stagePatterns.js | head -120
```

이 출력으로 각 스테이지의 빈 시간을 확인. 다음 이벤트들을 추가:

**Stage 1** (duration 30, 마지막 floor 이벤트 time 23): `events` 배열 마지막 요소 뒤에 추가
```javascript
    {
      time: 27,
      type: 'floorPattern',
      params: buildFloorPatternParams('orbit', 'tutorial'),
    },
```

**Stage 2** (`STAGE_2`): 동일한 방식으로 events 끝에 추가 — bullet 위주 스테이지이지만 한 번 SWEEP 도입
```javascript
    {
      time: 22,
      type: 'floorPattern',
      params: buildFloorPatternParams('sweep', 'tutorial'),
    },
```

**Stage 3**: events 끝에 추가
```javascript
    {
      time: 18,
      type: 'floorPattern',
      params: buildFloorPatternParams('orbit', 'tutorial'),
    },
    {
      time: 26,
      type: 'floorPattern',
      params: buildFloorPatternParams('sweep', 'tutorial'),
    },
```

**Stage 4**: events 끝에 추가
```javascript
    {
      time: 16,
      type: 'floorPattern',
      params: buildFloorPatternParams('sweep', 'tutorial', { lines: 2, lineDelay: 400 }),
    },
    {
      time: 26,
      type: 'floorPattern',
      params: buildFloorPatternParams('orbit', 'tutorial'),
    },
```

(스테이지별 events 배열을 직접 수정. 정확한 위치는 각 STAGE_N 객체 내부의
events 배열 마지막 `}` 뒤, 닫는 `]` 앞.)

- [ ] **Step 3: 성장 그룹 (stages 6-9)에 ORBIT/SWEEP/CHECKER 추가**

각 스테이지 events 끝에 다음 추가:

**Stage 6**:
```javascript
    {
      time: 14,
      type: 'floorPattern',
      params: buildFloorPatternParams('orbit', 'growth'),
    },
    {
      time: 24,
      type: 'floorPattern',
      params: buildFloorPatternParams('checker', 'growth'),
    },
```

**Stage 7**:
```javascript
    {
      time: 12,
      type: 'floorPattern',
      params: buildFloorPatternParams('sweep', 'growth'),
    },
    {
      time: 22,
      type: 'floorPattern',
      params: buildFloorPatternParams('orbit', 'growth', { direction: 'ccw' }),
    },
```

**Stage 8**:
```javascript
    {
      time: 13,
      type: 'floorPattern',
      params: buildFloorPatternParams('checker', 'growth'),
    },
    {
      time: 25,
      type: 'floorPattern',
      params: buildFloorPatternParams('sweep', 'growth', { axis: 'vertical' }),
    },
```

**Stage 9**:
```javascript
    {
      time: 11,
      type: 'floorPattern',
      params: buildFloorPatternParams('orbit', 'growth'),
    },
    {
      time: 21,
      type: 'floorPattern',
      params: buildFloorPatternParams('checker', 'growth'),
    },
    {
      time: 28,
      type: 'floorPattern',
      params: buildFloorPatternParams('sweep', 'growth'),
    },
```

- [ ] **Step 4: 도전 그룹 (stages 11-14)에 + RADIAL 추가**

**Stage 11**:
```javascript
    {
      time: 10,
      type: 'floorPattern',
      params: buildFloorPatternParams('radial', 'challenge'),
    },
    {
      time: 22,
      type: 'floorPattern',
      params: buildFloorPatternParams('checker', 'challenge'),
    },
```

**Stage 12**:
```javascript
    {
      time: 9,
      type: 'floorPattern',
      params: buildFloorPatternParams('sweep', 'challenge'),
    },
    {
      time: 19,
      type: 'floorPattern',
      params: buildFloorPatternParams('radial', 'challenge'),
    },
    {
      time: 28,
      type: 'floorPattern',
      params: buildFloorPatternParams('orbit', 'challenge'),
    },
```

**Stage 13**:
```javascript
    {
      time: 11,
      type: 'floorPattern',
      params: buildFloorPatternParams('checker', 'challenge'),
    },
    {
      time: 21,
      type: 'floorPattern',
      params: buildFloorPatternParams('radial', 'challenge'),
    },
    {
      time: 30,
      type: 'floorPattern',
      params: buildFloorPatternParams('sweep', 'challenge', { axis: 'vertical' }),
    },
```

**Stage 14**:
```javascript
    {
      time: 8,
      type: 'floorPattern',
      params: buildFloorPatternParams('radial', 'challenge'),
    },
    {
      time: 18,
      type: 'floorPattern',
      params: buildFloorPatternParams('orbit', 'challenge', { direction: 'ccw' }),
    },
    {
      time: 27,
      type: 'floorPattern',
      params: buildFloorPatternParams('checker', 'challenge'),
    },
```

- [ ] **Step 5: 지옥 그룹 (stages 16-19)에 + SCATTER 추가**

**Stage 16**:
```javascript
    {
      time: 8,
      type: 'floorPattern',
      params: buildFloorPatternParams('scatter', 'hell'),
    },
    {
      time: 18,
      type: 'floorPattern',
      params: buildFloorPatternParams('radial', 'hell'),
    },
    {
      time: 28,
      type: 'floorPattern',
      params: buildFloorPatternParams('checker', 'hell'),
    },
```

**Stage 17**:
```javascript
    {
      time: 9,
      type: 'floorPattern',
      params: buildFloorPatternParams('orbit', 'hell'),
    },
    {
      time: 19,
      type: 'floorPattern',
      params: buildFloorPatternParams('scatter', 'hell'),
    },
    {
      time: 28,
      type: 'floorPattern',
      params: buildFloorPatternParams('sweep', 'hell'),
    },
```

**Stage 18**:
```javascript
    {
      time: 7,
      type: 'floorPattern',
      params: buildFloorPatternParams('radial', 'hell'),
    },
    {
      time: 17,
      type: 'floorPattern',
      params: buildFloorPatternParams('scatter', 'hell'),
    },
    {
      time: 24,
      type: 'floorPattern',
      params: buildFloorPatternParams('checker', 'hell'),
    },
    {
      time: 32,
      type: 'floorPattern',
      params: buildFloorPatternParams('orbit', 'hell'),
    },
```

**Stage 19**:
```javascript
    {
      time: 6,
      type: 'floorPattern',
      params: buildFloorPatternParams('scatter', 'hell'),
    },
    {
      time: 14,
      type: 'floorPattern',
      params: buildFloorPatternParams('radial', 'hell'),
    },
    {
      time: 22,
      type: 'floorPattern',
      params: buildFloorPatternParams('sweep', 'hell', { lines: 3 }),
    },
    {
      time: 30,
      type: 'floorPattern',
      params: buildFloorPatternParams('orbit', 'hell', { direction: 'ccw' }),
    },
```

(작업 팁: 각 STAGE_N의 events 배열 마지막 `]` 직전에 위 객체들을 삽입.
스테이지가 많으므로 한 스테이지씩 Edit 도구로 추가하는 것이 안전.)

- [ ] **Step 6: 빌드 검증**

Run: `npm run build`
Expected: `✓ built` (no errors)

- [ ] **Step 7: 커밋**

```bash
git add src/patterns/stagePatterns.js
git commit -m "feat(stage-patterns): add floor pattern events per difficulty group

- Tutorial (1-4): ORBIT, SWEEP
- Growth (6-9): + CHECKER
- Challenge (11-14): + RADIAL
- Hell (16-19): + SCATTER

All events use buildFloorPatternParams helper so default values
and difficulty tuning live in floorPatterns.js for easy adjustment.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 9: 통합 검증

**Files:**
- (없음 — 검증만)

목적: 빌드와 매뉴얼 플레이로 패턴이 의도대로 동작하는지 확인. 자동화 테스트
인프라가 없으므로 사용자가 dev 서버에서 직접 시각 확인.

- [ ] **Step 1: 최종 빌드**

```bash
npm run build
```
Expected: `✓ built in <Ns>` — no errors, no warnings except chunk size 경고
(기존부터 있던 것).

- [ ] **Step 2: dev 서버 기동 확인**

```bash
npm run dev
```
Expected: Vite dev 서버가 `http://localhost:5173/` (또는 비슷한 포트)에서
기동. 브라우저로 접속하여 인트로 화면이 정상 표시되면 OK. (자동 종료가
어려우므로 Ctrl+C로 닫는다.)

- [ ] **Step 3: 매뉴얼 검증 체크리스트 작성**

다음 체크리스트를 사용자에게 전달하여 플레이 테스트 시 확인:

```
[ ] Stage 1 — 27초 부근에 플레이어 주위 원형 장판 차례 발동 (ORBIT)
[ ] Stage 2 — 22초 부근 가로 일자 장판 (SWEEP)
[ ] Stage 6 — 24초 부근 격자 체크무늬 두 페이즈 (CHECKER)
[ ] Stage 11 — 10초 부근 중앙에서 동심원 확산 (RADIAL)
[ ] Stage 16 — 8초 부근 맵 전체 랜덤 다발 (SCATTER)
[ ] 보스전(5/10/15/20)에서는 새 패턴 미등장 (의도된 비목표)
[ ] Easy 모드: 새 패턴 미등장 (의도된 단순화)
[ ] 콘솔에 "unknown floorPattern" 경고 없음
[ ] 보스 클리어 후 다음 스테이지 정상 전환 (이전 fix 회귀 없음)
```

- [ ] **Step 4: 회귀 가능성 검토**

`_amplifyPattern`에 의해 stage 11/16 등 고난도 스테이지에서 기존 events가
복제되어 시간 축이 매우 빽빽해진다. 새 floorPattern 이벤트 추가로
**duration 마지막 1초 안에 패턴이 들어가지 않도록** 확인.

각 스테이지의 duration vs 마지막 floorPattern time:
- Stage 1: 30 vs 27 ✓ (3초 여유)
- Stage 2: 30 vs 22 ✓
- Stage 13: duration 확인 후 30 vs 30 — 만약 duration이 30이라면 32까지의
  스테이지 18은 duration > 32 인지 확인 필요. **이 step에서 stagePatterns.js의 각
  STAGE_N의 duration을 grep해 마지막 floorPattern time + 활성+경고 시간이
  duration 이내인지 검증.**

```bash
grep -A1 "stage: " src/patterns/stagePatterns.js | grep "duration"
```

duration보다 늦은 time이 있다면 해당 이벤트의 time을 줄인다.

- [ ] **Step 5: PR 본문 업데이트 메모**

(이 단계는 PR 생성/푸시 시점에 수행 — 별도 task로 분리하지 않음)

---

## Self-Review Checklist (실행 직전 plan 작성자 자체 점검 결과)

**1. Spec coverage**:
- ✅ 5개 패턴 모두 Task 2-6에서 구현
- ✅ 난이도 그룹 매핑 Task 8에서 적용
- ✅ Tunable constants 요구 Task 1의 DEFAULTS/DIFFICULTY_TUNING으로 충족
- ✅ 기존 floor 이벤트 유지 (교체 X) — Task 8이 추가만 함
- ✅ 보스 씬 제외 — GimmickManager 수정만 했고 BossScene은 손대지 않음

**2. Placeholder scan**:
- "TBD"/"TODO"/"figure out later" 없음
- 모든 step에 실제 코드 또는 정확한 명령
- "Add appropriate error handling" 같은 표현 없음

**3. Type/이름 일관성**:
- `FLOOR_PATTERNS` (Task 1 export) ↔ `FLOOR_PATTERNS[p.name]` (Task 7 사용) ✓
- `buildFloorPatternParams` (Task 1) ↔ Task 8에서 같은 이름 import ✓
- `cfg.direction === 'ccw' ? -1 : 1` 로직: DEFAULTS와 DIFFICULTY_TUNING 모두 'cw'/'ccw' 문자열 사용 ✓
- `cfg.cellInset` (DEFAULTS.checker), `innerW = cellW * cfg.cellInset` (Task 4) ✓
- params 객체 내부 키 (`x`, `y`, `width`, `height`, `shape`, `variant`, `warningTime`, `activeTime`) 모두 `floorManager.spawn()` 의 spec과 일치 (Player.js 본 결과 FloorManager.spawn API)

**4. 누락된 결정**:
- DEFAULTS.radial.centerX/centerY가 모듈 로드 시점의 GAME_WIDTH/GAME_HEIGHT 값으로 고정됨. constants/game.js의 값이 동적으로 바뀌지 않으므로 안전.
