package server

import (
	"fmt"
	"io"
	"mineServers/internal/models"
	"net/http"

	"github.com/charmbracelet/log"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/client"
	"github.com/labstack/echo/v4"
)

type CreateOptions struct {
	Registry string   `json:"registry"`
	Image    string   `json:"image"`
	Version  string   `json:"version"`
	Commands []string `json:"commands"`
}

func (s *Server) CreateContainerHandler(e echo.Context) error {
	opts := new(CreateOptions)
	if err := e.Bind(opts); err != nil {
		log.Warnf("ECHO-CONTEXT: unable to bind payload due: %s", err)
		e.JSON(http.StatusInternalServerError, map[string]string{
			"error": "internal server error.",
		})
		return err
	}
	if opts.Registry == "" {
		opts.Version = "docker.io"
	}

	if opts.Version == "" {
		opts.Version = "latest"
	}

	if opts.Image == "" {
		log.Warn("CONTAINER-VALIDATOR: Image name cannot be empty")
		e.JSON(http.StatusBadRequest, map[string]string{
			"error": "image name is required",
		})
		return fmt.Errorf("Image name is required.")
	}

	cli, err := client.NewClientWithOpts(client.FromEnv)
	if err != nil {
		log.Warnf("CONTAINER-CLIENT: Unable to create docker client due: %s", err)
		e.JSON(http.StatusInternalServerError, map[string]string{
			"error": "internal server error.",
		})
		return err
	}
	defer cli.Close()

	imageName := fmt.Sprintf("%s/%s:%s", opts.Registry, opts.Image, opts.Version)
	reader, err := cli.ImagePull(s.ctx, imageName, image.PullOptions{})
	if err != nil {
		log.Warnf("CONTAINER-READER: Unable to pull docker image '%s' due: %s", imageName, err)
		e.JSON(http.StatusInternalServerError, map[string]string{
			"error": "internal server error.",
		})
		return err
	}
	defer reader.Close()

	io.Copy(io.Discard, reader)
	config := &container.Config{
		Image: imageName,
		Cmd:   opts.Commands,
	}

	resp, err := cli.ContainerCreate(s.ctx, config, nil, nil, nil, "")
	if err != nil {
		log.Warnf("CONTAINER-CREATOR: Unable to create container due: %s", err)
		e.JSON(http.StatusInternalServerError, map[string]string{
			"error": "internal server error.",
		})
		return err
	}

	log.Info("CONTAINER-SERVICER: Container ID: %s", resp.ID)

	if err := cli.ContainerStart(s.ctx, resp.ID, container.StartOptions{}); err != nil {
		log.Warnf("CONTAINER-STARTER: Unable to start container due: %s", err)
		e.JSON(http.StatusInternalServerError, map[string]string{
			"error": "internal server error.",
		})
		return err
	}

	log.Info("CONTAINER-SERVICE: Container created sucessfully!")

	e.JSON(http.StatusCreated, map[string]string{
		"success": fmt.Sprintf("created container with ID: %s sucessfully!", resp.ID),
	})

	return nil
}

func (s *Server) DeleteContainerHandler(e echo.Context) error {
	id := e.Param("id")
	cli, err := client.NewClientWithOpts(client.FromEnv)
	if err != nil {
		log.Warnf("CONTAINER-CLIENT: Unable to create docker client due: %s", err)
		e.JSON(http.StatusInternalServerError, map[string]string{
			"error": "internal server error.",
		})
		return err
	}
	defer cli.Close()

	removeOptions := container.RemoveOptions{
		Force:         true,
		RemoveVolumes: false,
	}

	if err := cli.ContainerRemove(s.ctx, id, removeOptions); err != nil {
		log.Warnf("CONTAINER-DELETE: Unable to delete container due: %s", err)
		e.JSON(http.StatusInternalServerError, map[string]string{
			"error": "internal server error.",
		})
		return err
	}

	log.Infof("CONTAINER-SERVICE: Container  '%s' deleted successfully!", id)

	e.JSON(http.StatusCreated, map[string]string{
		"success": fmt.Sprintf("deleted container with ID: %s sucessfully!", id),
	})

	return nil
}
func (s *Server) DeleteAllContainersHandler(e echo.Context) error {

	e.JSON(http.StatusNotImplemented, map[string]string{
		"message": "might not be implemented due the danger of it.",
	})
	return nil
}

func (s *Server) ListContainersHandler(e echo.Context) error {
	cli, err := client.NewClientWithOpts(client.FromEnv)
	if err != nil {
		log.Warnf("CONTAINER-CLIENT: Unable to create docker client due: %s", err)
		e.JSON(http.StatusInternalServerError, map[string]string{
			"error": "internal server error.",
		})
		return err
	}
	defer cli.Close()

	containers, err := cli.ContainerList(s.ctx, container.ListOptions{All: true})
	if err != nil {
		log.Warnf("CONTAINER-CLIENT: Unable to get containers due: %s", err)
		e.JSON(http.StatusInternalServerError, map[string]string{
			"error": "internal server error.",
		})
		return err
	}

	var out []models.Container
	for _, box := range containers {
		curr := models.Container{
			ID:      box.ID,
			Names:   box.Names,
			Image:   box.Image,
			Command: box.Command,
			Created: box.Created,
			Labels:  box.Labels,
			State:   box.State,
			Status:  box.Status,
		}
		out = append(out, curr)
	}

	e.JSON(http.StatusOK, out)
	return nil
}
func (s *Server) GetContainerHandler(e echo.Context) {}
