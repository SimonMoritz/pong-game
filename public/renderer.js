// Canvas rendering module — all drawing is isolated here.

export function createRenderer(canvas, viewport) {
    const ctx = canvas.getContext('2d', { alpha: false });
    const dpr = canvas.width / viewport.width;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    return {
        drawFrame(ball, leftPlayer, rightPlayer) {
            // Background
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, viewport.width, viewport.height);

            // Center divider
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.setLineDash([12, 12]);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(viewport.width / 2, 0);
            ctx.lineTo(viewport.width / 2, viewport.height);
            ctx.stroke();
            ctx.setLineDash([]);

            // Paddles
            ctx.fillStyle = 'white';
            ctx.fillRect(Math.round(leftPlayer.x), Math.round(leftPlayer.y), leftPlayer.width, leftPlayer.height);
            ctx.fillRect(Math.round(rightPlayer.x), Math.round(rightPlayer.y), rightPlayer.width, rightPlayer.height);

            // Ball — baseball
            const bx = Math.round(ball.x);
            const by = Math.round(ball.y);
            const r = ball.width / 2;
            const cx = bx + r;
            const cy = by + r;

            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();

            // Stitching
            const sw = Math.max(1, r * 0.18);
            ctx.strokeStyle = '#cc2222';
            ctx.lineWidth = sw;
            ctx.setLineDash([]);

            // Left stitch arc
            ctx.beginPath();
            ctx.arc(cx - r * 0.3, cy, r * 0.55, -Math.PI * 0.6, Math.PI * 0.6);
            ctx.stroke();

            // Right stitch arc
            ctx.beginPath();
            ctx.arc(cx + r * 0.3, cy, r * 0.55, Math.PI * 0.4, Math.PI * 1.6);
            ctx.stroke();
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
