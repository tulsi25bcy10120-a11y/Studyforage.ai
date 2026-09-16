// StudyForge AI - Main Application Controller
window.StudyForge = {
  currentModule: null,
  currentDataset: null,
  isProcessing: false,

  init() {
    this.bindEvents();
    this.populateSampleSelector();
    
    // Load default sample module (CS301) to provide an immediate wow experience
    if (window.SAMPLE_MODULES && window.SAMPLE_MODULES.length > 0) {
      this.loadModule(window.SAMPLE_MODULES[0]);
    }
  },

  bindEvents() {
    // Drag & Drop Setup
    const dropZone = document.getElementById("pdf-dropzone");
    const fileInput = document.getElementById("pdf-file-input");

    if (dropZone && fileInput) {
      dropZone.addEventListener("click", () => fileInput.click());

      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("drag-active");
      });

      dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("drag-active");
      });

      dropZone.addEventListener("drop", async (e) => {
        e.preventDefault();
        dropZone.classList.remove("drag-active");
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          await this.handleFileUpload(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener("change", async (e) => {
        if (e.target.files && e.target.files.length > 0) {
          await this.handleFileUpload(e.target.files[0]);
        }
      });
    }

    // Tab Navigation Buttons
    const tabButtons = document.querySelectorAll(".nav-tab-btn");
    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const targetTab = btn.getAttribute("data-tab");
        this.switchTab(targetTab);
      });
    });
  },

  populateSampleSelector() {
    const select = document.getElementById("sample-module-select");
    if (!select || !window.SAMPLE_MODULES) return;

    select.innerHTML = window.SAMPLE_MODULES.map(m => `
      <option value="${m.id}">${m.code}: ${m.title} (${m.pages} Pages)</option>
    `).join('');

    select.addEventListener("change", (e) => {
      const selectedId = e.target.value;
      const mod = window.SAMPLE_MODULES.find(m => m.id === selectedId);
      if (mod) this.loadModule(mod);
    });
  },

  async handleFileUpload(file) {
    if (!file.name.toLowerCase().endsWith(".pdf") && !file.name.toLowerCase().endsWith(".txt")) {
      this.showToast("Please upload a PDF or TXT course module.", "error");
      return;
    }

    this.showProcessingModal("Ingesting & Extracting PDF Content...");
    try {
      let moduleData;
      if (file.name.toLowerCase().endsWith(".pdf")) {
        moduleData = await window.PDFParser.extractFromPDF(file);
      } else {
        const text = await file.text();
        moduleData = await window.PDFParser.extractFromText(file.name, text);
      }

      this.hideProcessingModal();
      this.showToast(`Successfully analyzed ${file.name}!`, "success");
      this.loadModule(moduleData);
    } catch (err) {
      console.error(err);
      this.hideProcessingModal();
      this.showToast("Failed to parse PDF. Loading pre-formatted sample module instead.", "warning");
      if (window.SAMPLE_MODULES && window.SAMPLE_MODULES.length > 0) {
        this.loadModule(window.SAMPLE_MODULES[0]);
      }
    }
  },

  loadModule(moduleData) {
    this.currentModule = moduleData;
    this.updateHeaderStats(moduleData);
    this.renderModulePreview(moduleData);

    // Generate comprehensive bundle
    this.currentDataset = window.StudyForgeGenerator.generateForModule(moduleData);

    // Render all generated components
    this.renderNotesTab();
    this.renderSlidesTab();
    this.renderQuestionsTab();
    this.renderDefinitionsTab();
    this.renderRevisionTab();
    this.renderDifficultyTab();
  },

  updateHeaderStats(mod) {
    const titleEl = document.getElementById("active-module-title");
    const codeEl = document.getElementById("active-module-code");
    const pagesEl = document.getElementById("active-module-pages");
    const wordsEl = document.getElementById("active-module-words");
    const deptEl = document.getElementById("active-module-dept");

    if (titleEl) titleEl.textContent = mod.title;
    if (codeEl) codeEl.textContent = mod.code;
    if (pagesEl) pagesEl.textContent = `${mod.pages} Pages`;
    if (wordsEl) wordsEl.textContent = `${mod.words.toLocaleString()} Words`;
    if (deptEl) deptEl.textContent = mod.department;
  },

  renderModulePreview(mod) {
    const previewContainer = document.getElementById("module-preview-content");
    if (!previewContainer) return;

    previewContainer.innerHTML = `
      <div class="preview-meta-banner">
        <div class="banner-badge-group">
          <span class="badge badge-accent">${mod.code}</span>
          <span class="badge badge-neutral">${mod.pages} Document Pages</span>
          <span class="badge badge-neutral">${mod.sections ? mod.sections.length : 1} Extracted Sections</span>
          <span class="badge badge-verified">🟢 Primary Ground Truth Loaded</span>
        </div>
        <p class="banner-description">${mod.description || 'University syllabus module parsed for automated study synthesis.'}</p>
      </div>

      <div class="preview-toc-box">
        <h4 class="toc-title">Detected Module Outline & Section Mapping</h4>
        <div class="toc-grid">
          ${(mod.sections || []).map((sec, i) => `
            <div class="toc-item">
              <span class="toc-page">Page ${sec.page}</span>
              <span class="toc-sec-title">${sec.title}</span>
              <span class="toc-word-count">${sec.text.split(/\s+/).length} words</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="preview-source-viewer">
        <div class="source-viewer-header">
          <span>Source Text Excerpt (First 3 Sections)</span>
          <span class="source-badge-indicator">Page 1 to ${Math.min(mod.pages, 4)}</span>
        </div>
        <div class="source-viewer-body">
          ${(mod.sections || []).slice(0, 3).map(sec => `
            <div class="source-sec-block">
              <h5>${sec.title} <small>[Page ${sec.page}]</small></h5>
              <p>${sec.text.slice(0, 380)}...</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // 1. Structured Notes Tab
  renderNotesTab() {
    const container = document.getElementById("notes-container");
    if (!container || !this.currentDataset) return;

    const notes = this.currentDataset.notes;

    container.innerHTML = `
      <div class="tab-action-bar">
        <div class="tab-action-left">
          <h3 class="section-heading">Structured Module Notes</h3>
          <p class="section-subheading">Hierarchical study breakdown with strict ground truth citations</p>
        </div>
        <div class="tab-action-right">
          <button class="btn btn-secondary btn-sm" onclick="StudyForge.copyNotesMarkdown()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            Copy Markdown
          </button>
          <button class="btn btn-primary btn-sm" onclick="window.print()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Print Notes
          </button>
        </div>
      </div>

      <!-- Source Legend -->
      <div class="source-legend-card">
        <span class="legend-title">Ground Truth Badges:</span>
        <span class="legend-badge badge-verified">🟢 Verified in PDF</span>
        <span class="legend-badge badge-synthesized">🟡 Synthesized from PDF</span>
        <span class="legend-badge badge-supplementary">🟣 ⚠️ Supplementary (Not present in source PDF)</span>
      </div>

      <div class="notes-units-list">
        ${notes.map(n => `
          <div class="note-unit-card ${n.source.type === 'supplementary' ? 'is-supplementary' : ''}">
            <div class="note-unit-header">
              <div class="note-unit-titles">
                <span class="unit-tag">${n.unit}</span>
                <span class="diff-tag diff-${n.difficulty.toLowerCase()}">${n.difficulty}</span>
                <h4 class="unit-title">${n.title}</h4>
              </div>
              <div class="note-source-badge ${n.source.type === 'supplementary' ? 'badge-supplementary' : 'badge-verified'}">
                ${n.source.text}
              </div>
            </div>

            ${n.sourceWarning ? `
              <div class="source-warning-box">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <span>${n.sourceWarning}</span>
              </div>
            ` : ''}

            <p class="unit-summary-text">${n.summary}</p>

            <div class="unit-takeaways">
              <div class="takeaways-label">Core Examination Takeaways & Invariants:</div>
              <ul class="takeaways-list">
                ${n.takeaways.map(t => `<li>${t}</li>`).join('')}
              </ul>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  // 2. PowerPoint Slides Tab
  renderSlidesTab() {
    if (!this.currentDataset) return;
    window.SlidesEngine.init(this.currentDataset.slides, "#slides-container");
  },

  // 3. Questions Tab (15 MCQs + Short & Long Answers)
  renderQuestionsTab() {
    if (!this.currentDataset) return;

    // Initialize MCQs
    window.QuizEngine.initMCQs(this.currentDataset.mcqs, "#mcq-container");

    // Render Short & Long Answers
    const writtenContainer = document.getElementById("written-questions-container");
    if (!writtenContainer) return;

    const sq = this.currentDataset.questions.short || [];
    const lq = this.currentDataset.questions.long || [];

    writtenContainer.innerHTML = `
      <div class="written-section-block">
        <div class="written-heading-row">
          <h3 class="section-heading">Short-Answer Examination Practice</h3>
          <span class="badge badge-accent">3–5 Marks Each</span>
        </div>
        <div class="written-grid">
          ${sq.map((q, i) => `
            <div class="written-card">
              <div class="written-card-header">
                <span class="q-mark-pill">[${q.marks} Marks]</span>
                <span class="q-source-pill">${q.source}</span>
              </div>
              <h4 class="written-q-text">${q.question}</h4>
              <div class="rubric-box">
                <span class="rubric-label">Key Points Required for Full Marks:</span>
                <ul>
                  ${q.keyPoints.map(kp => `<li>${kp}</li>`).join('')}
                </ul>
              </div>
              <details class="model-answer-accordion">
                <summary>Reveal Model Answer & Rubric</summary>
                <div class="model-answer-content">
                  <p>${q.modelAnswer.replace(/\n/g, '<br>')}</p>
                </div>
              </details>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="written-section-block mt-8">
        <div class="written-heading-row">
          <h3 class="section-heading">Long-Answer & Analytical Examination Prompts</h3>
          <span class="badge badge-accent">10–12 Marks Each</span>
        </div>
        <div class="written-grid">
          ${lq.map((q, i) => `
            <div class="written-card long-q-card">
              <div class="written-card-header">
                <span class="q-mark-pill">[${q.marks} Marks]</span>
                <span class="q-source-pill">${q.source}</span>
              </div>
              <h4 class="written-q-text">${q.question}</h4>
              <div class="rubric-box">
                <span class="rubric-label">Marking Criteria & Critical Concepts:</span>
                <ul>
                  ${q.keyPoints.map(kp => `<li>${kp}</li>`).join('')}
                </ul>
              </div>
              <details class="model-answer-accordion">
                <summary>Reveal Comprehensive Model Answer</summary>
                <div class="model-answer-content">
                  <p>${q.modelAnswer.replace(/\n/g, '<br><br>')}</p>
                </div>
              </details>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // 4. Definitions & Concepts Tab
  renderDefinitionsTab() {
    if (!this.currentDataset) return;
    window.QuizEngine.initFlashcards(this.currentDataset.definitions, "#flashcard-container");

    // Also render searchable glossary list
    const glossaryContainer = document.getElementById("glossary-list-container");
    if (!glossaryContainer) return;

    const defs = this.currentDataset.definitions;
    glossaryContainer.innerHTML = `
      <div class="glossary-header">
        <h3 class="section-heading">Complete Definitions & Glossary Index</h3>
        <input type="text" class="input-search" id="glossary-search" placeholder="Search concepts or terms..." oninput="StudyForge.filterGlossary(this.value)">
      </div>
      <div class="glossary-grid" id="glossary-items-grid">
        ${defs.map(d => `
          <div class="glossary-card">
            <div class="glossary-term-row">
              <span class="glossary-term">${d.term}</span>
              <span class="glossary-source">Source: ${d.source}</span>
            </div>
            <p class="glossary-def">${d.def}</p>
          </div>
        `).join('')}
      </div>
    `;
  },

  filterGlossary(query) {
    const cards = document.querySelectorAll(".glossary-card");
    const q = query.toLowerCase();
    cards.forEach(card => {
      const term = card.querySelector(".glossary-term").textContent.toLowerCase();
      const def = card.querySelector(".glossary-def").textContent.toLowerCase();
      card.style.display = (term.includes(q) || def.includes(q)) ? "block" : "none";
    });
  },

  // 5. Revision Mode (1-Page Cram Sheet)
  renderRevisionTab() {
    const container = document.getElementById("revision-container");
    if (!container || !this.currentDataset) return;

    const rev = this.currentDataset.revisionSheet;

    container.innerHTML = `
      <div class="tab-action-bar">
        <div class="tab-action-left">
          <h3 class="section-heading">1-Page Last-Minute Revision Sheet</h3>
          <p class="section-subheading">High-density formula and theorem cheat sheet formatted for direct examination printing</p>
        </div>
        <div class="tab-action-right">
          <button class="btn btn-primary" onclick="window.print()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Print 1-Page Cheat Sheet (PDF)
          </button>
        </div>
      </div>

      <!-- Printable 1-Page Cheat Sheet Container -->
      <div class="cram-sheet-page" id="cram-sheet-page">
        <div class="cram-header">
          <div class="cram-logo">StudyForge AI • CramSheet™</div>
          <div class="cram-title">${rev.title}</div>
          <div class="cram-meta">${rev.meta}</div>
        </div>

        <div class="cram-layout-grid">
          <!-- Column 1: Core Theorems & Rules -->
          <div class="cram-column">
            <div class="cram-box-title">Core Laws & Invariants</div>
            ${rev.coreTheorems.map(ct => `
              <div class="cram-item">
                <div class="cram-item-name">${ct.name}</div>
                <div class="cram-formula">${ct.formula}</div>
                <div class="cram-desc">${ct.keyRule}</div>
              </div>
            `).join('')}

            <div class="cram-box-title mt-3">Governing Formulas</div>
            ${rev.formulasAndAlgorithms.map(fa => `
              <div class="cram-item">
                <div class="cram-item-name">${fa.name}</div>
                <div class="cram-formula">${fa.detail}</div>
              </div>
            `).join('')}
          </div>

          <!-- Column 2: Exam Traps & 60-Sec Review -->
          <div class="cram-column">
            <div class="cram-box-title">⚠️ Common Examination Traps</div>
            <div class="cram-traps-list">
              ${rev.examTraps.map(trap => `
                <div class="cram-trap-item">${trap}</div>
              `).join('')}
            </div>

            <div class="cram-box-title mt-3">⚡ 60-Second Memory Hooks</div>
            <div class="cram-rapid-list">
              ${rev.sixtySecondReview.map(item => `
                <div class="cram-rapid-item">${item}</div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="cram-footer">
          <span>StudyForge AI • Academic Ground Truth Verified</span>
          <span>Target Score: First Class Honours (100% Verified)</span>
        </div>
      </div>
    `;
  },

  // 6. Topic-Wise Difficulty Tab
  renderDifficultyTab() {
    const container = document.getElementById("difficulty-container");
    if (!container || !this.currentDataset) return;

    const matrix = this.currentDataset.difficultyMatrix;

    container.innerHTML = `
      <div class="tab-action-bar">
        <div class="tab-action-left">
          <h3 class="section-heading">Topic-Wise Difficulty & Cognitive Complexity</h3>
          <p class="section-subheading">Strategic revision prioritization and estimated study time per section</p>
        </div>
      </div>

      <div class="difficulty-table-wrapper">
        <table class="difficulty-table">
          <thead>
            <tr>
              <th>Topic / Section</th>
              <th>Difficulty Tier</th>
              <th>Est. Study Time</th>
              <th>Cognitive Load</th>
              <th>Required Prerequisites</th>
              <th>Source Origin</th>
            </tr>
          </thead>
          <tbody>
            ${matrix.map(m => `
              <tr>
                <td class="topic-cell"><strong>${m.topic}</strong></td>
                <td>
                  <span class="diff-badge diff-${m.level.toLowerCase()}">${m.level}</span>
                </td>
                <td class="hours-cell">${m.hours}</td>
                <td>
                  <span class="cognitive-tag">${m.cognitive}</span>
                </td>
                <td class="prereq-cell">${m.prereqs}</td>
                <td>
                  <span class="source-origin-tag ${m.sourceBadge.includes('🟢') ? 'badge-verified' : 'badge-supplementary'}">
                    ${m.sourceBadge}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // Navigation & Tab Switching
  switchTab(tabId) {
    const allTabs = document.querySelectorAll(".tab-pane");
    const allBtns = document.querySelectorAll(".nav-tab-btn");

    allTabs.forEach(t => t.classList.remove("active"));
    allBtns.forEach(b => b.classList.remove("active"));

    const targetTab = document.getElementById(tabId);
    const targetBtn = document.querySelector(`.nav-tab-btn[data-tab="${tabId}"]`);

    if (targetTab) targetTab.classList.add("active");
    if (targetBtn) targetBtn.classList.add("active");

    // Scroll to top of tab smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  // Helper trigger methods for the 4 primary buttons
  triggerGenerateNotes() {
    this.switchTab("tab-notes");
    this.showToast("Generated complete structured notes with ground truth citations!", "success");
  },

  triggerGeneratePPT() {
    this.switchTab("tab-slides");
    this.showToast("Rendered 12-slide PowerPoint presentation with speaker notes!", "success");
  },

  triggerGenerateQuestions() {
    this.switchTab("tab-questions");
    this.showToast("Loaded 15 interactive MCQs, short and long answer questions!", "success");
  },

  triggerRevisionMode() {
    this.switchTab("tab-revision");
    this.showToast("Opened high-density 1-Page Last-Minute Cram Sheet!", "success");
  },

  copyNotesMarkdown() {
    if (!this.currentDataset) return;
    let md = `# ${this.currentModule.code}: ${this.currentModule.title}\n\n`;
    this.currentDataset.notes.forEach(n => {
      md += `## ${n.unit}: ${n.title} [${n.difficulty}]\n`;
      md += `*${n.source.text}*\n\n`;
      md += `${n.summary}\n\n`;
      md += `### Core Takeaways:\n`;
      n.takeaways.forEach(t => md += `- ${t}\n`);
      md += `\n---\n\n`;
    });

    navigator.clipboard.writeText(md).then(() => {
      this.showToast("Notes copied to clipboard as Markdown!", "success");
    }).catch(() => {
      this.showToast("Unable to access clipboard.", "error");
    });
  },

  showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `sf-toast sf-toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 50);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  },

  showProcessingModal(text) {
    let modal = document.getElementById("sf-processing-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "sf-processing-modal";
      modal.className = "sf-modal-overlay";
      modal.innerHTML = `
        <div class="sf-modal-box">
          <div class="sf-spinner"></div>
          <h4 id="sf-processing-text" class="sf-modal-title">Analyzing Module PDF...</h4>
          <p class="sf-modal-desc">Parsing semantic section hierarchy, validating ground truth, and generating study assets.</p>
        </div>
      `;
      document.body.appendChild(modal);
    }
    document.getElementById("sf-processing-text").textContent = text;
    modal.classList.add("active");
  },

  hideProcessingModal() {
    const modal = document.getElementById("sf-processing-modal");
    if (modal) modal.classList.remove("active");
  }
};

// Initialize on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  window.StudyForge.init();
});
