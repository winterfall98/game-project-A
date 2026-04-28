// localStorage 기반 설정 저장/로드

import { DEFAULT_SETTINGS } from '../constants/keys.js';

const STORAGE_KEY = 'qte-dodge-game-settings';

/**
 * 설정을 localStorage에서 로드
 * @returns {object} 저장된 설정 또는 기본값
 */
export function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('설정 로드 실패, 기본값 사용:', e);
  }
  return { ...DEFAULT_SETTINGS };
}

/**
 * 설정을 localStorage에 저장
 * @param {object} settings - 저장할 설정 객체
 */
export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('설정 저장 실패:', e);
  }
}

/**
 * 설정 초기화
 */
export function resetSettings() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('설정 초기화 실패:', e);
  }
  return { ...DEFAULT_SETTINGS };
}
