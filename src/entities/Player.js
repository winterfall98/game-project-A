import Phaser from 'phaser';
import { PLAYER, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../constants/game.js';
import { impactEffect, dodgeTrail } from '../utils/effects.js';

/**
 * Player 엔티티
 * - Phaser.GameObjects.Container 기반
 * - Graphics로 간략한 사람 형상 드로잉
 * - Arcade Physics body (원형 히트박스)
 * - 8방향 이동, 구르기(무적), HP, 스태미나
 */
export default class Player extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);

    this.scene = scene;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // ── 물리 바디 설정 (원형 히트박스) ──
    this.body.setCircle(PLAYER.HITBOX_RADIUS);
    this.body.setOffset(-PLAYER.HITBOX_RADIUS, -PLAYER.HITBOX_RADIUS);
    this.body.setCollideWorldBounds(true);
    this.body.setMaxVelocity(PLAYER.MOVE_SPEED, PLAYER.MOVE_SPEED);

    // ── 상태 ──
    this.hp = PLAYER.MAX_HP;
    this.stamina = PLAYER.MAX_STAMINA;
    this.isInvincible = false;
    this.isDodging = false;
    this.isAlive = true;

    // 무적 타이머 참조 (중복 방지용)
    this._invincibleTimer = null;

    // 마지막 이동 방향 (구르기 방향 결정용)
    this.lastDirX = 0;
    this.lastDirY = 1; // 기본 아래쪽

    // ── 비주얼 드로잉 ──
    this.gfx = scene.add.graphics();
    this.add(this.gfx);
    this.drawCharacter();

    // ── 히트박스 디버그 표시 (개발용) ──
    this.hitboxDebug = scene.add.graphics();
    this.add(this.hitboxDebug);
    this.showHitbox = false; // true로 바꾸면 히트박스 표시

    // ── 스태미나 자동 회복 (초당 1) ──
    this._staminaRegenTimer = scene.time.addEvent({
      delay: 1000,
      callback: this.regenStamina,
      callbackScope: this,
      loop: true,
    });
  }

  // ═══════════════════════════════════════
  // 비주얼
  // ═══════════════════════════════════════

  /**
   * 간략한 사람 형상 드로잉 (머리 원 + 몸통 + 다리)
   */
  drawCharacter() {
    this.gfx.clear();
    const color = this.isDodging ? COLORS.PLAYER_DODGE : COLORS.PLAYER_BODY;

    // 몸통 (직사각형)
    this.gfx.fillStyle(color, 1);
    this.gfx.fillRoundedRect(-8, -4, 16, 20, 3);

    // 머리 (원)
    this.gfx.fillStyle(color, 1);
    this.gfx.fillCircle(0, -10, 8);

    // 눈 (방향 표시용 점)
    this.gfx.fillStyle(0x1a1a2e, 1);
    this.gfx.fillCircle(-3, -11, 1.5);
    this.gfx.fillCircle(3, -11, 1.5);

    // 다리 (두 줄)
    this.gfx.lineStyle(3, color, 1);
    this.gfx.lineBetween(-4, 16, -6, 26);
    this.gfx.lineBetween(4, 16, 6, 26);

    // 히트박스 디버그
    if (this.showHitbox) {
      this.hitboxDebug.clear();
      this.hitboxDebug.lineStyle(1, 0x00ff00, 0.6);
      this.hitboxDebug.strokeCircle(0, 0, PLAYER.HITBOX_RADIUS);
    }
  }

  // ═══════════════════════════════════════
  // 이동
  // ═══════════════════════════════════════

  /**
   * 8방향 이동 처리 (매 프레임 호출)
   * @param {number} dirX  -1, 0, 1
   * @param {number} dirY  -1, 0, 1
   */
  move(dirX, dirY) {
    if (!this.isAlive || this.isDodging) return;

    if (dirX !== 0 || dirY !== 0) {
      this.lastDirX = dirX;
      this.lastDirY = dirY;
    }

    // 속도 설정 (대각선 정규화)
    let vx = dirX * PLAYER.MOVE_SPEED;
    let vy = dirY * PLAYER.MOVE_SPEED;

    if (dirX !== 0 && dirY !== 0) {
      const factor = 1 / Math.SQRT2;
      vx *= factor;
      vy *= factor;
    }

    this.body.setVelocity(vx, vy);
  }

  // ═══════════════════════════════════════
  // 구르기
  // ═══════════════════════════════════════

  /**
   * 구르기 실행
   * @returns {boolean} 구르기 성공 여부
   */
  dodge() {
    if (!this.isAlive || this.isDodging) return false;
    if (this.stamina < PLAYER.DODGE_STAMINA_COST) return false;

    // 스태미나 소모
    this.stamina -= PLAYER.DODGE_STAMINA_COST;
    this.isDodging = true;

    // 무적 부여
    this.setInvincible(PLAYER.DODGE_DURATION);

    // 대시 방향 결정 (마지막 이동 방향)
    let dx = this.lastDirX;
    let dy = this.lastDirY;
    if (dx === 0 && dy === 0) dy = 1; // 기본 아래

    // 대각선 정규화
    const len = Math.sqrt(dx * dx + dy * dy);
    dx /= len;
    dy /= len;

    // 구르기 목표 위치 계산
    const targetX = Phaser.Math.Clamp(
      this.x + dx * PLAYER.DODGE_DISTANCE,
      PLAYER.HITBOX_RADIUS,
      GAME_WIDTH - PLAYER.HITBOX_RADIUS
    );
    const targetY = Phaser.Math.Clamp(
      this.y + dy * PLAYER.DODGE_DISTANCE,
      PLAYER.HITBOX_RADIUS,
      GAME_HEIGHT - PLAYER.HITBOX_RADIUS
    );

    // 이동 중 속도 0으로 (tween이 위치를 제어)
    this.body.setVelocity(0, 0);

    // 비주얼 변경
    this.drawCharacter();

    // 잔상 이펙트
    this.spawnAfterimage();

    // 대시 tween
    this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      duration: PLAYER.DODGE_DURATION,
      ease: 'Power2',
      onUpdate: () => {
        // 잔상 중간에 추가
        if (Math.random() < 0.3) this.spawnAfterimage();
      },
      onComplete: () => {
        this.isDodging = false;
        this.drawCharacter();
      },
    });

    // 알파 깜빡임 (구르기 중)
    this.scene.tweens.add({
      targets: this,
      alpha: 0.4,
      duration: 80,
      yoyo: true,
      repeat: Math.floor(PLAYER.DODGE_DURATION / 160) - 1,
      onComplete: () => {
        this.alpha = 1;
      },
    });

    // 이벤트 발신 (UIScene 스태미나 갱신용)
    this.scene.events.emit('updateStamina', {
      current: this.stamina,
      max: PLAYER.MAX_STAMINA,
    });

    return true;
  }

  /**
   * 잔상 이펙트 생성
   */
  spawnAfterimage() {
    dodgeTrail(this.scene, this.x, this.y, COLORS.PLAYER_DODGE);
  }

  // ═══════════════════════════════════════
  // 무적 시스템
  // ═══════════════════════════════════════

  /**
   * 무적 상태 부여 (구르기/QTE Great 공용)
   * @param {number} duration 무적 시간(ms)
   */
  setInvincible(duration) {
    this.isInvincible = true;

    // 기존 타이머가 있으면 제거 (중복 방지)
    if (this._invincibleTimer) {
      this._invincibleTimer.remove(false);
    }

    this._invincibleTimer = this.scene.time.delayedCall(duration, () => {
      this.isInvincible = false;
      this._invincibleTimer = null;
      this.alpha = 1;
    });

    // 무적 중 깜빡임 (구르기 tween과 겹치지 않도록 isDodging 체크)
    if (!this.isDodging) {
      this.scene.tweens.add({
        targets: this,
        alpha: 0.5,
        duration: 60,
        yoyo: true,
        repeat: Math.floor(duration / 120) - 1,
        onComplete: () => {
          this.alpha = 1;
        },
      });
    }
  }

  // ═══════════════════════════════════════
  // HP 시스템
  // ═══════════════════════════════════════

  /**
   * 데미지 처리
   * @param {number} amount 데미지 양
   * @returns {boolean} 실제로 피격되었는지 (무적이면 false)
   */
  takeDamage(amount) {
    if (!this.isAlive || this.isInvincible) return false;

    this.hp = Math.max(0, this.hp - amount);

    // 피격 이펙트
    this.flashDamage();

    // UIScene에 HP 갱신 알림
    this.scene.events.emit('updateHP', {
      current: this.hp,
      max: PLAYER.MAX_HP,
    });

    // 사망 체크
    if (this.hp <= 0) {
      this.die();
    }

    return true;
  }

  /**
   * 피격 시 빨간 깜빡임 + 카메라 셰이크
   */
  flashDamage() {
    // Red flash on character
    this.gfx.clear();
    this.gfx.fillStyle(0xff0000, 1);
    this.gfx.fillRoundedRect(-8, -4, 16, 20, 3);
    this.gfx.fillCircle(0, -10, 8);

    this.scene.time.delayedCall(100, () => {
      if (this.isAlive) this.drawCharacter();
    });

    // Full impact effect (shake + screen flash + vignette)
    impactEffect(this.scene, 0.012);

    // 짧은 무적 (연속 피격 방지, 0.5초)
    this.setInvincible(500);
  }

  /**
   * 사망 처리
   */
  die() {
    this.isAlive = false;
    this.body.setVelocity(0, 0);
    this.body.enable = false;

    // 사망 연출
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 0.2,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        this.scene.events.emit('playerDeath');
        this.scene.game.events.emit('gameEnd', { reason: 'death' });
      },
    });
  }

  // ═══════════════════════════════════════
  // 스태미나
  // ═══════════════════════════════════════

  /**
   * 스태미나 자연 회복 (타이머 콜백)
   */
  regenStamina() {
    if (!this.isAlive) return;
    if (this.stamina < PLAYER.MAX_STAMINA) {
      this.stamina = Math.min(PLAYER.MAX_STAMINA, this.stamina + PLAYER.STAMINA_REGEN);
      this.scene.events.emit('updateStamina', {
        current: this.stamina,
        max: PLAYER.MAX_STAMINA,
      });
    }
  }

  // ═══════════════════════════════════════
  // 정리
  // ═══════════════════════════════════════

  destroy() {
    if (this._staminaRegenTimer) this._staminaRegenTimer.remove(false);
    if (this._invincibleTimer) this._invincibleTimer.remove(false);
    if (this.hitboxDebug) this.hitboxDebug.destroy();
    super.destroy();
  }
}
