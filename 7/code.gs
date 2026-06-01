const SPREADSHEET_ID = '1jC167kiM3Bk2dddHyoD_Wrw-BrSKbPcWinyAcQ3-af0';
const QUIZ_SIZE = 10;

function doGet() {
  const html = `
<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>英文單字測驗</title>
    <style>
      :root {
        --bg-1: #f7f2e8;
        --bg-2: #d9ecff;
        --panel: rgba(255, 253, 248, 0.9);
        --text: #1d2a3a;
        --muted: #617187;
        --line: rgba(29, 42, 58, 0.12);
        --brand: #0f8b8d;
        --brand-2: #ffb703;
        --ok: #2a9d8f;
        --wrong: #d62828;
        --shadow: 0 18px 50px rgba(37, 65, 105, 0.18);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: 'Noto Sans TC', 'Microsoft JhengHei', sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at top left, rgba(255, 183, 3, 0.35), transparent 34%),
          radial-gradient(circle at right, rgba(15, 139, 141, 0.2), transparent 30%),
          linear-gradient(145deg, var(--bg-1), var(--bg-2));
      }

      .page {
        width: min(920px, calc(100vw - 24px));
        margin: 18px auto;
        background: var(--panel);
        border: 1px solid rgba(255, 255, 255, 0.75);
        border-radius: 24px;
        overflow: hidden;
        box-shadow: var(--shadow);
        backdrop-filter: blur(8px);
      }

      .hero {
        padding: 22px 24px 18px;
        background: linear-gradient(135deg, rgba(15, 139, 141, 0.95), rgba(255, 183, 3, 0.92));
        color: #102a2f;
      }

      .hero h1 {
        margin: 0;
        font-size: 32px;
        font-weight: 900;
        letter-spacing: 1px;
      }

      .hero p {
        margin: 10px 0 0;
        font-size: 16px;
        max-width: 680px;
      }

      .content {
        padding: 20px;
      }

      .stats {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 18px;
      }

      .stat-card {
        padding: 14px 16px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.76);
        border: 1px solid var(--line);
      }

      .stat-label {
        display: block;
        color: var(--muted);
        font-size: 14px;
        margin-bottom: 8px;
      }

      .stat-value {
        font-size: 24px;
        font-weight: 800;
      }

      .panel {
        border: 1px solid var(--line);
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.7);
        padding: 20px;
      }

      .quiz-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 18px;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border-radius: 999px;
        padding: 8px 12px;
        background: rgba(15, 139, 141, 0.12);
        color: #0e6869;
        font-weight: 700;
      }

      .prompt {
        margin: 0;
        font-size: 14px;
        color: var(--muted);
      }

      .word {
        margin: 8px 0 0;
        font-size: clamp(34px, 6vw, 52px);
        font-weight: 900;
        letter-spacing: 1px;
      }

      .choices {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .choice-btn,
      .action-btn {
        border: 0;
        border-radius: 16px;
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
      }

      .choice-btn {
        min-height: 84px;
        text-align: left;
        padding: 16px;
        background: #fff;
        border: 1px solid rgba(29, 42, 58, 0.1);
        font-size: 18px;
        color: var(--text);
      }

      .choice-btn:hover:not(:disabled),
      .action-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 12px 24px rgba(37, 65, 105, 0.12);
      }

      .choice-btn.correct {
        background: rgba(42, 157, 143, 0.18);
        border-color: rgba(42, 157, 143, 0.7);
      }

      .choice-btn.wrong {
        background: rgba(214, 40, 40, 0.12);
        border-color: rgba(214, 40, 40, 0.5);
      }

      .choice-btn:disabled {
        cursor: default;
        opacity: 1;
      }

      .feedback {
        min-height: 28px;
        margin: 16px 0 0;
        font-size: 16px;
        font-weight: 700;
      }

      .feedback.ok {
        color: var(--ok);
      }

      .feedback.wrong {
        color: var(--wrong);
      }

      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 18px;
      }

      .action-btn {
        padding: 12px 20px;
        font-size: 16px;
        font-weight: 800;
      }

      .primary {
        background: linear-gradient(135deg, var(--brand), #16b7ba);
        color: white;
      }

      .secondary {
        background: linear-gradient(135deg, #ffb703, #fb8500);
        color: #2b2206;
      }

      .hidden {
        display: none;
      }

      .loading,
      .summary {
        text-align: center;
        padding: 40px 20px;
      }

      .summary h2 {
        margin: 0;
        font-size: 34px;
      }

      .summary p {
        margin: 12px 0 0;
        font-size: 18px;
        color: var(--muted);
      }

      .error-box {
        margin-top: 16px;
        padding: 14px 16px;
        border-radius: 16px;
        background: rgba(214, 40, 40, 0.1);
        color: #8a1e1e;
        border: 1px solid rgba(214, 40, 40, 0.18);
      }

      @media (max-width: 720px) {
        .stats,
        .choices {
          grid-template-columns: 1fr;
        }

        .quiz-head {
          flex-direction: column;
        }

        .actions {
          justify-content: stretch;
          flex-direction: column;
        }

        .action-btn {
          width: 100%;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="hero">
        <h1>英文單字測驗</h1>
        <p>題目會從 Google 試算表讀取英文單字與中文意思，系統隨機出題，答完可立即看到成績。</p>
      </section>

      <section class="content">
        <div class="stats">
          <div class="stat-card">
            <span class="stat-label">目前題號</span>
            <strong class="stat-value" id="progressValue">--</strong>
          </div>
          <div class="stat-card">
            <span class="stat-label">目前分數</span>
            <strong class="stat-value" id="scoreValue">0</strong>
          </div>
          <div class="stat-card">
            <span class="stat-label">單字來源</span>
            <strong class="stat-value" id="sourceValue">載入中</strong>
          </div>
        </div>

        <div class="panel">
          <div class="loading" id="loadingState">正在讀取試算表資料...</div>

          <div class="hidden" id="quizState">
            <div class="quiz-head">
              <div>
                <p class="prompt">請選出這個英文單字的正確中文意思</p>
                <h2 class="word" id="wordText">word</h2>
              </div>
              <div class="badge" id="sheetBadge">工作表：--</div>
            </div>

            <div class="choices" id="choicesBox"></div>
            <div class="feedback" id="feedbackText"></div>

            <div class="actions">
              <button class="action-btn secondary hidden" id="nextBtn">下一題</button>
              <button class="action-btn primary" id="restartBtn">重新抽題</button>
            </div>
          </div>

          <div class="summary hidden" id="summaryState">
            <h2 id="summaryTitle">測驗完成</h2>
            <p id="summaryText"></p>
            <div class="actions" style="justify-content:center; margin-top: 22px;">
              <button class="action-btn primary" id="restartSummaryBtn">再測一次</button>
            </div>
          </div>

          <div class="error-box hidden" id="errorBox"></div>
        </div>
      </section>
    </main>

    <script>
      const loadingState = document.getElementById('loadingState');
      const quizState = document.getElementById('quizState');
      const summaryState = document.getElementById('summaryState');
      const errorBox = document.getElementById('errorBox');
      const progressValue = document.getElementById('progressValue');
      const scoreValue = document.getElementById('scoreValue');
      const sourceValue = document.getElementById('sourceValue');
      const sheetBadge = document.getElementById('sheetBadge');
      const wordText = document.getElementById('wordText');
      const choicesBox = document.getElementById('choicesBox');
      const feedbackText = document.getElementById('feedbackText');
      const nextBtn = document.getElementById('nextBtn');
      const restartBtn = document.getElementById('restartBtn');
      const restartSummaryBtn = document.getElementById('restartSummaryBtn');
      const summaryText = document.getElementById('summaryText');

      let quiz = null;
      let currentIndex = 0;
      let score = 0;
      let answered = false;

      function setError(message) {
        errorBox.textContent = message;
        errorBox.classList.remove('hidden');
      }

      function clearError() {
        errorBox.textContent = '';
        errorBox.classList.add('hidden');
      }

      function renderQuestion() {
        const question = quiz.questions[currentIndex];
        answered = false;
        feedbackText.textContent = '';
        feedbackText.className = 'feedback';
        nextBtn.classList.add('hidden');
        progressValue.textContent = (currentIndex + 1) + ' / ' + quiz.questions.length;
        scoreValue.textContent = String(score);
        wordText.textContent = question.word;
        choicesBox.innerHTML = '';

        question.options.forEach((option) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'choice-btn';
          button.textContent = option;
          button.addEventListener('click', () => chooseAnswer(button, option, question));
          choicesBox.appendChild(button);
        });
      }

      function chooseAnswer(button, option, question) {
        if (answered) {
          return;
        }

        answered = true;
        const buttons = Array.from(document.querySelectorAll('.choice-btn'));

        buttons.forEach((item) => {
          item.disabled = true;

          if (item.textContent === question.answer) {
            item.classList.add('correct');
          }
        });

        if (option === question.answer) {
          score += 1;
          scoreValue.textContent = String(score);
          feedbackText.textContent = '答對了';
          feedbackText.className = 'feedback ok';
        } else {
          button.classList.add('wrong');
          feedbackText.textContent = '答錯了，正確答案是：' + question.answer;
          feedbackText.className = 'feedback wrong';
        }

        nextBtn.textContent = currentIndex === quiz.questions.length - 1 ? '看成績' : '下一題';
        nextBtn.classList.remove('hidden');
      }

      function showSummary() {
        quizState.classList.add('hidden');
        summaryState.classList.remove('hidden');
        progressValue.textContent = quiz.questions.length + ' / ' + quiz.questions.length;
        summaryText.textContent = '你答對 ' + score + ' 題，共 ' + quiz.questions.length + ' 題。';
      }

      function nextQuestion() {
        if (!quiz) {
          return;
        }

        if (currentIndex >= quiz.questions.length - 1) {
          showSummary();
          return;
        }

        currentIndex += 1;
        renderQuestion();
      }

      function startQuiz(data) {
        quiz = data;
        currentIndex = 0;
        score = 0;
        clearError();
        loadingState.classList.add('hidden');
        summaryState.classList.add('hidden');
        quizState.classList.remove('hidden');
        sourceValue.textContent = data.totalWords + ' 個單字';
        sheetBadge.textContent = '工作表：' + data.sheetName;
        renderQuestion();
      }

      function loadQuiz() {
        loadingState.classList.remove('hidden');
        quizState.classList.add('hidden');
        summaryState.classList.add('hidden');
        clearError();

        google.script.run
          .withSuccessHandler((result) => {
            startQuiz(result);
          })
          .withFailureHandler((err) => {
            loadingState.classList.add('hidden');
            sourceValue.textContent = '讀取失敗';
            progressValue.textContent = '--';
            setError(err && err.message ? err.message : String(err));
          })
          .getQuizData();
      }

      nextBtn.addEventListener('click', nextQuestion);
      restartBtn.addEventListener('click', loadQuiz);
      restartSummaryBtn.addEventListener('click', loadQuiz);

      loadQuiz();
    </script>
  </body>
</html>`;

  return HtmlService.createHtmlOutput(html)
    .setTitle('英文單字測驗')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getQuizData() {
  const sheet = getWordSheet_();
  const words = loadWords_(sheet);

  if (words.length < 2) {
    throw new Error('試算表中的有效單字不足，至少需要 2 筆資料。');
  }

  const questions = buildQuestions_(words, Math.min(QUIZ_SIZE, words.length));

  return {
    sheetName: sheet.getName(),
    totalWords: words.length,
    questions: questions
  };
}

function getWordSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheets()[0];

  if (!sheet) {
    throw new Error('找不到可用的工作表。');
  }

  return sheet;
}

function loadWords_(sheet) {
  const values = sheet.getDataRange().getDisplayValues();

  if (!values.length) {
    throw new Error('試算表沒有任何資料。');
  }

  const firstRow = values[0].map(normalizeHeader_);
  const englishIndex = findColumnIndex_(firstRow, ['english', 'word', 'vocabulary', '單字', '英文']);
  const meaningIndex = findColumnIndex_(firstRow, ['chinese', 'meaning', 'translation', '中文', '解釋', '意思']);
  const hasHeader = englishIndex !== -1 && meaningIndex !== -1;
  const wordColumn = hasHeader ? englishIndex : 0;
  const meaningColumn = hasHeader ? meaningIndex : 1;
  const startRow = hasHeader ? 1 : 0;
  const words = [];

  for (let index = startRow; index < values.length; index += 1) {
    const row = values[index];
    const word = cleanCell_(row[wordColumn]);
    const meaning = cleanCell_(row[meaningColumn]);

    if (!word || !meaning) {
      continue;
    }

    words.push({ word: word, meaning: meaning });
  }

  if (!words.length) {
    throw new Error('找不到有效的英文單字與中文意思欄位。請確認前兩欄或標題列內容。');
  }

  return dedupeWords_(words);
}

function buildQuestions_(words, size) {
  const shuffledWords = shuffle_(words.slice());
  const selected = shuffledWords.slice(0, size);

  return selected.map(function(entry) {
    const distractors = shuffle_(
      words
        .filter(function(item) {
          return item.meaning !== entry.meaning;
        })
        .map(function(item) {
          return item.meaning;
        })
    ).slice(0, Math.min(3, Math.max(0, words.length - 1)));

    const options = shuffle_([entry.meaning].concat(distractors));

    return {
      word: entry.word,
      answer: entry.meaning,
      options: options
    };
  });
}

function dedupeWords_(words) {
  const seen = {};

  return words.filter(function(entry) {
    const key = entry.word + '|' + entry.meaning;

    if (seen[key]) {
      return false;
    }

    seen[key] = true;
    return true;
  });
}

function findColumnIndex_(headers, keywords) {
  for (let index = 0; index < headers.length; index += 1) {
    const header = headers[index];

    for (let keyIndex = 0; keyIndex < keywords.length; keyIndex += 1) {
      if (header.indexOf(keywords[keyIndex]) !== -1) {
        return index;
      }
    }
  }

  return -1;
}

function normalizeHeader_(value) {
  return cleanCell_(value)
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[：:()（）_\-]/g, '');
}

function cleanCell_(value) {
  return String(value == null ? '' : value).trim();
}

function shuffle_(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const temp = items[index];
    items[index] = items[randomIndex];
    items[randomIndex] = temp;
  }

  return items;
}const VOCAB_SPREADSHEET_ID = '1jC167kiM3Bk2dddHyoD_Wrw-BrSKbPcWinyAcQ3-af0';
const QUIZ_QUESTION_COUNT = 10;

function doGet() {
  const html = `
<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>英文單字測驗</title>
    <style>
      :root {
        --bg-1: #102033;
        --bg-2: #17324d;
        --panel: rgba(8, 16, 26, 0.84);
        --line: rgba(144, 219, 255, 0.24);
        --text: #f3fbff;
        --muted: #a9c1d4;
        --accent: #ffd166;
        --accent-2: #7ae7c7;
        --good: #8df0ae;
        --bad: #ff9d9d;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: 'Noto Sans TC', 'Microsoft JhengHei', sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at 10% 15%, rgba(122, 231, 199, 0.15), transparent 30%),
          radial-gradient(circle at 90% 10%, rgba(255, 209, 102, 0.18), transparent 26%),
          linear-gradient(140deg, var(--bg-1), var(--bg-2));
      }

      .app {
        width: min(920px, calc(100vw - 24px));
        margin: 20px auto;
        padding: 18px;
      }

      .hero,
      .panel {
        border: 1px solid var(--line);
        border-radius: 22px;
        background: var(--panel);
        backdrop-filter: blur(12px);
        box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
      }

      .hero {
        padding: 20px 22px;
        margin-bottom: 16px;
      }

      .title {
        margin: 0 0 10px;
        font-size: 34px;
        font-weight: 900;
        letter-spacing: 1px;
      }

      .subtitle {
        margin: 0;
        color: var(--muted);
        font-size: 16px;
      }

      .meta-row {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 16px;
      }

      .badge {
        border-radius: 999px;
        padding: 8px 14px;
        font-size: 14px;
        font-weight: 700;
        color: #062539;
        background: linear-gradient(120deg, var(--accent), var(--accent-2));
      }

      .panel {
        padding: 20px;
      }

      .status {
        font-size: 15px;
        color: var(--muted);
        margin-bottom: 18px;
      }

      .question-card {
        padding: 18px;
        border-radius: 18px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.04);
      }

      .question-label {
        color: var(--muted);
        font-size: 15px;
        margin-bottom: 8px;
      }

      .word {
        font-size: clamp(32px, 6vw, 54px);
        font-weight: 900;
        letter-spacing: 1px;
        margin: 0 0 8px;
      }

      .hint {
        color: var(--muted);
        font-size: 15px;
        margin-bottom: 18px;
      }

      .choices {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .choice-btn,
      .action-btn {
        border: 0;
        border-radius: 14px;
        cursor: pointer;
        transition: transform 0.18s ease, filter 0.18s ease, opacity 0.18s ease;
      }

      .choice-btn {
        padding: 16px;
        text-align: left;
        font-size: 18px;
        font-weight: 700;
        color: var(--text);
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      .choice-btn:hover:not(:disabled),
      .action-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        filter: brightness(1.05);
      }

      .choice-btn.correct {
        background: rgba(141, 240, 174, 0.2);
        border-color: rgba(141, 240, 174, 0.62);
      }

      .choice-btn.wrong {
        background: rgba(255, 157, 157, 0.18);
        border-color: rgba(255, 157, 157, 0.62);
      }

      .choice-btn:disabled,
      .action-btn:disabled {
        cursor: default;
        opacity: 0.84;
      }

      .feedback {
        min-height: 28px;
        margin-top: 14px;
        font-size: 18px;
        font-weight: 800;
      }

      .feedback.good {
        color: var(--good);
      }

      .feedback.bad {
        color: var(--bad);
      }

      .footer-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-top: 20px;
        flex-wrap: wrap;
      }

      .score {
        font-size: 16px;
        color: var(--muted);
      }

      .action-btn {
        min-width: 150px;
        padding: 12px 22px;
        font-size: 18px;
        font-weight: 900;
        color: #072235;
        background: linear-gradient(120deg, var(--accent), var(--accent-2));
      }

      .summary {
        display: none;
        margin-top: 18px;
        padding: 18px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.05);
      }

      .summary.show {
        display: block;
      }

      .summary h2 {
        margin: 0 0 8px;
        font-size: 28px;
      }

      .summary p {
        margin: 0;
        color: var(--muted);
        font-size: 16px;
      }

      .error-box {
        display: none;
        padding: 16px;
        border-radius: 16px;
        background: rgba(255, 157, 157, 0.12);
        border: 1px solid rgba(255, 157, 157, 0.42);
        color: #ffd6d6;
      }

      .error-box.show {
        display: block;
      }

      @media (max-width: 720px) {
        .choices {
          grid-template-columns: 1fr;
        }

        .title {
          font-size: 28px;
        }
      }
    </style>
  </head>
  <body>
    <main class="app">
      <section class="hero">
        <h1 class="title">英文單字測驗</h1>
        <p class="subtitle">題目來自 Google 試算表。每回合隨機抽題，選出正確中文意思。</p>
        <div class="meta-row">
          <span class="badge" id="sheetName">單字來源：載入中</span>
          <span class="badge" id="questionCount">題數：--</span>
        </div>
      </section>

      <section class="panel">
        <div class="status" id="statusText">正在準備題庫...</div>
        <div class="error-box" id="errorBox"></div>

        <div id="quizArea" style="display:none;">
          <div class="question-card">
            <div class="question-label" id="progressText">第 1 題</div>
            <h2 class="word" id="wordText">word</h2>
            <div class="hint">請選出這個英文單字最合適的中文意思</div>
            <div class="choices" id="choices"></div>
            <div class="feedback" id="feedback"></div>
          </div>

          <div class="footer-row">
            <div class="score" id="scoreText">目前得分：0 / 0</div>
            <button class="action-btn" id="nextBtn" disabled>下一題</button>
          </div>
        </div>

        <div class="summary" id="summaryBox">
          <h2 id="summaryTitle">本回合完成</h2>
          <p id="summaryText"></p>
          <div class="footer-row" style="margin-top:16px;">
            <div class="score" id="finalScoreText"></div>
            <button class="action-btn" id="restartBtn">再測一次</button>
          </div>
        </div>
      </section>
    </main>

    <script>
      const statusText = document.getElementById('statusText');
      const errorBox = document.getElementById('errorBox');
      const quizArea = document.getElementById('quizArea');
      const sheetName = document.getElementById('sheetName');
      const questionCount = document.getElementById('questionCount');
      const progressText = document.getElementById('progressText');
      const wordText = document.getElementById('wordText');
      const choices = document.getElementById('choices');
      const feedback = document.getElementById('feedback');
      const scoreText = document.getElementById('scoreText');
      const nextBtn = document.getElementById('nextBtn');
      const summaryBox = document.getElementById('summaryBox');
      const summaryText = document.getElementById('summaryText');
      const finalScoreText = document.getElementById('finalScoreText');
      const restartBtn = document.getElementById('restartBtn');

      let bank = [];
      let quiz = [];
      let currentIndex = 0;
      let score = 0;
      let answered = false;

      function shuffle(list) {
        const copy = list.slice();
        for (let index = copy.length - 1; index > 0; index -= 1) {
          const swapIndex = Math.floor(Math.random() * (index + 1));
          const temp = copy[index];
          copy[index] = copy[swapIndex];
          copy[swapIndex] = temp;
        }
        return copy;
      }

      function pickQuizItems() {
        const limit = Math.min(bank.length, ${QUIZ_QUESTION_COUNT});
        quiz = shuffle(bank).slice(0, limit).map((item) => {
          const distractors = shuffle(
            bank
              .filter((entry) => entry.meaning !== item.meaning)
              .map((entry) => entry.meaning)
          ).slice(0, 3);

          return {
            word: item.word,
            meaning: item.meaning,
            choices: shuffle([item.meaning].concat(distractors))
          };
        });
      }

      function renderQuestion() {
        const item = quiz[currentIndex];
        answered = false;
        feedback.textContent = '';
        feedback.className = 'feedback';
        nextBtn.disabled = true;

        progressText.textContent = '第 ' + (currentIndex + 1) + ' 題 / 共 ' + quiz.length + ' 題';
        wordText.textContent = item.word;
        scoreText.textContent = '目前得分：' + score + ' / ' + currentIndex;
        choices.innerHTML = '';

        item.choices.forEach((choice) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'choice-btn';
          button.textContent = choice;
          button.addEventListener('click', () => handleAnswer(choice, button));
          choices.appendChild(button);
        });
      }

      function handleAnswer(choice, clickedButton) {
        if (answered) {
          return;
        }

        const item = quiz[currentIndex];
        const buttons = Array.from(document.querySelectorAll('.choice-btn'));
        answered = true;

        buttons.forEach((button) => {
          button.disabled = true;
          if (button.textContent === item.meaning) {
            button.classList.add('correct');
          }
        });

        if (choice === item.meaning) {
          score += 1;
          clickedButton.classList.add('correct');
          feedback.textContent = '答對了';
          feedback.classList.add('good');
        } else {
          clickedButton.classList.add('wrong');
          feedback.textContent = '答錯了，正確答案是：' + item.meaning;
          feedback.classList.add('bad');
        }

        scoreText.textContent = '目前得分：' + score + ' / ' + (currentIndex + 1);
        nextBtn.disabled = false;
        nextBtn.textContent = currentIndex === quiz.length - 1 ? '看結果' : '下一題';
      }

      function showSummary() {
        quizArea.style.display = 'none';
        summaryBox.classList.add('show');
        statusText.textContent = '本回合已完成';
        summaryText.textContent = '你已完成 ' + quiz.length + ' 題測驗。';
        finalScoreText.textContent = '總分：' + score + ' / ' + quiz.length;
      }

      function startQuiz() {
        pickQuizItems();
        currentIndex = 0;
        score = 0;
        summaryBox.classList.remove('show');
        quizArea.style.display = 'block';
        statusText.textContent = '題庫已就緒，開始作答';
        renderQuestion();
      }

      function handleNext() {
        if (!answered) {
          return;
        }

        if (currentIndex >= quiz.length - 1) {
          showSummary();
          return;
        }

        currentIndex += 1;
        renderQuestion();
      }

      function showError(message) {
        errorBox.textContent = message;
        errorBox.classList.add('show');
        statusText.textContent = '題庫載入失敗';
      }

      nextBtn.addEventListener('click', handleNext);
      restartBtn.addEventListener('click', startQuiz);

      google.script.run
        .withSuccessHandler((result) => {
          bank = result.words || [];
          sheetName.textContent = '單字來源：' + result.sheetName;
          questionCount.textContent = '題數：' + Math.min(bank.length, result.questionLimit) + ' / 題庫 ' + bank.length + ' 筆';

          if (!bank.length) {
            showError('試算表中沒有可用的英文單字資料。請確認至少有單字與中文意思兩欄。');
            return;
          }

          if (bank.length < 2) {
            showError('可用單字數量不足，至少需要 2 筆資料。');
            return;
          }

          startQuiz();
        })
        .withFailureHandler((err) => {
          showError('讀取試算表失敗：' + (err && err.message ? err.message : err));
        })
        .getQuizData();
    </script>
  </body>
</html>`;

  return HtmlService.createHtmlOutput(html)
    .setTitle('英文單字測驗')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getQuizData() {
  const sheet = SpreadsheetApp.openById(VOCAB_SPREADSHEET_ID).getSheets()[0];
  const values = sheet.getDataRange().getDisplayValues();
  const words = extractWordRows_(values);

  return {
    sheetName: sheet.getName(),
    questionLimit: QUIZ_QUESTION_COUNT,
    words: words
  };
}

function extractWordRows_(values) {
  if (!values || values.length === 0) {
    return [];
  }

  const firstRow = values[0].map(function(value) {
    return normalizeHeader_(value);
  });

  const englishIndex = findColumnIndex_(firstRow, ['english', 'word', 'vocabulary', 'vocab', '單字', '英文', '英文字']);
  const meaningIndex = findColumnIndex_(firstRow, ['chinese', 'meaning', 'definition', 'translation', '中文', '意思', '翻譯', '解釋']);
  const hasHeader = englishIndex !== -1 && meaningIndex !== -1;
  const startRow = hasHeader ? 1 : 0;
  const wordColumn = hasHeader ? englishIndex : 0;
  const meaningColumn = hasHeader ? meaningIndex : 1;

  if (wordColumn === -1 || meaningColumn === -1) {
    return [];
  }

  return values.slice(startRow)
    .map(function(row) {
      return {
        word: cleanCell_(row[wordColumn]),
        meaning: cleanCell_(row[meaningColumn])
      };
    })
    .filter(function(item) {
      return item.word && item.meaning;
    });
}

function findColumnIndex_(headers, aliases) {
  for (var index = 0; index < headers.length; index += 1) {
    if (aliases.indexOf(headers[index]) !== -1) {
      return index;
    }
  }
  return -1;
}

function normalizeHeader_(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[：:]/g, '');
}

function cleanCell_(value) {
  return String(value || '').trim();
}