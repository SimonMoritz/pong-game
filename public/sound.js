// Sound effects module — Web Audio API, no browser UI dependencies.
// AudioContext is created lazily on first use to satisfy autoplay policy.

export function createSoundEngine() {
    let ctx = null;

    function getCtx() {
        if (!ctx) ctx = new AudioContext();
        return ctx;
    }

    function beep(frequency, duration) {
        const ac = getCtx();
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.type = 'square';
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0.15, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
        osc.start(ac.currentTime);
        osc.stop(ac.currentTime + duration);
    }

    return {
        paddleHit()  { beep(480, 0.05); },
        wallBounce() { beep(240, 0.05); },
        score()      { beep(130, 0.35); },
    };
}
