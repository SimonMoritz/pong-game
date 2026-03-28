import {
    createGameState,
    getGameSnapshot,
    resizeGameState,
    setAiEnabled,
    startGame,
    stepGame,
    stopGame,
} from './game-engine.js';

let state = null;

self.addEventListener('message', (event) => {
    const message = event.data;

    switch (message.type) {
        case 'init':
            state = createGameState(message.viewport, {
                aiEnabled: message.aiEnabled,
            });
            postFrame();
            break;
        case 'resize':
            if (!state) {
                state = createGameState(message.viewport, {
                    aiEnabled: message.aiEnabled,
                });
            } else {
                resizeGameState(state, message.viewport);
            }
            postFrame();
            break;
        case 'setAiEnabled':
            if (!state) return;
            setAiEnabled(state, message.value);
            postFrame();
            break;
        case 'start':
            if (!state) return;
            startGame(state);
            postFrame();
            break;
        case 'stop':
            if (!state) return;
            stopGame(state);
            postFrame();
            break;
        case 'tick':
            if (!state) return;
            if (!state.playing) {
                postFrame();
                return;
            }
            postStep(stepGame(state, message.input, message.dt));
            break;
    }
});

function postFrame(events = []) {
    if (!state) return;

    postMessage({
        type: 'frame',
        state: getGameSnapshot(state),
        events,
    });
}

function postStep(result) {
    if (!state) return;

    postMessage({
        type: 'frame',
        state: result.state,
        events: result.events,
    });
}
