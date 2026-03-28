// Sound effects module — Web Audio API, no browser UI dependencies.
// AudioContext is created lazily on first use to satisfy autoplay policy.
// Sounds are pre-baked into AudioBuffers to avoid per-hit GC pressure.

export function createSoundEngine() {
    let ac = null;
    let buffers = null;

    function init() {
        if (ac) return;
        ac = new AudioContext();
        buffers = {
            paddleHit:  generateBuffer(ac, 480, 0.05),
            wallBounce: generateBuffer(ac, 240, 0.05),
            score:      generateBuffer(ac, 130, 0.35),
        };
    }

    function generateBuffer(ac, frequency, duration) {
        const samples = Math.ceil(ac.sampleRate * duration);
        const buffer = ac.createBuffer(1, samples, ac.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < samples; i++) {
            const t = i / ac.sampleRate;
            const envelope = Math.max(0, 1 - t / duration);
            data[i] = Math.sign(Math.sin(2 * Math.PI * frequency * t)) * envelope * 0.15;
        }
        return buffer;
    }

    function play(buffer) {
        const src = ac.createBufferSource();
        src.buffer = buffer;
        src.connect(ac.destination);
        src.start();
    }

    return {
        paddleHit()  { init(); play(buffers.paddleHit); },
        wallBounce() { init(); play(buffers.wallBounce); },
        score()      { init(); play(buffers.score); },
    };
}
