import { useEffect, useState } from "react";

interface SSEOptions {
  onMessage: (data: any) => void;
  onError?: (error: Event) => void
}

const API_URL = import.meta.env.VITE_API_URL;
//(`${API_URL}/containers/`)
export const useSSE = (url: string, options: SSEOptions) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 0

  useEffect(() => {
    if (retryCount >= MAX_RETRIES) {
      options.onError?.(new Error('Max retries exceeded'))
      return
    }
    const eventSource = new EventSource(`${API_URL}${url}`)

    eventSource.onopen = () => {
      setStatus('connected')
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        options.onMessage(data)
      } catch (e) {
        console.error('Error parsing SSE data:', e)
      }
    }

    eventSource.onerror = (err) => {
      eventSource.close()

      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1)
        }, 1000 * Math.pow(2, retryCount))
      } else {
        setStatus('error')
        options.onError?.(err)
      }
    }

    return () => {
      eventSource.close()
    }
  }, [url, retryCount])

  return { status, retryCount }
}

