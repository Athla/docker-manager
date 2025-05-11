export interface Container {
  id: string;
  names: string;
  image: string;
  command: string;
  created: string;
  labels: Record<string, string>;
  state: 'running' | 'stopped' | 'paused' | 'exited';
  status: string;
  ports: Record<string, string>;
  Stats: ContainerStats;
}

export interface ContainerStats {
  cpu_usage: number;
  mem_usage: number;
  cpu_total: number;
  mem_total: number;
}

export interface ContainerLog {
  timestamp: string;
  message: string;
  type: 'info' | 'warning' | 'error';
}

export interface ContainerMetrics {
  cpu: {
    data: number[];
    labels: string[];
  };
  memory: {
    data: number[];
    labels: string[];
  };
  network: {
    rx: number[];
    tx: number[];
    labels: string[];
  };
}

export interface CreateOptions {
  name: string;
  registry: string;
  image: string;
  version: string;
  commands: string[];
}
