/**
 * TableView - Handles rendering of product data table (transposed view)
 */
class TableView {
  constructor(model) {
    this.model = model;
    this.container = document.getElementById("tableContainer");
    this.sortColumn = -1;
    this.sortAscending = true;
    this.currentPage = 1;
    this.PAGE_SIZE = 10;
    this.rowMetrics = []; // will be set dynamically
    this.matches = [];
    this.currentMatchIndex = -1;
    this.searchTerm = "";
    this.onSearchMatchChange = null;
    this.flashTimeout = null;
    this.soundEnabled = true;
    this.audioCtx = null;
  }

  /**
   * Determine category group for a metric label (Tailwind UI grouped rows)
   */
  getMetricCategory(label) {
    if (!label) return "General & Installation Specifications";
    const t = label.toLowerCase();
    if (
      t.includes("tension") ||
      t.includes("pullout") ||
      t.includes("breakout") ||
      t.includes("ductility")
    ) {
      return "Tension Design Specifications";
    }
    if (
      t.includes("shear") ||
      t.includes("pryout") ||
      t.includes("vsa") ||
      t.includes("vcp")
    ) {
      return "Shear Design Specifications";
    }
    return "General & Installation Specifications";
  }

  /**
   * Format technical notation into HTML subscripts (e.g. hef -> h<sub>ef</sub>, Np,uncr -> N<sub>p,uncr</sub>)
   */
  formatLabelWithSubscripts(label) {
    if (!label) return "";
    if (label.includes("<sub>")) return label;

    return label
      // Compound subscripts with commas (must match first before simpler terms)
      .replace(/\bNp,uncr\b/g, "N<sub>p,uncr</sub>")
      .replace(/\bNp,cr\b/g, "N<sub>p,cr</sub>")
      .replace(/\bNp,eq\b/g, "N<sub>p,eq</sub>")
      .replace(/\bNcb,uncr\b/g, "N<sub>cb,uncr</sub>")
      .replace(/\bNcb,cr\b/g, "N<sub>cb,cr</sub>")
      .replace(/\bVcp,uncr\b/g, "V<sub>cp,uncr</sub>")
      .replace(/\bVcp,cr\b/g, "V<sub>cp,cr</sub>")
      .replace(/\bVsa,eq\b/g, "V<sub>sa,eq</sub>")
      // Simple single-term subscripts
      .replace(/\bhef\b/g, "h<sub>ef</sub>")
      .replace(/\bhnom\b/g, "h<sub>nom</sub>")
      .replace(/\bhhole\b/g, "h<sub>hole</sub>")
      .replace(/\bcmin\b/g, "c<sub>min</sub>")
      .replace(/\bsmin\b/g, "s<sub>min</sub>")
      .replace(/\bhmin\b/g, "h<sub>min</sub>")
      .replace(/\bNsa\b/g, "N<sub>sa</sub>")
      .replace(/\bVsa\b/g, "V<sub>sa</sub>")
      .replace(/\bNcb\b/g, "N<sub>cb</sub>")
      .replace(/\bVcb\b/g, "V<sub>cb</sub>")
      .replace(/\bVcp\b/g, "V<sub>cp</sub>")
      .replace(/\bNp\b/g, "N<sub>p</sub>")
      .replace(/\bkuncr\b/g, "k<sub>uncr</sub>")
      .replace(/\bkcr\b/g, "k<sub>cr</sub>")
      .replace(/\bkcp\b/g, "k<sub>cp</sub>")
      .replace(/\bf'c\b/g, "f'<sub>c</sub>");
  }

  /**
   * Show loading state
   */
  showLoading() {
    this.container.innerHTML = `
      <div class="loading">
        <svg class="inline-block w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-3">Loading product data...</p>
      </div>
    `;
  }

  /**
   * Show error message
   */
  showError(message) {
    this.container.innerHTML = `
      <div class="error">
        <svg class="inline-block w-16 h-16 text-red-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-lg font-semibold">⚠️ ${message}</p>
        <button onclick="location.reload()">Retry</button>
      </div>
    `;
  }

  /**
   * Show empty placeholder when no product is selected
   */
  showEmptyState(message = "Please select a product to view specifications.") {
    this.container.innerHTML = `
      <div class="text-center py-16 text-slate-500 bg-white rounded-xl shadow-sm border border-slate-200">
        <svg class="inline-block w-16 h-16 mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p class="text-lg font-medium text-slate-600">${message}</p>
      </div>
    `;
  }

  /**
   * Render the product data table (transposed view)
   */
  render(data, filter = "", compactMode = false) {
    this.container.innerHTML = "";
    if (!data) {
      this.showError("No data available");
      return;
    }

    if (compactMode) {
      const sampleAnchor = data.anchorSizes?.[0];
      const sampleHef = sampleAnchor?.effectiveEmbedmentDepths?.[0];

      const compactParams = sampleHef
        ? [
          sampleAnchor?.value,
          sampleHef.value,
          sampleHef.drillBitDiameter,
          sampleHef.nominalEmbedmentDepth,
          sampleHef.minimumHoleDepth,
          sampleHef.crackedConcreteData,
          sampleHef.seismicCategories,
          sampleHef.anchorCategory,
          sampleHef.tensionSteelStrength,
          sampleHef.tensionBreakoutUncracked,
          sampleHef.tensionBreakoutCracked,
          sampleHef.pulloutUncracked,
          sampleHef.pulloutCracked,
          sampleHef.shearSteelStrength,
          sampleHef.pryoutUncracked,
          sampleHef.pryoutCracked,
        ].filter(
          (p) =>
            p &&
            p.constructor &&
            p.constructor.name === "Parameter" &&
            p.title,
        )
        : [];

      this.rowMetrics = compactParams.map((p) => ({
        label: p.title,
        key: p.title,
      }));
    } else {
      const dynamicFullMetricsMap = new Map();

      // Collect parameters from AnchorSizes and EffectiveEmbedmentDepths for body rows
      const anchorSizes = data.anchorSizes || [];
      anchorSizes.forEach((a) => {
        if (
          a.value &&
          a.value.constructor &&
          a.value.constructor.name === "Parameter" &&
          a.value.title
        ) {
          if (!dynamicFullMetricsMap.has(a.value.title)) {
            dynamicFullMetricsMap.set(a.value.title, a.value.title);
          }
        }

        const hefs = a.effectiveEmbedmentDepths || [];
        hefs.forEach((h) => {
          Object.values(h).forEach((prop) => {
            if (
              prop &&
              prop.constructor &&
              prop.constructor.name === "Parameter" &&
              prop.title
            ) {
              if (!dynamicFullMetricsMap.has(prop.title)) {
                dynamicFullMetricsMap.set(prop.title, prop.title);
              }
            }
          });
        });
      });

      this.rowMetrics = Array.from(dynamicFullMetricsMap.keys()).map(
        (title) => ({
          label: title,
          key: title,
        }),
      );
    }

    // Title - removed per user request

    // Table wrapper
    const wrapper = document.createElement("div");
    wrapper.className = "table-scroll";

    const table = document.createElement("table");

    // Build columns data (each combination becomes a column)
    const columns = this.buildColumns(data, filter, compactMode);

    // Apply sorting
    if (this.sortColumn !== -1) {
      this.sortColumns(columns);
    }

    // Pagination
    const totalPages = Math.max(1, Math.ceil(columns.length / this.PAGE_SIZE));
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    const start = (this.currentPage - 1) * this.PAGE_SIZE;
    const pagedColumns = columns.slice(start, start + this.PAGE_SIZE);

    // Single tbody — no thead, everything is a plain td row
    const tbody = document.createElement("tbody");

    // ── Group 1: Product Information ─────────────────────────
    const addGroupHeader = (label) => {
      const groupRow = document.createElement("tr");
      groupRow.className = "group-header-row";
      const groupTd = document.createElement("td");
      groupTd.colSpan = pagedColumns.length + 1;
      groupTd.className = "group-header-cell";
      groupTd.textContent = label;
      groupRow.appendChild(groupTd);
      tbody.appendChild(groupRow);
    };

    const addInfoRow = (title, field) => {
      const row = document.createElement("tr");
      const labelTd = document.createElement("td");
      labelTd.textContent = title;
      labelTd.className = "metric-header metric-label";
      row.appendChild(labelTd);
      this.groupByField(pagedColumns, field).forEach((group) => {
        const td = document.createElement("td");
        td.textContent = group.value || "-";
        td.colSpan = group.count;
        row.appendChild(td);
      });
      tbody.appendChild(row);
    };

    addGroupHeader("Product Information");
    addInfoRow(data.company.title, "company");
    addInfoRow(data.name.title, "product");
    addInfoRow(data.material.title, "material");
    addInfoRow(data.evaluationReport.title, "evaluationReport");
    addInfoRow(data.dateIssued.title, "dateIssued");
    addInfoRow(data.dateExpires.title, "dateExpires");

    // ── Groups 2+: metric sections (General, Tension, Shear …) ──
    const categoriesMap = new Map();
    this.rowMetrics.forEach((metric, metricIdx) => {
      const cat = this.getMetricCategory(metric.label);
      if (!categoriesMap.has(cat)) categoriesMap.set(cat, []);
      categoriesMap.get(cat).push({ metric, metricIdx });
    });

    categoriesMap.forEach((items, categoryName) => {
      addGroupHeader(categoryName);

      items.forEach(({ metric, metricIdx }) => {
        const row = document.createElement("tr");

        const metricKeyLower = (metric.key || metric.label || "").toLowerCase();
        if (metricKeyLower.includes("anchor size")) {
          row.classList.add("frozen-row-1");
        } else if (metricKeyLower.includes("effective embedment depth")) {
          row.classList.add("frozen-row-2");
        }

        // First column — metric label
        const labelTd = document.createElement("td");
        labelTd.innerHTML = this.formatLabelWithSubscripts(metric.label);
        labelTd.className = "metric-header metric-label";
        labelTd.style.cursor = "pointer";
        labelTd.title = "Click to sort columns by this metric";
        if (this.sortColumn === metricIdx) {
          labelTd.innerHTML += this.sortAscending ? " ▲" : " ▼";
        }
        labelTd.addEventListener("click", () => this.onSort(metricIdx));
        row.appendChild(labelTd);

        // Data cells (merge adjacent for Head Type)
        const isHeadType =
          metric.key && metric.key.toLowerCase().includes("head type");
        if (isHeadType) {
          const groups = this.groupByMetricValue(pagedColumns, metric.key);
          groups.forEach((group) => {
            const td = document.createElement("td");
            const plainLabel = metric.label.replace(/<[^>]*>/g, "");
            td.setAttribute("data-label", plainLabel);
            td.textContent = group.value || "-";
            if (group.count > 1) td.colSpan = group.count;
            row.appendChild(td);
          });
        } else {
          pagedColumns.forEach((col) => {
            const td = document.createElement("td");
            const plainLabel = metric.label.replace(/<[^>]*>/g, "");
            td.setAttribute("data-label", plainLabel);
            td.textContent = col.values[metric.key] || "-";
            row.appendChild(td);
          });
        }

        tbody.appendChild(row);
      });
    });

    table.appendChild(tbody);

    // Column count - removed per user request
    wrapper.appendChild(table);
    this.container.appendChild(wrapper);

    // Measure frozen row 1 height to align frozen row 2 perfectly beneath it
    requestAnimationFrame(() => {
      const row1 = table.querySelector(".frozen-row-1");
      if (row1) {
        const h = row1.offsetHeight;
        if (h > 0) {
          table.style.setProperty("--frozen-row-1-height", `${h}px`);
        }
      }
    });

    // Pagination controls
    if (columns.length > this.PAGE_SIZE) {
      this.renderPagination(totalPages);
    }

    // Re-apply in-table search if active
    if (this.searchTerm) {
      this.findMatches(this.searchTerm, false);
    }
  }

  /**
   * Extract data into a flat array of columns
   */
  buildColumns(data, filter, compactMode) {
    const columns = [];
    const normalizedFilter = this.model.normalizeKey(filter);
    const company = data.company?.value || data.company || "Unknown";
    const product = data.name?.value || data.name || "Unknown";
    const material = data.material?.value || data.material || "-";
    const anchorType = data.anchorType?.value || data.anchorType || "-";
    const evaluationReport =
      data.evaluationReport?.value || data.evaluationReport || "-";
    const dateIssued = data.dateIssued?.value || data.dateIssued || "-";
    const dateExpires = data.dateExpires?.value || data.dateExpires || "-";

    const anchorSizes = data.anchorSizes || [];

    anchorSizes.forEach((a) => {
      const anchorSize = a.value || "n/a";
      const drillBit = a.drillBitDiameter?.value || "-";
      const hefs = a.effectiveEmbedmentDepths || [];

      hefs.forEach((h) => {
        let values = {};

        const paramLookup = new Map();

        // Product parameters
        Object.values(data).forEach((prop) => {
          if (
            prop &&
            prop.constructor &&
            prop.constructor.name === "Parameter" &&
            prop.title
          ) {
            paramLookup.set(prop.title, prop.value);
          }
        });

        // AnchorSize parameter
        if (
          a.value &&
          a.value.constructor &&
          a.value.constructor.name === "Parameter" &&
          a.value.title
        ) {
          paramLookup.set(a.value.title, a.value.value);
        }

        // EffectiveEmbedmentDepth parameters
        Object.values(h).forEach((prop) => {
          if (
            prop &&
            prop.constructor &&
            prop.constructor.name === "Parameter" &&
            prop.title
          ) {
            paramLookup.set(prop.title, prop.value);
          }
        });

        this.rowMetrics.forEach((metric) => {
          let rawVal = paramLookup.get(metric.label);
          if (typeof rawVal === "boolean") {
            rawVal = rawVal ? "yes" : "no";
          }

          if (rawVal === null || rawVal === undefined) {
            rawVal = "-";
          }

          values[metric.key] =
            typeof rawVal === "number" ||
              (!isNaN(rawVal) &&
                rawVal !== "-" &&
                rawVal !== "yes" &&
                rawVal !== "no" &&
                String(rawVal).trim() !== "")
              ? this.model.formatNumber(rawVal)
              : rawVal;
        });

        // Filter check - search across all values
        if (normalizedFilter) {
          const columnText = this.model.normalizeKey(
            company +
            " " +
            product +
            " " +
            material +
            " " +
            anchorType +
            " " +
            evaluationReport +
            " " +
            dateIssued +
            " " +
            dateExpires +
            " " +
            Object.values(values).join(" "),
          );
          if (!columnText.includes(normalizedFilter)) return;
        }

        columns.push({
          company: company,
          product: product,
          material: material,
          anchorType: anchorType,
          evaluationReport: evaluationReport,
          dateIssued: dateIssued,
          dateExpires: dateExpires,
          values: values,
        });
      });
    });

    return columns;
  }

  /**
   * Sort columns by column index
   */
  sortColumns(columns) {
    columns.sort((a, b) => {
      const metricKey = this.rowMetrics[this.sortColumn]?.key;
      if (!metricKey) return 0;

      const aVal = a.values[metricKey] || "";
      const bVal = b.values[metricKey] || "";
      const aNum = parseFloat(String(aVal).replace(/,/g, ""));
      const bNum = parseFloat(String(bVal).replace(/,/g, ""));

      let comparison = 0;
      if (!isNaN(aNum) && !isNaN(bNum)) {
        comparison = aNum - bNum;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }
      return this.sortAscending ? comparison : -comparison;
    });
  }

  /**
   * Group consecutive columns by field value (for colspan in headers)
   */
  groupByField(columns, fieldName) {
    if (!columns || columns.length === 0) return [];

    const groups = [];
    let currentValue = columns[0][fieldName];
    let count = 1;

    for (let i = 1; i < columns.length; i++) {
      if (columns[i][fieldName] === currentValue) {
        count++;
      } else {
        groups.push({ value: currentValue, count: count });
        currentValue = columns[i][fieldName];
        count = 1;
      }
    }

    // Push the last group
    groups.push({ value: currentValue, count: count });

    return groups;
  }

  /**
   * Group consecutive columns by values[metricKey] (for colspan merging in body rows)
   */
  groupByMetricValue(columns, metricKey) {
    if (!columns || columns.length === 0) return [];

    const groups = [];
    let currentValue = columns[0].values?.[metricKey];
    let count = 1;

    for (let i = 1; i < columns.length; i++) {
      const val = columns[i].values?.[metricKey];
      if (val === currentValue) {
        count++;
      } else {
        groups.push({ value: currentValue, count: count });
        currentValue = val;
        count = 1;
      }
    }

    groups.push({ value: currentValue, count: count });
    return groups;
  }

  /**
   * Render pagination controls
   */
  renderPagination(totalPages) {
    const existingBar = this.container.querySelector(".pagination");
    if (existingBar) existingBar.remove();

    const paginationEl = document.createElement("div");
    paginationEl.className = "pagination";

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "Prev";
    prevBtn.disabled = this.currentPage <= 1;

    const info = document.createElement("span");
    info.textContent = `${this.currentPage} / ${totalPages}`;

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next";
    nextBtn.disabled = this.currentPage >= totalPages;

    prevBtn.addEventListener("click", () => this.onPrevPage());
    nextBtn.addEventListener("click", () => this.onNextPage());

    paginationEl.appendChild(prevBtn);
    paginationEl.appendChild(info);
    paginationEl.appendChild(nextBtn);
    this.container.appendChild(paginationEl);
  }

  /**
   * Reset sorting
   */
  resetSort() {
    this.sortColumn = -1;
    this.sortAscending = true;
  }

  /**
   * Reset page
   */
  resetPage() {
    this.currentPage = 1;
  }

  // Event handlers (to be connected by controller)
  onSort(columnIndex) {
    // Placeholder - will be set by controller
  }

  onPrevPage() {
    // Placeholder - will be set by controller
  }

  onNextPage() {
    // Placeholder - will be set by controller
  }

  /**
   * Search across both row header and value cells in all rows
   */
  findMatches(searchTerm, resetIndex = true) {
    this.searchTerm = (searchTerm || "").trim().toLowerCase();
    this.matches = [];
    this.clearSearchHighlights();

    if (!this.searchTerm) {
      this.currentMatchIndex = -1;
      if (this.onSearchMatchChange) {
        this.onSearchMatchChange({ current: 0, total: 0, query: "" });
      }
      return;
    }

    const rows = this.container.querySelectorAll("tbody tr:not(.group-header-row)");
    rows.forEach((row) => {
      const cells = Array.from(row.querySelectorAll("td"));
      const matchingCells = [];

      cells.forEach((cell) => {
        const text = (cell.textContent || "").toLowerCase();
        if (text.includes(this.searchTerm)) {
          matchingCells.push(cell);
        }
      });

      if (matchingCells.length > 0) {
        row.classList.add("search-match-row");
        this.matches.push({ row, matchingCells });
      }
    });

    if (this.matches.length > 0) {
      const targetIndex = resetIndex
        ? 0
        : Math.min(Math.max(0, this.currentMatchIndex), this.matches.length - 1);
      this.goToMatch(targetIndex);
    } else {
      this.currentMatchIndex = -1;
      if (this.onSearchMatchChange) {
        this.onSearchMatchChange({ current: 0, total: 0, query: this.searchTerm });
      }
    }
  }

  /**
   * Cycle to a specific match index and scroll into view smoothly
   */
  goToMatch(index) {
    if (this.matches.length === 0) return;

    // Remove active highlight from previous match
    if (this.currentMatchIndex >= 0 && this.matches[this.currentMatchIndex]) {
      const prev = this.matches[this.currentMatchIndex];
      prev.row.classList.remove("search-match-active", "search-match-flash");
      prev.matchingCells.forEach((c) =>
        c.classList.remove("search-match-cell", "search-match-cell-flash"),
      );
    }

    // Wrap around index for cycling
    this.currentMatchIndex = (index + this.matches.length) % this.matches.length;
    const current = this.matches[this.currentMatchIndex];

    // Add persistent active highlight to row and matching cells
    current.row.classList.add("search-match-active");
    current.matchingCells.forEach((c) => c.classList.add("search-match-cell"));

    // Add temporary pulse highlight class (reflow ensures animation restarts on each navigation)
    current.row.classList.remove("search-match-flash");
    void current.row.offsetWidth;
    current.row.classList.add("search-match-flash");

    current.matchingCells.forEach((c) => {
      c.classList.remove("search-match-cell-flash");
      void c.offsetWidth;
      c.classList.add("search-match-cell-flash");
    });

    if (this.flashTimeout) clearTimeout(this.flashTimeout);
    this.flashTimeout = setTimeout(() => {
      current.row.classList.remove("search-match-flash");
      current.matchingCells.forEach((c) =>
        c.classList.remove("search-match-cell-flash"),
      );
    }, 3000);

    // Play subtle chime sound feedback on jump
    this.playJumpSound();

    // Scroll smoothly into view
    current.row.scrollIntoView({ behavior: "smooth", block: "center" });

    // If there is a matching data cell that might be horizontally scrolled out, ensure horizontal visibility
    const valueCell = current.matchingCells.find(
      (c) => !c.classList.contains("metric-label"),
    );
    if (valueCell) {
      valueCell.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }

    if (this.onSearchMatchChange) {
      this.onSearchMatchChange({
        current: this.currentMatchIndex + 1,
        total: this.matches.length,
        query: this.searchTerm,
      });
    }
  }

  /**
   * Go to next match
   */
  nextMatch() {
    if (this.matches.length === 0) return;
    this.goToMatch(this.currentMatchIndex + 1);
  }

  /**
   * Go to previous match
   */
  prevMatch() {
    if (this.matches.length === 0) return;
    this.goToMatch(this.currentMatchIndex - 1);
  }

  /**
   * Remove all search highlight classes
   */
  clearSearchHighlights() {
    if (this.flashTimeout) {
      clearTimeout(this.flashTimeout);
      this.flashTimeout = null;
    }

    const activeRows = this.container.querySelectorAll(
      ".search-match-row, .search-match-active, .search-match-flash",
    );
    activeRows.forEach((r) =>
      r.classList.remove(
        "search-match-row",
        "search-match-active",
        "search-match-flash",
      ),
    );

    const activeCells = this.container.querySelectorAll(
      ".search-match-cell, .search-match-cell-flash",
    );
    activeCells.forEach((c) =>
      c.classList.remove("search-match-cell", "search-match-cell-flash"),
    );
  }

  /**
   * Reset search state and highlights
   */
  clearSearch() {
    this.searchTerm = "";
    this.matches = [];
    this.currentMatchIndex = -1;
    this.clearSearchHighlights();
    if (this.onSearchMatchChange) {
      this.onSearchMatchChange({ current: 0, total: 0, query: "" });
    }
  }

  /**
   * Play subtle, clean chime audio feedback when jumping to a search match
   */
  playJumpSound() {
    if (!this.soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      // Soft water-drop / chime sine wave (520Hz -> 780Hz)
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);

      // Gentle non-intrusive exponential volume envelope
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {
      // Audio playback silently ignored if browser denies audio
    }
  }

  /**
   * Toggle search audio feedback on/off
   */
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }
}
