// Difficulty multipliers for each stage
const STAGE_CONFIGS = {
  1: { bulletSpeedMult: 1.0, bulletCountMult: 1.0, warningTimeMult: 1.0, qteTimingMult: 1.0 },
  2: { bulletSpeedMult: 1.05, bulletCountMult: 1.0, warningTimeMult: 1.0, qteTimingMult: 1.0 },
  3: { bulletSpeedMult: 1.0, bulletCountMult: 1.0, warningTimeMult: 1.0, qteTimingMult: 1.0 },
  4: { bulletSpeedMult: 1.0, bulletCountMult: 1.0, warningTimeMult: 1.0, qteTimingMult: 1.0 },
  6: { bulletSpeedMult: 1.1, bulletCountMult: 1.1, warningTimeMult: 0.95, qteTimingMult: 1.0 },
  7: { bulletSpeedMult: 1.15, bulletCountMult: 1.15, warningTimeMult: 0.95, qteTimingMult: 1.0 },
  8: { bulletSpeedMult: 1.2, bulletCountMult: 1.2, warningTimeMult: 0.9, qteTimingMult: 1.05 },
  9: { bulletSpeedMult: 1.25, bulletCountMult: 1.25, warningTimeMult: 0.9, qteTimingMult: 1.05 },
  11: { bulletSpeedMult: 1.3, bulletCountMult: 1.3, warningTimeMult: 0.85, qteTimingMult: 1.1 },
  12: { bulletSpeedMult: 1.35, bulletCountMult: 1.35, warningTimeMult: 0.85, qteTimingMult: 1.1 },
  13: { bulletSpeedMult: 1.4, bulletCountMult: 1.4, warningTimeMult: 0.8, qteTimingMult: 1.15 },
  14: { bulletSpeedMult: 1.5, bulletCountMult: 1.45, warningTimeMult: 0.8, qteTimingMult: 1.15 },
  16: { bulletSpeedMult: 1.6, bulletCountMult: 1.5, warningTimeMult: 0.75, qteTimingMult: 1.2 },
  17: { bulletSpeedMult: 1.65, bulletCountMult: 1.55, warningTimeMult: 0.75, qteTimingMult: 1.25 },
  18: { bulletSpeedMult: 1.7, bulletCountMult: 1.6, warningTimeMult: 0.7, qteTimingMult: 1.3 },
  19: { bulletSpeedMult: 1.8, bulletCountMult: 1.65, warningTimeMult: 0.7, qteTimingMult: 1.35 },
};

export { STAGE_CONFIGS };
