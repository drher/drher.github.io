import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from google_ai_summary_fill import clean_summary_text, extract_ai_answer


class CleanSummaryTextTests(unittest.TestCase):
    def test_extracts_only_ai_answer(self):
        raw = (
            "AI 摘要 職業安全衛生法係由總統公布。"
            "根據我國憲法與相關法規規定，立法院通過的法律案，應呈送總統，並由總統經由法定程序予以公布施行。"
            "來源 勞動部法令查詢系統"
        )
        answer = extract_ai_answer(raw)
        self.assertIn("職業安全衛生法係由總統公布", answer)
        self.assertIn("法定程序予以公布施行", answer)
        self.assertNotIn("來源", answer)

    def test_stops_before_follow_up_and_search_question(self):
        raw = (
            "AI 摘要 職業安全衛生中心並非法定所稱的主管機關。"
            "其屬於勞動檢查機構，負責第一線執法。"
            "如果您正在準備相關考試，我可以協助您整理。"
            "... 下列何者非主管機關？"
        )
        answer = extract_ai_answer(raw)
        self.assertIn("職業安全衛生中心並非法定所稱的主管機關", answer)
        self.assertNotIn("如果您", answer)
        self.assertNotIn("下列何者", answer)

    def test_stops_before_generic_follow_up(self):
        raw = "職業安全衛生法規定工作場所負責人應負安全責任。如果需要更多法規解析，我可以協助。"
        answer = extract_ai_answer(raw)
        self.assertIn("工作場所負責人應負安全責任", answer)
        self.assertNotIn("如果需要", answer)

    def test_removes_urls_and_site_noise(self):
        raw = (
            "325. () 下列何種法規之制定與修正，需經立法院三讀通過？ ... 阿摩線上測驗 https://yamol.tw › item-325.+()+下列何種法規之制定與... 2020年1月21日 — 61. 下列何種法規之制定與修正,需經立法院三讀通過?(A)機械器具型式檢定實施辦法(B)起重升降機具安全規則(C)職業安全衛生法(D)營造安全衛生設施標準。 正確答案：C. 職業安全衛生法是由立法機關制定，且需經立法院三讀通過。"
        )
        cleaned = clean_summary_text(raw)
        self.assertNotIn("yamol", cleaned.lower())
        self.assertNotIn("https://", cleaned)
        self.assertIn("職業安全衛生法", cleaned)
        self.assertIn("三讀通過", cleaned)

    def test_keeps_answer_and_reason_labels(self):
        raw = (
            "職業安全衛生法以雇主及工作場所負責人的責任為主，"
            "來負擔保障工作者安全與健康之義務。"
            "正確答案：(A) 雇主及工作場所負責人。"
            "法理依據：依據職業安全衛生法規定，主要責任落在雇主及工作場所負責人身上。"
            "高雄市政府全球資訊網 +1"
        )
        cleaned = clean_summary_text(raw)
        self.assertIn("正確答案", cleaned)
        self.assertIn("法理依據", cleaned)
        self.assertNotIn("高雄市政府全球資訊網", cleaned)


if __name__ == "__main__":
    unittest.main()
