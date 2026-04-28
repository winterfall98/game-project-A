import Phaser from 'phaser';
import { COLORS, QTE, GAME_WIDTH, GAME_HEIGHT } from '../constants/game.js';
import { QTE_KEYS_ARROWS, QTE_KEYS_EASY, KEY_DISPLAY_NAMES } from '../constants/keys.js';

/**
 * QTEManager
 * - QTE 프롬프트 렌더링: 외곽 사각형 + 내부 수축 띠
 * - 띠 애니메이션: 작은 상태에서 scale 증가 → 목표(1.0)에 맞추기
 * - 판정: Great / Good / Fail
 * - 시퀀스 큐: 연속 QTE 처리
 * - 폭탄: Great 연속 5회 → 폭탄 1개
 */
export default class QTEManager {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;

    // ── 시퀀스 상태 ──
    this.queue = [];           // QTE 시퀀스 큐
    this.currentQTE = null;    // 현재 진행 중인 QTE
    this.isActive = false;     // QTE 진행 중 여부

    // ── 콤보 & 폭탄 ──
    this.greatCombo = 0;       // 연속 Great 횟수
    this.totalGreat = 0;
    this.totalGood = 0;
    this.totalFail = 0;
    this.bombs = 0;

    // ── 설정 ──
    this.controlMode = 'arrows'; // 'arrows' | 'wasd'
    this.gameMode = 'normal';

    // ── 비주얼 컨테이너 ──
    this.container = scene.add.container(0, 0);
    this.container.setDepth(100);

    // ── 키 입력 바인딩 ──
    this._boundKeyHandler = null;
    this._boundMouseHandler = null;
  }

  /**
   * 설정 적용
   */
  configure(controlMode, gameMode) {
    this.controlMode = controlMode;
    this.gameMode = gameMode;
  }

  // ═══════════════════════════════════════
  // 시퀀스 관리
  // ═══════════════════════════════════════

  /**
   * QTE 시퀀스 시작
   * @param {Array<object>} sequence - [{key, timing}, ...]
   *   key: 'Q','W','E','R' 등 또는 'LEFT','RIGHT','MIDDLE' (마우스)
   *   timing: 띠 애니메이션 시간(ms) - 길수록 쉬움
   * @param {function} onComplete - 시퀀스 완료 콜백 (결과 배열)
   */
  startSequence(sequence, onComplete) {
    if (this.isActive) return;

    this.queue = [...sequence];
    this.isActive = true;
    this._sequenceResults = [];
    this._onSequenceComplete = onComplete || (() => {});

    this._startNextQTE();
  }

  /**
   * 큐에서 다음 QTE 시작
   */
  _startNextQTE() {
    if (this.queue.length === 0) {
      // 시퀀스 완료
      this.isActive = false;
      this._onSequenceComplete(this._sequenceResults);
      return;
    }

    const qteData = this.queue.shift();
    this._spawnQTEPrompt(qteData);
  }

  // ═══════════════════════════════════════
  // QTE 프롬프트
  // ═══════════════════════════════════════

  /**
   * 개별 QTE 프롬프트 생성
   */
  _spawnQTEPrompt(qteData) {
    const { key, timing = 1500 } = qteData;

    // 위치 결정
    const pos = this._getPromptPosition();

    // 프롬프트 크기
    const size = 64;
    const halfSize = size / 2;

    // ── 그래픽 요소 생성 ──
    const gfx = this.scene.add.graphics();

    // 외곽 프레임
    gfx.lineStyle(3, COLORS.QTE_FRAME, 1);
    gfx.strokeRect(pos.x - halfSize, pos.y - halfSize, size, size);

    // 내부 띠 (작은 상태에서 시작)
    const bandGfx = this.scene.add.graphics();

    // 키 텍스트
    const displayKey = KEY_DISPLAY_NAMES[key] || key;
    const keyText = this.scene.add.text(pos.x, pos.y - halfSize - 16, displayKey, {
      fontFamily: 'monospace',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    // 컨테이너에 추가
    this.container.add([gfx, bandGfx, keyText]);

    // ── 띠 애니메이션 ──
    const bandState = { scale: 0 };

    const bandTween = this.scene.tweens.add({
      targets: bandState,
      scale: 1.4,  // 1.0이 정확한 타이밍, 1.4까지 오버슈트
      duration: timing,
      ease: 'Linear',
      onUpdate: () => {
        bandGfx.clear();
        const s = bandState.scale;
        const bandSize = size * s;
        const bandHalf = bandSize / 2;

        // 띠 색상 (타이밍에 따라 변화)
        const diff = Math.abs(s - 1.0);
        let bandColor;
        if (diff <= QTE.GREAT_THRESHOLD) {
          bandColor = COLORS.QTE_GREAT;
        } else if (diff <= QTE.GOOD_THRESHOLD) {
          bandColor = COLORS.QTE_GOOD;
        } else {
          bandColor = COLORS.QTE_BAND;
        }

        bandGfx.lineStyle(2, bandColor, 0.9);
        bandGfx.strokeRect(
          pos.x - bandHalf,
          pos.y - bandHalf,
          bandSize,
          bandSize
        );

        // 반투명 필
        bandGfx.fillStyle(bandColor, 0.15);
        bandGfx.fillRect(
          pos.x - bandHalf,
          pos.y - bandHalf,
          bandSize,
          bandSize
        );
      },
      onComplete: () => {
        // 타임아웃 → Fail
        if (this.currentQTE && !this.currentQTE.resolved) {
          this._resolveQTE('fail');
        }
      },
    });

    // ── 현재 QTE 저장 ──
    this.currentQTE = {
      key,
      pos,
      size,
      gfx,
      bandGfx,
      keyText,
      bandTween,
      bandState,
      resolved: false,
    };

    // ── 입력 바인딩 ──
    this._bindInput(key);
  }

  /**
   * 프롬프트 위치 결정
   */
  _getPromptPosition() {
    if (!this.player) {
      return { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 };
    }

    if (this.controlMode === 'wasd') {
      // WASD 모드: 캐릭터 반경 내 랜덤
      const angle = Math.random() * Math.PI * 2;
      const radius = 60 + Math.random() * 40;
      return {
        x: Phaser.Math.Clamp(this.player.x + Math.cos(angle) * radius, 50, GAME_WIDTH - 50),
        y: Phaser.Math.Clamp(this.player.y + Math.sin(angle) * radius, 50, GAME_HEIGHT - 50),
      };
    } else {
      // 방향키 모드: 캐릭터 근접 고정 (위쪽)
      return {
        x: Phaser.Math.Clamp(this.player.x, 50, GAME_WIDTH - 50),
        y: Phaser.Math.Clamp(this.player.y - 60, 50, GAME_HEIGHT - 50),
      };
    }
  }

  // ═══════════════════════════════════════
  // 입력 처리
  // ═══════════════════════════════════════

  /**
   * QTE 키 입력 바인딩
   */
  _bindInput(expectedKey) {
    this._unbindInput();

    if (this.controlMode === 'wasd') {
      // 마우스 모드
      this._boundMouseHandler = (pointer) => {
        const buttonMap = { 0: 'LEFT', 1: 'MIDDLE', 2: 'RIGHT' };
        const pressed = buttonMap[pointer.button];
        if (pressed === expectedKey) {
          this._onQTEInput();
        }
      };
      this.scene.input.on('pointerdown', this._boundMouseHandler);
    } else {
      // 키보드 모드
      const keyCode = Phaser.Input.Keyboard.KeyCodes[expectedKey];
      if (keyCode) {
        const keyObj = this.scene.input.keyboard.addKey(keyCode);
        this._boundKeyHandler = () => {
          this._onQTEInput();
        };
        keyObj.once('down', this._boundKeyHandler);
        this._boundKeyObj = keyObj;
      }
    }
  }

  /**
   * 입력 바인딩 해제
   */
  _unbindInput() {
    if (this._boundMouseHandler) {
      this.scene.input.off('pointerdown', this._boundMouseHandler);
      this._boundMouseHandler = null;
    }
    if (this._boundKeyObj) {
      this._boundKeyObj.off('down', this._boundKeyHandler);
      this._boundKeyObj = null;
      this._boundKeyHandler = null;
    }
  }

  /**
   * QTE 입력이 들어왔을 때
   */
  _onQTEInput() {
    if (!this.currentQTE || this.currentQTE.resolved) return;

    const diff = Math.abs(this.currentQTE.bandState.scale - 1.0);

    if (diff <= QTE.GREAT_THRESHOLD) {
      this._resolveQTE('great');
    } else if (diff <= QTE.GOOD_THRESHOLD) {
      this._resolveQTE('good');
    } else {
      this._resolveQTE('fail');
    }
  }

  // ═══════════════════════════════════════
  // 판정 처리
  // ═══════════════════════════════════════

  /**
   * QTE 판정 확정
   * @param {'great'|'good'|'fail'} result
   */
  _resolveQTE(result) {
    if (!this.currentQTE || this.currentQTE.resolved) return;
    this.currentQTE.resolved = true;

    this._unbindInput();
    this.currentQTE.bandTween.stop();

    // 통계 갱신
    switch (result) {
      case 'great':
        this.totalGreat++;
        this.greatCombo++;
        // Great → 무적 0.3초
        if (this.player && this.player.isAlive) {
          this.player.setInvincible(QTE.GREAT_INVINCIBLE);
        }
        // 폭탄 체크
        if (this.greatCombo >= QTE.BOMB_COMBO_REQUIRED && this.greatCombo % QTE.BOMB_COMBO_REQUIRED === 0) {
          this.bombs++;
          this.scene.events.emit('updateBombs', { count: this.bombs });
          this._showBombGet();
        }
        break;

      case 'good':
        this.totalGood++;
        // Good은 콤보 리셋하지 않음 (성공 처리이므로)
        // 밸런스에 따라 리셋할 수도 있음
        break;

      case 'fail':
        this.totalFail++;
        this.greatCombo = 0;
        // Fail → 데미지
        if (this.player && this.player.isAlive) {
          this.player.takeDamage(10);
        }
        break;
    }

    // 콤보 이벤트
    this.scene.events.emit('updateCombo', {
      combo: this.greatCombo,
      multiplier: this._getComboMultiplier(),
    });

    // 판정 이펙트
    this._showJudgement(result);

    // 잠시 후 다음 QTE
    this.scene.time.delayedCall(400, () => {
      this._clearCurrentQTE();
      this._sequenceResults.push(result);
      this._startNextQTE();
    });
  }

  /**
   * 판정 시각 이펙트
   */
  _showJudgement(result) {
    const pos = this.currentQTE.pos;
    let color, text;

    switch (result) {
      case 'great':
        color = COLORS.QTE_GREAT;
        text = 'GREAT!';
        break;
      case 'good':
        color = COLORS.QTE_GOOD;
        text = 'GOOD';
        break;
      case 'fail':
        color = COLORS.QTE_FAIL;
        text = 'FAIL';
        // 카메라 셰이크
        this.scene.cameras.main.shake(100, 0.005);
        break;
    }

    // 판정 텍스트
    const judgeTxt = this.scene.add.text(pos.x, pos.y, text, {
      fontFamily: 'monospace',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#' + color.toString(16).padStart(6, '0'),
    }).setOrigin(0.5);

    // 판정 플래시
    const flashGfx = this.scene.add.graphics();
    flashGfx.fillStyle(color, 0.3);
    flashGfx.fillRect(pos.x - 40, pos.y - 40, 80, 80);

    this.scene.tweens.add({
      targets: [judgeTxt, flashGfx],
      alpha: 0,
      y: pos.y - 20,
      duration: 500,
      onComplete: () => {
        judgeTxt.destroy();
        flashGfx.destroy();
      },
    });
  }

  /**
   * 폭탄 획득 연출
   */
  _showBombGet() {
    const txt = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'BOMB GET!', {
      fontFamily: 'monospace',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#e040fb',
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: txt,
      alpha: 0,
      y: GAME_HEIGHT / 2 - 100,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 800,
      ease: 'Power2',
      onComplete: () => txt.destroy(),
    });
  }

  /**
   * 현재 QTE 비주얼 정리
   */
  _clearCurrentQTE() {
    if (!this.currentQTE) return;
    const { gfx, bandGfx, keyText } = this.currentQTE;
    if (gfx) gfx.destroy();
    if (bandGfx) bandGfx.destroy();
    if (keyText) keyText.destroy();
    this.currentQTE = null;
  }

  // ═══════════════════════════════════════
  // 폭탄
  // ═══════════════════════════════════════

  /**
   * 폭탄 사용
   * @param {function} clearAllGimmicks - 모든 기믹을 제거하는 콜백
   * @returns {boolean} 사용 성공 여부
   */
  useBomb(clearAllGimmicks) {
    if (this.bombs <= 0) return false;

    this.bombs--;
    this.scene.events.emit('updateBombs', { count: this.bombs });

    // 화면 플래시
    const flash = this.scene.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0xffffff, 0.8
    );
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 500,
      onComplete: () => flash.destroy(),
    });

    // 카메라 셰이크
    this.scene.cameras.main.shake(300, 0.02);

    // 기믹 제거 콜백
    if (clearAllGimmicks) clearAllGimmicks();

    return true;
  }

  // ═══════════════════════════════════════
  // 유틸
  // ═══════════════════════════════════════

  /**
   * 콤보 배율 계산
   */
  _getComboMultiplier() {
    if (this.greatCombo >= 15) return 2.5;
    if (this.greatCombo >= 10) return 2.0;
    if (this.greatCombo >= 5) return 1.5;
    return 1.0;
  }

  /**
   * QTE 정확도 (%)
   */
  get accuracy() {
    const total = this.totalGreat + this.totalGood + this.totalFail;
    if (total === 0) return 100;
    return Math.round((this.totalGreat / total) * 100);
  }

  /**
   * 랜덤 QTE 키 선택
   * @param {number} count - 시퀀스 길이
   * @returns {Array<object>} [{key, timing}, ...]
   */
  generateRandomSequence(count, timing = 1500) {
    const keyPool = this.gameMode === 'easy' ? QTE_KEYS_EASY : QTE_KEYS_ARROWS;

    if (this.controlMode === 'wasd') {
      // WASD 모드: 마우스 버튼
      const mouseKeys = ['LEFT', 'RIGHT'];
      const seq = [];
      let middleUsed = false;

      for (let i = 0; i < count; i++) {
        let key;
        if (!middleUsed && Math.random() < 0.2 && i > 0) {
          key = 'MIDDLE';
          middleUsed = true; // 시퀀스당 최대 1회
        } else {
          key = mouseKeys[Math.floor(Math.random() * mouseKeys.length)];
        }
        seq.push({ key, timing });
      }
      return seq;
    }

    // 키보드 모드
    const seq = [];
    for (let i = 0; i < count; i++) {
      const key = keyPool[Math.floor(Math.random() * keyPool.length)];
      seq.push({ key, timing });
    }
    return seq;
  }

  /**
   * 정리
   */
  destroy() {
    this._unbindInput();
    this._clearCurrentQTE();
    this.container.destroy();
  }
}
