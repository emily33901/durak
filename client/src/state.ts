import { getCard } from "./card.js"
import { interaction, DragDest } from "./interaction.js"

class State {
    static states = {
        // if you are being attacked then you can pass on
        // pick up or defend
        attacked: "attacked",
        // if you are attacking then you can play any cards of the same number
        attacking: "attacking",
        // if you are defending then you can play any cards that are higher on
        // top of the cards you have been attacked with
        defending: "defending",
        // someone else is being attacked - you can play cards of the same number
        // as they have played
        otherAttack: "otherAttack",
    }

    static actions = {
        defend: "defend",
        transfer: "transfer",
        attack: "attack",
        pickup: "pickup",
    }

    static actionMap = {
        "defend": (data) => {
            if (window.s.state != states.attacked) {
                alert('')
            }
        }
    }

    static act(action, data) {
        actionMap[action](data)
    }

    static state = State.states.attacking

    static calcInteractable(hand) {
        let selectedCards = interaction.draggedCards

        // TODO: calc for cards on table

        switch (State.state) {
            case State.states.attacking: {
                if (selectedCards.length == 0) {
                    // any cards here are selectable
                    hand.map(x => getCard(x).interactable = true)
                    break
                }
                // look at the first card for what number they selected
                // and calculate for the rest of the cards
                let firstCard = getCard(selectedCards[0])
                for (let x of hand.map(x => getCard(x))) {
                    if (x.number() != firstCard.number()) {
                        x.interactable = false
                    }
                }
                break
            }
        }

        interaction.setDestinationRegions([new DragDest([600, 600], 200, 0)])
    }
}

export { State }
