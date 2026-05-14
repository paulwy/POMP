import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type ViewType = 'workbench' | 'portal';

interface ViewState {
  currentView: ViewType;
  isInitialized: boolean;
  setView: (view: ViewType) => void;
  toggleView: () => void;
  setInitialized: () => void;
}

const useViewStore = create<ViewState>()(
  persist(
    (set, get) => ({
      currentView: 'workbench',
      isInitialized: false,
      setView: (view: ViewType) => {
        set({ currentView: view });
      },
      toggleView: () => {
        const newView = get().currentView === 'workbench' ? 'portal' : 'workbench';
        set({ currentView: newView });
      },
      setInitialized: () => {
        set({ isInitialized: true });
      },
    }),
    {
      name: 'view-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setInitialized();
        }
      },
    }
  )
);

export default useViewStore;
