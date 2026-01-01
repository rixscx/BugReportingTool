import { useState, useCallback, useEffect } from 'react';

/**
 * Hook for persisting state to localStorage
 * @param {string} key - The localStorage key
 * @param {*} defaultValue - Default value if nothing is stored
 * @returns {[any, Function, Function]} - [value, setValue, removeValue]
 */
export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setStoredValue = useCallback((newValue) => {
    try {
      const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
      setValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch {
    }
  }, [key, value]);

  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setValue(defaultValue);
    } catch {
    }
  }, [key, defaultValue]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setValue(JSON.parse(e.newValue));
        } catch {
          setValue(e.newValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [value, setStoredValue, removeValue];
}

/**
 * Hook for managing recent searches
 * @param {string} key - localStorage key
 * @param {number} maxItems - Maximum number of items to store
 */
export function useRecentSearches(key = 'recentSearches', maxItems = 5) {
  const [searches, setSearches, clearSearches] = useLocalStorage(key, []);

  const addSearch = useCallback((search) => {
    if (!search?.trim()) return;
    
    setSearches((prev) => {
      // Remove if already exists, add to front
      const filtered = prev.filter((s) => s.toLowerCase() !== search.toLowerCase());
      return [search, ...filtered].slice(0, maxItems);
    });
  }, [setSearches, maxItems]);

  const removeSearch = useCallback((search) => {
    setSearches((prev) => prev.filter((s) => s !== search));
  }, [setSearches]);

  return { searches, addSearch, removeSearch, clearSearches };
}
