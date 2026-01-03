/**
 * STORAGE ISOLATION INVARIANT - Bug Image Storage Helper
 * 
 * CRITICAL INVARIANTS:
 * 1. ONLY for "Bug images" bucket - HARDCODED, never parameterized
 * 2. NEVER reused for avatar uploads - separate concerns
 * 3. MUST fail loudly on errors - no silent failures
 * 4. NO shared logic with avatar uploads
 * 5. Required parameters: imageFile, bugTitle, reporter object
 * 
 * PHASE 3 — BUG IMAGE LIFECYCLE:
 * - Images are uploaded with upsert: true (replaces if exists)
 * - Old images are automatically replaced when bug image is updated
 * - Images are explicitly deleted when bug is deleted (see deleteBugImage)
 * - Filename format ensures uniqueness per bug: {title}-{reporter}.png
 * 
 * This module is FORBIDDEN from being used for avatar operations.
 * Avatar uploads have their own dedicated logic.
 */

import { supabase } from './supabaseClient'

// STORAGE ISOLATION INVARIANT: Hardcoded bucket name - NEVER parameterize
const BUG_IMAGES_BUCKET = 'Bug images'

/**
 * Upload a bug image to Supabase Storage "Bug images" bucket
 * 
 * STORAGE ISOLATION INVARIANT: This function is ONLY for bug images.
 * DO NOT use this for avatar uploads. DO NOT parameterize the bucket.
 * 
 * @param {File} imageFile - The image file to upload (REQUIRED)
 * @param {string} bugTitle - The bug title for filename (REQUIRED)
 * @param {Object} reporter - Reporter info with full_name, username, email (REQUIRED)
 * @returns {Promise<string>} The public URL of the uploaded image
 * @throws {Error} If upload fails, validation fails, or invariants violated
 */
export async function uploadBugImage(imageFile, bugTitle, reporter) {
  // STORAGE ISOLATION INVARIANT: Validate ALL required parameters
  if (!imageFile) {
    throw new Error('INVARIANT VIOLATION: imageFile is required for bug image upload')
  }
  
  if (!bugTitle || typeof bugTitle !== 'string' || bugTitle.trim().length === 0) {
    throw new Error('INVARIANT VIOLATION: Valid bugTitle is required for bug image upload')
  }
  
  if (!reporter || typeof reporter !== 'object') {
    throw new Error('INVARIANT VIOLATION: reporter object is required for bug image upload')
  }
  
  // STORAGE ISOLATION: Determine reporter name with strict priority
  const reportedBy = reporter.full_name || 
                     reporter.username || 
                     (reporter.email ? reporter.email.split('@')[0] : null)
  
  if (!reportedBy) {
    throw new Error('INVARIANT VIOLATION: Could not determine reporter name from profile')
  }
  
  // Sanitize bug title for filename
  const sanitizedTitle = bugTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50)
  
  if (sanitizedTitle.length === 0) {
    throw new Error('INVARIANT VIOLATION: Bug title resulted in empty filename after sanitization')
  }
  
  // Sanitize reporter name
  const sanitizedReporter = reportedBy
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  
  if (sanitizedReporter.length === 0) {
    throw new Error('INVARIANT VIOLATION: Reporter name resulted in empty string after sanitization')
  }
  
  // Build strict filename format
  const fileName = `${sanitizedTitle}-${sanitizedReporter}.png`
  
  // STORAGE ISOLATION INVARIANT: Upload to hardcoded bucket ONLY
  const { error: uploadError } = await supabase.storage
    .from(BUG_IMAGES_BUCKET) // INVARIANT: Uses constant, never parameterized
    .upload(fileName, imageFile, { upsert: true })
  
  if (uploadError) {
    // DB/RLS AUDIT: Fail loudly with detailed error
    console.error('❌ STORAGE: Bug image upload failed:', {
      bucket: BUG_IMAGES_BUCKET,
      fileName,
      code: uploadError.statusCode,
      message: uploadError.message
    })
    throw new Error(`Failed to upload bug image: ${uploadError.message}`)
  }
  
  // STORAGE COMPLIANCE: Use signed URL for PRIVATE bucket (valid for 1 year)
  const { data, error: urlError } = await supabase.storage
    .from(BUG_IMAGES_BUCKET)
    .createSignedUrl(fileName, 31536000) // 1 year in seconds
  
  if (urlError || !data || !data.signedUrl) {
    // DB/RLS AUDIT: Fail loudly if URL generation fails
    console.error('❌ STORAGE: Failed to generate signed URL for bug image:', {
      bucket: BUG_IMAGES_BUCKET,
      fileName,
      error: urlError
    })
    throw new Error('Failed to generate signed URL for uploaded bug image')
  }
  
  // PERF POLISH: Remove noisy success log in production
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Bug image uploaded:', fileName)
  }
  
  return data.signedUrl
}

/**
 * STORAGE LIFECYCLE: Delete a bug image from Supabase Storage
 * Called when a bug is deleted to clean up associated images
 * 
 * INVARIANT: This function is ONLY for "Bug images" bucket
 * MUST NOT be used for avatar cleanup (avatars are user-controlled)
 * 
 * @param {string} imageUrl - The public URL of the image to delete
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteBugImage(imageUrl) {
  // STORAGE ISOLATION INVARIANT: Only process Bug images bucket URLs
  if (!imageUrl || typeof imageUrl !== 'string') {
    return { success: true } // No image to delete
  }
  
  // INVARIANT: Verify this is a Bug images bucket URL, not avatars
  if (!imageUrl.includes('Bug%20images') && !imageUrl.includes('Bug images')) {
    console.error('❌ STORAGE ISOLATION: Attempted to delete non-bug-image:', imageUrl)
    throw new Error('INVARIANT VIOLATION: deleteBugImage called with non-bug-image URL')
  }
  
  try {
    // Extract filename from URL
    const urlParts = imageUrl.split('/')
    const fileName = decodeURIComponent(urlParts[urlParts.length - 1])
    
    if (!fileName) {
      return { success: true } // No valid filename
    }
    
    // STORAGE LIFECYCLE: Delete from "Bug images" bucket ONLY (hardcoded)
    const { error: deleteError } = await supabase.storage
      .from('Bug images') // INVARIANT: Hardcoded bucket name
      .remove([fileName])
    
    if (deleteError) {
      console.error('❌ STORAGE LIFECYCLE: Bug image delete failed:', {
        bucket: 'Bug images',
        fileName,
        error: deleteError.message
      })
      // Return error but don't throw - bug deletion should still succeed
      return { success: false, error: deleteError.message }
    }
    
    return { success: true }
  } catch (err) {
    console.error('❌ STORAGE LIFECYCLE: Unexpected error deleting bug image:', err)
    return { success: false, error: err.message }
  }
}
