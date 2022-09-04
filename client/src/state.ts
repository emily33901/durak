import { Card, getCard } from './card.js'
import { interaction, DragDest } from './interaction.js'
import { Vector } from './util.js'

enum GameState {
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


class State {
    static readonly State = GameState

    static state = State.State.attacking

    static calcInteractable(hand: Card[]) {
        const selectedCards = interaction.draggedCards

        // TODO: calc for cards on table

        switch (State.state) {
            case State.State.attacking: {
                if (selectedCards.length == 0) {
                    // any cards here are selectable
                    hand.map(x => x.interactable = true)
                    break
                }
                // look at the first card for what number they selected
                // and calculate for the rest of the cards
                const firstCard = selectedCards[0]
                for (const c of hand) {
                    if (c.number() != firstCard.number()) {
                        c.interactable = false
                    }
                }
                break
            }
        }

        interaction.setDestinationRegions([new DragDest(new Vector(600, 600), 200, 0, (cards) => { alert(cards) })])
    }
}

export { State }
