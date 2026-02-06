/**
 * Seed script to create initial home page data
 * Run with: npx tsx scripts/seed-home-page.ts
 */

import { supabase } from '../src/db/index.js'

async function seedHomePage() {
  if (!supabase) {
    console.error('❌ Supabase client not initialized')
    process.exit(1)
  }

  const homePageData = {
    title: 'Home Page',
    slug: 'home',
    data: {
      title: 'Welcome to SkyTech',
      banner: {
        title: 'Building the Future with Technology',
        description: 'We create innovative solutions that transform businesses and improve lives',
        backgroundImageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920',
        heroImageUrl: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800',
        button: {
          text: 'Get Started',
          url: '/contact'
        }
      }
    },
    meta_data: {
      metaTitle: 'Home - SkyTech | Building the Future',
      metaDescription: 'We create innovative solutions that transform businesses and improve lives'
    },
    published: true
  }

  console.log('🌱 Seeding home page data...')

  try {
    // Check if home page already exists
    const { data: existing } = await supabase
      .from('content_pages')
      .select('id, slug')
      .eq('slug', 'home')
      .single()

    if (existing) {
      console.log('📝 Home page already exists, updating...')
      const { data, error } = await supabase
        .from('content_pages')
        .update({
          title: homePageData.title,
          data: homePageData.data,
          meta_data: homePageData.meta_data,
          published: homePageData.published
        })
        .eq('slug', 'home')
        .select()
        .single()

      if (error) {
        console.error('❌ Error updating home page:', error.message)
        process.exit(1)
      }

      console.log('✅ Home page updated successfully!')
      console.log('📋 Data:', JSON.stringify(data, null, 2))
    } else {
      console.log('📝 Creating new home page...')
      const { data, error } = await supabase
        .from('content_pages')
        .insert(homePageData)
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating home page:', error.message)
        process.exit(1)
      }

      console.log('✅ Home page created successfully!')
      console.log('📋 Data:', JSON.stringify(data, null, 2))
    }

    console.log('\n🎉 Seeding complete!')
    console.log('🌐 You can now view the page at: http://localhost:3000/test-home-editor.html')
    process.exit(0)
  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message || error)
    process.exit(1)
  }
}

seedHomePage()
