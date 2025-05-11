import React, { useState } from 'react';
import { Container } from '../types';
import { X, Play, RotateCcw, Square, Trash2 } from 'lucide-react';
import Button from './Button';

interface ContainerModalProps {
  container: Container;
  onClose: () => void;
  onStart: (id: string) => Promise<boolean>;
  onStop: (id: string) => Promise<boolean>;
  onRestart: (id: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

const ContainerModal: React.FC<ContainerModalProps> = ({
  container,
  onClose,
  onStart,
  onStop,
  onRestart,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'metrics'>('logs');
  //const [logs, setLogs] = useState<ContainerLog[]>([]);
  //const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

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

      if (success && action !== 'delete') {
        // Refresh logs and metrics after action
        console.log("Metrics soon")
      }
    } catch (error) {
      console.error(`Failed to ${action} container:`, error);
    } finally {
      setActionInProgress(null);
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
          </nav>
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
