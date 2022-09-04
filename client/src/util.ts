export class Vector {
    x: number
    y: number

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }

    add(other: Vector): Vector {
        const { x, y } = other
        const { x: x2, y: y2 } = this
        return new Vector(x + x2, y + y2)
    }

    intersects(box: Box): boolean {
        const { x, y } = this
        const [bx, by, bw, bh] = box

        if (x > bx && x < (bx + bw) &&
            y > by && y < (by + bh)) return true

        return false
    }

    inv() {
        return new Vector(-this.x, -this.y)
    }
}

// export type Vector = number[];
export type Box = number[];

const random = (n: number) => {
    return ~~(Math.random() * n)
}

function randomSelect<T>(arr: T[]): T {
    return arr[random(arr.length)]
}

function shuffleArray<T>(array: T[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = ~~(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]
    }
}

const assert = (expr: boolean, msg: string) => {
    if (!expr) {
        alert(msg + '\n' + '@ ' + (new Error).stack?.split('\n')[4])
    }
}

export {
    random, randomSelect, shuffleArray, assert
}
