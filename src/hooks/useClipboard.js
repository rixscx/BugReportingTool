import { useState, useCallback, useRef } from 'react';

/**
 * Hook for copying text to clipboard with feedback
 * Inspired by Mantine's useClipboard hook
 * @param {Object} options - Configuration options
 * @param {number} options.timeout - Time in ms before copied state resets (default: 2000)
 * @returns {Object} - { copy, copied, error, reset }
 */
export function useClipboard({ timeout = 2000 } = {}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const timeoutRef = useRef(null);

  const reset = useCallback(() => {
    setCopied(false);
    setError(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const copy = useCallback(async (value) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    try {
      if ('clipboard' in navigator) {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setError(null);
        
        // Reset after timeout
        timeoutRef.current = setTimeout(() => {
          setCopied(false);
        }, timeout);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = value;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          setCopied(true);
          setError(null);
          timeoutRef.current = setTimeout(() => {
            setCopied(false);
          }, timeout);
        } else {
          throw new Error('Copy command failed');
        }
      }
    } catch (err) {
      setError(err);
      setCopied(false);
    }
  }, [timeout]);

  return { copy, copied, error, reset };
}
