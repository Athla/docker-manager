package handlers

import (
	"context"
	"fmt"
	"io"
	"mineServers/internal/models"
	"mineServers/internal/service"
	"net/http"

	"github.com/charmbracelet/log"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/client"
	"github.com/labstack/echo/v4"
)

type ContainerHandler struct {
	ctx context.Context
	svc *service.ContainerService
}

type CreateOptions struct {
	Registry string   `json:"registry"`
	Image    string   `json:"image"`
	Version  string   `json:"version"`
	Commands []string `json:"commands"`
}

func NewContainerHandler(ctx context.Context) *ContainerHandler {
	svc := service.NewContainerService(ctx)
	return &ContainerHandler{
		ctx: ctx,
		svc: svc,
	}
}

func parseCreateOpts(opts *CreateOptions) error {
	if opts.Registry == "" {
		opts.Version = "docker.io"
	}

	if opts.Version == "" {
		opts.Version = "latest"
	}

	if opts.Image == "" {
		log.Warn("CONTAINER: Image name cannot be empty")
		return fmt.Errorf("Image name is required.")
	}
	return nil
}

func newDockerClient(opts client.Opt) (*client.Client, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv)
	if err != nil {
		log.Warnf("CONTAINER: Unable to create docker client due: %s", err)
		return nil, err
	}

	return cli, nil
}

func createDockerContainer(ctx context.Context, client *client.Client, reader io.ReadCloser, opts *CreateOptions, imageName string) (*container.CreateResponse, error) {
	io.Copy(io.Discard, reader)
	config := &container.Config{
		Image: imageName,
		Cmd:   opts.Commands,
	}

	resp, err := client.ContainerCreate(ctx, config, nil, nil, nil, "")
	if err != nil {
		log.Warnf("CONTAINER: Unable to create container due: %s", err)
		return nil, err
	}

	return &resp, nil
}

func (s *ContainerHandler) CreateContainerHandler(e echo.Context) error {
	// Parse opts
	opts := new(CreateOptions)
	if err := e.Bind(opts); err != nil {
		log.Warnf("ECHO: unable to bind payload due: %s", err)
		e.JSON(http.StatusInternalServerError, map[string]string{
			"error": "internal server error.",
		})
		return err
	}

	if err := parseCreateOpts(opts); err != nil {
		e.JSON(http.StatusBadRequest, map[string]string{
			"error": "image name is required",
		})
	}

	// This here allows me to interact with the docker hub without needing to do http requests each time
	cli, err := newDockerClient(client.FromEnv)
	if err != nil {
		e.JSON(http.StatusInternalServerError, map[string]string{
			"error": "internal server error.",
		})
		return err
	}
	defer cli.Close()

	// Parse image name - service
	imageName := fmt.Sprintf("%s/%s:%s", opts.Registry, opts.Image, opts.Version)

	reader, err := s.svc.PullContainerImage(cli, s.ctx, imageName, image.PullOptions{})
	if err != nil {
		e.JSON(http.StatusInternalServerError, map[string]string{
			"error": "internal server error.",
		})
		return err
	}
	defer reader.Close()

	resp, err := createDockerContainer(s.ctx, cli, reader, opts, imageName)
	if err != nil {
		e.JSON(http.StatusInternalServerError, map[string]string{
			"error": "internal server error.",
		})

		return err
	}

	log.Info("CONTAINER: Container ID: %s", resp.ID)
	if err := cli.ContainerStart(s.ctx, resp.ID, container.StartOptions{}); err != nil {
		log.Warnf("CONTAINER: Unable to start container due: %s", err)
		e.JSON(http.StatusInternalServerError, map[string]string{
			"error": "internal server error.",
		})
		return err
	}

	log.Info("CONTAINER: Container created sucessfully!")
	e.JSON(http.StatusCreated, map[string]string{
		"success": fmt.Sprintf("created container with ID: %s sucessfully!", resp.ID),
	})

	return nil
}

func (s *ContainerHandler) DeleteContainerHandler(e echo.Context) error {
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
func (s *ContainerHandler) DeleteAllContainersHandler(e echo.Context) error {

	e.JSON(http.StatusNotImplemented, map[string]string{
		"message": "might not be implemented due the danger of it.",
	})
	return nil
}

func (s *ContainerHandler) ListContainersHandler(e echo.Context) error {
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
func (s *ContainerHandler) GetContainerHandler(e echo.Context) {}
