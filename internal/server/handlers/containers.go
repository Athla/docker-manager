package handlers

import (
	"context"
	"encoding/json"
	"fmt"
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
	Name     string   `json:"name"`
	Registry string   `json:"registry"`
	Image    string   `json:"image"`
	Version  string   `json:"version"`
	Commands []string `json:"commands"`
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

		return err
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

	log.Infof("CONTAINER: Container ID: %s", resp.ID)
	if err := cli.ContainerStart(s.ctx, resp.ID, container.StartOptions{}); err != nil {
		log.Warnf("CONTAINER: Unable to start container due: %s", err)
		e.JSON(http.StatusInternalServerError, map[string]string{
			"error": "internal server error.",
		})
		return err
	}

	log.Info("CONTAINER: Container created sucessfully!")
	e.JSON(http.StatusCreated, map[string]string{
		"success": fmt.Sprintf("created container with ID: %s successfully!", resp.ID),
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
	cli, err := newDockerClient(client.FromEnv)
	if err != nil {
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

func (s *ContainerHandler) StreamLogContainers(e echo.Context) error {
	containerId := e.Param("id")

	cli, err := newDockerClient(client.FromEnv)
	if err != nil {
		log.Warnf("CONTAINER-CLIENT: Unable to create docker client due: %s", err)
		e.JSON(http.StatusInternalServerError, map[string]string{
			"error": "internal server error.",
		})
		return err
	}
	defer cli.Close()

	options := container.LogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Follow:     true,
		Tail:       "20",
	}

	reader, err := cli.ContainerLogs(s.ctx, containerId, options)
	if err != nil {
		log.Warnf("CONTAINER-CLIENT: Unable to create docker reader due: %s", err)
		e.JSON(http.StatusInternalServerError, map[string]string{
			"error": "internal server error.",
		})

		return err
	}
	defer reader.Close()

	res := e.Response()
	res.Header().Set(echo.HeaderContentType, "text/event-stream")
	res.Header().Set("Cache-Control", "no-cache")
	res.Header().Set("Connection", "keep-alive")
	res.WriteHeader(http.StatusOK)

	flusher, ok := res.Writer.(http.Flusher)
	if !ok {
		return e.NoContent(http.StatusInternalServerError)
	}

	buf := make([]byte, 4096)
	for {
		n, err := reader.Read(buf)
		if n > 0 {
			logLine := string(buf[:n])

			fmt.Fprintf(res, "data: %s\n\n", logLine)
			flusher.Flush()
		}

		if err != nil {
			break
		}
	}

	return nil
}

func (s *ContainerHandler) StartContainer(e echo.Context) error {
	id := e.Param("id")
	cli, err := newDockerClient(client.FromEnv)
	if err != nil {
		log.Warnf("CONTAINER-CLIENT: Unable to create docker client due: %s", err)
		return e.JSON(http.StatusInternalServerError, map[string]string{
			"error": "internal server error",
		})
	}

	defer cli.Close()

	if err := cli.ContainerStart(s.ctx, id, container.StartOptions{}); err != nil {
		log.Warnf("CONTAINER-CLIENT: Unable to start docker container due: %s", err)
		return e.JSON(http.StatusInternalServerError, map[string]string{
			"error": "failed to start container",
		})
	}

	log.Info("CONTAINER-START: Container '%s' started successfully!", id)

	return e.JSON(http.StatusOK, map[string]string{
		"success": fmt.Sprintf("started containerd with ID: %s", id),
	})
}

func (s *ContainerHandler) StopContainer(e echo.Context) error {
	id := e.Param("id")
	cli, err := newDockerClient(client.FromEnv)
	if err != nil {
		log.Warnf("CONTAINER-CLIENT: Unable to create docker client due: %s", err)
		return e.JSON(http.StatusInternalServerError, map[string]string{
			"error": "internal server error",
		})
	}

	defer cli.Close()

	timeout := 10
	if err := cli.ContainerStop(s.ctx, id, container.StopOptions{Timeout: &timeout}); err != nil {
		log.Warnf("CONTAINER-CLIENT: Unable to stop docker container due: %s", err)
		return e.JSON(http.StatusInternalServerError, map[string]string{
			"error": "failed to stop container",
		})
	}

	log.Info("CONTAINER-STOP: Container '%s' stopped successfully!", id)

	return e.JSON(http.StatusOK, map[string]string{
		"success": fmt.Sprintf("stopped container with ID: %s", id),
	})
}

func (s *ContainerHandler) RestartContainer(e echo.Context) error {
	id := e.Param("id")
	cli, err := newDockerClient(client.FromEnv)
	if err != nil {
		log.Warnf("CONTAINER-CLIENT: Unable to create docker client due: %s", err)
		return e.JSON(http.StatusInternalServerError, map[string]string{
			"error": "internal server error",
		})
	}

	defer cli.Close()

	timeout := 10
	if err := cli.ContainerRestart(s.ctx, id, container.StopOptions{Timeout: &timeout}); err != nil {
		log.Warnf("CONTAINER-RESTART: Unable to restart docker container due: %s", err)
		return e.JSON(http.StatusInternalServerError, map[string]string{
			"error": "failed to stop container",
		})
	}
	log.Info("CONTAINER-RESTART: Container '%s' restarted successfully!", id)
	return e.JSON(http.StatusOK, map[string]string{
		"success": fmt.Sprintf("restarted container with ID: %s", id),
	})
}

func (s *ContainerHandler) GetContainerStats(e echo.Context) error {
	id := e.Param(":id")
	cli, err := newDockerClient(client.FromEnv)
	if err != nil {
		log.Warnf("CONTAINER-CLIENT: Unable to create docker client due: %s", err)
		return e.JSON(http.StatusInternalServerError, map[string]string{
			"error": "internal server error",
		})
	}

	defer cli.Close()

	statsReader, err := cli.ContainerStats(s.ctx, id, false)
	if err != nil {
		log.Warnf("CONTAINER-CLIENT: Unable to get container stats: %s", err)
		return e.JSON(http.StatusInternalServerError, map[string]string{
			"error": "unable to get container stats",
		})
	}

	var containerStats container.StatsResponse
	if err := json.NewDecoder(statsReader.Body).Decode(&containerStats); err != nil {
		log.Warnf("CONTAINER-CLIENT: Unable to decode stats: %s", err)
		return e.JSON(http.StatusInternalServerError, map[string]string{
			"error": "unable to get container stats",
		})
	}

	statsResponse := models.ContainerStats{
		CpuUsage: containerStats.CPUStats.CPUUsage.TotalUsage,
		MemUsage: containerStats.MemoryStats.Usage,
		CpuTotal: containerStats.CPUStats.SystemUsage,
		MemTotal: containerStats.MemoryStats.Limit,
	}

	return e.JSON(http.StatusOK, statsResponse)
}

// func (s *ContainerHandler) StreamLogContainers(e echo.Context) error {
// 	containerId := e.Param("id")
//
// 	cli, err := newDockerClient(client.FromEnv)
// 	if err != nil {
// 		log.Warnf("CONTAINER-CLIENT: Unable to create docker client due: %s", err)
// 		e.JSON(http.StatusInternalServerError, map[string]string{
// 			"error": "internal server error.",
// 		})
// 		return err
// 	}
// 	defer cli.Close()
//
// 	options := container.LogsOptions{
// 		ShowStdout: true,
// 		ShowStderr: true,
// 		Follow:     true,
// 		Tail:       "20",
// 	}
//
// 	reader, err := cli.ContainerLogs(s.ctx, containerId, options)
// 	if err != nil {
// 		log.Warnf("CONTAINER-CLIENT: Unable to create docker reader due: %s", err)
// 		e.JSON(http.StatusInternalServerError, map[string]string{
// 			"error": "internal server error.",
// 		})
//
// 		return err
// 	}
// 	defer reader.Close()
//
// 	res := e.Response()
// 	res.Header().Set(echo.HeaderContentType, "text/event-stream")
// 	res.Header().Set("Cache-Control", "no-cache")
// 	res.Header().Set("Connection", "keep-alive")
// 	res.WriteHeader(http.StatusOK)
//
// 	flusher, ok := res.Writer.(http.Flusher)
// 	if !ok {
// 		return e.NoContent(http.StatusInternalServerError)
// 	}
//
// 	buf := make([]byte, 4096)
// 	for {
// 		n, err := reader.Read(buf)
// 		if n > 0 {
// 			logLine := string(buf[:n])
//
// 			fmt.Fprintf(res, "data: %s\n\n", logLine)
// 			flusher.Flush()
// 		}
//
// 		if err != nil {
// 			break
// 		}
// 	}
//
// 	return nil
// }
