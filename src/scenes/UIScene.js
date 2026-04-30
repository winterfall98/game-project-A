import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, PLAYER } from '../constants/game.js';

/**
 * UIScene - HUD overlay (runs parallel on top of GameScene/BossScene)
 * HP bar, stamina bar, score, combo with effects, bombs, stage info
 */
export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  init(data) {
    this.gameMode = data.mode || 'normal';
    this.currentStage = data.stage || 1;
    this.isBoss = data.isBoss || false;
    // Phaser 자동 등록에 의존하지 않고 명시적으로 shutdown 핸들러 등록
    this.events.once('shutdown', this._onShutdown, this);
  }

  _onShutdown() {
    console.log('[UIScene] shutdown -> unbinding cross-scene listeners');
    this._unbindSceneEvents('GameScene');
    this._unbindSceneEvents('BossScene');
  }

  create() {
    // === Top-left info ===
    const stageLabel = this.isBoss ? 'BOSS' : 'STAGE';

    this.stageText = this.add.text(16, 12, `${stageLabel} ${this.currentStage}`, {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffffff',
    });

    this.scoreText = this.add.text(16, 36, 'SCORE: 0', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffd740',
    });

    this.comboText = this.add.text(16, 56, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ff6e40',
    });

    // Combo pop number (large, fades)
    this.comboPop = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120, '', {
      fontFamily: 'monospace', fontSize: '36px', fontStyle: 'bold', color: '#ff6e40',
    }).setOrigin(0.5).setAlpha(0).setDepth(150);

    // Bomb icons
    this.bombText = this.add.text(16, 76, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#e040fb',
    });

    // Multiplier display
    this.multText = this.add.text(GAME_WIDTH - 16, 56, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#81d4fa',
    }).setOrigin(1, 0);

    // === HP bar (bottom center) ===
    const barY = GAME_HEIGHT - 40;
    const barWidth = 200;
    const barHeight = 16;
    const barX = (GAME_WIDTH - barWidth) / 2;

    this.hpBarBg = this.add.graphics();
    this.hpBarBg.fillStyle(0x333333, 0.8);
    this.hpBarBg.fillRect(barX, barY, barWidth, barHeight);

    this.hpBar = this.add.graphics();
    this.drawHPBar(PLAYER.MAX_HP, PLAYER.MAX_HP);

    this.hpText = this.add.text(barX + barWidth + 8, barY, `${PLAYER.MAX_HP}/${PLAYER.MAX_HP}`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#ffffff',
    });

    // === Stamina bar ===
    const staBarY = barY + barHeight + 4;
    this.staBarBg = this.add.graphics();
    this.staBarBg.fillStyle(0x333333, 0.8);
    this.staBarBg.fillRect(barX, staBarY, barWidth, 8);

    this.staBar = this.add.graphics();
    this.drawStaminaBar(PLAYER.MAX_STAMINA, PLAYER.MAX_STAMINA);

    // === Pause button (top-right) ===
    this._createPauseButton();

    // === Event listeners (GameScene/BossScene -> UIScene) ===
    this._bindSceneEvents('GameScene');
    this._bindSceneEvents('BossScene');

    console.log('[UIScene] HUD created');
  }

  _bindSceneEvents(sceneName) {
    const scene = this.scene.get(sceneName);
    if (!scene) return;
    scene.events.on('updateHP', this.onUpdateHP, this);
    scene.events.on('updateStamina', this.onUpdateStamina, this);
    scene.events.on('updateScore', this.onUpdateScore, this);
    scene.events.on('updateCombo', this.onUpdateCombo, this);
    scene.events.on('updateBombs', this.onUpdateBombs, this);
    scene.events.on('updateMultiplier', this.onUpdateMultiplier, this);
  }

  // cross-scene 리스너 누수 방지: UIScene shutdown 시 GameScene/BossScene events에서 명시적 해제
  _unbindSceneEvents(sceneName) {
    const scene = this.scene.get(sceneName);
    if (!scene || !scene.events) return;
    scene.events.off('updateHP', this.onUpdateHP, this);
    scene.events.off('updateStamina', this.onUpdateStamina, this);
    scene.events.off('updateScore', this.onUpdateScore, this);
    scene.events.off('updateCombo', this.onUpdateCombo, this);
    scene.events.off('updateBombs', this.onUpdateBombs, this);
    scene.events.off('updateMultiplier', this.onUpdateMultiplier, this);
  }

  shutdown() {
    this._unbindSceneEvents('GameScene');
    this._unbindSceneEvents('BossScene');
  }

  drawHPBar(current, max) {
    const barWidth = 200;
    const barHeight = 16;
    const barX = (GAME_WIDTH - barWidth) / 2;
    const barY = GAME_HEIGHT - 40;
    const ratio = Math.max(0, current / max);

    this.hpBar.clear();
    const color = ratio > 0.3 ? COLORS.HP_BAR : COLORS.HP_BAR_LOW;
    this.hpBar.fillStyle(color, 1);
    this.hpBar.fillRect(barX, barY, barWidth * ratio, barHeight);
  }

  drawStaminaBar(current, max) {
    const barWidth = 200;
    const barX = (GAME_WIDTH - barWidth) / 2;
    const barY = GAME_HEIGHT - 40 + 16 + 4;
    const ratio = Math.max(0, current / max);

    this.staBar.clear();
    this.staBar.fillStyle(COLORS.STAMINA_BAR, 1);
    this.staBar.fillRect(barX, barY, barWidth * ratio, 8);
  }

  onUpdateHP({ current, max }) {
    this.drawHPBar(current, max);
    this.hpText.setText(`${Math.max(0, current)}/${max}`);

    // Low HP warning flash
    if (current > 0 && current <= max * 0.3) {
      this.hpText.setColor('#ff1744');
    } else {
      this.hpText.setColor('#ffffff');
    }
  }

  onUpdateStamina({ current, max }) {
    this.drawStaminaBar(current, max);
  }

  onUpdateScore({ score }) {
    this.scoreText.setText(`SCORE: ${score}`);
  }

  onUpdateCombo({ combo, multiplier }) {
    if (combo > 0) {
      this.comboText.setText(`COMBO: ${combo}  (x${multiplier.toFixed(1)})`);

      // Combo milestone pop effect (at 5, 10, 15)
      if (combo === 5 || combo === 10 || combo === 15 || combo === 20) {
        this.comboPop.setText(`${combo} COMBO!`);
        this.comboPop.setAlpha(1).setScale(0.5);
        this.tweens.add({
          targets: this.comboPop,
          scaleX: 1.3, scaleY: 1.3, alpha: 0,
          duration: 800, ease: 'Power2',
        });
      }
    } else {
      this.comboText.setText('');
    }
  }

  onUpdateBombs({ count }) {
    if (count > 0) {
      // Use text stars instead of unicode
      this.bombText.setText('BOMB: ' + '*'.repeat(count));
    } else {
      this.bombText.setText('');
    }
  }

  onUpdateMultiplier({ combo, accuracy, noDamage }) {
    const parts = [];
    if (combo > 1.0) parts.push('CMB x' + combo.toFixed(1));
    if (accuracy > 1.0) parts.push('ACC x' + accuracy.toFixed(1));
    if (noDamage > 1) parts.push('ND x' + noDamage.toFixed(1));
    this.multText.setText(parts.join(' | '));
  }

  _createPauseButton() {
    // 일시정지 아이콘 (|| 기호) + F10 텍스트
    const btnX = GAME_WIDTH - 60;
    const btnY = 14;

    // 배경 박스
    const bg = this.add.rectangle(btnX + 28, btnY + 12, 72, 28, 0x000000, 0.4)
      .setOrigin(0.5).setDepth(90).setInteractive({ useHandCursor: true });

    // || 아이콘 (두 줄 바)
    const icon = this.add.graphics().setDepth(91);
    icon.fillStyle(0xaaaacc, 1);
    icon.fillRect(btnX, btnY + 3, 4, 16);
    icon.fillRect(btnX + 8, btnY + 3, 4, 16);

    // F10 라벨
    const label = this.add.text(btnX + 18, btnY + 2, 'F10', {
      fontFamily: 'monospace', fontSize: '13px', color: '#aaaacc',
    }).setDepth(91);

    // 호버 효과
    bg.on('pointerover', () => {
      bg.setFillStyle(0x333366, 0.6);
      label.setColor('#ffffff');
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0x000000, 0.4);
      label.setColor('#aaaacc');
    });

    // 클릭 시 현재 활성 게임 씬의 pause를 트리거
    bg.on('pointerdown', () => {
      const gameScene = this.scene.get('GameScene');
      const bossScene = this.scene.get('BossScene');
      if (gameScene && this.scene.isActive('GameScene') && gameScene._togglePause) {
        gameScene._togglePause();
      } else if (bossScene && this.scene.isActive('BossScene') && bossScene._togglePause) {
        bossScene._togglePause();
      }
    });
  }
}
