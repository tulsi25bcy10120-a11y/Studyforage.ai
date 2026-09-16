// StudyForge AI Interactive Slide Deck & Speaker Notes Engine
window.SlidesEngine = {
  currentSlideIndex: 0,
  slides: [],
  containerEl: null,
  speakerNotesOpen: true,

  init(slides, containerSelector) {
    this.slides = slides || [];
    this.currentSlideIndex = 0;
    this.containerEl = document.querySelector(containerSelector);
    if (!this.containerEl) return;

    this.render();
    this.bindKeyboardShortcuts();
  },

  bindKeyboardShortcuts() {
    // Avoid double-binding
    if (this._shortcutsBound) return;
    this._shortcutsBound = true;

    window.addEventListener("keydown", (e) => {
      // Don't intercept if typing in an input or textarea
      if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;

      const activeTab = document.querySelector(".tab-pane.active");
      if (!activeTab || activeTab.id !== "tab-slides") return;

      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        this.nextSlide();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        this.prevSlide();
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        this.toggleFullscreen();
      } else if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        this.toggleSpeakerNotes();
      }
    });
  },

  goToSlide(index) {
    if (index >= 0 && index < this.slides.length) {
      this.currentSlideIndex = index;
      this.updateSlideView();
    }
  },

  nextSlide() {
    if (this.currentSlideIndex < this.slides.length - 1) {
      this.currentSlideIndex++;
      this.updateSlideView();
    }
  },

  prevSlide() {
    if (this.currentSlideIndex > 0) {
      this.currentSlideIndex--;
      this.updateSlideView();
    }
  },

  toggleSpeakerNotes() {
    this.speakerNotesOpen = !this.speakerNotesOpen;
    const notesPanel = document.getElementById("speaker-notes-panel");
    const toggleBtn = document.getElementById("btn-toggle-notes");
    if (notesPanel) {
      notesPanel.classList.toggle("collapsed", !this.speakerNotesOpen);
    }
    if (toggleBtn) {
      toggleBtn.classList.toggle("active", this.speakerNotesOpen);
      toggleBtn.innerHTML = this.speakerNotesOpen 
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Hide Speaker Notes`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Show Speaker Notes (S)`;
    }
  },

  toggleFullscreen() {
    const deckWrapper = document.getElementById("deck-presentation-wrapper");
    if (!deckWrapper) return;

    if (!document.fullscreenElement) {
      deckWrapper.requestFullscreen().catch(err => {
        console.warn("Fullscreen request error:", err);
      });
    } else {
      document.exitFullscreen();
    }
  },

  render() {
    if (!this.containerEl || this.slides.length === 0) return;

    const total = this.slides.length;
    const current = this.slides[this.currentSlideIndex];

    this.containerEl.innerHTML = `
      <div class="deck-toolbar">
        <div class="deck-toolbar-left">
          <span class="deck-badge">${total} Slides PowerPoint Deck</span>
          <span class="deck-counter" id="deck-counter">Slide ${this.currentSlideIndex + 1} of ${total}</span>
        </div>
        <div class="deck-toolbar-right">
          <button class="btn btn-sm btn-ghost ${this.speakerNotesOpen ? 'active' : ''}" id="btn-toggle-notes" onclick="SlidesEngine.toggleSpeakerNotes()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            ${this.speakerNotesOpen ? 'Hide Speaker Notes' : 'Show Speaker Notes (S)'}
          </button>
          <button class="btn btn-sm btn-ghost" onclick="SlidesEngine.toggleFullscreen()" title="Fullscreen (F)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            Fullscreen (F)
          </button>
          <button class="btn btn-sm btn-secondary" onclick="SlidesEngine.printDeck()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Print / Export Deck
          </button>
        </div>
      </div>

      <div class="deck-presentation-wrapper" id="deck-presentation-wrapper">
        <!-- Main Slide Viewport (16:9 Canvas) -->
        <div class="slide-stage" id="slide-stage">
          ${this.generateSlideHtml(current)}
        </div>

        <!-- Speaker Notes Drawer (Collapsible) -->
        <div class="speaker-notes-panel ${this.speakerNotesOpen ? '' : 'collapsed'}" id="speaker-notes-panel">
          <div class="speaker-notes-header">
            <div class="speaker-notes-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span>Speaker Notes & Presenter Prompts • Slide ${this.currentSlideIndex + 1}</span>
            </div>
            <div class="speaker-timer" id="speaker-timer">02:30 min target</div>
          </div>
          <div class="speaker-notes-body" id="speaker-notes-content">
            ${current.speakerNotes || "No specific speaker notes for this slide."}
          </div>
          <div class="speaker-notes-footer">
            <span class="hint-tag">Keyboard: [← / →] Navigate slides • [Space] Advance • [S] Toggle Notes • [F] Fullscreen</span>
          </div>
        </div>
      </div>

      <!-- Slide Navigation Controls -->
      <div class="slide-nav-bar">
        <button class="btn btn-icon btn-secondary" onclick="SlidesEngine.prevSlide()" id="btn-prev-slide" ${this.currentSlideIndex === 0 ? 'disabled' : ''}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>

        <!-- Slide Progress Bar & Dots -->
        <div class="slide-dots-container" id="slide-dots-container">
          ${this.slides.map((s, idx) => `
            <button class="slide-dot ${idx === this.currentSlideIndex ? 'active' : ''}" 
              onclick="SlidesEngine.goToSlide(${idx})" 
              title="Slide ${idx + 1}: ${s.title.replace(/"/g, '&quot;')}">
              <span class="dot-num">${idx + 1}</span>
            </button>
          `).join('')}
        </div>

        <button class="btn btn-icon btn-secondary" onclick="SlidesEngine.nextSlide()" id="btn-next-slide" ${this.currentSlideIndex === total - 1 ? 'disabled' : ''}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      <!-- Thumbnails Carousel Strip -->
      <div class="slide-thumbnails-strip">
        <div class="thumbnails-heading">All ${total} Slides (Click to Jump)</div>
        <div class="thumbnails-scroll">
          ${this.slides.map((s, idx) => `
            <div class="slide-thumb-card ${idx === this.currentSlideIndex ? 'active' : ''}" onclick="SlidesEngine.goToSlide(${idx})">
              <div class="thumb-header">
                <span class="thumb-num">#${idx + 1}</span>
                <span class="thumb-badge-mini">${s.badge.includes('🟢') ? 'PDF Verified' : 'Synthesized'}</span>
              </div>
              <div class="thumb-title">${s.title}</div>
              <div class="thumb-snippet">${s.points && s.points[0] ? s.points[0].slice(0, 45) + '...' : ''}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  generateSlideHtml(slide) {
    const isTitle = slide.layout === "title";
    const badgeClass = slide.badge.includes("🟢") ? "badge-verified" : (slide.badge.includes("🟣") ? "badge-supplementary" : "badge-synthesized");

    return `
      <div class="slide-canvas slide-layout-${slide.layout || 'standard'}">
        <div class="slide-watermark">StudyForge AI</div>
        
        <div class="slide-header">
          <div class="slide-meta">
            <span class="slide-source-badge ${badgeClass}">${slide.badge}</span>
            <span class="slide-index-tag">Slide ${slide.number} of ${this.slides.length}</span>
          </div>
          <h2 class="slide-heading">${slide.title}</h2>
          ${slide.subtitle ? `<p class="slide-subheading">${slide.subtitle}</p>` : ''}
        </div>

        <div class="slide-content-area">
          ${isTitle ? `
            <div class="slide-title-hero">
              <div class="hero-brand-pill">University Course Presentation Deck</div>
              <div class="hero-points-list">
                ${slide.points.map(p => `<div class="hero-point-item"><span class="hero-bullet">✦</span> ${p}</div>`).join('')}
              </div>
            </div>
          ` : `
            <div class="slide-points-grid">
              ${slide.points.map((p, i) => `
                <div class="slide-bullet-card">
                  <div class="bullet-index">${i + 1}</div>
                  <div class="bullet-text">${p}</div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <div class="slide-footer">
          <span class="slide-footer-left">StudyForge AI Academic Suite</span>
          <div class="slide-footer-center">
            <span class="slide-footer-indicator">Slide ${slide.number}</span>
          </div>
          <span class="slide-footer-right">Ground Truth Verified</span>
        </div>
      </div>
    `;
  },

  updateSlideView() {
    const current = this.slides[this.currentSlideIndex];
    if (!current) return;

    // Update slide stage
    const stage = document.getElementById("slide-stage");
    if (stage) {
      stage.innerHTML = this.generateSlideHtml(current);
    }

    // Update counter
    const counter = document.getElementById("deck-counter");
    if (counter) {
      counter.textContent = `Slide ${this.currentSlideIndex + 1} of ${this.slides.length}`;
    }

    // Update speaker notes
    const notesContent = document.getElementById("speaker-notes-content");
    const notesTitle = document.querySelector(".speaker-notes-title span");
    if (notesContent) {
      notesContent.innerHTML = current.speakerNotes || "No specific speaker notes for this slide.";
    }
    if (notesTitle) {
      notesTitle.textContent = `Speaker Notes & Presenter Prompts • Slide ${this.currentSlideIndex + 1}`;
    }

    // Update navigation buttons
    const prevBtn = document.getElementById("btn-prev-slide");
    const nextBtn = document.getElementById("btn-next-slide");
    if (prevBtn) prevBtn.disabled = this.currentSlideIndex === 0;
    if (nextBtn) nextBtn.disabled = this.currentSlideIndex === this.slides.length - 1;

    // Update dots
    const dots = document.querySelectorAll(".slide-dot");
    dots.forEach((dot, idx) => {
      dot.classList.toggle("active", idx === this.currentSlideIndex);
    });

    // Update thumbnails
    const thumbs = document.querySelectorAll(".slide-thumb-card");
    thumbs.forEach((thumb, idx) => {
      thumb.classList.toggle("active", idx === this.currentSlideIndex);
      if (idx === this.currentSlideIndex) {
        thumb.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    });
  },

  printDeck() {
    window.print();
  }
};
