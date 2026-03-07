/**
 * @fileoverview Zustand store for UI state management
 * Manages sidebar visibility, theme preferences, and modal state
 * Persists user preferences to localStorage
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Theme options for the application
 */
type Theme = 'light' | 'dark' | 'system';

/**
 * UI state interface defining all state and actions
 */
interface UIState {
  /** Whether the sidebar is open */
  sidebarOpen: boolean;
  /** Current theme preference */
  theme: Theme;
  /** Currently active modal ID (null if no modal is open) */
  activeModal: string | null;
  
  /** Toggle sidebar visibility */
  toggleSidebar: () => void;
  /** Set sidebar open state directly */
  setSidebarOpen: (open: boolean) => void;
  /** Change the theme */
  setTheme: (theme: Theme) => void;
  /** Open a modal by ID */
  openModal: (id: string) => void;
  /** Close the current modal */
  closeModal: () => void;
}

/**
 * Zustand store for UI state management
 * Uses persist middleware to save sidebarOpen and theme to localStorage
 */
export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial state
      sidebarOpen: true,
      theme: 'system',
      activeModal: null,
      
      // Actions
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => set({ theme }),
      openModal: (id) => set({ activeModal: id }),
      closeModal: () => set({ activeModal: null }),
    }),
    {
      name: 'coldbot-ui-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist sidebarOpen and theme, not activeModal
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
      }),
    }
  )
);
