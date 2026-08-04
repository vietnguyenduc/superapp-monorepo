const { createClient } = require('@supabase/supabase-js');

// Load Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'https://<your-project>.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '<your-anon-key>';

if (!supabaseUrl || supabaseUrl.includes('<your-project>') || !supabaseKey || supabaseKey.includes('<your-anon-key>')) {
  throw new Error('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Mock inventory data
const mockInventoryData = [
  {
    product_id: 'prod_001',
    product_code: 'TC001',
    product_name: 'Trà chanh đá',
    date: '2024-03-20',
    inbound_quantity: 150,
    book_inventory: 120,
    actual_inventory: 118,
    sales_quantity: 25,
    promotion_quantity: 5,
    special_outbound_quantity: 0,
    variance: -2,
    variance_percentage: -1.67,
    notes: 'Kiểm kê cuối ngày - thiếu 2 ly do làm vỡ'
  },
  {
    product_id: 'prod_002',
    product_code: 'TC002',
    product_name: 'Cà phê sữa đá',
    date: '2024-03-20',
    inbound_quantity: 200,
    book_inventory: 180,
    actual_inventory: 180,
    sales_quantity: 18,
    promotion_quantity: 2,
    special_outbound_quantity: 0,
    variance: 0,
    variance_percentage: 0,
    notes: 'Khớp sổ'
  },
  {
    product_id: 'prod_003',
    product_code: 'DK001',
    product_name: 'Đồ khô lạc',
    date: '2024-03-20',
    inbound_quantity: 50,
    book_inventory: 45,
    actual_inventory: 48,
    sales_quantity: 3,
    promotion_quantity: 2,
    special_outbound_quantity: 0,
    variance: 3,
    variance_percentage: 6.67,
    notes: 'Thừa do nhập thêm không ghi nhận'
  },
  {
    product_id: 'prod_004',
    product_code: 'SC001',
    product_name: 'Sơ chế rau củ',
    date: '2024-03-19',
    inbound_quantity: 100,
    book_inventory: 85,
    actual_inventory: 82,
    sales_quantity: 12,
    promotion_quantity: 3,
    special_outbound_quantity: 0,
    variance: -3,
    variance_percentage: -3.53,
    notes: 'Thiếu do hỏng trong quá trình sơ chế'
  },
  {
    product_id: 'prod_005',
    product_code: 'TP001',
    product_name: 'Thành phẩm bánh mì',
    date: '2024-03-19',
    inbound_quantity: 80,
    book_inventory: 70,
    actual_inventory: 68,
    sales_quantity: 8,
    promotion_quantity: 2,
    special_outbound_quantity: 0,
    variance: -2,
    variance_percentage: -2.86,
    notes: 'Thiếu do bánh mì cũ không bán được'
  },
  {
    product_id: 'prod_006',
    product_code: 'DU001',
    product_name: 'Đồ uống nước suối',
    date: '2024-03-19',
    inbound_quantity: 300,
    book_inventory: 280,
    actual_inventory: 285,
    sales_quantity: 18,
    promotion_quantity: 2,
    special_outbound_quantity: 0,
    variance: 5,
    variance_percentage: 1.79,
    notes: 'Thừa do nhập thêm không ghi nhận'
  },
  {
    product_id: 'prod_007',
    product_code: 'TC003',
    product_name: 'Trà sữa trân châu',
    date: '2024-03-18',
    inbound_quantity: 120,
    book_inventory: 100,
    actual_inventory: 95,
    sales_quantity: 18,
    promotion_quantity: 2,
    special_outbound_quantity: 0,
    variance: -5,
    variance_percentage: -5,
    notes: 'Thiếu do tràn trà trong quá trình pha'
  },
  {
    product_id: 'prod_008',
    product_code: 'DK002',
    product_name: 'Đồ khô hạt điều',
    date: '2024-03-18',
    inbound_quantity: 40,
    book_inventory: 35,
    actual_inventory: 35,
    sales_quantity: 4,
    promotion_quantity: 1,
    special_outbound_quantity: 0,
    variance: 0,
    variance_percentage: 0,
    notes: 'Khớp sổ'
  },
  {
    product_id: 'prod_009',
    product_code: 'TP002',
    product_name: 'Thành phẩm bánh ngọt',
    date: '2024-03-18',
    inbound_quantity: 60,
    book_inventory: 50,
    actual_inventory: 52,
    sales_quantity: 6,
    promotion_quantity: 4,
    special_outbound_quantity: 0,
    variance: 2,
    variance_percentage: 4,
    notes: 'Thừa do bánh thừa từ hôm trước'
  },
  {
    product_id: 'prod_010',
    product_code: 'DU002',
    product_name: 'Đồ uống nước ép',
    date: '2024-03-18',
    inbound_quantity: 90,
    book_inventory: 75,
    actual_inventory: 70,
    sales_quantity: 12,
    promotion_quantity: 3,
    special_outbound_quantity: 0,
    variance: -5,
    variance_percentage: -6.67,
    notes: 'Thiếu do nước ép hỏng nhanh'
  }
];

async function seedInventoryData() {
  console.log('🌱 Starting to seed inventory data...\n');

  try {
    // Check if data already exists
    const { data: existingData, error: checkError } = await supabase
      .from('inventory_variance_reports')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('❌ Error checking existing data:', checkError);
      return;
    }

    if (existingData && existingData.length > 0) {
      console.log('⚠️  Inventory data already exists. Skipping seed.');
      console.log('📊 Current records:', existingData.length);
      return;
    }

    // Insert mock data
    console.log('📝 Inserting mock inventory data...');
    
    const { data, error } = await supabase
      .from('inventory_variance_reports')
      .insert(mockInventoryData)
      .select();

    if (error) {
      console.error('❌ Error inserting data:', error);
      throw error;
    }

    console.log(`✅ Successfully inserted ${data.length} inventory records\n`);
    
    // Display summary
    console.log('📊 Data Summary:');
    console.log('─'.repeat(50));
    
    const totalNhap = mockInventoryData.reduce((sum, item) => sum + item.inbound_quantity, 0);
    const totalXuat = mockInventoryData.reduce((sum, item) => 
      sum + item.sales_quantity + item.promotion_quantity + item.special_outbound_quantity, 0);
    const totalTonSo = mockInventoryData.reduce((sum, item) => sum + item.book_inventory, 0);
    const totalTonThat = mockInventoryData.reduce((sum, item) => sum + item.actual_inventory, 0);
    const totalVariance = mockInventoryData.reduce((sum, item) => sum + item.variance, 0);

    console.log(`Total Nhập: ${totalNhap}`);
    console.log(`Total Xuất: ${totalXuat}`);
    console.log(`Total Tồn Sổ: ${totalTonSo}`);
    console.log(`Total Tồn Thật: ${totalTonThat}`);
    console.log(`Total Chênh Lệch: ${totalVariance}`);
    console.log('─'.repeat(50));
    
    console.log('\n🎉 Inventory data seeding completed successfully!');
    console.log('\n💡 You can now view the data at: /inventory-records');

  } catch (error) {
    console.error('❌ Error seeding inventory data:', error);
    process.exit(1);
  }
}

// Run the seed function
seedInventoryData();
