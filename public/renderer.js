// Canvas rendering module — all drawing is isolated here.

export function createRenderer(canvas) {
    const ctx = canvas.getContext('2d');

    return {
        drawFrame(ball, leftPlayer, rightPlayer) {
            // Background
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Center divider
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.setLineDash([12, 12]);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2, 0);
            ctx.lineTo(canvas.width / 2, canvas.height);
            ctx.stroke();
            ctx.setLineDash([]);

            // Game objects
            ctx.fillStyle = 'white';
            ctx.fillRect(ball.x, ball.y, ball.width, ball.height);
            ctx.fillRect(leftPlayer.x, leftPlayer.y, leftPlayer.width, leftPlayer.height);
            ctx.fillRect(rightPlayer.x, rightPlayer.y, rightPlayer.width, rightPlayer.height);
        },

        drawPrompt(text, subtitle = null) {
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            const fontSize = Math.max(20, Math.round(canvas.height * 0.06));
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = `${fontSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, canvas.width / 2, canvas.height / 2);
            if (subtitle) {
                const subFontSize = Math.max(12, Math.round(canvas.height * 0.035));
                ctx.font = `${subFontSize}px sans-serif`;
                ctx.fillStyle = 'rgba(255,255,255,0.35)';
                ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + fontSize * 1.4);
            }
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
        },
    };
}
