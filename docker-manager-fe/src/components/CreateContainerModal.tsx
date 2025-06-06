import { CreateOptions } from '../types';
import React, { useState } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

interface CreateContainerFormState {
  name: string,
  registry: string,
  image: string,
  version: string,
  commands: string,
}

interface CreateContainerModalProps {
  onClose: () => void;
  onCreateContainer: (data: CreateOptions) => Promise<void>;
}

const CreateContainerModal: React.FC<CreateContainerModalProps> = ({ onClose, onCreateContainer }) => {
  const [formData, setFormData] = useState<CreateContainerFormState>({
    name: '',
    registry: '',
    image: '',
    version: '',
    commands: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, setError] = useState<string | null>(null);
  //const { showToast } = useToast()
  // Disabled for consistency
  //const handleCreate = async (data: CreateOptions) => {
  //  const success = await onCreateContainer(data);
  //  if (success) {
  //    showToast({
  //      type: 'success',
  //      message: 'Container created succesfully!'
  //    })
  //    onClose()
  //  } else {
  //    showToast({
  //      type: 'error',
  //      message: 'Failed to create container.'
  //    })
  //  }
  //}

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const preparedData: CreateOptions = {
      ...formData,
      commands:
        typeof formData.commands === "string"
          ? formData.commands
            .split(",")
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0)
          : formData.commands,
    };
    try {
      await onCreateContainer(preparedData)
    } catch (err) {
      setError("Failed to create container.")
    } finally {
      setIsSubmitting(false)
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 transition-opacity duration-300 ease-in-out">
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-in"
        style={{
          animationDuration: '0.25s',
          transform: 'scale(1)',
          opacity: 1
        }}
      >
        {/* Header */}
        <div className="border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Create New Container</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-auto p-4">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Container Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                  placeholder="my-container"
                />
              </div>

              <div>
                <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                  Image
                </label>
                <input
                  type="text"
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                  placeholder="nginx:latest"
                />
              </div>

              <div>
                <label htmlFor="command" className="block text-sm font-medium text-gray-700">
                  Commands
                </label>
                <input
                  type="text"
                  id="command"
                  name="commands"
                  value={formData.commands}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                  placeholder="nginx -g 'daemon off;'"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Optional command to run in the container, use a ',' to separate between them.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end space-x-3">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={isSubmitting}
              >
                Create Container
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateContainerModal;
