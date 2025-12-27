// Run with: npx tsx src/scripts/seed-products.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for admin operations
)

async function seedDatabase() {
  console.log('🌱 Seeding database...')

  try {
    // 1. Create Categories
    const categories = [
      {
        name: 'Game Top-ups',
        slug: 'game-top-ups',
        description: 'In-game currency and items for popular games',
        icon: '🎮',
        sort_order: 1
      },
      {
        name: 'Gift Cards',
        slug: 'gift-cards',
        description: 'Digital gift cards for international platforms',
        icon: '🎁',
        sort_order: 2
      },
      {
        name: 'VPN Services',
        slug: 'vpn-services',
        description: 'Secure and fast VPN subscriptions',
        icon: '🛡️',
        sort_order: 3
      },
      {
        name: 'Software & Tools',
        slug: 'software-tools',
        description: 'Premium software licenses and tools',
        icon: '💻',
        sort_order: 4
      }
    ]

    for (const category of categories) {
      const { data, error } = await supabase
        .from('categories')
        .upsert(category, { onConflict: 'slug' })
        .select()
        .single()

      if (error) throw error
      console.log(`✅ Created category: ${category.name}`)
    }

    // 2. Create Sample Products
    const { data: gameCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', 'game-top-ups')
      .single()

    const products = [
      {
        name: 'Free Fire Diamonds',
        slug: 'free-fire-diamonds',
        description: 'Official Free Fire diamonds for in-game purchases. Instant delivery to your email.',
        category_id: gameCategory?.id,
        featured_image: 'https://images.unsplash.com/photo-1618331833071-1c0c6ee3d19e?w=400&h=400&fit=crop',
        is_featured: true,
        has_variants: true,
        requires_manual_delivery: false
      },
      {
        name: 'PUBG Mobile UC',
        slug: 'pubg-mobile-uc',
        description: 'Get PUBG Mobile Unknown Cash (UC) instantly. Top up your account and unlock premium items.',
        category_id: gameCategory?.id,
        featured_image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&fit=crop',
        is_featured: true,
        has_variants: true,
        requires_manual_delivery: false
      },
      {
        name: 'Mobile Legends Diamonds',
        slug: 'mobile-legends-diamonds',
        description: 'Mobile Legends diamonds for heroes, skins, and battle passes.',
        category_id: gameCategory?.id,
        featured_image: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=400&h=400&fit=crop',
        is_featured: false,
        has_variants: true,
        requires_manual_delivery: false
      }
    ]

    for (const product of products) {
      const { data: createdProduct, error } = await supabase
        .from('products')
        .upsert(product, { onConflict: 'slug' })
        .select()
        .single()

      if (error) throw error

      // Create variants for each product
      const variants = [
        {
          product_id: createdProduct.id,
          variant_name: '100 Units',
          price: 100.00,
          original_price: 120.00,
          stock_type: 'codes',
          stock_quantity: 50
        },
        {
          product_id: createdProduct.id,
          variant_name: '500 Units',
          price: 450.00,
          original_price: 500.00,
          stock_type: 'codes',
          stock_quantity: 30
        },
        {
          product_id: createdProduct.id,
          variant_name: '1000 Units',
          price: 850.00,
          original_price: 1000.00,
          stock_type: 'codes',
          stock_quantity: 20
        }
      ]

      for (const variant of variants) {
        const { error: variantError } = await supabase
          .from('product_variants')
          .insert(variant)

        if (variantError) throw variantError
      }

      console.log(`✅ Created product: ${product.name}`)
    }

    console.log('🎉 Database seeding completed successfully!')

  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

seedDatabase()