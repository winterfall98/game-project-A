import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../constants/game.js';

/**
 * Boss States (FSM)
 */
const STATE = {
  IDLE: 'idle',
  ATTACK: 'attack',
  CHARGE: 'charge',
  SPECIAL: 'special',
  STUN: 'stun',
  RAGE: 'rage',
};

/**
 * Boss entity - FSM-based boss AI
 * Manages HP, phase transitions, attack patterns, counter QTE
 */
export default class Boss extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} config - Boss configuration
   * @param {number} config.maxHP
   * @param {number} config.bossIndex - 0-3 (stage 5/10/15/20)
   * @param {Array<object>} config.phases - Phase definitions [{hpThreshold, speedMult, patterns}]
   * @param {object} config.attackCooldown - {min, max} ms between attacks
   */
  constructor(scene, x, y, config) {
    super(scene, x, y);

    this.scene = scene;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Physics body
    this.body.setCircle(30);
    this.body.setOffset(-30, -30);
    this.body.setCollideWorldBounds(true);
    this.body.setImmovable(true);

    // Config
    this.bossIndex = config.bossIndex || 0;
    this.maxHP = config.maxHP || 500;
    this.hp = this.maxHP;
    this.phases = config.phases || [{ hpThreshold: 1.0, speedMult: 1.0 }];
    this.attackCooldown = config.attackCooldown || { min: 2000, max: 4000 };

    // State
    this.state = STATE.IDLE;
    this.currentPhase = 0;
    this.isAlive = true;
    this.isStunned = false;

    // Visual
    this.gfx = scene.add.graphics();
    this.add(this.gfx);
    this.drawBoss();

    // HP bar (top of screen)
    this.hpBarGfx = scene.add.graphics();
    this.hpBarGfx.setDepth(90);
    this.drawHPBar();

    // Boss name
    const bossNames = ['GUARDIAN', 'WARDEN', 'OVERLORD', 'FINAL BOSS'];
    this.nameText = scene.add.text(GAME_WIDTH / 2, 16, bossNames[this.bossIndex] || 'BOSS', {
      fontFamily: 'monospace',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ef5350',
    }).setOrigin(0.5).setDepth(91);

    // Attack timer
    this._attackTimer = null;
    this._stateTimer = null;

    // Callbacks (set by BossScene)
    this.onAttack = null;       // (attackType) => void
    this.onCounterWindow = null; // () => void
    this.onPhaseChange = null;  // (phaseIndex) => void
    this.onDeath = null;        // () => void
  }

  // ===================================================
  // Visual
  // ===================================================

  drawBoss() {
    this.gfx.clear();
    const color = this.isStunned ? 0x888888 : this._getPhaseColor();

    // Body - hexagonal shape
    this.gfx.fillStyle(color, 1);
    this.gfx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const px = Math.cos(angle) * 28;
      const py = Math.sin(angle) * 28;
      if (i === 0) this.gfx.moveTo(px, py);
      else this.gfx.lineTo(px, py);
    }
    this.gfx.closePath();
    this.gfx.fillPath();

    // Core
    this.gfx.fillStyle(0x1a1a2e, 1);
    this.gfx.fillCircle(0, 0, 12);

    // Eye
    const eyeColor = this.state === STATE.RAGE ? 0xff0000 : 0xffffff;
    this.gfx.fillStyle(eyeColor, 1);
    this.gfx.fillCircle(0, 0, 6);
    this.gfx.fillStyle(0x1a1a2e, 1);
    this.gfx.fillCircle(0, 0, 3);

    // Phase indicator dots
    for (let i = 0; i < this.phases.length; i++) {
      const dotColor = i <= this.currentPhase ? 0xffffff : 0x333333;
      this.gfx.fillStyle(dotColor, 0.8);
      const dotX = -((this.phases.length - 1) * 6) + i * 12;
      this.gfx.fillCircle(dotX, 36);
    }
  }

  _getPhaseColor() {
    const colors = [COLORS.BOSS_BODY, 0xff6e40, 0xff1744, 0xd50000];
    return colors[this.currentPhase] || COLORS.BOSS_BODY;
  }

  drawHPBar() {
    this.hpBarGfx.clear();
    const barW = 300;
    const barH = 12;
    const barX = (GAME_WIDTH - barW) / 2;
    const barY = 32;
    const ratio = this.hp / this.maxHP;

    // Background
    this.hpBarGfx.fillStyle(0x333333, 0.8);
    this.hpBarGfx.fillRect(barX, barY, barW, barH);

    // Fill
    const hpColor = ratio > 0.5 ? COLORS.BOSS_HP : ratio > 0.25 ? 0xff6e40 : 0xff1744;
    this.hpBarGfx.fillStyle(hpColor, 1);
    this.hpBarGfx.fillRect(barX, barY, barW * ratio, barH);

    // Border
    this.hpBarGfx.lineStyle(1, 0xffffff, 0.5);
    this.hpBarGfx.strokeRect(barX, barY, barW, barH);

    // Phase threshold markers
    this.phases.forEach((phase, i) => {
      if (i === 0) return;
      const markerX = barX + barW * phase.hpThreshold;
      this.hpBarGfx.lineStyle(2, 0xffffff, 0.8);
      this.hpBarGfx.lineBetween(markerX, barY - 2, markerX, barY + barH + 2);
    });
  }

  // ===================================================
  // FSM - State Machine
  // ===================================================

  /**
   * Start boss behavior loop
   */
  startBehavior() {
    this.setState(STATE.IDLE);
    this._scheduleNextAttack();
  }

  setState(newState) {
    this.state = newState;
    this.drawBoss();

    switch (newState) {
      case STATE.IDLE:
        this.body.setVelocity(0, 0);
        break;

      case STATE.STUN:
        this.isStunned = true;
        this.body.setVelocity(0, 0);
        // Flash effect
        this.scene.tweens.add({
          targets: this, alpha: 0.4, duration: 100,
          yoyo: true, repeat: 9,
          onComplete: () => { this.alpha = 1; },
        });
        break;

      case STATE.RAGE:
        // Camera shake + flash on rage
        this.scene.cameras.main.shake(500, 0.02);
        const flash = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, this._getPhaseColor(), 0.3);
        this.scene.tweens.add({
          targets: flash, alpha: 0, duration: 500,
          onComplete: () => flash.destroy(),
        });
        break;
    }
  }

  _scheduleNextAttack() {
    if (!this.isAlive) return;

    const delay = Phaser.Math.Between(this.attackCooldown.min, this.attackCooldown.max);
    const speedMult = this.phases[this.currentPhase]?.speedMult || 1;
    const adjustedDelay = delay / speedMult;

    this._attackTimer = this.scene.time.delayedCall(adjustedDelay, () => {
      if (!this.isAlive || this.isStunned) {
        this._scheduleNextAttack();
        return;
      }
      this._executeAttack();
    });
  }

  _executeAttack() {
    const phasePatterns = this.phases[this.currentPhase]?.patterns || ['charge'];
    const attackType = Phaser.Utils.Array.GetRandom(phasePatterns);

    this.setState(STATE.ATTACK);

    // Counter QTE window before signature attacks
    if (attackType === 'charge' && this.onCounterWindow) {
      this.onCounterWindow();
      // Wait for counter result before executing
      return;
    }

    if (this.onAttack) {
      this.onAttack(attackType);
    }

    // Return to idle after attack duration
    this.scene.time.delayedCall(1500, () => {
      if (this.isAlive && !this.isStunned) {
        this.setState(STATE.IDLE);
        this._scheduleNextAttack();
      }
    });
  }

  // ===================================================
  // Damage & Phases
  // ===================================================

  /**
   * Deal damage to boss (from QTE success)
   * @param {number} amount
   */
  takeDamage(amount) {
    if (!this.isAlive) return;

    this.hp = Math.max(0, this.hp - amount);
    this.drawHPBar();

    // Hit flash
    this.scene.tweens.add({
      targets: this, alpha: 0.5, duration: 50,
      yoyo: true, repeat: 1,
      onComplete: () => { this.alpha = 1; },
    });

    // Check phase transition
    this._checkPhaseTransition();

    // Death check
    if (this.hp <= 0) {
      this.die();
    }
  }

  _checkPhaseTransition() {
    const hpRatio = this.hp / this.maxHP;

    for (let i = this.phases.length - 1; i > this.currentPhase; i--) {
      if (hpRatio <= this.phases[i].hpThreshold) {
        this.currentPhase = i;
        this.setState(STATE.RAGE);

        if (this.onPhaseChange) {
          this.onPhaseChange(i);
        }

        // Brief invulnerability during phase transition
        this.scene.time.delayedCall(1500, () => {
          if (this.isAlive) {
            this.setState(STATE.IDLE);
            this._scheduleNextAttack();
          }
        });
        break;
      }
    }
  }

  // ===================================================
  // Stun (from counter QTE success)
  // ===================================================

  /**
   * Stun the boss (cancels current attack)
   * @param {number} duration - Stun duration in ms
   */
  stun(duration = 2000) {
    this.setState(STATE.STUN);

    if (this._attackTimer) {
      this._attackTimer.remove(false);
    }

    this.scene.time.delayedCall(duration, () => {
      if (this.isAlive) {
        this.isStunned = false;
        this.setState(STATE.IDLE);
        this._scheduleNextAttack();
      }
    });
  }

  // ===================================================
  // Movement
  // ===================================================

  /**
   * Charge toward a position
   */
  chargeTo(targetX, targetY, speed = 300, onArrival) {
    this.setState(STATE.CHARGE);
    const dist = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
    const duration = (dist / speed) * 1000;

    this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      duration: Math.max(duration, 300),
      ease: 'Power2',
      onComplete: () => {
        if (onArrival) onArrival();
      },
    });
  }

  /**
   * Slow drift movement (idle behavior)
   */
  driftTo(targetX, targetY, duration = 2000) {
    this.scene.tweens.add({
      targets: this,
      x: Phaser.Math.Clamp(targetX, 60, GAME_WIDTH - 60),
      y: Phaser.Math.Clamp(targetY, 60, GAME_HEIGHT / 2),
      duration,
      ease: 'Sine.easeInOut',
    });
  }

  // ===================================================
  // Death
  // ===================================================

  die() {
    this.isAlive = false;
    this.body.enable = false;

    if (this._attackTimer) this._attackTimer.remove(false);

    // Death animation
    this.scene.cameras.main.shake(800, 0.03);

    this.scene.tweens.add({
      targets: this,
      scaleX: 2, scaleY: 2, alpha: 0, angle: 180,
      duration: 1200, ease: 'Power2',
      onComplete: () => {
        this.hpBarGfx.destroy();
        this.nameText.destroy();
        if (this.onDeath) this.onDeath();
      },
    });

    // Explosion particles (simple circles)
    for (let i = 0; i < 12; i++) {
      const px = this.x + Phaser.Math.Between(-40, 40);
      const py = this.y + Phaser.Math.Between(-40, 40);
      const circle = this.scene.add.circle(px, py, Phaser.Math.Between(4, 12), this._getPhaseColor(), 0.8);
      this.scene.tweens.add({
        targets: circle,
        x: px + Phaser.Math.Between(-100, 100),
        y: py + Phaser.Math.Between(-100, 100),
        alpha: 0, scaleX: 0.1, scaleY: 0.1,
        duration: Phaser.Math.Between(500, 1000),
        delay: Phaser.Math.Between(0, 400),
        onComplete: () => circle.destroy(),
      });
    }
  }

  // ===================================================
  // Cleanup
  // ===================================================

  destroy() {
    if (this._attackTimer) this._attackTimer.remove(false);
    if (this._stateTimer) this._stateTimer.remove(false);
    if (this.hpBarGfx) this.hpBarGfx.destroy();
    if (this.nameText) this.nameText.destroy();
    super.destroy();
  }
}

export { STATE as BOSS_STATE };
