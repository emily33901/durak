export type Vector = number[];
export type Box = number[];

// intersect point and box
const bbIntersect = (where: Vector, box: Box) => {
    let [x, y] = where
    let [bx, by, bw, bh] = box

    if (x > bx && x < (bx + bw) &&
        y > by && y < (by + bh)) return true

    return false
}

const random = (n) => {
    return ~~(Math.random() * n)
}

const randomSelect = (arr) => {
    return arr[random(arr.length)]
}

const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = ~~(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

const addVector = (x, y) => {
    let [a, b] = x
    let [c, d] = y

    return [a + c, b + d]
}

const assert = (expr, msg) => {
    if (!expr) {
        alert(msg + "\n" + "@ " + (new Error).stack.split("\n")[4]);
    }
}

export {
    bbIntersect, random, randomSelect, shuffleArray, addVector, assert
}
