package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"time"

	gyfcat "github.com/emily33901/go-gyfcat"
	"github.com/gorilla/websocket"
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 10 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.
	maxMessageSize = 8192
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// TODO
		return true
	},
}

type client struct {
	s    *server
	id   string
	name string
	conn *websocket.Conn

	activeLobby *lobby

	send chan interface{}
}

func (c *client) processMessage(m message, jsonBytes []byte) {
	switch m.Type {
	case clientNameSetType:
		newName := clientNameSet{}
		err := json.Unmarshal(jsonBytes, &newName)
		if err != nil {
			log.Println("Unable to parse json")
			break
		}
		log.Println("client", c.id, "changed name to", newName.Name)
		c.name = newName.Name
	case clientNameType:
		name := clientName{}
		err := json.Unmarshal(jsonBytes, &name)
		if err != nil {
			log.Println("Unable to parse json")
			break
		}
		c.s.clientName(c, name.ID)
	case lobbyCreateType:
		c.s.newLobby(c)
	case lobbyJoinType:
		lobby := lobbyJoin{}
		err := json.Unmarshal(jsonBytes, &lobby)
		if err != nil {
			log.Println("Unable to parse json")
			break
		}
		c.s.joinLobby(c, lobby.ID)
	case lobbyLeaveType:
		c.s.leaveLobby(c)
	case lobbyQueryType:
		lobby := lobbyQuery{}
		err := json.Unmarshal(jsonBytes, &lobby)
		if err != nil {
			log.Println("Unable to parse json")
			break
		}
		c.s.lobbyQuery(c, lobby.ID)
	default:
		log.Println("Unknown message ", m.Type)
	}
}

func (c *client) pumpRead() {
	log.Println("registered new client", c.id)
	defer func() {
		c.s.removeClient(c)
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })

	for {
		_, jsonBytes, err := c.conn.ReadMessage()
		if err != nil {
			log.Println("Unable to read message", err)
			return
		}

		m := message{}
		err = json.Unmarshal(jsonBytes, &m)

		if err != nil {
			log.Println("Unable to read json")
			return
		}

		go c.processMessage(m, jsonBytes)
	}
}

func (c *client) pumpWrite() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case msg, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))

			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			err := c.conn.WriteJSON(msg)

			if err != nil {
				log.Println("error writing to client", c, err)
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		default:
		}
	}
}

type lobby struct {
	s    *server
	id   string
	name string

	clients map[string]struct{}
	owner   *client
}

type server struct {
	lobbies map[string]*lobby
	clients map[string]*client
}

func newServer() *server {
	return &server{
		lobbies: map[string]*lobby{},
		clients: map[string]*client{},
	}
}

func (s *server) newClient(c *websocket.Conn) {
	id := gyfcat.GetUrl()

	client := &client{
		s:    s,
		id:   id,
		name: id,
		conn: c,
		send: make(chan interface{}, 100),
	}

	s.clients[id] = client

	go client.pumpRead()
	go client.pumpWrite()
}

func (s *server) findClient(id string) *client {
	if c, ok := s.clients[id]; ok {
		return c
	}

	return nil
}

func (s *server) removeClient(c *client) {
	log.Println("Removing client", c.id)
	if c.activeLobby != nil {
		s.leaveLobby(c)
	}
	delete(s.clients, c.id)
	close(c.send)
}

func (s *server) clientName(c *client, id string) {
	if c := s.findClient(id); c != nil {
		c.send <- clientName{
			message{clientNameType},
			c.id,
			c.name,
		}
	}

}

func (s *server) newLobby(c *client) {
	log.Println("client", c.id, "creating lobby")

	id := lobbyCode()
	l := &lobby{
		s:       s,
		id:      id,
		name:    id,
		clients: map[string]struct{}{},
	}
	s.lobbies[id] = l
	s.joinLobby(c, id)
}

func (s *server) findLobby(id string) *lobby {
	if l, ok := s.lobbies[id]; ok {
		return l
	}

	return nil
}

func (s *server) joinLobby(c *client, id string) {
	if c.activeLobby != nil {
		c.send <- clientInLobby{
			message{clientInLobbyType},
		}
		return
	}

	if l := s.findLobby(id); l != nil {
		l.clients[c.id] = struct{}{}
		c.activeLobby = l

		if l.owner == nil {
			l.owner = c
		}

		c.send <- lobbyJoined{
			message{lobbyJoinedType},
			id,
		}
	} else {
		c.send <- lobbyInvalid{
			message{lobbyInvalidType},
		}
	}
}

func (s *server) leaveLobby(c *client) {
	if c.activeLobby == nil {
		c.send <- lobbyInvalid{
			message{lobbyInvalidType},
		}
		return
	}
	if l := s.findLobby(c.activeLobby.id); l != nil {
		delete(l.clients, c.id)
		if l.owner == c {
			// find a new owner
			l.owner = nil
			for k := range l.clients {
				l.owner = s.clients[k]
				break
			}
		}
		c.activeLobby = nil
		c.send <- lobbyLeft{
			message{lobbyLeftType},
		}
	} else {
		c.send <- lobbyInvalid{
			message{lobbyInvalidType},
		}
	}
}

func (s *server) lobbyQuery(c *client, id string) {
	lobby := s.findLobby(id)
	if lobby == nil && id == "" {
		lobby = c.activeLobby
	}
	if lobby == nil {
		c.send <- lobbyInvalid{
			message{lobbyInvalidType},
		}
		return
	}

	clients := []string{}
	for k := range lobby.clients {
		clients = append(clients, k)
	}

	c.send <- lobbyQueryResponse{
		message: message{lobbyQueryResponseType},
		ID:      lobby.id,
		Clients: clients,
		Name:    lobby.name,
		Owner:   lobby.owner.id,
	}
}

const (
	lobbyCullPeriod = 20 * time.Second
)

func (s *server) run() {
	ticker := time.NewTicker(lobbyCullPeriod)
	for {
		select {
		case _ = <-ticker.C:
			toRemove := []string{}

			for k, l := range s.lobbies {
				if len(l.clients) == 0 {
					toRemove = append(toRemove, k)
				}
			}

			for _, x := range toRemove {
				delete(s.lobbies, x)
			}

			log.Println("Culled", len(toRemove), "lobbies")
		default:
		}
	}
}

func main() {
	rand.Seed(time.Now().UTC().UnixNano())

	s := newServer()

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println(err)
			return
		}
		s.newClient(conn)
	})

	fmt.Println("Serving durak...")

	go s.run()

	http.ListenAndServe(":61016", nil)
}
