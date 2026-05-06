import { GAME_WIDTH, GAME_HEIGHT, TOUCH } from '../constants/game.js';

/**
 * TouchControls
 * - 가상 조이스틱 (왼쪽 하단): 외부 링 + 썸스틱 + 4방향 화살표
 * - 대쉬 버튼 (오른쪽 하단): 대형 원형
 * - 폭탄 버튼 (대쉬 우상단): 소형 원형
 * - 멀티터치: pointerId 추적으로 조이스틱 + 버튼 동시 조작 지원
 */
export default class TouchControls {
  constructor(scene, scale = 1.0) {
    this.scene = scene;
    this.scale = scale;

    // ── 상태 ──
    this.joystickPointerId = null;
    this.dirX = 0;
    this.dirY = 0;
    this.dashPressed = false;
    this.bombPressed = false;

    // ── 스케일 적용 크기 ──
    const s = this.scale;
    this.joyRadius   = TOUCH.JOYSTICK_RADIUS       * s;
    this.thumbRadius = TOUCH.JOYSTICK_THUMB_RADIUS  * s;
    this.joyCenterX  = TOUCH.JOYSTICK_MARGIN_X      * s;
    this.joyCenterY  = GAME_HEIGHT - TOUCH.JOYSTICK_MARGIN_Y * s;

    this.dashRadius  = TOUCH.DASH_RADIUS   * s;
    this.dashCenterX = GAME_WIDTH  - TOUCH.DASH_MARGIN_X * s;
    this.dashCenterY = GAME_HEIGHT - TOUCH.DASH_MARGIN_Y * s;

    this.bombRadius  = TOUCH.BOMB_RADIUS   * s;
    this.bombCenterX = this.dashCenterX + TOUCH.BOMB_OFFSET_X * s;
    this.bombCenterY = this.dashCenterY + TOUCH.BOMB_OFFSET_Y * s;

    // ── 컨테이너: depth 150 (게임 및 UIScene HUD 위) ──
    this.container = scene.add.container(0, 0).setDepth(150).setScrollFactor(0);

    this._createJoystick();
    this._createButtons();
    this._bindTouch();
  }

  // ═══════════════════════════════════════
  // 조이스틱 생성
  // ═══════════════════════════════════════

  /**
   * 외부 링, 방향 화살표, 썸스틱 생성
   */
  _createJoystick() {
    const cx = this.joyCenterX;
    const cy = this.joyCenterY;
    const r  = this.joyRadius;
    const s  = this.scale;

    // ── 외부 링 ──
    this._joyRing = this.scene.add.graphics();
    this._joyRing.fillStyle(0xffffff, 0.08);
    this._joyRing.fillCircle(cx, cy, r);
    this._joyRing.lineStyle(2, 0xffffff, 0.2);
    this._joyRing.strokeCircle(cx, cy, r);
    this.container.add(this._joyRing);

    // ── 4방향 화살표 ──
    const arrowDist = r - 10 * s;
    const hs = 7 * s; // 반폭
    const ht = 9 * s; // 높이

    // up
    this._arrowUp = this.scene.add.triangle(
      cx,         cy - arrowDist,
      -hs, ht,    hs, ht,    0, 0
    ).setAlpha(0.2);
    this._arrowUp._dirX = 0;
    this._arrowUp._dirY = -1;

    // down
    this._arrowDown = this.scene.add.triangle(
      cx,         cy + arrowDist,
      -hs, -ht,   hs, -ht,   0, 0
    ).setAlpha(0.2);
    this._arrowDown._dirX = 0;
    this._arrowDown._dirY = 1;

    // left
    this._arrowLeft = this.scene.add.triangle(
      cx - arrowDist, cy,
      ht, -hs,    ht, hs,    0, 0
    ).setAlpha(0.2);
    this._arrowLeft._dirX = -1;
    this._arrowLeft._dirY = 0;

    // right
    this._arrowRight = this.scene.add.triangle(
      cx + arrowDist, cy,
      -ht, -hs,   -ht, hs,   0, 0
    ).setAlpha(0.2);
    this._arrowRight._dirX = 1;
    this._arrowRight._dirY = 0;

    this._arrows = [this._arrowUp, this._arrowDown, this._arrowLeft, this._arrowRight];
    this.container.add(this._arrows);

    // ── 썸스틱 ──
    this._thumb = this.scene.add.graphics();
    this._redrawThumb(cx, cy);
    this.container.add(this._thumb);
  }

  /**
   * 썸스틱 그래픽 재그리기
   */
  _redrawThumb(x, y) {
    const tr = this.thumbRadius;
    this._thumb.clear();
    this._thumb.fillStyle(0xffffff, 0.25);
    this._thumb.fillCircle(x, y, tr);
    this._thumb.lineStyle(2, 0xffffff, 0.4);
    this._thumb.strokeCircle(x, y, tr);
  }

  /**
   * 조이스틱 입력 업데이트
   */
  _updateJoystick(pointerX, pointerY) {
    const cx = this.joyCenterX;
    const cy = this.joyCenterY;
    const r  = this.joyRadius;

    let dx = pointerX - cx;
    let dy = pointerY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 반경 내 클램프
    if (dist > r) {
      dx = (dx / dist) * r;
      dy = (dy / dist) * r;
    }

    // -1..1 정규화
    this.dirX = dx / r;
    this.dirY = dy / r;

    // 썸스틱 이동
    this._redrawThumb(cx + dx, cy + dy);

    // 화살표 하이라이트 (dot product)
    for (const arrow of this._arrows) {
      const dot = arrow._dirX * this.dirX + arrow._dirY * this.dirY;
      arrow.setAlpha(dot > 0.3 ? 0.8 : 0.2);
    }
  }

  /**
   * 조이스틱 초기화
   */
  _resetJoystick() {
    this.dirX = 0;
    this.dirY = 0;
    this.joystickPointerId = null;
    this._redrawThumb(this.joyCenterX, this.joyCenterY);
    for (const arrow of this._arrows) {
      arrow.setAlpha(0.2);
    }
  }

  // ═══════════════════════════════════════
  // 버튼 생성
  // ═══════════════════════════════════════

  /**
   * 대쉬 버튼 + 폭탄 버튼 생성
   */
  _createButtons() {
    // ── 대쉬 버튼 ──
    this._dashGfx = this.scene.add.graphics();
    this._drawDashButton(0.45);
    this.container.add(this._dashGfx);

    this._dashLabel = this.scene.add.text(
      this.dashCenterX, this.dashCenterY,
      'DASH',
      { fontSize: `${Math.round(12 * this.scale)}px`, color: '#4fc3f7', align: 'center' }
    ).setOrigin(0.5, 0.5);
    this.container.add(this._dashLabel);

    // ── 폭탄 버튼 ──
    this._bombGfx = this.scene.add.graphics();
    this._drawBombButton(0.45);
    this.container.add(this._bombGfx);

    this._bombLabel = this.scene.add.text(
      this.bombCenterX, this.bombCenterY,
      'BOMB',
      { fontSize: `${Math.round(9 * this.scale)}px`, color: '#ffd740', align: 'center' }
    ).setOrigin(0.5, 0.5);
    this.container.add(this._bombLabel);
  }

  /**
   * 대쉬 버튼 그래픽 재그리기
   * @param {number} borderAlpha - 테두리 알파
   */
  _drawDashButton(borderAlpha) {
    const cx = this.dashCenterX;
    const cy = this.dashCenterY;
    const r  = this.dashRadius;

    this._dashGfx.clear();
    this._dashGfx.fillStyle(0x4fc3f7, 0.12);
    this._dashGfx.fillCircle(cx, cy, r);
    this._dashGfx.lineStyle(2, 0x4fc3f7, borderAlpha);
    this._dashGfx.strokeCircle(cx, cy, r);
  }

  /**
   * 폭탄 버튼 그래픽 재그리기
   * @param {number} borderAlpha - 테두리 알파
   */
  _drawBombButton(borderAlpha) {
    const cx = this.bombCenterX;
    const cy = this.bombCenterY;
    const r  = this.bombRadius;

    this._bombGfx.clear();
    this._bombGfx.fillStyle(0xffd740, 0.12);
    this._bombGfx.fillCircle(cx, cy, r);
    this._bombGfx.lineStyle(2, 0xffd740, borderAlpha);
    this._bombGfx.strokeCircle(cx, cy, r);
  }

  // ═══════════════════════════════════════
  // 터치 입력 바인딩
  // ═══════════════════════════════════════

  /**
   * 포인터 이벤트 등록
   */
  _bindTouch() {
    this._onDown = (pointer) => this._onPointerDown(pointer);
    this._onMove = (pointer) => this._onPointerMove(pointer);
    this._onUp   = (pointer) => this._onPointerUp(pointer);

    this.scene.input.on('pointerdown', this._onDown);
    this.scene.input.on('pointermove', this._onMove);
    this.scene.input.on('pointerup',   this._onUp);
  }

  /**
   * 포인터 다운: 조이스틱 → 대쉬 → 폭탄 순으로 판정
   */
  _onPointerDown(pointer) {
    const px = pointer.x;
    const py = pointer.y;

    // 조이스틱 판정 (1.5x 반경으로 넓게 잡기)
    const joyGrabRadius = this.joyRadius * 1.5;
    const joyDx = px - this.joyCenterX;
    const joyDy = py - this.joyCenterY;
    const joyDist = Math.sqrt(joyDx * joyDx + joyDy * joyDy);

    if (this.joystickPointerId === null && joyDist <= joyGrabRadius) {
      this.joystickPointerId = pointer.id;
      this._updateJoystick(px, py);
      return;
    }

    // 대쉬 버튼 판정
    const dashDx = px - this.dashCenterX;
    const dashDy = py - this.dashCenterY;
    if (Math.sqrt(dashDx * dashDx + dashDy * dashDy) <= this.dashRadius) {
      this.dashPressed = true;
      this._drawDashButton(0.8);
      return;
    }

    // 폭탄 버튼 판정
    const bombDx = px - this.bombCenterX;
    const bombDy = py - this.bombCenterY;
    if (Math.sqrt(bombDx * bombDx + bombDy * bombDy) <= this.bombRadius) {
      this.bombPressed = true;
      this._drawBombButton(0.8);
    }
  }

  /**
   * 포인터 이동: 조이스틱 포인터만 처리
   */
  _onPointerMove(pointer) {
    if (pointer.id === this.joystickPointerId) {
      this._updateJoystick(pointer.x, pointer.y);
    }
  }

  /**
   * 포인터 업: 조이스틱 포인터면 초기화
   */
  _onPointerUp(pointer) {
    if (pointer.id === this.joystickPointerId) {
      this._resetJoystick();
    }
  }

  // ═══════════════════════════════════════
  // 공개 API
  // ═══════════════════════════════════════

  /**
   * 이동 벡터 반환 (각 축 -1..1)
   * @returns {{ x: number, y: number }}
   */
  getMovement() {
    return { x: this.dirX, y: this.dirY };
  }

  /**
   * 대쉬 입력 소비 (한 번만 true)
   * @returns {boolean}
   */
  consumeDash() {
    if (this.dashPressed) {
      this.dashPressed = false;
      return true;
    }
    return false;
  }

  /**
   * 폭탄 입력 소비 (한 번만 true)
   * @returns {boolean}
   */
  consumeBomb() {
    if (this.bombPressed) {
      this.bombPressed = false;
      return true;
    }
    return false;
  }

  /**
   * 버튼 시각 상태 갱신
   * @param {boolean} staminaOk - 대쉬 가능 여부
   * @param {number}  bombCount - 보유 폭탄 수
   */
  updateState(staminaOk, bombCount) {
    // 대쉬 버튼
    const dashAlpha = staminaOk ? 0.45 : 0.15;
    this._drawDashButton(dashAlpha);
    this._dashLabel.setAlpha(staminaOk ? 1 : 0.3);

    // 폭탄 버튼
    const hasBomb   = bombCount > 0;
    const bombAlpha = hasBomb ? 0.45 : 0.15;
    this._drawBombButton(bombAlpha);
    this._bombLabel.setAlpha(hasBomb ? 1 : 0.3);
  }

  /**
   * 이벤트 해제 및 컨테이너 파괴
   */
  destroy() {
    this.scene.input.off('pointerdown', this._onDown);
    this.scene.input.off('pointermove', this._onMove);
    this.scene.input.off('pointerup',   this._onUp);
    this.container.destroy();
  }
}
