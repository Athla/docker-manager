import React, { useEffect, useState } from 'react';
import { X, Play, RotateCcw, Square, Trash2 } from 'lucide-react';
import Button from './Button';
import { Container } from '../types';
import { useToast } from '../contexts/ToatsContext';
import { AppError } from '../types/errors';

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
  fetchContainerLogs,
  fetchContainerMetrics,
  logs,
  logsError,
  stats,
  statsError
}) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'metrics' | 'credentials'>('logs');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {

    const cleanup = () => { }

    if (activeTab === 'logs') {
      fetchContainerLogs(container.id)
    } else if (activeTab === 'metrics') {
      fetchContainerMetrics(container.id)
    }

    return cleanup
  }, [container.id, activeTab, fetchContainerLogs, fetchContainerMetrics])

  const { showToast } = useToast()

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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'logs':
        if (logsError) {
          return <div className="p-4 text-red-500">{logsError}</div>;
        }

        return (
          <div className="bg-gray-900 text-gray-200 p-4 font-mono text-sm overflow-auto h-96">
            {logs && logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={index} className="py-1">
                  {log}
                </div>
              ))
            ) : (
              <div className="text-gray-400">TBA - Logs not yet being correctly fetched.</div>
            )}
          </div>
        );

      case 'metrics':
        if (statsError) {
          return <div className="p-4 text-red-500">{statsError}</div>;
        }

        return (
          <div className="p-4 h-96 overflow-auto">
            {stats != null ? (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900">Container Stats</h3>
                  <pre className="mt-2 bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                    TBA - It's fetching the metrics from the back-end but not rendering
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No metrics available</div>
            )}
          </div>
        );

      case 'credentials':
        return (
          <div className="p-4 h-96 overflow-auto">
            <div className="text-gray-500">TBA - WIP</div>
          </div>
        );
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
