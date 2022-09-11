/* eslint-disable indent */
import { Card, deck } from './card.js'
import { Draw } from './draw.js'
import { DragDest, Interaction } from './interaction.js'
import { Vector } from './util.js'

export enum GameState {
    'started',
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

    state = this.State.started

    cardsInPlay: Card[] = []
    drawPile: Card[] = []
    hands: Card[][] = []
    deck: Card[] = []
    activePlayer = 0
    maxCardsInHand = 0
    didChangeState = false

    constructor() {
        this.deck = deck()
        this.drawPile = [...this.deck]
    }

    setupHands(playerCount: number) {
        // Give cards to each player from the draw pile
        this.maxCardsInHand = Math.min(Math.floor(this.drawPile.length / playerCount), 6)
        console.log('max ', this.maxCardsInHand)
        this.hands = [...new Array(playerCount).keys()].map(_ => [...new Array(this.maxCardsInHand)].map(_ => this.drawPile.pop() as Card))

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
            card.size = Card.defaultSize
            card.revealed = true
            if (card.hovered) {
                card.pos.y -= 30
            }
        }
    }

    arrageCards() {
        const step = (2 * Math.PI) / this.hands.length
        const offset = Math.floor(this.hands.length / 2)
        const where = new Vector(700, 300)
        for (const [i, hand] of this.hands.entries()) {
            const sin = Math.sin((i + offset) * step)
            const cos = Math.cos((i + offset) * step)
            const pos = new Vector(where.x + where.x * cos, where.y + where.y * sin)
            this.arrangeHand(hand, pos, 0)
        }
        {
            // Arrange cards in play in the centre
            this.arrangeHand(this.cardsInPlay, new Vector(500, 500), 0, 100)
        }
        {
            // Arrange draw pile in centre
            this.arrangeHand(this.drawPile, new Vector(400, 500), 0, 1)
        }

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

        for (const c of this.drawPile) {
            Draw.card(c)
        }

        // Draw other cards if they have been revealed
        // for (const c of completeDeck) {
        //     if (c.revealed) {
        //         drawCard(c)
        //     }
        // }

        // Draw state
        Draw.text(`${GameState[this.state]}`, new Vector(600, 40))
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

        this.state = newState
        this.didChangeState = true

        interaction.setDestinationRegions([])
        this.disableCards()
    }

    // Move the active player to the next player
    nextPlayer() {
        this.activePlayer = (this.activePlayer + 1) % this.hands.length
    }

    onframe(interaction: Interaction) {
        const selectedCards = interaction.draggedCards

        this.sortHands()
        this.arrageCards()

        interaction.onframe(this.deck)

        // TODO: calc for cards on table

        switch (this.state) {
            case this.State.started: {
                this.changeState(interaction, this.State.attacking)
                break
            }
            case this.State.attacking: {
                if (this.didChangeState) {
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
                                    this.nextPlayer()
                                },
                                () => true
                            )
                        ]
                    )
                    this.didChangeState = false
                }

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
                if (this.didChangeState) {
                    // All cards that are in play become destination regions
                    const destRegions = this.cardsInPlay.map(c => new DragDest(
                        c.pos.add(new Vector(0, -20)),
                        Card.defaultSize, 0
                    ))

                    // Add a drag region for dragging in play cards back to hand
                    // to signal pick up and end of turn
                    destRegions.push(new DragDest(
                        this.activeHand()[0].pos, Card.defaultSize, 0,
                        () => {
                            // We sort of dont really care about
                            // what card(s) were dragged here, whatever was in play needs to go to
                            // the active players hand as they picked up, then move to next player
                            this.updateActiveHand((h) => { h.push(...this.cardsInPlay); return h })
                            this.cardsInPlay = []

                            this.changeState(interaction, this.State.attacking)
                            this.endRound()
                            this.nextPlayer()
                        },
                        (cards) => {
                            for (const c of cards) {
                                if (this.cardsInPlay.indexOf(c) == -1) return false
                            }
                            return true
                        }
                    ))
                    interaction.setDestinationRegions(destRegions)

                    this.didChangeState = false
                }

                // Cards on the table need to be interactable so that they can be dragged
                // back into the active players hand
                for (const c of this.cardsInPlay) {
                    c.interactable = true
                }

                if (selectedCards.length == 0) {
                    // any cards that match a suit on the table and are higher are selectable
                    this.updateActiveHand(h => h.map(x => { x.interactable = true; return x }))
                }

                break
            }
        }
    }

    // End the round, pulls cards from the draw pile in play order
    endRound() {
        const hands = [...this.hands]
        // Shuffle hands into correct order for draw
        for (let i = 0; i < this.activePlayer; i++) {
            hands.push(hands.shift() as Card[])
        }

        for (const h of hands) {
            if (h.length < this.maxCardsInHand && this.drawPile.length > 0) {
                h.push(this.drawPile.pop() as Card)
            }
        }

        // Make sure that any new cards are not interactable either
        this.disableCards()
    }
}
