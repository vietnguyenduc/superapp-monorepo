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
    title_vi: "Nguyên lý Cuộc đời",
    title_en: "Life Principles",
    is_toggle: true,
    is_enabled: true,
    order_index: 0,
    concept_knowledge_entry_id: "nlcd-overview",
    items: withOrder(nlcdItems),
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

const applyFormulaItems: TemplateSectionItem[] = withOrder([
  { id: "apply-dich", title_vi: "Đích", title_en: "Goal", default_enabled: true, order_index: 0, knowledge_entry_id: "cong-thuc", content_vi: "Việc này phục vụ Đời, Đạo hay Lợi; đích đáng, bám đích." },
  { id: "apply-thuc-te", title_vi: "Thực tế", title_en: "Reality", default_enabled: true, order_index: 1, knowledge_entry_id: "cong-thuc", content_vi: "Xét theo 7 phần thực tế liên quan: thời thế, xã hội, con người, công việc, luật, xu thế, vận thế." },
  { id: "apply-phuong-phap", title_vi: "Phương pháp", title_en: "Method", default_enabled: true, order_index: 2, knowledge_entry_id: "cong-thuc", content_vi: "Đúng nguyên lý, đúng đạo, phù hợp bản chất việc." },
  { id: "apply-phoi-hop", title_vi: "Phối hợp", title_en: "Collaboration", default_enabled: true, order_index: 3, knowledge_entry_id: "cong-thuc", content_vi: "Dựa trên điểm tựa (con người, máy móc, nguồn lực) để đạt đích." },
  { id: "apply-ke-hoach", title_vi: "Kế hoạch", title_en: "Plan", default_enabled: true, order_index: 4, knowledge_entry_id: "cong-thuc", content_vi: "Thời gian (ngắn, trung, dài hạn), nguyên tắc đúng luật, chuẩn mực, rõ ràng, tinh tế, uyển chuyển, có trước có sau." },
]);

const applySectionTitle: Record<BlockId, string> = {
  self: "Đưa khuôn: Công thức đối cảnh",
  family: "Đưa khuôn cho Khối Gia đình",
  work: "Đưa khuôn cho Khối Công việc",
  finance: "Đưa khuôn cho Khối Tài chính",
  relationship: "Đưa khuôn cho Khối Quan hệ",
};

export const defaultApplySection = (blockId: BlockId): TemplateSection[] => [
  {
    id: `sec-apply-${blockId}`,
    template_id: "",
    group: "dua_khuon",
    title_vi: applySectionTitle[blockId] ?? "Đưa khuôn: Công thức đối cảnh",
    title_en: applySectionTitle[blockId] ?? "Apply: Situation Formula",
    is_toggle: false,
    is_enabled: true,
    order_index: 0,
    concept_knowledge_entry_id: "cong-thuc",
    items: applyFormulaItems,
  },
];

export const defaultTrackSection = (): TemplateSection[] => [
  {
    id: "sec-track",
    template_id: "",
    group: "bam",
    title_vi: "Bám theo Công thức",
    title_en: "Track by Formula",
    is_toggle: false,
    is_enabled: true,
    order_index: 0,
    concept_knowledge_entry_id: "cong-thuc",
    items: withOrder([
      { id: "dich", title_vi: "Đích", title_en: "Goal", default_enabled: true, order_index: 0, knowledge_entry_id: "cong-thuc" },
      { id: "thuc_te", title_vi: "Thực tế", title_en: "Reality", default_enabled: true, order_index: 1, knowledge_entry_id: "cong-thuc" },
      { id: "phuong_phap", title_vi: "Phương pháp", title_en: "Method", default_enabled: true, order_index: 2, knowledge_entry_id: "cong-thuc" },
      { id: "phoi_hop", title_vi: "Phối hợp", title_en: "Collaboration", default_enabled: true, order_index: 3, knowledge_entry_id: "cong-thuc" },
      { id: "ke_hoach", title_vi: "Kế hoạch", title_en: "Plan", default_enabled: true, order_index: 4, knowledge_entry_id: "cong-thuc" },
    ]),
  },
];
