import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, STAGE, PLAYER } from '../constants/game.js';
import Player from '../entities/Player.js';
import Boss from '../entities/Boss.js';
import LaserManager from '../systems/LaserManager.js';
import BulletManager from '../systems/BulletManager.js';
import FloorManager from '../systems/FloorManager.js';
import QTEManager from '../systems/QTEManager.js';
import { getBossConfig } from '../patterns/bossConfigs.js';
import {
  FLOOR_PATTERNS,
  GROUP_PATTERN_POOLS,
  buildFloorPatternParams,
} from '../patterns/floorPatterns.js';

/**
 * BossScene - Boss battle scene
 * Player + Boss FSM + gimmick managers + counter QTE
 */
export default class BossScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BossScene' });
  }

  init(data) {
    this.gameMode = data.mode || 'normal';
    this.controlMode = data.controlMode || 'arrows';
    this.dodgeKey = data.dodgeKey || 'SHIFT';
    this.currentStage = data.stage || 5;
    this.bossIndex = STAGE.BOSS_STAGES.indexOf(this.currentStage);

    this._floorHitCooldown = false;
    this._laserHitCooldown = false;
    this._counterActive = false;
    this._arenaWalls = null;
    this._timeLeft = 0;
    this.isPaused = false;

    console.log(`[BossScene] init - Boss stage ${this.currentStage} (boss #${this.bossIndex + 1})`);
  }

  create() {
    // Dark background
    this.drawGrid();

    // Get boss config
    this.bossConfig = getBossConfig(this.currentStage);
    if (!this.bossConfig) {
      console.error('[BossScene] No boss config for stage', this.currentStage);
      return;
    }

    // Player
    this.player = new Player(this, GAME_WIDTH / 2, GAME_HEIGHT - 100);

    // Gimmick managers
    this.laserManager = new LaserManager(this);
    this.bulletManager = new BulletManager(this, this.player);
    this.floorManager = new FloorManager(this);
    this.qteManager = new QTEManager(this, this.player);
    this.qteManager.configure(this.controlMode, this.gameMode);

    // Bullet overlap
    this.bulletManager.setupOverlap(this.player, (player) => {
      player.takeDamage(10);
    }, this);

    // Boss entity
    this.boss = new Boss(this, GAME_WIDTH / 2, 120, this.bossConfig);
    this._setupBossCallbacks();
    this.boss.startBehavior();

    // Boss collision: charge 시 큰 데미지, 그 외 평상시 부딪힘에도 약한 데미지.
    // Player.takeDamage가 자체 invincibility(500ms)를 부여하므로 별도 cooldown 불필요.
    this.physics.add.overlap(this.player, this.boss, () => {
      if (this.player.isInvincible) return;
      if (!this.boss.isAlive || this.boss.isStunned) return;
      if (this.boss.state === 'charge') {
        this.player.takeDamage(this.bossConfig.attacks.charge?.damage || 20);
      } else {
        this.player.takeDamage(this.bossConfig.contactDamage || 5);
      }
    });

    // QTE timer for dealing damage to boss
    this._qteTimer = this.time.addEvent({
      delay: this.bossConfig.qteInterval,
      callback: this._triggerDamageQTE,
      callbackScope: this,
      loop: true,
    });

    // 보스전 floor 패턴 timer — 정기적으로 그룹 풀에서 무작위 패턴을 발동
    if (this.bossConfig.floorPattern) {
      this._floorPatternTimer = this.time.addEvent({
        delay: this.bossConfig.floorPattern.interval,
        callback: this._triggerBossFloorPattern,
        callbackScope: this,
        loop: true,
      });
    }

    // Arena shrink (stage 20 only)
    if (this.bossConfig.arenaShrink) {
      this._setupArenaShrink();
    }

    // Time limit (stage 20)
    if (this.bossConfig.timeLimit) {
      this._timeLeft = this.bossConfig.timeLimit;
      this._timerText = this.add.text(GAME_WIDTH - 16, 16, `${this._timeLeft}s`, {
        fontFamily: 'monospace', fontSize: '18px', fontStyle: 'bold', color: '#ff1744',
      }).setOrigin(1, 0).setDepth(91);

      this._countdownTimer = this.time.addEvent({
        delay: 1000,
        callback: () => {
          this._timeLeft--;
          if (this._timerText) this._timerText.setText(`${this._timeLeft}s`);
          if (this._timeLeft <= 0) {
            // Time's up - game over
            this.player.takeDamage(999);
          }
        },
        loop: true,
      });
    }

    // Input
    this.setupInput();

    // UIScene
    if (!this.scene.isActive('UIScene')) {
      this.scene.launch('UIScene', {
        mode: this.gameMode,
        stage: this.currentStage,
        isBoss: true,
      });
    }

    // Initial UI state
    this.events.emit('updateHP', { current: this.player.hp, max: PLAYER.MAX_HP });
    this.events.emit('updateStamina', { current: this.player.stamina, max: PLAYER.MAX_STAMINA });
    this.events.emit('updateScore', { score: 0 });
    this.events.emit('updateBombs', { count: 0 });

    this.game.events.emit('bossStarted', { stage: this.currentStage });
    console.log('[BossScene] create complete');
  }

  update(time, delta) {
    if (this.isPaused) return;
    if (!this.player || !this.player.isAlive) return;

    this.handleInput();

    // Laser collision
    if (!this._laserHitCooldown && this.laserManager.checkCollision(this.player)) {
      this.player.takeDamage(15);
      this._laserHitCooldown = true;
      this.time.delayedCall(600, () => { this._laserHitCooldown = false; });
    }

    // Floor collision
    if (!this._floorHitCooldown && this.floorManager.checkCollision(this.player)) {
      this.player.takeDamage(10);
      this._floorHitCooldown = true;
      this.time.delayedCall(500, () => { this._floorHitCooldown = false; });
    }

    // Boss chase: idle 상태에서 player 방향으로 천천히 이동
    // ATTACK/CHARGE/STUN/RAGE 중에는 그 동작이 우선이므로 chase 비활성
    if (this.boss && this.boss.isAlive && this.boss.state === 'idle' && !this.boss.isStunned) {
      const dx = this.player.x - this.boss.x;
      const dy = this.player.y - this.boss.y;
      const dist = Math.hypot(dx, dy);
      const minDist = 80; // 너무 가까우면 정지 (player와 밀착 방지)
      if (dist > minDist) {
        const baseSpeed = this.bossConfig.chaseSpeed || 80;
        const phaseSpeedMult = this.bossConfig.phases[this.boss.currentPhase]?.speedMult || 1;
        const speed = baseSpeed * phaseSpeedMult;
        this.boss.body.setVelocity((dx / dist) * speed, (dy / dist) * speed);
      } else {
        this.boss.body.setVelocity(0, 0);
      }
    }
  }

  // ===================================================
  // Background
  // ===================================================

  drawGrid() {
    const gfx = this.add.graphics();
    gfx.fillStyle(0x0d0d1a, 1);
    gfx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    gfx.lineStyle(1, 0x1a1a3e, 0.3);
    const gridSize = 40;
    for (let x = 0; x <= GAME_WIDTH; x += gridSize) {
      gfx.lineBetween(x, 0, x, GAME_HEIGHT);
    }
    for (let y = 0; y <= GAME_HEIGHT; y += gridSize) {
      gfx.lineBetween(0, y, GAME_WIDTH, y);
    }
  }

  // ===================================================
  // Boss Callbacks
  // ===================================================

  _setupBossCallbacks() {
    const cfg = this.bossConfig;

    this.boss.onAttack = (attackType) => {
      this._executeBossAttack(attackType);
    };

    this.boss.onCounterWindow = () => {
      this._startCounterQTE();
    };

    this.boss.onPhaseChange = (phaseIndex) => {
      console.log(`[BossScene] Phase change -> ${phaseIndex + 1}`);
      // 페이즈 전환 시 레이저/장판만 제거, 탄환은 유지
      this.laserManager.clearAll();
      this.floorManager.clearAll();
    };

    this.boss.onDeath = () => {
      this._onBossDefeated();
    };
  }

  /**
   * Execute boss attack based on type
   */
  _executeBossAttack(attackType) {
    const cfg = this.bossConfig.attacks[attackType];
    if (!cfg) return;

    switch (attackType) {
      case 'charge':
        // Charge toward player
        if (this.player.isAlive) {
          this.boss.chargeTo(this.player.x, this.player.y, cfg.speed, () => {
            this.boss.setState && this.boss.setState('idle');
          });
        }
        break;

      case 'fan_bullets':
        this.bulletManager.firePattern({
          type: 'fan',
          originX: this.boss.x,
          originY: this.boss.y,
          count: cfg.count,
          speed: cfg.speed,
          angle: cfg.angle,
          direction: 90, // downward
        });
        break;

      case 'circle_bullets':
        this.bulletManager.firePattern({
          type: 'circle',
          originX: this.boss.x,
          originY: this.boss.y,
          count: cfg.count,
          speed: cfg.speed,
        });
        break;

      case 'aimed_bullets':
        this.bulletManager.firePattern({
          type: 'aimed',
          originX: this.boss.x,
          originY: this.boss.y,
          count: cfg.count,
          speed: cfg.speed,
          spread: cfg.spread,
          delay: cfg.delay,
        });
        break;

      case 'laser': {
        // Laser from boss toward player
        const angle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
        const endX = this.boss.x + Math.cos(angle) * GAME_WIDTH;
        const endY = this.boss.y + Math.sin(angle) * GAME_HEIGHT;
        this.laserManager.spawnStraight({
          startX: this.boss.x, startY: this.boss.y,
          endX, endY,
          width: cfg.width, warningTime: cfg.warningTime, activeTime: cfg.activeTime,
        });
        break;
      }

      case 'multi_laser': {
        const count = cfg.count || 3;
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
          const endX = this.boss.x + Math.cos(angle) * GAME_WIDTH;
          const endY = this.boss.y + Math.sin(angle) * GAME_HEIGHT;
          this.laserManager.spawnStraight({
            startX: this.boss.x, startY: this.boss.y,
            endX, endY,
            width: cfg.width,
            warningTime: cfg.warningTime + i * 200,
            activeTime: cfg.activeTime,
          });
        }
        break;
      }

      case 'floor':
        this.floorManager.spawn({
          x: this.player.x + Phaser.Math.Between(-50, 50),
          y: this.player.y + Phaser.Math.Between(-50, 50),
          width: cfg.width, height: cfg.height,
          warningTime: cfg.warningTime, activeTime: cfg.activeTime,
        });
        break;

      case 'barrage':
        this.bulletManager.firePattern({
          type: 'circle',
          originX: this.boss.x,
          originY: this.boss.y,
          count: cfg.count,
          speed: cfg.speed,
        });
        // Second wave offset
        this.time.delayedCall(300, () => {
          this.bulletManager.firePattern({
            type: 'circle',
            originX: this.boss.x,
            originY: this.boss.y,
            count: cfg.count,
            speed: cfg.speed * 0.8,
          });
        });
        break;
    }
  }

  // ===================================================
  // Counter QTE
  // ===================================================

  _startCounterQTE() {
    if (this._counterActive || !this.boss.isAlive) return;

    // QTE가 이미 진행 중이면 카운터를 건너뛰고 보스 행동 재개
    if (this.qteManager.isActive) {
      this.boss.setState && this.boss.setState('idle');
      this.time.delayedCall(1000, () => {
        if (this.boss.isAlive) this.boss._scheduleNextAttack();
      });
      return;
    }

    this._counterActive = true;

    const counterWindow = this.bossConfig.attacks.charge?.counterWindow || 1000;

    // Visual warning
    const warnText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, 'COUNTER!', {
      fontFamily: 'monospace', fontSize: '28px', fontStyle: 'bold', color: '#ffab40',
    }).setOrigin(0.5).setDepth(110);

    this.tweens.add({
      targets: warnText, alpha: 0, scaleX: 1.5, scaleY: 1.5,
      duration: counterWindow, onComplete: () => warnText.destroy(),
    });

    // Counter QTE - single key press
    const seq = this.qteManager.generateRandomSequence(1, counterWindow);
    this.qteManager.startSequence(seq, (results) => {
      this._counterActive = false;
      if (results[0] === 'great' || results[0] === 'good') {
        // Counter success - stun boss
        this.boss.stun(2000);
        console.log('[BossScene] Counter success! Boss stunned');
        // Bonus QTE opportunity during stun
        this.time.delayedCall(500, () => this._triggerDamageQTE());
      } else {
        // Counter fail - boss charges
        this._executeBossAttack('charge');
        this.boss.setState && this.boss.setState('idle');
        this.time.delayedCall(1500, () => {
          if (this.boss.isAlive) this.boss._scheduleNextAttack();
        });
      }
    });
  }

  // ===================================================
  // Boss Floor Pattern (지정 그룹의 풀에서 무작위 패턴 발동)
  // ===================================================

  _triggerBossFloorPattern() {
    if (!this.boss || !this.boss.isAlive) return;
    const fp = this.bossConfig.floorPattern;
    if (!fp) return;
    const pool = GROUP_PATTERN_POOLS[fp.group];
    if (!pool || pool.length === 0) return;

    const name = pool[Math.floor(Math.random() * pool.length)];
    const fn = FLOOR_PATTERNS[name];
    if (!fn) return;
    const params = buildFloorPatternParams(name, fp.group);
    fn(this, this.floorManager, params);
  }

  // ===================================================
  // Damage QTE (deal damage to boss)
  // ===================================================

  _triggerDamageQTE() {
    if (!this.boss || !this.boss.isAlive || this.qteManager.isActive) return;

    const cfg = this.bossConfig;
    const count = cfg.qteCount || 3;
    const timing = cfg.qteTiming || 1500;

    const seq = this.qteManager.generateRandomSequence(count, timing);
    this.qteManager.startSequence(seq, (results) => {
      // Calculate damage
      let damage = 0;
      results.forEach((r) => {
        if (r === 'great') damage += cfg.qteDamage;
        else if (r === 'good') damage += Math.round(cfg.qteDamage * 0.5);
      });

      if (damage > 0) {
        this.boss.takeDamage(damage);
        console.log(`[BossScene] QTE damage: ${damage}, Boss HP: ${this.boss.hp}`);
      }
    });
  }

  // ===================================================
  // Boss Defeated
  // ===================================================

  _onBossDefeated() {
    console.log('[BossScene] Boss defeated!');

    // Stop all timers
    if (this._qteTimer) this._qteTimer.remove(false);
    if (this._countdownTimer) this._countdownTimer.remove(false);
    if (this._floorPatternTimer) this._floorPatternTimer.remove(false);

    // Clear gimmicks
    this.laserManager.clearAll();
    this.bulletManager.clearAll();
    this.floorManager.clearAll();

    // Final QTE for stage 20
    if (this.bossConfig.finalQTE) {
      this._startFinalQTE();
      return;
    }

    // Victory - Enter/Click 대기 화면 표시
    this.time.delayedCall(1500, () => {
      this._showBossClearWait();
    });
  }

  _startFinalQTE() {
    const fqte = this.bossConfig.finalQTE;

    const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 'FINAL STRIKE!', {
      fontFamily: 'monospace', fontSize: '32px', fontStyle: 'bold', color: '#ff1744',
    }).setOrigin(0.5).setDepth(110);

    this.tweens.add({
      targets: txt, scaleX: 1.3, scaleY: 1.3, duration: 500,
      yoyo: true, repeat: 1,
      onComplete: () => {
        txt.destroy();
        const seq = this.qteManager.generateRandomSequence(fqte.count, fqte.timing);
        this.qteManager.startSequence(seq, (results) => {
          const fails = results.filter((r) => r === 'fail').length;
          if (fails > Math.floor(fqte.count / 2)) {
            // Too many fails - boss recovers
            this.boss.hp = fqte.failHPRecover;
            this.boss.isAlive = true;
            this.boss.drawHPBar();
            this.boss.startBehavior();
            console.log('[BossScene] Final QTE failed, boss recovers');
          } else {
            // Victory!
            this.time.delayedCall(1000, () => {
              this._showBossClearWait();
            });
          }
        });
      },
    });
  }

  // ===================================================
  // Arena Shrink (Stage 20)
  // ===================================================

  _setupArenaShrink() {
    const wallThickness = 20;

    this._leftWall = this.add.rectangle(0, GAME_HEIGHT / 2, wallThickness, GAME_HEIGHT, 0xff1744, 0.3);
    this._rightWall = this.add.rectangle(GAME_WIDTH, GAME_HEIGHT / 2, wallThickness, GAME_HEIGHT, 0xff1744, 0.3);

    this.physics.add.existing(this._leftWall, true);
    this.physics.add.existing(this._rightWall, true);

    this.physics.add.collider(this.player, this._leftWall);
    this.physics.add.collider(this.player, this._rightWall);

    // Gradually shrink arena
    this.tweens.add({
      targets: this._leftWall,
      x: 120,
      duration: 80000, // over 80 seconds
      ease: 'Linear',
      onUpdate: () => {
        this._leftWall.body.updateFromGameObject();
      },
    });
    this.tweens.add({
      targets: this._rightWall,
      x: GAME_WIDTH - 120,
      duration: 80000,
      ease: 'Linear',
      onUpdate: () => {
        this._rightWall.body.updateFromGameObject();
      },
    });
  }

  // ===================================================
  // Input
  // ===================================================

  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasdKeys = this.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.bombKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Y);
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F10);
    this.pauseKey.on('down', this._togglePause, this);
    this.input.mouse.disableContextMenu();
  }

  handleInput() {
    let moveX = 0, moveY = 0;
    if (this.controlMode === 'wasd') {
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

    this.player.move(moveX, moveY);

    const dodgePressed = (this.dodgeKey === 'SHIFT')
      ? Phaser.Input.Keyboard.JustDown(this.shiftKey)
      : Phaser.Input.Keyboard.JustDown(this.spaceKey);
    if (dodgePressed) this.player.dodge();

    if (Phaser.Input.Keyboard.JustDown(this.bombKey)) {
      if (!this.qteManager.isActive) {
        this.qteManager.useBomb(() => {
          this.laserManager.clearAll();
          this.bulletManager.clearAll();
          this.floorManager.clearAll();
          // 보스는 사라지지 않지만, QTE 1회 분량 데미지를 입힘
          if (this.boss && this.boss.isAlive) {
            this.boss.takeDamage(this.bossConfig.qteDamage || 0);
          }
        });
      }
    }
  }

  // ===================================================
  // Boss Clear Wait
  // ===================================================

  _showBossClearWait() {
    const ct = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 'BOSS DEFEATED!', {
      fontFamily: 'monospace', fontSize: '28px', fontStyle: 'bold', color: '#4fc3f7',
    }).setOrigin(0.5).setDepth(200).setAlpha(0).setScale(0.5);
    this.tweens.add({ targets: ct, alpha: 1, scaleX: 1, scaleY: 1, duration: 400, ease: 'Back.easeOut' });

    this._waitingForNext = true;
    const self = this;

    this.time.delayedCall(1000, () => {
      const hint = self.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, 'PRESS ENTER OR CLICK TO CONTINUE', {
        fontFamily: 'monospace', fontSize: '14px', color: '#7c7caa',
      }).setOrigin(0.5).setDepth(200);
      self.tweens.add({ targets: hint, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });

      self._bossClearUI = [ct, hint];

      const enterKey = self.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      enterKey.once('down', () => { self._emitBossClear(); });
      self.input.once('pointerdown', () => { self._emitBossClear(); });
    });
  }

  _emitBossClear() {
    if (!this._waitingForNext) return;
    this._waitingForNext = false;
    if (this._bossClearUI) {
      this._bossClearUI.forEach((obj) => { if (obj && obj.destroy) obj.destroy(); });
      this._bossClearUI = null;
    }
    var next = this.currentStage + 1;
    if (next > STAGE.TOTAL) {
      this.game.events.emit('gameEnd', {
        stage: this.currentStage,
        mode: this.gameMode,
        result: 'clear',
      });
      return;
    }
    // BossScene 내부에서 직접 씬 전환 (Phaser 라이프사이클 보장)
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('UIScene');
      this.scene.start('GameScene', {
        mode: this.gameMode,
        controlMode: this.controlMode,
        dodgeKey: this.dodgeKey,
        stage: next,
        playerHP: this.player ? this.player.hp : PLAYER.MAX_HP,
        totalScore: 0,
      });
    });
  }

  // ===================================================
  // Pause
  // ===================================================

  _togglePause() {
    if (this.isPaused) { this._resumeGame(); } else { this._pauseGame(); }
  }

  _pauseGame() {
    if (this.isPaused) return;
    this.isPaused = true;
    this.scene.pause();
    this.scene.launch('PauseScene', {
      returnScene: 'BossScene',
      onResume: () => { this._resumeGame(); },
    });
  }

  _resumeGame() {
    this.isPaused = false;
    this.scene.stop('PauseScene');
    this.scene.resume();
  }

  // ===================================================
  // Cleanup
  // ===================================================

  shutdown() {
    if (this._qteTimer) this._qteTimer.remove(false);
    if (this._countdownTimer) this._countdownTimer.remove(false);
    if (this._floorPatternTimer) this._floorPatternTimer.remove(false);
    if (this.qteManager) this.qteManager.destroy();
  }
}
