import { Card } from './card.js'
import * as util from './util.js'
import { Box, Vector } from './util.js'

const buttonMap = {
    mouse1: 0,
    mouse2: 2,
    mouse3: 4,
}

type DragDestAction = (cards: Card[]) => void;
type DragDestValid = (c: Card[]) => boolean;

class DragDest {
    where: Vector
    size: number
    angle: number
    valid: boolean

    action: DragDestAction
    calcValid: DragDestValid

    constructor(where: Vector, size: number, angle: number, action?: DragDestAction, valid?: DragDestValid) {
        this.where = where
        this.size = size
        this.angle = angle
        this.valid = false

        this.action = action ?? (() => undefined)

        // Assume that drag destinations are only valid if something has been dragged
        this.calcValid = (cards) => cards.length > 0 && valid ? valid(cards) : false
    }

    bb() {
        return [this.where.x, this.where.y, this.size, this.size * Card.aspect]
    }
}

class Interaction {
    canvas: HTMLCanvasElement
    mousePos: Vector
    mouseButtons: boolean[]
    didSelect: boolean
    draggedCards: Card[]
    dragging: boolean
    dragStart: Vector
    destRegions: DragDest[]

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas

        this.mousePos = new Vector(0, 0)
        this.mouseButtons = [false, false, false]
        this.didSelect = false

        this.draggedCards = []
        this.dragging = false
        this.dragStart = new Vector(0, 0)

        this.destRegions = []
    }

    onmousemove(ev: MouseEvent) {
        this.mousePos = new Vector(ev.pageX - this.canvas.offsetLeft, ev.pageY - this.canvas.offsetTop)
    }

    onmousedown(ev: MouseEvent) {
        if (ev.button == buttonMap.mouse1) {
            this.mouseButtons[0] = true
        }
        if (ev.button == buttonMap.mouse2) {
            this.mouseButtons[1] = true
            this.didSelect = false
        }
    }

    onmouseup(ev: MouseEvent) {
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

    onframe(deck: Card[]) {
        let didHover = false
        let hoveredCard = null

        // Reverse here becuase the hand is drawn backwards
        // (i.e. the furthest backest card is drawn first so that
        // the others are on top of it.) and we want user interaction
        // to be the other way around
        for (const c of deck) {
            if (this.draggedCards.includes(c)) {
                if (this.dragging) {
                    const oldPos = c.pos
                    // move the cards with the cursor
                    const delta = this.mousePos.add(this.dragStart.inv())
                    c.pos = c.pos.add(delta)

                    for (const r of this.destRegions) {
                        if (!this.mousePos.intersects(r.bb()) || !r.valid) continue
                        // If we are within the bounding box of a destination, then
                        // snap to that destination
                        const delta = r.where.add(this.dragStart.inv())
                        const delta2 = this.dragStart.add(oldPos.inv())
                        const fdelta = delta.add(delta2)
                        c.pos = oldPos.add(fdelta)
                    }
                }
            } else {
                c.selected = false
                c.hovered = false
                if (!didHover && c.interactable) {
                    if (this.mousePos.intersects(c.boundingBox())) {
                        didHover = true
                        c.hovered = true
                        hoveredCard = c
                    }
                }
            }
        }

        // If we click on a card and we are not already dragging,
        // then start dragging
        if (this.mouse1Down() && !this.dragging) {
            if (this.draggedCards.length == 0 && hoveredCard)
                this.draggedCards.push(hoveredCard)
            this.dragging = true
            this.dragStart = this.mousePos
        } else if (!this.mouse1Down() && this.dragging) {
            // if we are in a drag and we release mouse1 then stop

            // If we are intersecting a drag dest, then invoke its actions
            for (const r of this.destRegions) {
                if (!this.mousePos.intersects(r.bb()) || !r.valid) continue
                r.action(this.draggedCards)
            }

            this.dragging = false
            this.draggedCards = []
        }

        // If we press mouse2 on a card that we are not already selecting
        // then select it and add it to our dragged cards
        if (this.mouse2Down() &&
            hoveredCard &&
            !this.draggedCards.includes(hoveredCard) &&
            !this.didSelect) {
            this.draggedCards.push(hoveredCard)
            this.didSelect = true
        }

        // re-calculate whether drag dests are valid
        for (const r of this.destRegions) {
            r.valid = r.calcValid(this.draggedCards)
        }
    }

    setDestinationRegions(newRegions: DragDest[]) {
        this.destRegions = newRegions
    }

    init(canvas: HTMLCanvasElement) {
        this.canvas = canvas
        // set document events
        document.onmousemove = (ev) => this.onmousemove(ev)
        document.onmousedown = (ev) => this.onmousedown(ev)
        document.onmouseup = (ev) => this.onmouseup(ev)

        document.oncontextmenu = (ev) => { ev.preventDefault() }
    }
}

export { Interaction, DragDest }
