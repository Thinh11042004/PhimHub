// Debug utility for favorites functionality
export const favoritesDebug = {
  log: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`[Favorites Debug] ${message}`, data);
    }
  },
  
  checkEventHandling: (event: React.MouseEvent) => {
    if (import.meta.env.DEV) {
      console.log('[Favorites Debug] Event details:', {
        type: event.type,
        target: event.target,
        currentTarget: event.currentTarget,
        defaultPrevented: event.defaultPrevented,
        propagationStopped: event.isPropagationStopped()
      });
    }
  },
  
  checkFavoritesState: (isFavorited: boolean, itemId: string) => {
    if (import.meta.env.DEV) {
      console.log(`[Favorites Debug] Item ${itemId} isFavorited: ${isFavorited}`);
    }
  },
  
  checkAPIResponse: (response: any, action: string) => {
    if (import.meta.env.DEV) {
      console.log(`[Favorites Debug] API ${action} response:`, response);
    }
  }
};
