import React, { useState } from 'react';
import ContainerCard from './ContainerCard';
import ContainerModal from './ContainerModal';
import CreateContainerModal from './CreateContainerModal';
import Header from './Header';
import { Container } from '../types';
import { useContainers } from '../hooks/useContainers';
import { Search } from 'lucide-react';

const Dashboard: React.FC = () => {
  const {
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
    logsError,
    stats,
    statsError
  } = useContainers();

  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchContainers();
    setIsRefreshing(false);
  };

  // Handle container selection
  const handleContainerSelect = (container: Container) => {
    setSelectedContainer(container);
  };

  // Filter containers by search term
  const filteredContainers = containers.filter(container => {
    const term = searchTerm.toLowerCase();
    return (
      (Array.isArray(container.names) ? container.names : [container.names]).some(name =>
        name.toLowerCase().includes(term)
      ) ||
      container.image.toLowerCase().includes(term) ||
      container.status.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        onRefresh={handleRefresh}
        onCreateContainer={() => setShowCreateModal(true)}
        isRefreshing={isRefreshing}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search containers by name, image, or status"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && !isRefreshing ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-500">Loading containers...</p>
          </div>
        ) : (
          <>
            {/* Container grid */}
            {filteredContainers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContainers.map(container => (
                  <ContainerCard
                    key={container.id}
                    container={container}
                    onClick={handleContainerSelect}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-gray-500">No containers found</p>
                {searchTerm && (
                  <p className="text-sm text-gray-400 mt-2">
                    Try adjusting your search or clear the filter
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Container detail modal */}
      {selectedContainer && (
        <ContainerModal
          container={selectedContainer}
          onClose={() => setSelectedContainer(null)}
          onStart={startContainer}
          onStop={stopContainer}
          onRestart={restartContainer}
          onDelete={deleteContainer}
          fetchContainerMetrics={fetchContainerMetrics}
          fetchContainerLogs={fetchContainerLogs}
          logs={logs || []}  // Provide empty array as fallback
          logsError={logsError}
          stats={stats || null}  // Provide empty array as fallback
          statsError={statsError}
        />
      )}

      {/* Create container modal */}
      {showCreateModal && (
        <CreateContainerModal
          onClose={() => setShowCreateModal(false)}
          onCreateContainer={async (data) => {
            const success = await createContainer(data);
            if (success) {
              setShowCreateModal(false)
            } else {
              alert("Failed to create container")
            }
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
