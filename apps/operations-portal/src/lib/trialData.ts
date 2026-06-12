/**
 * Trial Mode Mock Data
 * 
 * Cung cấp dữ liệu mẫu cho các trang khi đang ở chế độ Trial
 * (không có kết nối Supabase hoặc localStorage.isTrial === 'true')
 */

export const isTrialMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('isTrial') === 'true' || !import.meta.env.VITE_SUPABASE_URL;
};

// ─── Dashboard Stats ───────────────────────────────────────────
export const mockDashboardStats = {
  checkinsToday: 12,
  newNotices: 5,
  activeGroups: 3,
};

// ─── Tickets ────────────────────────────────────────────────────
export const mockTickets = [
  {
    id: 'ticket-1',
    title: 'Điều hòa tầng 1 không hoạt động',
    description: 'Điều hòa Panasonic khu vực quầy thu ngân không lạnh, đã kiểm tra remote và nguồn điện bình thường.',
    status: 'open',
    priority: 'urgent',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    created_by: 'trial-user',
  },
  {
    id: 'ticket-2',
    title: 'Máy in hóa đơn kẹt giấy',
    description: 'Máy in Epson TM-T88 khu vực POS số 2 báo lỗi kẹt giấy, đã thử reset nhưng không khắc phục được.',
    status: 'in_progress',
    priority: 'medium',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    created_by: 'trial-user',
  },
  {
    id: 'ticket-3',
    title: 'Bóng đèn trần khu vực kho bị hỏng',
    description: '2 bóng đèn LED dài 1.2m ở khu vực kho chứa hàng không sáng, cần thay mới.',
    status: 'open',
    priority: 'low',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_by: 'trial-user',
  },
  {
    id: 'ticket-4',
    title: 'Tủ mát bị rò nước',
    description: 'Tủ mát trưng bày đồ uống bị rò nước ra nền, đã lau nhưng vẫn tiếp tục rỉ.',
    status: 'resolved',
    priority: 'medium',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_by: 'trial-user',
  },
];

// ─── Assets ─────────────────────────────────────────────────────
export const mockAssets = [
  { id: 'asset-1', name: 'Máy POS #001', location: 'Quầy thu ngân', status: 'good', category: 'electronic' },
  { id: 'asset-2', name: 'Điều hòa Panasonic 2HP', location: 'Tầng 1 - Quầy', status: 'maintenance', category: 'electronic' },
  { id: 'asset-3', name: 'Tủ mát Sanaky 500L', location: 'Khu vực đồ uống', status: 'good', category: 'electronic' },
  { id: 'asset-4', name: 'Bàn ghế khu vực khách', location: 'Tầng 1', status: 'good', category: 'furniture' },
  { id: 'asset-5', name: 'Camera an ninh', location: 'Cửa ra vào', status: 'good', category: 'electronic' },
  { id: 'asset-6', name: 'Máy lọc nước RO', location: 'Khu vực bếp', status: 'damaged', category: 'electronic' },
];

export const mockConsumables = [
  { id: 'cons-1', name: 'Giấy in hóa đơn', location: 'Kho', quantity: 50, unit: 'cuộn' },
  { id: 'cons-2', name: 'Túi nilon các loại', location: 'Kho', quantity: 200, unit: 'cái' },
  { id: 'cons-3', name: 'Nước rửa tay', location: 'Nhà vệ sinh', quantity: 10, unit: 'chai' },
  { id: 'cons-4', name: 'Khăn giấy lau', location: 'Kho', quantity: 30, unit: 'gói' },
  { id: 'cons-5', name: 'Bóng đèn LED 1.2m', location: 'Kho', quantity: 5, unit: 'cái' },
];

// ─── Documents ──────────────────────────────────────────────────
export const mockDocuments = [
  {
    id: 'doc-1',
    title: 'Quy trình vệ sinh hàng ngày',
    document_type: 'regulation',
    file_url: null,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'doc-2',
    title: 'Thông báo lịch kiểm kê tháng 6',
    document_type: 'notice',
    file_url: null,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'doc-3',
    title: 'Quy định an toàn phòng cháy chữa cháy',
    document_type: 'regulation',
    file_url: null,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'doc-4',
    title: 'Ban hành quy chế làm việc mới',
    document_type: 'issuance',
    file_url: null,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'doc-5',
    title: 'Thông báo nghỉ lễ 2/9',
    document_type: 'notice',
    file_url: null,
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ─── Chat Groups ────────────────────────────────────────────────
export const mockChatGroups = [
  { id: 'group-1', name: 'Team Vận hành TPL' },
  { id: 'group-2', name: 'Bảo trì - Sửa chữa' },
  { id: 'group-3', name: 'An ninh - Khẩn cấp' },
];

export const mockChatMessages: Record<string, any[]> = {
  'group-1': [
    { id: 'msg-1', group_id: 'group-1', user_id: 'user-2', message: 'Sáng nay kiểm tra tủ mát thấy hơi yếu, anh em để ý nhé.', created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), users: { full_name: 'Anh Tuấn' } },
    { id: 'msg-2', group_id: 'group-1', user_id: 'trial-user', message: 'Đã ghi nhận, em sẽ kiểm tra thêm.', created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), users: { full_name: 'Bạn' } },
    { id: 'msg-3', group_id: 'group-1', user_id: 'user-3', message: 'Bên em vừa thay bóng đèn kho xong, giờ sáng hơn rồi.', created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), users: { full_name: 'Chị Lan' } },
  ],
  'group-2': [
    { id: 'msg-4', group_id: 'group-2', user_id: 'user-4', message: 'Máy in POS số 2 đã thay linh kiện, hoạt động lại bình thường.', created_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(), users: { full_name: 'Kỹ thuật Hoàng' } },
    { id: 'msg-5', group_id: 'group-2', user_id: 'trial-user', message: 'Cảm ơn anh, em sẽ kiểm tra lại cuối ca.', created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(), users: { full_name: 'Bạn' } },
  ],
  'group-3': [
    { id: 'msg-6', group_id: 'group-3', user_id: 'user-5', message: 'Nhắc lịch diễn tập PCCC thứ 6 này 9h sáng.', created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), users: { full_name: 'Bảo vệ Minh' } },
  ],
};

// ─── Emergency Contacts ─────────────────────────────────────────
export const mockEmergencyContacts = [
  { id: 'emerg-1', name: 'Cấp cứu 115', phone: '115', category: 'Y tế', notes: 'Gọi ngay khi có người bị thương hoặc cấp cứu y tế' },
  { id: 'emerg-2', name: 'Cảnh sát PCCC', phone: '114', category: 'Hỏa hoạn', notes: 'Báo cháy ngay lập tức, không tự ý dập lửa nếu không được đào tạo' },
  { id: 'emerg-3', name: 'Cảnh sát 113', phone: '113', category: 'An ninh', notes: 'Báo khi có trộm cắp, gây rối hoặc đe dọa an ninh' },
  { id: 'emerg-4', name: 'Điện lực khu vực', phone: '19001234', category: 'Điện', notes: 'Báo khi mất điện diện rộng hoặc sự cố điện nguy hiểm' },
  { id: 'emerg-5', name: 'Kỹ thuật trực hotline', phone: '0912345678', category: 'Kỹ thuật', notes: 'Hỗ trợ kỹ thuật khẩn cấp 24/7' },
  { id: 'emerg-6', name: 'Quản lý vùng', phone: '0909123456', category: 'Quản lý', notes: 'Liên hệ khi cần quyết định vượt thẩm quyền' },
];

// ─── Training Courses ───────────────────────────────────────────
export const mockTrainingCourses = [
  {
    id: 'course-1',
    title: 'Quy trình vệ sinh an toàn thực phẩm',
    description: 'Hướng dẫn chi tiết các bước vệ sinh khu vực bếp, quầy chế biến và bảo quản thực phẩm đúng chuẩn.',
    category: 'onboarding',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'course-2',
    title: 'Sử dụng máy POS cơ bản',
    description: 'Các thao tác cơ bản trên máy POS: tạo đơn, thanh toán, in hóa đơn, hủy đơn và báo cáo cuối ca.',
    category: 'onboarding',
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'course-3',
    title: 'Xử lý sự cố thiết bị điện',
    description: 'Nhận biết và xử lý các sự cố điện thường gặp: cúp điện, chập điện, thiết bị không hoạt động.',
    category: 'skill',
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'course-4',
    title: 'Kỹ năng giao tiếp với khách hàng',
    description: 'Các tình huống giao tiếp thường gặp, cách xử lý khiếu nại và tạo ấn tượng tốt với khách hàng.',
    category: 'skill',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockTrainingMaterials: Record<string, any[]> = {
  'course-1': [
    { id: 'mat-1', course_id: 'course-1', title: 'Giới thiệu quy trình vệ sinh', material_type: 'document', order_index: 1 },
    { id: 'mat-2', course_id: 'course-1', title: 'Video hướng dẫn rửa tay đúng cách', material_type: 'video', order_index: 2 },
    { id: 'mat-3', course_id: 'course-1', title: 'Kiểm tra kiến thức vệ sinh', material_type: 'quiz', order_index: 3 },
  ],
  'course-2': [
    { id: 'mat-4', course_id: 'course-2', title: 'Cấu tạo máy POS', material_type: 'document', order_index: 1 },
    { id: 'mat-5', course_id: 'course-2', title: 'Thực hành tạo đơn hàng', material_type: 'video', order_index: 2 },
  ],
  'course-3': [
    { id: 'mat-6', course_id: 'course-3', title: 'Nhận diện sự cố điện', material_type: 'document', order_index: 1 },
    { id: 'mat-7', course_id: 'course-3', title: 'Trắc nghiệm an toàn điện', material_type: 'quiz', order_index: 2 },
  ],
  'course-4': [
    { id: 'mat-8', course_id: 'course-4', title: 'Nguyên tắc vàng giao tiếp', material_type: 'document', order_index: 1 },
    { id: 'mat-9', course_id: 'course-4', title: 'Xử lý tình huống khó', material_type: 'video', order_index: 2 },
    { id: 'mat-10', course_id: 'course-4', title: 'Bài kiểm tra giao tiếp', material_type: 'quiz', order_index: 3 },
  ],
};

export const mockTrainingProgress = [
  { id: 'prog-1', course_id: 'course-1', user_id: 'trial-user', status: 'completed', completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'prog-2', course_id: 'course-2', user_id: 'trial-user', status: 'completed', completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'prog-3', course_id: 'course-3', user_id: 'trial-user', status: 'not_started', completed_at: null },
];
