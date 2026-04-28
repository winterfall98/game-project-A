import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../constants/game.js';

/**
 * BulletManager
 * - Phaser.Physics.Arcade.Group 기반 오브젝트 풀
 * - 패턴 엔진: fan(부채꼴), circle(원형), line(직선 줄), aimed(조준)
 * - 화면 밖 탄환 자동 비활성화
 */
export default class BulletManager {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;

    // ── 탄환 텍스처 생성 (Graphics → Texture) ──
    this._createBulletTexture();

    // ── 오브젝트 풀 ──
    this.group = this.scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 300,
      runChildUpdate: false,
    });

    // ── 화면 밖 탄환 자동 비활성화 ──
    this.scene.physics.world.on('worldbounds', (body) => {
      if (body.gameObject && body.gameObject.texture.key === 'bullet') {
        this._killBullet(body.gameObject);
      }
    });

    // 통계 (회피 점수용)
    this.totalSpawned = 0;
    this.totalHit = 0;
  }

  /**
   * 탄환 텍스처를 프로시저럴 생성
   */
  _createBulletTexture() {
    if (this.scene.textures.exists('bullet')) return;

    const gfx = this.scene.add.graphics();
    // 외곽 글로우
    gfx.fillStyle(0xffffff, 0.3);
    gfx.fillCircle(10, 10, 10);
    // 코어
    gfx.fillStyle(COLORS.BULLET, 1);
    gfx.fillCircle(10, 10, 6);
    // 하이라이트
    gfx.fillStyle(0xffffff, 0.6);
    gfx.fillCircle(8, 8, 2);

    gfx.generateTexture('bullet', 20, 20);
    gfx.destroy();
  }

  /**
   * 풀에서 탄환 1개 가져오기
   */
  _getBullet(x, y) {
    const bullet = this.group.get(x, y, 'bullet');
    if (!bullet) return null;

    bullet.setActive(true).setVisible(true);
    bullet.body.enable = true;
    bullet.body.setCircle(6, 4, 4);
    bullet.body.onWorldBounds = true;
    bullet.body.setCollideWorldBounds(true);
    // 경계 넘으면 이벤트 대신 직접 제거하기 위해 bounce 0
    bullet.body.setBounce(0);
    // worldbounds 넘으면 자동 비활성화
    bullet.body.world.on('worldbounds', () => {});

    this.totalSpawned++;
    return bullet;
  }

  /**
   * 탄환 비활성화
   */
  _killBullet(bullet) {
    bullet.setActive(false).setVisible(false);
    bullet.body.enable = false;
    bullet.body.stop();
  }

  // ═══════════════════════════════════════
  // 패턴 발사
  // ═══════════════════════════════════════

  /**
   * 패턴 데이터로 탄환 발사
   * @param {object} pattern
   * @param {string} pattern.type - 'fan' | 'circle' | 'line' | 'aimed'
   * @param {number} [pattern.originX] - 발사 기준 X (미지정 시 자동 계산)
   * @param {number} [pattern.originY] - 발사 기준 Y
   * @param {string} [pattern.origin] - 'top' | 'bottom' | 'left' | 'right' (간편 지정)
   * @param {number} pattern.count - 탄환 수
   * @param {number} pattern.speed - 탄환 속도
   * @param {number} [pattern.angle] - 부채꼴 각도 범위 (fan용)
   * @param {number} [pattern.direction] - 발사 기준 방향 (도, 0=오른쪽)
   * @param {number} [pattern.spacing] - 탄환 간격 (line용)
   * @param {number} [pattern.delay] - 탄환 간 딜레이 (ms, 0이면 동시)
   */
  firePattern(pattern) {
    const { type, count, speed, delay = 0 } = pattern;

    // 발사 원점 결정
    const { ox, oy } = this._resolveOrigin(pattern);

    switch (type) {
      case 'fan':
        this._fireFan(ox, oy, count, speed, pattern.angle || 180, pattern.direction || 270, delay);
        break;
      case 'circle':
        this._fireCircle(ox, oy, count, speed, delay);
        break;
      case 'line':
        this._fireLine(ox, oy, count, speed, pattern.direction || 270, pattern.spacing || 30, delay);
        break;
      case 'aimed':
        this._fireAimed(ox, oy, count, speed, pattern.spread || 0, delay);
        break;
      default:
        console.warn(`[BulletManager] 알 수 없는 패턴: ${type}`);
    }
  }

  /**
   * 발사 원점 계산
   */
  _resolveOrigin(pattern) {
    if (pattern.originX !== undefined && pattern.originY !== undefined) {
      return { ox: pattern.originX, oy: pattern.originY };
    }

    switch (pattern.origin) {
      case 'top':    return { ox: GAME_WIDTH / 2, oy: -10 };
      case 'bottom': return { ox: GAME_WIDTH / 2, oy: GAME_HEIGHT + 10 };
      case 'left':   return { ox: -10, oy: GAME_HEIGHT / 2 };
      case 'right':  return { ox: GAME_WIDTH + 10, oy: GAME_HEIGHT / 2 };
      default:       return { ox: GAME_WIDTH / 2, oy: -10 };
    }
  }

  /**
   * 부채꼴 패턴
   */
  _fireFan(ox, oy, count, speed, angleRange, direction, delay) {
    const startAngle = direction - angleRange / 2;
    const step = count > 1 ? angleRange / (count - 1) : 0;

    for (let i = 0; i < count; i++) {
      const fireAt = delay * i;
      const angle = startAngle + step * i;

      if (fireAt === 0) {
        this._launchBullet(ox, oy, angle, speed);
      } else {
        this.scene.time.delayedCall(fireAt, () => {
          this._launchBullet(ox, oy, angle, speed);
        });
      }
    }
  }

  /**
   * 원형 패턴 (360도 균등 분포)
   */
  _fireCircle(ox, oy, count, speed, delay) {
    const step = 360 / count;
    for (let i = 0; i < count; i++) {
      const angle = step * i;
      if (delay === 0) {
        this._launchBullet(ox, oy, angle, speed);
      } else {
        this.scene.time.delayedCall(delay * i, () => {
          this._launchBullet(ox, oy, angle, speed);
        });
      }
    }
  }

  /**
   * 직선 패턴 (일렬로 연속 발사)
   */
  _fireLine(ox, oy, count, speed, direction, spacing, delay) {
    for (let i = 0; i < count; i++) {
      const fireDelay = delay > 0 ? delay * i : spacing / speed * 1000 * i;
      if (fireDelay === 0) {
        this._launchBullet(ox, oy, direction, speed);
      } else {
        this.scene.time.delayedCall(fireDelay, () => {
          this._launchBullet(ox, oy, direction, speed);
        });
      }
    }
  }

  /**
   * 조준 패턴 (플레이어 방향으로 발사)
   */
  _fireAimed(ox, oy, count, speed, spread, delay) {
    if (!this.player || !this.player.isAlive) return;

    const baseAngle = Phaser.Math.Angle.Between(ox, oy, this.player.x, this.player.y);
    const baseDeg = Phaser.Math.RadToDeg(baseAngle);

    for (let i = 0; i < count; i++) {
      const offset = count > 1 ? (i - (count - 1) / 2) * (spread / Math.max(count - 1, 1)) : 0;
      const angle = baseDeg + offset;

      if (delay === 0 || i === 0) {
        this._launchBullet(ox, oy, angle, speed);
      } else {
        this.scene.time.delayedCall(delay * i, () => {
          this._launchBullet(ox, oy, angle, speed);
        });
      }
    }
  }

  /**
   * 단일 탄환 발사
   */
  _launchBullet(x, y, angleDeg, speed) {
    const bullet = this._getBullet(x, y);
    if (!bullet) return;

    const rad = Phaser.Math.DegToRad(angleDeg);
    bullet.body.setVelocity(
      Math.cos(rad) * speed,
      Math.sin(rad) * speed
    );

    // 화면 밖 자동 제거 타이머 (안전장치, 10초)
    this.scene.time.delayedCall(10000, () => {
      if (bullet.active) this._killBullet(bullet);
    });
  }

  // ═══════════════════════════════════════
  // 충돌 & 관리
  // ═══════════════════════════════════════

  /**
   * 플레이어와의 overlap 설정 (GameScene에서 호출)
   */
  setupOverlap(player, callback, context) {
    this.scene.physics.add.overlap(player, this.group, (p, bullet) => {
      if (p.isInvincible) return;
      this._killBullet(bullet);
      this.totalHit++;
      callback.call(context, p, bullet);
    });
  }

  /**
   * 모든 탄환 제거 (폭탄 등)
   */
  clearAll() {
    this.group.getChildren().forEach((bullet) => {
      if (bullet.active) this._killBullet(bullet);
    });
  }

  /**
   * 활성 탄환 수
   */
  get activeCount() {
    return this.group.countActive(true);
  }

  /**
   * 회피된 탄환 수
   */
  get dodgedCount() {
    return this.totalSpawned - this.totalHit - this.activeCount;
  }
}
