/**
 * Shared pause flow for gameplay scenes.
 */
export default class PauseFlow {
  static pause(scene, returnScene, onResume) {
    if (scene.isPaused) return;
    scene.isPaused = true;
    scene.scene.pause();
    scene.scene.launch('PauseScene', {
      returnScene: returnScene,
      onResume: onResume,
    });
  }

  static resume(scene) {
    scene.isPaused = false;
    scene.scene.stop('PauseScene');
    scene.scene.resume();
  }
}

