import { Card, randomHand, completeDeck, getCard } from './card.js'
import * as util from './util.js'

let ctx = null
let canvas = null

let cardCache = {}
let drawCard = (card) => {
    let name = card.card
    let where = card.pos
    let size = card.size
    let selected = card.selected

    let img = cardCache[name]

    if (typeof img == "undefined") {
        img = new Image()
        img.src = `img/card/${name}.png`
        cardCache[name] = img
    }

    let [x, y] = where

    ctx.drawImage(img, x, y, size * Card.aspect, size)

    if (selected) {
        ctx.filter = "brightness(10%) sepia(70%) saturate(10)  hue-rotate(80deg) opacity(30%)"
        ctx.drawImage(img, x, y, size * Card.aspect, size)
        ctx.filter = "none"
    }
}

let arrangeHand = (hand, where, angle) => {
    let [startX, startY] = where

    const overlap = 60 * Card.aspect
    const len = hand.length

    for (let i = 0; i < len; i++) {
        let card = getCard(hand[i])
        const pos = [startX + (i * overlap), startY]
        card.pos = pos
        card.size = 200
        card.revealed = true
        if (card.hovered) {
            card.pos[1] -= 30
        }
    }
}

let once = true;

let drawCards = () => {
    for (let c of completeDeck) {
        if (c.revealed && hand.indexOf(c) == -1) {
            drawCard(c)
        }
    }

    if (once) {
        once = false
        console.log(hand)
    }

    for (let c of hand) {
        drawCard(getCard(c))
    }
}

const buttonMap = {
    mouse1: 0,
    mouse2: 2,
    mouse3: 4,
}

let mousePos = [0, 0]
document.onmousemove = (ev) => {
    mousePos = [ev.pageX - canvas.offsetLeft, ev.pageY - canvas.offsetTop]
}

let mouseDown = false
let mouse2Down = false
let didSelect = false
document.onmousedown = (ev) => {
    console.log(ev)
    if (ev.button == buttonMap.mouse1) {
        mouseDown = true
    }
    if (ev.button == buttonMap.mouse2) {
        mouse2Down = true
        didSelect = false
    }
}

document.onmouseup = (ev) => {
    console.log(ev)
    if (ev.button == buttonMap.mouse1) {
        mouseDown = false
    }
    if (ev.button == buttonMap.mouse2) {
        mouse2Down = false
        didSelect = false
    }
}

document.oncontextmenu = (ev) => {
    ev.preventDefault()
}

let draggedCards = []
let dragging = false
let dragStart = [0, 0]

let userInteraction = (hand) => {
    let didHover = false
    let hoveredCard = -1

    for (let cid of [...hand].reverse()) {
        let c = getCard(cid)
        if (draggedCards.includes(cid)) {
            c.selected = false
            if (dragging) {
                let delta = util.addVector(mousePos, [-dragStart[0], -dragStart[1]])
                c.pos = util.addVector(c.pos, delta)
            } else {
                c.selected = true
            }
            continue
        } else {
            c.hovered = false
            if (!didHover) {
                if (util.bbIntersect(mousePos, c.boundingBox())) {
                    didHover = true
                    c.hovered = true
                    hoveredCard = cid
                }
            }
        }
    }

    if (mouseDown == true && !dragging) {
        if (draggedCards.length == 0 && hoveredCard != -1)
            draggedCards.push(hoveredCard)
        dragging = true
        dragStart = mousePos
    }

    if (mouse2Down && !draggedCards.includes(hoveredCard) && hoveredCard != -1 && !didSelect) {
        draggedCards.push(hoveredCard)
        didSelect = true
    }

    if (!mouseDown && dragging) {
        dragging = false
        draggedCards = []
    }
}

let hand = randomHand()

let frame = () => {
    ctx.clearRect(0, 0, 1000000, 1000000)

    userInteraction(hand)
    drawCards()

    arrangeHand(hand, [10, 300], 0)

    requestAnimationFrame(frame)
}

window.s.sortHand = () => {
    hand = hand.sort((a, b) => getCard(a).compare(getCard(b)))
}

window.s.gameInit = () => {
    window.s.sortHand()

    // draw the hand in the correct order
    canvas = document.getElementById("canvas")
    ctx = canvas.getContext("2d")
    requestAnimationFrame(frame)
}