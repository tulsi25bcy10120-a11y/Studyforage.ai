// PDF Parser and Module Ingestion Engine using PDF.js with smart sectioning and fallback heuristics
window.PDFParser = {
  async extractFromPDF(file) {
    if (!window.pdfjsLib) {
      throw new Error("PDF.js library is not loaded. Please ensure an active internet connection or fallback to sample modules.");
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    let fullText = "";
    const pageTexts = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Reconstruct text items taking positioning and linebreaks into account
      let lastY = null;
      let pageString = "";
      for (const item of textContent.items) {
        if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
          pageString += "\n";
        } else if (pageString.length > 0 && !pageString.endsWith(" ") && !pageString.endsWith("\n")) {
          pageString += " ";
        }
        pageString += item.str;
        lastY = item.transform[5];
      }

      pageTexts.push({
        pageNum,
        text: pageString.trim()
      });
      fullText += `\n--- Page ${pageNum} ---\n` + pageString + "\n";
    }

    return this.structureExtractedText(file.name, numPages, pageTexts, fullText);
  },

  async extractFromText(filename, text) {
    const pages = Math.max(1, Math.ceil(text.length / 2200));
    const pageTexts = [];
    const chunkSize = Math.ceil(text.length / pages);
    for (let i = 0; i < pages; i++) {
      pageTexts.push({
        pageNum: i + 1,
        text: text.slice(i * chunkSize, (i + 1) * chunkSize)
      });
    }
    return this.structureExtractedText(filename, pages, pageTexts, text);
  },

  structureExtractedText(filename, totalPages, pageTexts, fullText) {
    const cleanFilename = filename.replace(/\.pdf$/i, "").replace(/[_-]/g, " ");
    
    // Guess module code from filename or first lines (e.g. CS301, BIO-204, ECON101)
    const codeMatch = fullText.match(/\b([A-Z]{2,4}\s?[0-9]{3,4}[A-Z]?)\b/i) || cleanFilename.match(/\b([A-Z]{2,4}\s?[0-9]{3,4}[A-Z]?)\b/i);
    const moduleCode = codeMatch ? codeMatch[1].toUpperCase() : "MOD" + Math.floor(100 + Math.random() * 900);

    // Heuristics to detect sections from headings
    const rawLines = fullText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const potentialHeadings = [];
    
    // Regex matching section patterns like "1. Introduction", "Chapter 2", "Section 3.1", "IV. Conclusions" or ALL CAPS short lines
    const headingRegex = /^(\d+(\.\d+)*\s+[A-Z][\w\s]{3,60}|Chapter\s+\d+|Module\s+\d+|Unit\s+\d+|[IVXLCDM]+\.\s+[A-Z][\w\s]+)/i;

    let currentSection = {
      id: "sec-1",
      page: 1,
      title: "1. Overview & Fundamentals",
      text: ""
    };
    const sections = [];

    pageTexts.forEach((p) => {
      const lines = p.text.split("\n").map(l => l.trim()).filter(Boolean);
      lines.forEach((line) => {
        const isHeading = headingRegex.test(line) || (line.length > 4 && line.length < 55 && line === line.toUpperCase() && !line.includes("."));
        if (isHeading && currentSection.text.length > 200) {
          sections.push(currentSection);
          currentSection = {
            id: "sec-" + (sections.length + 1),
            page: p.pageNum,
            title: line.replace(/[#*]/g, "").trim(),
            text: ""
          };
        } else {
          currentSection.text += " " + line;
        }
      });
    });

    if (currentSection.text.trim().length > 0) {
      sections.push(currentSection);
    }

    // If section splitting was too sparse or too dense, fallback gracefully
    if (sections.length === 0) {
      sections.push({
        id: "sec-1",
        page: 1,
        title: "1. Comprehensive Course Content",
        text: fullText
      });
    }

    const words = fullText.split(/\s+/).filter(Boolean).length;

    return {
      id: "uploaded-" + Date.now(),
      code: moduleCode,
      title: cleanFilename.length > 5 ? cleanFilename : "Academic Course Module",
      department: "University Academic Syllabus",
      pages: totalPages,
      words: words,
      academicLevel: "Undergraduate / Postgraduate",
      description: `Ingested module document containing ${totalPages} pages and approx. ${words} words across ${sections.length} core sections.`,
      sections: sections,
      rawText: fullText
    };
  }
};
