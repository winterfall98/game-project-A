// 게임 전역 상수

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

// 캐릭터 스탯
export const PLAYER = {
  MAX_HP: 100,
  MAX_STAMINA: 20,
  STAMINA_REGEN: 1,        // 초당 회복량
  DODGE_STAMINA_COST: 5,
  DODGE_DURATION: 300,      // 구르기 무적 시간 (ms)
  DODGE_DISTANCE: 120,      // 구르기 이동 거리
  MOVE_SPEED: 200,          // 이동 속도 (px/s)
  HITBOX_RADIUS: 14,        // 히트박스 반지름
};

// QTE 판정 범위
export const QTE = {
  GREAT_THRESHOLD: 0.05,    // |차이| <= 0.05 → Great
  GOOD_THRESHOLD: 0.15,     // |차이| <= 0.15 → Good
  GREAT_INVINCIBLE: 300,    // Great 시 무적 시간 (ms)
  BOMB_COMBO_REQUIRED: 5,   // 폭탄 획득에 필요한 연속 Great
};

// 스코어링
export const SCORE = {
  SURVIVAL_PER_SEC: 10,
  BULLET_DODGE: 5,
  LASER_DODGE: 15,
  FLOOR_DODGE: 10,
  QTE_GREAT: 50,
  QTE_GOOD: 20,
  STAGE_CLEAR_MULTIPLIER: 100, // 스테이지 번호 × 100
  BOSS_KILL: 1000,
};

// 배율
export const MULTIPLIER = {
  COMBO_5: 1.5,
  COMBO_10: 2.0,
  COMBO_15: 2.5,
  COMBO_MAX: 3.0,
  NO_DAMAGE: 2.0,
  ACCURACY_90: 1.5,
  ACCURACY_70: 1.3,
};

// 등급 임계치
export const GRADE_THRESHOLDS = {
  SS: 0.95,
  S: 0.85,
  A: 0.70,
  B: 0.50,
  C: 0.30,
};

// 스테이지
export const STAGE = {
  TOTAL: 20,
  BOSS_STAGES: [5, 10, 15, 20],
  DURATION_MIN: 30,         // 최소 스테이지 시간 (초)
  DURATION_MAX: 50,         // 최대 스테이지 시간 (초)
};

// 모드
export const MODE = {
  EASY: 'easy',
  NORMAL: 'normal',
};

// 조작 모드
export const CONTROL = {
  ARROWS: 'arrows',
  WASD: 'wasd',
};

// 색상 팔레트 (접근성 고려)
export const COLORS = {
  // 배경
  BG_GRID: 0x1a1a2e,
  GRID_LINE: 0x2a2a4e,

  // 플레이어
  PLAYER_BODY: 0x4fc3f7,
  PLAYER_DODGE: 0x81d4fa,

  // 기믹
  LASER_WARNING: 0xff6b6b,
  LASER_ACTIVE: 0xff0000,
  BULLET: 0xffa726,
  FLOOR_WARNING: 0xffee58,
  FLOOR_ACTIVE: 0xf44336,

  // QTE
  QTE_FRAME: 0xffffff,
  QTE_BAND: 0x66bb6a,
  QTE_GREAT: 0x00e676,
  QTE_GOOD: 0xffeb3b,
  QTE_FAIL: 0xff1744,

  // UI
  HP_BAR: 0x4caf50,
  HP_BAR_LOW: 0xf44336,
  STAMINA_BAR: 0x29b6f6,
  COMBO_TEXT: 0xffd740,

  // 보스
  BOSS_BODY: 0x7c4dff,
  BOSS_HP: 0xef5350,
};
