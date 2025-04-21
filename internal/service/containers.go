package service

import (
	"context"
	"io"

	"github.com/charmbracelet/log"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/client"
)

type ContainerService struct {
	ctx context.Context
}

func NewContainerService(ctx context.Context) *ContainerService {
	return &ContainerService{
		ctx: ctx,
	}
}

func (c *ContainerService) PullContainerImage(cli *client.Client, ctx context.Context, imageName string, pullOpt image.PullOptions) (io.ReadCloser, error) {
	reader, err := cli.ImagePull(ctx, imageName, image.PullOptions{})
	if err != nil {
		log.Warnf("CONTAINER-READER: Unable to pull docker image '%s' due: %s", imageName, err)
		return nil, err
	}

	return reader, nil
}
