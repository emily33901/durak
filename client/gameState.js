let states = {
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

let actions = {
    defend: "defend",
    transfer: "transfer",
    attack: "attack",
    pickup: "pickup",
}

let actionMap = {
    "defend": (data) => {
        if (window.s.state != states.attacked) {
            alert('mongo')
        }
    }
}

window.s.state = states.attacking

window.s.act = (action, data) => {
    actionMap[action](data)
}

window.s.actions = actions
window.s.states = states