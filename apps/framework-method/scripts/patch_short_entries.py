import json
import re
import unicodedata
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SEED_PATH = REPO / "src" / "data" / "knowledgeSeed.ts"
PDF_TEXT = Path("/home/ubuntu/ocr_pages/pdf_full.txt")


def to_base(s):
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.replace("Đ", "D").replace("đ", "d").lower()


def clean_raw(text):
    lines = text.replace("\x0c", "").splitlines()
    out = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if re.match(r"^\d{1,3}$", stripped):
            continue
        if re.match(r"^[@©®™•*+\-oes]$", stripped, re.I):
            continue
        out.append(line.rstrip())
    return "\n".join(out)


def detect_major_sections(lines):
    base = [to_base(l) for l in lines]
    pat = re.compile(
        r"^(?:.{0,10}phan\s*(\d+|[ivx]+)\s*[:.]"
        r"|cot\s+du\s+lieu\s+phan\s*1"
        r"|tri\s*tue\s*de\s*lam\s*gi"
        r"|phuong\s*phap\s*ung\s*dung)",
        re.I,
    )
    matches = [i for i, b in enumerate(base) if pat.search(b)]
    sections = []
    for idx, start in enumerate(matches):
        end = matches[idx + 1] if idx + 1 < len(matches) else len(lines)
        sections.append({"start": start, "end": end, "lines": lines[start:end]})
    return sections


def is_strong_heading(line):
    s = line.strip()
    if not s:
        return False
    if re.match(r"^(PHẦN|PHẢN|CỐT\s+DỮ\s+LIỆU|MỤC)\b", s, re.I):
        return True
    if re.match(r"^[IVX]+\.\s+", s, re.I):
        return True
    if re.match(r"^[A-ZĐÂĂÊÔƠƯÁÉÍÓÚÝÀÈÌÒÙỲẠẸỊỌỤỴẢẺỈỎỦỶÃẼỈÕŨỸẤẾỐỚỨẬỆỘỢỰẦỀỒỜỪÀÈÌÒÙỲÁÉÍÓÚÝ0-9\s\(\)\[\]\:\-\.\?\!]+$", s) and re.search(r"[A-ZĐÂĂÊÔƠƯÁÉÍÓÚÝ]", s):
        if len(s) > 8 and len(re.findall(r"[A-ZĐÂĂÊÔƠƯÁÉÍÓÚÝ]", s)) > 2:
            return True
    return False


def extract_block(section_lines, start_idx, max_chars=3000):
    out = []
    chars = 0
    for j in range(start_idx, len(section_lines)):
        line = section_lines[j]
        if j > start_idx and is_strong_heading(line):
            break
        stripped = line.strip()
        if not stripped:
            continue
        if re.match(r"^\d{1,3}$", stripped):
            continue
        if re.match(r"^[@©®™•*+\-oes]$", stripped, re.I):
            continue
        out.append(line.rstrip())
        chars += len(line)
        if chars >= max_chars:
            break
    return "\n".join(out)


ALIASES = {
    "dao-4": ["ĐẠO TRUNG", "Đạo Trung"],
    "dao-5": ["ĐẠO NGHĨA", "Đạo Nghĩa"],
    "dao-6": ["ĐẠO TÌNH", "Đạo Tình"],
    "goc-do-cua-tri-tue": ["GÓC ĐỘ CỦA TRÍ TUỆ", "Góc độ của Trí tuệ"],
    "biet-goc-va-bam-goc": ["BIẾT GỐC VÀ BÁM GỐC", "Biết gốc và bám gốc", "Biết gốc"],
    "nguyen-tac-chuan-muc": ["CHUẨN MỰC", "Chuẩn mực"],
    "luyen": ["LUYỆN VÀ SỬA", "PHẦN 9: LUYỆN VÀ SỬA", "1.LUYỆN"],
    "goc-tri-tue": ["GỐC TRÍ TUỆ", "Gốc Trí tuệ", "Gốc"],
    "tai-sao-bo-me-can-chia-se-tri-tue-cho-con": ["TẠI SAO BỐ MẸ CẦN CHIA SẺ TRÍ TUỆ CHO CON"],
    "can-dinh-huong-cho-con": ["CẦN ĐỊNH HƯỚNG CHO CON", "CẢN ĐỊNH HƯỚNG CHO CON"],
    "phuong-phap-chia-se-tri-tue-cho-cac-con": ["PHƯƠNG PHÁP CHIA SẺ TRÍ TUỆ CHO CÁC CON"],
    "phuong-phap-ung-dung-trien-khai-cu-the": ["PHƯƠNG PHÁP ỨNG DỤNG", "PHƯƠNG PHÁP ỨNG DỤNG TRIỂN KHAI CỤ THỂ"],
    "6-gia-tri-mang-lai": ["HÌNH THÀNH 6 NÉT VĂN HÓA TRÍ TUỆ THÌ MANG LẠI", "6 NÉT VĂN HÓA", "6 GIÁ TRỊ", "TRÍ TUỆ MANG LẠI 6 GIÁ TRỊ"],
    "tri-tue-de-lam-gi": ["TRÍ TUỆ ĐỂ LÀM GÌ", "TRÍ TUỆ ĐỀ LÀM GÌ", "ĐỀ HIỂU", "ĐỂ HIỂU", "ĐỀ TRÁNH", "ĐỀ ỨNG DỤNG"],
}


def find_all_blocks(entry, sections):
    title = entry.get("title_vi", "")
    eid = entry["id"]
    aliases = ALIASES.get(eid, [])
    candidates = [c for c in [title] + aliases if c]
    norm_candidates = [to_base(c) for c in candidates]
    blocks = []
    for sec in sections:
        for i, line in enumerate(sec["lines"]):
            norm_line = to_base(line)
            if not norm_line:
                continue
            for cand in norm_candidates:
                if cand == norm_line or cand in norm_line:
                    raw = extract_block(sec["lines"], i)
                    if raw and len(raw) > 40:
                        blocks.append(clean_raw(raw))
                    break
    return blocks


def main():
    seed_text = SEED_PATH.read_text(encoding="utf-8")
    m = re.search(
        r"(export const defaultKnowledgeEntries: KnowledgeEntry\[\] = )(\[.*?\]);",
        seed_text,
        re.S,
    )
    entries = json.loads(m.group(2))

    raw_text = PDF_TEXT.read_text(encoding="utf-8", errors="ignore")
    # keep page breaks out to match wc/read line numbering
    lines = raw_text.replace("\x0c", "").splitlines()
    sections = detect_major_sections(lines)

    for e in entries:
        eid = e["id"]
        if eid not in ALIASES:
            continue
        loi = e.get("loi_vi", "")
        content = e.get("content_vi", "")
        if len(loi) >= 600 and len(content) >= 600:
            continue
        blocks = find_all_blocks(e, sections)
        if blocks:
            # pick the longest block, but prefer non-TOC blocks (longer than 250 chars)
            best = max((b for b in blocks if len(b) >= 250), key=len, default=max(blocks, key=len))
            if best:
                e["loi_vi"] = best
                e["loi_en"] = best
                e["content_vi"] = best
                e["content_en"] = best
                print(f"  expanded {eid} ({len(best)} chars)")

    new_body = json.dumps(entries, ensure_ascii=False, indent=2)
    new_text = seed_text[: m.start(2)] + new_body + seed_text[m.end(2):]
    SEED_PATH.write_text(new_text, encoding="utf-8")
    print("Saved")


if __name__ == "__main__":
    main()
