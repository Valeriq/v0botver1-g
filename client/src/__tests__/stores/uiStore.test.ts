/**
 * @fileoverview Tests for Zustand UI store
 * Tests state management for sidebar, theme, and modals
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useUIStore } from '@/stores/uiStore';

describe('useUIStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset the store to initial state
    useUIStore.setState({
      sidebarOpen: true,
      theme: 'system',
      activeModal: null,
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useUIStore.getState();
      
      expect(state.sidebarOpen).toBe(true);
      expect(state.theme).toBe('system');
      expect(state.activeModal).toBeNull();
    });

    it('should be callable and return state', () => {
      const store = useUIStore;
      
      expect(typeof store.getState).toBe('function');
      expect(store.getState()).toBeDefined();
    });
  });

  describe('sidebar actions', () => {
    it('should toggle sidebar from true to false', () => {
      const { toggleSidebar } = useUIStore.getState();
      
      expect(useUIStore.getState().sidebarOpen).toBe(true);
      
      toggleSidebar();
      
      expect(useUIStore.getState().sidebarOpen).toBe(false);
    });

    it('should toggle sidebar from false to true', () => {
      useUIStore.setState({ sidebarOpen: false });
      
      const { toggleSidebar } = useUIStore.getState();
      toggleSidebar();
      
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });

    it('should set sidebar open state directly', () => {
      const { setSidebarOpen } = useUIStore.getState();
      
      setSidebarOpen(false);
      expect(useUIStore.getState().sidebarOpen).toBe(false);
      
      setSidebarOpen(true);
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });
  });

  describe('theme actions', () => {
    it('should change theme to light', () => {
      const { setTheme } = useUIStore.getState();
      
      setTheme('light');
      
      expect(useUIStore.getState().theme).toBe('light');
    });

    it('should change theme to dark', () => {
      const { setTheme } = useUIStore.getState();
      
      setTheme('dark');
      
      expect(useUIStore.getState().theme).toBe('dark');
    });

    it('should change theme to system', () => {
      useUIStore.setState({ theme: 'dark' });
      
      const { setTheme } = useUIStore.getState();
      setTheme('system');
      
      expect(useUIStore.getState().theme).toBe('system');
    });
  });

  describe('modal actions', () => {
    it('should open a modal by id', () => {
      const { openModal } = useUIStore.getState();
      
      openModal('test-modal');
      
      expect(useUIStore.getState().activeModal).toBe('test-modal');
    });

    it('should close the modal', () => {
      useUIStore.setState({ activeModal: 'test-modal' });
      
      const { closeModal } = useUIStore.getState();
      closeModal();
      
      expect(useUIStore.getState().activeModal).toBeNull();
    });

    it('should replace active modal when opening another', () => {
      const { openModal } = useUIStore.getState();
      
      openModal('first-modal');
      openModal('second-modal');
      
      expect(useUIStore.getState().activeModal).toBe('second-modal');
    });
  });

  describe('persistence', () => {
    it('should persist state to localStorage under coldbot-ui-storage key', () => {
      const { setTheme, setSidebarOpen } = useUIStore.getState();
      
      setTheme('dark');
      setSidebarOpen(false);
      
      // Check that localStorage was updated
      const stored = localStorage.getItem('coldbot-ui-storage');
      expect(stored).not.toBeNull();
      
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.state.theme).toBe('dark');
        expect(parsed.state.sidebarOpen).toBe(false);
      }
    });

    it('should only persist sidebarOpen and theme (not activeModal)', () => {
      const { setTheme, openModal } = useUIStore.getState();
      
      setTheme('light');
      openModal('test-modal');
      
      const stored = localStorage.getItem('coldbot-ui-storage');
      
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.state.theme).toBe('light');
        expect(parsed.state.sidebarOpen).toBeDefined();
        // activeModal should not be persisted
        expect(parsed.state.activeModal).toBeUndefined();
      }
    });
  });
});
