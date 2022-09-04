import { Card, randomHand, completeDeck, getCard } from './card.js'
import { State } from './state.js'
import { DragDest, interaction } from './interaction.js'
import * as util from './util.js'
import { Vector } from './util.js'

let ctx: CanvasRenderingContext2D
let canvas: HTMLCanvasElement

const cardCache: Map<string, HTMLImageElement> = new Map()
const getCardImg = (name: string) => {
    let img = cardCache.get(name)

    if (typeof img == 'undefined') {
        img = new Image()
        img.src = `img/card/${name}.png`
        cardCache.set(name, img)
    }

    return img
}

const drawCard = (card: Card) => {
    let name = card.id()
    const where = card.pos
    const size = card.size
    const selected = card.selected
    const interactable = card.interactable

    if (!card.revealed) { name = 'back' }

    const img = getCardImg(name)

    const { x, y } = where

    ctx.drawImage(img, x, y, size * Card.aspect, size)

    if (selected) {
        ctx.filter = 'brightness(100%) sepia(100%) saturate(1000) hue-rotate(-60deg) opacity(70%)'
        ctx.drawImage(img, x, y, size * Card.aspect, size)
        ctx.filter = 'none'
    } else if (!interactable) {
        ctx.filter = 'brightness(0%) opacity(40%)'
        ctx.drawImage(img, x, y, size * Card.aspect, size)
        ctx.filter = 'none'
    }
}

const drawDestRegion = (dragdest: DragDest) => {
    // use a card as the baseline for the outline
    const img = getCardImg(cardCache.entries().next().value[0])

    const { x, y } = dragdest.where

    ctx.filter = 'brightness(0%) invert() sepia(100%) saturate(1000) hue-rotate(60deg) opacity(30%)'
    ctx.drawImage(img, x, y, dragdest.size * Card.aspect, dragdest.size)
    ctx.filter = 'none'
}

const arrangeHand = (hand: Card[], where: Vector, angle: number) => {
    const { x: startX, y: startY } = where

    const overlap = 60 * Card.aspect
    const len = hand.length

    for (const [i, card] of hand.entries()) {
        const pos = new Vector(startX + (i * overlap), startY)
        card.pos = pos
        card.size = 200
        card.revealed = true
        if (card.hovered) {
            card.pos.y -= 30
        }
    }
}

const drawCards = () => {
    for (const c of completeDeck) {
        if (c.revealed && hand.indexOf(c) == -1) {
            drawCard(c)
        }
    }

    for (const c of hand) {
        drawCard(c)
    }

    for (const r of interaction.destRegions) {
        drawDestRegion(r)
    }
}

let hand = randomHand()

const frame = () => {
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

    State.calcInteractable(hand)
    interaction.onframe(hand)
    drawCards()

    arrangeHand(hand, new Vector(10, 300), 0)

    requestAnimationFrame(frame)
}

const sortHand = () => {
    hand = hand.sort((a, b) => a.compare(b))
}

export function gameInit() {
    sortHand()

    // draw the hand in the correct order
    canvas = document.getElementById('canvas') as HTMLCanvasElement
    ctx = canvas.getContext('2d') as CanvasRenderingContext2D

    interaction.init()

    requestAnimationFrame(frame)
}

export { canvas }
