/**
 * Application-wide constants and configuration
 * Centralizing these values makes the app easier to maintain
 */

// Bug status options
export const BUG_STATUSES = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
}

export const BUG_STATUS_LIST = [
  BUG_STATUSES.OPEN,
  BUG_STATUSES.IN_PROGRESS,
  BUG_STATUSES.RESOLVED,
]

// Bug priority options
export const BUG_PRIORITIES = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
}

export const BUG_PRIORITY_LIST = [
  BUG_PRIORITIES.LOW,
  BUG_PRIORITIES.MEDIUM,
  BUG_PRIORITIES.HIGH,
]

// Priority sort order (for sorting bugs by priority)
export const PRIORITY_ORDER = {
  [BUG_PRIORITIES.HIGH]: 1,
  [BUG_PRIORITIES.MEDIUM]: 2,
  [BUG_PRIORITIES.LOW]: 3,
}

// Color mappings for status badges
export const STATUS_COLORS = {
  [BUG_STATUSES.OPEN]: 'bg-blue-100 text-blue-800',
  [BUG_STATUSES.IN_PROGRESS]: 'bg-purple-100 text-purple-800',
  [BUG_STATUSES.RESOLVED]: 'bg-green-100 text-green-800',
}

// Color mappings for priority badges
export const PRIORITY_COLORS = {
  [BUG_PRIORITIES.LOW]: 'bg-green-100 text-green-800',
  [BUG_PRIORITIES.MEDIUM]: 'bg-yellow-100 text-yellow-800',
  [BUG_PRIORITIES.HIGH]: 'bg-red-100 text-red-800',
}

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
}

// File upload configuration
export const FILE_UPLOAD = {
  MAX_SIZE: 2 * 1024 * 1024, // 2MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
}

// Activity types
export const ACTIVITY_TYPES = {
  STATUS_CHANGE: 'status_change',
  ASSIGNMENT_CHANGE: 'assignment_change',
  COMMENT_ADDED: 'comment_added',
}

// Keyboard shortcuts - descriptions for the help modal
export const KEYBOARD_SHORTCUTS = {
  NEW_BUG: 'Create new bug report',
  SEARCH: 'Focus search input',
  GO_HOME: 'Go to dashboard',
  ESCAPE: 'Close modal / Clear focus',
  HELP: 'Show keyboard shortcuts',
  CLOSE: 'Close modal',
  QUICK_ACTIONS: 'Open quick actions palette',
}

// Keyboard shortcut keys
export const SHORTCUT_KEYS = {
  NEW_BUG: 'n',
  SEARCH: '/',
  GO_HOME: 'g',
  ESCAPE: 'Escape',
  HELP: 'ctrl+/',
  QUICK_ACTIONS: 'ctrl+k',
}

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 12,
  PAGE_SIZE_OPTIONS: [6, 12, 24, 48],
}

// Date formatting options
export const DATE_FORMAT = {
  SHORT: { month: 'short', day: 'numeric' },
  LONG: { year: 'numeric', month: 'long', day: 'numeric' },
  WITH_TIME: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  },
}

// Validation rules
export const VALIDATION = {
  TITLE: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 200,
  },
  DESCRIPTION: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 5000,
  },
  COMMENT: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 2000,
  },
}

// Error messages
export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
}
