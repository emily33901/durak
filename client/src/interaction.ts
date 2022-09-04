import { Card, getCard } from './card.js'
import { canvas } from './main.js'
import * as util from './util.js'
import { Box, Vector } from './util.js'

const buttonMap = {
    mouse1: 0,
    mouse2: 2,
    mouse3: 4,
}

class DragDest {
    constructor(where, size, angle) {
        this.where = where
        this.size = size
        this.angle = angle
    }

    bb() {
        return [...this.where, this.size, this.size * Card.aspect]
    }
}

class Interaction {
    mousePos: Vector;
    mouseButtons: boolean[];
    didSelect: boolean;
    draggedCards: Card[];
    dragging: boolean;
    dragStart: Vector;
    destRegions: Box[]

    constructor() {
        this.mousePos = [0, 0]
        this.mouseButtons = [false, false, false]
        this.didSelect = false

        this.draggedCards = []
        this.dragging = false
        this.dragStart = [0, 0]

        this.destRegions = []
    }

    onmousemove(ev) {
        this.mousePos = [ev.pageX - canvas.offsetLeft, ev.pageY - canvas.offsetTop]
    }

    onmousedown(ev) {
        if (ev.button == buttonMap.mouse1) {
            this.mouseButtons[0] = true
        }
        if (ev.button == buttonMap.mouse2) {
            this.mouseButtons[1] = true
            this.didSelect = false
        }
    }

    onmouseup(ev) {
        if (ev.button == buttonMap.mouse1) {
            this.mouseButtons[0] = false
        }
        if (ev.button == buttonMap.mouse2) {
            this.mouseButtons[1] = false
            this.didSelect = false
        }
    }

    mouse1Down() { return this.mouseButtons[0] }
    mouse2Down() { return this.mouseButtons[1] }

    onframe(hand) {
        let didHover = false
        let hoveredCard = -1

        // Reverse here becuase the hand is drawn backwards
        // (i.e. the furthest backest card is drawn first so that
        // the others are on top of it.) and we want user interaction
        // to be the other way around
        for (let cid of [...hand].reverse()) {
            let c = getCard(cid)
            if (this.draggedCards.includes(cid)) {
                if (this.dragging) {
                    let oldPos = c.pos
                    // move the cards with the cursor
                    let delta = util.addVector(this.mousePos, [-this.dragStart[0], -this.dragStart[1]])
                    c.pos = util.addVector(c.pos, delta)

                    for (let r of this.destRegions) {
                        if (!util.bbIntersect(this.mousePos, r.bb())) continue;
                        // If we are within the bounding box of a destination, then
                        // snap to that destination
                        let delta = util.addVector(r.where, [-this.dragStart[0], -this.dragStart[1]])
                        let delta2 = util.addVector(this.dragStart, [-oldPos[0], -oldPos[1]])
                        let fdelta = util.addVector(delta, delta2)
                        c.pos = util.addVector(oldPos, fdelta)
                    }
                }
            } else {
                c.selected = false
                c.hovered = false
                if (!didHover && c.interactable) {
                    if (util.bbIntersect(this.mousePos, c.boundingBox())) {
                        didHover = true
                        c.hovered = true
                        hoveredCard = cid
                    }
                }
            }
        }

        // If we click on a card and we are not already dragging,
        // then start dragging
        if (this.mouse1Down() && !this.dragging) {
            if (this.draggedCards.length == 0 && hoveredCard != -1)
                this.draggedCards.push(hoveredCard)
            this.dragging = true
            this.dragStart = this.mousePos
        } else if (!this.mouse1Down() && this.dragging) {
            // if we are in a drag and we release mouse1 then stop
            this.dragging = false
            this.draggedCards = []
        }

        // If we press mouse2 on a card that we are not already selecting
        // then select it and add it to our dragged cards
        if (this.mouse2Down() &&
            !this.draggedCards.includes(hoveredCard) &&
            hoveredCard != -1 &&
            !this.didSelect) {
            this.draggedCards.push(hoveredCard)
            this.didSelect = true
        }
    }

    setDestinationRegions(newRegions) {
        this.destRegions = newRegions
    }
}

const interaction = new Interaction()

// set document events
document.onmousemove = (ev) => interaction.onmousemove(ev)
document.onmousedown = (ev) => interaction.onmousedown(ev)
document.onmouseup = (ev) => interaction.onmouseup(ev)

document.oncontextmenu = (ev) => { ev.preventDefault() }

export { interaction, DragDest }
