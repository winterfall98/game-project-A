import Phaser from 'phaser';

/**
 * BootScene - 에셋 프리로드 및 초기화
 * Graphics 기반이므로 프리로드 최소. 추후 사운드/이미지 추가 시 확장.
 */
export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // 현재 Graphics 기반이므로 프리로드할 에셋 없음
    // 추후 사운드, 스프라이트시트 등 여기에 추가
    console.log('[BootScene] preload complete');
  }

  create() {
    console.log('[BootScene] 초기화 완료, GameScene 대기 중');

    // DOM UI에게 게임 준비 완료를 알림
    this.game.events.emit('gameReady');
  }
}
