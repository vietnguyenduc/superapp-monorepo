// Script to seed product catalog data from Excel sample into Supabase database
import { createClient } from '@supabase/supabase-js';
import { SAMPLE_PRODUCT_CATALOG } from '../types/product-catalog';

// Supabase configuration
const supabaseUrl = 'https://your-project.supabase.co'; // Replace with your actual URL
const supabaseKey = 'your-anon-key'; // Replace with your actual anon key

const supabase = createClient(supabaseUrl, supabaseKey);

// Convert ProductCatalogItem to database format
const convertToDbFormat = (item: any) => ({
  product_code: item.productCode,
  product_name: item.productName,
  unit: item.unit,
  price: item.price,
  category: item.category,
  notes: item.notes,
  is_active: item.isActive,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

async function seedProductCatalog() {
  console.log('🌱 Starting to seed product catalog data...');
  
  try {
    // Clear existing data (optional)
    console.log('🗑️ Clearing existing product catalog data...');
    const { error: deleteError } = await supabase
      .from('product_catalog')
      .delete()
      .neq('id', ''); // Delete all records
    
    if (deleteError) {
      console.warn('Warning: Could not clear existing data:', deleteError.message);
    }

    // Insert sample data
    console.log('📊 Inserting sample product catalog data...');
    const dbData = SAMPLE_PRODUCT_CATALOG.map(convertToDbFormat);
    
    const { data, error } = await supabase
      .from('product_catalog')
      .insert(dbData)
      .select();

    if (error) {
      console.error('❌ Error inserting data:', error);
      return;
    }

    console.log(`✅ Successfully inserted ${data?.length || 0} product catalog items!`);
    console.log('📋 Sample data:');
    data?.slice(0, 3).forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.product_name} (${item.product_code}) - ${item.price.toLocaleString('vi-VN')} VNĐ`);
    });
    
    if (data && data.length > 3) {
      console.log(`   ... and ${data.length - 3} more items`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the seeder
if (require.main === module) {
  seedProductCatalog()
    .then(() => {
      console.log('🎉 Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

export { seedProductCatalog };
