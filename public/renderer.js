// Canvas rendering module — all drawing is isolated here.

export function createRenderer(canvas, viewport) {
    const ctx = canvas.getContext('2d', { alpha: false });
    const dpr = canvas.width / viewport.width;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Pre-render the dashed center divider to a narrow offscreen strip.
    // Only the strip (~4px wide) is cached, not the full screen.
    const stripWidth = 4;
    const dividerStrip = new OffscreenCanvas(stripWidth * dpr, viewport.height * dpr);
    const stripCtx = dividerStrip.getContext('2d');
    stripCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stripCtx.strokeStyle = 'rgba(255,255,255,0.15)';
    stripCtx.setLineDash([12, 12]);
    stripCtx.lineWidth = 2;
    stripCtx.beginPath();
    stripCtx.moveTo(stripWidth / 2, 0);
    stripCtx.lineTo(stripWidth / 2, viewport.height);
    stripCtx.stroke();

    function drawTrumpHead(ball) {
        const bx = Math.round(ball.x);
        const by = Math.round(ball.y);
        const width = ball.width;
        const height = ball.height;
        const cx = bx + width / 2;
        const cy = by + height / 2;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-Math.PI / 14);

        // Hair silhouette
        ctx.fillStyle = '#f0b43c';
        ctx.beginPath();
        ctx.moveTo(-width * 0.42, -height * 0.12);
        ctx.quadraticCurveTo(-width * 0.25, -height * 0.65, width * 0.3, -height * 0.52);
        ctx.quadraticCurveTo(width * 0.55, -height * 0.48, width * 0.2, -height * 0.08);
        ctx.quadraticCurveTo(0, -height * 0.22, -width * 0.12, -height * 0.04);
        ctx.quadraticCurveTo(-width * 0.28, -height * 0.03, -width * 0.42, -height * 0.12);
        ctx.fill();

        // Face
        ctx.fillStyle = '#f5c29a';
        ctx.beginPath();
        ctx.ellipse(0, height * 0.02, width * 0.43, height * 0.48, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        ctx.fillStyle = '#efb78e';
        ctx.beginPath();
        ctx.ellipse(-width * 0.4, height * 0.02, width * 0.08, height * 0.11, 0, 0, Math.PI * 2);
        ctx.ellipse(width * 0.4, height * 0.02, width * 0.08, height * 0.11, 0, 0, Math.PI * 2);
        ctx.fill();

        // Suit collar
        ctx.fillStyle = '#152238';
        ctx.beginPath();
        ctx.moveTo(-width * 0.2, height * 0.34);
        ctx.lineTo(-width * 0.42, height * 0.62);
        ctx.lineTo(-width * 0.05, height * 0.5);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(width * 0.2, height * 0.34);
        ctx.lineTo(width * 0.42, height * 0.62);
        ctx.lineTo(width * 0.05, height * 0.5);
        ctx.closePath();
        ctx.fill();

        // Tie
        ctx.fillStyle = '#d61f26';
        ctx.beginPath();
        ctx.moveTo(0, height * 0.38);
        ctx.lineTo(-width * 0.08, height * 0.62);
        ctx.lineTo(width * 0.08, height * 0.62);
        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.strokeStyle = '#2b1a12';
        ctx.lineCap = 'round';
        ctx.lineWidth = Math.max(1, width * 0.045);
        ctx.beginPath();
        ctx.moveTo(-width * 0.18, -height * 0.06);
        ctx.lineTo(-width * 0.06, -height * 0.08);
        ctx.moveTo(width * 0.06, -height * 0.08);
        ctx.lineTo(width * 0.18, -height * 0.06);
        ctx.stroke();

        // Nose
        ctx.lineWidth = Math.max(1, width * 0.035);
        ctx.beginPath();
        ctx.moveTo(width * 0.02, -height * 0.01);
        ctx.lineTo(width * 0.04, height * 0.12);
        ctx.lineTo(-width * 0.01, height * 0.15);
        ctx.stroke();

        // Mouth
        ctx.strokeStyle = '#a34a3f';
        ctx.lineWidth = Math.max(1, width * 0.04);
        ctx.beginPath();
        ctx.moveTo(-width * 0.12, height * 0.22);
        ctx.quadraticCurveTo(width * 0.02, height * 0.27, width * 0.16, height * 0.2);
        ctx.stroke();

        // Outline
        ctx.strokeStyle = '#3d2417';
        ctx.lineWidth = Math.max(1, width * 0.05);
        ctx.beginPath();
        ctx.ellipse(0, height * 0.02, width * 0.43, height * 0.48, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    return {
        drawFrame(ball, leftPlayer, rightPlayer) {
            // Background
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, viewport.width, viewport.height);

            // Center divider — blit pre-rendered narrow strip
            ctx.drawImage(dividerStrip, viewport.width / 2 - stripWidth / 2, 0, stripWidth, viewport.height);

            // Paddles
            ctx.fillStyle = 'white';
            ctx.fillRect(Math.round(leftPlayer.x), Math.round(leftPlayer.y), leftPlayer.width, leftPlayer.height);
            ctx.fillRect(Math.round(rightPlayer.x), Math.round(rightPlayer.y), rightPlayer.width, rightPlayer.height);

            // Ball — stylized Donald Trump head icon
            drawTrumpHead(ball);
        },

        drawPrompt(text, subtitle = null) {
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, viewport.width, viewport.height);
            const fontSize = Math.max(20, Math.round(viewport.height * 0.06));
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = `${fontSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, viewport.width / 2, viewport.height / 2);
            if (subtitle) {
                const subFontSize = Math.max(12, Math.round(viewport.height * 0.035));
                ctx.font = `${subFontSize}px sans-serif`;
                ctx.fillStyle = 'rgba(255,255,255,0.35)';
                ctx.fillText(subtitle, viewport.width / 2, viewport.height / 2 + fontSize * 1.4);
            }
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
        },
    };
}
