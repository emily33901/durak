import { State } from './state.js'
import { Interaction } from './interaction.js'
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
    const canvasStyle = window.getComputedStyle(canvas)
    console.info(window.getComputedStyle(canvas).width)
    canvas.width = + canvasStyle.width.slice(0, canvasStyle.width.length - 2)
    canvas.height = + canvasStyle.height.slice(0, canvasStyle.height.length - 2)

    console.log(canvas.width, canvas.height)
    ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    Draw.ctx = ctx

    const interaction = new Interaction(canvas)
    const state = new State()
    state.setupHands(4)

    interaction.init(canvas)

    requestAnimationFrame(() => frame(state, interaction))
}

export { canvas }
