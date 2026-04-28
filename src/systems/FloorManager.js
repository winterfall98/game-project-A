import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../constants/game.js';

/**
 * FloorManager
 * - 경고 영역 표시 → 발동 → 소멸
 * - 크기 변형 (커지는/작아지는)
 * - 이동 장판 (고레벨)
 * - overlap 판정으로 영역 내 존재 체크
 */
export default class FloorManager {
  constructor(scene) {
    this.scene = scene;
    /** @type {Array} */
    this.activeFloors = [];
  }

  /**
   * 바닥 장판 생성
   * @param {object} params
   * @param {number} params.x - 중심 X
   * @param {number} params.y - 중심 Y
   * @param {number} params.width - 너비
   * @param {number} params.height - 높이
   * @param {number} [params.warningTime=1500] - 경고 시간(ms)
   * @param {number} [params.activeTime=1000] - 데미지 활성 시간(ms)
   * @param {string} [params.shape='rect'] - 'rect' | 'circle'
   * @param {string} [params.variant='normal'] - 'normal' | 'growing' | 'shrinking' | 'moving'
   * @param {number} [params.moveToX] - 이동 목표 X (moving용)
   * @param {number} [params.moveToY] - 이동 목표 Y (moving용)
   * @param {number} [params.growScale=1.8] - 최대 확대 비율 (growing용)
   */
  spawn(params) {
    const {
      x, y, width, height,
      warningTime = 1500,
      activeTime = 1000,
      shape = 'rect',
      variant = 'normal',
      moveToX, moveToY,
      growScale = 1.8,
    } = params;

    const gfx = this.scene.add.graphics();

    const floor = {
      gfx,
      x, y, width, height,
      shape,
      variant,
      phase: 'warning',
      isActive: false,
      destroyed: false,
    };

    this.activeFloors.push(floor);

    // ── Phase 1: 경고 깜빡임 ──
    this._drawZone(floor, COLORS.FLOOR_WARNING, 0.15);

    const blinkTween = this.scene.tweens.add({
      targets: { val: 0 },
      val: 1,
      duration: 250,
      yoyo: true,
      repeat: -1,
      onUpdate: (tween) => {
        if (floor.destroyed) return;
        const alpha = 0.1 + tween.getValue() * 0.25;
        floor.gfx.clear();
        this._drawZone(floor, COLORS.FLOOR_WARNING, alpha);
        // 테두리
        floor.gfx.lineStyle(2, COLORS.FLOOR_WARNING, alpha + 0.3);
        if (shape === 'circle') {
          floor.gfx.strokeCircle(floor.x, floor.y, floor.width / 2);
        } else {
          floor.gfx.strokeRect(floor.x - floor.width / 2, floor.y - floor.height / 2, floor.width, floor.height);
        }
      },
    });

    // ── Phase 2: 발동 ──
    this.scene.time.delayedCall(warningTime, () => {
      if (floor.destroyed) return;
      blinkTween.stop();
      floor.phase = 'active';
      floor.isActive = true;

      floor.gfx.clear();
      this._drawZone(floor, COLORS.FLOOR_ACTIVE, 0.5);

      // 변형 적용
      this._applyVariant(floor, variant, activeTime, growScale, moveToX, moveToY);

      // ── Phase 3: 소멸 ──
      this.scene.time.delayedCall(activeTime, () => {
        if (floor.destroyed) return;
        floor.isActive = false;
        floor.phase = 'fading';

        this.scene.tweens.add({
          targets: floor.gfx,
          alpha: 0,
          duration: 300,
          onComplete: () => this._destroyFloor(floor),
        });
      });
    });
  }

  /**
   * 변형 타입별 애니메이션
   */
  _applyVariant(floor, variant, activeTime, growScale, moveToX, moveToY) {
    switch (variant) {
      case 'growing':
        this.scene.tweens.add({
          targets: floor,
          width: floor.width * growScale,
          height: floor.height * growScale,
          duration: activeTime * 0.8,
          ease: 'Power2',
          onUpdate: () => {
            if (floor.destroyed) return;
            floor.gfx.clear();
            this._drawZone(floor, COLORS.FLOOR_ACTIVE, 0.5);
          },
        });
        break;

      case 'shrinking': {
        const origW = floor.width;
        const origH = floor.height;
        floor.width *= growScale;
        floor.height *= growScale;

        this.scene.tweens.add({
          targets: floor,
          width: origW * 0.3,
          height: origH * 0.3,
          duration: activeTime * 0.8,
          ease: 'Power2',
          onUpdate: () => {
            if (floor.destroyed) return;
            floor.gfx.clear();
            this._drawZone(floor, COLORS.FLOOR_ACTIVE, 0.5);
          },
        });
        break;
      }

      case 'moving':
        if (moveToX !== undefined && moveToY !== undefined) {
          this.scene.tweens.add({
            targets: floor,
            x: moveToX,
            y: moveToY,
            duration: activeTime * 0.9,
            ease: 'Linear',
            onUpdate: () => {
              if (floor.destroyed) return;
              floor.gfx.clear();
              this._drawZone(floor, COLORS.FLOOR_ACTIVE, 0.5);
            },
          });
        }
        break;

      // 'normal': 변형 없음
    }
  }

  /**
   * 장판 영역 그리기
   */
  _drawZone(floor, color, alpha) {
    floor.gfx.fillStyle(color, alpha);
    if (floor.shape === 'circle') {
      floor.gfx.fillCircle(floor.x, floor.y, floor.width / 2);
    } else {
      floor.gfx.fillRect(
        floor.x - floor.width / 2,
        floor.y - floor.height / 2,
        floor.width,
        floor.height
      );
    }
  }

  /**
   * 플레이어와 활성 장판 충돌 체크 (매 프레임 호출)
   * @param {Player} player
   * @returns {boolean}
   */
  checkCollision(player) {
    if (!player.isAlive || player.isInvincible) return false;

    for (const floor of this.activeFloors) {
      if (!floor.isActive) continue;

      const px = player.x;
      const py = player.y;

      if (floor.shape === 'circle') {
        const dist = Phaser.Math.Distance.Between(px, py, floor.x, floor.y);
        if (dist < floor.width / 2) return true;
      } else {
        const halfW = floor.width / 2;
        const halfH = floor.height / 2;
        if (px > floor.x - halfW && px < floor.x + halfW &&
            py > floor.y - halfH && py < floor.y + halfH) {
          return true;
        }
      }
    }
    return false;
  }

  _destroyFloor(floor) {
    floor.destroyed = true;
    floor.isActive = false;
    if (floor.gfx) floor.gfx.destroy();
    const idx = this.activeFloors.indexOf(floor);
    if (idx !== -1) this.activeFloors.splice(idx, 1);
  }

  clearAll() {
    [...this.activeFloors].forEach((f) => this._destroyFloor(f));
    this.activeFloors = [];
  }

  get count() {
    return this.activeFloors.length;
  }
}
