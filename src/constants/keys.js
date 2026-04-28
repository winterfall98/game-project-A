// 키 매핑 상수

// 기본 설정
export const DEFAULT_SETTINGS = {
  controlMode: 'arrows',    // 'arrows' | 'wasd'
  dodgeKey: 'SHIFT',        // 'SHIFT' | 'SPACE'
};

// 방향키 모드 QTE 키
export const QTE_KEYS_ARROWS = ['Q', 'W', 'E', 'R', 'A', 'S', 'D', 'F', 'ONE', 'TWO', 'THREE', 'FOUR'];

// 이지 모드 QTE 키 (QWER만)
export const QTE_KEYS_EASY = ['Q', 'W', 'E', 'R'];

// WASD 모드 QTE → 마우스 버튼
export const QTE_MOUSE_BUTTONS = {
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2,
};

// 키 표시 이름 매핑
export const KEY_DISPLAY_NAMES = {
  Q: 'Q', W: 'W', E: 'E', R: 'R',
  A: 'A', S: 'S', D: 'D', F: 'F',
  ONE: '1', TWO: '2', THREE: '3', FOUR: '4',
  LEFT: 'LMB', MIDDLE: 'MMB', RIGHT: 'RMB',
};
