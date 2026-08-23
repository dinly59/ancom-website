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
            sampleHef.drillBitDiameter,
            sampleHef.value,
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
    const thead = document.createElement("thead");

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

    // Detailed manual rendering of exact 7 header rows in specified order:
    // 1. Manufacturer Name
    const row1 = document.createElement("tr");
    const labelTd1 = document.createElement("td");
    labelTd1.textContent = data.company.title;
    labelTd1.className = "metric-header metric-label";
    labelTd1.style.fontWeight = "bold";
    row1.appendChild(labelTd1);

    this.groupByField(pagedColumns, "company").forEach((group) => {
      const td = document.createElement("td");
      td.textContent = group.value || "-";
      td.colSpan = group.count;
      row1.appendChild(td);
    });
    thead.appendChild(row1);

    // 2. Product
    const row2 = document.createElement("tr");
    const labelTd2 = document.createElement("td");
    labelTd2.textContent = data.name.title;
    labelTd2.className = "metric-header metric-label";
    labelTd2.style.fontWeight = "bold";
    row2.appendChild(labelTd2);

    this.groupByField(pagedColumns, "product").forEach((group) => {
      const td = document.createElement("td");
      td.textContent = group.value || "-";
      td.colSpan = group.count;
      row2.appendChild(td);
    });
    thead.appendChild(row2);

    // 3. Material
    const row3 = document.createElement("tr");
    const labelTd3 = document.createElement("td");
    labelTd3.textContent = data.material.title;
    labelTd3.className = "metric-header metric-label";
    labelTd3.style.fontWeight = "bold";
    row3.appendChild(labelTd3);

    this.groupByField(pagedColumns, "material").forEach((group) => {
      const td = document.createElement("td");
      td.textContent = group.value || "-";
      td.colSpan = group.count;
      row3.appendChild(td);
    });
    thead.appendChild(row3);

    // 4. Product Image
    const row4 = document.createElement("tr");
    const labelTd4 = document.createElement("td");
    labelTd4.textContent = data.productImage.title;
    labelTd4.className = "metric-header metric-label";
    labelTd4.style.fontWeight = "bold";
    row4.appendChild(labelTd4);

    this.groupByField(pagedColumns, "productImage").forEach((group) => {
      const td = document.createElement("td");
      if (group.value && group.value !== "-") {
        const img = document.createElement("img");
        img.src = group.value;
        img.alt = "Product Image";
        img.className = "h-12 object-contain mx-auto";
        td.appendChild(img);
      } else {
        td.textContent = "-";
      }
      td.colSpan = group.count;
      row4.appendChild(td);
    });
    thead.appendChild(row4);

    // 5. Evaluation Report
    const row5 = document.createElement("tr");
    const labelTd5 = document.createElement("td");
    labelTd5.textContent = data.evaluationReport.title;
    labelTd5.className = "metric-header metric-label";
    labelTd5.style.fontWeight = "bold";
    row5.appendChild(labelTd5);

    this.groupByField(pagedColumns, "evaluationReport").forEach((group) => {
      const td = document.createElement("td");
      td.textContent = group.value || "-";
      td.colSpan = group.count;
      row5.appendChild(td);
    });
    thead.appendChild(row5);

    // 6. Date Issued or Renewed
    const row6 = document.createElement("tr");
    const labelTd6 = document.createElement("td");
    labelTd6.textContent = data.dateIssued.title;
    labelTd6.className = "metric-header metric-label";
    labelTd6.style.fontWeight = "bold";
    row6.appendChild(labelTd6);

    this.groupByField(pagedColumns, "dateIssued").forEach((group) => {
      const td = document.createElement("td");
      td.textContent = group.value || "-";
      td.colSpan = group.count;
      row6.appendChild(td);
    });
    thead.appendChild(row6);

    // 7. Date Expires
    const row7 = document.createElement("tr");
    const labelTd7 = document.createElement("td");
    labelTd7.textContent = data.dateExpires.title;
    labelTd7.className = "metric-header metric-label";
    labelTd7.style.fontWeight = "bold";
    row7.appendChild(labelTd7);

    this.groupByField(pagedColumns, "dateExpires").forEach((group) => {
      const td = document.createElement("td");
      td.textContent = group.value || "-";
      td.colSpan = group.count;
      row7.appendChild(td);
    });
    thead.appendChild(row7);

    table.appendChild(thead);

    // Body - each row is a metric
    const tbody = document.createElement("tbody");
    this.rowMetrics.forEach((metric, metricIdx) => {
      const row = document.createElement("tr");

      // Metric label (first column)
      const labelTd = document.createElement("td");
      labelTd.innerHTML = metric.label;
      labelTd.className = "metric-header metric-label";
      labelTd.style.fontWeight = "bold";
      labelTd.style.cursor = "pointer";
      labelTd.title = "Click to sort columns by this metric";
      if (this.sortColumn === metricIdx) {
        labelTd.innerHTML += this.sortAscending ? " ▲" : " ▼";
      }
      labelTd.addEventListener("click", () => this.onSort(metricIdx));
      row.appendChild(labelTd);

      // Data cells for each column
      pagedColumns.forEach((col) => {
        const td = document.createElement("td");
        // Use plain text for data-label (remove HTML tags)
        const plainLabel = metric.label.replace(/<[^>]*>/g, "");
        td.setAttribute("data-label", plainLabel);
        td.textContent = col.values[metric.key] || "-";
        row.appendChild(td);
      });

      tbody.appendChild(row);
    });
    table.appendChild(tbody);

    // Column count - removed per user request
    wrapper.appendChild(table);
    this.container.appendChild(wrapper);

    // Pagination controls
    if (columns.length > this.PAGE_SIZE) {
      this.renderPagination(totalPages);
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
    const productImage = data.productImage?.value || data.productImage || "-";
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
          productImage: productImage,
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
}
