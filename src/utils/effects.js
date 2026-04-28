import { GAME_WIDTH, GAME_HEIGHT } from '../constants/game.js';

/**
 * Visual effects utility module
 * Reusable effect functions for hit, dodge, QTE, bomb, boss transitions
 */

/**
 * Screen flash overlay (hit, bomb, phase change)
 * @param {Phaser.Scene} scene
 * @param {number} color - hex color
 * @param {number} alpha - initial alpha
 * @param {number} duration - fade duration ms
 */
export function screenFlash(scene, color, alpha, duration) {
  var flash = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, color, alpha);
  flash.setDepth(500);
  scene.tweens.add({
    targets: flash, alpha: 0, duration: duration || 300,
    onComplete: function() { flash.destroy(); },
  });
}

/**
 * Damage vignette (red border flash)
 * @param {Phaser.Scene} scene
 */
export function damageVignette(scene) {
  var gfx = scene.add.graphics();
  gfx.setDepth(499);
  // Draw semi-transparent red border
  gfx.fillStyle(0xff0000, 0.25);
  gfx.fillRect(0, 0, GAME_WIDTH, 8);
  gfx.fillRect(0, GAME_HEIGHT - 8, GAME_WIDTH, 8);
  gfx.fillRect(0, 0, 8, GAME_HEIGHT);
  gfx.fillRect(GAME_WIDTH - 8, 0, 8, GAME_HEIGHT);
  scene.tweens.add({
    targets: gfx, alpha: 0, duration: 400,
    onComplete: function() { gfx.destroy(); },
  });
}

/**
 * Score popup floating text
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {string} text
 * @param {string} color - CSS color string
 */
export function floatingText(scene, x, y, text, color) {
  var txt = scene.add.text(x, y, text, {
    fontFamily: 'monospace', fontSize: '14px', fontStyle: 'bold', color: color || '#ffd740',
  }).setOrigin(0.5).setDepth(300);
  scene.tweens.add({
    targets: txt, y: y - 30, alpha: 0, duration: 800, ease: 'Power2',
    onComplete: function() { txt.destroy(); },
  });
}

/**
 * Circle burst particles (simple circles expanding outward)
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {number} color
 * @param {number} count
 */
export function particleBurst(scene, x, y, color, count) {
  for (var i = 0; i < (count || 8); i++) {
    var angle = (Math.PI * 2 / count) * i;
    var r = 4 + Math.random() * 4;
    var circle = scene.add.circle(x, y, r, color, 0.8);
    circle.setDepth(300);
    var dist = 30 + Math.random() * 40;
    scene.tweens.add({
      targets: circle,
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      alpha: 0, scaleX: 0.2, scaleY: 0.2,
      duration: 300 + Math.random() * 300,
      onComplete: function() { circle.destroy(); },
    });
  }
}

/**
 * Dodge trail / afterimage at position
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {number} color
 */
export function dodgeTrail(scene, x, y, color) {
  var gfx = scene.add.graphics();
  gfx.setDepth(5);
  gfx.fillStyle(color, 0.25);
  gfx.fillRoundedRect(x - 8, y - 4, 16, 20, 3);
  gfx.fillCircle(x, y - 10, 8);
  scene.tweens.add({
    targets: gfx, alpha: 0, duration: 200,
    onComplete: function() { gfx.destroy(); },
  });
}

/**
 * Shake + flash combo for big hits
 * @param {Phaser.Scene} scene
 * @param {number} intensity - shake intensity
 */
export function impactEffect(scene, intensity) {
  scene.cameras.main.shake(200, intensity || 0.01);
  screenFlash(scene, 0xff0000, 0.15, 200);
  damageVignette(scene);
}

/**
 * Boss phase transition dramatic effect
 * @param {Phaser.Scene} scene
 * @param {number} color
 */
export function phaseTransition(scene, color) {
  scene.cameras.main.shake(500, 0.025);
  screenFlash(scene, color, 0.4, 600);
  // Zoom pulse
  scene.cameras.main.zoomTo(1.05, 200, 'Power2', false, function(cam, progress) {
    if (progress === 1) { scene.cameras.main.zoomTo(1, 300); }
  });
}

/**
 * Accessibility: shape indicator for gimmick type
 * Draws a small shape icon to help color-blind players
 */
export function accessibilityIcon(scene, x, y, type) {
  var gfx = scene.add.graphics();
  gfx.setDepth(200);
  gfx.lineStyle(2, 0xffffff, 0.6);
  switch (type) {
    case 'laser': // diagonal line icon
      gfx.lineBetween(x - 6, y - 6, x + 6, y + 6);
      break;
    case 'bullet': // small circle icon
      gfx.strokeCircle(x, y, 5);
      break;
    case 'floor': // small square icon
      gfx.strokeRect(x - 5, y - 5, 10, 10);
      break;
  }
  return gfx;
}
