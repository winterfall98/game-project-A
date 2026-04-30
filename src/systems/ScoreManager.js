import { SCORE, MULTIPLIER, GRADE_THRESHOLDS, STAGE } from '../constants/game.js';

/**
 * ScoreManager
 * - Base score real-time accumulation (survival, dodge, QTE, clear, boss)
 * - Multiplier tracking (combo, no-damage, accuracy)
 * - Grade calculation (SS ~ D)
 */
export default class ScoreManager {
  constructor(scene) {
    this.scene = scene;

    // Base scores
    this.survivalScore = 0;
    this.bulletDodgeScore = 0;
    this.laserDodgeScore = 0;
    this.floorDodgeScore = 0;
    this.qteScore = 0;
    this.stageClearScore = 0;
    this.bossKillScore = 0;

    // Tracking
    this.bulletsDodged = 0;
    this.lasersDodged = 0;
    this.floorsDodged = 0;

    // Combo
    this.currentCombo = 0;
    this.maxCombo = 0;
    this.comboMultiplier = 1.0;

    // Per-stage tracking
    this.stageDamageTaken = false;
    this.noDamageStages = 0;

    // QTE accuracy
    this.totalGreat = 0;
    this.totalGood = 0;
    this.totalFail = 0;

    // Survival timer
    this._survivalTimer = null;

    // Carry-over score from previous stages
    this.carryOverScore = 0;
  }

  /**
   * Start survival score timer (call on stage start)
   */
  startSurvivalTimer() {
    this._survivalTimer = this.scene.time.addEvent({
      delay: 1000,
      callback: () => {
        this.survivalScore += SCORE.SURVIVAL_PER_SEC;
        this._emitUpdate();
      },
      loop: true,
    });
  }

  /**
   * Stop survival timer (call on stage end/death)
   */
  stopSurvivalTimer() {
    if (this._survivalTimer) {
      this._survivalTimer.remove(false);
      this._survivalTimer = null;
    }
  }

  // ===================================================
  // Score Events
  // ===================================================

  onBulletDodged() {
    this.bulletsDodged++;
    this.bulletDodgeScore += SCORE.BULLET_DODGE;
    this._emitUpdate();
  }

  onLaserDodged() {
    this.lasersDodged++;
    this.laserDodgeScore += SCORE.LASER_DODGE;
    this._emitUpdate();
  }

  onFloorDodged() {
    this.floorsDodged++;
    this.floorDodgeScore += SCORE.FLOOR_DODGE;
    this._emitUpdate();
  }

  onQTEResult(result) {
    switch (result) {
      case 'great':
        this.totalGreat++;
        this.qteScore += SCORE.QTE_GREAT;
        this.currentCombo++;
        if (this.currentCombo > this.maxCombo) this.maxCombo = this.currentCombo;
        break;
      case 'good':
        this.totalGood++;
        this.qteScore += SCORE.QTE_GOOD;
        // Good does not break combo but does not increment either
        break;
      case 'fail':
        this.totalFail++;
        this.currentCombo = 0;
        break;
    }
    this.comboMultiplier = this._calcComboMultiplier();
    this._emitUpdate();
    this.scene.events.emit('updateCombo', {
      combo: this.currentCombo,
      multiplier: this.comboMultiplier,
    });
  }

  onDamageTaken() {
    this.stageDamageTaken = true;
  }

  onStageClear(stageNumber) {
    this.stageClearScore += stageNumber * SCORE.STAGE_CLEAR_MULTIPLIER;
    if (!this.stageDamageTaken) {
      this.noDamageStages++;
    }
    // Reset per-stage tracking
    this.stageDamageTaken = false;
    this._emitUpdate();
  }

  onBossKill() {
    this.bossKillScore += SCORE.BOSS_KILL;
    this._emitUpdate();
  }

  // ===================================================
  // Multiplier Calculations
  // ===================================================

  _calcComboMultiplier() {
    if (this.currentCombo >= 15) return MULTIPLIER.COMBO_15;
    if (this.currentCombo >= 10) return MULTIPLIER.COMBO_10;
    if (this.currentCombo >= 5) return MULTIPLIER.COMBO_5;
    return 1.0;
  }

  /**
   * No-damage multiplier (applied per qualifying stage)
   */
  get noDamageMultiplier() {
    return this.noDamageStages > 0 ? MULTIPLIER.NO_DAMAGE : 1.0;
  }

  /**
   * QTE accuracy multiplier
   */
  get accuracyMultiplier() {
    const total = this.totalGreat + this.totalGood + this.totalFail;
    if (total === 0) return 1.0;
    const ratio = this.totalGreat / total;
    if (ratio >= 0.9) return MULTIPLIER.ACCURACY_90;
    if (ratio >= 0.7) return MULTIPLIER.ACCURACY_70;
    return 1.0;
  }

  /**
   * QTE accuracy percentage
   */
  get accuracy() {
    const total = this.totalGreat + this.totalGood + this.totalFail;
    if (total === 0) return 100;
    return Math.round((this.totalGreat / total) * 100);
  }

  // ===================================================
  // Final Score
  // ===================================================

  /**
   * Base score (sum of all categories)
   */
  get baseScore() {
    return this.survivalScore + this.bulletDodgeScore + this.laserDodgeScore +
      this.floorDodgeScore + this.qteScore + this.stageClearScore +
      this.bossKillScore + this.carryOverScore;
  }

  /**
   * Final score with all multipliers applied
   */
  get finalScore() {
    return Math.round(this.baseScore * this.comboMultiplier * this.accuracyMultiplier);
  }

  /**
   * Real-time display score (base only, multipliers shown separately)
   */
  get displayScore() {
    return this.baseScore;
  }

  /**
   * Calculate grade based on theoretical maximum
   * @param {number} stageReached - Highest stage reached
   */
  calcGrade(stageReached) {
    const theoreticalMax = this._calcTheoreticalMax(stageReached);
    if (theoreticalMax === 0) return 'D';
    const ratio = this.finalScore / theoreticalMax;

    if (ratio >= GRADE_THRESHOLDS.SS) return 'SS';
    if (ratio >= GRADE_THRESHOLDS.S) return 'S';
    if (ratio >= GRADE_THRESHOLDS.A) return 'A';
    if (ratio >= GRADE_THRESHOLDS.B) return 'B';
    if (ratio >= GRADE_THRESHOLDS.C) return 'C';
    return 'D';
  }

  /**
   * Theoretical maximum score for given stage count
   */
  _calcTheoreticalMax(stageReached) {
    let max = 0;
    // Survival: assume 40s average per stage
    max += stageReached * 40 * SCORE.SURVIVAL_PER_SEC;
    // Stage clear bonuses
    for (let i = 1; i <= stageReached; i++) {
      max += i * SCORE.STAGE_CLEAR_MULTIPLIER;
    }
    // QTE: assume 3 per stage, all Great
    max += stageReached * 3 * SCORE.QTE_GREAT;
    // Boss kills
    const bossesBeaten = STAGE.BOSS_STAGES.filter((s) => s <= stageReached).length;
    max += bossesBeaten * SCORE.BOSS_KILL;
    // Apply max multipliers
    max *= MULTIPLIER.COMBO_MAX * MULTIPLIER.ACCURACY_90;
    return max;
  }

  // ===================================================
  // Result Data
  // ===================================================

  /**
   * Get full result data for result screen
   * @param {number} stageReached
   * @param {string} mode
   * @param {string} reason - 'death' | 'clear'
   * @param {number} [remainingHP=0] - 게임 종료 시점의 플레이어 HP
   */
  getResultData(stageReached, mode, reason, remainingHP = 0) {
    return {
      reason,
      mode,
      stage: stageReached,
      baseScore: this.baseScore,
      finalScore: this.finalScore,
      grade: this.calcGrade(stageReached),
      // Multipliers
      comboMultiplier: this.comboMultiplier,
      accuracyMultiplier: this.accuracyMultiplier,
      noDamageStages: this.noDamageStages,
      // Stats
      maxCombo: this.maxCombo,
      accuracy: this.accuracy,
      totalGreat: this.totalGreat,
      totalGood: this.totalGood,
      totalFail: this.totalFail,
      remainingHP,
      // Breakdown
      survivalScore: this.survivalScore,
      qteScore: this.qteScore,
      stageClearScore: this.stageClearScore,
      bossKillScore: this.bossKillScore,
    };
  }

  // ===================================================
  // Helpers
  // ===================================================

  _emitUpdate() {
    this.scene.events.emit('updateScore', { score: this.displayScore });
  }

  destroy() {
    this.stopSurvivalTimer();
  }
}
