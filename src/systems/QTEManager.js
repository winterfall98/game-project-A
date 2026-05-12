import Phaser from 'phaser';
import { COLORS, QTE, GAME_WIDTH, GAME_HEIGHT, TOUCH } from '../constants/game.js';
import { QTE_KEYS_ARROWS, QTE_KEYS_WASD, KEY_DISPLAY_NAMES } from '../constants/keys.js';

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
    this.sequenceToken = 0;    // cancel/재시작 경합 방지 토큰

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
    this._boundKeyObj = null;
  }

  /**
   * 설정 적용
   */
  configure(controlMode, gameMode, mobileMode = false) {
    this.controlMode = controlMode;
    this.gameMode = gameMode;
    this.mobileMode = mobileMode;
  }

  /**
   * 스테이지 전환 시 유지할 QTE 상태를 주입
   * @param {object|null} state
   */
  importState(state) {
    if (!state) return;
    this.greatCombo = state.greatCombo || 0;
    this.totalGreat = state.totalGreat || 0;
    this.totalGood = state.totalGood || 0;
    this.totalFail = state.totalFail || 0;
    this.bombs = Math.min(3, state.bombs || 0);
  }

  /**
   * 스테이지 전환 시 전달할 QTE 상태를 반환
   * @returns {object}
   */
  exportState() {
    return {
      greatCombo: this.greatCombo,
      totalGreat: this.totalGreat,
      totalGood: this.totalGood,
      totalFail: this.totalFail,
      bombs: Math.min(3, this.bombs),
    };
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
    this.sequenceToken++;

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
    const { key } = qteData;
    const timing = this._getAdjustedTiming(qteData.timing || 1500);

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

    if (this.mobileMode) {
      const hitSize = 64 + TOUCH.QTE_HIT_PADDING * 2;
      const hitZone = this.scene.add.rectangle(pos.x, pos.y, hitSize, hitSize, 0x000000, 0)
        .setInteractive()
        .setDepth(101);
      hitZone.on('pointerdown', () => {
        this._onQTEInput();
      });
      this.currentQTE.hitZone = hitZone;

      // Show "TAP" instead of key name
      if (this.currentQTE.keyText) {
        this.currentQTE.keyText.setText('TAP');
      }
    }
  }

  /**
   * 프롬프트 위치 결정
   */
  _getPromptPosition() {
    if (!this.player) {
      return { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 };
    }

    const px = this.player.x;
    const py = this.player.y;

    if (this.mobileMode) {
      // Random angle around player, radius 60-100
      const angle = Math.random() * Math.PI * 2;
      const radius = 60 + Math.random() * 40;
      let x = px + Math.cos(angle) * radius;
      let y = py + Math.sin(angle) * radius;
      // Clamp to screen
      x = Phaser.Math.Clamp(x, 40, GAME_WIDTH - 40);
      y = Phaser.Math.Clamp(y, 40, GAME_HEIGHT - 40);
      // Avoid bottom 25% (control zone)
      const controlZoneTop = GAME_HEIGHT * (1 - TOUCH.CONTROL_ZONE_RATIO);
      if (y > controlZoneTop) {
        y = controlZoneTop - 10;
      }
      return { x, y };
    }

    if (this.controlMode === 'wasd') {
      // WASD 모드: 캐릭터 반경 내 랜덤
      const angle = Math.random() * Math.PI * 2;
      const radius = 60 + Math.random() * 40;
      return {
        x: Phaser.Math.Clamp(px + Math.cos(angle) * radius, 50, GAME_WIDTH - 50),
        y: Phaser.Math.Clamp(py + Math.sin(angle) * radius, 50, GAME_HEIGHT - 50),
      };
    } else {
      // 방향키 모드: 캐릭터 근접 고정 (위쪽)
      return {
        x: Phaser.Math.Clamp(px, 50, GAME_WIDTH - 50),
        y: Phaser.Math.Clamp(py - 60, 50, GAME_HEIGHT - 50),
      };
    }
  }

  // ═══════════════════════════════════════
  // 입력 처리
  // ═══════════════════════════════════════

  /**
   * QTE 키 입력 바인딩.
   * arrows / wasd 모두 키보드를 사용한다 (WASD 모드는 키보드 오른쪽 영역의 12개 키 사용).
   */
  _bindInput(expectedKey) {
    if (this.mobileMode) return;
    this._unbindInput();

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

  /**
   * 입력 바인딩 해제
   */
  _unbindInput() {
    if (this.currentQTE && this.currentQTE.hitZone) {
      this.currentQTE.hitZone.removeAllListeners();
      this.currentQTE.hitZone.destroy();
      this.currentQTE.hitZone = null;
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
    const tokenAtResolve = this.sequenceToken;

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
          const nextBombs = Math.min(3, this.bombs + 1);
          if (nextBombs > this.bombs) {
            this.bombs = nextBombs;
            this.scene.events.emit('updateBombs', { count: this.bombs });
            this._showBombGet();
          }
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
          this.player.takeDamage(5);
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
      // cancel() 또는 새 시퀀스 시작으로 토큰이 바뀌었으면 무시
      if (tokenAtResolve !== this.sequenceToken) return;
      if (!this._sequenceResults || !Array.isArray(this._sequenceResults)) return;
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
    if (this.currentQTE.hitZone) {
      this.currentQTE.hitZone.removeAllListeners();
      this.currentQTE.hitZone.destroy();
    }
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

    // QTE 진행 중이어도 폭탄은 즉시 발동되도록 현재 QTE를 중단한다.
    if (this.isActive || this.currentQTE) {
      this.cancel();
    }

    // 부드러운 청록 ring 효과 — 흰 강렬 플래시 대신 외곽으로 퍼지는 ring으로 교체
    // (눈에 부담을 주지 않는 선의 가시성 확보)
    const ring = this.scene.add.graphics();
    ring.setDepth(150);
    const startR = 40;
    const endR = Math.max(GAME_WIDTH, GAME_HEIGHT);
    const ringState = { r: startR, alpha: 0.55 };
    this.scene.tweens.add({
      targets: ringState,
      r: endR,
      alpha: 0,
      duration: 550,
      ease: 'Quad.easeOut',
      onUpdate: () => {
        ring.clear();
        ring.lineStyle(6, 0x4fc3f7, ringState.alpha);
        ring.strokeCircle(GAME_WIDTH / 2, GAME_HEIGHT / 2, ringState.r);
      },
      onComplete: () => ring.destroy(),
    });

    // 카메라 셰이크는 약하게
    this.scene.cameras.main.shake(180, 0.008);

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
   * Stage 11+부터 QTE 타이밍을 약간 가속한다.
   */
  _getAdjustedTiming(baseTiming) {
    const stage = this.scene && this.scene.currentStage ? this.scene.currentStage : 1;
    if (stage >= 11) {
      return Math.max(600, Math.round(baseTiming * 0.88));
    }
    return baseTiming;
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
    // arrows / wasd 모두 키보드 풀에서 추첨 (WASD는 오른손 영역 12개)
    const keyPool = this.controlMode === 'wasd' ? QTE_KEYS_WASD : QTE_KEYS_ARROWS;
    const seq = [];
    for (let i = 0; i < count; i++) {
      const key = keyPool[Math.floor(Math.random() * keyPool.length)];
      seq.push({ key, timing });
    }
    return seq;
  }

  /**
   * 진행 중인 QTE를 즉시 취소.
   * 활성 시퀀스가 있으면 시각/입력/타이머/큐를 모두 정리하고 isActive를 false로 만든다.
   * 스테이지 클리어/사망 시점에 호출하여 QTE 프롬프트가 다음 씬으로 잔류하지 않도록 한다.
   */
  cancel() {
    this.sequenceToken++;
    if (this.currentQTE) {
      if (this.currentQTE.bandTween) this.currentQTE.bandTween.stop();
      if (this.currentQTE.hitZone) {
        this.currentQTE.hitZone.removeAllListeners();
        this.currentQTE.hitZone.destroy();
        this.currentQTE.hitZone = null;
      }
      this._clearCurrentQTE();
    }
    this._unbindInput();
    this.queue = [];
    this.isActive = false;
    this._sequenceResults = null;
    this._onSequenceComplete = null;
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
