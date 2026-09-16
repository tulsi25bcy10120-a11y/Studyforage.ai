// StudyForge AI Interactive Quiz & Flashcard Engine
window.QuizEngine = {
  mcqs: [],
  userAnswers: {},
  currentQuestionIndex: 0,
  quizMode: "practice", // "practice" (immediate feedback) or "exam" (submit at end)
  quizSubmitted: false,
  quizStartTime: null,
  timerInterval: null,

  // Flashcards state
  definitions: [],
  currentCardIndex: 0,
  masteredTerms: new Set(),

  initMCQs(mcqs, containerSelector) {
    this.mcqs = mcqs || [];
    this.userAnswers = {};
    this.currentQuestionIndex = 0;
    this.quizSubmitted = false;
    this.quizStartTime = Date.now();

    const container = document.querySelector(containerSelector);
    if (!container) return;

    this.renderMCQHub(container);
    this.startTimer();
  },

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    const timerEl = document.getElementById("quiz-timer-display");
    if (!timerEl) return;

    this.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.quizStartTime) / 1000);
      const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const secs = String(elapsed % 60).padStart(2, '0');
      const el = document.getElementById("quiz-timer-display");
      if (el) el.textContent = `${mins}:${secs}`;
    }, 1000);
  },

  renderMCQHub(container) {
    const total = this.mcqs.length;
    const answeredCount = Object.keys(this.userAnswers).length;
    const currentQ = this.mcqs[this.currentQuestionIndex];

    container.innerHTML = `
      <div class="mcq-header-card">
        <div class="mcq-header-left">
          <div class="mcq-title-pill">15 Interactive Multiple-Choice Exam Questions</div>
          <p class="mcq-subtitle">Based primarily on uploaded course module. Real-time source grounding and rationale.</p>
        </div>
        <div class="mcq-header-right">
          <div class="timer-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span id="quiz-timer-display">00:00</span>
          </div>
          <div class="mode-toggle-group">
            <button class="btn-mode ${this.quizMode === 'practice' ? 'active' : ''}" onclick="QuizEngine.setMode('practice')">Practice Mode</button>
            <button class="btn-mode ${this.quizMode === 'exam' ? 'active' : ''}" onclick="QuizEngine.setMode('exam')">Exam Mode</button>
          </div>
        </div>
      </div>

      <!-- Quick Question Selector Grid (1 to 15) -->
      <div class="quiz-nav-strip">
        <div class="quiz-progress-text">Progress: ${answeredCount} / ${total} Answered</div>
        <div class="quiz-number-grid">
          ${this.mcqs.map((q, idx) => {
            const isAnswered = this.userAnswers[idx] !== undefined;
            const isCurrent = idx === this.currentQuestionIndex;
            let statusClass = "";
            if (this.quizSubmitted) {
              statusClass = this.userAnswers[idx] === q.correct ? "is-correct" : "is-wrong";
            } else if (isAnswered) {
              statusClass = "is-answered";
            }
            return `
              <button class="q-num-pill ${isCurrent ? 'current' : ''} ${statusClass}" onclick="QuizEngine.goToQuestion(${idx})">
                ${idx + 1}
              </button>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Main Question Display Card -->
      <div class="quiz-card-wrapper" id="quiz-card-wrapper">
        ${this.renderQuestionCard(currentQ, this.currentQuestionIndex)}
      </div>

      <!-- Quiz Action Controls -->
      <div class="quiz-footer-actions">
        <button class="btn btn-secondary" onclick="QuizEngine.prevQuestion()" ${this.currentQuestionIndex === 0 ? 'disabled' : ''}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Previous
        </button>

        <div class="quiz-submit-zone">
          ${!this.quizSubmitted ? `
            <button class="btn btn-primary" onclick="QuizEngine.submitQuiz()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              Finish & Grade Exam (15 Questions)
            </button>
          ` : `
            <button class="btn btn-secondary" onclick="QuizEngine.resetQuiz()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"></polyline><polyline points="23 20 23 14 17 14"></polyline><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path></svg>
              Retake Exam
            </button>
          `}
        </div>

        <button class="btn btn-secondary" onclick="QuizEngine.nextQuestion()" ${this.currentQuestionIndex === total - 1 ? 'disabled' : ''}>
          Next
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      <!-- Scoreboard Container (shown after submission) -->
      <div id="quiz-score-container"></div>
    `;
  },

  renderQuestionCard(q, idx) {
    const selectedAnswer = this.userAnswers[idx];
    const isAnswered = selectedAnswer !== undefined;
    const showFeedback = (this.quizMode === "practice" && isAnswered) || this.quizSubmitted;
    const badgeClass = q.source.includes("🟢") ? "badge-verified" : (q.source.includes("🟣") ? "badge-supplementary" : "badge-synthesized");

    return `
      <div class="quiz-question-box">
        <div class="question-meta-row">
          <span class="q-index-tag">Question ${idx + 1} of ${this.mcqs.length}</span>
          <span class="q-source-badge ${badgeClass}">${q.source}</span>
        </div>

        <h3 class="q-statement">${q.question}</h3>

        <div class="q-options-list">
          ${q.options.map((opt, optIdx) => {
            const isSelected = selectedAnswer === optIdx;
            const isCorrect = optIdx === q.correct;
            let optState = "";

            if (showFeedback) {
              if (isCorrect) optState = "option-correct";
              else if (isSelected) optState = "option-wrong";
            } else if (isSelected) {
              optState = "option-selected";
            }

            const letter = String.fromCharCode(65 + optIdx);

            return `
              <div class="q-option-item ${optState}" onclick="QuizEngine.selectAnswer(${idx}, ${optIdx})">
                <div class="option-prefix">${letter}</div>
                <div class="option-label">${opt}</div>
                ${showFeedback && isCorrect ? `
                  <div class="option-check-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                ` : ''}
                ${showFeedback && isSelected && !isCorrect ? `
                  <div class="option-wrong-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>

        ${showFeedback ? `
          <div class="q-explanation-box ${selectedAnswer === q.correct ? 'exp-success' : 'exp-warning'}">
            <div class="explanation-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              <span>Academic Rationale & Grounding</span>
            </div>
            <p class="explanation-body">${q.explanation}</p>
            <div class="explanation-source-tag">Source Citation: ${q.source}</div>
          </div>
        ` : ''}
      </div>
    `;
  },

  selectAnswer(qIndex, optIndex) {
    if (this.quizSubmitted) return; // Locked after grading
    this.userAnswers[qIndex] = optIndex;
    this.updateQuestionView();
  },

  setMode(mode) {
    this.quizMode = mode;
    this.renderMCQHub(document.getElementById("mcq-container"));
  },

  goToQuestion(idx) {
    this.currentQuestionIndex = idx;
    this.updateQuestionView();
  },

  nextQuestion() {
    if (this.currentQuestionIndex < this.mcqs.length - 1) {
      this.currentQuestionIndex++;
      this.updateQuestionView();
    }
  },

  prevQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.updateQuestionView();
    }
  },

  updateQuestionView() {
    const wrapper = document.getElementById("quiz-card-wrapper");
    if (wrapper) {
      wrapper.innerHTML = this.renderQuestionCard(this.mcqs[this.currentQuestionIndex], this.currentQuestionIndex);
    }
    // Update number pill states
    const pills = document.querySelectorAll(".q-num-pill");
    pills.forEach((p, idx) => {
      p.classList.toggle("current", idx === this.currentQuestionIndex);
      const isAnswered = this.userAnswers[idx] !== undefined;
      if (this.quizSubmitted) {
        p.classList.remove("is-answered");
        p.classList.toggle("is-correct", this.userAnswers[idx] === this.mcqs[idx].correct);
        p.classList.toggle("is-wrong", this.userAnswers[idx] !== this.mcqs[idx].correct);
      } else {
        p.classList.toggle("is-answered", isAnswered);
      }
    });

    const progressText = document.querySelector(".quiz-progress-text");
    if (progressText) {
      progressText.textContent = `Progress: ${Object.keys(this.userAnswers).length} / ${this.mcqs.length} Answered`;
    }
  },

  submitQuiz() {
    this.quizSubmitted = true;
    if (this.timerInterval) clearInterval(this.timerInterval);

    // Calculate score
    let correctCount = 0;
    this.mcqs.forEach((q, idx) => {
      if (this.userAnswers[idx] === q.correct) {
        correctCount++;
      }
    });

    const total = this.mcqs.length;
    const percentage = Math.round((correctCount / total) * 100);

    // Trigger confetti if score >= 70%
    if (percentage >= 70 && window.confetti) {
      window.confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    // Render score container
    const scoreContainer = document.getElementById("quiz-score-container");
    if (scoreContainer) {
      let grade = "Distinction (First Class)";
      let gradeColor = "var(--success)";
      if (percentage < 50) {
        grade = "Needs Revision";
        gradeColor = "var(--danger)";
      } else if (percentage < 70) {
        grade = "Pass / Merit";
        gradeColor = "var(--warning)";
      }

      scoreContainer.innerHTML = `
        <div class="score-card-modal">
          <div class="score-card-header">
            <div class="score-badge-circle" style="border-color: ${gradeColor}">
              <span class="score-percent">${percentage}%</span>
              <span class="score-fraction">${correctCount} / ${total} Correct</span>
            </div>
            <div class="score-meta">
              <h3 class="score-title">Exam Assessment Complete!</h3>
              <p class="score-grade" style="color: ${gradeColor}">${grade}</p>
              <p class="score-advice">
                ${percentage >= 80 
                  ? 'Outstanding command of the course module! You are well prepared for the university finals.' 
                  : 'Good effort! Review the questions highlighted in red above and cross-reference with the module notes.'}
              </p>
            </div>
          </div>
        </div>
      `;
      scoreContainer.scrollIntoView({ behavior: "smooth" });
    }

    this.renderMCQHub(document.getElementById("mcq-container"));
  },

  resetQuiz() {
    this.userAnswers = {};
    this.currentQuestionIndex = 0;
    this.quizSubmitted = false;
    this.quizStartTime = Date.now();
    this.renderMCQHub(document.getElementById("mcq-container"));
    this.startTimer();
  },

  // FLASHCARDS ENGINE
  initFlashcards(definitions, containerSelector) {
    this.definitions = definitions || [];
    this.currentCardIndex = 0;
    this.container = document.querySelector(containerSelector);
    if (!this.container) return;
    this.renderFlashcardDeck();
  },

  renderFlashcardDeck() {
    if (this.definitions.length === 0) return;
    const current = this.definitions[this.currentCardIndex];
    const isMastered = this.masteredTerms.has(current.term);

    this.container.innerHTML = `
      <div class="flashcard-tool-bar">
        <div class="flashcard-counter">Concept ${this.currentCardIndex + 1} of ${this.definitions.length}</div>
        <div class="mastery-counter">
          <span class="mastery-dot"></span>
          <span>${this.masteredTerms.size} of ${this.definitions.length} Mastered</span>
        </div>
      </div>

      <div class="flashcard-scene" onclick="QuizEngine.flipCard(this)">
        <div class="flashcard-card" id="active-flashcard">
          <!-- Front Face -->
          <div class="flashcard-face flashcard-front">
            <div class="fc-badge-row">
              <span class="fc-pill">University Terminology</span>
              <span class="fc-source-cite">📖 Source: ${current.source}</span>
            </div>
            <div class="fc-term-display">${current.term}</div>
            <div class="fc-hint">Click or press Space to flip definition ↻</div>
          </div>

          <!-- Back Face -->
          <div class="flashcard-face flashcard-back">
            <div class="fc-badge-row">
              <span class="fc-pill">Academic Definition</span>
              <span class="fc-source-cite">Source: ${current.source}</span>
            </div>
            <p class="fc-def-display">${current.def}</p>
            <div class="fc-actions-row" onclick="event.stopPropagation()">
              <button class="btn btn-sm ${isMastered ? 'btn-success' : 'btn-secondary'}" onclick="QuizEngine.toggleMastery('${current.term.replace(/'/g, "\\'")}')">
                ${isMastered ? '✓ Mastered' : 'Mark as Mastered'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="flashcard-nav">
        <button class="btn btn-secondary" onclick="QuizEngine.prevCard()" ${this.currentCardIndex === 0 ? 'disabled' : ''}>
          ← Previous Concept
        </button>
        <button class="btn btn-primary" onclick="QuizEngine.nextCard()" ${this.currentCardIndex === this.definitions.length - 1 ? 'disabled' : ''}>
          Next Concept →
        </button>
      </div>
    `;
  },

  flipCard(sceneEl) {
    const card = sceneEl.querySelector(".flashcard-card");
    if (card) {
      card.classList.toggle("is-flipped");
    }
  },

  nextCard() {
    if (this.currentCardIndex < this.definitions.length - 1) {
      this.currentCardIndex++;
      this.renderFlashcardDeck();
    }
  },

  prevCard() {
    if (this.currentCardIndex > 0) {
      this.currentCardIndex--;
      this.renderFlashcardDeck();
    }
  },

  toggleMastery(term) {
    if (this.masteredTerms.has(term)) {
      this.masteredTerms.delete(term);
    } else {
      this.masteredTerms.add(term);
    }
    this.renderFlashcardDeck();
  }
};
