import type { BlockId, TemplateSection, TemplateSectionItem } from "../types";

const recognizeItem = (
  id: string,
  title: string,
  knowledgeEntryId: string
): TemplateSectionItem => ({
  id,
  title_vi: title,
  title_en: title,
  default_enabled: true,
  order_index: 0,
  knowledge_entry_id: knowledgeEntryId,
});

const nlttItems: TemplateSectionItem[] = [
  recognizeItem("nly-nltt-1", "Nguyên lý trí tuệ số 1", "nltt-1"),
  recognizeItem("nly-nltt-2", "Nguyên lý trí tuệ số 2", "nltt-2"),
  recognizeItem("nly-nltt-3", "Nguyên lý trí tuệ số 3", "nltt-3"),
  recognizeItem("nly-nltt-4", "Nguyên lý trí tuệ số 4", "nltt-4"),
  recognizeItem("nly-nltt-5", "Nguyên lý trí tuệ số 5", "nltt-5"),
];

const nlsItems: TemplateSectionItem[] = [
  recognizeItem("nly-nls-1", "Nguyên lý sống 1: Làm theo nguyên lý", "nls-1"),
  recognizeItem("nly-nls-2", "Nguyên lý sống 2: Bám vào chân lý (Trí tuệ và Từ bi) để hành động", "nls-2"),
  recognizeItem("nly-nls-3", "Nguyên lý sống 3: Xây dựng nguyên tắc để thành công", "nls-3"),
];

const nlcdItems: TemplateSectionItem[] = [
  recognizeItem("nly-nlcd-1", "NLCĐ 1: Ta là ai? Ta có gì?", "nlcd-1"),
  recognizeItem("nly-nlcd-2", "NLCĐ 2: Ta sinh ra để làm gì?", "nlcd-2"),
  recognizeItem("nly-nlcd-3", "NLCĐ 3: Thời thế", "nlcd-3"),
  recognizeItem("nly-nlcd-4", "NLCĐ 4: Xét người", "nlcd-4"),
  recognizeItem("nly-nlcd-5", "NLCĐ 5: Kiểm soát", "nlcd-5"),
  recognizeItem("nly-nlcd-6", "NLCĐ 6: Xoay chuyển vận mệnh", "nlcd-6"),
  recognizeItem("nly-nlcd-7", "NLCĐ 7: Đích", "nlcd-7"),
  recognizeItem("nly-nlcd-8", "NLCĐ 8: Điểm tựa", "nlcd-8"),
];

const daoItems: TemplateSectionItem[] = [
  recognizeItem("dao-dao-1", "Đạo Lý: Làm người bám vào 8 nguyên lý cuộc đời", "dao-1"),
  recognizeItem("dao-dao-2", "Đạo Sinh: Ai sinh ra ta, tạo ơn, tròn đạo sinh", "dao-2"),
  recognizeItem("dao-dao-3", "Đạo Hiếu: Tròn tâm với ông bà cha mẹ", "dao-3"),
  recognizeItem("dao-dao-4", "Đạo Trung: Trung thực, trung thành với gốc", "dao-4"),
  recognizeItem("dao-dao-5", "Đạo Nghĩa: Trọng nhân duyên, đúng nghĩa với người", "dao-5"),
  recognizeItem("dao-dao-6", "Đạo Tình: Sống có nhân tâm, tình thương", "dao-6"),
  recognizeItem("dao-dao-7", "Đạo Luật: Giữ 5 giới, 18 hạnh, gia quy", "dao-7"),
];

const yphapItems: TemplateSectionItem[] = [
  recognizeItem("phap-yphap-1", "Ý pháp Nhân quả", "yphap-1"),
  recognizeItem("phap-yphap-2", "Ý pháp Nhân duyên", "yphap-2"),
  recognizeItem("phap-yphap-3", "Ý pháp Nợ công, nợ của", "yphap-3"),
  recognizeItem("phap-yphap-4", "Ý pháp Oan gia trái chủ", "yphap-4"),
  recognizeItem("phap-yphap-5", "Ý pháp Oan khiên tích kiết", "yphap-5"),
  recognizeItem("phap-yphap-6", "Ý pháp Học tài thi phận", "yphap-6"),
  recognizeItem("phap-yphap-7", "Ý pháp Phúc", "yphap-7"),
  recognizeItem("phap-yphap-8", "Ý pháp Phúc đức", "yphap-8"),
  recognizeItem("phap-yphap-9", "Ý pháp Phúc Nghiệp", "yphap-9"),
  recognizeItem("phap-yphap-10", "Ý pháp Công - Dung - Ngôn - Hạnh", "yphap-10"),
  recognizeItem("phap-yphap-11", "Ý pháp Tham sân sỉ", "yphap-11"),
  recognizeItem("phap-yphap-12", "Ý pháp Tập khí", "yphap-12"),
  recognizeItem("phap-yphap-13", "Ý pháp Lục đạo luân hồi", "yphap-13"),
  recognizeItem("phap-yphap-14", "Ý pháp Triệt để", "yphap-14"),
  recognizeItem("phap-yphap-15", "Ý pháp Hoan hỷ - Xả bỏ - Tùy duyên - Diệt trừ", "yphap-15"),
];

const withOrder = (items: TemplateSectionItem[]): TemplateSectionItem[] =>
  items.map((item, idx) => ({ ...item, order_index: idx }));

export const defaultRecognizeSections = (): TemplateSection[] => [
  {
    id: "sec-recognize-nguyen-ly",
    template_id: "",
    group: "nguyen_ly",
    title_vi: "Nguyên lý Trí tuệ & Cuộc đời",
    title_en: "Wisdom & Life Principles",
    is_toggle: true,
    is_enabled: true,
    order_index: 0,
    concept_knowledge_entry_id: "nlcd-overview",
    reference_knowledge_entry_id: "nltt-overview",
    items: withOrder([...nlttItems, ...nlsItems, ...nlcdItems]),
  },
  {
    id: "sec-recognize-dao",
    template_id: "",
    group: "dao",
    title_vi: "Đạo",
    title_en: "Path",
    is_toggle: true,
    is_enabled: true,
    order_index: 1,
    concept_knowledge_entry_id: "dao-overview",
    items: withOrder(daoItems),
  },
  {
    id: "sec-recognize-phap",
    template_id: "",
    group: "phap",
    title_vi: "Pháp",
    title_en: "Methods",
    is_toggle: true,
    is_enabled: true,
    order_index: 2,
    concept_knowledge_entry_id: "yphap-overview",
    reference_knowledge_entry_id: "cong-thuc",
    items: withOrder(yphapItems),
  },
];

const applyItemsByBlock: Record<BlockId, TemplateSectionItem[]> = {
  self: withOrder([
    { id: "apply-self-0", title_vi: "Bước cụ thể", title_en: "Concrete step", default_enabled: true, order_index: 0 },
    { id: "apply-self-1", title_vi: "Thời gian", title_en: "Time", default_enabled: true, order_index: 1 },
    { id: "apply-self-2", title_vi: "Người hỗ trợ", title_en: "Support person", default_enabled: true, order_index: 2 },
    { id: "apply-self-3", title_vi: "Tài nguyên cần", title_en: "Resources needed", default_enabled: true, order_index: 3 },
    { id: "apply-self-4", title_vi: "Kết quả mong đợi", title_en: "Expected outcome", default_enabled: true, order_index: 4 },
  ]),
  family: withOrder([
    { id: "apply-family-0", title_vi: "Thấu triệt", title_en: "Insight", default_enabled: true, order_index: 0, knowledge_entry_id: "dao-2" },
    { id: "apply-family-1", title_vi: "Tròn chức năng, vai trò, bổn phận, trách nhiệm với gia đình", title_en: "Fulfill family role", default_enabled: true, order_index: 1, knowledge_entry_id: "dao-3" },
    { id: "apply-family-2", title_vi: "Tạo nếp nhà", title_en: "Build family rhythm", default_enabled: true, order_index: 2 },
    { id: "apply-family-3", title_vi: "Tròn Hiếu Lễ Nghĩa", title_en: "Filial piety & respect", default_enabled: true, order_index: 3, knowledge_entry_id: "dao-3" },
    { id: "apply-family-4", title_vi: "Kế thừa trí tuệ cho con cháu", title_en: "Pass wisdom to descendants", default_enabled: true, order_index: 4, knowledge_entry_id: "nltt-5" },
  ]),
  work: withOrder([
    { id: "apply-work-0", title_vi: "Thấu triệt công việc", title_en: "Work insight", default_enabled: true, order_index: 0, knowledge_entry_id: "nlcd-2" },
    { id: "apply-work-1", title_vi: "Làm công việc đúng mệnh", title_en: "Right work", default_enabled: true, order_index: 1, knowledge_entry_id: "nlcd-2" },
    { id: "apply-work-2", title_vi: "Hành xử và đối nhân xử thế", title_en: "Behavior & relationships", default_enabled: true, order_index: 2, knowledge_entry_id: "dao-5" },
    { id: "apply-work-3", title_vi: "Trân trọng và biết ơn", title_en: "Appreciation", default_enabled: true, order_index: 3, knowledge_entry_id: "dao-6" },
    { id: "apply-work-4", title_vi: "Tạo phúc, trả nợ ở cơ quan", title_en: "Create merit, settle debts", default_enabled: true, order_index: 4, knowledge_entry_id: "yphap-3" },
    { id: "apply-work-5", title_vi: "Tròn chức năng, vai trò, bổn phận, trách nhiệm trong công việc", title_en: "Fulfill work role", default_enabled: true, order_index: 5, knowledge_entry_id: "dao-4" },
    { id: "apply-work-6", title_vi: "Kiểm soát", title_en: "Control", default_enabled: true, order_index: 6, knowledge_entry_id: "nlcd-5" },
  ]),
  finance: withOrder([
    { id: "apply-finance-0", title_vi: "Thấu triệt", title_en: "Insight", default_enabled: true, order_index: 0, knowledge_entry_id: "nlcd-5" },
    { id: "apply-finance-1", title_vi: "Thu chi đúng mực", title_en: "Balanced budget", default_enabled: true, order_index: 1, knowledge_entry_id: "yphap-3" },
    { id: "apply-finance-2", title_vi: "Tạo phúc đức, trả nợ công", title_en: "Merit & debt", default_enabled: true, order_index: 2, knowledge_entry_id: "yphap-8" },
    { id: "apply-finance-3", title_vi: "Kiểm soát dòng tiền", title_en: "Cash flow control", default_enabled: true, order_index: 3, knowledge_entry_id: "nlcd-5" },
    { id: "apply-finance-4", title_vi: "Có kế hoạch và đích", title_en: "Plan & goal", default_enabled: true, order_index: 4, knowledge_entry_id: "nlcd-7" },
  ]),
  relationship: withOrder([
    { id: "apply-relationship-0", title_vi: "Thấu triệt con người", title_en: "Understand people", default_enabled: true, order_index: 0, knowledge_entry_id: "nlcd-4" },
    { id: "apply-relationship-1", title_vi: "Phân ra từng mối quan hệ rõ ràng", title_en: "Clarify relationships", default_enabled: true, order_index: 1, knowledge_entry_id: "yphap-2" },
    { id: "apply-relationship-2", title_vi: "Cần trọng các mối quan hệ để không bị lỗi đạo", title_en: "Respect relationships", default_enabled: true, order_index: 2, knowledge_entry_id: "dao-5" },
    { id: "apply-relationship-3", title_vi: "Rà soát thường xuyên các mối quan hệ: cứ 3-6 tháng rà soát 1 lần", title_en: "Regular review", default_enabled: true, order_index: 3 },
  ]),
};

const applySectionTitle: Record<BlockId, string> = {
  self: "Kế hoạch thực hiện",
  family: "Khuôn dùng cho Khối Gia đình",
  work: "Khuôn dùng cho Khối Công việc",
  finance: "Khuôn dùng cho Khối Tài chính",
  relationship: "Khuôn đưa trí tuệ vào quan hệ",
};

export const defaultApplySection = (blockId: BlockId): TemplateSection[] => [
  {
    id: `sec-apply-${blockId}`,
    template_id: "",
    group: "dua_khuon",
    title_vi: applySectionTitle[blockId] ?? "Kế hoạch thực hiện",
    title_en: applySectionTitle[blockId] ?? "Execution Plan",
    is_toggle: false,
    is_enabled: true,
    order_index: 0,
    concept_knowledge_entry_id: "cong-thuc",
    items: applyItemsByBlock[blockId] ?? applyItemsByBlock.self,
  },
];

export const defaultTrackSection = (): TemplateSection[] => [
  {
    id: "sec-track",
    template_id: "",
    group: "bam",
    title_vi: "Theo dõi tiến độ",
    title_en: "Progress Tracking",
    is_toggle: false,
    is_enabled: true,
    order_index: 0,
    concept_knowledge_entry_id: "cong-thuc",
    items: withOrder([
      { id: "track-dich", title_vi: "Đích", title_en: "Goal", default_enabled: true, order_index: 0 },
      { id: "track-thuc-te", title_vi: "Thực tế", title_en: "Reality", default_enabled: true, order_index: 1 },
      { id: "track-phuong-phap", title_vi: "Phương pháp", title_en: "Method", default_enabled: true, order_index: 2 },
    ]),
  },
];
