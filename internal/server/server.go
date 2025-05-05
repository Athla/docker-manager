package server

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/charmbracelet/log"
	_ "github.com/joho/godotenv/autoload"

	"mineServers/internal/database"
	"mineServers/internal/server/handlers"
)

type Server struct {
	port              int
	ctx               context.Context
	db                database.Service
	containersHandler *handlers.ContainerHandler
}

func NewServer() *http.Server {
	ctx := context.Background()
	port, _ := strconv.Atoi(os.Getenv("PORT"))
	NewServer := &Server{
		port: port,
		ctx:  ctx,
		db:   database.New(),
	}

	// Declare Server config
	log.Infof("SERVER: Running at port :%d", NewServer.port)
	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", NewServer.port),
		Handler:      NewServer.RegisterRoutes(),
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	return server
}
