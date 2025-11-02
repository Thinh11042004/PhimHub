import React, { useState, useEffect } from 'react';
import { customListsService, CustomList } from '../../services/customLists';
import { CreateListDialog } from './CreateListDialog';

interface AddToListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  movieId: string;
  movieType: 'movie' | 'series';
  movieTitle: string;
}

export const AddToListDialog: React.FC<AddToListDialogProps> = ({
  isOpen,
  onClose,
  movieId,
  movieType,
  movieTitle
}) => {
  const [lists, setLists] = useState<CustomList[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [movieInLists, setMovieInLists] = useState<number[]>([]);

  // Load lists when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadLists();
      checkMovieInLists();
    }
  }, [isOpen, movieId, movieType]);

  const loadLists = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userLists = await customListsService.getUserLists();
      setLists(userLists);
    } catch (error: any) {
      setError(error.message || 'Không thể tải danh sách');
    } finally {
      setIsLoading(false);
    }
  };

  const checkMovieInLists = async () => {
    try {
      const listIds = await customListsService.checkMovieInLists(movieId, movieType);
      setMovieInLists(listIds);
    } catch (error) {
      console.error('Error checking movie in lists:', error);
    }
  };

  const handleAddToList = async (listId: number) => {
    setIsAdding(true);
    setError(null);
    setSuccess(null);

    try {
      await customListsService.addMovieToList(listId, {
        movieId,
        movieType
      });
      
      setMovieInLists(prev => [...prev, listId]);
      
      // Refresh lists to update item count
      await loadLists();
      
      // Show success message and close dialog after a short delay
      setSuccess(`Đã thêm "${movieTitle}" vào danh sách thành công`);
      // Dispatch event for parent component to show notification
      window.dispatchEvent(new CustomEvent('listAddSuccess', { detail: { movieId, movieTitle, listId } }));
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      setError(error.message || 'Không thể thêm phim vào danh sách');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveFromList = async (listId: number) => {
    setIsAdding(true);
    setError(null);
    setSuccess(null);

    try {
      await customListsService.removeMovieFromList(listId, {
        movieId,
        movieType
      });
      
      setSuccess(`Đã xóa "${movieTitle}" khỏi danh sách`);
      setMovieInLists(prev => prev.filter(id => id !== listId));
      // Dispatch event for parent component
      window.dispatchEvent(new CustomEvent('listRemoveSuccess', { detail: { movieId, movieTitle, listId } }));
      
      // Refresh lists to update item count
      await loadLists();
    } catch (error: any) {
      setError(error.message || 'Không thể xóa phim khỏi danh sách');
    } finally {
      setIsAdding(false);
    }
  };

  const handleCreateListSuccess = () => {
    setShowCreateDialog(false);
    loadLists();
  };

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    setMovieInLists([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden ring-1 ring-gray-700/50">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
            <div>
              <h2 className="text-xl font-bold text-white">Thêm vào danh sách</h2>
              <p className="text-sm text-gray-300 mt-1">{movieTitle}</p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-200 transition-colors p-2 hover:bg-gray-800/50 rounded-full"
              disabled={isAdding}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Messages */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-300 text-sm">{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-300 text-sm">{success}</span>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-gray-300">Đang tải danh sách...</span>
                </div>
              </div>
            ) : (
              <>
                {/* Lists */}
                {lists.length > 0 ? (
                  <div className="space-y-3">
                    {lists.map((list) => {
                      const isInList = movieInLists.includes(list.id);
                      return (
                        <div
                          key={list.id}
                          className="flex items-center justify-between p-4 border border-gray-700/30 rounded-xl hover:bg-gray-800/50 transition-colors bg-gray-800/30"
                        >
                          <div className="flex-1">
                            <h3 className="font-medium text-white">{list.name}</h3>
                            {list.description && (
                              <p className="text-sm text-gray-400 mt-1">{list.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>{list.itemCount} phim</span>
                              {list.isPublic && (
                                <span className="flex items-center">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  Công khai
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => isInList ? handleRemoveFromList(list.id) : handleAddToList(list.id)}
                            disabled={isAdding}
                            className={`ml-4 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                              isInList
                                ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30'
                                : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30'
                            }`}
                          >
                            {isInList ? 'Xóa' : 'Thêm'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <h3 className="text-lg font-medium text-white mb-2">Chưa có danh sách nào</h3>
                    <p className="text-gray-400 mb-4">Tạo danh sách đầu tiên để lưu phim yêu thích</p>
                  </div>
                )}

                {/* Create New List Button */}
                <div className="mt-6 pt-4 border-t border-gray-700/50">
                  <button
                    onClick={() => setShowCreateDialog(true)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center shadow-lg"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Tạo danh sách mới
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Create List Dialog */}
      <CreateListDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={handleCreateListSuccess}
      />
    </>
  );
};

export default AddToListDialog;
