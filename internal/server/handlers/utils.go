package handlers

import (
	"context"
	"fmt"
	"io"
	"mineServers/internal/service"

	"github.com/charmbracelet/log"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
)

func NewContainerHandler(ctx context.Context) *ContainerHandler {
	svc := service.NewContainerService(ctx)
	return &ContainerHandler{
		svc: svc,
	}
}

func parseCreateOpts(opts *CreateOptions) error {
	if opts.Registry == "" {
		opts.Registry = "docker.io"
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
	cli, err := client.NewClientWithOpts(opts)
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

	resp, err := client.ContainerCreate(ctx, config, nil, nil, nil, opts.Name)
	if err != nil {
		log.Warnf("CONTAINER: Unable to create container due: %s", err)
		return nil, err
	}

	return &resp, nil
}
