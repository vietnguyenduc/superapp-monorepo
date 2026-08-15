import json
import re
import sys
import time
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
PDF_TEXT = Path("/home/ubuntu/ocr_pages/pdf_full.txt")
SEED_PATH = REPO / "src" / "data" / "knowledgeSeed.ts"

MAX_RAW = 5000
import os
API_KEY = os.environ["DEEPSEEK_API_KEY"]
BASE_URL = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com")

HEADINGS = [
    # (id, start regex, optional end regex)
    ("nltt-overview", r"^1/5\s+NGUYÊN LÝ TRÍ TUỆ", None),
    ("nltt-1", r"^1\.\s+Nguyên lý trí tuệ số 1", None),
    ("nltt-2", r"^2\.\s+Nguyên lý trí tuệ số 2", None),
    ("nltt-3", r"^3\.\s+Nguyên lý trí tuệ số 3", None),
    ("nltt-4", r"^4\.\s+Nguyên lý trí tuệ số 4", None),
    ("nltt-5", r"^5\.\s+Nguyên lý trí tuệ số 5", None),
    ("nlcd-overview", r"^2/8\s+NGUYÊN LÝ CUỘC ĐỜI", None),
    ("nlcd-1", r"^NLCP?Đ?\s*1:\s*TA LÀ AI", None),
    ("nlcd-2", r"^NLCP?Đ?\s*2:\s*TA SINH RA", None),
    ("nlcd-3", r"^NLCP?Đ?\s*3:\s*THỜI THẾ", None),
    ("nlcd-4", r"^NLCP?Đ?\s*4:\s*XÉT NGƯỜI", None),
    ("nlcd-5", r"^NLCP?Đ?\s*5:\s*KI[ỂỄ]M SOÁT", None),
    ("nlcd-6", r"^NLCP?Đ?\s*6:\s*XOAY CHUY[ÊỂ]N VẬN MỆNH", None),
    ("nlcd-7", r"^NLCP?Đ?\s*7:\s*ĐÍCH", None),
    ("nlcd-8", r"^NLCP?Đ?\s*8:\s*ĐI[ÊE]M T[ƯU]A", None),
    ("nls-1", r"^-\s+Nguyên lý sống 1", r"^NLC[ĐP]?\s+l?:"),
    ("nls-2", r"^-\s+Nguyên lý sống 2", None),
    ("nls-3", r"^-\s+Nguyên lý sống 3", None),
    ("dao-overview", r"^2\.\s+ĐẠO:\s*7 ĐẠO LÀM NGƯỜI", None),
    ("dao-1", r"^1\)\s+ĐẠO LÝ", None),
    ("dao-2", r"^_?2\)\s+ĐẠO SINH", None),
    ("dao-3", r"^3\)\s+ĐẠO HIỂU", None),
    ("dao-4", r"^4\)\s+ĐẠO TRUNG", None),
    ("dao-5", r"^5\)\s+ĐẠO NGHĨA", None),
    ("dao-6", r"^6\)\s+ĐẠO TÌNH", None),
    ("dao-7", r"^7\)\s+ĐẠO LUẬT", None),
    ("yphap-overview", r"^3\.\s+MĂNG PHÁP", None),
    ("yphap-1", r"^1\)\s+Ý\s*pháp Nhân quả", None),
    ("yphap-2", r"^2\)\s+Ý\s*pháp Nhân duyên", None),
    ("yphap-3", r"^3\)\s+Ý\s*pháp Nợ công", None),
    ("yphap-4", r"^4\)\s+Ý\s*pháp Oan gia trái chủ", None),
    ("yphap-5", r"^5\)\s+Ý\s*pháp Oan khiên tích kiết", None),
    ("yphap-6", r"^6\)\s+Ý\s*pháp Học tài thi phận", None),
    ("yphap-7", r"^7\)\s+Ý\s*pháp Phúc\s*$", None),
    ("yphap-8", r"^_?8\)\s*Ý\s*pháp Phúc đức", None),
    ("yphap-9", r"^9\)\s+Ý\s*pháp Phúc Nghiệp", None),
    ("yphap-10", r"^10\)\s+Ý\s*pháp Công", None),
    ("yphap-11", r"^11\)\s+Ý\s*pháp Tham sân sỉ", None),
    ("yphap-12", r"^12\)\s+Ý\s*pháp Tập khí", None),
    ("yphap-13", r"^13\)\s+Ý\s*pháp Lục đạo luân hồi", None),
    ("yphap-14", r"^14\)\s+Triệt để", None),
    ("yphap-15", r"^15\)\s+Ý\s*pháp Hoan hỷ", r"^\+\*?\s*7\s*PHƯƠNG\s*PHÁP"),
    ("cong-thuc", r"^18\.\s+CÔNG THỨC ĐỐI CẢNH", None),
]

def clean_raw(lines):
    out = []
    for line in lines:
        line = line.replace("\x0c", "").rstrip()
        stripped = line.strip()
        if not stripped:
            continue
        # skip page numbers and isolated symbols
        if re.match(r"^\d{1,3}$", stripped):
            continue
        if re.match(r"^[@©®™•\*\+\-oes]$", stripped):
            continue
        out.append(line)
    return "\n".join(out)

def extract_sections():
    with PDF_TEXT.open(encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()

    starts = {}
    for eid, start_pat, _ in HEADINGS:
        pat = re.compile(start_pat, re.IGNORECASE)
        for i, line in enumerate(lines):
            if pat.search(line):
                starts[eid] = i
                break

    sorted_ids = sorted(starts, key=lambda x: starts[x])
    sections = {}
    for idx, eid in enumerate(sorted_ids):
        start = starts[eid]
        _, _, end_pat = next(h for h in HEADINGS if h[0] == eid)
        if end_pat:
            end_pat_re = re.compile(end_pat, re.IGNORECASE)
            end = len(lines)
            for j in range(start + 1, len(lines)):
                if end_pat_re.search(lines[j]):
                    end = j
                    break
        else:
            if idx + 1 < len(sorted_ids):
                end = starts[sorted_ids[idx + 1]]
            else:
                end = len(lines)
        raw = clean_raw(lines[start:end])
        if len(raw) > MAX_RAW:
            # cut at paragraph boundary
            cut = raw.rfind("\n\n", 0, MAX_RAW)
            if cut < MAX_RAW * 0.5:
                cut = raw.rfind("\n", 0, MAX_RAW)
            raw = raw[:cut] if cut > 0 else raw[:MAX_RAW]
        sections[eid] = raw
    return sections

def call_deepseek(title, raw):
    prompt = f"""Bạn là trợ lý làm sạch và viết lại nội dung tri thức cho app từ đoạn văn bản OCR tiếng Việt (nhiễu, có thể bị cắt). Dựa trên tiêu đề và đoạn văn dưới đây, hãy viết lại rõ ràng, có cấu trúc, giữ đúng ý chính, KHÔNG bịa đặt thêm ý ngoài nội dung có sẵn. Đừng lặp lại tiêu đề trong các trường nội dung.

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
    req = urllib.request.Request(
        f"{BASE_URL}/chat/completions",
        data=json.dumps({
            "model": "deepseek-chat",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.5,
            "max_tokens": 2000,
            "response_format": {"type": "json_object"},
        }).encode(),
        headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
        method="POST",
    )
    resp = urllib.request.urlopen(req, timeout=90).read().decode()
    data = json.loads(resp)
    return json.loads(data["choices"][0]["message"]["content"])

def main(target_ids=None):
    sections = extract_sections()
    seed_text = SEED_PATH.read_text(encoding="utf-8")
    m = re.search(r"(export const defaultKnowledgeEntries: KnowledgeEntry\[\] = )(\[.*?\]);", seed_text, re.S)
    all_entries = json.loads(m.group(2))
    target_set = set(target_ids) if target_ids else None

    for i, e in enumerate(all_entries):
        eid = e["id"]
        if target_set and eid not in target_set:
            continue
        raw = sections.get(eid, "").strip()
        if not raw:
            print(f"[{i+1}/{len(all_entries)}] {eid}: no raw section, skip")
            time.sleep(0.3)
            continue
        try:
            print(f"[{i+1}/{len(all_entries)}] {eid}: enriching ({len(raw)} raw chars)")
            result = call_deepseek(e["title_vi"], raw)
            for k in ["summary_vi", "cot_y_vi", "cot_cua_cot_vi", "loi_vi", "content_vi"]:
                if result.get(k):
                    e[k] = result[k]
                    e[k.replace("_vi", "_en")] = result[k]
            time.sleep(0.6)
        except Exception as ex:
            print(f"[{i+1}/{len(all_entries)}] {eid}: ERROR {ex}")
            time.sleep(1.0)

    new_body = json.dumps(all_entries, ensure_ascii=False, indent=2)
    new_text = seed_text[: m.start(2)] + new_body + seed_text[m.end(2):]
    SEED_PATH.write_text(new_text, encoding="utf-8")
    print(f"Wrote {SEED_PATH}")

if __name__ == "__main__":
    main(sys.argv[1:])
