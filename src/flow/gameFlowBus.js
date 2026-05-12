export const GAME_FLOW_EVENTS = {
  START_REQUESTED: 'flow:start-requested',
  RETURN_TO_INTRO_REQUESTED: 'flow:return-to-intro-requested',
};

class GameFlowBus extends EventTarget {
  emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  on(type, handler) {
    const wrapped = (event) => handler(event.detail);
    this.addEventListener(type, wrapped);
    return () => this.removeEventListener(type, wrapped);
  }
}

export const gameFlowBus = new GameFlowBus();

