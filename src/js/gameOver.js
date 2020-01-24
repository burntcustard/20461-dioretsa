import { renderText } from './text';

/**
 * Render an end-game type screen. This isn't _quite_ a scene, because
 * it's displayed over the top of the game scene.
 * @param  {[type]} game [description]
 * @return {[type]}      [description]
 */
export function render(game) {
    // Padding around set of 4 cards. Odd magic number but it compresses well
    var pad = game.size * game.size * game.size * game.size * 32;
    var margin = 7; // Padding in game units between each card
    var contWidth = game.width - pad * 2; // Card container width
    var y = pad + margin;
    var cardWidth = contWidth / game.players.length - margin * 2;
    var cardHeight = game.height - (pad + margin) * 2;

    if (game.players.length > 2) {
        cardHeight = cardHeight / 2 - margin;
        cardWidth = contWidth / (Math.round(game.players.length / 2)) - margin * 2;
    }

    game.players.forEach((player, i) => {

        if (game.players.length > 2) {
            var x = pad + (cardWidth + margin * 2) * i + margin * 2;
            if (i >= game.players.length / 2) {
                y = pad + margin * 3 + cardHeight;
                x -= contWidth;
            }
        } else {
            var x = pad + (cardWidth + margin * 2) * i + margin;
        }

        game.ctx.save();
        game.ctx.scale(game.scale, game.scale);
        game.ctx.clearRect(
            x,
            y,
            cardWidth,
            cardHeight,
        );
        game.ctx.strokeStyle = player.color;
        game.ctx.strokeRect(
            x,
            y,
            cardWidth,
            cardHeight
        )
        game.ctx.restore();

        if (player.place === 0) {
            renderText({
                text: 'winner!',
                color: player.color,
                x: x + margin,
                y: y + margin + 1,
                size: 1.35 * game.size,
                scale: game.scale,
                ctx: game.ctx
            });
            game.ctx.save();
            game.ctx.scale(game.scale, game.scale);
            game.ctx.strokeStyle = player.color;
            game.ctx.strokeRect(
                x - 6,
                y - 6,
                cardWidth + 12,
                cardHeight + 12
            )
            game.ctx.strokeRect(
                x - 3,
                y - 3,
                cardWidth + 6,
                cardHeight + 6
            )
            game.ctx.restore();
        } else {
            renderText({
                text: player.place + 1,
                color: player.color,
                x: x + margin,
                y: y + margin + 1,
                size: 1.3 * game.size,
                scale: game.scale,
                ctx: game.ctx
            });
            if (player.place === 1) {
                renderText({
                    text: 'nd',
                    color: player.color,
                    x: x + margin + 17 * game.size,
                    y: y + margin + 12 * game.size,
                    size: .5,
                    scale: game.scale,
                    ctx: game.ctx
                });
            } else if (player.place === 2) {
                renderText({
                    text: 'rd',
                    color: player.color,
                    x: x + margin + 17 * game.size,
                    y: y + margin + 11 * game.size, // 'rd' is a bit wonky
                    size: .5,
                    scale: game.scale,
                    ctx: game.ctx
                });
            } else {
                renderText({
                    text: 'th',
                    color: player.color,
                    x: x + margin + 17 * game.size, // 'th' is a bit wonky too
                    y: y + margin + 12 * game.size,
                    size: .5,
                    scale: game.scale,
                    ctx: game.ctx
                });
            }
        }

        renderText({
            text: 'player ' + (i + 1),
            color: player.color,
            size: .8,
            x: x + margin,
            y: y + 40,
            scale: game.scale,
            ctx: game.ctx
        });

        renderText({
            text: 'score',
            color: player.color,
            size: .5,
            x: x + margin,
            y: y + 65,
            scale: game.scale,
            ctx: game.ctx
        });

        renderText({
            text: player.score,
            color: player.color,
            size: .6,
            alignRight: true,
            x: x + cardWidth - margin,
            y: y + 65,
            scale: game.scale,
            ctx: game.ctx
        });

        renderText({
            text: 'deaths',
            color: player.color,
            size: .5,
            x: x + margin,
            y: y + 80,
            scale: game.scale,
            ctx: game.ctx
        });

        renderText({
            text: player.deaths,
            color: player.color,
            size: .6,
            alignRight: true,
            x: x + cardWidth - margin,
            y: y + 80,
            scale: game.scale,
            ctx: game.ctx
        });

        renderText({
            text: 'accuracy' ,
            color: player.color,
            size: .5,
            x: x + margin,
            y: y + 95,
            scale: game.scale,
            ctx: game.ctx
        });

        renderText({
            text: ((player.shotsFired && player.shotsLanded) ? Math.round(100 / player.shotsFired * player.shotsLanded) : 0) + '%',
            color: player.color,
            size: .6,
            alignRight: true,
            x: x + cardWidth - margin,
            y: y + 95,
            scale: game.scale,
            ctx: game.ctx
        });

        renderText({
            text: 'crashes' ,
            color: player.color,
            size: .5,
            x: x + margin,
            y: y + 110,
            scale: game.scale,
            ctx: game.ctx
        });

        renderText({
            text: player.crashes,
            color: player.color,
            size: .6,
            alignRight: true,
            x: x + cardWidth - margin,
            y: y + 110,
            scale: game.scale,
            ctx: game.ctx
        });

        renderText({
            text: player.ready ? 'next>' : 'ready!',
            color: player.color,
            size: 1.2 * game.size,
            alignRight: true,
            alignBottom: true,
            x: x + cardWidth - margin,
            y: y + cardHeight - margin,
            scale: game.scale,
            ctx: game.ctx
        });

    });
}
