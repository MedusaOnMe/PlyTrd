'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useHotkeyStore } from '@/lib/store';

interface HotkeyConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  description: string;
}

const GLOBAL_HOTKEYS: HotkeyConfig[] = [
  {
    key: '/',
    handler: () => {
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    },
    description: 'Focus search',
  },
  {
    key: 'Escape',
    handler: () => {
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement) {
        activeElement.blur();
      }
    },
    description: 'Cancel / Unfocus',
  },
];

export function useGlobalHotkeys() {
  const router = useRouter();
  const { enabled } = useHotkeyStore();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger hotkeys when typing in inputs
      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Allow Escape even in inputs
      if (isInput && event.key !== 'Escape') {
        return;
      }

      for (const hotkey of GLOBAL_HOTKEYS) {
        const keyMatches = event.key.toLowerCase() === hotkey.key.toLowerCase();
        const ctrlMatches = hotkey.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatches = hotkey.shift ? event.shiftKey : !event.shiftKey;
        const altMatches = hotkey.alt ? event.altKey : !event.altKey;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          event.preventDefault();
          hotkey.handler();
          return;
        }
      }

      // Navigation hotkeys
      if (event.key === 'g' && !isInput) {
        // Wait for second key
        const secondKeyHandler = (e: KeyboardEvent) => {
          document.removeEventListener('keydown', secondKeyHandler);
          if (e.key === 'h') {
            router.push('/');
          } else if (e.key === 'm') {
            router.push('/markets');
          } else if (e.key === 'p') {
            router.push('/portfolio');
          }
        };
        document.addEventListener('keydown', secondKeyHandler, { once: true });
        setTimeout(() => {
          document.removeEventListener('keydown', secondKeyHandler);
        }, 1000);
      }
    },
    [enabled, router]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Hook for page-specific hotkeys
export function usePageHotkeys(hotkeys: HotkeyConfig[]) {
  const { enabled } = useHotkeyStore();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (isInput && event.key !== 'Escape') {
        return;
      }

      for (const hotkey of hotkeys) {
        const keyMatches = event.key.toLowerCase() === hotkey.key.toLowerCase();
        const ctrlMatches = hotkey.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatches = hotkey.shift ? event.shiftKey : !event.shiftKey;
        const altMatches = hotkey.alt ? event.altKey : !event.altKey;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          event.preventDefault();
          hotkey.handler();
          return;
        }
      }
    },
    [enabled, hotkeys]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Export hotkey config for reference
export const HOTKEY_REFERENCE = {
  global: [
    { keys: '/', description: 'Focus search' },
    { keys: 'Esc', description: 'Cancel / Unfocus' },
    { keys: 'g h', description: 'Go to Home' },
    { keys: 'g m', description: 'Go to Markets' },
    { keys: 'g p', description: 'Go to Portfolio' },
  ],
  market: [
    { keys: 'B', description: 'Buy mode' },
    { keys: 'S', description: 'Sell mode' },
    { keys: 'W', description: 'Add/remove from watchlist' },
    { keys: '1-9', description: 'Quick amounts' },
    { keys: 'Enter', description: 'Submit order' },
  ],
};
