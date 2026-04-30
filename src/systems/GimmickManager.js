import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants/game.js';
import { FLOOR_PATTERNS } from '../patterns/floorPatterns.js';

/**
 * GimmickManager
 * - 스테이지 패턴 데이터를 읽고 타이밍에 맞춰 기믹 스폰
 * - scene.time.addEvent 기반 타임라인 스케줄링
 * - 난이도 파라미터 적용 (이지/노말)
 */
export default class GimmickManager {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} managers - { laser, bullet, floor, qte }
   */
  constructor(scene, managers) {
    this.scene = scene;
    this.laserManager = managers.laser;
    this.bulletManager = managers.bullet;
    this.floorManager = managers.floor;
    this.qteManager = managers.qte;

    this.scheduledEvents = [];
    this.isRunning = false;
    this.elapsedTime = 0;
    this.gameMode = 'normal';
  }

  /**
   * 스테이지 패턴 로드 및 실행
   * @param {object} patternData - 스테이지 패턴 JSON
   * @param {string} mode - 'normal' (EASY 모드 삭제됨, 호환성 유지를 위한 인자)
   */
  startPattern(patternData, mode = 'normal') {
    this.gameMode = mode;
    this.isRunning = true;
    this.elapsedTime = 0;

    // 노말 모드 증폭 (EASY 모드 삭제됨 — 이전 _convertToEasy 분기 제거)
    const events = this._amplifyPattern(
      patternData.events,
      patternData.stage || 1,
      patternData.duration || 30,
    );

    // 이벤트 스케줄링
    events.forEach((event) => {
      const timer = this.scene.time.delayedCall(event.time * 1000, () => {
        if (!this.isRunning) return;
        this._spawnGimmick(event.type, event.params);
      });
      this.scheduledEvents.push(timer);
    });

    console.log(`[GimmickManager] 패턴 시작 - ${events.length}개 이벤트, 모드: ${mode}`);
  }

  /**
   * 기믹 스폰 디스패치 — 캐릭터 주변 랜덤 위치 적용
   */
  _spawnGimmick(type, params) {
    const p = this._randomizeParams(type, { ...params });

    switch (type) {
      case 'floor':
        this.floorManager.spawn(p);
        break;

      case 'bullet':
        this.bulletManager.firePattern(p);
        break;

      case 'laser':
        if (p.bendX !== undefined) {
          this.laserManager.spawnBent(p);
        } else {
          this.laserManager.spawnStraight(p);
        }
        break;

      case 'qte': {
        const sequence = p.sequence
          ? p.sequence.map((key) => ({ key, timing: p.timing || 1500 }))
          : this.qteManager.generateRandomSequence(p.count || 3, p.timing || 1500);

        this.qteManager.startSequence(sequence, (results) => {
          console.log('[GimmickManager] QTE 결과:', results);
        });
        break;
      }

      case 'floorPattern': {
        const fn = FLOOR_PATTERNS[p.name];
        if (!fn) {
          console.warn('[GimmickManager] unknown floorPattern:', p.name);
          break;
        }
        // 패턴 자체가 위치를 결정하므로 _randomizeParams는 그대로 통과시킨다
        // (switch에 'floorPattern' 케이스가 없어 기본 경로로 통과됨).
        fn(this.scene, this.floorManager, p);
        break;
      }

      default:
        console.warn(`[GimmickManager] 알 수 없는 기믹 타입: ${type}`);
    }
  }

  /**
   * 캐릭터 주변 랜덤 위치로 파라미터를 변환
   * 캐릭터 정중앙도 가능 (순발력 요구)
   */
  _randomizeParams(type, params) {
    const player = this.scene.player;
    if (!player || !player.isAlive) return params;

    const px = player.x;
    const py = player.y;
    const rand = (min, max) => min + Math.random() * (max - min);
    const clampX = (v) => Math.max(20, Math.min(GAME_WIDTH - 20, v));
    const clampY = (v) => Math.max(20, Math.min(GAME_HEIGHT - 20, v));

    switch (type) {
      case 'floor': {
        // 50% 확률로 정확히 캐릭터 위치, 50%는 주변 ±150 범위
        if (Math.random() < 0.5) {
          params.x = clampX(px + rand(-20, 20));
          params.y = clampY(py + rand(-20, 20));
        } else {
          params.x = clampX(px + rand(-150, 150));
          params.y = clampY(py + rand(-120, 120));
        }
        if (params.variant === 'moving') {
          params.moveToX = clampX(px + rand(-200, 200));
          params.moveToY = clampY(py + rand(-150, 150));
        }
        break;
      }
      case 'bullet': {
        // 발사 원점을 가장자리에서 랜덤, 플레이어 직격 방향
        const side = Math.floor(Math.random() * 4);
        if (side === 0) { params.originX = rand(0, GAME_WIDTH); params.originY = -10; }
        else if (side === 1) { params.originX = rand(0, GAME_WIDTH); params.originY = GAME_HEIGHT + 10; }
        else if (side === 2) { params.originX = -10; params.originY = rand(0, GAME_HEIGHT); }
        else { params.originX = GAME_WIDTH + 10; params.originY = rand(0, GAME_HEIGHT); }
        // 플레이어 방향으로 정확히 (약간의 산포)
        params.direction = Phaser.Math.RadToDeg(
          Math.atan2(py + rand(-40, 40) - params.originY, px + rand(-40, 40) - params.originX)
        );
        break;
      }
      case 'laser': {
        // 40% 확률로 캐릭터 정중앙 관통, 60%는 근접 통과
        const direct = Math.random() < 0.4;
        const offsetX = direct ? rand(-10, 10) : rand(-100, 100);
        const offsetY = direct ? rand(-10, 10) : rand(-100, 100);
        const cx = clampX(px + offsetX);
        const cy = clampY(py + offsetY);
        const angle = rand(0, Math.PI);
        const len = Math.max(GAME_WIDTH, GAME_HEIGHT);
        params.startX = Math.round(cx - Math.cos(angle) * len);
        params.startY = Math.round(cy - Math.sin(angle) * len);
        params.endX = Math.round(cx + Math.cos(angle) * len);
        params.endY = Math.round(cy + Math.sin(angle) * len);
        if (params.bendX !== undefined) {
          params.bendX = clampX(cx + rand(-40, 40));
          params.bendY = clampY(cy + rand(-40, 40));
        }
        break;
      }
      // QTE는 위치 무관
    }
    return params;
  }

  /**
   * 노말 모드 패턴 증폭
   * - 비QTE 이벤트를 복제하여 시간 오프셋으로 중첩 생성 (공격적)
   * - 스테이지가 높을수록 더 많은 복제
   * - 빈 시간대에 추가 이벤트 삽입 (촘촘하게)
   * - 기존 이벤트의 경고시간도 단축
   */
  _amplifyPattern(events, stage, duration) {
    // 스테이지별 증폭 배율: 1~4면 2.0배, 6~9면 3.0배, 11~14면 4.0배, 16~19면 5.0배
    const tier = Math.floor((stage - 1) / 5);
    const mult = 2.0 + tier * 1.0;

    const amplified = [];

    // 원본 이벤트 추가 (경고시간 단축 적용)
    events.forEach((ev) => {
      const e = { ...ev, params: { ...ev.params } };
      this._hardenParams(e, stage);
      amplified.push(e);
    });

    // 비QTE 이벤트를 복제하여 짧은 시간 오프셋으로 추가 (강한 중첩)
    // floorPattern은 시간 오프셋만 다른 복제가 의미가 없으므로 제외
    const nonQteEvents = events.filter((ev) => ev.type !== 'qte' && ev.type !== 'floorPattern');
    const extraCount = Math.round(nonQteEvents.length * (mult - 1));

    for (let i = 0; i < extraCount; i++) {
      const src = nonQteEvents[i % nonQteEvents.length];
      const offset = 0.3 + Math.random() * 1.5; // 0.3~1.8초 오프셋 (더 촘촘)
      const newTime = Math.min(src.time + offset, duration - 1);
      const copy = { time: parseFloat(newTime.toFixed(1)), type: src.type, params: { ...src.params } };
      this._hardenParams(copy, stage);
      amplified.push(copy);
    }

    // QTE를 일정 간격으로 삽입 (모든 스테이지에서 적극적으로)
    const qteInterval = Math.max(4, 8 - tier); // 스테이지 높을수록 더 자주 (8초→4초 간격)
    for (let t = 3; t < duration - 3; t += qteInterval) {
      const hasQte = amplified.some((ev) => ev.type === 'qte' && Math.abs(ev.time - t) < qteInterval * 0.5);
      if (!hasQte) {
        amplified.push({
          time: parseFloat(t.toFixed(1)),
          type: 'qte',
          params: this._generateRandomParams('qte', stage),
        });
      }
    }

    // 빈 시간대에 랜덤 기믹 이벤트 삽입
    amplified.sort((a, b) => a.time - b.time);
    const fillers = [];
    const gimmickTypes = ['floor', 'bullet', 'laser'];
    for (let t = 1; t < duration - 1; t += 0.8) {
      const hasEvent = amplified.some((ev) => Math.abs(ev.time - t) < 1.0);
      if (!hasEvent) {
        const type = gimmickTypes[Math.floor(Math.random() * gimmickTypes.length)];
        fillers.push({
          time: parseFloat(t.toFixed(1)),
          type: type,
          params: this._generateRandomParams(type, stage),
        });
      }
    }

    amplified.push(...fillers);
    amplified.sort((a, b) => a.time - b.time);
    return amplified;
  }

  /**
   * 개별 이벤트 파라미터를 더 어렵게 조정
   */
  _hardenParams(event, stage) {
    const factor = 1 + stage * 0.03; // 스테이지별 약간의 추가 강화
    const p = event.params;
    switch (event.type) {
      case 'floor':
        // 장판: 크기 확대, 경고시간 단축, 지속시간 증가
        p.width = Math.round((p.width || 150) * (1.0 + stage * 0.03));
        p.height = Math.round((p.height || 60) * (1.0 + stage * 0.03));
        p.warningTime = Math.max(500, Math.round((p.warningTime || 1500) * 0.6));
        p.activeTime = Math.round((p.activeTime || 2000) * 1.2);
        if (p.growScale && p.variant === 'growing') p.growScale = Math.min(2.5, (p.growScale || 1.5) * 1.3);
        break;
      case 'bullet':
        // 탄환: 수 증가, 속도 증가
        p.count = Math.round((p.count || 5) * factor);
        p.speed = Math.round((p.speed || 160) * (1.0 + stage * 0.02));
        break;
      case 'laser':
        // 레이저: 경고시간 단축, 굵기 증가
        p.warningTime = Math.max(500, Math.round((p.warningTime || 1200) * 0.6));
        p.width = Math.round((p.width || 35) * 1.15);
        break;
    }
  }

  /**
   * 랜덤 기믹 파라미터 생성 (빈 시간대 채우기용 - 공격적)
   */
  _generateRandomParams(type, stage) {
    const rand = (min, max) => min + Math.random() * (max - min);
    const speed = 180 + stage * 10;
    const warning = Math.max(450, 1000 - stage * 30);

    switch (type) {
      case 'floor':
        return {
          x: rand(80, GAME_WIDTH - 80),
          y: rand(80, GAME_HEIGHT - 80),
          width: rand(140, 260),
          height: rand(80, 160),
          warningTime: warning,
          activeTime: rand(2000, 3500),
          shape: Math.random() > 0.5 ? 'rect' : 'circle',
          variant: ['normal', 'growing', 'growing', 'moving'][Math.floor(Math.random() * 4)],
          growScale: rand(1.3, 2.2),
        };
      case 'bullet':
        return {
          type: ['fan', 'circle', 'circle'][Math.floor(Math.random() * 3)],
          originX: rand(80, GAME_WIDTH - 80),
          originY: Math.random() > 0.5 ? -10 : GAME_HEIGHT + 10,
          count: Math.round(5 + stage * 0.7),
          speed: speed,
          angle: rand(35, 70),
          direction: 270,
          delay: 0,
        };
      case 'laser':
        return {
          startX: Math.random() > 0.5 ? 0 : GAME_WIDTH,
          startY: rand(40, GAME_HEIGHT - 40),
          endX: Math.random() > 0.5 ? GAME_WIDTH : 0,
          endY: rand(40, GAME_HEIGHT - 40),
          width: rand(35, 50),
          warningTime: warning,
          activeTime: rand(2000, 3000),
        };
      case 'qte': {
        // 스테이지별 QTE 시퀀스 길이와 타이밍
        const keys = ['Q', 'W', 'E'];
        const seqLen = Math.min(2 + Math.floor(stage / 4), 5);
        const seq = [];
        for (let i = 0; i < seqLen; i++) seq.push(keys[Math.floor(Math.random() * keys.length)]);
        return {
          sequence: seq,
          timing: Math.max(1200, 2500 - stage * 60),
        };
      }
      default:
        return {};
    }
  }

  /**
   * 모든 기믹 + 스케줄 중단 (폭탄 등)
   */
  clearAllGimmicks() {
    this.laserManager.clearAll();
    this.bulletManager.clearAll();
    this.floorManager.clearAll();
  }

  /**
   * 패턴 중지 (스테이지 종료 등)
   */
  stop() {
    this.isRunning = false;
    this.scheduledEvents.forEach((timer) => {
      if (timer) timer.remove(false);
    });
    this.scheduledEvents = [];
  }

  /**
   * 완전 정리
   */
  destroy() {
    this.stop();
    this.clearAllGimmicks();
  }
}
