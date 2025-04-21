package service

import "context"

type ImagesService struct {
	ctx context.Context
}

func NewImageService(ctx context.Context) *ImagesService {
	return &ImagesService{}
}
