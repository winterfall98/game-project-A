import Phaser from 'phaser';
import { PLAYER } from '../constants/game.js';

/**
 * Shared input controller for gameplay scenes.
 * Handles keyboard/mobile movement, dodge, bomb, and pause key hook.
 */
export default class CombatInputController {
  constructor(scene, options) {
    this.scene = scene;
    this.options = options || {};

    this.cursors = null;
    this.wasdKeys = null;
    this.shiftKey = null;
    this.spaceKey = null;
    this.bombKey = null;
    this.pauseKey = null;
    this._boundPauseHandler = null;
  }

  setupInput() {
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.wasdKeys = this.scene.input.keyboard.addKeys('W,A,S,D');
    this.shiftKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.bombKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Y);
    this.pauseKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F10);

    this._boundPauseHandler = () => {
      if (this.options.onPauseToggle) this.options.onPauseToggle();
    };
    this.pauseKey.on('down', this._boundPauseHandler);
    this.scene.input.mouse.disableContextMenu();
  }

  handleInput(player, qteManager) {
    if (!player || !qteManager) return;
    if (this.options.isInputLocked && this.options.isInputLocked()) return;

    const mobileMode = this.options.getMobileMode ? this.options.getMobileMode() : false;
    const touchControls = this.options.getTouchControls ? this.options.getTouchControls() : null;

    if (mobileMode && touchControls) {
      const move = touchControls.getMovement();
      player.move(move.x, move.y);

      if (touchControls.consumeDash()) {
        player.dodge();
      }

      if (touchControls.consumeBomb()) {
        this._useBomb(qteManager);
      }

      touchControls.updateState(
        player.stamina >= PLAYER.DODGE_STAMINA_COST,
        qteManager.bombs,
      );
      return;
    }

    let moveX = 0;
    let moveY = 0;
    const controlMode = this.options.getControlMode ? this.options.getControlMode() : 'arrows';
    const dodgeKey = this.options.getDodgeKey ? this.options.getDodgeKey() : 'SHIFT';

    if (controlMode === 'wasd') {
      if (this.wasdKeys.A.isDown) moveX = -1;
      if (this.wasdKeys.D.isDown) moveX = 1;
      if (this.wasdKeys.W.isDown) moveY = -1;
      if (this.wasdKeys.S.isDown) moveY = 1;
    } else {
      if (this.cursors.left.isDown) moveX = -1;
      if (this.cursors.right.isDown) moveX = 1;
      if (this.cursors.up.isDown) moveY = -1;
      if (this.cursors.down.isDown) moveY = 1;
    }

    player.move(moveX, moveY);

    const dodgePressed = dodgeKey === 'SHIFT'
      ? Phaser.Input.Keyboard.JustDown(this.shiftKey)
      : Phaser.Input.Keyboard.JustDown(this.spaceKey);
    if (dodgePressed) player.dodge();

    if (Phaser.Input.Keyboard.JustDown(this.bombKey)) {
      this._useBomb(qteManager);
    }
  }

  _useBomb(qteManager) {
    qteManager.useBomb(() => {
      if (this.options.onBomb) this.options.onBomb();
    });
  }

  destroy() {
    if (this.pauseKey && this._boundPauseHandler) {
      this.pauseKey.off('down', this._boundPauseHandler);
    }
    this._boundPauseHandler = null;
  }
}

