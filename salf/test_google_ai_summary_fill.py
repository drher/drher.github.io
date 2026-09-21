import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from google_ai_summary_fill import (
    clean_summary_text,
    extract_ai_answer,
    is_google_traffic_verification,
    remove_google_summary_noise,
)


class CleanSummaryTextTests(unittest.TestCase):
    def test_detects_google_traffic_verification(self):
        self.assertTrue(is_google_traffic_verification(
            "我們的系統偵測到您的電腦網路送出的流量有異常情況。"
        ))
        self.assertFalse(is_google_traffic_verification("正常的 Google 搜尋結果。"))

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

    def test_removes_variable_option_marker_and_keeps_legal_basis(self):
        raw = (
            "職業安全衛生法以(A)雇主及工作場所負責人的責任為主，來負擔保障工作者安全與健康之義務。"
            "正確答案：(A)雇主及工作場所負責人。"
            "法理依據：依據《職業安全衛生法》規定，防止職業災害與保障工作者安全健康的法定義務與主體責任，"
            "主要是直接落在事業單位之雇主以及代表雇主指揮、監督勞工的工作場所負責人身上。"
        )
        cleaned = clean_summary_text(raw)
        self.assertIn("正確答案：雇主及工作場所負責人", cleaned)
        self.assertIn("法理依據：依據《職業安全衛生法》規定", cleaned)
        self.assertIn("工作場所負責人身上", cleaned)
        self.assertNotIn("(A)", cleaned)

    def test_adds_required_legal_basis_for_employer_question(self):
        cleaned = clean_summary_text(
            "職業安全衛生法以雇主及工作場所負責人的責任為主，來負擔保障工作者安全與健康之義務。"
        )
        self.assertIn("法理依據：依據《職業安全衛生法》規定", cleaned)
        self.assertIn("事業單位之雇主以及代表雇主指揮、監督勞工", cleaned)

    def test_keeps_only_legal_basis_section(self):
        cleaned = clean_summary_text(
            "職業安全衛生法以雇主及工作場所負責人的責任為主。"
            "法理主體：雇主為主要義務主體。"
            "實質責任：企業主與工作場所負責人負責安全衛生。"
            "法理依據：依據《職業安全衛生法》規定，主要責任落在雇主以及工作場所負責人身上。"
        )
        self.assertIn("法理依據：依據《職業安全衛生法》規定", cleaned)
        self.assertNotIn("法理主體", cleaned)
        self.assertNotIn("實質責任", cleaned)

    def test_keeps_related_duties_section(self):
        cleaned = clean_summary_text(
            "依職業安全衛生法令，工作場所負責人的職責包含共同作業時指揮及協調工作、"
            "立即危險時下令退避，以及相關承攬事業間勞工安全衛生教育之協助與指導，因此正確答案為以上皆是。"
            "相關職責說明 共同作業指揮與協調：依《職業安全衛生法》第27條，原事業單位應設置協議組織並指定工作場所負責人，擔任指揮、監督及協調工作。"
            "立即危險下令退避：依《職業安全衛生法》第18條，雇主或工作場所負責人應即令停止作業，並使勞工退避至安全場所。"
            "安全衛生教育指導與協助：共同作業必要措施包含相關承攬事業間之安全衛生教育、訓練之指導及協助。"
            "勞動法令查詢系統 +1"
        )
        self.assertIn("相關職責說明", cleaned)
        self.assertIn("立即危險下令退避", cleaned)
        self.assertIn("安全衛生教育指導與協助", cleaned)
        self.assertNotIn("勞動法令查詢系統", cleaned)

    def test_extracts_first_related_duty(self):
        answer = extract_ai_answer(
            "AI 摘要 依職業安全衛生法令，工作場所負責人的職責包含共同作業時指揮及協調工作。"
            "相關職責說明 共同作業指揮與協調：依職業安全衛生法第27條。"
        )
        self.assertIn("共同作業時指揮及協調工作", answer)
        self.assertIn("共同作業指揮與協調", answer)

    def test_preserves_full_ai_duties_card(self):
        answer = extract_ai_answer(
            "AI 摘要 依職業安全衛生法令，工作場所負責人的職責包含共同作業時指揮及協調工作、"
            "立即危險時下令退避，以及相關承攬事業間勞工安全衛生教育之協助與指導，因此正確答案為以上皆是。"
            "相關職責說明 共同作業指揮與協調：依第27條。立即危險下令退避：依第18條。"
            "安全衛生教育指導與協助：依第27條。勞動法令查詢系統 +1"
        )
        self.assertIn("工作場所負責人的職責包含共同作業時指揮及協調工作", answer)
        self.assertIn("相關職責說明", answer)
        self.assertIn("安全衛生教育指導與協助", answer)
        self.assertNotIn("勞動法令查詢系統", answer)

    def test_restores_full_duties_card_header(self):
        cleaned = clean_summary_text(
            "共同作業指揮與協調：依第27條。立即危險時下令退避：依第18條。"
            "相關承攬事業間勞工安全衛生教育之協助與指導：依第27條。"
        )
        self.assertIn("工作場所負責人的職責包含共同作業時指揮及協調工作", cleaned)
        self.assertIn("相關職責說明", cleaned)

    def test_removes_google_ui_noise_only(self):
        cleaned = remove_google_summary_noise(
            "AI 摘要\n正確的敘述為：工作場所建築物應依建築法規設計。\n"
            "各選項解析：\n(A) 錯誤說明。\nvocus +1\n"
            "如果你需要更多職業安全衛生管理或勞動法規的相關考古題解析，歡迎隨時告訴我！"
        )
        self.assertNotIn("AI 摘要", cleaned)
        self.assertNotIn("vocus", cleaned)
        self.assertNotIn("如果你需要", cleaned)
        self.assertIn("各選項解析", cleaned)
        self.assertIn("(A) 錯誤說明", cleaned)

    def test_removes_multiline_follow_up_and_source(self):
        cleaned = remove_google_summary_noise(
            "正文內容。\n如果你需要更多職業安全衛生法的歷屆考題解析，請告訴我！\n"
            "乙級衛生管理員自學(考題練習41) - 方格子\n顯示全部"
        )
        self.assertEqual(cleaned, "正文內容。")

    def test_preserves_full_summary_except_links_and_follow_up(self):
        cleaned = remove_google_summary_noise(
            "AI 摘要\n正確的敘述為：(B) 工作場所建築物應依建築法規及職業安全衛生法規之相關規定設計為正確敘述。\n"
            "各選項錯誤原因解析如下：\n"
            "• (A) 勞工保險條例之主管機關已配合全民健康保險之開辦，移由衛生福利部主管：錯誤，勞工保險之主管機關在中央為勞動部。\n"
            "• (B) 工作場所建築物應依建築法規及職業安全衛生法規之相關規定設計：正確。\n"
            "vocus +1\n如果你需要更多解析，歡迎隨時告訴我！"
        )
        self.assertIn("正確的敘述為：(B)", cleaned)
        self.assertIn("各選項錯誤原因解析如下：", cleaned)
        self.assertIn("• (A)", cleaned)
        self.assertIn("• (B)", cleaned)
        self.assertNotIn("vocus", cleaned)
        self.assertNotIn("如果你", cleaned)

    def test_removes_standalone_google_result_link_line(self):
        cleaned = remove_google_summary_noise(
            "有關職業安全衛生法適用範圍之敘述，正確的是適用各業。\n"
            ". 有關職業安全衛生法適用範圍之敘述，下列為何正確？\n"
            "2024年10月7日 - 答案：登入後查看"
        )
        self.assertEqual(cleaned, "有關職業安全衛生法適用範圍之敘述，正確的是適用各業。")

    def test_removes_option_marker_and_separates_heading(self):
        cleaned = clean_summary_text(
            "正確的敘述為：工作場所建築物應依建築法規及職業安全衛生法規之相關規定設計（選項 B）。"
            "各選項解析各選項錯誤原因解析如下：勞工保險條例之主管機關移由衛生福利部主管：錯誤。"
            "工作場所建築物應依相關規定設計：正確。"
        )
        self.assertNotIn("選項 B", cleaned)
        self.assertIn("各選項解析：", cleaned)
        self.assertNotIn("各選項錯誤原因解析如下", cleaned)
        self.assertIn("\n\n各選項解析", cleaned)

    def test_restores_missing_first_duty(self):
        cleaned = clean_summary_text(
            "立即危險時下令退避：依《職業安全衛生法》第18條，工作場所負責人應使勞工退避至安全場所。"
            "相關承攬事業間勞工安全衛生教育之協助與指導：依第27條規定提供指導及協助。"
        )
        self.assertIn("共同作業指揮與協調", cleaned)

    def test_restores_missing_third_duty(self):
        cleaned = clean_summary_text(
            "共同作業指揮與協調：依第27條。立即危險時下令退避：依第18條。"
        )
        self.assertIn("安全衛生教育指導與協助", cleaned)


if __name__ == "__main__":
    unittest.main()
