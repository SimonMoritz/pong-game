// Keyboard input module — tracks which keys are currently held down.

export function createInputHandler() {
    const keys = {
        arrowUp: false,
        arrowDown: false,
        w: false,
        s: false,
    };

    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'ArrowUp': keys.arrowUp = true; break;
            case 'ArrowDown': keys.arrowDown = true; break;
            case 'w': keys.w = true; break;
            case 's': keys.s = true; break;
        }
    });

    document.addEventListener('keyup', (e) => {
        switch (e.key) {
            case 'ArrowUp': keys.arrowUp = false; break;
            case 'ArrowDown': keys.arrowDown = false; break;
            case 'w': keys.w = false; break;
            case 's': keys.s = false; break;
        }
    });

    return keys;
}
