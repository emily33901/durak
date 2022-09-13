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
    // Which cards in play are being played on which cards (if any)
    defence: Map<Card, Card> = new Map()
    drawPile: Card[] = []
    discardPile: Card[] = []
    hands: Card[][] = []
    deck: Card[] = []
    activePlayer = 0
    maxCardsInHand = 0
    recalcDestRegions = false

    constructor() {
        this.deck = deck()
        this.drawPile = [...this.deck]
    }

    setupHands(playerCount: number) {
        // Give cards to each player from the draw pile
        this.maxCardsInHand = Math.min(Math.floor(this.drawPile.length / playerCount), 6)
        console.log('max ', this.maxCardsInHand)
        this.hands = [...new Array(playerCount).keys()].map(
            () => [...new Array(this.maxCardsInHand)].map(
                () => this.drawPile.pop() as Card))

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

    arrangeCards() {
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
            this.arrangeHand(this.cardsInPlay.filter(c => [...this.defence.values()].indexOf(c) == -1), new Vector(500, 300), 0, 200)

            // Then arrange defence cards on top of the card that they were played on
            for (const [k, v] of this.defence) {
                v.pos = k.pos.add(new Vector(0, -50))
            }
        }
        {
            // Arrange draw pile in corner
            this.arrangeHand(this.drawPile, new Vector(0, 0), 0, 1)
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
        this.recalcDestRegions = true

        interaction.setDestinationRegions([])
        this.disableCards()
    }

    // Move the active player to the next player
    nextPlayer() {
        this.activePlayer = (this.activePlayer + 1) % this.hands.length
    }

    onframe(interaction: Interaction) {
        const selectedCards = interaction.draggedCards

        this.arrangeCards()
        this.sortHands()

        interaction.onframe(this.deck)

        // Slight hack for the fact that interaction calls dragdest callbacks
        // which might move cards into play, when that happens we want to 
        // rearrange the cards so that the new dragdests are in the correct places
        if (this.recalcDestRegions) {
            this.arrangeCards()
            this.sortHands()
        }

        // TODO: calc for cards on table

        switch (this.state) {
            case this.State.started: {
                this.changeState(interaction, this.State.attacking)
                break
            }
            case this.State.attacking: {
                if (this.recalcDestRegions) {
                    interaction.setDestinationRegions(
                        [
                            new DragDest(
                                new Vector(600, 300), 200, 0,
                                (cards) => {
                                    console.log('cards is ', cards)

                                    // remove cards from hand that were dragged in
                                    // keep everything that isnt in cards
                                    this.moveToInPlay((c) => cards.indexOf(c) != -1)
                                    this.nextPlayer()

                                    // move to attacked phase,
                                    this.changeState(interaction, this.State.attacked)
                                },
                                (cards) => true
                            )
                        ]
                    )
                    this.recalcDestRegions = false
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
                if (this.recalcDestRegions) {
                    // All cards that are in play become destination regions
                    const destRegions = this.cardsInPlay
                        .filter(c => !(this.defence.has(c) || [...this.defence.values()].indexOf(c) != -1))
                        .map(c => new DragDest(
                            c.pos.add(new Vector(0, -20)),
                            Card.defaultSize, 0,
                            (cards) => {
                                // A card was dragged onto this region
                                // for now we assume there is only one card, as the region
                                // would not be valid for more than one, (see below)
                                console.assert(cards.length == 1)
                                // Move this card from hand to in play
                                this.moveToInPlay((inHand) => inHand == cards[0])
                                //  Now put this card in defense against c
                                this.defence.set(c, cards[0])

                                this.recalcDestRegions = true
                            },
                            (cards) => {
                                // TODO: temporarily only allow one card
                                if (cards.length != 1) return false

                                // if this card has already been defended against then it cannot be valid
                                if (this.defence.get(c)) return false

                                // Make sure that this card is from the hand and not from the table
                                for (const c of cards) {
                                    if (this.cardsInPlay.indexOf(c) != -1) return false
                                }
                                // Cards must be the same suit or higher as something that is in play
                                const [_, l] = c.card
                                for (const card of cards) {
                                    // if the suit matches and the number is higher,
                                    // then this drag is okay
                                    if (l == card.card[1] && card.compare(c) > 0) {
                                        return true
                                    }
                                }
                                // Otherwise this is a valid destination
                                return false
                            }
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
                            this.defence.clear()

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

                    this.recalcDestRegions = false
                }

                // Cards on the table need to be interactable so that they can be dragged
                // back into the active players hand
                for (const c of this.cardsInPlay) {
                    c.interactable = true
                }

                if (selectedCards.length == 0) {
                    // any cards that match a suit on the table and are higher in number are selectable
                    this.updateActiveHand(h => {
                        for (const inPlay of this.cardsInPlay) {
                            const [_, l] = inPlay.card
                            for (const card of h) {
                                if (l == card.card[1] && card.compare(inPlay) > 0) {
                                    card.interactable = true
                                }
                            }
                        }

                        return h
                    })
                }

                break
            }
        }
    }

    // End the round, pulls cards from the draw pile in play order
    endRound() {
        console.assert(this.defence.size == 0)

        const hands = [...this.hands]
        // Shuffle hands into correct order for draw
        for (let i = 0; i < this.activePlayer; i++) {
            hands.push(hands.shift() as Card[])
        }

        for (const h of hands) {
            for (; h.length < this.maxCardsInHand && this.drawPile.length > 0;) {
                h.push(this.drawPile.pop() as Card)
            }
        }

        // Make sure that any new cards are not interactable either
        this.disableCards()
    }
}
