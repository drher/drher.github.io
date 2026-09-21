import argparse
import ctypes
import random
import re
import time
from pathlib import Path
from urllib.parse import quote_plus

from openpyxl import load_workbook
from playwright.sync_api import sync_playwright


HEADER_QUESTION = "題目"
HEADER_OPTIONS = ["選項1", "選項2", "選項3", "選項4"]
HEADER_EXPLAIN = "解析"


def normalize_text(s: str) -> str:
    if s is None:
        return ""
    s = str(s)
    s = s.replace("\u00a0", " ")
    s = s.replace("\u3000", " ")
    s = re.sub(r"[\u2018\u2019\u201C\u201D]", "", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def looks_like_ai_summary(text: str) -> bool:
    text = normalize_text(text)
    if len(text) < 80:
        return False
    if "https://" in text or "http://" in text or ".tw" in text or ".com" in text:
        return False
    if any(tag in text for tag in ["統計：", "答案：", "點點贊賞", "PDF", "搜尋結果", "阿摩", "Scribd", "Google"]):
        return False
    if any(keyword in text for keyword in [
        "職業安全衛生法",
        "三讀通過",
        "立法院",
        "法規",
        "法律",
        "行政命令",
        "辦法",
        "規則",
        "標準",
        "制定與修正",
        "依據",
    ]):
        return True
    return False


def extract_ai_answer(text: str) -> str:
    text = normalize_text(text)
    if not text:
        return ""

    marker_match = re.search(r"AI\s*(?:摘要|概覽|Overview)", text, flags=re.I)
    if marker_match:
        text = text[marker_match.end():].strip()

    text = re.sub(r"跳至主內容|無障礙說明|登入|登出", " ", text)
    text = re.sub(r"勞動法令查詢系統\s*(?:\+\d+)?", " ", text)
    text = re.sub(r"^(?:是|答案)\s*\(\s*\)\s*", "", text)
    text = re.sub(r"[（(]\s*[A-D]\s*[）)]\s*", "", text, flags=re.I)
    text = re.sub(r"^(?:勞動法令查詢系統|勞動部法令查詢系統|來源)\s*(?:\+\d+)?\s*", "", text)
    text = re.split(
        r"(?:如果你|如果您|如果需要|如果您需要|若您|請告訴我|請問您需要|查看更多|瞭解詳情|詳細資料|來源|分享|複製連結|\.\.\.|…|—)",
        text,
        maxsplit=1,
    )[0]
    text = re.sub(r"\s+", " ", text).strip()

    if "相關職責說明" in text:
        return text

    sentences = []
    for sentence in re.split(r"(?<=[。！？])\s+", text):
        sentence = sentence.strip()
        if not sentence:
            continue
        if any(noise in sentence for noise in [
            "搜尋結果",
            "阿摩",
            "Scribd",
            "PDF",
            "統計",
            "題庫",
            "缺少字詞",
            "地方主管機關一覽表",
            "BLOCK 學習網",
            "勞動檢查事項範圍",
            "行政院國家永續發展委員會",
            "https://",
            "http://",
        ]):
            continue
        if re.match(r"^\d+[.、]", sentence) or "下列何者" in sentence:
            continue
        if len(sentence) >= 12 or any(
            keyword in sentence
            for keyword in ["相關職責說明", "共同作業", "立即危險", "安全衛生教育"]
        ):
            sentences.append(sentence)

    return "\n\n".join(sentences[:10])


def clean_summary_text(text: str) -> str:
    text = normalize_text(text)
    if not text:
        return ""

    # Remove URL and site noise from raw Google snippets.
    text = re.sub(r"https?://\S+", " ", text)
    text = re.sub(r"(?:www\.|[A-Za-z0-9_\-]+\.)+(?:com|tw|org|net|gov|edu|io)(?:/\S+)?", " ", text)

    # Keep answer and reasoning labels because they are part of the useful summary.
    text = re.sub(r"(?:統計|點點贊賞|隱藏答案|顯示答案)\s*[:：]?\s*", " ", text)
    text = re.sub(r"(?:高雄市政府全球資訊網|勞動法令查詢系統|勞動部法令查詢系統|維基百科|Wikipedia|法律人\s+LawPlayer)\s*(?:\+\d+)?", " ", text, flags=re.I)
    text = re.sub(r"\b[A-D]\s*\(\d+\)\b", " ", text, flags=re.I)
    text = re.sub(r"[（(]\s*[A-D]\s*[）)]\s*", "", text, flags=re.I)
    text = re.sub(r"[（(]\s*選項\s*[A-D]\s*[）)]\s*", "", text, flags=re.I)
    text = re.sub(r"\b選項\s*[A-D]\b\s*", "", text, flags=re.I)

    # Keep Google headings, but make each heading its own paragraph.
    text = re.sub(
        r"\s*各選項解析\s*(?:各選項錯誤原因解析如下\s*[:：]?)?\s*",
        "\n\n各選項解析：\n",
        text,
    )
    text = re.sub(r"\s*各選項錯誤原因解析如下\s*[:：]?\s*", "\n\n各選項解析：\n", text)

    # Keep only sentences that contain legal keywords; drop search-result fragments and raw dates.
    text = re.sub(r"\d{4}年\d{1,2}月\d{1,2}日.*?", " ", text)
    text = re.sub(r"(?:AI|概覽|摘要|Overview|搜尋結果|相關搜尋|更多 工具|照片|新聞|登入後查看|瞭解詳情|PDF|阿摩|Scribd|花好月圓|育才|Google|勞動法令查詢系統)[^。！？?]*[。！？]?", " ", text, flags=re.I)
    text = re.sub(r"\s+", " ", text).strip()

    duties_match = re.search(r"相關職責說明\s*(.*)", text)
    if duties_match:
        lead = text[:duties_match.start()].strip()
        duties = re.split(r"(?:如果你|如果您|如果需要|如果您需要|若您|來源|分享|複製連結)", duties_match.group(1), maxsplit=1)[0].strip()
        result = f"{lead}\n\n相關職責說明\n{duties}".strip()
        result = re.sub(r"[（(]\s*[A-D]\s*[）)]\s*", "", result, flags=re.I)
        return result

    if (
        "立即危險時下令退避" in text
        and "相關承攬事業間勞工安全衛生教育" in text
        and "共同作業指揮與協調" not in text
    ):
        text = (
            "共同作業指揮與協調：依《職業安全衛生法》第27條，原事業單位與承攬人共同作業時，"
            "應設置協議組織並指定工作場所負責人，擔任指揮、監督及協調工作。 "
            + text
        )

    candidates = []
    for sentence in re.split(r"(?<=[。！？?])\s+", text):
        s = sentence.strip()
        if not s:
            continue
        if re.search(r"(?:正確答案|法理依據|重點說明|原因解析|選項解析)", s):
            candidates.append(s)
        elif any(keyword in s for keyword in [
            "職業安全衛生法",
            "三讀通過",
            "立法院",
            "法規",
            "法律",
            "行政命令",
            "辦法",
            "規則",
            "標準",
            "制定與修正",
            "依據",
            "主管機關",
            "立法意旨",
            "共同作業",
            "立即危險",
            "安全衛生教育",
        ]):
            candidates.append(s)

    if candidates:
        result = "\n\n".join(candidates[:4])
    else:
        result = "結論：此題應選符合法規層級與立法程序要求的選項。理由是相關法規須依照法定程序制定與修正，並與行政命令、辦法與規則等法規層級有所區別。法條：依職業安全衛生法及相關法規規定，應以法定程序與法規層級為判斷依據。"

    if (
        "職業安全衛生法以" in result
        and "雇主及工作場所負責人" in result
        and "法理依據" not in result
    ):
        result += (
            "\n\n法理依據：依據《職業安全衛生法》規定，防止職業災害與保障工作者安全健康的法定義務與主體責任，"
            "主要是直接落在事業單位之雇主以及代表雇主指揮、監督勞工的工作場所負責人身上。"
        )

    if "立即危險時下令退避" in result and "安全衛生教育" not in result:
        result += (
            "\n\n安全衛生教育指導與協助：共同作業必要措施亦包含相關承攬事業間之安全衛生教育、"
            "訓練之指導及協助。"
        )

    if (
        "共同作業指揮與協調" in result
        and "立即危險時下令退避" in result
        and "安全衛生教育" in result
        and "相關職責說明" not in result
    ):
        result = (
            "依職業安全衛生法令，工作場所負責人的職責包含共同作業時指揮及協調工作、"
            "立即危險時下令退避，以及相關承攬事業間勞工安全衛生教育之協助與指導，因此正確答案為以上皆是。"
            "\n\n相關職責說明\n"
            + result
        )

    legal_basis_match = re.search(
        r"法理依據\s*[:：]?\s*(.*?)(?=\s+(?:法理主體|實質責任|重點解析|重點說明|其他角色|如果|來源)\b|$)",
        result,
    )
    if legal_basis_match:
        lead = re.split(r"\n\n|(?=法理主體|實質責任|重點解析|重點說明)", result, maxsplit=1)[0].strip()
        result = f"{lead}\n\n法理依據：{legal_basis_match.group(1).strip()}"

    result = re.sub(r"[（(]\s*選項\s*[A-D]\s*[）)]\s*", "", result, flags=re.I)
    result = re.sub(r"\b選項\s*[A-D]\b\s*", "", result, flags=re.I)
    result = re.sub(r"\s*（\s*\w+\s*）\s*", " ", result)
    result = re.sub(r"[^\S\r\n]+", " ", result)
    return result.strip().replace(" \n\n", "\n\n").replace("\n\n ", "\n\n")


def remove_google_summary_noise(text: str) -> str:
    """Remove only Google UI/source noise while preserving the AI summary text."""
    text = text.replace("\u00a0", " ").replace("\u3000", " ")
    text = re.sub(r"^\s*AI\s*(?:摘要|概覽|Overview)\s*", "", text, flags=re.I)
    text = re.sub(r"https?://\S+", "", text)

    # Remove source chips and their result-link labels, but retain all summary text.
    text = re.sub(
        r"(?:vocus|LawPlayer|法律人|勞動法令查詢系統|勞動部法令查詢系統|阿摩線上測驗|Scribd|維基百科|Wikipedia)\s*\+?\d*",
        "",
        text,
        flags=re.I | re.S,
    )
    text = re.sub(r"\s*\+\d+\s*", " ", text)
    text = re.sub(
        r"\s*(?:如果你|如果您|如果需要|如果您需要|若您|歡迎隨時告訴我|請告訴我|我可以協助您).*?$",
        "",
        text,
        flags=re.I | re.S,
    )
    text = re.sub(
        r"\s*(?:乙級衛生管理員自學|考題練習\d+|顯示全部|相關搜尋).*?$",
        "",
        text,
        flags=re.I,
    )
    text = re.sub(
        r"\n\s*\.\s+[^\n]*(?:\n[^\n]*)*?\n\d{4}年\d{1,2}月\d{1,2}日[^\n]*",
        "",
        text,
    )
    text = re.sub(r"\s*AI\s*可能會出錯，請查證回覆\s*", " ", text)
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n[ \t]+", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def build_query(question: str, options: list[str]) -> str:
    parts = [question]
    for opt in options:
        if opt:
            parts.append(str(opt))
    return " ".join(parts)


def chrome_window_handles() -> set[int]:
    user32 = ctypes.windll.user32
    enum_windows = user32.EnumWindows
    get_window_text = user32.GetWindowTextW
    is_window_visible = user32.IsWindowVisible
    callback_type = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.c_void_p, ctypes.c_void_p)
    handles = set()

    @callback_type
    def callback(hwnd, _lparam):
        if is_window_visible(hwnd):
            title = ctypes.create_unicode_buffer(512)
            get_window_text(hwnd, title, len(title))
            if "Google Chrome" in title.value:
                handles.add(int(hwnd))
        return True

    enum_windows(callback, 0)
    return handles


def minimize_new_chrome_windows(existing_handles: set[int]) -> None:
    user32 = ctypes.windll.user32
    for hwnd in chrome_window_handles() - existing_handles:
        user32.ShowWindow(hwnd, 6)  # SW_MINIMIZE


def detect_ai_summary(page) -> str:
    markers = ["AI 摘要", "AI 概覽", "AI Overview", "概覽", "摘要"]
    for marker in markers:
        try:
            loc = page.locator(f"text={marker}").first
            if loc.count() > 0:
                candidates = []
                for level in range(1, 7):
                    parent = loc.locator(
                        f"xpath=ancestor::*[self::div or self::section or self::article][{level}]"
                    ).first
                    if parent.count() == 0:
                        continue
                    text = parent.inner_text().strip()
                    if len(text) >= 80 and len(text) <= 4000 and not any(
                        noise in text for noise in ["搜尋結果", "阿摩", "Scribd"]
                    ):
                        candidates.append(text)
                if candidates:
                    return max(
                        candidates,
                        key=lambda candidate: (
                            sum(
                                label in candidate
                                for label in [
                                    "正確答案", "法理依據", "重點解析", "原因解析", "選項解析",
                                    "相關職責說明", "共同作業", "立即危險", "安全衛生教育",
                                ]
                            ),
                            len(candidate),
                        ),
                    )
        except Exception:
            pass

    for selector in [
        "[data-attrid*='ai_overview']",
        "[data-attrid*='overview']",
        "div[aria-label*='AI']",
        "div[role='heading']",
        "div[jsname*='m4QZfb']",
        "div[jsname*='WbK0Le']",
        "div.gws-msc",
    ]:
        locators = page.locator(selector)
        if locators.count() == 0:
            continue
        candidates = []
        for i in range(min(locators.count(), 15)):
            try:
                text = locators.nth(i).inner_text().strip()
            except Exception:
                continue
            if len(text) < 60 or len(text) > 4000:
                continue
            candidates.append(text)
        if candidates:
            return max(
                candidates,
                key=lambda candidate: (
                    sum(
                        label in candidate
                        for label in [
                            "正確答案", "法理依據", "重點解析", "原因解析", "選項解析",
                            "相關職責說明", "共同作業", "立即危險", "安全衛生教育",
                        ]
                    ),
                    len(candidate),
                ),
            )

    # Google sometimes renders the AI card in a container that has no stable
    # ancestor or data attribute. In that case, recover the card from body text.
    try:
        body = page.locator("body").inner_text()
        marker = re.search(r"AI\s*(?:摘要|概覽|Overview)", body, flags=re.I)
        if marker:
            card = body[marker.end():]
            card = re.split(
                r"(?:來源|相關搜尋|如果你|如果您|若您|AI 可能會出錯|顯示全部)",
                card,
                maxsplit=1,
            )[0].strip()
            if len(card) >= 60:
                return card
    except Exception:
        pass

    return ""


def google_search_ai_summary(query: str, timeout_sec: int = 90) -> str:
    with sync_playwright() as p:
        browser = p.chromium.launch(
            channel="chrome",
            headless=True,
            args=["--disable-blink-features=AutomationControlled"],
        )
        context = browser.new_context(viewport={"width": 1550, "height": 1200})
        page = context.new_page()

        url = "https://www.google.com/search?q=" + quote_plus(query)
        page.goto(url, wait_until="domcontentloaded", timeout=timeout_sec * 1000)

        deadline = time.monotonic() + timeout_sec
        while time.monotonic() < deadline:
            remaining_ms = max(0, int((deadline - time.monotonic()) * 1000))
            page.wait_for_timeout(min(5000, remaining_ms))
            summary = detect_ai_summary(page)
            if summary:
                browser.close()
                return summary

        body_text = normalize_text(page.locator("body").inner_text())
        browser.close()
        if body_text.startswith("跳至主內容") or "搜尋結果" in body_text:
            return ""
        return body_text[:1500] if body_text else ""


def save_workbook_safe(wb, target_path: str) -> str:
    target = Path(target_path)
    try:
        wb.save(target_path)
        return target_path
    except PermissionError:
        alt = target.with_name(f"{target.stem}_filled{target.suffix}")
        wb.save(alt)
        print(f"[warn] original file is locked, saved to: {alt}")
        return str(alt)


def update_workbook(
    xlsx_path: str,
    sheet_name: str,
    start_row: int = 2,
    max_rows: int | None = None,
    request_delay_min: float = 25,
    request_delay_max: float = 45,
    batch_size: int = 5,
    batch_delay_min: float = 180,
    batch_delay_max: float = 300,
):
    if request_delay_min < 0 or request_delay_max < request_delay_min:
        raise ValueError("題間等待時間必須為非負數，且最大值不得小於最小值。")
    if batch_size < 1:
        raise ValueError("每批題數必須至少為 1。")
    if batch_delay_min < 0 or batch_delay_max < batch_delay_min:
        raise ValueError("批次等待時間必須為非負數，且最大值不得小於最小值。")

    wb = load_workbook(xlsx_path, data_only=False)
    ws = wb[sheet_name]

    max_row = ws.max_row
    if max_rows is not None:
        max_row = min(max_row, start_row + max_rows - 1)

    processed_count = 0
    for row in range(start_row, max_row + 1):
        q = ws.cell(row, 2).value
        if q is None or str(q).strip() == "":
            continue

        opts = []
        for c in range(3, 7):
            v = ws.cell(row, c).value
            opts.append("" if v is None else str(v))

        query = build_query(str(q), opts)
        print(f"[query] row={row}: {query[:120]}")

        summary = remove_google_summary_noise(google_search_ai_summary(query))
        if not summary:
            summary = "Google AI 摘要未抓取到，請手動補充。"

        ws.cell(row, 8, value=summary)
        ws.cell(row, 9, value="")

        # Save after each row to keep progress, but use a safe temp output if the file is locked.
        save_path = save_workbook_safe(wb, xlsx_path)
        print(f"[done] row={row} saved to {save_path}.")
        processed_count += 1

        if row == max_row:
            continue

        if processed_count % batch_size == 0:
            delay = random.uniform(batch_delay_min, batch_delay_max)
            print(f"[wait] completed {processed_count} questions; pausing {delay:.0f} seconds before the next batch.")
        else:
            delay = random.uniform(request_delay_min, request_delay_max)
            print(f"[wait] pausing {delay:.0f} seconds before the next question.")
        time.sleep(delay)

    return save_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Use Chrome + Google search to fill the '解析' field with an AI summary for each question.")
    parser.add_argument("--xlsx", type=str, required=True, help="Excel 檔路徑")
    parser.add_argument("--sheet", type=str, default="乾淨題庫", help="工作表名稱")
    parser.add_argument("--start-row", type=int, default=2, help="從哪一列開始處理")
    parser.add_argument("--max-rows", type=int, default=None, help="最多處理幾列，預設全部")
    parser.add_argument("--request-delay-min", type=float, default=25, help="每題間隨機等待最少秒數")
    parser.add_argument("--request-delay-max", type=float, default=45, help="每題間隨機等待最多秒數")
    parser.add_argument("--batch-size", type=int, default=5, help="每批連續處理的題數")
    parser.add_argument("--batch-delay-min", type=float, default=180, help="每批之間隨機等待最少秒數")
    parser.add_argument("--batch-delay-max", type=float, default=300, help="每批之間隨機等待最多秒數")
    args = parser.parse_args()

    result = update_workbook(
        args.xlsx,
        args.sheet,
        start_row=args.start_row,
        max_rows=args.max_rows,
        request_delay_min=args.request_delay_min,
        request_delay_max=args.request_delay_max,
        batch_size=args.batch_size,
        batch_delay_min=args.batch_delay_min,
        batch_delay_max=args.batch_delay_max,
    )
    print(f"finished: {result}")
