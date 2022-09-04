import * as util from './util.js'
import { Vector } from './util.js';



class Card {
    card: string[];
    pos: Vector;
    size: number;
    revealed: boolean;
    selected: boolean;
    hovered: boolean;
    interactable: boolean;

    static validNumber = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]
    static validLetter = ["C", "D", "H", "S"]

    static aspect = 0.6543560606060606
    constructor(cardNumber: string, cardLetter: string) {
        this.card = [cardNumber, cardLetter]
        this.pos = [-1, -1]
        this.size = 0
        this.revealed = true
        this.hovered = false
        this.selected = false
        this.interactable = true
    }

    number() {
        return this.card[0]
    }

    boundingBox() {
        let [x, y] = this.pos
        return [x, y, this.size * Card.aspect, this.size]
    }

    toString() {
        return `${this.card[0]}${this.card[1]}`
    }

    compare(other: Card) {
        let thisNumber = this.number()
        let otherNumber = other.number()

        if (Card.validNumber.indexOf(thisNumber) >
            Card.validNumber.indexOf(otherNumber)) {
            return 1
        } else if (Card.validNumber.indexOf(thisNumber) <
            Card.validNumber.indexOf(otherNumber)) {
            return -1
        }

        return 0
    }
}

const deck = () => {
    let deck = []
    for (let n of Card.validNumber) {
        for (let l of Card.validLetter) {
            deck.push(new Card(n, l))
        }
    }

    util.shuffleArray(deck)
    return deck
}

const completeDeck = deck()

const randomHand = () => {
    return [...Array(8).keys()]
}

const getCard = (idx: number) => {
    return completeDeck[idx]
}

export {
    Card, randomHand, deck, completeDeck, getCard
}
