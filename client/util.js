let bbIntersect = (where, box) => {
    let [x, y] = where
    let [bx, by, bw, bh] = box

    if (x > bx && x < (bx + bw) &&
        y > by && y < (by + bh)) return true

    return false
}

let random = (n) => {
    return ~~(Math.random() * n)
}

let randomSelect = (arr) => {
    return arr[random(arr.length)]
}

let shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = ~~(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

let addVector = (x, y) => {
    let [a, b] = x
    let [c, d] = y

    return [a + c, b + d]
}

export {
    bbIntersect, random, randomSelect, shuffleArray, addVector
}