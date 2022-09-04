/*

var socket = new WebSocket("ws://localhost:61016/ws")

let socketSend = (o) => {
    socket.send(JSON.stringify(o))
}
socket.onopen = (ev) => {
    console.log('Connected')
}
socket.onclose = (ev) => {
}
socket.onerror = (ev) => {
}

let inLobby = false
let lobbyRefresh = () => {
    socketSend({ Type: 'lobby/query' })
    if (!inLobby) return
    setTimeout(lobbyRefresh, 1000)
}

socket.onmessage = (ev) => {
    console.log('got message', ev.data)
    var msg = JSON.parse(ev.data)

    switch (msg.Type) {
        case "lobby/joined": {
            console.log("Joined lobby", msg.ID)
            document.getElementById('createLobby')!.disabled = true
            document.getElementById('lobbyText')!.innerText = "In lobby " + msg.ID
            inLobby = true
            setTimeout(lobbyRefresh, 1000)
            break
        }
        case "lobby/left": {
            inLobby = false
            console.log("Left lobby")
            document.getElementById('createLobby')!.disabled = false
            document.getElementById('lobbyText')!.innerText = ""
            break
        }
        case "lobby/query/response": {
            document.getElementById('lobbyPeople')!.innerHTML = JSON.stringify(msg)
            break
        }
    }
}

let nameChanged = () => {
    var newName = document.getElementById("nameChange").value
    document.getElementById("name").innerHTML = name
    socketSend({
        Type: 'client/name/set',
        Name: newName,
    })
}

let createLobby = () => {
    socketSend({
        Type: 'lobby/create',
    })
}

let leaveLobby = () => {
    socketSend({
        Type: 'lobby/leave'
    })
}

let joinLobby = () => {
    let id = document.getElementById("lobbyCode").value
    socketSend({
        Type: 'lobby/join',
        ID: id,
    })
}

window.s = {
    joinLobby: joinLobby,
    leaveLobby: leaveLobby,
    createLobby: createLobby,
    nameChanged: nameChanged,
}
*/
