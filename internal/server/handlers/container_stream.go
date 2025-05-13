package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/charmbracelet/log"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/labstack/echo/v4"
)

func (s *ContainerHandler) StreamStatContainers(e echo.Context) error {
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

	stats, err := cli.ContainerStats(s.ctx, containerId, true)
	if err != nil {
		log.Warnf("CONTAINER-CLIENT: Unable to create docker reader due: %s", err)
		e.JSON(http.StatusInternalServerError, map[string]string{
			"error": "internal server error.",
		})

		return err
	}

	defer stats.Body.Close()

	res := e.Response()
	res.Header().Set(echo.HeaderContentType, "text/event-stream")
	res.Header().Set("Cache-Control", "no-cache")
	res.Header().Set("Connection", "keep-alive")
	res.WriteHeader(http.StatusOK)

	flusher, ok := res.Writer.(http.Flusher)
	if !ok {
		return e.NoContent(http.StatusInternalServerError)
	}

	decoder := json.NewDecoder(stats.Body)
	for {
		var v *container.StatsResponse
		if err := decoder.Decode(&v); err != nil {
			if err == io.EOF {
				break
			}

			log.Warnf("CONTAINER-CLIENT: Error decoding stats: %v", err)
		}

		cpuPercent := calculateCpuPercentUnix(v)
		memUsage := v.MemoryStats.Usage
		memLimit := v.MemoryStats.Limit
		memPercent := float64(memUsage) / float64(memLimit) * 100

		data := map[string]interface{}{
			"cpu_percent": cpuPercent,
			"mem_percent": memPercent,
			"mem_limit":   memLimit,
			"mem_usage":   memUsage,
		}

		jsonData, _ := json.Marshal(data)
		fmt.Fprintf(res, "data: %s\n\n", jsonData)
		flusher.Flush()
	}

	return nil
}

func calculateCpuPercentUnix(v *container.StatsResponse) float64 {
	cpuDelta := float64(v.CPUStats.CPUUsage.TotalUsage) - float64(v.PreCPUStats.CPUUsage.TotalUsage)
	systemDelta := float64(v.CPUStats.SystemUsage) - float64(v.PreCPUStats.SystemUsage)

	if systemDelta > 0.0 && cpuDelta > 0.0 {
		return (cpuDelta / systemDelta) * (float64(len(v.CPUStats.CPUUsage.PercpuUsage)) * 100.0)
	}

	return 0.0
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
