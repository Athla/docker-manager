package service

import "context"

type ContainerService struct {
	ctx context.Context
}

func NewContainerService(ctx context.Context) *ContainerService {
	return &ContainerService{
		ctx: ctx,
	}
}
