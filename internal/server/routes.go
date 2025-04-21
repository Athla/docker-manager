package server

import (
	"mineServers/internal/server/handlers"
	"net/http"

	"github.com/charmbracelet/log"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func (s *Server) RegisterRoutes() http.Handler {
	e := echo.New()

	log.Info("ROUTES: Registering routes.")
	e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
		Format: "method=${method}, uri=${uri}, status=${status}\n",
	}))
	e.Use(middleware.Recover())

	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     []string{"https://*", "http://*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	e.GET("/", s.HelloWorldHandler)

	e.GET("/health", s.healthHandler)

	log.Info("ROUTES-API: Registering API routes.")
	api := e.Group("/api")
	// Is it needed? It's a localstack thing
	// users := api.Group("/user")
	// users.POST("/login", s.UserLoginHandler)
	// users.GET("/logout", s.UserLogoutHandler)
	log.Info("ROUTES-API: Registering CONTAINER routes.")

	containerHandler := handlers.NewContainerHandler(s.ctx)

	containers := api.Group("/containers")
	containers.GET("/", containerHandler.ListContainersHandler)
	containers.POST("/create", containerHandler.CreateContainerHandler)
	containers.DELETE("/:id", containerHandler.DeleteContainerHandler)

	// images := api.Group("/images")
	// images.GET("/", s)

	return e
}

func (s *Server) HelloWorldHandler(c echo.Context) error {
	resp := map[string]string{
		"message": "Hello World",
	}

	return c.JSON(http.StatusOK, resp)
}

func (s *Server) healthHandler(c echo.Context) error {
	return c.JSON(http.StatusOK, s.db.Health())
}
