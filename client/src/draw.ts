import { Card } from './card'
import { DragDest } from './interaction'
import { Vector } from './util'

type DrawCtx = CanvasRenderingContext2D

export class Draw {
    static ctx: DrawCtx

    static cardCache: Map<string, HTMLImageElement> = new Map()
    static getCardImg(name: string) {
        let img = this.cardCache.get(name)

        if (typeof img == 'undefined') {
            img = new Image()
            img.src = `img/card/${name}.png`
            this.cardCache.set(name, img)
        }

        return img
    }

    static card(card: Card) {
        let name = card.id()
        const where = card.pos
        const size = card.size
        const selected = card.selected
        const interactable = card.interactable

        if (!card.revealed) { name = 'back' }

        const img = this.getCardImg(name)

        const { x, y } = where

        this.ctx.drawImage(img, x, y, size * Card.aspect, size)

        if (selected) {
            this.ctx.filter = 'brightness(100%) sepia(100%) saturate(1000) hue-rotate(-60deg) opacity(70%)'
            this.ctx.drawImage(img, x, y, size * Card.aspect, size)
            this.ctx.filter = 'none'
        } else if (!interactable) {
            this.ctx.filter = 'brightness(0%) opacity(40%)'
            this.ctx.drawImage(img, x, y, size * Card.aspect, size)
            this.ctx.filter = 'none'
        }
    }


    static destRegion(dragdest: DragDest) {
        // use a card as the baseline for the outline
        const img = this.getCardImg(this.cardCache.entries().next().value[0])

        const { x, y } = dragdest.where

        this.ctx.filter = 'brightness(0%) invert() sepia(100%) saturate(1000) hue-rotate(60deg) opacity(30%)'
        this.ctx.drawImage(img, x, y, dragdest.size * Card.aspect, dragdest.size)
        this.ctx.filter = 'none'
    }


    static text(text: string, where: Vector) {
        this.ctx.font = '48px serif'
        this.ctx.fillStyle = 'white'
        this.ctx.fillText(`${text}`, where.x, where.y)
    }
}



// export const drawCards = () => {
//     for (const c of completeDeck) {
//         if (c.revealed && hand.indexOf(c) == -1) {
//             drawCard(c)
//         }
//     }

//     for (const c of hand) {
//         drawCard(c)
//     }

//     for (const r of interaction.destRegions) {
//         drawDestRegion(r)
//     }
// }
