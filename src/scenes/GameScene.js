import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, PLAYER, STAGE } from '../constants/game.js';
import Player from '../entities/Player.js';
import LaserManager from '../systems/LaserManager.js';
import BulletManager from '../systems/BulletManager.js';
import FloorManager from '../systems/FloorManager.js';
import QTEManager from '../systems/QTEManager.js';
import GimmickManager from '../systems/GimmickManager.js';
import { getStagePattern } from '../patterns/stagePatterns.js';
import ScoreManager from '../systems/ScoreManager.js';

export default class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  init(data) {
    this.gameMode = data.mode || 'normal';
    this.controlMode = data.controlMode || 'arrows';
    this.dodgeKey = data.dodgeKey || 'SHIFT';
    this.currentStage = data.stage || 1;
    this.playerHP = data.playerHP || PLAYER.MAX_HP;
    this.totalScore = data.totalScore || 0;
    this.stageCleared = false;
    this._floorHitCooldown = false;
    this._laserHitCooldown = false;
  }

  create() {
    this.isPaused = false;
    this._pauseGroup = null;
    this._waitingForNext = false;
    this.drawGrid();
    this.player = new Player(this, GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.player.hp = this.playerHP;
    this.laserManager = new LaserManager(this);
    this.bulletManager = new BulletManager(this, this.player);
    this.floorManager = new FloorManager(this);
    this.qteManager = new QTEManager(this, this.player);
    this.qteManager.configure(this.controlMode, this.gameMode);
    this.gimmickManager = new GimmickManager(this, {
      laser: this.laserManager, bullet: this.bulletManager,
      floor: this.floorManager, qte: this.qteManager,
    });
    this.scoreManager = new ScoreManager(this);
    this.scoreManager.carryOverScore = this.totalScore;
    this.scoreManager.startSurvivalTimer();
    this.bulletManager.setupOverlap(this.player, function(p) {
      p.takeDamage(10);
      this.scoreManager.onDamageTaken();
    }, this);
    this.setupInput();
    this.scene.stop('UIScene');
    this.scene.launch('UIScene', { mode: this.gameMode, stage: this.currentStage });
    // 초기 HUD 동기화 emit은 한 프레임 지연시켜, 새 UIScene이 launch+bind된 뒤에 수신하도록 보장
    // (이전 UIScene 인스턴스의 destroy된 Text에 도달하는 것을 방지)
    this.time.delayedCall(0, function() {
      this.events.emit('updateHP', { current: this.player.hp, max: PLAYER.MAX_HP });
      this.events.emit('updateStamina', { current: this.player.stamina, max: PLAYER.MAX_STAMINA });
      this.events.emit('updateScore', { score: this.totalScore });
      this.events.emit('updateBombs', { count: this.qteManager.bombs });
    }, [], this);
    this._loadStagePattern();
    this.events.on('playerDeath', this._onGameOver, this);
    this.game.events.emit('gameStarted', { mode: this.gameMode, stage: this.currentStage });
  }

  update(time, delta) {
    if (this.isPaused) return;
    if (!this.player || !this.player.isAlive || this.stageCleared) return;
    this.handleInput();
    if (!this._laserHitCooldown && this.laserManager.checkCollision(this.player)) {
      this.player.takeDamage(15);
      this.scoreManager.onDamageTaken();
      this._laserHitCooldown = true;
      this.time.delayedCall(600, function() { this._laserHitCooldown = false; }.bind(this));
    }
    if (!this._floorHitCooldown && this.floorManager.checkCollision(this.player)) {
      this.player.takeDamage(10);
      this.scoreManager.onDamageTaken();
      this._floorHitCooldown = true;
      this.time.delayedCall(500, function() { this._floorHitCooldown = false; }.bind(this));
    }
  }

  _loadStagePattern() {
    var pattern = getStagePattern(this.currentStage);
    if (!pattern || pattern.events.length === 0) {
      this.time.delayedCall(1000, this._onStageClear, [], this);
      return;
    }
    this.gimmickManager.startPattern(pattern, this.gameMode);
    this._stageTimer = this.time.delayedCall(pattern.duration * 1000, this._onStageClear, [], this);
    this._timeLeft = pattern.duration;
    this._timerText = this.add.text(GAME_WIDTH - 80, 16, this._timeLeft + 's', {
      fontFamily: 'monospace', fontSize: '14px', color: '#7c7caa',
    }).setOrigin(1, 0).setDepth(50);
    this._countdownTimer = this.time.addEvent({ delay: 1000, loop: true, callback: function() {
      this._timeLeft--;
      if (this._timerText) this._timerText.setText(Math.max(0, this._timeLeft) + 's');
    }, callbackScope: this });
  }

  _onStageClear() {
    if (this.stageCleared) return;
    this.stageCleared = true;
    this.gimmickManager.stop();
    this.gimmickManager.clearAllGimmicks();
    // 진행 중인 QTE가 있으면 즉시 취소 — 다음 씬으로 잔류 방지
    if (this.qteManager) this.qteManager.cancel();
    if (this._countdownTimer) this._countdownTimer.remove(false);
    this.scoreManager.stopSurvivalTimer();
    this.scoreManager.onStageClear(this.currentStage);
    this.totalScore = this.scoreManager.displayScore;
    this.events.emit('updateScore', { score: this.totalScore });
    var bonus = this.currentStage * 100;
    var ct = this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 - 20, 'STAGE ' + this.currentStage + ' CLEAR!', {
      fontFamily:'monospace', fontSize:'28px', fontStyle:'bold', color:'#4fc3f7',
    }).setOrigin(0.5).setDepth(200).setAlpha(0).setScale(0.5);
    this.tweens.add({ targets:ct, alpha:1, scaleX:1, scaleY:1, duration:400, ease:'Back.easeOut' });
    var sp = this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 + 20, '+' + bonus, {
      fontFamily:'monospace', fontSize:'18px', color:'#ffd740',
    }).setOrigin(0.5).setDepth(200);
    this.tweens.add({ targets:sp, alpha:0, y:GAME_HEIGHT/2 - 10, duration:1000, delay:500 });
    // 다음 스테이지 진행 대기
    var self = this;
    this.time.delayedCall(1200, function() {
      var hint = self.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 + 60, 'PRESS ENTER OR CLICK TO CONTINUE', {
        fontFamily:'monospace', fontSize:'14px', color:'#7c7caa',
      }).setOrigin(0.5).setDepth(200);
      self.tweens.add({ targets:hint, alpha:0.4, duration:600, yoyo:true, repeat:-1 });
      self._waitingForNext = true;
      self._stageClearUI = [ct, sp, hint];
      var enterKey = self.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      self._nextStageEnter = function() {
        if (!self._waitingForNext) return;
        self._proceedToNext();
      };
      enterKey.once('down', self._nextStageEnter);
      self._nextStageEnterKey = enterKey;
      self.input.once('pointerdown', function() {
        if (!self._waitingForNext) return;
        self._proceedToNext();
      });
    }, [], this);
  }

  _proceedToNext() {
    if (!this._waitingForNext) return;
    this._waitingForNext = false;
    if (this._stageClearUI) {
      this._stageClearUI.forEach(function(obj) { if (obj && obj.destroy) obj.destroy(); });
      this._stageClearUI = null;
    }
    this._goNext();
  }

  _goNext() {
    var next = this.currentStage + 1;
    if (next > STAGE.TOTAL) {
      this.game.events.emit('gameEnd', this.scoreManager.getResultData(this.currentStage, this.gameMode, 'clear', this.player ? this.player.hp : 0));
      return;
    }
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', function() {
      var sd = { mode:this.gameMode, controlMode:this.controlMode, dodgeKey:this.dodgeKey,
        stage:next, playerHP:this.player.hp, totalScore:this.totalScore };
      if (STAGE.BOSS_STAGES.includes(next)) {
        this.scene.start('BossScene', sd);
      } else {
        this.scene.start('GameScene', sd);
      }
    }, this);
  }

  _onGameOver() {
    this.gimmickManager.stop();
    this.scoreManager.stopSurvivalTimer();
    if (this._countdownTimer) this._countdownTimer.remove(false);
    this.time.delayedCall(1500, function() {
      this.game.events.emit('gameEnd', this.scoreManager.getResultData(this.currentStage, this.gameMode, 'death', this.player ? this.player.hp : 0));
    }, [], this);
  }

  drawGrid() {
    var gfx = this.add.graphics();
    var t = Math.min(this.currentStage / 20, 1);
    var bg = ((0x1a + (t*0x10)|0) << 16) | ((0x1a - (t*0x0a)|0) << 8) | (0x2e + (t*0x10)|0);
    gfx.fillStyle(bg, 1); gfx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    gfx.lineStyle(1, COLORS.GRID_LINE, 0.3);
    for (var x=0; x<=GAME_WIDTH; x+=40) gfx.lineBetween(x,0,x,GAME_HEIGHT);
    for (var y=0; y<=GAME_HEIGHT; y+=40) gfx.lineBetween(0,y,GAME_WIDTH,y);
  }

  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasdKeys = this.input.keyboard.addKeys('W,A,S,D');
    this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.bombKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F10);
    this.pauseKey.on('down', this._togglePause, this);
    this.input.mouse.disableContextMenu();
  }

  handleInput() {
    var mx=0, my=0;
    if (this.controlMode === 'wasd') {
      if (this.wasdKeys.A.isDown) mx=-1;
      if (this.wasdKeys.D.isDown) mx=1;
      if (this.wasdKeys.W.isDown) my=-1;
      if (this.wasdKeys.S.isDown) my=1;
    } else {
      if (this.cursors.left.isDown) mx=-1;
      if (this.cursors.right.isDown) mx=1;
      if (this.cursors.up.isDown) my=-1;
      if (this.cursors.down.isDown) my=1;
    }
    this.player.move(mx, my);
    var dp = this.dodgeKey==='SHIFT' ? Phaser.Input.Keyboard.JustDown(this.shiftKey) : Phaser.Input.Keyboard.JustDown(this.spaceKey);
    if (dp) this.player.dodge();
    if (Phaser.Input.Keyboard.JustDown(this.bombKey) && !this.qteManager.isActive) {
      this.qteManager.useBomb(this.gimmickManager.clearAllGimmicks.bind(this.gimmickManager));
    }
  }

  _togglePause() {
    if (this.isPaused) { this._resumeGame(); } else { this._pauseGame(); }
  }

  _pauseGame() {
    if (this.isPaused) return;
    this.isPaused = true;
    this.scene.pause();
    this.scene.launch('PauseScene', {
      returnScene: 'GameScene',
      onResume: function() { this._resumeGame(); }.bind(this),
    });
  }

  _resumeGame() {
    this.isPaused = false;
    this.scene.stop('PauseScene');
    this.scene.resume();
  }

  shutdown() {
    if (this.gimmickManager) this.gimmickManager.destroy();
    if (this.qteManager) this.qteManager.destroy();
    if (this.scoreManager) this.scoreManager.destroy();
    if (this._countdownTimer) this._countdownTimer.remove(false);
    if (this._stageTimer) this._stageTimer.remove(false);
  }
}
