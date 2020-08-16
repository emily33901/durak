package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
	uuid "github.com/satori/go.uuid"
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.
	maxMessageSize = 8192
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type client struct {
	s    *server
	id   uuid.UUID
	name string
	conn *websocket.Conn

	send chan interface{}
}

func (c *client) processMessage(m message, jsonBytes []byte) {
	switch m.Type {
	case "client/changeName":
		newName := changeNameMessage{}
		err := json.Unmarshal(jsonBytes, &newName)
		if err != nil {
			log.Println("Unable to parse json")
		}
		log.Println("client", c.id, "changed name to", newName.Name)

		c.name = newName.Name
	default:
		log.Println("Unknown message ", m.Type)
	}
}

func (c *client) pump() {
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

		c.processMessage(m, jsonBytes)
	}
}

type lobby struct {
	clients map[uuid.UUID]struct{}
}

type server struct {
	lobbies map[uuid.UUID]*lobby
	clients map[uuid.UUID]*client
}

func newServer() *server {
	return &server{
		lobbies: map[uuid.UUID]*lobby{},
		clients: map[uuid.UUID]*client{},
	}
}

func (s *server) newClient(c *websocket.Conn) {
	id := uuid.NewV4()

	client := &client{
		s:    s,
		id:   id,
		name: "",
		conn: c,
	}

	s.clients[id] = client

	go client.pump()
}

func (s *server) removeClient(c *client) {
	log.Println("Removing client", c.id)
	delete(s.clients, c.id)
}

func (s *server) run() {

}

func main() {
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
