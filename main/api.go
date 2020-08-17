package main

type message struct {
	// message type
	Type string
}

const clientNameSetType = "client/name/set"

type clientNameSet struct {
	message
	Name string
}

const clientNameType = "client/name"

type clientName struct {
	message
	ID   string
	Name string
}

const clientInvalidType = "client/invalid"

type clientInvalid struct {
	message
	ID string
}

const clientInLobbyType = "client/inLobby"

type clientInLobby struct {
	message
}

const lobbyJoinedType = "lobby/joined"

type lobbyJoined struct {
	message
	ID string
}

const lobbyLeftType = "lobby/left"

type lobbyLeft struct {
	message
}

const lobbyCreateType = "lobby/create"

type lobbyCreate struct {
	message
}

const lobbyJoinType = "lobby/join"

type lobbyJoin struct {
	message
	ID string
}

const lobbyLeaveType = "lobby/leave"

type lobbyLeave struct {
	message
	ID string
}

const lobbyInvalidType = "lobby/invalid"

type lobbyInvalid struct {
	message
}

const lobbyQueryType = "lobby/query"

type lobbyQuery struct {
	message
	ID string
}

const lobbyQueryResponseType = "lobby/query/response"

type lobbyQueryResponse struct {
	message
	ID      string
	Clients []string
	Name    string
	Owner   string
}

const lobbyNameSetType = "lobby/name/set"

type lobbyNameSet struct {
	message
	ID string
}
