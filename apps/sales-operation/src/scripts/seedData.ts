// Simple script to populate ProductCatalogPage with Excel sample data
import { SAMPLE_PRODUCT_CATALOG } from '../types/product-catalog';

console.log('🌱 Seeding Product Catalog Data from Excel Sample');
console.log('================================================');

// Display the sample data that will be shown in ProductCatalogPage
console.log(`📊 Total products from Excel: ${SAMPLE_PRODUCT_CATALOG.length}`);
console.log('');

// Show sample data
SAMPLE_PRODUCT_CATALOG.forEach((product, index) => {
  console.log(`${index + 1}. ${product.productCode} - ${product.productName}`);
  console.log(`   Đơn vị: ${product.unit} | Giá: ${product.price.toLocaleString('vi-VN')} VNĐ`);
  console.log(`   Loại: ${product.category} | Ghi chú: ${product.notes}`);
  console.log('');
});

console.log('✅ Data is ready to be displayed in ProductCatalogPage');
console.log('💡 The fallback service will automatically use this data when database is unavailable');

export { SAMPLE_PRODUCT_CATALOG };
