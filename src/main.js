import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import GameScene from './scenes/GameScene.js';
import BossScene from './scenes/BossScene.js';
import UIScene from './scenes/UIScene.js';
import PauseScene from './scenes/PauseScene.js';
import { GAME_WIDTH, GAME_HEIGHT, STAGE } from './constants/game.js';
import { initUI } from './ui/intro.js';
import { showResultScreen } from './ui/result.js';
import { gameFlowBus, GAME_FLOW_EVENTS } from './flow/gameFlowBus.js';
import { createGameFlowService } from './flow/gameFlowService.js';

var config = {
  type: Phaser.AUTO, width: GAME_WIDTH, height: GAME_HEIGHT,
  parent: 'game-container', backgroundColor: '#1a1a2e',
  physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, min: { width: 400, height: 300 } },
  scene: [BootScene, GameScene, BossScene, UIScene, PauseScene],
  callbacks: { postBoot: function(game) { game.input.addPointer(2); setupComm(game); } },
};

var game = new Phaser.Game(config);
var gameFlowService = createGameFlowService();

function setupComm(game) {
  function stopRuntimeScenes() {
    game.scene.stop('PauseScene');
    game.scene.stop('GameScene');
    game.scene.stop('BossScene');
    game.scene.stop('UIScene');
  }

  function showIntroScreen() {
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('result-screen').style.display = 'none';
    document.getElementById('intro-screen').style.display = 'flex';
  }

  function showGameScreen() {
    document.getElementById('intro-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
  }

  function startStage(stage) {
    const sceneData = gameFlowService.buildSceneData(stage);
    if (STAGE.BOSS_STAGES.includes(stage)) {
      game.scene.start('BossScene', sceneData);
    } else {
      game.scene.start('GameScene', sceneData);
    }
  }

  gameFlowBus.on(GAME_FLOW_EVENTS.START_REQUESTED, function(payload) {
    const mode = payload && payload.mode ? payload.mode : 'normal';
    const settings = payload && payload.settings ? payload.settings : {};
    const stage = payload && payload.startStage ? payload.startStage : 1;

    gameFlowService.setSessionFromStartRequest(mode, settings);
    showGameScreen();
    startStage(stage);
  });

  gameFlowBus.on(GAME_FLOW_EVENTS.RETURN_TO_INTRO_REQUESTED, function() {
    stopRuntimeScenes();
    showIntroScreen();
  });

  game.events.on('gameReady', function() {
    showIntroScreen();
  });

  game.events.on('gameEnd', function(r) {
    stopRuntimeScenes();
    document.getElementById('game-container').style.display = 'none';
    showResultScreen(r);
  });
}
initUI();
