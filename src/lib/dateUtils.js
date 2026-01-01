/**
 * Format a date to relative time (e.g., "2 hours ago", "3 days ago")
 * @param {Date|string|number} date - The date to format
 * @param {Object} options - Configuration options
 * @param {boolean} options.addSuffix - Add "ago" suffix (default: true)
 * @param {string} options.locale - Locale for formatting (default: 'en')
 * @returns {string} - Formatted relative time string
 */
export function formatRelativeTime(date, { addSuffix = true } = {}) {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now - then) / 1000);
  
  // Handle future dates
  if (seconds < 0) {
    return addSuffix ? 'in the future' : 'future';
  }

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      const plural = count !== 1 ? 's' : '';
      const timeStr = `${count} ${interval.label}${plural}`;
      return addSuffix ? `${timeStr} ago` : timeStr;
    }
  }

  return addSuffix ? 'just now' : 'now';
}

/**
 * Format a date to a human-readable string
 * @param {Date|string|number} date - The date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date string
 */
export function formatDate(date, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(new Date(date));
}

/**
 * Format a date with time
 * @param {Date|string|number} date - The date to format
 * @returns {string} - Formatted date and time string
 */
export function formatDateTime(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
}

/**
 * Check if a date is today
 * @param {Date|string|number} date - The date to check
 * @returns {boolean}
 */
export function isToday(date) {
  const today = new Date();
  const checkDate = new Date(date);
  return (
    checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is yesterday
 * @param {Date|string|number} date - The date to check
 * @returns {boolean}
 */
export function isYesterday(date) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const checkDate = new Date(date);
  return (
    checkDate.getDate() === yesterday.getDate() &&
    checkDate.getMonth() === yesterday.getMonth() &&
    checkDate.getFullYear() === yesterday.getFullYear()
  );
}

/**
 * Smart date formatter - shows relative time for recent dates, absolute for older
 * @param {Date|string|number} date - The date to format
 * @returns {string} - Smartly formatted date string
 */
export function formatSmartDate(date) {
  const then = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now - then) / 1000);
  
  // Less than 1 minute
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  // Less than 1 hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  }
  
  // Less than 24 hours
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }
  
  // Yesterday
  if (isYesterday(date)) {
    return `Yesterday at ${then.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })}`;
  }
  
  // Within the last week
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
  
  // Older - show full date
  return formatDate(date);
}
