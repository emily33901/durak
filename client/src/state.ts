/* eslint-disable indent */
import { Card, deck } from './card.js'
import { Draw } from './draw.js'
import { DragDest, Interaction } from './interaction.js'
import { Vector } from './util.js'

export enum GameState {
    // if you are being attacked then you can pass on
    // pick up or defend
    'attacked',
    // if you are attacking then you can play any cards of the same number
    'attacking',
    // if you are defending then you can play any cards that are higher on
    // top of the cards you have been attacked with
    'defending',
    // someone else is being attacked - you can play cards of the same number
    // as they have played
    'otherAttack',
}

export class State {
    readonly State = GameState

    state = this.State.attacking

    cardsInPlay: Card[] = []
    drawPile: Card[] = []
    hands: Card[][] = []
    activePlayer = 0

    constructor() {
        this.drawPile = deck()
    }

    setupHands(playerCount: number) {
        // Give cards to each player from the draw pile
        const maxCards = Math.min(Math.floor(this.drawPile.length / playerCount), 6)
        console.log('max ', maxCards)
        this.hands = [...new Array(playerCount).keys()].map(_ => [...new Array(maxCards)].map(_ => this.drawPile.pop() as Card))

        this.disableCards()
    }

    sortHands() {
        for (const [i, hand] of this.hands.entries()) {
            this.hands[i] = hand.sort((a, b) => a.compare(b))
        }

        this.cardsInPlay.sort((a, b) => a.compare(b))
    }

    arrangeHand(hand: Card[], where: Vector, angle: number, overlap?: number) {
        overlap = overlap ?? 60 * Card.aspect
        const len = hand.length

        for (const [i, card] of hand.entries()) {
            const pos = new Vector(where.x + (i * overlap), where.y)
            card.pos = pos
            card.size = 200
            card.revealed = true
            if (card.hovered) {
                card.pos.y -= 30
            }
        }
    }

    arrangeHands() {
        const step = (2 * Math.PI) / this.hands.length
        for (const [i, hand] of this.hands.entries()) {
            const pos = new Vector(400 + 400 * Math.cos(i * step), 400 + 300 * Math.sin(i * step))
            this.arrangeHand(hand, pos, 0)
        }

        // Arrange cards in play in the centre
        const pos = new Vector(500, 500)
        this.arrangeHand(this.cardsInPlay, pos, 0, 100)
    }

    // Hand of the current player
    activeHand() {
        return this.hands[this.activePlayer]
    }

    updateActiveHand(f: (h: Card[]) => Card[]) {
        this.hands[this.activePlayer] = f(this.activeHand())
    }

    // Move cards from the active hand into play
    moveToInPlay(f: (c: Card) => boolean) {
        console.info(this.cardsInPlay, this.activeHand())
        this.cardsInPlay.push(...this.activeHand().filter(f))
        this.updateActiveHand(h => h.filter(c => !f(c)))
        console.info(this.cardsInPlay, this.activeHand())
    }

    updateHand(player: number, newHand: Card[]) {
        this.hands[player] = newHand
    }

    draw(interaction: Interaction) {
        // Draw state
        Draw.text(`${GameState[this.state]}`, new Vector(600, 40))

        // Draw the cards in play so that they are below peoples hands
        for (const c of this.cardsInPlay) {
            Draw.card(c)
        }

        // Draw hands
        for (const c of this.hands.flat()) {
            Draw.card(c)
        }

        // Draw dest regions
        for (const r of interaction.destRegions) {
            Draw.destRegion(r)
        }


        // Draw other cards if they have been revealed
        // for (const c of completeDeck) {
        //     if (c.revealed) {
        //         drawCard(c)
        //     }
        // }
    }

    disableCards() {
        for (const c of this.hands.flat()) {
            c.interactable = false
        }

        for (const c of this.cardsInPlay) {
            c.interactable = false
        }
    }

    changeState(interaction: Interaction, newState: GameState) {
        // Reset all cards and all state to not interactable
        // remove all drag dests

        // this.state = newState

        interaction.setDestinationRegions([])
        this.disableCards()
    }

    onframe(interaction: Interaction) {
        const selectedCards = interaction.draggedCards

        this.sortHands()
        this.arrangeHands()

        interaction.onframe(this.activeHand())

        // TODO: calc for cards on table

        switch (this.state) {
            case this.State.attacking: {
                interaction.setDestinationRegions(
                    [
                        new DragDest(
                            new Vector(600, 300), 200, 0,
                            (cards) => {
                                // Dragged cards, move to attacked phase,
                                this.changeState(interaction, this.State.attacked)


                                console.log('cards is ', cards)

                                // remove cards from hand that were dragged in
                                // keep everything that isnt in cards
                                this.moveToInPlay((c) => cards.indexOf(c) != -1)

                                this.activePlayer = (this.activePlayer + 1) % this.hands.length
                            }
                        )
                    ]
                )

                if (selectedCards.length == 0) {
                    // any cards here are selectable
                    this.updateActiveHand(h => h.map(x => { x.interactable = true; return x }))
                    break
                }

                // look at the first card for what number they selected
                // and calculate for the rest of the cards
                const firstCard = selectedCards[0]
                for (const c of this.activeHand()) {
                    if (c.number() != firstCard.number()) {
                        c.interactable = false
                    }
                }
                break
            }
            case this.State.attacked: {
                break
            }
        }
    }
}
