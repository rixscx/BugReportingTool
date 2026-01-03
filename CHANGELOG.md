# Changelog

All notable changes to the Bug Reporting Tool will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-01-03

### Added
- **Three-dot actions menu** in bug detail header with Archive/Restore/Delete options
- **Activity logging** for archive, restore, and delete actions with full audit trail
- **Restore function** to unarchive bugs from the bug detail page
- **SECURITY.md** documentation with comprehensive security hardening steps
  - RLS policies for profiles table
  - SECURITY DEFINER function hardening guidance
  - Security audit queries and testing procedures

### Changed
- **Archive action** now logs activity with metadata before navigation
- **Delete action** now logs activity BEFORE deletion for audit trail preservation
- **Restore action** added with activity logging and in-place refresh (no navigation)
- **Bug detail UI** enhanced with contextual actions menu
- Updated README with new features and version bump to 1.1.0

### Fixed
- **isAdmin prop** now properly passed to BugDetail component from App.jsx
- Activity logging consistency across all bug lifecycle actions

### Security
- Documented RLS enablement for profiles table
- Added search_path security guidance for SECURITY DEFINER functions
- Provided monitoring queries to audit security posture

## [1.0.0] - 2026-01-02

### Added
- **Schema alignment refactor**
  - Removed `image_url` column dependency from bugs table
  - Removed `steps_to_reproduce` column dependency from bugs table
  - Migrated to storage-only image handling with bugId-based paths
  - Added synthetic `steps_to_reproduce` parsing from description field

- **Storage improvements**
  - `bugImageStorage.js` helper module for isolated storage operations
  - Path pattern: `bugs/{userId}/{bugId}/filename`
  - Private bucket with signed URLs (1-year expiration)
  - Image listing, preview fetching, and bulk deletion helpers

- **Bug creation workflow**
  - Insert bug metadata first, then upload images with bugId
  - Automatic rollback on upload failure
  - Steps embedded in description with markdown section delimiter

- **Data fetching enhancements**
  - `useBugs` hook attaches preview_image from storage
  - Synthetic parsing extracts steps from description markdown
  - No database schema changes required

### Removed
- `image_url` references from all components and hooks
- `steps_to_reproduce` from database insert payloads
- `profiles!` relational joins (replaced with snapshot fields)

### Fixed
- Schema cache errors from non-existent columns
- Storage path isolation issues
- Image cleanup on bug deletion

## [0.9.0] - 2026-01-01

### Initial Release
- Complete bug tracking system with Supabase backend
- OAuth authentication with Google sign-in
- Real-time collaboration and comments
- Analytics dashboard with charts
- Kanban board and list views
- Activity timeline
- Keyboard shortcuts (Ctrl+K)
- Avatar system with custom uploads
- Account deletion workflow
- Mobile-responsive design

---

## Version History Summary

- **1.1.0** - Bug actions menu + activity logging + security docs
- **1.0.0** - Schema alignment refactor (storage-only images)
- **0.9.0** - Initial production release
