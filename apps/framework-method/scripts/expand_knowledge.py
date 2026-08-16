import json
import os
import re
import time
import urllib.request
import unicodedata
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
PDF_TEXT = Path("/home/ubuntu/ocr_pages/pdf_full.txt")
SEED_PATH = REPO / "src" / "data" / "knowledgeSeed.ts"

API_KEY = os.environ["DEEPSEEK_API_KEY"]
BASE_URL = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com")


def to_base(s):
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.replace("Đ", "D").replace("đ", "d")


def clean_raw(lines):
    out = []
    for line in lines:
        line = line.replace("\x0c", "").rstrip()
        stripped = line.strip()
        if not stripped:
            continue
        if re.match(r"^\d{1,3}$", stripped):
            continue
        if re.match(r"^[@©®™•*\+\-oes]$", stripped):
            continue
        out.append(line)
    return "\n".join(out)


def detect_major_sections(lines):
    base_lines = [to_base(l) for l in lines]
    # Major headings: COT DU LIEU PHAN 1, PHAN 1..11, closing intros
    pat = re.compile(
        r"^(?:.{0,10}phan\s*(\d+|[ivx]+)\s*[:.]"
        r"|cot\s+du\s+lieu\s+phan\s*1"
        r"|tri\s*tue\s*de\s*lam\s*gi"
        r"|phuong\s*phap\s*ung\s*dung)",
        re.I,
    )
    matches = []
    for i, b in enumerate(base_lines):
        m = pat.search(b)
        if m:
            matches.append((i, lines[i].strip()))
    sections = []
    for idx, (start, title) in enumerate(matches):
        end = matches[idx + 1][0] if idx + 1 < len(matches) else len(lines)
        sections.append({"title": title, "start": start, "end": end})
    return sections


def load_seed_entries():
    seed_text = SEED_PATH.read_text(encoding="utf-8")
    m = re.search(
        r"(export const defaultKnowledgeEntries: KnowledgeEntry\[\] = )(\[.*?\]);",
        seed_text,
        re.S,
    )
    if not m:
        raise RuntimeError("Cannot parse knowledgeSeed.ts")
    return json.loads(m.group(2)), seed_text, m


def slugify(title):
    s = unicodedata.normalize("NFKD", title)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.lower()
    s = re.sub(r"[^a-z0-9\s]", "", s)
    s = re.sub(r"\s+", "-", s.strip())
    return s


def normalize_title(t):
    return re.sub(r"\s+", " ", to_base(t).lower().strip())


def call_deepseek_expand(section_title, raw_text, existing_titles, retries=2):
    existing_list = ", ".join(existing_titles[:50]) if existing_titles else "(none)"
    prompt = f"""Bạn là trợ lý làm sạch và tách nội dung tri thức từ OCR tiếng Việt nhiễu.

PHẦN: {section_title}

NỘI DUNG GỐC:
{raw_text}

Hãy phân tích nội dung trên, tách thành các tiểu mục/mục con rõ ràng. Với mỗi tiểu mục, trả về một đối tượng JSON với các trường:
{{"id": "slug-tieng-viet-khong-dau", "title_vi": "...", "summary_vi": "...", "cot_y_vi": "...", "cot_cua_cot_vi": "...", "loi_vi": "...", "content_vi": "..."}}

Yêu cầu:
- summary_vi: Cốt ý / tóm tắt 1-2 câu.
- cot_y_vi: Ý chính 1 câu.
- cot_cua_cot_vi: Tinh túy, cốt của cốt, 1 câu ngắn (KHÔNG lặp tiêu đề).
- loi_vi và content_vi: Nội dung chi tiết 8-15 dòng, có gạch đầu dòng, sạch OCR, dễ đọc, giữ đúng ý chính, KHÔNG bịa thêm.
- Không tạo mục cho các tiêu đề đã có trong danh sách sau: {existing_list}
- Nếu không còn mục con đáng tách, hãy trả về mảng rỗng [] (hoặc mảng chỉ với các mục chính yếu, tối đa 8 mục).
- Chỉ trả về JSON array duy nhất, không giải thích."""
    last_err = None
    for attempt in range(retries + 1):
        req = urllib.request.Request(
            f"{BASE_URL}/chat/completions",
            data=json.dumps(
                {
                    "model": "deepseek-chat",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                    "max_tokens": 6000,
                    "response_format": {"type": "json_object"},
                }
            ).encode(),
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            resp = urllib.request.urlopen(req, timeout=180).read().decode()
            data = json.loads(resp)
            text = data["choices"][0]["message"]["content"].strip()
            # parse array or {"entries": [...]}
            if text.startswith("["):
                arr = json.loads(text)
            else:
                obj = json.loads(text)
                if isinstance(obj, list):
                    arr = obj
                else:
                    arr = obj.get("entries", obj.get("data", []))
            return arr if isinstance(arr, list) else []
        except Exception as ex:
            last_err = ex
            time.sleep(2.0)
    raise last_err


def dedupe_new_entries(new_entries, existing_entries):
    existing_ids = {e["id"] for e in existing_entries}
    existing_titles = {normalize_title(e.get("title_vi", "")) for e in existing_entries}
    out = []
    for e in new_entries:
        if not isinstance(e, dict):
            continue
        eid = e.get("id", "").strip()
        title = e.get("title_vi", "").strip()
        if not eid or not title:
            continue
        # avoid conflict with existing ids/titles
        if eid in existing_ids or normalize_title(title) in existing_titles:
            base_id = eid
            n = 2
            while f"{base_id}-{n}" in existing_ids:
                n += 1
            eid = f"{base_id}-{n}"
            e["id"] = eid
        existing_ids.add(eid)
        existing_titles.add(normalize_title(title))
        # mirror vi->en
        for k in ["summary_vi", "cot_y_vi", "cot_cua_cot_vi", "loi_vi", "content_vi"]:
            if e.get(k):
                e[k.replace("_vi", "_en")] = e[k]
        for k in ["image_url", "category", "order_index"]:
            if k not in e:
                e[k] = "" if k != "order_index" else 0
        e.setdefault("category", "concept")
        e.setdefault("image_url", "")
        out.append(e)
    return out


def main():
    with PDF_TEXT.open(encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()

    sections = detect_major_sections(lines)
    print(f"Detected {len(sections)} major sections")
    for s in sections:
        print(f"  lines {s['start']+1}-{s['end']}: {s['title'][:80]}")

    existing_entries, seed_text, m = load_seed_entries()
    existing_titles = [normalize_title(e.get("title_vi", "")) for e in existing_entries]

    # Process sections that are NOT already covered in detail (skip Phần 1 core subsections)
    # We process all except Phần 1's known chunks to avoid huge duplication.
    skip_titles_base = [
        "phan 1. 5 mang nen tang",
        "mang 1: nguyen ly",
    ]
    all_new = []
    for sec in sections:
        sec_base = to_base(sec["title"]).lower()[:40]
        if any(sb in sec_base for sb in skip_titles_base):
            print(f"SKIP (covered): {sec['title'][:60]}")
            continue
        raw = clean_raw(lines[sec["start"] : sec["end"]])
        if len(raw) < 80:
            continue
        print(f"PROCESS: {sec['title'][:60]} ({len(raw)} chars)")
        try:
            new = call_deepseek_expand(sec["title"], raw, existing_titles + [normalize_title(x.get("title_vi","")) for x in all_new])
            print(f"  -> {len(new)} candidates")
            all_new.extend(new)
            time.sleep(0.6)
        except Exception as ex:
            print(f"  ERROR: {ex}")
            time.sleep(1.0)

    deduped = dedupe_new_entries(all_new, existing_entries)
    print(f"Adding {len(deduped)} new entries")

    if deduped:
        final_entries = existing_entries + deduped
        for idx, e in enumerate(final_entries):
            e["order_index"] = idx
        new_body = json.dumps(final_entries, ensure_ascii=False, indent=2)
        new_text = seed_text[: m.start(2)] + new_body + seed_text[m.end(2) :]
        SEED_PATH.write_text(new_text, encoding="utf-8")
        print(f"Wrote {SEED_PATH} with {len(final_entries)} entries")
    else:
        print("No new entries added")


if __name__ == "__main__":
    main()
