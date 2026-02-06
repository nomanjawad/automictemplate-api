/**
 * Script to create the images storage bucket in Supabase
 * Run this once to set up the storage bucket for CMS images
 */
import { supabase } from '../src/db/supabaseClient.js'

async function createImagesBucket() {
  console.log('\n📦 Creating images storage bucket...\n')

  if (!supabase) {
    console.error('❌ Supabase client not initialized')
    process.exit(1)
  }

  // Create the images bucket
  const { data, error } = await supabase.storage.createBucket('images', {
    public: true,  // Public bucket for CMS images
    fileSizeLimit: 10485760,  // 10MB max file size
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ]
  })

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ images bucket already exists')
    } else {
      console.error('❌ Error creating bucket:', error.message)
      process.exit(1)
    }
  } else {
    console.log('✅ images bucket created successfully')
    console.log('   • Public: Yes')
    console.log('   • Max size: 10MB')
    console.log('   • Allowed types: JPEG, PNG, GIF, WebP, SVG')
  }

  console.log('\n✅ Storage setup complete!\n')
}

createImagesBucket().catch(console.error)
