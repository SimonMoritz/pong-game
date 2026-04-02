// Keyboard and touch input module — tracks which keys are held and active touch positions.

export function createInputHandler(canvas) {
    const keys = {
        arrowUp: false,
        arrowDown: false,
        w: false,
        s: false,
    };

    const touch = {
        leftY: null,
        rightY: null,
    };

    // Track which touch identifier owns each side
    const touchIds = {
        left: null,
        right: null,
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

    // --- Touch handling ---

    function sideForX(clientX) {
        return clientX < window.innerWidth / 2 ? 'left' : 'right';
    }

    function updateTouch(t) {
        const side = sideForX(t.clientX);
        touchIds[side] = t.identifier;
        touch[side + 'Y'] = t.clientY;
    }

    function clearTouch(identifier) {
        if (touchIds.left === identifier) {
            touchIds.left = null;
            touch.leftY = null;
        }
        if (touchIds.right === identifier) {
            touchIds.right = null;
            touch.rightY = null;
        }
    }

    if (canvas) {
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            for (const t of e.changedTouches) {
                updateTouch(t);
            }
        });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (const t of e.changedTouches) {
                updateTouch(t);
            }
        });

        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            for (const t of e.changedTouches) {
                clearTouch(t.identifier);
            }
        });

        canvas.addEventListener('touchcancel', (e) => {
            for (const t of e.changedTouches) {
                clearTouch(t.identifier);
            }
        });
    }

    return { keys, touch };
}
