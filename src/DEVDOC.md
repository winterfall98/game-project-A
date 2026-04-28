# QTE Dodge Game — 개발 문서

## 개요

Phaser 3 기반의 2D 탄막 회피 + QTE 리듬 액션 게임이다. 플레이어는 800×600 게임 영역에서 탄환, 레이저, 바닥 장판을 회피하면서 QTE 프롬프트에 반응하여 점수를 획득한다. 전체 20개 스테이지(4개 보스 포함)로 구성되며, 노말/이지 두 가지 난이도를 지원한다.

---

## 파일 구조

```
src/
├── main.js                     # 진입점. Phaser.Game 생성, 씬 등록, 전역 이벤트 라우팅
├── CLAUDE.md                   # 코딩 가이드라인
│
├── constants/
│   ├── game.js                 # 게임 전역 상수 (치수, 스탯, 점수, 색상, 스테이지 설정)
│   └── keys.js                 # 키 매핑 (QTE 키풀, 마우스 버튼, 표시명)
│
├── utils/
│   ├── settings.js             # localStorage 기반 설정 저장/불러오기
│   ├── effects.js              # 시각 이펙트 (파티클, 잔상, 피격 플래시)
│   └── math.js                 # 수학 유틸리티
│
├── entities/
│   ├── Player.js               # 플레이어 엔티티 (이동, 구르기, HP, 스태미나)
│   ├── Boss.js                 # 보스 엔티티 (FSM AI, 페이즈, HP 바)
│   ├── Bullet.js               # 탄환 엔티티
│   ├── Laser.js                # 레이저 엔티티
│   └── Floor.js                # 바닥 장판 엔티티
│
├── systems/
│   ├── GimmickManager.js       # 패턴 스케줄러 + 난이도 증폭 엔진
│   ├── QTEManager.js           # QTE 시퀀스 관리, 판정, 폭탄 시스템
│   ├── BulletManager.js        # 탄환 오브젝트 풀, 발사 패턴 엔진
│   ├── LaserManager.js         # 레이저 라이프사이클 (경고→실체화→소멸)
│   ├── FloorManager.js         # 바닥 장판 라이프사이클 (경고→발동→소멸)
│   └── ScoreManager.js         # 점수 누적, 배율, 등급 계산
│
├── scenes/
│   ├── BootScene.js            # 부팅 씬 (gameReady 이벤트 발신)
│   ├── GameScene.js            # 메인 게임플레이 씬 (스테이지 1~20)
│   ├── BossScene.js            # 보스전 씬 (스테이지 5, 10, 15, 20)
│   ├── UIScene.js              # HUD 오버레이 (HP/스태미나 바, 점수, 콤보, 일시정지 버튼)
│   └── PauseScene.js           # 일시정지 오버레이 (재개/메인 복귀)
│
├── patterns/
│   ├── stagePatterns.js        # 스테이지 1~20 이벤트 타임라인 데이터
│   ├── stage1.js               # (참고용) 스테이지 1 패턴 데이터
│   └── bossConfigs.js          # 보스 1~4 설정 (HP, 페이즈, 공격, QTE 간격)
│
└── ui/
    ├── intro.js                # 인트로 화면 DOM UI (시작, 모드선택, 옵션, 스테이지 셀렉트)
    ├── result.js               # 결과 화면 DOM UI (점수, 등급, 통계)
    └── styles.css              # 전체 CSS 스타일
```

---

## 씬 흐름

게임의 씬 전환은 다음과 같은 흐름을 따른다.

```
[BootScene]
    │ gameReady 이벤트
    ▼
[인트로 화면] (DOM)
    │ window.startGame(mode, settings, startStage)
    ▼
[GameScene] ─────────────────────────────────────────────┐
    │ 스테이지 클리어                                     │
    │ → "STAGE X CLEAR!" 표시                            │
    │ → Enter/Click 대기                                  │
    │ → 다음 스테이지가 보스면 BossScene, 아니면 GameScene │
    ▼                                                     │
[BossScene]                                               │
    │ 보스 처치                                           │
    │ → "BOSS DEFEATED!" 표시                             │
    │ → Enter/Click 대기                                  │
    │ → this.scene.start('GameScene') 로 직접 전환         │
    └─────────────────────────────────────────────────────┘
    │
    │ 사망 또는 20스테이지 클리어
    ▼
[결과 화면] (DOM) → "RETURN" → 인트로 화면
```

UIScene은 GameScene/BossScene과 병렬로 실행되며, HUD를 렌더링한다. PauseScene은 F10 또는 일시정지 버튼 클릭 시 오버레이로 표시된다.

씬 전환 원칙으로, 보스전 이후의 전환은 BossScene 내부에서 `this.scene.start('GameScene', data)`를 호출하여 Phaser의 씬 라이프사이클(shutdown → init → create)을 보장한다. 외부 이벤트 핸들러에서 `game.scene.start()`를 사용하면 씬 상태 불일치가 발생할 수 있으므로 피한다.

---

## 핵심 엔티티

### Player (entities/Player.js)

Phaser.GameObjects.Container 기반이며, Arcade Physics 원형 히트박스(반지름 14px)를 가진다.

주요 속성은 다음과 같다. HP 최대 100, 스태미나 최대 20(초당 1 회복), 이동속도 200px/s이다. 구르기에 스태미나 5를 소모하며, 300ms 동안 무적 + 120px 이동이 적용된다. 피격 시 0.5초 무적이 자동 부여되어 연속 피격을 방지한다. QTE Great 판정 시 0.3초 무적이 부여된다.

컨트롤 모드에 따라 arrows 모드에서는 화살표 키로만, wasd 모드에서는 WASD 키로만 이동한다. 구르기 키는 SHIFT 또는 SPACE 중 설정에서 선택한다.

### Boss (entities/Boss.js)

FSM(유한 상태 기계) 기반 AI를 가진다. 상태는 IDLE, ATTACK, CHARGE, SPECIAL, STUN, RAGE 6가지이다.

보스별 설정은 bossConfigs.js에 정의되어 있다. 스테이지 5 보스(GUARDIAN)는 HP 400에 1 페이즈로 charge와 fan_bullets를 사용한다. 스테이지 10 보스(WARDEN)는 HP 600에 2 페이즈로, HP 50% 이하에서 속도 1.3배와 함께 floor, circle_bullets가 추가된다. 스테이지 15 보스(OVERLORD)는 HP 800에 3 페이즈로, aimed_bullets와 multi_laser가 등장한다. 스테이지 20 보스(FINAL BOSS)는 HP 1000에 4 페이즈이며, 90초 시간 제한과 아레나 축소, 최종 QTE 시퀀스가 적용된다.

카운터 QTE 시스템에서는 보스가 charge 공격을 선택하면 카운터 윈도우가 열린다. 성공 시 보스가 2초간 기절하며 추가 데미지 QTE 기회가 주어진다. 실패 시 돌진 공격이 실행된다. QTE 매니저가 이미 활성 상태면 카운터를 건너뛰고 보스가 다음 행동을 스케줄링한다.

페이즈 전환 시 레이저와 장판은 제거되지만 탄환은 유지된다.

---

## 핵심 시스템

### GimmickManager (systems/GimmickManager.js)

패턴 스케줄링과 난이도 증폭을 담당하는 핵심 시스템이다.

역할은 세 가지다. 첫째, stagePatterns.js의 이벤트 타임라인을 읽고 `scene.time.delayedCall`로 스케줄링한다. 둘째, 노말 모드에서 패턴을 동적 증폭한다. 셋째, 이지 모드에서 패턴을 약화한다.

노말 모드 증폭(`_amplifyPattern`) 로직은 다음과 같다. 스테이지 티어(5스테이지 단위)별로 증폭 배율이 적용되는데, 스테이지 1~4는 2.0배, 6~9는 3.0배, 11~14는 4.0배, 16~19는 5.0배이다. 비QTE 이벤트를 복제하되 0.3~1.8초 시간 오프셋을 두어 자연스러운 중첩을 만든다. QTE는 모든 스테이지에서 4~8초 간격으로 자동 삽입된다(스테이지 높을수록 더 자주). 빈 시간대(0.8초 간격으로 탐색)에 랜덤 기믹(floor, bullet, laser)을 채운다.

파라미터 강화(`_hardenParams`)에서는 장판 경고시간을 40% 단축하고 크기를 스테이지당 3%씩 누적 확대한다. 탄환 수와 속도를 스테이지당 2~3%씩 증가시킨다. 레이저 경고시간을 40% 단축하고 굵기를 15% 증가시킨다.

위치 랜덤화(`_randomizeParams`)에서 장판은 50% 확률로 플레이어 정중앙(±20px), 50%는 ±150px에 생성된다. 레이저는 40% 확률로 플레이어 정중앙 관통(±10px), 60%는 ±100px에 생성된다. 탄환은 화면 가장자리에서 플레이어 방향으로 발사되며, 산포 ±40px가 적용된다.

이지 모드 약화(`_convertToEasy`)에서는 탄환 수 50% 감소 및 속도 80%, 장판 동시 2개 제한, 레이저 꺾임 제거 및 경고시간 130%, QTE 시퀀스 QWE 3개 고정 및 타이밍 120%가 적용된다.

### QTEManager (systems/QTEManager.js)

QTE 프롬프트 렌더링과 판정을 담당한다.

시퀀스 큐 방식으로 동작한다. `startSequence([{key, timing}, ...], callback)`으로 시작하면 큐에서 하나씩 꺼내 프롬프트를 표시하고, 전부 완료되면 결과 배열과 함께 콜백을 호출한다. `isActive` 플래그가 true인 동안 새 시퀀스를 시작할 수 없다.

판정 시스템에서, 내부 띠가 scale 0에서 1.4까지 선형 증가한다. scale이 정확히 1.0인 시점이 이상적이며, ±0.05 이내이면 Great, ±0.15 이내이면 Good, 나머지는 Fail이다.

컨트롤 모드별 차이로, arrows 모드에서는 키보드(Q, W, E, R, A, S, D, F, 1~4)를 사용하며 프롬프트가 플레이어 위쪽 고정 위치에 표시된다. wasd 모드에서는 마우스 버튼(LMB, RMB, MMB)을 사용하며 프롬프트가 플레이어 반경 60~100px 내 랜덤 위치에 표시된다.

폭탄 시스템에서, 연속 Great 5회 달성 시 폭탄 1개를 획득하며 스테이지당 최대 3개까지 보유 가능하다. E 키로 사용하면 화면의 모든 기믹(탄환, 레이저, 장판)이 제거된다.

### BulletManager (systems/BulletManager.js)

Phaser Arcade Physics Group 기반 오브젝트 풀(최대 300개)을 사용한다.

발사 패턴은 4종이다. fan은 부채꼴 패턴으로 originX/Y에서 direction 방향 기준 angle 범위에 count개를 발사한다. circle은 360도 균등 분포이다. line은 일직선 연속 발사이다. aimed는 플레이어 방향 조준 발사이며 spread로 산포를 설정한다.

화면 밖으로 나간 탄환은 worldbounds 이벤트로 자동 비활성화되며, 10초 안전 타이머도 별도로 동작한다.

### LaserManager (systems/LaserManager.js)

레이저는 3단계 라이프사이클을 거친다. 경고선 단계에서는 얇은 선이 깜빡이며 표시된다. 실체화 단계에서는 지정 굵기의 레이저가 발동되고 충돌 판정이 활성화된다. 소멸 단계에서는 페이드아웃 후 제거된다.

직선형(`spawnStraight`)과 90도 꺾임형(`spawnBent`)을 지원한다. 충돌 판정은 선분-점 최단거리 계산 방식으로, 레이저 굵기와 플레이어 히트박스 반지름을 합산하여 판정한다.

### FloorManager (systems/FloorManager.js)

바닥 장판도 3단계 라이프사이클을 거친다. 경고 깜빡임, 발동(데미지 활성), 페이드아웃 소멸이다. 형태는 rect와 circle을 지원한다.

변형(variant)은 4종이다. normal은 변형 없음, growing은 발동 중 크기가 growScale까지 확대, shrinking은 큰 상태에서 축소, moving은 moveToX/Y로 이동한다.

충돌 판정은 매 프레임 플레이어 좌표와 활성 장판의 영역을 직접 비교하는 방식이다.

### ScoreManager (systems/ScoreManager.js)

점수 체계는 기본 점수와 배율로 구성된다.

기본 점수 항목으로, 생존 시간은 초당 10점, 탄환 회피는 건당 5점, 레이저 회피는 건당 15점, 장판 회피는 건당 10점이다. QTE Great은 50점, Good은 20점이다. 스테이지 클리어 보너스는 스테이지 번호 × 100점이며, 보스 처치는 1000점이다.

배율 항목으로, 콤보 5회는 ×1.5, 10회는 ×2.0, 15회는 ×2.5이다. QTE 정확도 90% 이상은 ×1.5, 70% 이상은 ×1.3이다. 무피격 스테이지는 ×2.0이다.

등급은 이론적 최대 점수 대비 비율로 결정되며, SS(95%), S(85%), A(70%), B(50%), C(30%), D 순이다.

---

## 씬 상세

### GameScene (scenes/GameScene.js)

메인 게임플레이를 담당하며 스테이지 1~20(보스 제외)을 처리한다.

`init(data)` 단계에서 mode, controlMode, dodgeKey, stage, playerHP, totalScore를 받는다. `create()` 단계에서 그리드 배경, Player, 모든 매니저(Laser, Bullet, Floor, QTE, Gimmick, Score)를 생성하고, input을 바인딩하며 UIScene을 launch한다. `update()` 단계에서 일시정지 여부, 플레이어 생존/스테이지클리어 여부를 체크하고, handleInput 호출 후 레이저/장판 충돌을 검사한다.

스테이지 클리어 흐름은, 패턴 duration이 만료되면 `_onStageClear` 호출 → 기믹 정지/제거 → 보너스 표시 → 1.2초 후 "PRESS ENTER OR CLICK TO CONTINUE" 대기 → `_proceedToNext` → `_goNext`로 카메라 페이드아웃 후 다음 씬 시작이다.

일시정지는 F10 키 또는 UIScene의 일시정지 버튼으로 트리거되며, `scene.pause()`로 현재 씬을 정지한 후 PauseScene을 launch한다. 재개 시 PauseScene을 stop하고 `scene.resume()`을 호출한다.

### BossScene (scenes/BossScene.js)

보스전(스테이지 5, 10, 15, 20)을 전담한다. 구조는 GameScene과 유사하지만 GimmickManager 대신 Boss 엔티티의 FSM이 공격 패턴을 제어한다.

보스 처치 후 흐름은, `_onBossDefeated` → 타이머/기믹 정리 → `_showBossClearWait` (Enter/Click 대기) → `_emitBossClear`에서 `this.scene.start('GameScene', data)`로 직접 전환이다.

카운터 QTE 안전 가드로, `_startCounterQTE`에서 `qteManager.isActive`가 true이면 카운터를 건너뛰고 보스가 1초 후 다음 공격을 스케줄링한다. 이는 damage QTE와 counter QTE가 동시에 시작되어 보스 행동 체인이 끊어지는 것을 방지한다.

### UIScene (scenes/UIScene.js)

GameScene/BossScene 위에 병렬로 실행되는 HUD 오버레이이다.

표시 요소로, 좌상단에 모드/스테이지 정보, 점수, 콤보, 폭탄 수가 있다. 하단 중앙에 HP 바(200px 너비, HP 30% 이하 시 빨간색)와 스태미나 바가 있다. 우상단에 일시정지 버튼(‖ 아이콘 + F10 텍스트)과 배율 표시가 있다.

이벤트 리스닝 방식은 `_bindSceneEvents`로 GameScene과 BossScene 양쪽의 이벤트(updateHP, updateStamina, updateScore, updateCombo, updateBombs, updateMultiplier)를 리스닝한다.

### PauseScene (scenes/PauseScene.js)

반투명 검정 오버레이 위에 "PAUSED" 텍스트, "RESUME (F10)" 버튼, "RETURN TO MAIN" 버튼을 표시한다. F10 키 또는 Resume 클릭 시 `onResume` 콜백을 호출하고, Return to Main 클릭 시 `window.returnToIntro()`를 호출한다.

---

## 패턴 데이터 구조

### stagePatterns.js

각 스테이지는 다음 형태의 객체로 정의된다.

```js
{
  stage: 6,
  duration: 35,        // 스테이지 지속시간 (초)
  events: [
    { time: 2,  type: 'floor',  params: { x, y, width, height, warningTime, activeTime, shape, variant, ... } },
    { time: 5,  type: 'bullet', params: { type, originX, originY, count, speed, angle, direction, delay } },
    { time: 10, type: 'laser',  params: { startX, startY, endX, endY, width, warningTime, activeTime, bendX, bendY } },
    { time: 15, type: 'qte',    params: { sequence: ['Q','W','E'], timing: 2800 } },
  ]
}
```

스테이지 설계 의도로, 1~4는 단일 기믹 소개(장판→탄환→레이저→QTE), 5는 보스, 6~9는 2~3종 혼합, 10은 보스, 11~14는 전종 혼합(이동 장판, 꺾임 레이저 등장), 15는 보스, 16~19는 극한 밀도(최고 속도, 최단 경고), 20은 최종 보스이다.

실제 게임플레이에서는 이 원본 데이터가 GimmickManager의 `_amplifyPattern`에 의해 이벤트가 2~5배로 증가되고, `_randomizeParams`에 의해 플레이어 위치 기반으로 좌표가 동적 변환된다.

### bossConfigs.js

각 보스는 다음 설정을 가진다.

```js
{
  bossIndex: 0,
  maxHP: 400,
  attackCooldown: { min: 2500, max: 4000 },
  phases: [
    { hpThreshold: 1.0, speedMult: 1.0, patterns: ['charge', 'fan_bullets', ...] }
  ],
  attacks: {
    charge: { damage: 20, speed: 250, counterWindow: 1200 },
    fan_bullets: { count: 8, speed: 150, angle: 160 },
    // ...
  },
  qteInterval: 10000,    // damage QTE 주기 (ms)
  qteDamage: 40,          // QTE 성공 시 데미지
  qteCount: 3,            // QTE 시퀀스 길이
  qteTiming: 1500,        // QTE 타이밍 (ms)
}
```

---

## 입력 시스템

조작 설정은 localStorage에 저장되며 인트로 화면 옵션에서 변경한다.

arrows 모드에서 이동은 화살표 키, QTE는 키보드(Q/W/E/R/A/S/D/F/1~4), 구르기는 SHIFT 또는 SPACE이다. wasd 모드에서 이동은 WASD 키, QTE는 마우스 버튼(LMB/RMB/MMB), 구르기는 SHIFT 또는 SPACE이다.

공통 조작으로, 폭탄은 E 키, 일시정지는 F10 키 또는 우상단 버튼 클릭이다.

---

## 이벤트 시스템

전역 이벤트(`game.events`)로 gameReady(부팅 완료 → 인트로 표시), bossClear(보스 처치 → 다음 스테이지, fallback용), gameEnd(게임 종료 → 결과 화면), gameStarted/bossStarted(씬 시작 알림)가 있다.

씬 이벤트(`scene.events`)로 updateHP/updateStamina/updateScore/updateCombo/updateBombs/updateMultiplier(UIScene 갱신용), playerDeath(사망 처리)가 있다.

---

## QA 기능

인트로 화면 우하단에 스테이지 셀렉트 드롭다운이 있다. 1~20 중 원하는 스테이지를 선택하고 모드(Easy/Normal)를 고르면 해당 스테이지에서 바로 시작한다. 보스 스테이지 선택 시 노말 모드에서는 BossScene으로, 이지 모드에서는 GameScene(보스 스킵)으로 진입한다.

---

## 주요 상수 (constants/game.js)

플레이어 관련으로 MAX_HP는 100, MAX_STAMINA는 20, STAMINA_REGEN은 초당 1, DODGE_STAMINA_COST는 5, DODGE_DURATION은 300ms, DODGE_DISTANCE는 120px, MOVE_SPEED는 200px/s, HITBOX_RADIUS는 14px이다.

QTE 판정 관련으로 GREAT_THRESHOLD는 ±0.05, GOOD_THRESHOLD는 ±0.15, GREAT_INVINCIBLE은 300ms, BOMB_COMBO_REQUIRED는 연속 Great 5회이다.

스테이지 관련으로 TOTAL은 20, BOSS_STAGES는 [5, 10, 15, 20]이다.
