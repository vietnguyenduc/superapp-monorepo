#!/usr/bin/env node
/**
 * Import Trial Seed Data
 *
 * Extracts mock data from all trialMockStore/trialData files
 * and inserts into trial_seed.data table.
 *
 * USAGE:
 *   node scripts/import-trial-seeds.mjs                    # → requires pg module
 *   node scripts/import-trial-seeds.mjs --sql              # → generates SQL file only
 *   node scripts/import-trial-seeds.mjs --sql | psql -h... # → pipe to psql
 *
 * Requires DATABASE_URL env pointing to local PostgreSQL.
 * If pg module is not available, use --sql to generate a .sql file.
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

const USE_SQL = process.argv.includes('--sql');
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://superapp:superapp_local@localhost:5432/superapp';

// ─── MOCK DATA FROM apps/cashflow/src/services/trialMockStore.ts ─────────

const cashflowSeed = {
  companies: [
    { id: 'trial-company', name: 'Công ty Demo', address: '123 Đường Demo, Hà Nội', phone: '0123456789', email: 'demo@example.com', website: 'https://demo.com', is_active: true },
  ],
  branches: [
    { id: 'trial-branch', company_id: 'trial-company', code: 'BR001', name: 'Văn phòng Demo', address: '123 Đường Demo, Hà Nội', phone: '0123456789', email: 'branch@example.com', manager_id: 'trial-user', is_active: true },
  ],
  users: [
    { id: 'trial-user', email: 'trial@example.com', full_name: 'Trial User', role: 'admin', company_id: 'trial-company', branch_id: 'trial-branch', is_active: true },
  ],
  customers: [
    { id: 'cust-1', customer_code: 'KH001', full_name: 'Nguyễn Văn A', phone: '0909123456', email: 'a@example.com', address: 'Hà Nội', total_balance: 15000000, branch_id: 'trial-branch', company_id: 'trial-company', is_active: true, partner_type: 'customer' },
    { id: 'cust-2', customer_code: 'KH002', full_name: 'Trần Thị B', phone: '0909123457', email: 'b@example.com', address: 'Hồ Chí Minh', total_balance: 8900000, branch_id: 'trial-branch', company_id: 'trial-company', is_active: true, partner_type: 'customer' },
    { id: 'cust-3', customer_code: 'KH003', full_name: 'Lê Văn C', phone: '0909123458', email: 'c@example.com', address: 'Đà Nẵng', total_balance: 22000000, branch_id: 'trial-branch', company_id: 'trial-company', is_active: true, partner_type: 'customer' },
  ],
  transaction_types: [
    { id: 'payment', name: 'Phát sinh giảm', math_factor: -1, impact_type: 'decrease', color: '#10b981', bg_color: 'bg-green-100', text_color: 'text-green-600', is_active: true },
    { id: 'charge', name: 'Phát sinh tăng', math_factor: 1, impact_type: 'increase', color: '#ef4444', bg_color: 'bg-red-100', text_color: 'text-red-600', is_active: true },
    { id: 'adjustment', name: 'Điều chỉnh', math_factor: 1, impact_type: 'increase', color: '#3b82f6', bg_color: 'bg-blue-100', text_color: 'text-blue-600', is_active: true },
  ],
  bank_accounts: [
    { id: 'ba-1', bank_name: 'Vietcombank', account_number: '1234567890', account_name: 'Công ty Demo', balance: 500000000, company_id: 'trial-company', is_active: true },
    { id: 'ba-2', bank_name: 'Techcombank', account_number: '0987654321', account_name: 'Công ty Demo', balance: 250000000, company_id: 'trial-company', is_active: true },
  ],
  transactions: [
    { id: 'tx-1', customer_id: 'cust-1', transaction_type_id: 'payment', amount: 5000000, description: 'Thanh toán hóa đơn tháng 1', status: 'completed', branch_id: 'trial-branch', company_id: 'trial-company' },
    { id: 'tx-2', customer_id: 'cust-2', transaction_type_id: 'charge', amount: 3000000, description: 'Thu phí dịch vụ', status: 'completed', branch_id: 'trial-branch', company_id: 'trial-company' },
    { id: 'tx-3', customer_id: 'cust-3', transaction_type_id: 'payment', amount: 7500000, description: 'Thanh toán định kỳ', status: 'completed', branch_id: 'trial-branch', company_id: 'trial-company' },
  ],
};

// ─── MOCK DATA FROM apps/operations-portal/src/lib/trialData.ts ─────────

const operationsSeed = {
  operation_tickets: [
    { id: 'ticket-1', title: 'Điều hòa tầng 1 không hoạt động', description: 'Điều hòa Panasonic khu vực quầy thu ngân không lạnh.', status: 'open', priority: 'urgent', created_by: 'trial-user' },
    { id: 'ticket-2', title: 'Máy in hóa đơn kẹt giấy', description: 'Máy in Epson TM-T88 khu vực POS số 2 báo lỗi kẹt giấy.', status: 'in_progress', priority: 'medium', created_by: 'trial-user' },
    { id: 'ticket-3', title: 'Bóng đèn trần khu vực kho bị hỏng', description: '2 bóng đèn LED dài 1.2m ở khu vực kho không sáng.', status: 'open', priority: 'low', created_by: 'trial-user' },
    { id: 'ticket-4', title: 'Tủ mát bị rò nước', description: 'Tủ mát trưng bày đồ uống bị rò nước ra nền.', status: 'resolved', priority: 'medium', created_by: 'trial-user' },
  ],
  operation_assets: [
    { id: 'asset-1', name: 'Máy POS #001', location: 'Quầy thu ngân', status: 'good', category: 'electronic' },
    { id: 'asset-2', name: 'Điều hòa Panasonic 2HP', location: 'Tầng 1 - Quầy', status: 'maintenance', category: 'electronic' },
    { id: 'asset-3', name: 'Tủ mát Sanaky 500L', location: 'Khu vực đồ uống', status: 'good', category: 'electronic' },
    { id: 'asset-4', name: 'Bàn ghế khu vực khách', location: 'Tầng 1', status: 'good', category: 'furniture' },
    { id: 'asset-5', name: 'Camera an ninh', location: 'Cửa ra vào', status: 'good', category: 'electronic' },
    { id: 'asset-6', name: 'Máy lọc nước RO', location: 'Khu vực bếp', status: 'damaged', category: 'electronic' },
  ],
  operation_consumables: [
    { id: 'cons-1', name: 'Giấy in hóa đơn', location: 'Kho', quantity: 50, unit: 'cuộn' },
    { id: 'cons-2', name: 'Túi nilon các loại', location: 'Kho', quantity: 200, unit: 'cái' },
    { id: 'cons-3', name: 'Nước rửa tay', location: 'Nhà vệ sinh', quantity: 10, unit: 'chai' },
    { id: 'cons-4', name: 'Khăn giấy lau', location: 'Kho', quantity: 30, unit: 'gói' },
    { id: 'cons-5', name: 'Bóng đèn LED 1.2m', location: 'Kho', quantity: 5, unit: 'cái' },
  ],
  operation_documents: [
    { id: 'doc-1', title: 'Quy trình vệ sinh hàng ngày', document_type: 'regulation' },
    { id: 'doc-2', title: 'Thông báo lịch kiểm kê tháng 6', document_type: 'notice' },
    { id: 'doc-3', title: 'Quy định an toàn phòng cháy chữa cháy', document_type: 'regulation' },
    { id: 'doc-4', title: 'Ban hành quy chế làm việc mới', document_type: 'issuance' },
    { id: 'doc-5', title: 'Thông báo nghỉ lễ 2/9', document_type: 'notice' },
  ],
  operation_emergency_contacts: [
    { id: 'emerg-1', name: 'Cấp cứu 115', phone: '115', category: 'Y tế', notes: 'Gọi ngay khi có người bị thương' },
    { id: 'emerg-2', name: 'Cảnh sát PCCC', phone: '114', category: 'Hỏa hoạn', notes: 'Báo cháy ngay lập tức' },
    { id: 'emerg-3', name: 'Cảnh sát 113', phone: '113', category: 'An ninh', notes: 'Báo khi có trộm cắp, gây rối' },
    { id: 'emerg-4', name: 'Điện lực khu vực', phone: '19001234', category: 'Điện', notes: 'Báo khi mất điện diện rộng' },
    { id: 'emerg-5', name: 'Kỹ thuật trực hotline', phone: '0912345678', category: 'Kỹ thuật', notes: 'Hỗ trợ kỹ thuật khẩn cấp 24/7' },
    { id: 'emerg-6', name: 'Quản lý vùng', phone: '0909123456', category: 'Quản lý', notes: 'Liên hệ khi cần quyết định vượt thẩm quyền' },
  ],
  operation_training_courses: [
    { id: 'course-1', title: 'Quy trình vệ sinh an toàn thực phẩm', description: 'Hướng dẫn chi tiết các bước vệ sinh khu vực bếp.', category: 'onboarding' },
    { id: 'course-2', title: 'Sử dụng máy POS cơ bản', description: 'Các thao tác cơ bản trên máy POS.', category: 'onboarding' },
    { id: 'course-3', title: 'Xử lý sự cố thiết bị điện', description: 'Nhận biết và xử lý các sự cố điện thường gặp.', category: 'skill' },
    { id: 'course-4', title: 'Kỹ năng giao tiếp với khách hàng', description: 'Các tình huống giao tiếp thường gặp.', category: 'skill' },
  ],
  operation_training_materials: [
    { id: 'mat-1', course_id: 'course-1', title: 'Giới thiệu quy trình vệ sinh', material_type: 'document', order_index: 1 },
    { id: 'mat-2', course_id: 'course-1', title: 'Video hướng dẫn rửa tay đúng cách', material_type: 'video', order_index: 2 },
    { id: 'mat-3', course_id: 'course-1', title: 'Kiểm tra kiến thức vệ sinh', material_type: 'quiz', order_index: 3 },
    { id: 'mat-4', course_id: 'course-2', title: 'Cấu tạo máy POS', material_type: 'document', order_index: 1 },
    { id: 'mat-5', course_id: 'course-2', title: 'Thực hành tạo đơn hàng', material_type: 'video', order_index: 2 },
    { id: 'mat-6', course_id: 'course-3', title: 'Nhận diện sự cố điện', material_type: 'document', order_index: 1 },
    { id: 'mat-7', course_id: 'course-3', title: 'Trắc nghiệm an toàn điện', material_type: 'quiz', order_index: 2 },
    { id: 'mat-8', course_id: 'course-4', title: 'Nguyên tắc vàng giao tiếp', material_type: 'document', order_index: 1 },
    { id: 'mat-9', course_id: 'course-4', title: 'Xử lý tình huống khó', material_type: 'video', order_index: 2 },
    { id: 'mat-10', course_id: 'course-4', title: 'Bài kiểm tra giao tiếp', material_type: 'quiz', order_index: 3 },
  ],
  operation_training_progress: [
    { id: 'prog-1', course_id: 'course-1', user_id: 'trial-user', status: 'completed' },
    { id: 'prog-2', course_id: 'course-2', user_id: 'trial-user', status: 'completed' },
    { id: 'prog-3', course_id: 'course-3', user_id: 'trial-user', status: 'not_started' },
  ],
  operation_chat_groups: [
    { id: 'group-1', name: 'Team Vận hành TPL' },
    { id: 'group-2', name: 'Bảo trì - Sửa chữa' },
    { id: 'group-3', name: 'An ninh - Khẩn cấp' },
  ],
  operation_chat_messages: [
    { id: 'msg-1', group_id: 'group-1', user_id: 'user-2', message: 'Sáng nay kiểm tra tủ mát thấy hơi yếu, anh em để ý nhé.' },
    { id: 'msg-2', group_id: 'group-1', user_id: 'trial-user', message: 'Đã ghi nhận, em sẽ kiểm tra thêm.' },
    { id: 'msg-3', group_id: 'group-1', user_id: 'user-3', message: 'Bên em vừa thay bóng đèn kho xong, giờ sáng hơn rồi.' },
    { id: 'msg-4', group_id: 'group-2', user_id: 'user-4', message: 'Máy in POS số 2 đã thay linh kiện, hoạt động lại bình thường.' },
    { id: 'msg-5', group_id: 'group-2', user_id: 'trial-user', message: 'Cảm ơn anh, em sẽ kiểm tra lại cuối ca.' },
    { id: 'msg-6', group_id: 'group-3', user_id: 'user-5', message: 'Nhắc lịch diễn tập PCCC thứ 6 này 9h sáng.' },
  ],
};

// ─── HR SEED DATA ────────────────────────────────────────────

const hrSeed = {
  departments: [
    { id: 'dept-1', name: 'Phòng Kinh doanh', code: 'KD', manager_id: 'trial-user', company_id: 'trial-company', is_active: true },
    { id: 'dept-2', name: 'Phòng Kế toán', code: 'KT', manager_id: 'trial-user', company_id: 'trial-company', is_active: true },
    { id: 'dept-3', name: 'Phòng Nhân sự', code: 'NS', manager_id: 'trial-user', company_id: 'trial-company', is_active: true },
    { id: 'dept-4', name: 'Phòng Kỹ thuật', code: 'KT', manager_id: 'trial-user', company_id: 'trial-company', is_active: true },
  ],
  employees: [
    { id: 'emp-1', full_name: 'Nguyễn Văn A', email: 'a@company.com', phone: '0909123401', department_id: 'dept-1', position: 'Nhân viên kinh doanh', salary: 10000000, company_id: 'trial-company', branch_id: 'trial-branch', is_active: true },
    { id: 'emp-2', full_name: 'Trần Thị B', email: 'b@company.com', phone: '0909123402', department_id: 'dept-1', position: 'Trưởng phòng', salary: 20000000, company_id: 'trial-company', branch_id: 'trial-branch', is_active: true },
    { id: 'emp-3', full_name: 'Lê Văn C', email: 'c@company.com', phone: '0909123403', department_id: 'dept-2', position: 'Kế toán trưởng', salary: 15000000, company_id: 'trial-company', branch_id: 'trial-branch', is_active: true },
    { id: 'emp-4', full_name: 'Phạm Thị D', email: 'd@company.com', phone: '0909123404', department_id: 'dept-3', position: 'Nhân viên nhân sự', salary: 8000000, company_id: 'trial-company', branch_id: 'trial-branch', is_active: true },
    { id: 'emp-5', full_name: 'Hoàng Văn E', email: 'e@company.com', phone: '0909123405', department_id: 'dept-4', position: 'Kỹ thuật viên', salary: 9000000, company_id: 'trial-company', branch_id: 'trial-branch', is_active: true },
  ],
  shifts: [
    { id: 'shift-1', name: 'Ca sáng', start_time: '06:00', end_time: '14:00', company_id: 'trial-company' },
    { id: 'shift-2', name: 'Ca chiều', start_time: '14:00', end_time: '22:00', company_id: 'trial-company' },
    { id: 'shift-3', name: 'Ca tối', start_time: '22:00', end_time: '06:00', company_id: 'trial-company' },
  ],
  leave_requests: [
    { id: 'leave-1', employee_id: 'emp-1', leave_type: 'nghỉ_phép', start_date: '2025-07-01', end_date: '2025-07-02', status: 'approved', reason: 'Nghỉ việc riêng', company_id: 'trial-company' },
    { id: 'leave-2', employee_id: 'emp-4', leave_type: 'nghỉ_ốm', start_date: '2025-07-03', end_date: '2025-07-03', status: 'pending', reason: 'Cảm sốt', company_id: 'trial-company' },
  ],
};

// ─── INVENTORY SEED DATA ─────────────────────────────────────

const inventorySeed = {
  products: [
    { id: 'prod-1', name: 'Cà phê sữa đá', code: 'CF001', price: 25000, unit: 'ly', category: 'đồ uống', stock: 100, company_id: 'trial-company', is_active: true },
    { id: 'prod-2', name: 'Trà sữa trân châu', code: 'TS001', price: 35000, unit: 'ly', category: 'đồ uống', stock: 80, company_id: 'trial-company', is_active: true },
    { id: 'prod-3', name: 'Bánh mì thịt', code: 'BM001', price: 15000, unit: 'cái', category: 'thực phẩm', stock: 50, company_id: 'trial-company', is_active: true },
    { id: 'prod-4', name: 'Nước suối 500ml', code: 'NS001', price: 10000, unit: 'chai', category: 'đồ uống', stock: 200, company_id: 'trial-company', is_active: true },
    { id: 'prod-5', name: 'Snack khoai tây', code: 'SK001', price: 8000, unit: 'gói', category: 'thực phẩm', stock: 150, company_id: 'trial-company', is_active: true },
  ],
  inventory_records: [
    { id: 'inv-1', product_id: 'prod-1', quantity: 100, warehouse: 'Kho chính', company_id: 'trial-company' },
    { id: 'inv-2', product_id: 'prod-2', quantity: 80, warehouse: 'Kho chính', company_id: 'trial-company' },
    { id: 'inv-3', product_id: 'prod-3', quantity: 50, warehouse: 'Kho bếp', company_id: 'trial-company' },
    { id: 'inv-4', product_id: 'prod-4', quantity: 200, warehouse: 'Kho chính', company_id: 'trial-company' },
    { id: 'inv-5', product_id: 'prod-5', quantity: 150, warehouse: 'Kho chính', company_id: 'trial-company' },
  ],
  sales_records: [
    { id: 'sale-1', product_id: 'prod-1', quantity: 5, total: 125000, customer_id: 'cust-1', company_id: 'trial-company' },
    { id: 'sale-2', product_id: 'prod-2', quantity: 3, total: 105000, customer_id: 'cust-2', company_id: 'trial-company' },
    { id: 'sale-3', product_id: 'prod-4', quantity: 10, total: 100000, customer_id: 'cust-3', company_id: 'trial-company' },
  ],
};

// ─── All seeds ────────────────────────────────────────────────

const ALL_SEEDS = { cashflow: cashflowSeed, operations: operationsSeed, hr: hrSeed, inventory: inventorySeed };
const SEED_LABEL = { cashflow: 'Cashflow', operations: 'Operations', hr: 'HR', inventory: 'Kho' };

// ─── SQL mode: generate INSERT statements ─────────────────────

function generateSql() {
  const lines = ['-- Trial Seed Data — generated by scripts/import-trial-seeds.mjs'];
  lines.push('-- Run: psql "$DATABASE_URL" -f scripts/trial_seed_data.sql');
  lines.push('');
  lines.push("-- Clear existing seed data");
  lines.push("DELETE FROM trial_seed.data;");
  lines.push('');

  const now = new Date().toISOString();

  // Build all inserts grouped by table
  const allTables = {};
  for (const [source, seed] of Object.entries(ALL_SEEDS)) {
    for (const [tableName, records] of Object.entries(seed)) {
      if (!allTables[tableName]) allTables[tableName] = [];
      records.forEach((r, i) => {
        allTables[tableName].push({ ...r, _sort: i });
      });
    }
  }

  for (const [tableName, records] of Object.entries(allTables)) {
    lines.push(`-- ${tableName}`);
    records.sort((a, b) => a._sort - b._sort);
    for (const r of records) {
      const { _sort, ...record } = r;
      const payload = { ...record, created_at: now, updated_at: now };
      const escaped = JSON.stringify(payload).replace(/'/g, "''");
      lines.push(`INSERT INTO trial_seed.data (table_name, record, sort_order) VALUES ('${tableName}', '${escaped}', ${_sort});`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ─── pg mode: insert directly ─────────────────────────────────

async function insertSeedPg(pool, tableName, records) {
  if (!records || records.length === 0) return { table: tableName, inserted: 0 };
  const now = new Date().toISOString();
  const client = await pool.connect();
  try {
    for (let i = 0; i < records.length; i++) {
      const record = { ...records[i], created_at: now, updated_at: now };
      await client.query(
        `INSERT INTO trial_seed.data (table_name, record, sort_order) VALUES ($1, $2::jsonb, $3)`,
        [tableName, JSON.stringify(record), i]
      );
    }
    console.log(`  ✓ ${tableName}: ${records.length} records`);
    return { table: tableName, inserted: records.length };
  } catch (err) {
    console.error(`  ✗ ${tableName}: ${err.message}`);
    return { table: tableName, inserted: 0, error: err.message };
  } finally {
    client.release();
  }
}

// ─── MAIN ─────────────────────────────────────────────────────

async function main() {
  // ── SQL mode ───────────────────────────────────────────────
  if (USE_SQL) {
    const sql = generateSql();
    const outPath = resolve(__dirname, '../scripts/trial_seed_data.sql');
    writeFileSync(outPath, sql, 'utf-8');
    console.log(`✅ SQL file generated: ${outPath}`);
    console.log('');
    console.log(`   Then run:`);
    console.log(`   psql "${DATABASE_URL}" -f ${outPath}`);
    return;
  }

  // ── pg mode ────────────────────────────────────────────────
  let pg;
  try {
    pg = await import('pg');
  } catch {
    console.error('❌ pg module not found. Install it or use --sql flag:');
    console.error('   npm install pg');
    console.error('   # or');
    console.error(`   node ${process.argv[1]} --sql`);
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 5 });

  // Check table exists
  console.log(`🔌 Connecting to: ${DATABASE_URL.replace(/\/\/.*@/, '//user:pass@')}\n`);
  try {
    const { rows } = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'trial_seed' AND table_name = 'data'
      ) as exists`
    );
    if (!rows[0].exists) {
      console.error('❌ Table trial_seed.data does not exist.');
      console.error('\n👉 Run the migration first:');
      console.error(`   psql "${DATABASE_URL}" -f supabase/migrations/038_trial_seed_data.sql\n`);
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Cannot connect to PostgreSQL:', err.message);
    console.error('   Check your DATABASE_URL.');
    process.exit(1);
  }

  // Clear existing data
  const { rows: countRows } = await pool.query('SELECT COUNT(*) as cnt FROM trial_seed.data');
  const count = parseInt(countRows[0].cnt, 10);
  if (count > 0) {
    console.log(`⚠️  Existing data found (${count} records). Clearing...`);
    await pool.query('DELETE FROM trial_seed.data');
  }

  // Insert all seeds
  for (const [source, seed] of Object.entries(ALL_SEEDS)) {
    console.log(`\n📦 ${SEED_LABEL[source]}:`);
    for (const [table, records] of Object.entries(seed)) {
      await insertSeedPg(pool, table, records);
    }
  }

  // Summary
  const { rows: summary } = await pool.query(
    'SELECT table_name, COUNT(*) as cnt FROM trial_seed.data GROUP BY table_name ORDER BY table_name'
  );
  console.log('\n📊 Summary:');
  let total = 0;
  for (const row of summary) {
    console.log(`  ${row.table_name}: ${row.cnt} records`);
    total += parseInt(row.cnt, 10);
  }
  console.log(`\n✅ Total: ${total} records across ${summary.length} tables`);
  await pool.end();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
