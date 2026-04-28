// 수학 유틸리티 함수

/**
 * 각도를 라디안으로 변환
 */
export function degToRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * 라디안을 각도로 변환
 */
export function radToDeg(rad) {
  return rad * (180 / Math.PI);
}

/**
 * min~max 사이 랜덤 정수
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * min~max 사이 랜덤 실수
 */
export function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * 두 점 사이 거리
 */
export function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * 값을 min~max 범위로 클램프
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
