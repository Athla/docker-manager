import { useState, useCallback, useEffect, useRef } from 'react';
import { Container, CreateOptions } from '../types';

const API_URL = import.meta.env.VITE_API_URL;

export const useContainers = () => {
  const [logs, setLogs] = useState<string[]>([])
  const [logsError, setLogsError] = useState<string | null>(null)
  const logsEventSourceRef = useRef<EventSource | null>(null)
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch containers
  const fetchContainers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/containers/`)
      if (!response.ok) {
        throw new Error("Failed to fetch containers")
      }

      const data = await response.json()
      setContainers(data)
    } catch (err) {
      setError('Failed to fetch containers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    fetchContainers();
  }, [fetchContainers]);

  // Container actions 
  const startContainer = useCallback(async (containerId: string) => {
    try {
      const response = await fetch(`${API_URL}/containers/${containerId}/start`, { method: "POST" })
      if (!response.ok) {
        throw new Error("Failed to start container")
      }

      await fetchContainers();
      return true
    } catch (err) {
      setError('Failed to start container')
      return false
    }
  }, [fetchContainers])

  const stopContainer = useCallback(async (containerId: string) => {
    try {
      const response = await fetch(`${API_URL}/containers/${containerId}/stop`, { method: "POST" })
      if (!response.ok) {
        throw new Error("Failed to stop container")
      }

      await fetchContainers();
      return true
    } catch (err) {
      setError('Failed to stop container')
      return false
    }
  }, [fetchContainers])

  const restartContainer = useCallback(async (containerId: string) => {
    try {
      const response = await fetch(`${API_URL}/containers/${containerId}/restart`, { method: "POST" })
      if (!response.ok) {
        throw new Error("Failed to restart container")
      }

      await fetchContainers();
      return true
    } catch (err) {
      setError('Failed to restart container')
      return false
    }
  }, [fetchContainers])

  const deleteContainer = useCallback(async (containerId: string) => {
    try {
      const response = await fetch(`${API_URL}/containers/${containerId}`, { method: "DELETE" })
      if (!response.ok) {
        throw new Error("Failed to delete container")
      }

      await fetchContainers();
      return true
    } catch (err) {
      setError('Failed to delete container')
      return false
    }
  }, [fetchContainers])

  const createContainer = useCallback(async (options: CreateOptions) => {
    try {
      const response = await fetch(`${API_URL}/containers/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(options)
      })
      if (!response.ok) {
        throw new Error("Failed to create container")
      }

      await fetchContainers()
      return true
    } catch (err) {
      setError("Failed to create container")
      return false
    }
  }, [fetchContainers])

  const fetchContainerMetrics = useCallback(async (containerId: string) => {
    try {

    } catch {

    }
  }, [])
  // containers.GET("/:id/logs", containerHandler.StreamLogContainers)
  const fetchContainerLogs = useCallback(async (containerId: string) => {
    if (logsEventSourceRef.current) {
      logsEventSourceRef.current.close()
    }

    setLogs([])
    setLogsError(null)

    const eventSource = new EventSource(`${API_URL}/containers/${containerId}/logs`)
    logsEventSourceRef.current = eventSource

    eventSource.onmessage = (event: MessageEvent) => {
      try {
        const newLogs: string[] = JSON.parse(event.data)
        setLogs(newLogs)
      } catch (err) {
        setLogsError(`Failed to parse logs from SSE for id: ${containerId}`)
        setError(`Failed to parse logs from SSE for id: ${containerId}`)
        eventSource.close()
      }
    }

    eventSource.onerror = () => {
      setLogsError(`Failed to parse logs from SSE for id: ${containerId}`)
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [])


  return {
    containers,
    loading,
    error,
    fetchContainers,
    startContainer,
    stopContainer,
    restartContainer,
    deleteContainer,
    createContainer,
    fetchContainerLogs,
    fetchContainerMetrics,
    logs,
    logsError
  }
    ;
};
