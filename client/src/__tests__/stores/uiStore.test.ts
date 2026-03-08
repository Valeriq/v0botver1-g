import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../../stores/uiStore';

describe('useUIStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should have initial state', () => {
    const state = useUIStore.getState();
    expect(state.sidebarOpen).toBe(true);
    expect(state.theme).toBe('system');
    expect(state.activeModal).toBe(null);
  });

  it('should toggle sidebar', () => {
    const { toggleSidebar } = useUIStore.getState();
    toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(false);
    toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it('should set theme', () => {
    const { setTheme } = useUIStore.getState();
    setTheme('dark');
    expect(useUIStore.getState().theme).toBe('dark');
  });

  it('should open and close modal', () => {
    const { openModal, closeModal } = useUIStore.getState();
    openModal('test-modal');
    expect(useUIStore.getState().activeModal).toBe('test-modal');
    closeModal();
    expect(useUIStore.getState().activeModal).toBe(null);
  });
});
