import React from 'react';
import { Container } from '../types';
import { Play, Square, Package } from 'lucide-react';

interface ContainerCardProps {
  container: Container;
  onClick: (container: Container) => void;
}

const ContainerCard: React.FC<ContainerCardProps> = ({ container, onClick }) => {
  // Status color mapping
  const statusColors = {
    running: 'bg-green-100 text-green-800 border-green-200',
    stopped: 'bg-red-100 text-red-800 border-red-200',
    paused: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    exited: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  // Status icon mapping
  const statusIcon = () => {
    switch (container.status) {
      case 'running':
        return <Play className="h-3 w-3" />;
      case 'stopped':
      case 'exited':
        return <Square className="h-3 w-3" />;
      default:
        return null;
    }
  };

  // Format creation date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer p-5"
      onClick={() => onClick(container)}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <div className="p-2 rounded-md bg-blue-50 text-blue-600 mr-3">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{container.names}</h3>
            <p className="text-sm text-gray-500">{container.image}</p>
          </div>
        </div>
        <div className={`px-2.5 py-0.5 rounded-full text-xs flex items-center space-x-1 ${statusColors[container.state]}`}>
          <span>{statusIcon()}</span>
          <span className="capitalize">{container.state}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500">CPU Usage</p>
          <p className="text-sm font-medium">{(container.Stats.cpu_usage / 1024 ** 3).toFixed(2)}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Memory</p>
          <p className="text-sm font-medium">
            {(container.Stats.mem_usage / 1024 ** 2).toFixed(2)} MB / {(container.Stats.mem_total / 1024 ** 2).toFixed(2)} MB
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between text-xs text-gray-500">
          <div>Created: {formatDate(container.created)}</div>
        </div>
      </div>
    </div>
  );
};

export default ContainerCard;
