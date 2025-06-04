package models

type Container struct {
	ID      string            `json:"id"`
	Names   []string          `json:"names"`
	Image   string            `json:"image"`
	Command string            `json:"command"`
	Created int64             `json:"created"`
	Labels  map[string]string `json:"labels"`
	State   string            `json:"state"`
	Status  string            `json:"status"`
	Ports   map[string]string `json:"ports"`
	Stats   ContainerStats
}

type ContainerStats struct {
	CpuUsage uint64 `json:"cpu_usage"`
	MemUsage uint64 `json:"mem_usage"`
	CpuTotal uint64 `json:"cpu_total"`
	MemTotal uint64 `json:"mem_total"`
}
