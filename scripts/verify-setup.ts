/**
 * Verification script to check database tables and storage bucket
 */
import { supabase } from '../src/db/supabaseClient.js'

async function verifySetup() {
  console.log('\n🔍 Verifying Supabase Setup...\n')

  if (!supabase) {
    console.error('❌ Supabase client not initialized')
    process.exit(1)
  }

  // Check content_common table
  console.log('1. Checking content_common table...')
  const { data: commonData, error: commonError } = await supabase
    .from('content_common')
    .select('id')
    .limit(1)

  if (commonError && commonError.code !== 'PGRST116') {
    console.error('❌ Error accessing content_common:', commonError.message)
  } else {
    console.log('✅ content_common table exists')
  }

  // Check content_pages table
  console.log('2. Checking content_pages table...')
  const { data: pagesData, error: pagesError } = await supabase
    .from('content_pages')
    .select('id')
    .limit(1)

  if (pagesError && pagesError.code !== 'PGRST116') {
    console.error('❌ Error accessing content_pages:', pagesError.message)
  } else {
    console.log('✅ content_pages table exists')
  }

  // Check blog_posts table
  console.log('3. Checking blog_posts table...')
  const { data: blogData, error: blogError } = await supabase
    .from('blog_posts')
    .select('id')
    .limit(1)

  if (blogError && blogError.code !== 'PGRST116') {
    console.error('❌ Error accessing blog_posts:', blogError.message)
  } else {
    console.log('✅ blog_posts table exists')
  }

  // Check storage buckets
  console.log('4. Checking storage buckets...')
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()

  if (bucketError) {
    console.error('❌ Error accessing storage:', bucketError.message)
  } else {
    console.log(`✅ Storage accessible (${buckets?.length || 0} buckets found)`)
    if (buckets && buckets.length > 0) {
      buckets.forEach(bucket => {
        console.log(`   • ${bucket.name} (${bucket.public ? 'public' : 'private'})`)
      })
    }

    // Check if 'images' bucket exists
    const imagesBucket = buckets?.find(b => b.name === 'images')
    if (imagesBucket) {
      console.log('✅ images bucket exists')
    } else {
      console.log('⚠️  images bucket not found - you may need to create it in Supabase dashboard')
    }
  }

  console.log('\n✅ Verification complete!\n')
}

verifySetup().catch(console.error)
