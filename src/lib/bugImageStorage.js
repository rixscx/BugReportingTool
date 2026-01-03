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
 * - Images are explicitly deleted when bug is deleted (see deleteBugImages)
 * - Filename format ensures uniqueness per bug: {title}-{reporter}.png
 * 
 * This module is FORBIDDEN from being used for avatar operations.
 * Avatar uploads have their own dedicated logic.
 */

import { supabase } from './supabaseClient'

// STORAGE ISOLATION INVARIANT: Hardcoded bucket name - NEVER parameterize
const BUG_IMAGES_BUCKET = 'Bug images'
const BUG_IMAGE_ROOT = 'bugs'

const buildObjectPath = (ownerId, bugId, fileName) => `${BUG_IMAGE_ROOT}/${ownerId}/${bugId}/${fileName}`

const getCurrentUserId = async () => {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  const userId = userData?.user?.id || null
  if (userError || !userId) {
    throw new Error('INVARIANT VIOLATION: Unable to resolve authenticated user for storage path')
  }
  return userId
}

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
export async function uploadBugImage(imageFile, bugId, bugTitle, reporter) {
  // STORAGE ISOLATION INVARIANT: Validate ALL required parameters
  if (!imageFile) {
    throw new Error('INVARIANT VIOLATION: imageFile is required for bug image upload')
  }
  if (!bugId || typeof bugId !== 'string') {
    throw new Error('INVARIANT VIOLATION: bugId is required for bug image upload')
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

  // RLS COMPLIANCE: Object path must be prefixed with auth.uid()
  const userId = await getCurrentUserId()
  const objectPath = buildObjectPath(userId, bugId, fileName)
  
  // STORAGE ISOLATION INVARIANT: Upload to hardcoded bucket ONLY
  const { error: uploadError } = await supabase.storage
    .from(BUG_IMAGES_BUCKET) // INVARIANT: Uses constant, never parameterized
    .upload(objectPath, imageFile, { upsert: true })
  
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
    .createSignedUrl(objectPath, 31536000) // 1 year in seconds
  
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
    console.log('✅ Bug image uploaded:', objectPath)
  }
  
  return data.signedUrl
}

export async function listBugImages(ownerId, bugId) {
  if (!ownerId || !bugId) return []
  const prefix = `${BUG_IMAGE_ROOT}/${ownerId}/${bugId}`

  const { data: files, error } = await supabase.storage
    .from(BUG_IMAGES_BUCKET)
    .list(prefix, { limit: 20 })

  if (error || !files || files.length === 0) return []

  const signed = await Promise.all(files.map(async (file) => {
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from(BUG_IMAGES_BUCKET)
      .createSignedUrl(`${prefix}/${file.name}`, 31536000)
    if (urlError || !signedUrlData?.signedUrl) return null
    return signedUrlData.signedUrl
  }))

  return signed.filter(Boolean)
}

export async function getBugPreviewImage(ownerId, bugId) {
  const images = await listBugImages(ownerId, bugId)
  return images[0] || null
}

export async function deleteBugImages(ownerId, bugId) {
  if (!ownerId || !bugId) return { success: true }
  const prefix = `${BUG_IMAGE_ROOT}/${ownerId}/${bugId}`
  try {
    const { data: files, error: listError } = await supabase.storage
      .from(BUG_IMAGES_BUCKET)
      .list(prefix, { limit: 50 })

    if (listError || !files || files.length === 0) {
      return { success: true }
    }

    const paths = files.map((file) => `${prefix}/${file.name}`)
    const { error: deleteError } = await supabase.storage
      .from(BUG_IMAGES_BUCKET)
      .remove(paths)

    if (deleteError) {
      console.error('❌ STORAGE LIFECYCLE: Bug image delete failed:', {
        bucket: BUG_IMAGES_BUCKET,
        prefix,
        error: deleteError.message
      })
      return { success: false, error: deleteError.message }
    }

    return { success: true }
  } catch (err) {
    console.error('❌ STORAGE LIFECYCLE: Unexpected error deleting bug images:', err)
    return { success: false, error: err.message }
  }
}
