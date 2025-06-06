import { useEffect, useState } from "react";

interface SSEOptions {
  onMessage: (data: any) => void;
  onError?: (error: Event) => void
}

const API_URL = import.meta.env.VITE_API_URL;
//(`${API_URL}/containers/`)
export const useSSE = (url: string, options: SSEOptions) => {
  const [err, setErr] = useState<Event | null>(null)

  useEffect(() => {
    const eventSource = new EventSource(`${API_URL}${url}`)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        options.onMessage(data)
      } catch (e) {
        console.error('Error parsing SSE data:', e)
      }
    }

    eventSource.onerror = (err) => {
      setErr(err)
      options.onError?.(err)
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [url])

  return { err }
}

