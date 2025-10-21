import React, { useState } from 'react';
import { SelectionModal } from '../features/admin/components/SelectionModal';

export const TestSelection: React.FC = () => {
  const [showActorModal, setShowActorModal] = useState(false);
  const [showDirectorModal, setShowDirectorModal] = useState(false);
  const [selectedActors, setSelectedActors] = useState<string[]>([]);
  const [selectedDirectors, setSelectedDirectors] = useState<string[]>([]);

  const handleActorSelect = (actor: any) => {
    console.log('Selected actor:', actor);
    setSelectedActors(prev => [...prev, actor.name]);
    setShowActorModal(false);
  };

  const handleDirectorSelect = (director: any) => {
    console.log('Selected director:', director);
    setSelectedDirectors(prev => [...prev, director.name]);
    setShowDirectorModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Test Selection Modal</h1>
        
        <div className="space-y-6">
          {/* Actors Section */}
          <div className="bg-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Diễn viên đã chọn</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedActors.map((actor, index) => (
                <span key={index} className="bg-emerald-500/20 text-emerald-200 px-3 py-1 rounded-full text-sm border border-emerald-500/30">
                  {actor}
                </span>
              ))}
            </div>
            <button
              onClick={() => setShowActorModal(true)}
              className="bg-emerald-500/20 text-emerald-200 px-4 py-2 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
            >
              + Thêm diễn viên
            </button>
          </div>

          {/* Directors Section */}
          <div className="bg-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Đạo diễn đã chọn</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedDirectors.map((director, index) => (
                <span key={index} className="bg-amber-500/20 text-amber-200 px-3 py-1 rounded-full text-sm border border-amber-500/30">
                  {director}
                </span>
              ))}
            </div>
            <button
              onClick={() => setShowDirectorModal(true)}
              className="bg-amber-500/20 text-amber-200 px-4 py-2 rounded-lg border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
            >
              + Thêm đạo diễn
            </button>
          </div>
        </div>

        {/* Modals */}
        <SelectionModal
          open={showActorModal}
          onClose={() => setShowActorModal(false)}
          onSelect={handleActorSelect}
          type="actor"
          title="Chọn diễn viên"
          selectedIds={[]}
        />
        
        <SelectionModal
          open={showDirectorModal}
          onClose={() => setShowDirectorModal(false)}
          onSelect={handleDirectorSelect}
          type="director"
          title="Chọn đạo diễn"
          selectedIds={[]}
        />
      </div>
    </div>
  );
};
