function createDefaultSession() {
  return {
    mode: 'normal',
    controlMode: 'arrows',
    dodgeKey: 'SHIFT',
    mobileMode: false,
    touchControlScale: 1.0,
  };
}

function resolveMobileMode(settings) {
  const mobileSetting = settings.mobileMode;
  if (mobileSetting !== null && mobileSetting !== undefined) {
    return mobileSetting;
  }
  return navigator.maxTouchPoints > 0;
}

export function createGameFlowService() {
  let session = createDefaultSession();

  function setSessionFromStartRequest(mode, settings) {
    session = {
      mode: mode,
      controlMode: settings.controlMode,
      dodgeKey: settings.dodgeKey,
      mobileMode: resolveMobileMode(settings),
      touchControlScale: settings.touchControlScale || 1.0,
    };
    return { ...session };
  }

  function buildSceneData(stage, extra) {
    return {
      mode: session.mode,
      controlMode: session.controlMode,
      dodgeKey: session.dodgeKey,
      mobileMode: session.mobileMode,
      touchControlScale: session.touchControlScale,
      stage: stage,
      ...(extra || {}),
    };
  }

  function getSession() {
    return { ...session };
  }

  return {
    setSessionFromStartRequest,
    buildSceneData,
    getSession,
  };
}

