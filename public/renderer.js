// Canvas rendering module — all drawing is isolated here.

export function createRenderer(canvas, viewport) {
    const ctx = canvas.getContext('2d', { alpha: false });

    return {
        drawFrame(ball, leftPlayer, rightPlayer) {
            const dpr = canvas.width / viewport.width;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

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

            // Game objects
            ctx.fillStyle = 'white';
            ctx.fillRect(Math.round(ball.x), Math.round(ball.y), ball.width, ball.height);
            ctx.fillRect(Math.round(leftPlayer.x), Math.round(leftPlayer.y), leftPlayer.width, leftPlayer.height);
            ctx.fillRect(Math.round(rightPlayer.x), Math.round(rightPlayer.y), rightPlayer.width, rightPlayer.height);
        },

        drawPrompt(text, subtitle = null) {
            const dpr = canvas.width / viewport.width;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

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
