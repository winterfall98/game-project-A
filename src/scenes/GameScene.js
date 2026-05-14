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
import TouchControls from '../systems/TouchControls.js';
import CombatInputController from '../systems/CombatInputController.js';
import PauseFlow from '../systems/PauseFlow.js';
import { getControlGuideRows, shouldShowControlGuide } from '../ui/controlGuide.js';

export default class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  init(data) {
    this.gameMode = data.mode || 'normal';
    this.controlMode = data.controlMode || 'arrows';
    this.dodgeKey = data.dodgeKey || 'SHIFT';
    this.currentStage = data.stage || 1;
    this.playerHP = data.playerHP || PLAYER.MAX_HP;
    this.totalScore = data.totalScore || 0;
    this.scoreState = data.scoreState || null;
    this.qteState = data.qteState || null;
    this.mobileMode = data.mobileMode || false;
    this.touchControlScale = data.touchControlScale || 1.0;
    this.showControlGuide = shouldShowControlGuide({
      stage: this.currentStage,
      totalScore: this.totalScore,
      scoreState: this.scoreState,
    });
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
    this.qteManager.configure(this.controlMode, this.gameMode, this.mobileMode);
    this.qteManager.importState(this.qteState);
    this.gimmickManager = new GimmickManager(this, {
      laser: this.laserManager, bullet: this.bulletManager,
      floor: this.floorManager, qte: this.qteManager,
    });
    this.scoreManager = new ScoreManager(this);
    if (this.scoreState) {
      this.scoreManager.importState(this.scoreState);
    } else {
      this.scoreManager.carryOverScore = this.totalScore;
    }
    this.totalScore = this.scoreManager.displayScore;
    this.bulletManager.setupOverlap(this.player, function(p) {
      const took = p.takeDamage(10);
      if (took) this.scoreManager.onDamageTaken('bullet');
    }, this);
    this.inputController = new CombatInputController(this, {
      getControlMode: () => this.controlMode,
      getDodgeKey: () => this.dodgeKey,
      getMobileMode: () => this.mobileMode,
      getTouchControls: () => this.touchControls,
      onBomb: () => this.gimmickManager.clearAllGimmicks(),
      onPauseToggle: () => this._togglePause(),
    });
    this._onGimmickDodged = this._onGimmickDodged || this.onGimmickDodged.bind(this);
    this.events.on('gimmickDodged', this._onGimmickDodged);
    this.setupInput();
    this.touchControls = null;
    if (this.mobileMode) {
      this.touchControls = new TouchControls(this, this.touchControlScale);
    }
    this.events.once('shutdown', () => {
      if (this.touchControls) {
        this.touchControls.destroy();
        this.touchControls = null;
      }
    });
    this.scene.stop('UIScene');
    this.scene.launch('UIScene', { mode: this.gameMode, stage: this.currentStage, mobileMode: this.mobileMode });
    // 초기 HUD 동기화 emit은 한 프레임 지연시켜, 새 UIScene이 launch+bind된 뒤에 수신하도록 보장
    // (이전 UIScene 인스턴스의 destroy된 Text에 도달하는 것을 방지)
    this.time.delayedCall(0, function() {
      this.events.emit('updateHP', { current: this.player.hp, max: PLAYER.MAX_HP });
      this.events.emit('updateStamina', { current: this.player.stamina, max: PLAYER.MAX_STAMINA });
      this.events.emit('updateScore', { score: this.scoreManager.displayScore });
      this.events.emit('updateBombs', { count: this.qteManager.bombs });
      this.events.emit('updateCombo', { combo: this.scoreManager.currentCombo, multiplier: this.scoreManager.comboMultiplier });
    }, [], this);
    this.events.on('playerDeath', this._onGameOver, this);
    if (this.showControlGuide) {
      this._showControlGuide();
    } else {
      this._startStageFlow();
    }
  }

  update(time, delta) {
    if (this.isPaused || this._controlGuideActive) return;
    if (!this.player || !this.player.isAlive || this.stageCleared) return;
    this.handleInput();
    this.bulletManager.update();
    const laserHit = this.laserManager.checkCollision(this.player);
    if (!this._laserHitCooldown && laserHit) {
      const took = this.player.takeDamage(15);
      if (took) {
        this.laserManager.markDamaged(laserHit);
        this.scoreManager.onDamageTaken('laser');
      }
      this._laserHitCooldown = true;
      this.time.delayedCall(600, function() { this._laserHitCooldown = false; }.bind(this));
    }
    const floorHit = this.floorManager.checkCollision(this.player);
    if (!this._floorHitCooldown && floorHit) {
      const took = this.player.takeDamage(10);
      if (took) {
        this.floorManager.markDamaged(floorHit);
        this.scoreManager.onDamageTaken('floor');
      }
      this._floorHitCooldown = true;
      this.time.delayedCall(500, function() { this._floorHitCooldown = false; }.bind(this));
    }
  }

  onGimmickDodged(data) {
    if (!data || this.stageCleared || !this.player || !this.player.isAlive) return;
    if (data.type === 'bullet') this.scoreManager.onBulletDodged();
    if (data.type === 'laser') this.scoreManager.onLaserDodged();
    if (data.type === 'floor') this.scoreManager.onFloorDodged();
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

  _startStageFlow() {
    if (this._stageStarted) return;
    this._stageStarted = true;
    this.scoreManager.startSurvivalTimer();
    this._loadStagePattern();
    this.game.events.emit('gameStarted', { mode: this.gameMode, stage: this.currentStage });
  }

  _showControlGuide() {
    this._controlGuideActive = true;
    const rows = getControlGuideRows({
      controlMode: this.controlMode,
      dodgeKey: this.dodgeKey,
      mobileMode: this.mobileMode,
    });
    const group = this.add.container(0, 0).setDepth(300);
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.72);
    const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 520, 380, 0x1a1a3e, 0.96)
      .setStrokeStyle(2, 0x3a3a6e);
    const title = this.add.text(GAME_WIDTH / 2, 150, '조작 안내', {
      fontFamily: '"Noto Sans KR", "Segoe UI", sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);
    const subtitle = this.add.text(GAME_WIDTH / 2, 185, '게임 시작 전, 조작을 확인하세요.', {
      fontFamily: '"Noto Sans KR", "Segoe UI", sans-serif',
      fontSize: '14px',
      color: '#a0a0cc',
    }).setOrigin(0.5);
    group.add([overlay, panel, title, subtitle]);

    rows.forEach(([label, text], index) => {
      const y = 230 + index * 34;
      const labelText = this.add.text(190, y, label, {
        fontFamily: '"Noto Sans KR", "Segoe UI", sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#4fc3f7',
      }).setOrigin(0, 0.5);
      const bodyText = this.add.text(280, y, text, {
        fontFamily: '"Noto Sans KR", "Segoe UI", sans-serif',
        fontSize: '15px',
        color: '#e0e0e0',
      }).setOrigin(0, 0.5);
      group.add([labelText, bodyText]);
    });

    const button = this.add.rectangle(GAME_WIDTH / 2, 425, 180, 46, 0x000000, 0)
      .setStrokeStyle(2, 0x4fc3f7)
      .setInteractive({ useHandCursor: true });
    const buttonText = this.add.text(GAME_WIDTH / 2, 425, '시작하기', {
      fontFamily: '"Noto Sans KR", "Segoe UI", sans-serif',
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#4fc3f7',
    }).setOrigin(0.5);
    group.add([button, buttonText]);

    const start = () => {
      if (!this._controlGuideActive) return;
      this._controlGuideActive = false;
      enterKey.off('down', start);
      group.destroy(true);
      this._startStageFlow();
    };
    button.on('pointerover', () => {
      button.setFillStyle(0x4fc3f7, 0.14);
      buttonText.setColor('#ffffff');
    });
    button.on('pointerout', () => {
      button.setFillStyle(0x000000, 0);
      buttonText.setColor('#4fc3f7');
    });
    button.on('pointerdown', start);

    const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    enterKey.on('down', start);
    this._controlGuideUI = group;
    this._controlGuideEnterKey = enterKey;
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
    var ct = this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 - 20, '스테이지 ' + this.currentStage + ' 클리어!', {
      fontFamily:'"Noto Sans KR", "Segoe UI", sans-serif', fontSize:'28px', fontStyle:'bold', color:'#4fc3f7',
    }).setOrigin(0.5).setDepth(200).setAlpha(0).setScale(0.5);
    this.tweens.add({ targets:ct, alpha:1, scaleX:1, scaleY:1, duration:400, ease:'Back.easeOut' });
    var sp = this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 + 20, '+' + bonus, {
      fontFamily:'monospace', fontSize:'18px', color:'#ffd740',
    }).setOrigin(0.5).setDepth(200);
    this.tweens.add({ targets:sp, alpha:0, y:GAME_HEIGHT/2 - 10, duration:1000, delay:500 });
    // 다음 스테이지 진행 대기
    var self = this;
    this.time.delayedCall(1200, function() {
      var hint = self.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 + 60, '계속하려면 Enter 또는 화면을 클릭하세요', {
        fontFamily:'"Noto Sans KR", "Segoe UI", sans-serif', fontSize:'14px', color:'#7c7caa',
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
      const scoreState = this.scoreManager.exportState();
      const qteState = this.qteManager.exportState();
      var sd = { mode:this.gameMode, controlMode:this.controlMode, dodgeKey:this.dodgeKey,
        stage:next, playerHP:this.player.hp, totalScore:this.totalScore,
        mobileMode:this.mobileMode, touchControlScale:this.touchControlScale,
        scoreState:scoreState, qteState:qteState };
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
    if (this.inputController) this.inputController.setupInput();
  }

  handleInput() {
    if (this.inputController) this.inputController.handleInput(this.player, this.qteManager);
  }

  _togglePause() {
    if (this.isPaused) { this._resumeGame(); } else { this._pauseGame(); }
  }

  _pauseGame() {
    PauseFlow.pause(this, 'GameScene', function() { this._resumeGame(); }.bind(this));
  }

  _resumeGame() {
    PauseFlow.resume(this);
  }

  shutdown() {
    if (this.gimmickManager) this.gimmickManager.destroy();
    if (this.qteManager) this.qteManager.destroy();
    if (this.scoreManager) this.scoreManager.destroy();
    if (this.inputController) this.inputController.destroy();
    if (this._countdownTimer) this._countdownTimer.remove(false);
    if (this._stageTimer) this._stageTimer.remove(false);
    if (this._onGimmickDodged) this.events.off('gimmickDodged', this._onGimmickDodged);
    if (this._controlGuideEnterKey) this._controlGuideEnterKey.removeAllListeners();
    if (this._controlGuideUI) this._controlGuideUI.destroy(true);
  }
}
