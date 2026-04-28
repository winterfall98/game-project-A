import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants/game.js';

/**
 * PauseScene - 일시정지 오버레이
 * 게임 재개 / 메인으로 돌아가기 버튼
 */
export default class PauseScene extends Phaser.Scene {
  constructor() { super({ key: 'PauseScene' }); }

  init(data) {
    this.returnScene = data.returnScene || 'GameScene';
    this._onResume = data.onResume || null;
  }

  create() {
    // 반투명 어두운 배경
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7).setDepth(300);

    // PAUSED 텍스트
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 'PAUSED', {
      fontFamily: 'monospace', fontSize: '36px', fontStyle: 'bold', color: '#4fc3f7',
    }).setOrigin(0.5).setDepth(301);

    // 게임 재개 버튼
    var resumeBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, '[ RESUME  (F10) ]', {
      fontFamily: 'monospace', fontSize: '18px', color: '#66bb6a',
    }).setOrigin(0.5).setDepth(301).setInteractive({ useHandCursor: true });
    resumeBtn.on('pointerover', function() { resumeBtn.setColor('#a5d6a7'); });
    resumeBtn.on('pointerout', function() { resumeBtn.setColor('#66bb6a'); });
    resumeBtn.on('pointerdown', function() { this._resume(); }, this);

    // 메인으로 돌아가기 버튼
    var mainBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, '[ RETURN TO MAIN ]', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ff7043',
    }).setOrigin(0.5).setDepth(301).setInteractive({ useHandCursor: true });
    mainBtn.on('pointerover', function() { mainBtn.setColor('#ffab91'); });
    mainBtn.on('pointerout', function() { mainBtn.setColor('#ff7043'); });
    mainBtn.on('pointerdown', function() { this._returnToMain(); }, this);

    // F10으로 재개
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F10);
    this.pauseKey.on('down', this._resume, this);
  }

  _resume() {
    if (this._onResume) this._onResume();
  }

  _returnToMain() {
    // returnToIntro가 GameScene/BossScene/UIScene을 stop하므로 PauseScene만 정리
    this.scene.stop('PauseScene');
    if (window.returnToIntro) window.returnToIntro();
  }
}
