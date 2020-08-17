import * as util from './util.js'

class Card {
    static validNumber = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]
    static validLetter = ["C", "D", "H", "S"]

    static aspect = 0.6543560606060606
    constructor(card) {
        this.card = card
        this.pos = [-1, -1]
        this.revealed = true
        this.size = 0
        this.hovered = false
        this.selected = false
    }

    boundingBox() {
        let [x, y] = this.pos
        return [x, y, this.size * Card.aspect, this.size]
    }

    splitCard() {
        let letterIdx = 1
        let number = this.card[0]
        if (this.card[0] == '0') {
            number = "10"
            letterIdx = 2
        }
        let letter = this.card[letterIdx]

        return [number, letter]
    }

    compare(other) {
        let [thisNumber, thisLetter] = this.splitCard()
        let [otherNumber, otherLetter] = other.splitCard()

        // if (Card.validLetter.indexOf(thisLetter) > Card.validLetter.indexOf(otherLetter)) {
        //     return 1
        // } else if (Card.validLetter.indexOf(thisLetter) < Card.validLetter.indexOf(otherLetter)) {
        //     return -1
        // }

        if (Card.validNumber.indexOf(thisNumber) > Card.validNumber.indexOf(otherNumber)) {
            return 1
        } else if (Card.validNumber.indexOf(thisNumber) < Card.validNumber.indexOf(otherNumber)) {
            return -1
        }

        return 0
    }
}

let deck = () => {
    let deck = []
    for (let n of Card.validNumber) {
        for (let l of Card.validLetter) {
            deck.push(new Card(`${n}${l}`))
        }
    }

    util.shuffleArray(deck)
    return deck
}

let completeDeck = deck()

let randomHand = () => {
    let hand = []
    while (hand.length < 8) {
        hand.push(util.random(completeDeck.length))
    }

    return hand
}


let getCard = (idx) => {
    return completeDeck[idx]
}

export {
    Card, randomHand, deck, completeDeck, getCard
}