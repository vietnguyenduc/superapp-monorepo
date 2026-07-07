/**
 * Mock data for trial mode — seeded into localStorage once.
 * Realistic F&B data (fruit shop / juice bar domain).
 */
import { ProductCategory, ProductStatus } from '../types/Product';
const LS_KEY_PRODUCTS = 'trial_products';
const LS_KEY_INVENTORY = 'trial_inventory_records';
// ──────────────────── Products ────────────────────
/**
 * Many-to-many mapping: raw material/semi-processed → finished products that use it.
 * Key = product businessCode, Value = list of finished product businessCodes.
 */
export const RAW_TO_FINISHED_MAP = {
    'NVL-XO01': ['TP-XO01', 'TP-CB01', 'TP-NE01'], // Xoài → Ly xoài dầm, Combo, Nước ép xoài
    'NVL-DH01': ['TP-DH01', 'TP-CB01'], // Dưa hấu → Đĩa dưa hấu, Combo
    'NVL-DU01': ['TP-CB01', 'TP-NE02'], // Dứa → Combo, Nước ép dứa
    'NVL-OI01': ['TP-CB01'], // Ổi → Combo
    'NVL-TL01': ['TP-CB01'], // Thanh long → Combo
    'SC-XO01': ['TP-XO01', 'TP-NE01'], // Xoài cắt miếng → Ly xoài dầm, Nước ép xoài
    'SC-DH01': ['TP-DH01'], // Dưa cắt miếng → Đĩa dưa hấu
    'DK-SU01': ['TP-XO01', 'TP-NE01', 'TP-NE02'], // Đường → các thức uống
    'DK-DA01': ['TP-XO01', 'TP-NE01', 'TP-NE02', 'TP-DH01'], // Đá → hầu hết thành phẩm
};
export const RAW_CONVERSIONS_MAP = {
    'NVL-XO01': [
        { fromUnit: 'quả', toUnit: 'miếng', conversionRate: 10, description: '1 quả xoài = 10 miếng' },
        { fromUnit: 'miếng', toUnit: 'ly', conversionRate: 0.3, targetProductCode: 'TP-XO01', description: '1 miếng = 0.3 ly xoài dầm' }
    ],
    'NVL-DH01': [
        { fromUnit: 'quả', toUnit: 'miếng', conversionRate: 12, description: '1 quả dưa hấu = 12 miếng' },
        { fromUnit: 'miếng', toUnit: 'đĩa', conversionRate: 0.25, targetProductCode: 'TP-DH01', description: '1 miếng = 0.25 đĩa dưa hấu' }
    ],
    'NVL-DU01': [
        { fromUnit: 'quả', toUnit: 'miếng', conversionRate: 8, description: '1 quả dứa = 8 miếng' }
    ],
    'DK-SU01': [
        { fromUnit: 'kg', toUnit: 'muỗng', conversionRate: 50, description: '1 kg đường = 50 muỗng' }
    ],
    'DK-DA01': [
        { fromUnit: 'bịch', toUnit: 'muỗng', conversionRate: 20, description: '1 bịch đá = 20 muỗng' }
    ]
};
export const INTERMEDIATE_UNITS_MAP = {
    'NVL-XO01': ['miếng'],
    'NVL-DH01': ['miếng'],
    'NVL-DU01': ['miếng'],
    'DK-SU01': ['muỗng'],
    'DK-DA01': ['muỗng']
};
export const RECIPE_MAP = {
    'TP-XO01': [
        { materialCode: 'NVL-XO01', materialName: 'Xoài cát Hòa Lộc', quantity: 5, unit: 'miếng' },
        { materialCode: 'DK-SU01', materialName: 'Đường cát trắng', quantity: 1, unit: 'muỗng' },
        { materialCode: 'DK-DA01', materialName: 'Đá viên', quantity: 2, unit: 'muỗng' }
    ],
    'TP-DH01': [
        { materialCode: 'NVL-DH01', materialName: 'Dưa hấu không hạt', quantity: 8, unit: 'miếng' },
        { materialCode: 'DK-DA01', materialName: 'Đá viên', quantity: 1, unit: 'muỗng' }
    ],
    'TP-CB01': [
        { materialCode: 'NVL-XO01', materialName: 'Xoài cát Hòa Lộc', quantity: 3, unit: 'miếng' },
        { materialCode: 'NVL-DH01', materialName: 'Dưa hấu không hạt', quantity: 3, unit: 'miếng' },
        { materialCode: 'NVL-DU01', materialName: 'Dứa Queen', quantity: 3, unit: 'miếng' },
        { materialCode: 'NVL-OI01', materialName: 'Ổi ruột đỏ', quantity: 3, unit: 'miếng' },
        { materialCode: 'NVL-TL01', materialName: 'Thanh long ruột đỏ', quantity: 3, unit: 'miếng' }
    ],
    'TP-NE01': [
        { materialCode: 'NVL-XO01', materialName: 'Xoài cát Hòa Lộc', quantity: 3, unit: 'miếng' },
        { materialCode: 'DK-SU01', materialName: 'Đường cát trắng', quantity: 2, unit: 'muỗng' }
    ],
    'TP-NE02': [
        { materialCode: 'NVL-DU01', materialName: 'Dứa Queen', quantity: 4, unit: 'miếng' },
        { materialCode: 'DK-SU01', materialName: 'Đường cát trắng', quantity: 1, unit: 'muỗng' }
    ]
};
export const MOCK_PRODUCTS = [
    {
        id: 'p-001', category: ProductCategory.FRUIT, businessCode: 'NVL-XO01',
        name: 'Xoài cát Hòa Lộc', isFinishedProduct: false,
        allowedForms: ['raw', 'processed', 'finished'], canBePurchased: true, canBeSold: false,
        inputQuantity: 1, outputQuantity: 12, inputUnit: 'quả', outputUnit: 'miếng',
        status: ProductStatus.ACTIVE, businessStatus: 'active',
        createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-06-01'),
        createdBy: 'system', updatedBy: 'system',
    },
    {
        id: 'p-002', category: ProductCategory.FRUIT, businessCode: 'NVL-DH01',
        name: 'Dưa hấu không hạt', isFinishedProduct: false,
        allowedForms: ['raw'], canBePurchased: true, canBeSold: false,
        inputQuantity: 1, outputQuantity: 12, inputUnit: 'quả', outputUnit: 'miếng',
        finishedProductCode: 'TP-DH01', status: ProductStatus.ACTIVE, businessStatus: 'active',
        createdAt: new Date('2025-01-10'), updatedAt: new Date('2025-06-01'),
        createdBy: 'system', updatedBy: 'system',
    },
    {
        id: 'p-003', category: ProductCategory.FRUIT, businessCode: 'NVL-DU01',
        name: 'Dứa Queen', isFinishedProduct: false,
        allowedForms: ['raw'], canBePurchased: true, canBeSold: false,
        inputQuantity: 1, outputQuantity: 10, inputUnit: 'quả', outputUnit: 'miếng',
        finishedProductCode: 'TP-DU01', status: ProductStatus.ACTIVE, businessStatus: 'active',
        createdAt: new Date('2025-01-12'), updatedAt: new Date('2025-06-01'),
        createdBy: 'system', updatedBy: 'system',
    },
    {
        id: 'p-004', category: ProductCategory.FRUIT, businessCode: 'NVL-OI01',
        name: 'Ổi ruột đỏ', isFinishedProduct: false,
        allowedForms: ['raw'], canBePurchased: true, canBeSold: false,
        inputQuantity: 1, outputQuantity: 6, inputUnit: 'quả', outputUnit: 'miếng',
        finishedProductCode: '', status: ProductStatus.ACTIVE, businessStatus: 'active',
        createdAt: new Date('2025-02-01'), updatedAt: new Date('2025-06-01'),
        createdBy: 'system', updatedBy: 'system',
    },
    {
        id: 'p-005', category: ProductCategory.FRUIT, businessCode: 'NVL-TL01',
        name: 'Thanh long ruột đỏ', isFinishedProduct: false,
        allowedForms: ['raw'], canBePurchased: true, canBeSold: false,
        inputQuantity: 1, outputQuantity: 6, inputUnit: 'quả', outputUnit: 'miếng',
        finishedProductCode: '', status: ProductStatus.ACTIVE, businessStatus: 'active',
        createdAt: new Date('2025-02-05'), updatedAt: new Date('2025-06-01'),
        createdBy: 'system', updatedBy: 'system',
    },
    // ─── Semi-Processed (Sơ chế) ───
    {
        id: 'p-006', category: ProductCategory.PROCESSED, businessCode: 'SC-XO01',
        name: 'Xoài cắt miếng', isFinishedProduct: false,
        allowedForms: ['processed'], canBePurchased: false, canBeSold: false,
        inputQuantity: 8, outputQuantity: 1, inputUnit: 'miếng', outputUnit: 'hộp',
        finishedProductCode: 'TP-XO01', status: ProductStatus.ACTIVE, businessStatus: 'active',
        createdAt: new Date('2025-01-15'), updatedAt: new Date('2025-06-01'),
        createdBy: 'system', updatedBy: 'system',
    },
    {
        id: 'p-007', category: ProductCategory.PROCESSED, businessCode: 'SC-DH01',
        name: 'Dưa hấu cắt miếng', isFinishedProduct: false,
        allowedForms: ['processed'], canBePurchased: false, canBeSold: false,
        inputQuantity: 12, outputQuantity: 1, inputUnit: 'miếng', outputUnit: 'hộp',
        finishedProductCode: 'TP-DH01', status: ProductStatus.ACTIVE, businessStatus: 'active',
        createdAt: new Date('2025-01-15'), updatedAt: new Date('2025-06-01'),
        createdBy: 'system', updatedBy: 'system',
    },
    // ─── Finished Products (Thành phẩm) ───
    {
        id: 'p-008', category: ProductCategory.FINISHED, businessCode: 'TP-XO01',
        name: 'Ly xoài dầm', isFinishedProduct: true,
        allowedForms: ['finished'], canBePurchased: false, canBeSold: true,
        inputQuantity: 5, outputQuantity: 1, inputUnit: 'miếng xoài', outputUnit: 'ly',
        finishedProductCode: 'TP-XO01', status: ProductStatus.ACTIVE, businessStatus: 'active',
        createdAt: new Date('2025-01-20'), updatedAt: new Date('2025-06-01'),
        createdBy: 'system', updatedBy: 'system',
    },
    {
        id: 'p-009', category: ProductCategory.FINISHED, businessCode: 'TP-DH01',
        name: 'Đĩa dưa hấu', isFinishedProduct: true,
        allowedForms: ['finished'], canBePurchased: false, canBeSold: true,
        inputQuantity: 8, outputQuantity: 1, inputUnit: 'miếng dưa', outputUnit: 'đĩa',
        finishedProductCode: 'TP-DH01', status: ProductStatus.ACTIVE, businessStatus: 'active',
        createdAt: new Date('2025-01-20'), updatedAt: new Date('2025-06-01'),
        createdBy: 'system', updatedBy: 'system',
    },
    {
        id: 'p-010', category: ProductCategory.FINISHED, businessCode: 'TP-CB01',
        name: 'Combo hoa quả tổng hợp', isFinishedProduct: true,
        allowedForms: ['finished'], canBePurchased: false, canBeSold: true,
        inputQuantity: 3, outputQuantity: 1, inputUnit: 'miếng/loại', outputUnit: 'đĩa',
        finishedProductCode: 'TP-CB01', status: ProductStatus.ACTIVE, businessStatus: 'active',
        createdAt: new Date('2025-02-01'), updatedAt: new Date('2025-06-01'),
        createdBy: 'system', updatedBy: 'system',
    },
    {
        id: 'p-011', category: ProductCategory.FINISHED, businessCode: 'TP-NE01',
        name: 'Nước ép xoài', isFinishedProduct: true,
        allowedForms: ['finished'], canBePurchased: false, canBeSold: true,
        inputQuantity: 3, outputQuantity: 1, inputUnit: 'miếng xoài', outputUnit: 'ly',
        finishedProductCode: 'TP-NE01', status: ProductStatus.ACTIVE, businessStatus: 'active',
        createdAt: new Date('2025-02-10'), updatedAt: new Date('2025-06-01'),
        createdBy: 'system', updatedBy: 'system',
    },
    {
        id: 'p-012', category: ProductCategory.FINISHED, businessCode: 'TP-NE02',
        name: 'Nước ép dứa', isFinishedProduct: true,
        allowedForms: ['finished'], canBePurchased: false, canBeSold: true,
        inputQuantity: 4, outputQuantity: 1, inputUnit: 'miếng dứa', outputUnit: 'ly',
        finishedProductCode: 'TP-NE02', status: ProductStatus.ACTIVE, businessStatus: 'active',
        createdAt: new Date('2025-02-10'), updatedAt: new Date('2025-06-01'),
        createdBy: 'system', updatedBy: 'system',
    },
    {
        id: 'p-013', category: ProductCategory.DRY_GOODS, businessCode: 'DK-SU01',
        name: 'Đường cát trắng', isFinishedProduct: false,
        allowedForms: ['raw'], canBePurchased: true, canBeSold: false,
        inputQuantity: 1, outputQuantity: 50, inputUnit: 'kg', outputUnit: 'muỗng',
        status: ProductStatus.ACTIVE, businessStatus: 'active',
        createdAt: new Date('2025-01-05'), updatedAt: new Date('2025-06-01'),
        createdBy: 'system', updatedBy: 'system',
    },
    {
        id: 'p-014', category: ProductCategory.DRY_GOODS, businessCode: 'DK-DA01',
        name: 'Đá viên', isFinishedProduct: false,
        allowedForms: ['raw'], canBePurchased: true, canBeSold: false,
        inputQuantity: 1, outputQuantity: 20, inputUnit: 'bịch', outputUnit: 'muỗng',
        status: ProductStatus.ACTIVE, businessStatus: 'active',
        createdAt: new Date('2025-01-05'), updatedAt: new Date('2025-06-01'),
        createdBy: 'system', updatedBy: 'system',
    },
    {
        id: 'p-015', category: ProductCategory.BEVERAGE, businessCode: 'BEV-TIG01',
        name: 'Tiger Bạc', isFinishedProduct: true,
        allowedForms: ['finished'], canBePurchased: true, canBeSold: true,
        inputQuantity: 1, outputQuantity: 1, inputUnit: 'lon', outputUnit: 'lon',
        status: ProductStatus.ACTIVE, businessStatus: 'active',
        createdAt: new Date('2025-01-05'), updatedAt: new Date('2025-06-01'),
        createdBy: 'system', updatedBy: 'system',
    },
].map(p => ({
    ...p,
    linkedFinishedProductCodes: RAW_TO_FINISHED_MAP[p.businessCode] || [],
    conversions: RAW_CONVERSIONS_MAP[p.businessCode] || [],
    intermediateUnits: INTERMEDIATE_UNITS_MAP[p.businessCode] || [],
    recipe: RECIPE_MAP[p.businessCode] || []
}));
// ──────────────────── Inventory Records ────────────────────
function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(8, 0, 0, 0);
    return d;
}
export const MOCK_INVENTORY = [
    // ─── Recent inbound (Nhập) ───
    { id: 'inv-001', branch: 'CN Quận 1', date: daysAgo(1), productCode: 'NVL-XO01', productName: 'Xoài cát Hòa Lộc',
        inputQuantity: 20, outputQuantity: 10, rawMaterialStock: 15, rawMaterialUnit: 'quả',
        processedStock: 40, processedUnit: 'miếng', finishedProductStock: 8, finishedProductUnit: 'ly',
        createdAt: daysAgo(1), updatedAt: daysAgo(1), createdBy: 'trial', updatedBy: 'trial', notes: 'Nhập lô mới' },
    { id: 'inv-002', branch: 'CN Quận 3', date: daysAgo(1), productCode: 'NVL-DH01', productName: 'Dưa hấu không hạt',
        inputQuantity: 0, outputQuantity: 5, rawMaterialStock: 8, rawMaterialUnit: 'quả',
        processedStock: 36, processedUnit: 'miếng', finishedProductStock: 5, finishedProductUnit: 'đĩa',
        createdAt: daysAgo(1), updatedAt: daysAgo(1), createdBy: 'trial', updatedBy: 'trial', notes: 'Bán hàng ca sáng' },
    { id: 'inv-003', branch: 'CN Quận 1', date: daysAgo(2), productCode: 'NVL-DU01', productName: 'Dứa Queen',
        inputQuantity: 15, outputQuantity: 8, rawMaterialStock: 12, rawMaterialUnit: 'quả',
        processedStock: 30, processedUnit: 'miếng', finishedProductStock: 6, finishedProductUnit: 'ly',
        createdAt: daysAgo(2), updatedAt: daysAgo(2), createdBy: 'trial', updatedBy: 'trial' },
    { id: 'inv-004', branch: 'CN Quận 3', date: daysAgo(3), productCode: 'NVL-XO01', productName: 'Xoài cát Hòa Lộc',
        inputQuantity: 25, outputQuantity: 15, rawMaterialStock: 18, rawMaterialUnit: 'quả',
        processedStock: 50, processedUnit: 'miếng', finishedProductStock: 12, finishedProductUnit: 'ly',
        createdAt: daysAgo(3), updatedAt: daysAgo(3), createdBy: 'trial', updatedBy: 'trial' },
    { id: 'inv-005', branch: 'CN Quận 1', date: daysAgo(4), productCode: 'NVL-OI01', productName: 'Ổi ruột đỏ',
        inputQuantity: 30, outputQuantity: 12, rawMaterialStock: 25, rawMaterialUnit: 'quả',
        processedStock: 0, processedUnit: '', finishedProductStock: 10, finishedProductUnit: 'đĩa',
        createdAt: daysAgo(4), updatedAt: daysAgo(4), createdBy: 'trial', updatedBy: 'trial' },
    { id: 'inv-006', branch: 'CN Quận 3', date: daysAgo(5), productCode: 'NVL-TL01', productName: 'Thanh long ruột đỏ',
        inputQuantity: 18, outputQuantity: 8, rawMaterialStock: 14, rawMaterialUnit: 'quả',
        processedStock: 12, processedUnit: 'miếng', finishedProductStock: 4, finishedProductUnit: 'đĩa',
        createdAt: daysAgo(5), updatedAt: daysAgo(5), createdBy: 'trial', updatedBy: 'trial' },
    { id: 'inv-007', branch: 'CN Quận 1', date: daysAgo(6), productCode: 'NVL-DH01', productName: 'Dưa hấu không hạt',
        inputQuantity: 12, outputQuantity: 6, rawMaterialStock: 6, rawMaterialUnit: 'quả',
        processedStock: 48, processedUnit: 'miếng', finishedProductStock: 7, finishedProductUnit: 'đĩa',
        createdAt: daysAgo(6), updatedAt: daysAgo(6), createdBy: 'trial', updatedBy: 'trial' },
    { id: 'inv-008', branch: 'CN Quận 3', date: daysAgo(7), productCode: 'NVL-XO01', productName: 'Xoài cát Hòa Lộc',
        inputQuantity: 30, outputQuantity: 20, rawMaterialStock: 22, rawMaterialUnit: 'quả',
        processedStock: 64, processedUnit: 'miếng', finishedProductStock: 15, finishedProductUnit: 'ly',
        createdAt: daysAgo(7), updatedAt: daysAgo(7), createdBy: 'trial', updatedBy: 'trial' },
    { id: 'inv-009', branch: 'CN Quận 1', date: daysAgo(8), productCode: 'DK-SU01', productName: 'Đường cát trắng',
        inputQuantity: 5, outputQuantity: 2, rawMaterialStock: 4.5, rawMaterialUnit: 'kg',
        processedStock: 0, processedUnit: '', finishedProductStock: 0, finishedProductUnit: '',
        createdAt: daysAgo(8), updatedAt: daysAgo(8), createdBy: 'trial', updatedBy: 'trial' },
    { id: 'inv-010', branch: 'CN Quận 3', date: daysAgo(9), productCode: 'NVL-DU01', productName: 'Dứa Queen',
        inputQuantity: 20, outputQuantity: 10, rawMaterialStock: 16, rawMaterialUnit: 'quả',
        processedStock: 40, processedUnit: 'miếng', finishedProductStock: 8, finishedProductUnit: 'ly',
        createdAt: daysAgo(9), updatedAt: daysAgo(9), createdBy: 'trial', updatedBy: 'trial' },
    { id: 'inv-011', branch: 'CN Quận 1', date: daysAgo(10), productCode: 'NVL-XO01', productName: 'Xoài cát Hòa Lộc',
        inputQuantity: 15, outputQuantity: 8, rawMaterialStock: 10, rawMaterialUnit: 'quả',
        processedStock: 32, processedUnit: 'miếng', finishedProductStock: 6, finishedProductUnit: 'ly',
        createdAt: daysAgo(10), updatedAt: daysAgo(10), createdBy: 'trial', updatedBy: 'trial' },
    { id: 'inv-012', branch: 'CN Quận 3', date: daysAgo(12), productCode: 'DK-DA01', productName: 'Đá viên',
        inputQuantity: 10, outputQuantity: 5, rawMaterialStock: 8, rawMaterialUnit: 'bịch',
        processedStock: 0, processedUnit: '', finishedProductStock: 0, finishedProductUnit: '',
        createdAt: daysAgo(12), updatedAt: daysAgo(12), createdBy: 'trial', updatedBy: 'trial' },
    { id: 'inv-013', branch: 'CN Quận 1', date: daysAgo(14), productCode: 'NVL-OI01', productName: 'Ổi ruột đỏ',
        inputQuantity: 25, outputQuantity: 15, rawMaterialStock: 20, rawMaterialUnit: 'quả',
        processedStock: 0, processedUnit: '', finishedProductStock: 8, finishedProductUnit: 'đĩa',
        createdAt: daysAgo(14), updatedAt: daysAgo(14), createdBy: 'trial', updatedBy: 'trial' },
    { id: 'inv-014', branch: 'CN Quận 3', date: daysAgo(16), productCode: 'NVL-TL01', productName: 'Thanh long ruột đỏ',
        inputQuantity: 22, outputQuantity: 10, rawMaterialStock: 18, rawMaterialUnit: 'quả',
        processedStock: 16, processedUnit: 'miếng', finishedProductStock: 5, finishedProductUnit: 'đĩa',
        createdAt: daysAgo(16), updatedAt: daysAgo(16), createdBy: 'trial', updatedBy: 'trial' },
    { id: 'inv-015', branch: 'CN Quận 1', date: daysAgo(18), productCode: 'NVL-DH01', productName: 'Dưa hấu không hạt',
        inputQuantity: 8, outputQuantity: 4, rawMaterialStock: 5, rawMaterialUnit: 'quả',
        processedStock: 24, processedUnit: 'miếng', finishedProductStock: 3, finishedProductUnit: 'đĩa',
        createdAt: daysAgo(18), updatedAt: daysAgo(18), createdBy: 'trial', updatedBy: 'trial' },
    { id: 'inv-016', branch: 'CN Quận 3', date: daysAgo(20), productCode: 'NVL-XO01', productName: 'Xoài cát Hòa Lộc',
        inputQuantity: 35, outputQuantity: 18, rawMaterialStock: 28, rawMaterialUnit: 'quả',
        processedStock: 56, processedUnit: 'miếng', finishedProductStock: 14, finishedProductUnit: 'ly',
        createdAt: daysAgo(20), updatedAt: daysAgo(20), createdBy: 'trial', updatedBy: 'trial' },
    { id: 'inv-017', branch: 'CN Quận 1', date: daysAgo(22), productCode: 'NVL-DU01', productName: 'Dứa Queen',
        inputQuantity: 12, outputQuantity: 6, rawMaterialStock: 9, rawMaterialUnit: 'quả',
        processedStock: 20, processedUnit: 'miếng', finishedProductStock: 4, finishedProductUnit: 'ly',
        createdAt: daysAgo(22), updatedAt: daysAgo(22), createdBy: 'trial', updatedBy: 'trial' },
    { id: 'inv-018', branch: 'CN Quận 3', date: daysAgo(25), productCode: 'DK-SU01', productName: 'Đường cát trắng',
        inputQuantity: 10, outputQuantity: 4, rawMaterialStock: 9, rawMaterialUnit: 'kg',
        processedStock: 0, processedUnit: '', finishedProductStock: 0, finishedProductUnit: '',
        createdAt: daysAgo(25), updatedAt: daysAgo(25), createdBy: 'trial', updatedBy: 'trial' },
    { id: 'inv-019', branch: 'CN Quận 1', date: daysAgo(27), productCode: 'NVL-OI01', productName: 'Ổi ruột đỏ',
        inputQuantity: 20, outputQuantity: 10, rawMaterialStock: 16, rawMaterialUnit: 'quả',
        processedStock: 0, processedUnit: '', finishedProductStock: 6, finishedProductUnit: 'đĩa',
        createdAt: daysAgo(27), updatedAt: daysAgo(27), createdBy: 'trial', updatedBy: 'trial' },
    { id: 'inv-020', branch: 'CN Quận 3', date: daysAgo(29), productCode: 'BEV-TIG01', productName: 'Tiger Bạc',
        inputQuantity: 50, outputQuantity: 12, rawMaterialStock: 0, rawMaterialUnit: '',
        processedStock: 0, processedUnit: '', finishedProductStock: 38, finishedProductUnit: 'lon',
        createdAt: daysAgo(29), updatedAt: daysAgo(29), createdBy: 'trial', updatedBy: 'trial', notes: 'Nhập bia Tiger' },
    // ─── Historical records for Opening Balances (> 30 days) ───
    { id: 'inv-021', branch: 'CN Quận 1', date: daysAgo(35), productCode: 'NVL-XO01', productName: 'Xoài cát Hòa Lộc',
        inputQuantity: 100, outputQuantity: 0, rawMaterialStock: 100, rawMaterialUnit: 'quả',
        processedStock: 0, processedUnit: '', finishedProductStock: 0, finishedProductUnit: '',
        createdAt: daysAgo(35), updatedAt: daysAgo(35), createdBy: 'trial', updatedBy: 'trial', notes: 'Nhập số dư đầu kỳ' },
    { id: 'inv-022', branch: 'CN Quận 1', date: daysAgo(35), productCode: 'NVL-DH01', productName: 'Dưa hấu không hạt',
        inputQuantity: 50, outputQuantity: 0, rawMaterialStock: 50, rawMaterialUnit: 'quả',
        processedStock: 0, processedUnit: '', finishedProductStock: 0, finishedProductUnit: '',
        createdAt: daysAgo(35), updatedAt: daysAgo(35), createdBy: 'trial', updatedBy: 'trial', notes: 'Nhập số dư đầu kỳ' },
    { id: 'inv-023', branch: 'CN Quận 3', date: daysAgo(35), productCode: 'NVL-DU01', productName: 'Dứa Queen',
        inputQuantity: 80, outputQuantity: 0, rawMaterialStock: 80, rawMaterialUnit: 'quả',
        processedStock: 0, processedUnit: '', finishedProductStock: 0, finishedProductUnit: '',
        createdAt: daysAgo(35), updatedAt: daysAgo(35), createdBy: 'trial', updatedBy: 'trial', notes: 'Nhập số dư đầu kỳ' },
    { id: 'inv-024', branch: 'CN Quận 1', date: daysAgo(32), productCode: 'NVL-XO01', productName: 'Xoài cát Hòa Lộc',
        inputQuantity: 0, outputQuantity: 10, rawMaterialStock: 90, rawMaterialUnit: 'quả',
        processedStock: 0, processedUnit: '', finishedProductStock: 0, finishedProductUnit: '',
        createdAt: daysAgo(32), updatedAt: daysAgo(32), createdBy: 'trial', updatedBy: 'trial', notes: 'Xuất chế biến' },
    // ─── Very old records for Quarters/Years (> 300 days) ───
    { id: 'inv-025', branch: 'CN Quận 1', date: daysAgo(400), productCode: 'NVL-XO01', productName: 'Xoài cát Hòa Lộc',
        inputQuantity: 200, outputQuantity: 0, rawMaterialStock: 200, rawMaterialUnit: 'quả',
        processedStock: 0, processedUnit: '', finishedProductStock: 0, finishedProductUnit: '',
        createdAt: daysAgo(400), updatedAt: daysAgo(400), createdBy: 'trial', updatedBy: 'trial', notes: 'Tồn đầu kỳ năm trước' },
];
// ──────────────────── Seed / Load helpers ────────────────────
export function seedTrialDataIfNeeded(force = false) {
    const existingProducts = localStorage.getItem(LS_KEY_PRODUCTS);
    const existingInventory = localStorage.getItem(LS_KEY_INVENTORY);
    const isDataCleared = localStorage.getItem('trial_data_cleared') === 'true';
    // If user explicitly cleared data, don't re-seed automatically unless forced
    if (isDataCleared && !force) {
        console.log('⏹️ Trial data was explicitly cleared. Skipping auto-seed.');
        return;
    }
    const needProducts = force || (!existingProducts && !isDataCleared);
    const needInventory = force || (!existingInventory && !isDataCleared);
    if (needProducts) {
        localStorage.setItem(LS_KEY_PRODUCTS, JSON.stringify(MOCK_PRODUCTS));
        localStorage.removeItem('trial_data_cleared'); // Reset the cleared flag if we seed
        console.log('🌱 Seeded trial products:', MOCK_PRODUCTS.length);
    }
    if (needInventory) {
        localStorage.setItem(LS_KEY_INVENTORY, JSON.stringify(MOCK_INVENTORY));
        console.log('🌱 Seeded trial inventory records:', MOCK_INVENTORY.length);
    }
}
export function getTrialProducts() {
    const raw = localStorage.getItem(LS_KEY_PRODUCTS);
    if (!raw) {
        seedTrialDataIfNeeded();
        const rawAfterSeed = localStorage.getItem(LS_KEY_PRODUCTS);
        if (!rawAfterSeed)
            return [];
        return JSON.parse(rawAfterSeed).map((p) => ({
            ...p,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
        }));
    }
    return JSON.parse(raw).map((p) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
    }));
}
export function getTrialInventoryRecords() {
    const raw = localStorage.getItem(LS_KEY_INVENTORY);
    if (!raw) {
        seedTrialDataIfNeeded();
        const rawAfterSeed = localStorage.getItem(LS_KEY_INVENTORY);
        if (!rawAfterSeed)
            return [];
        return JSON.parse(rawAfterSeed).map((r) => ({
            ...r,
            date: new Date(r.date),
            createdAt: new Date(r.createdAt),
            updatedAt: new Date(r.updatedAt),
        }));
    }
    return JSON.parse(raw).map((r) => ({
        ...r,
        date: new Date(r.date),
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
    }));
}
export function saveTrialProducts(products) {
    localStorage.setItem(LS_KEY_PRODUCTS, JSON.stringify(products));
}
export function saveTrialInventoryRecords(records) {
    localStorage.setItem(LS_KEY_INVENTORY, JSON.stringify(records));
}
/** Look up which finished products use a given raw material/semi-processed code */
export function getFinishedProductsForCode(businessCode, allProducts) {
    const finishedCodes = RAW_TO_FINISHED_MAP[businessCode] || [];
    return allProducts.filter(p => finishedCodes.includes(p.businessCode));
}
