import { useEffect, useRef } from "react"


interface LogsViewerProps {
  logs: string[]
}

export const LogsViewer: React.FC<LogsViewerProps> = ({ logs }) => {
  const logsEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [logs])

  return (
    <div className="bg-gray-900 text-gray-200 p-4 font-mono text-sm overflow-auto h-96">
      {logs.map((log, index) => (
        <div key={index} className="py-1">
          {log}
        </div>
      ))}
      <div ref={logsEndRef} />
    </div>
  )
}
