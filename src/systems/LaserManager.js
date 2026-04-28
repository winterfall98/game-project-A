import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../constants/game.js';

/**
 * LaserManager
 * - 경고선(예고) → 실체화 → 소멸 타임라인
 * - 직선형 / 90도 꺾임형
 * - Geom.Intersects.LineToCircle 기반 충돌 판정
 */
export default class LaserManager {
  constructor(scene) {
    this.scene = scene;
    /** @type {Array<LaserInstance>} 활성 레이저 배열 */
    this.activeLasers = [];
  }

  /**
   * 직선 레이저 생성
   * @param {object} params
   * @param {number} params.startX
   * @param {number} params.startY
   * @param {number} params.endX
   * @param {number} params.endY
   * @param {number} [params.width=20] 레이저 굵기
   * @param {number} [params.warningTime=1000] 경고 시간(ms)
   * @param {number} [params.activeTime=800] 활성 시간(ms)
   */
  spawnStraight(params) {
    const {
      startX, startY, endX, endY,
      width = 20,
      warningTime = 1000,
      activeTime = 800,
    } = params;

    const laser = {
      type: 'straight',
      lines: [new Phaser.Geom.Line(startX, startY, endX, endY)],
      width,
      gfx: this.scene.add.graphics(),
      phase: 'warning',   // 'warning' | 'active' | 'fading'
      isActive: false,     // 충돌 판정 가능 여부
      destroyed: false,
    };

    this.activeLasers.push(laser);

    // ── Phase 1: 경고선 ──
    this._drawWarning(laser);

    // 경고선 깜빡임
    const blinkTween = this.scene.tweens.add({
      targets: { val: 0 },
      val: 1,
      duration: 200,
      yoyo: true,
      repeat: Math.floor(warningTime / 400) - 1,
      onUpdate: (tween) => {
        if (laser.destroyed) return;
        const alpha = 0.2 + tween.getValue() * 0.4;
        laser.gfx.clear();
        this._drawLines(laser, COLORS.LASER_WARNING, alpha, width * 0.4);
      },
    });

    // ── Phase 2: 실체화 ──
    this.scene.time.delayedCall(warningTime, () => {
      if (laser.destroyed) return;
      blinkTween.stop();
      laser.phase = 'active';
      laser.isActive = true;

      // 실체 레이저 드로잉
      laser.gfx.clear();
      this._drawLines(laser, COLORS.LASER_ACTIVE, 0.9, width);

      // 실체화 플래시
      const flashGfx = this.scene.add.graphics();
      this._drawLines({ ...laser, gfx: flashGfx }, 0xffffff, 0.5, width * 1.5);
      this.scene.tweens.add({
        targets: flashGfx,
        alpha: 0,
        duration: 150,
        onComplete: () => flashGfx.destroy(),
      });

      // ── Phase 3: 소멸 ──
      this.scene.time.delayedCall(activeTime, () => {
        if (laser.destroyed) return;
        laser.phase = 'fading';
        laser.isActive = false;

        this.scene.tweens.add({
          targets: laser.gfx,
          alpha: 0,
          duration: 300,
          onComplete: () => this._destroyLaser(laser),
        });
      });
    });
  }

  /**
   * 90도 꺾임 레이저 생성
   * @param {object} params
   * @param {number} params.startX
   * @param {number} params.startY
   * @param {number} params.bendX  꺾이는 지점 X
   * @param {number} params.bendY  꺾이는 지점 Y
   * @param {number} params.endX
   * @param {number} params.endY
   * @param {number} [params.width=20]
   * @param {number} [params.warningTime=1200]
   * @param {number} [params.activeTime=800]
   */
  spawnBent(params) {
    const {
      startX, startY, bendX, bendY, endX, endY,
      width = 20,
      warningTime = 1200,
      activeTime = 800,
    } = params;

    const laser = {
      type: 'bent',
      lines: [
        new Phaser.Geom.Line(startX, startY, bendX, bendY),
        new Phaser.Geom.Line(bendX, bendY, endX, endY),
      ],
      width,
      gfx: this.scene.add.graphics(),
      phase: 'warning',
      isActive: false,
      destroyed: false,
    };

    this.activeLasers.push(laser);

    // 경고선 깜빡임
    const blinkTween = this.scene.tweens.add({
      targets: { val: 0 },
      val: 1,
      duration: 200,
      yoyo: true,
      repeat: Math.floor(warningTime / 400) - 1,
      onUpdate: (tween) => {
        if (laser.destroyed) return;
        const alpha = 0.2 + tween.getValue() * 0.4;
        laser.gfx.clear();
        this._drawLines(laser, COLORS.LASER_WARNING, alpha, width * 0.4);
        // 꺾이는 지점 표시
        laser.gfx.fillStyle(COLORS.LASER_WARNING, alpha + 0.2);
        laser.gfx.fillCircle(bendX, bendY, width * 0.3);
      },
    });

    // 실체화
    this.scene.time.delayedCall(warningTime, () => {
      if (laser.destroyed) return;
      blinkTween.stop();
      laser.phase = 'active';
      laser.isActive = true;

      laser.gfx.clear();
      this._drawLines(laser, COLORS.LASER_ACTIVE, 0.9, width);

      // 소멸
      this.scene.time.delayedCall(activeTime, () => {
        if (laser.destroyed) return;
        laser.phase = 'fading';
        laser.isActive = false;

        this.scene.tweens.add({
          targets: laser.gfx,
          alpha: 0,
          duration: 300,
          onComplete: () => this._destroyLaser(laser),
        });
      });
    });
  }

  /**
   * 레이저 선분들을 그리기
   */
  _drawLines(laser, color, alpha, lineWidth) {
    laser.gfx.lineStyle(lineWidth, color, alpha);
    laser.lines.forEach((line) => {
      laser.gfx.lineBetween(line.x1, line.y1, line.x2, line.y2);
    });
  }

  /**
   * 경고선 초기 드로잉
   */
  _drawWarning(laser) {
    laser.gfx.clear();
    this._drawLines(laser, COLORS.LASER_WARNING, 0.3, laser.width * 0.4);
  }

  /**
   * 플레이어와 활성 레이저 충돌 체크 (매 프레임 호출)
   * @param {Player} player
   * @returns {boolean} 피격 여부
   */
  checkCollision(player) {
    if (!player.isAlive || player.isInvincible) return false;

    const playerCircle = new Phaser.Geom.Circle(player.x, player.y, player.body.radius);

    for (const laser of this.activeLasers) {
      if (!laser.isActive) continue;

      for (const line of laser.lines) {
        // 레이저 굵기를 고려한 충돌: 선분과 원의 최단거리 < (굵기/2 + 반지름)
        const dist = this._distanceLineToPoint(line, player.x, player.y);
        if (dist < (laser.width / 2 + player.body.radius)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 선분과 점 사이의 최단거리
   */
  _distanceLineToPoint(line, px, py) {
    const dx = line.x2 - line.x1;
    const dy = line.y2 - line.y1;
    const lenSq = dx * dx + dy * dy;

    if (lenSq === 0) return Phaser.Math.Distance.Between(line.x1, line.y1, px, py);

    let t = ((px - line.x1) * dx + (py - line.y1) * dy) / lenSq;
    t = Phaser.Math.Clamp(t, 0, 1);

    const closestX = line.x1 + t * dx;
    const closestY = line.y1 + t * dy;

    return Phaser.Math.Distance.Between(closestX, closestY, px, py);
  }

  /**
   * 레이저 제거
   */
  _destroyLaser(laser) {
    laser.destroyed = true;
    laser.isActive = false;
    if (laser.gfx) laser.gfx.destroy();
    const idx = this.activeLasers.indexOf(laser);
    if (idx !== -1) this.activeLasers.splice(idx, 1);
  }

  /**
   * 모든 레이저 제거 (폭탄 등)
   */
  clearAll() {
    [...this.activeLasers].forEach((laser) => this._destroyLaser(laser));
    this.activeLasers = [];
  }

  /**
   * 활성 레이저 수
   */
  get count() {
    return this.activeLasers.length;
  }
}
