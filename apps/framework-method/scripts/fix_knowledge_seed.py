import json
import re
import unicodedata
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SEED_PATH = REPO / "src" / "data" / "knowledgeSeed.ts"
PDF_TEXT = Path("/home/ubuntu/ocr_pages/pdf_full.txt")

GROUP_ORDER = [
    "A. Mở đầu — Trí tuệ là gì?",
    "B. Nguyên lý Trí tuệ",
    "C. Nguyên lý Cuộc đời",
    "D. Nguyên lý Sống",
    "E. Đạo",
    "F. Pháp",
    "G. Quy luật",
    "H. Hiếu — Lễ — Nghĩa",
    "I. Biết gốc & Bám gốc",
    "J. Nguyên tắc",
    "K. Ý pháp mở rộng & Tâm từ bi",
    "L. Xoay chuyển",
    "M. Hành",
    "N. Luyện & Sửa",
    "O. Tu",
    "P. Kế thừa",
    "Q. Kết — Phương pháp ứng dụng",
    "R. Ví dụ",
]

GROUP_TO_SECTIONS = {
    "A. Mở đầu — Trí tuệ là gì?": [0],
    "B. Nguyên lý Trí tuệ": [1],
    "C. Nguyên lý Cuộc đời": [1],
    "D. Nguyên lý Sống": [1],
    "E. Đạo": [1],
    "F. Pháp": [1],
    "G. Quy luật": [2],
    "H. Hiếu — Lễ — Nghĩa": [3],
    "I. Biết gốc & Bám gốc": [4],
    "J. Nguyên tắc": [5],
    "K. Ý pháp mở rộng & Tâm từ bi": [6],
    "L. Xoay chuyển": [7],
    "M. Hành": [8],
    "N. Luyện & Sửa": [9],
    "O. Tu": [10],
    "P. Kế thừa": [11],
    "Q. Kết — Phương pháp ứng dụng": [0, 11],
    "R. Ví dụ": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
}

HEADING_PATTERN = re.compile(
    r"^(\s*(?:\d+[\.\)\:]?|[IVX]+[\.\:]?|PHẦN\s*\d+|PHẢN\s*\d+|CỐT\s+DỮ\s+LIỆU|XI\.|X\.|IX\.|VIII\.|VII\.|VI\.|V\.|IV\.|III\.|II\.|I\.))",
    re.IGNORECASE,
)


def to_base(s):
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.replace("Đ", "D").replace("đ", "d").lower()


def clean_text(v):
    if isinstance(v, list):
        return "\n".join(str(x) for x in v)
    if v is None:
        return ""
    return str(v)


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
    matches = []
    for i, b in enumerate(base):
        if pat.search(b):
            matches.append(i)
    sections = []
    for idx, start in enumerate(matches):
        end = matches[idx + 1] if idx + 1 < len(matches) else len(lines)
        sections.append({"title": lines[start].strip(), "start": start, "end": end, "lines": lines[start:end]})
    return sections


def group_for_entry(e):
    eid = e["id"]
    title = to_base(e.get("title_vi", ""))
    if eid.startswith("nltt-"):
        return "B. Nguyên lý Trí tuệ"
    if eid.startswith("nlcd-"):
        return "C. Nguyên lý Cuộc đời"
    if eid.startswith("nls-"):
        return "D. Nguyên lý Sống"
    if eid.startswith("dao-"):
        return "E. Đạo"
    if eid.startswith("yphap-") or eid == "cong-thuc":
        return "F. Pháp"
    if eid.startswith("quy-luat"):
        return "G. Quy luật"
    if eid in ("hieu-le-nghia", "hieu", "le", "nghia"):
        return "H. Hiếu — Lễ — Nghĩa"
    if eid.startswith("goc-") or eid in ("biet-goc-bam-goc", "biet-goc-va-bam-goc"):
        return "I. Biết gốc & Bám gốc"
    if eid.startswith("nguyen-tac"):
        return "J. Nguyên tắc"
    if eid in ("y-phap-mo-rong", "nguyen-nhan-bat-on", "7-phuong-phap-hoa-giai-bat-on",
               "doi-dao-loi-tu", "coi-ta-ba", "menh-va-su-menh", "bon-dang-tam", "goc-phat", "tam-tu-bi"):
        return "K. Ý pháp mở rộng & Tâm từ bi"
    if eid.startswith("xoay-chuyen") or eid in ("ra-soat-qua-khu", "lap-ke-hoach-thoi-gian-doi-dao-loi-tu",
                                                  "dua-khuon-tri-tue-vao-cuoc-song"):
        return "L. Xoay chuyển"
    if eid.startswith("hanh"):
        return "M. Hành"
    if eid.startswith("luyen") or eid.startswith("sua") or eid in ("tai-sao-can-phai-sua", "sua-thi-can-sua-gi"):
        return "N. Luyện & Sửa"
    if eid.startswith("tu") or eid in ("dung-dao", "tron-dao", "hanh-dao-2", "cau-dao", "tu-dao",
                                         "tai-sao-can-phai-tu", "tu-de-dat-gi", "tu-duc-gom-nhung-gi"):
        return "O. Tu"
    if eid.startswith("ke-thua") or eid.startswith("phan-11-") or eid.startswith("tai-sao-bo-me-") \
            or eid.startswith("can-dinh-huong-") or eid.startswith("phuong-phap-chia-se-") \
            or eid.startswith("hang-ngay-chia-se-"):
        return "P. Kế thừa"
    if eid.startswith("vi-du-"):
        return "R. Ví dụ"
    if eid in ("tam-linh", "thuc-te"):
        return "A. Mở đầu — Trí tuệ là gì?"
    # Intro / outro concepts
    if eid in ("goc-do-cua-tri-tue", "quy-chuan-cua-tri-tue", "dinh-nghia-cua-tri-tue",
               "gia-tri-cua-tri-tue", "tri-tue-la-khuon-vang-thuoc-ngoc",
               "tri-tue-la-thuc-te-khoa-hoc-tam-linh", "tri-tue-dinh-huong-10-dieu",
               "tri-tue-khac-kien-thuc-tri-thuc-tri-thuc", "tri-tue-mang-lai-6-gia-tri", "nghiep-doi"):
        return "A. Mở đầu — Trí tuệ là gì?"
    if eid in ("tri-tue-de-lam-gi", "6-net-van-hoa-tri-tue", "6-gia-tri-mang-lai",
               "phuong-phap-ung-dung-trien-khai-cu-the"):
        return "Q. Kết — Phương pháp ứng dụng"
    return "Q. Kết — Phương pháp ứng dụng"


def find_title_in_section(section_lines, title, aliases=None):
    """Find the line index in section_lines that best matches title or aliases."""
    candidates = [title]
    if aliases:
        candidates.extend(aliases)
    norm_candidates = [to_base(c) for c in candidates if c]
    best = -1
    best_score = 0
    for i, line in enumerate(section_lines):
        norm_line = to_base(line)
        if not norm_line:
            continue
        for cand in norm_candidates:
            # prefer exact heading or contained in line
            if cand == norm_line:
                return i
            if cand in norm_line:
                # score by closeness to start and length ratio
                score = len(cand) / max(len(norm_line), 1)
                if score > best_score:
                    best_score = score
                    best = i
    return best


def extract_block(section_lines, start_idx, max_chars=1800):
    """Extract from start_idx until next strong heading or max_chars."""
    out = []
    chars = 0
    for j in range(start_idx, len(section_lines)):
        line = section_lines[j]
        if j > start_idx:
            if HEADING_PATTERN.match(line) and chars > 100:
                break
            if re.match(r"^\s*\d+[\.\)\:]?\s+[A-ZĐÂĂÊÔƠƯÁÉÍÓÚÝÀÈÌÒÙỲẠẸỊỌỤỴẢẺỈỎỦỶÃẼỈÕŨỸẤẾỐỚỨẬỆỘỢỰẦỀỒỜỪÀÈÌÒÙỲÁÉÍÓÚÝ]", line):
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


TITLE_ALIASES = {
    "tri-tue-la-khuon-vang-thuoc-ngoc": ["TRÍ TUỆ LÀ KHUÔN VÀNG THƯỚC NGỌC"],
    "tri-tue-la-thuc-te-khoa-hoc-tam-linh": ["TRÍ TUỆ LÀ THỰC TẾ - KHOA HỌC - TÂM LINH"],
    "luyen-viet": ["Luyện viết", "LUYỆN VIẾT"],
    "luyen-the-phap": ["Luyện thế pháp", "LUYỆN THẾ PHÁP", "thế pháp"],
    "luyen-y-thuc-hang-ngay": ["Luyện ý thức hàng ngày", "LUYỆN Ý THỨC"],
    "luyen-tro-thanh-cao-nhan": ["Luyện trở thành cao nhân", "caonhân"],
    "luyen-tam-dao-tam-chi-tam-phap": ["Luyện Tâm đạo - Tâm chí - Tâm pháp", "Tâm đạo"],
    "luyen-tam-khong": ["Luyện Tâm không", "Tâm không"],
    "luyen-tro-thanh-bac-cao-dao": ["Luyện trở thành bậc cao đạo", "bậc cao đạo"],
    "luyen-trong-hoc-song-hanh-tu-luyen": ["Luyện trong Học - Sống - Hành - Tu - Luyện"],
    "tai-sao-can-phai-tu": ["TẠI SAO CẦN PHẢI TU", "Tại sao cần phải tu"],
    "tu-de-dat-gi": ["TU ĐỂ ĐẠT GÌ", "TUDÉ ĐẠT GÌ", "Tu để đạt gì"],
    "tu-duc-gom-nhung-gi": ["TU ĐỨC GỒM NHỮNG GÌ", "Tu đức gồm những gì"],
    "dung-dao": ["ĐÚNG ĐẠO", "Đúng đạo", "ĐỨNG ĐẠO"],
    "tron-dao": ["TRÒN ĐẠO", "Tròn đạo"],
    "hanh-dao-2": ["HÀNH ĐẠO", "Hành đạo"],
    "cau-dao": ["CẦU ĐẠO", "CẬU ĐẠO", "Cầu đạo"],
    "tu-dao": ["TU ĐẠO", "Tu đạo"],
    "sua": ["Sửa", "sửa", "SỬA"],
    "tai-sao-can-phai-sua": ["Tại sao cần phải sửa"],
    "sua-thi-can-sua-gi": ["Sửa thì cần sửa gì"],
    "hieu": ["HIẾU", "Hiếu"],
    "le": ["LỄ", "Lễ"],
    "nghia": ["NGHĨA", "Nghĩa"],
    "goc-tri-tue": ["Gốc Trí tuệ", "GỐC TRÍ TUỆ"],
    "nguyen-tac-chuan-muc": ["Chuẩn mực", "CHUẨN MỰC"],
    "6-gia-tri-mang-lai": ["HÌNH THÀNH 6 NÉT VĂN HÓA TRÍ TUỆ THÌ MANG LẠI", "6 GIÁ TRỊ"],
    "tri-tue-de-lam-gi": ["TRÍ TUỆ ĐỂ LÀM GÌ", "Trí tuệ để làm gì"],
    "phuong-phap-ung-dung-trien-khai-cu-the": ["PHƯƠNG PHÁP ỨNG DỤNG", "phương pháp ứng dụng"],
    "tai-sao-bo-me-can-chia-se-tri-tue-cho-con": ["TẠI SAO BỐ MẸ CẦN CHIA SẺ TRÍ TUỆ CHO CON"],
    "can-dinh-huong-cho-con": ["CẦN ĐỊNH HƯỚNG CHO CON"],
    "hang-ngay-chia-se-tri-tue-voi-moi-nguoi-trong-nha": ["HÀNG NGÀY CHIA SẺ TRÍ TUỆ VỚI MỌI NGƯỜI TRONG NHÀ"],
    "6-net-van-hoa-tri-tue": ["6 NÉT VĂN HÓA", "6 nét văn hóa"],
    "goc-do-cua-tri-tue": ["GÓC ĐỘ CỦA TRÍ TUỆ", "Góc độ của Trí tuệ"],
    "quy-chuan-cua-tri-tue": ["QUY CHUẨN CỦA TRÍ TUỆ", "Quy chuẩn của Trí tuệ"],
    "dinh-nghia-cua-tri-tue": ["ĐỊNH NGHĨA CỦA TRÍ TUỆ", "Định nghĩa của Trí tuệ"],
    "gia-tri-cua-tri-tue": ["GIÁ TRỊ CỦA TRÍ TUỆ", "Giá trị của Trí tuệ"],
    "tri-tue-dinh-huong-10-dieu": ["TRÍ TUỆ ĐỊNH HƯỚNG", "Trí tuệ định hướng"],
    "tri-tue-khac-kien-thuc-tri-thuc-tri-thuc": ["Trí tuệ khác", "TRÍ TUỆ KHÁC"],
    "tri-tue-mang-lai-6-gia-tri": ["TRÍ TUỆ MANG LẠI 6 GIÁ TRỊ", "Trí tuệ mang lại 6 giá trị"],
    "bon-dang-tam": ["BỐN DẠNG TÂM", "Bốn dạng tâm"],
    "goc-phat": ["GỐC PHẬT", "Gốc Phật"],
    "doi-dao-loi-tu": ["ĐỜI - ĐẠO - LỢI TƯ", "Đời - Đạo - Lợi tư"],
    "coi-ta-ba": ["CÕI TA BÀ", "Cõi Ta bà"],
    "menh-va-su-menh": ["MỆNH VÀ SỨ MỆNH", "Mệnh và Sứ mệnh"],
    "y-phap-mo-rong": ["Ý PHÁP MỞ RỘNG", "Ý pháp mở rộng"],
    "nguyen-nhan-bat-on": ["NGUYÊN NHÂN BẤT ỔN", "Nguyên nhân bất ổn"],
    "7-phuong-phap-hoa-giai-bat-on": ["7 PHƯƠNG PHÁP HÓA GIẢI BẤT ỔN", "7 phương pháp hóa giải bất ổn"],
}


def expand_from_source(entry, sections):
    eid = entry["id"]
    group = entry.get("group_vi") or group_for_entry(entry)
    section_idxs = GROUP_TO_SECTIONS.get(group, [])
    title = entry.get("title_vi", "")
    aliases = TITLE_ALIASES.get(eid, [])
    for idx in section_idxs:
        sec = sections[idx]
        start_idx = find_title_in_section(sec["lines"], title, aliases)
        if start_idx >= 0:
            raw = extract_block(sec["lines"], start_idx)
            if raw and len(raw) > 60:
                return clean_raw(raw)
    return ""


def main():
    seed_text = SEED_PATH.read_text(encoding="utf-8")
    m = re.search(
        r"(export const defaultKnowledgeEntries: KnowledgeEntry\[\] = )(\[.*?\]);",
        seed_text,
        re.S,
    )
    if not m:
        raise RuntimeError("Cannot parse knowledgeSeed.ts")
    entries = json.loads(m.group(2))

    lines = PDF_TEXT.read_text(encoding="utf-8", errors="ignore").splitlines()
    sections = detect_major_sections(lines)
    print(f"Detected {len(sections)} major sections")

    # Normalize fields and assign groups
    for e in entries:
        for k in ["summary_vi", "summary_en", "cot_y_vi", "cot_y_en",
                  "cot_cua_cot_vi", "cot_cua_cot_en", "loi_vi", "loi_en",
                  "content_vi", "content_en"]:
            e[k] = clean_text(e.get(k, ""))
        group = group_for_entry(e)
        e["group_vi"] = group
        e["group_en"] = group

    # Fill loi from content if content is richer
    for e in entries:
        loi = e.get("loi_vi", "")
        content = e.get("content_vi", "")
        if len(content) > len(loi) + 20:
            e["loi_vi"] = content
            e["loi_en"] = e.get("content_en") or content

    # Expand short entries from source OCR
    expanded = 0
    for e in entries:
        loi = e.get("loi_vi", "")
        content = e.get("content_vi", "")
        if len(loi) < 200 and len(content) < 400:
            raw = expand_from_source(e, sections)
            if raw:
                e["loi_vi"] = raw
                e["loi_en"] = raw
                e["content_vi"] = raw
                e["content_en"] = raw
                expanded += 1
                print(f"  expanded {e['id']} ({len(raw)} chars)")

    print(f"Expanded {expanded} entries from source")

    # Reorder by group then existing order
    group_rank = {g: i for i, g in enumerate(GROUP_ORDER)}
    entries.sort(key=lambda e: (group_rank.get(e.get("group_vi"), 999), e.get("order_index", 0)))
    for i, e in enumerate(entries):
        e["order_index"] = i

    new_body = json.dumps(entries, ensure_ascii=False, indent=2)
    new_text = seed_text[: m.start(2)] + new_body + seed_text[m.end(2):]
    SEED_PATH.write_text(new_text, encoding="utf-8")
    print(f"Wrote {SEED_PATH} with {len(entries)} entries")


if __name__ == "__main__":
    main()
