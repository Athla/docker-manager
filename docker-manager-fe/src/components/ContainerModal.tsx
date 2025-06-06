import React, { useState } from 'react';
import { X, Play, RotateCcw, Square, Trash2 } from 'lucide-react';
import Button from './Button';
import { Container } from '../types';
import { useToast } from '../contexts/ToatsContext';
import { AppError } from '../types/errors';
import { useSSE } from '../hooks/useSSE';

interface ContainerModalProps {
  container: Container;
  onClose: () => void;
  onStart: (id: string) => Promise<boolean>;
  onStop: (id: string) => Promise<boolean>;
  onRestart: (id: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  fetchContainerLogs: (containerId: string) => void;
  fetchContainerMetrics: (containerId: string) => void;
  logs: string[];
  logsError: string | null;
  stats: string | null;
  statsError: string | null;
}


const ContainerModal: React.FC<ContainerModalProps> = ({
  container,
  onClose,
  onStart,
  onStop,
  onRestart,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'metrics' | 'credentials'>('logs');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{
    cpu_percent: number,
    mem_percent: number,
    mem_limit: number,
    mem_usage: number,
  } | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  useSSE(`/containers/${container.id}/stats`, {
    onMessage: (data) => {
      setMetrics(data)
    },
    onError: (error) => {
      console.error('Error in metrics stream:', error)
    }
  })

  useSSE(`/containers/${container.id}/logs`, {
    onMessage: (data) => {
      setLogs(prev => [...prev, data].slice(-100))
    },
    onError: (error) => {
      console.error('Error in log stream:', error)
    }
  })

  const { showToast } = useToast()
  const formatBytes = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`
  }

  const handleAction = async (action: 'start' | 'stop' | 'restart' | 'delete') => {
    setActionInProgress(action);

    try {
      let success = false;

      switch (action) {
        case 'start':
          success = await onStart(container.id);
          break;
        case 'stop':
          success = await onStop(container.id);
          break;
        case 'restart':
          success = await onRestart(container.id);
          break;
        case 'delete':
          success = await onDelete(container.id);
          if (success) {
            onClose();
            return;
          }
          break;
      }

      if (success) {
        showToast({
          type: 'success',
          message: `Container  ${action}ed sucessefully!`
        })
      } else {
        throw new AppError(
          'ACTION_FAILED',
          `Failed to ${action} container`
        )
      }

      if (success && action !== 'delete') {
        // Refresh logs and metrics after action
        console.log("Metrics soon")
      }
    } catch (error) {
      const message = error instanceof AppError ? error.message : 'An unexpected error occurred!'

      showToast({
        type: 'error',
        message
      })
    } finally {
      setActionInProgress(null);
    }
  };

  const renderMetrics = () => {
    if (!metrics) {
      return (
        <div className='text-gray-500 p-4'>
          Waiting for metrics...
        </div>
      )
    }

    return (
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">CPU Usage</h3>
            <div className="mt-2">
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                      {metrics.cpu_percent.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                  <div
                    style={{ width: `${metrics.cpu_percent}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Memory Usage</h3>
            <div className="mt-2">
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                      {metrics.mem_percent.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
                  <div
                    style={{ width: `${metrics.mem_percent}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                  />
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {formatBytes(metrics.mem_usage)} / {formatBytes(metrics.mem_limit)}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderLogs = () => {
    if (logs.length === 0 || logs === void []) {
      return (
        <div className='text-gray-500 p-4'>
          Waiting for logs...
        </div>
      )
    }

    return (
      <div className='bg-gray-900 text-gray-200 p-4 font-mono text-sm overflow-auto h-96'>
        {logs.map((log, index) => {
          <div key={index} className='py-1'>
            {log}
          </div>
        })}
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'logs':
        return renderLogs()
      case 'metrics':
        return renderMetrics()
      case 'credentials':
        return (
          <div className='p-4'>
            <p className='text-gray-500'>Credentials mamagement comming soon!</p>
          </div>
        )
    }
  };

  // Render metrics
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 transition-opacity duration-300 ease-in-out">
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-in"
        style={{
          animationDuration: '0.25s',
          transform: 'scale(1)',
          opacity: 1
        }}
      >
        {/* Header */}
        <div className="border-b border-gray-200 p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{container.names}</h2>
            <p className="text-sm text-gray-500">{container.image}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('logs')}
              className={`
                py-3 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'logs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              Logs
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`
                py-3 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'metrics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              Metrics
            </button>
            <button
              onClick={() => setActiveTab('credentials')}
              className={`
                py-3 px-3 border-b-2 font-medium text-sm
                ${activeTab === 'credentials'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              Credetials
            </button>
          </nav>
        </div>

        <div className='flex-grow overflow-auto'>
          {renderTabContent()}
        </div>

        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between">
          <div className="flex space-x-3">
            {container.state !== 'running' && (
              <Button
                variant="primary"
                onClick={() => handleAction('start')}
                isLoading={actionInProgress === 'start'}
                icon={<Play className="h-4 w-4" />}
              >
                Start
              </Button>
            )}

            {container.state === 'running' && (
              <Button
                variant="secondary"
                onClick={() => handleAction('stop')}
                isLoading={actionInProgress === 'stop'}
                icon={<Square className="h-4 w-4" />}
              >
                Stop
              </Button>
            )}

            {container.state === 'running' && (
              <Button
                variant="secondary"
                onClick={() => handleAction('restart')}
                isLoading={actionInProgress === 'restart'}
                icon={<RotateCcw className="h-4 w-4" />}
              >
                Restart
              </Button>
            )}

          </div>

          {container.state !== 'running' && (
            <Button
              variant="danger"
              onClick={() => handleAction('delete')}
              isLoading={actionInProgress === 'delete'}
              icon={<Trash2 className="h-4 w-4" />}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContainerModal;
