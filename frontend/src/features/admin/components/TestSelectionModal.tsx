import React, { useState } from 'react';
import { SelectionModal } from './SelectionModal';

export const TestSelectionModal: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  const handleSelect = (person: any) => {
    console.log('Selected person:', person);
    alert(`Selected: ${person.name}`);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-4">Test Selection Modal</h1>
      
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Test Actor Selection
      </button>

      <SelectionModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSelect={handleSelect}
        type="actor"
        title="Test Actor Selection"
        selectedIds={[]}
      />
    </div>
  );
};
