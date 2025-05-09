import React from 'react';
import { RefreshCw, Plus } from 'lucide-react';
import Button from './Button';

interface HeaderProps {
  onRefresh: () => void;
  onCreateContainer: () => void;
  isRefreshing: boolean;
}

const Header: React.FC<HeaderProps> = ({ onRefresh, onCreateContainer, isRefreshing }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-gray-900">Docker Manager</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={onRefresh} 
              isLoading={isRefreshing}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Refresh
            </Button>
            
            <Button 
              variant="primary" 
              onClick={onCreateContainer}
              icon={<Plus className="h-4 w-4" />}
            >
              New Container
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;