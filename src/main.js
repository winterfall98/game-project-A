import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import GameScene from './scenes/GameScene.js';
import BossScene from './scenes/BossScene.js';
import UIScene from './scenes/UIScene.js';
import PauseScene from './scenes/PauseScene.js';
import { GAME_WIDTH, GAME_HEIGHT, STAGE } from './constants/game.js';
import { initUI } from './ui/intro.js';
import { showResultScreen } from './ui/result.js';

var config = {
  type: Phaser.AUTO, width: GAME_WIDTH, height: GAME_HEIGHT,
  parent: 'game-container', backgroundColor: '#1a1a2e',
  physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, min: { width: 400, height: 300 } },
  scene: [BootScene, GameScene, BossScene, UIScene, PauseScene],
  callbacks: { postBoot: function(game) { setupComm(game); } },
};

var game = new Phaser.Game(config);
var session = { mode: 'normal', controlMode: 'arrows', dodgeKey: 'SHIFT' };

function setupComm(game) {
  game.events.on('gameReady', function() {
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('intro-screen').style.display = 'flex';
  });
  game.events.on('bossClear', function(data) {
    var next = data.stage + 1;
    if (next > STAGE.TOTAL) { game.events.emit('gameEnd', data); return; }
    game.scene.stop('BossScene');
    game.scene.stop('UIScene');
    game.scene.start('GameScene', {
      mode: session.mode, controlMode: session.controlMode, dodgeKey: session.dodgeKey,
      stage: next, playerHP: data.playerHP || 100, totalScore: data.score || 0,
    });
  });
  game.events.on('gameEnd', function(r) {
    game.scene.stop('PauseScene'); game.scene.stop('GameScene'); game.scene.stop('BossScene'); game.scene.stop('UIScene');
    document.getElementById('game-container').style.display = 'none';
    showResultScreen(r);
  });
  window.startGame = function(mode, settings, startStage) {
    var stage = startStage || 1;
    session = { mode: mode, controlMode: settings.controlMode, dodgeKey: settings.dodgeKey };
    document.getElementById('intro-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    var sceneData = { mode: mode, controlMode: settings.controlMode, dodgeKey: settings.dodgeKey, stage: stage };
    if (STAGE.BOSS_STAGES.includes(stage)) {
      game.scene.start('BossScene', sceneData);
    } else {
      game.scene.start('GameScene', sceneData);
    }
  };
  window.returnToIntro = function() {
    game.scene.stop('PauseScene'); game.scene.stop('GameScene'); game.scene.stop('BossScene'); game.scene.stop('UIScene');
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('result-screen').style.display = 'none';
    document.getElementById('intro-screen').style.display = 'flex';
  };
}
initUI();
