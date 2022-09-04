import { Card, randomHand, completeDeck, getCard } from './card.js'
import { State } from './state.js'
import { interaction } from './interaction.js'
import * as util from './util.js'

let ctx = null
let canvas = null

let cardCache = {}
const getCardImg = (name) => {
    let img = cardCache[name]

    if (typeof img == "undefined") {
        img = new Image()
        img.src = `img/card/${name}.png`
        cardCache[name] = img
    }

    return img
}

const drawCard = (card) => {
    const name = card.toString()
    const where = card.pos
    const size = card.size
    const selected = card.selected
    const interactable = card.interactable

    if (!card.revealed) { name = 'back' }

    const img = getCardImg(name)

    const [x, y] = where

    ctx.drawImage(img, x, y, size * Card.aspect, size)

    if (selected) {
        ctx.filter = "brightness(100%) sepia(100%) saturate(1000) hue-rotate(-60deg) opacity(70%)"
        ctx.drawImage(img, x, y, size * Card.aspect, size)
        ctx.filter = "none"
    } else if (!interactable) {
        ctx.filter = "brightness(0%) opacity(40%)"
        ctx.drawImage(img, x, y, size * Card.aspect, size)
        ctx.filter = "none"
    }
}

const drawDestRegion = (dragdest) => {
    // use a card as the baseline for the outline
    const img = cardCache[Object.keys(cardCache)[0]]

    const [x, y] = dragdest.where

    ctx.filter = "brightness(0%) invert() sepia(100%) saturate(1000) hue-rotate(60deg) opacity(30%)"
    ctx.drawImage(img, x, y, dragdest.size * Card.aspect, dragdest.size)
    ctx.filter = "none"
}

const arrangeHand = (hand, where, angle) => {
    const [startX, startY] = where

    const overlap = 60 * Card.aspect
    const len = hand.length

    for (const i = 0; i < len; i++) {
        const card = getCard(hand[i])
        const pos = [startX + (i * overlap), startY]
        card.pos = pos
        card.size = 200
        card.revealed = true
        if (card.hovered) {
            card.pos[1] -= 30
        }
    }
}

let drawCards = () => {
    for (const c of completeDeck) {
        if (c.revealed && hand.indexOf(c) == -1) {
            drawCard(c)
        }
    }

    for (const c of hand) {
        drawCard(getCard(c))
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

    arrangeHand(hand, [10, 300], 0)

    requestAnimationFrame(frame)
}

const sortHand = () => {
    hand = hand.sort((a, b) => getCard(a).compare(getCard(b)))
}

window.s.gameInit = () => {
    sortHand()

    // draw the hand in the correct order
    canvas = document.getElementById("canvas")
    ctx = canvas.getContext("2d")
    requestAnimationFrame(frame)
}

export { canvas }
