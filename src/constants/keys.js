// 키 매핑 상수

// 기본 설정
export const DEFAULT_SETTINGS = {
  controlMode: 'arrows',    // 'arrows' | 'wasd'
  dodgeKey: 'SHIFT',        // 'SHIFT' | 'SPACE'
};

// 방향키 모드 QTE 키 (왼손이 이동, 오른손은 12개 키 풀)
export const QTE_KEYS_ARROWS = ['Q', 'W', 'E', 'R', 'A', 'S', 'D', 'F', 'ONE', 'TWO', 'THREE', 'FOUR'];

// WASD 모드 QTE 키 (왼손이 이동(WASD), 오른손은 키보드 오른쪽 영역 12개)
export const QTE_KEYS_WASD = [
  'EIGHT', 'NINE', 'ZERO', 'MINUS',
  'I', 'O', 'P', 'OPEN_BRACKET',
  'K', 'L', 'SEMICOLON', 'QUOTES',
];

// 키 표시 이름 매핑
export const KEY_DISPLAY_NAMES = {
  // arrows 모드
  Q: 'Q', W: 'W', E: 'E', R: 'R',
  A: 'A', S: 'S', D: 'D', F: 'F',
  ONE: '1', TWO: '2', THREE: '3', FOUR: '4',
  // wasd 모드 (오른손)
  EIGHT: '8', NINE: '9', ZERO: '0', MINUS: '-',
  I: 'I', O: 'O', P: 'P', OPEN_BRACKET: '[',
  K: 'K', L: 'L', SEMICOLON: ';', QUOTES: "'",
};
