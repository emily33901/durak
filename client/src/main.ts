import { Card, randomHand, completeDeck, getCard } from './card.js'
import { GameState, State } from './state.js'
import { DragDest, Interaction } from './interaction.js'
import * as util from './util.js'
import { Vector } from './util.js'
import { Draw } from './draw.js'

let ctx: CanvasRenderingContext2D
let canvas: HTMLCanvasElement

const frame = (state: State, interaction: Interaction) => {
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

    state.draw(interaction)
    state.onframe(interaction)

    requestAnimationFrame(() => frame(state, interaction))
}

export function gameInit() {
    canvas = document.getElementById('canvas') as HTMLCanvasElement
    ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    Draw.ctx = ctx

    const interaction = new Interaction(canvas)
    const state = new State()
    state.setupHands(4)

    interaction.init(canvas)

    requestAnimationFrame(() => frame(state, interaction))
}

export { canvas }
