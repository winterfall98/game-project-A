# Floor Pattern System Design

날짜: 2026-04-29
대상 코드베이스: Phaser 3 기반 QTE Dodge 게임 (qte-dodge-game)

## 목적

기존 `FloorManager`는 단일 장판(rect/circle)을 spawn하는 저수준 API만 제공한다.
스테이지에서 사용되는 floor 이벤트도 stagePatterns.js에 단일 spawn 호출이
산발적으로 흩뿌려져 있어, "여러 장판이 시간차/공간차로 협조하여 만드는
의도된 기믹"이라는 개념이 코드에 존재하지 않는다.

이 작업은 다음을 추가한다:

1. **복합 floor 패턴 5종**을 1급 개념으로 정의 (`src/patterns/floorPatterns.js`).
2. **stagePatterns.js에서 새 이벤트 타입 `floorPattern`** 으로 호출 가능.
3. **난이도 그룹별로 등장 패턴이 달라지도록** 스테이지 이벤트 타임라인 갱신.

기존 단일 `floor` 이벤트는 유지되며 호환성을 깨지 않는다.

## 5개 패턴 명세

각 패턴은 다음 시그니처의 함수다:

```js
function spawn(scene, floorManager, params)
```

`params`는 패턴별로 다르며, 모두 선택 인자에 합리적 기본값을 갖는다.
내부적으로는 `floorManager.spawn({...})`를 시간차로 여러 번 호출한다.

### P1. ORBIT — 플레이어 주위 원형 차례

플레이어 현재 위치 기준 반경 R의 원주 위에 작은 원형 장판 N개를
시계/반시계 방향으로 차례 발동.

**params**:
- `count` (int, 기본 8): 장판 개수
- `radius` (number, 기본 100): 플레이어로부터의 반경(px)
- `floorRadius` (number, 기본 26): 각 장판의 지름의 절반
- `step` (number, 기본 120): 다음 장판이 발동할 때까지의 ms 간격
- `direction` (`'cw' | 'ccw'`, 기본 `'cw'`): 회전 방향
- `warningTime` (number, 기본 800)
- `activeTime` (number, 기본 600)

**구현 노트**:
- 첫 장판의 위치는 spawn 호출 시점의 player.x, player.y를 캡쳐.
  이후 N개 장판은 그 캡쳐된 중심 기준으로 계산 (런타임에 추적하지 않음).
- 각 장판은 `floorManager.spawn({shape: 'circle', variant: 'normal', ...})`
  로 같은 warningTime을 갖되, `delayedCall(step * i, ...)`로 발동 시작 자체를
  시간차로 미룸. → 결과적으로 시계 방향으로 **꼬리 잡기** 식으로 동작.
- `direction === 'ccw'` 면 각도 증가 방향만 반대로.

**플레이어 회피 양상**: 장판이 차례로 발동하므로, 이미 사라진 위치(wake)를
따라 도는 것이 가장 안전. 또는 아직 발동 안 한 다음 칸으로 미리 이동.

### P2. SWEEP — 맵을 가로지르는 일자

길고 얇은 직사각형 장판이 맵 한쪽 끝에서 반대쪽으로 가로지름.
단일선 또는 평행 다중선.

**params**:
- `axis` (`'horizontal' | 'vertical'`, 기본 `'horizontal'`)
- `lines` (int, 기본 1): 평행선 개수
- `thickness` (number, 기본 50): 선의 두께(px)
- `gap` (number, 기본 80): 평행선 사이의 간격
- `warningTime` (number, 기본 1200)
- `activeTime` (number, 기본 800)
- `lineDelay` (number, 기본 300): 선들 사이의 발동 시간차 (0이면 동시)

**구현 노트**:
- `axis === 'horizontal'`: 가로 800px × 세로 thickness px 짜리 장판이
  `y` 위치를 다르게 해서 lines개 spawn.
- 평행선의 y 좌표는 화면 중앙을 중심으로 균등 분포:
  - lines=1: 화면 중앙 한 줄
  - lines=2: 중심에서 ±gap/2
  - lines=3: 중심 + ±gap, ...
- `axis === 'vertical'`: 같은 로직을 x축으로.
- `floorManager.spawn({shape: 'rect', variant: 'normal', ...})`로 호출.

**플레이어 회피 양상**: 평행선 사이의 안전구간으로 이동. 단일선이면 단순,
다중선이면 좁은 회피로(廊).

### P3. CHECKER — 격자 체크무늬

맵을 격자(예 5×3)로 나눠 체크무늬 절반 칸이 동시 발동 → 잠시 후 반대 칸 발동.

**params**:
- `cols` (int, 기본 5): 가로 칸 수
- `rows` (int, 기본 3): 세로 칸 수
- `phaseDelay` (number, 기본 700): 첫 페이즈와 두 번째 페이즈 사이 ms
- `warningTime` (number, 기본 900)
- `activeTime` (number, 기본 600)

**구현 노트**:
- 셀 너비 = GAME_WIDTH / cols, 셀 높이 = GAME_HEIGHT / rows.
- 셀 (col, row)에 대해 (col + row) % 2 === 0 이면 페이즈 1, 아니면 페이즈 2.
- 페이즈 1: 모든 페이즈 1 셀에 동시 spawn (rect, 셀 크기보다 약간 작게 — 셀 내부 80%).
- 페이즈 2: `delayedCall(phaseDelay, ...)` 후 페이즈 2 셀에 동시 spawn.
- warningTime은 두 페이즈 모두 동일.

**플레이어 회피 양상**: 페이즈 1 동안 페이즈 1 셀의 반대 셀(=페이즈 2 셀)에
서 있다가, 페이즈 2가 발동하기 전에 페이즈 1 셀로 이동.

### P4. RADIAL — 동심원 확산

지정된 중심점에서 도넛형 ring이 외곽으로 차례 확산.

**params**:
- `centerX` (number, 기본 GAME_WIDTH/2)
- `centerY` (number, 기본 GAME_HEIGHT/2)
- `rings` (int, 기본 4): ring 개수
- `innerRadius` (number, 기본 60): 첫 ring의 안쪽 반지름
- `ringThickness` (number, 기본 50): 각 ring의 두께
- `step` (number, 기본 250): ring 사이의 발동 시간차
- `warningTime` (number, 기본 700)
- `activeTime` (number, 기본 500)

**구현 노트**:
- FloorManager에는 도넛(ring) 형태가 없다. 따라서 ring을 N개의 원형 장판으로
  근사: 각 ring을 둘레의 작은 원형 장판들(예 16개)로 등간격 배치.
- 또는 더 간단히: ring을 큰 원형 장판으로 spawn하되, 안쪽이 비어 있는 효과는
  생략 (대신 시각적으로는 도넛처럼 보이도록 ringThickness보다 약간 두꺼운 띠).
- **선택**: 단순화된 접근으로 ring을 작은 원형 장판들의 등간격 배열로 구현
  (가장 시각적으로 ring처럼 보이고 코드도 단순). ring별 작은 원의 개수는
  ring 둘레에 비례 (예: ceil(2π × ringRadius / 40)).
- 각 ring은 `delayedCall(step * i, ...)`로 발동 시작 시점이 차례로 미뤄짐.

**플레이어 회피 양상**: ring과 ring 사이의 빈틈에서 이동, 또는 가장 안쪽
(첫 ring이 사라진 직후) 또는 가장 바깥쪽(마지막 ring을 추월).

### P5. SCATTER — 랜덤 다발

맵 전체에 무작위 위치로 작은 원형 장판들이 짧은 시간차로 발동.

**params**:
- `count` (int, 기본 8)
- `floorRadius` (number, 기본 32)
- `spawnInterval` (number, 기본 80): 장판들 간 발동 시간차
- `warningTime` (number, 기본 700)
- `activeTime` (number, 기본 500)
- `margin` (number, 기본 60): 화면 가장자리 여백 (이 여백 안쪽에서만 spawn)
- `minDistance` (number, 기본 90): 동시 활성 장판 간 최소 거리
  (충돌 회피 위해 spawn 시 시도)

**구현 노트**:
- 무작위 위치 생성: `Phaser.Math.Between(margin, GAME_WIDTH - margin)`,
  세로도 동일.
- minDistance 보장: 새 위치 후보가 기존 후보들과 minDistance 미만이면
  최대 5회 재추첨. 5회 모두 실패하면 마지막 후보 그대로 채택 (무한 루프 방지).
- 각 장판: `delayedCall(spawnInterval * i, () => floorManager.spawn({shape: 'circle'...}))`.

**플레이어 회피 양상**: 발동 예고를 보고 빈틈을 빠르게 찾아 이동.

## 난이도 매핑

기존 `STAGE_CONFIGS`는 (1-4) / (6-9) / (11-14) / (16-19) 4그룹의 곡선을 가짐.
이 그룹별로 등장 가능한 패턴 풀을 다음과 같이 결정:

| 그룹 | 스테이지 | 등장 패턴 풀 | 강도 조정 |
|------|---------|-------------|----------|
| 튜토리얼 | 1-4 | P1, P2 | radius 크게, lines=1, step 느리게 |
| 성장 | 6-9 | P1, P2, P3 | ORBIT/SWEEP 가속, CHECKER 첫 등장 |
| 도전 | 11-14 | P1, P2, P3, P4 | RADIAL 등장, ORBIT direction 다양화 |
| 지옥 | 16-19 | P1~P5 모두 | SCATTER 등장, 모든 패턴 고밀도/빠름 |

**자동 강도 스케일링**: 각 패턴은 `floorManager.spawn`을 호출할 때
GimmickManager가 이미 적용하는 `warningTimeMult`를 그대로 받는다 (별도 손댈
필요 없음). 추가로 패턴 자체에서 다음 파라미터는 단계별 차이를 줘서 호출:

- 튜토리얼: ORBIT count=6, SWEEP lines=1
- 성장: ORBIT count=8 또는 step 짧게, SWEEP lines=1~2, CHECKER 5×3
- 도전: ORBIT count=8 (필요 시 ccw 변형), SWEEP lines=2~3, CHECKER 6×3, RADIAL rings=3
- 지옥: ORBIT step 더 짧게, SWEEP lines=3, CHECKER 7×4, RADIAL rings=5, SCATTER count=10

## 통합 방식

### 1. 새 모듈 추가

```
src/patterns/floorPatterns.js
```

각 패턴 함수 내보내기 + 이름→함수 맵.

```js
// floorPatterns.js
export function orbit(scene, floorManager, params) { ... }
export function sweep(scene, floorManager, params) { ... }
export function checker(scene, floorManager, params) { ... }
export function radial(scene, floorManager, params) { ... }
export function scatter(scene, floorManager, params) { ... }

export const FLOOR_PATTERNS = { orbit, sweep, checker, radial, scatter };
```

### 2. GimmickManager에 디스패치

`_spawnGimmick(type, params)` 분기에 `'floorPattern'` 케이스 추가:

```js
case 'floorPattern': {
  const fn = FLOOR_PATTERNS[params.name];
  if (!fn) {
    console.warn('[GimmickManager] unknown floorPattern:', params.name);
    return;
  }
  fn(this.scene, this.managers.floor, params);
  break;
}
```

`warningTimeMult` 등 difficulty multiplier는 GimmickManager가 이미 params에
적용해준다는 가정 (이미 단일 floor에 적용 중인 로직 그대로 씀). 적용 부분은
구현 시 GimmickManager의 현재 multiplier 처리 로직을 확인하고 일관성 유지.

### 3. stagePatterns.js의 events 갱신

각 스테이지 그룹에 새 패턴을 적절히 끼워 넣음. 기존 단일 `floor` 이벤트는
유지하되, 그 일부를 패턴 호출로 교체하지 않고 **추가**한다 (= 기존 stage
밸런스를 깨지 않으면서 새 컨텐츠 도입). 단, 너무 빽빽해지지 않도록 시간 분포
는 손본다.

예시:

```js
// Stage 7 (성장 그룹) — 기존 events 끝 또는 중간에 추가
{
  time: 14,
  type: 'floorPattern',
  params: {
    name: 'orbit',
    count: 8,
    radius: 110,
    direction: 'cw',
    warningTime: 800,
  },
},
{
  time: 22,
  type: 'floorPattern',
  params: {
    name: 'checker',
    cols: 5,
    rows: 3,
    phaseDelay: 700,
  },
},
```

각 스테이지에 1~2회 패턴 등장 정도가 적절. 정확한 시간 배치는 구현 시
스테이지 별 events 길이를 보고 빈 구간에 배치.

## 비목표 (Non-goals)

- 기존 `FloorManager` API의 변경. 새 변형(variant) 추가나 새 shape 추가는
  하지 않는다.
- 패턴들 간의 동시 발동 조합 (예 ORBIT + SCATTER). 단일 시점에는 단일 패턴만
  의도. 단, GimmickManager가 시간 축에서 인접한 패턴을 호출하면 자연히 중첩
  될 수 있음 — 그 경우는 stagePatterns.js의 시간 배치로 조정.
- 보스 씬에서의 패턴 사용. 보스는 attacks의 `'floor'` 타입을 그대로 쓰며,
  이번 변경은 일반 스테이지(GameScene) 한정.
- 회전하는 SWEEP, 곡선 SWEEP, 추적하는 SCATTER 등 동적 변형. 이번 5종은
  모두 **정적 시간차 spawn**으로 구현하여 코드를 단순화.

## 위험 요소 / 검토 포인트

1. **장판 개수 폭증으로 인한 성능**: SCATTER × 다중 + RADIAL의 ring 둘레
   분할 등으로 한 패턴에서 30~50개 장판이 동시 active 가능. FloorManager는
   매 프레임 모든 active floor에 대해 충돌체크하므로 비용 증가.
   - **검증**: 지옥 그룹 스테이지에서 활성 장판 수 모니터링. 50개 초과 시
     SCATTER count 또는 RADIAL ring 둘레 분할 수를 줄이는 안전 캡 필요.

2. **GimmickManager의 difficulty multiplier 적용 방식**: 현재 단일 floor에
   warningTimeMult 등이 어떻게 곱해지는지 코드 확인 후 새 패턴에도 일관 적용.
   특히 패턴이 내부에서 `floorManager.spawn(...)`을 호출할 때 multiplier가
   이미 params에 반영된 상태인지, 패턴 내부에서 한 번 더 곱해야 하는지 결정.

3. **CHECKER의 격자가 화면 가장자리까지 채워지는 경계 처리**: 셀 크기에서
   inset(80%)만 사용해 가장자리 여백 확보 — 시각적으로 격자 사이 좁은 회피
   동선이 자연스럽게 보이도록.

4. **ORBIT의 캡쳐 시점**: spawn 호출 시점의 player 위치를 캡쳐하므로, 호출
   직후 player가 빠르게 이동하면 ORBIT가 player에서 멀어진 위치에 그려짐.
   **이는 의도된 동작** — 플레이어를 따라가지 않으므로 회피의 여지가 있음.

## 구현 순서 (writing-plans에서 상세화 예정)

1. `src/patterns/floorPatterns.js` 작성 (5개 함수 + export 맵)
2. `GimmickManager`에 `'floorPattern'` 분기 추가
3. `stagePatterns.js`의 각 스테이지에 새 이벤트 추가
4. 빌드 검증 (`npm run build`)
5. 사용자 플레이 테스트로 강도 조정

## 합의된 결정 사항

- 패턴은 5종 (ORBIT, SWEEP, CHECKER, RADIAL, SCATTER)
- 난이도 그룹: 1-4 / 6-9 / 11-14 / 16-19
- 새 패턴은 기존 floor 이벤트를 교체하지 않고 추가만 함
- 보스 씬은 이번 변경에서 제외

## 튜닝 용이성 (Tunable Constants)

이번 변경의 모든 magic number는 향후 밸런스 조정을 위해 한 곳에서 쉽게
변경할 수 있도록 정리한다. 구현 규칙:

1. **각 패턴 함수 내부에 magic number를 하드코딩하지 않는다.**
   모든 수치(기본 count, radius, warningTime, step, gap, thickness 등)는
   `floorPatterns.js` 상단의 named const 객체에 모은다.

2. **`DEFAULTS` 상수 객체 구조** — 패턴별로 한 블록:
   ```js
   const DEFAULTS = {
     orbit:   { count: 8, radius: 100, floorRadius: 26, step: 120, direction: 'cw',
                warningTime: 800, activeTime: 600 },
     sweep:   { axis: 'horizontal', lines: 1, thickness: 50, gap: 80,
                warningTime: 1200, activeTime: 800, lineDelay: 300 },
     checker: { cols: 5, rows: 3, phaseDelay: 700, cellInset: 0.8,
                warningTime: 900, activeTime: 600 },
     radial:  { rings: 4, innerRadius: 60, ringThickness: 50, step: 250,
                ringSegmentSpacing: 40,
                warningTime: 700, activeTime: 500 },
     scatter: { count: 8, floorRadius: 32, spawnInterval: 80, margin: 60,
                minDistance: 90, retries: 5,
                warningTime: 700, activeTime: 500 },
   };
   ```
   각 패턴 함수는 `params`에 들어온 값이 있으면 그것을 쓰고, 없으면
   `DEFAULTS[patternName]`의 값을 쓰는 식으로 병합 (`{ ...DEFAULTS.x, ...params }`).

3. **난이도 그룹별 강도 조정 값도 별도 const 객체에 모은다** — 예:
   ```js
   const DIFFICULTY_TUNING = {
     tutorial: { orbitCount: 6, sweepLines: 1, ... },
     growth:   { orbitCount: 8, sweepLines: 2, checkerCols: 5, ... },
     challenge:{ orbitCount: 8, sweepLines: 3, checkerCols: 6, radialRings: 3, ... },
     hell:     { orbitCount: 10, sweepLines: 3, checkerCols: 7, radialRings: 5,
                 scatterCount: 10, ... },
   };
   ```
   stagePatterns.js의 events에서는 이 매핑을 참조해 `params`를 구성하는 헬퍼
   (예 `floorPatternEvent(time, name, group, overrides)`)를 두면, 스테이지
   파일이 더 깔끔해진다.

4. **stagePatterns.js의 events에서 직접 `params: { count: 8, radius: 110 }`
   처럼 숫자를 박지 않는다.** 가능하면 위 헬퍼 또는 그룹/이름만 적고 나머지는
   기본값에 맡긴다. 정말 스테이지별 특수 조정이 필요한 곳만 `overrides`로 명시.

5. **이름이 의미를 갖도록 한다** — 매직 넘버 80, 0.8 같은 값을 그대로 쓰지 않고
   `cellInset`, `ringSegmentSpacing` 등 의미 있는 키로 분리.

이 규칙은 향후 "ORBIT을 0.1초 더 빠르게"처럼 한 줄 변경으로 끝나도록 보장한다.
