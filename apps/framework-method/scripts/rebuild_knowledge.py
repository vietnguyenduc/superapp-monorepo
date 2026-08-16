import json
import os
import re
import time
import unicodedata
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
PDF_TEXT = Path("/home/ubuntu/ocr_pages/pdf_full.txt")
DOCX_TEXT = Path("/home/ubuntu/ocr_pages/docx_nau_com.txt")
SEED_PATH = REPO / "src" / "data" / "knowledgeSeed.ts"

MAX_RAW = 9000
API_KEY = os.environ["DEEPSEEK_API_KEY"]
BASE_URL = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com")


def to_base(s):
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.replace("Đ", "D").replace("đ", "d")


# (id, start regex base, optional end regex base, category if new)
# Patterns are in base Vietnamese to be robust against OCR diacritic errors.
HEADINGS = [
    # enrich existing core entries
    ("nltt-2", r"^2\.\s+nguyen ly tri tue so 2", r"^3\.\s+nguyen ly tri tue so 3", None),
    ("nltt-3", r"^3\.\s+nguyen ly tri tue so 3", r"^4\.\s+nguyen ly tri tue so 4", None),
    ("nltt-4", r"^4\.\s+nguyen ly tri tue so 4", r"^5\.\s+nguyen ly tri tue so 5", None),
    ("nltt-5", r"^5\.\s+nguyen ly tri tue so 5", r"^2/8\s+nguyen ly cuoc doi", None),
    ("nlcd-2", r"^nlcp?d?\s*2:\s*ta sinh ra", r"^nlcp?d?\s*3:", None),
    ("nlcd-3", r"^nlcp?d?\s*3:\s*thoi the", r"^nlcdp?\s*4:", None),
    ("nlcd-4", r"^nlcdp?\s*4:\s*xet nguoi", r"^nlcp?d?\s*5:", None),
    ("nlcd-5", r"^nlcp?d?\s*5:\s*kiem soat", r"^nlcdp?\s*6:", None),
    ("nlcd-7", r"^nlcp?d?\s*7:\s*dich", r"^nlcp?d?\s*8:", None),
    ("nlcd-8", r"^nlcp?d?\s*8:\s*diem tua", r"^3/\d+\s+nguyen ly song", None),
    ("nls-1", r"^-\s+nguyen ly song 1", r"^-\s+nguyen ly song 2", None),
    ("nls-2", r"^-\s+nguyen ly song 2", r"^-\s+nguyen ly song 3", None),
    ("nls-3", r"^-\s+nguyen ly song 3", r"^2\.\s+dao", None),
    ("dao-4", r"^4\)\s+dao trung", r"^5\)\s+dao nghia", None),
    ("dao-6", r"^6\)\s+dao tinh", r"^7\)\s+dao luat", None),
    ("dao-7", r"^7\)\s+dao luat", r"^3\.\s+mang phap", None),
    ("cong-thuc", r"^18\.\s+cong thuc doi canh", r"^tam tu bi", None),
    # new concept entries
    ("tam-linh", r"^4\.\s+mang tam linh", r"^5\.\s+mang thuc te", "concept"),
    ("thuc-te", r"^5\.\s+mang thuc te", r"^phan\s*2:\s*quy luat", "concept"),
    ("quy-luat", r"phan\s*2:\s*quy luat", r"phan\s*3:\s*hieu", "concept"),
    ("hieu-le-nghia", r"phan\s*3:\s*hieu", r"phan\s*4:\s*biet goc", "concept"),
    ("biet-goc-bam-goc", r"phan\s*4:\s*biet goc", r"phan\s*5:\s*nguyen tac", "concept"),
    ("nguyen-tac", r"phan\s*5:\s*nguyen tac", r"phan\s*6:", "concept"),
    ("tam-tu-bi", r"tam tu bi", r"phan\s*7:", "concept"),
    ("xoay-chuyen", r"phan\s*7:", r"phan\s*8:", "concept"),
    ("hanh", r"phan\s*8:\s*hanh", r"phan\s*9:", "concept"),
    ("luyen-sua", r"phan\s*9:", r"phan\s*10:", "concept"),
    ("tu", r"phan\s*10:", r"phan\s*11:", "concept"),
    ("ke-thua", r"phan\s*11:", r"6\s+net van hoa", "concept"),
]

NEW_CONCEPTS = {
    "tam-linh": {"title_vi": "Mảng Tâm linh", "title_en": "Mảng Tâm linh"},
    "thuc-te": {"title_vi": "Mảng Thực tế", "title_en": "Mảng Thực tế"},
    "quy-luat": {"title_vi": "Quy luật", "title_en": "Quy luật"},
    "hieu-le-nghia": {"title_vi": "Hiếu — Lễ — Nghĩa", "title_en": "Hiếu — Lễ — Nghĩa"},
    "biet-goc-bam-goc": {"title_vi": "Biết gốc & Bám gốc", "title_en": "Biết gốc & Bám gốc"},
    "nguyen-tac": {"title_vi": "Nguyên tắc", "title_en": "Nguyên tắc"},
    "tam-tu-bi": {"title_vi": "Tâm từ bi", "title_en": "Tâm từ bi"},
    "xoay-chuyen": {"title_vi": "Xoay chuyển cuộc sống Trí tuệ", "title_en": "Xoay chuyển cuộc sống Trí tuệ"},
    "hanh": {"title_vi": "Hành", "title_en": "Hành"},
    "luyen-sua": {"title_vi": "Luyện & Sửa", "title_en": "Luyện & Sửa"},
    "tu": {"title_vi": "Tu", "title_en": "Tu"},
    "ke-thua": {"title_vi": "Kế thừa cho thế hệ tương lai", "title_en": "Kế thừa cho thế hệ tương lai"},
}

EXAMPLES = [
    {
        "id": "vi-du-nau-com",
        "title_vi": "Ví dụ: Nấu cơm",
        "title_en": "Ví dụ: Nấu cơm",
        "category": "example",
    },
    {
        "id": "vi-du-quet-nha",
        "title_vi": "Ví dụ: Quét nhà",
        "title_en": "Ví dụ: Quét nhà",
        "category": "example",
    },
    {
        "id": "vi-du-xu-ly-email",
        "title_vi": "Ví dụ: Xử lý email công việc",
        "title_en": "Ví dụ: Xử lý email công việc",
        "category": "example",
    },
    {
        "id": "vi-du-hop",
        "title_vi": "Ví dụ: Họp nhóm",
        "title_en": "Ví dụ: Họp nhóm",
        "category": "example",
    },
    {
        "id": "vi-du-mua-sam",
        "title_vi": "Ví dụ: Mua sắm gia đình",
        "title_en": "Ví dụ: Mua sắm gia đình",
        "category": "example",
    },
]


def clean_raw(lines):
    out = []
    for line in lines:
        line = line.replace("\x0c", "").rstrip()
        stripped = line.strip()
        if not stripped:
            continue
        if re.match(r"^\d{1,3}$", stripped):
            continue
        if re.match(r"^[@©®™•\*\+\-oes]$", stripped):
            continue
        out.append(line)
    return "\n".join(out)


def extract_sections():
    with PDF_TEXT.open(encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()

    base_lines = [to_base(line) for line in lines]

    starts = {}
    for eid, start_pat, _, _ in HEADINGS:
        pat = re.compile(start_pat, re.IGNORECASE)
        for i, base in enumerate(base_lines):
            if pat.search(base):
                starts[eid] = i
                break

    sorted_ids = sorted(starts, key=lambda x: starts[x])
    sections = {}
    for idx, eid in enumerate(sorted_ids):
        start = starts[eid]
        heading_tuple = next(h for h in HEADINGS if h[0] == eid)
        end_pat = heading_tuple[2]
        if end_pat:
            end_pat_re = re.compile(end_pat, re.IGNORECASE)
            end = len(lines)
            for j in range(start + 1, len(lines)):
                if end_pat_re.search(base_lines[j]):
                    end = j
                    break
        else:
            if idx + 1 < len(sorted_ids):
                end = starts[sorted_ids[idx + 1]]
            else:
                end = len(lines)
        raw = clean_raw(lines[start:end])
        if len(raw) > MAX_RAW:
            cut = raw.rfind("\n\n", 0, MAX_RAW)
            if cut < MAX_RAW * 0.5:
                cut = raw.rfind("\n", 0, MAX_RAW)
            raw = raw[:cut] if cut > 0 else raw[:MAX_RAW]
        sections[eid] = raw
    return sections


def ensure_string(value):
    if value is None:
        return ""
    if isinstance(value, list):
        return "\n".join(str(x) for x in value)
    return str(value).strip()


def call_deepseek(title, raw, is_example=False, retries=2):
    if is_example:
        system_hint = (
            "Đây là một ví dụ minh họa cho app framework-method. "
            "Hãy viết lại rõ ràng, dễ đọc, đúng tinh thần trí tuệ đã cho, không bịa thêm ý ngoài văn bản."
        )
    else:
        system_hint = (
            "Bạn là trợ lý làm sạch nội dung tri thức từ OCR tiếng Việt nhiễu. "
            "Giữ đúng ý chính, KHÔNG bịa đặt thêm ý. Đừng lặp lại tiêu đề trong các trường nội dung."
        )
    prompt = f"""{system_hint}

Tiêu đề: {title}

Nội dung gốc (OCR):
{raw}

Trả về JSON duy nhất với các trường sau:
{{
  "summary_vi": "Cốt ý / tóm tắt 1-2 câu",
  "cot_y_vi": "Ý chính 1 câu",
  "cot_cua_cot_vi": "Tinh túy, cốt của cốt, 1 câu ngắn gọn (KHÔNG lặp tiêu đề)",
  "loi_vi": "Lõi / nội dung chi tiết nhất 8-15 dòng, có gạch đầu dòng, sạch OCR, dễ đọc",
  "content_vi": "Giống loi_vi: nội dung chi tiết 8-15 dòng"
}}

Chỉ trả về JSON, không giải thích."""
    last_err = None
    for attempt in range(retries + 1):
        req = urllib.request.Request(
            f"{BASE_URL}/chat/completions",
            data=json.dumps({
                "model": "deepseek-chat",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
                "max_tokens": 2500,
                "response_format": {"type": "json_object"},
            }).encode(),
            headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
            method="POST",
        )
        resp = urllib.request.urlopen(req, timeout=90).read().decode()
        data = json.loads(resp)
        text = data["choices"][0]["message"]["content"]
        try:
            result = json.loads(text)
            for k in ["summary_vi", "cot_y_vi", "cot_cua_cot_vi", "loi_vi", "content_vi"]:
                if result.get(k):
                    result[k] = ensure_string(result[k])
            return result
        except json.JSONDecodeError as ex:
            last_err = ex
            # Try to extract JSON object if model wrapped extra text
            m = re.search(r"\{.*\}", text, re.S)
            if m:
                try:
                    result = json.loads(m.group(0))
                    for k in ["summary_vi", "cot_y_vi", "cot_cua_cot_vi", "loi_vi", "content_vi"]:
                        if result.get(k):
                            result[k] = ensure_string(result[k])
                    return result
                except json.JSONDecodeError:
                    pass
            time.sleep(1.0)
    raise last_err


def load_seed_entries():
    seed_text = SEED_PATH.read_text(encoding="utf-8")
    m = re.search(r"(export const defaultKnowledgeEntries: KnowledgeEntry\[\] = )(\[.*?\]);", seed_text, re.S)
    if not m:
        raise RuntimeError("Cannot parse knowledgeSeed.ts")
    entries = json.loads(m.group(2))
    return entries, seed_text, m


def save_seed_entries(entries, seed_text, m):
    new_body = json.dumps(entries, ensure_ascii=False, indent=2)
    new_text = seed_text[: m.start(2)] + new_body + seed_text[m.end(2):]
    SEED_PATH.write_text(new_text, encoding="utf-8")


def main():
    sections = extract_sections()
    entries, seed_text, m = load_seed_entries()
    entries_by_id = {e["id"]: e for e in entries}

    target_ids = [h[0] for h in HEADINGS]

    for eid in target_ids:
        raw = sections.get(eid, "").strip()
        if not raw:
            print(f"[{eid}] no raw section, skip")
            continue

        if eid in entries_by_id:
            e = entries_by_id[eid]
        else:
            meta = NEW_CONCEPTS.get(eid)
            if not meta:
                print(f"[{eid}] unknown new concept, skip")
                continue
            cat = next(h[3] for h in HEADINGS if h[0] == eid) or "concept"
            e = {
                "id": eid,
                "title_vi": meta["title_vi"],
                "title_en": meta["title_en"],
                "summary_vi": "",
                "summary_en": "",
                "content_vi": "",
                "content_en": "",
                "cot_y_vi": "",
                "cot_y_en": "",
                "cot_cua_cot_vi": "",
                "cot_cua_cot_en": "",
                "loi_vi": "",
                "loi_en": "",
                "image_url": "",
                "category": cat,
                "order_index": 0,
            }
            entries.append(e)
            entries_by_id[eid] = e

        try:
            print(f"[{eid}] enriching ({len(raw)} raw chars)")
            result = call_deepseek(e["title_vi"], raw)
            for k in ["summary_vi", "cot_y_vi", "cot_cua_cot_vi", "loi_vi", "content_vi"]:
                val = result.get(k)
                if val:
                    e[k] = val
                    e[k.replace("_vi", "_en")] = val
            time.sleep(0.6)
        except Exception as ex:
            print(f"[{eid}] ERROR {ex}")
            time.sleep(1.0)

    for idx, e in enumerate(entries):
        e["order_index"] = idx

    docx_raw = DOCX_TEXT.read_text(encoding="utf-8", errors="ignore") if DOCX_TEXT.exists() else ""
    for ex in EXAMPLES:
        eid = ex["id"]
        if eid in entries_by_id:
            e = entries_by_id[eid]
        else:
            e = {
                "id": eid,
                "title_vi": ex["title_vi"],
                "title_en": ex["title_en"],
                "summary_vi": "",
                "summary_en": "",
                "content_vi": "",
                "content_en": "",
                "cot_y_vi": "",
                "cot_y_en": "",
                "cot_cua_cot_vi": "",
                "cot_cua_cot_en": "",
                "loi_vi": "",
                "loi_en": "",
                "image_url": "",
                "category": ex["category"],
                "order_index": len(entries),
            }
            entries.append(e)
            entries_by_id[eid] = e

        raw = docx_raw if eid == "vi-du-nau-com" else manual_example_prompt(eid)
        if not raw:
            continue
        try:
            print(f"[{eid}] enriching example ({len(raw)} raw chars)")
            result = call_deepseek(e["title_vi"], raw, is_example=True)
            for k in ["summary_vi", "cot_y_vi", "cot_cua_cot_vi", "loi_vi", "content_vi"]:
                val = result.get(k)
                if val:
                    e[k] = val
                    e[k.replace("_vi", "_en")] = val
            time.sleep(0.6)
        except Exception as ex:
            print(f"[{eid}] ERROR {ex}")
            time.sleep(1.0)

    for idx, e in enumerate(entries):
        e["order_index"] = idx

    save_seed_entries(entries, seed_text, m)
    print(f"Wrote {SEED_PATH} with {len(entries)} entries")


def manual_example_prompt(eid):
    prompts = {
        "vi-du-quet-nha": "Viết ví dụ áp dụng trí tuệ vào việc quét nhà cho gia đình, theo 4 bước: Nhận ra, Đưa khuôn, Bám. Quy chiếu 8 Nguyên lý cuộc đời, 7 Đạo, Ý pháp Nhân duyên, Tập khí, Hiếu Lễ Nghĩa, Nguyên tắc đúng luật, Tâm từ bi.",
        "vi-du-xu-ly-email": "Viết ví dụ áp dụng trí tuệ vào việc xử lý email công việc, theo 4 bước: Nhận ra, Đưa khuôn, Bám. Quy chiếu NLCĐ 3 Thời thế, NLCĐ 4 Xét người, NLCĐ 5 Kiểm soát, Đạo Trung, Đạo Nghĩa, Ý pháp Nhân quả, Ý pháp Triệt để.",
        "vi-du-hop": "Viết ví dụ áp dụng trí tuệ vào cuộc họp nhóm, theo 4 bước: Nhận ra, Đưa khuôn, Bám. Quy chiếu NLCĐ 1 Ta là ai, NLCĐ 2 Ta sinh ra để làm gì, NLCĐ 4 Xét người, Đạo Hiếu, Đạo Nghĩa, Ý pháp Nhân duyên, Tâm từ bi.",
        "vi-du-mua-sam": "Viết ví dụ áp dụng trí tuệ vào việc mua sắm cho gia đình, theo 4 bước: Nhận ra, Đưa khuôn, Bám. Quy chiếu NLCĐ 5 Kiểm soát tài chính, Đạo Hiếu, Đạo Tình, Ý pháp Nợ công nợ của, Tâm từ bi, Nguyên tắc đúng luật.",
    }
    return prompts.get(eid, "")


if __name__ == "__main__":
    main()
