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

      // Collect parameters from Product (data), excluding Manufacturer Name and Product which are displayed in the header
      Object.values(data).forEach((prop) => {
        if (
          prop &&
          prop.constructor &&
          prop.constructor.name === "Parameter" &&
          prop.title &&
          prop.title !== "Manufacturer Name" &&
          prop.title !== "Product"
        ) {
          if (!dynamicFullMetricsMap.has(prop.title)) {
            dynamicFullMetricsMap.set(prop.title, prop.title);
          }
        }
      });

      // Collect parameters from AnchorSizes and EffectiveEmbedmentDepths
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

    // Header row 1: Company names with colspan
    const companyRow = document.createElement("tr");
    const emptyTh1 = document.createElement("th");
    emptyTh1.textContent = "Manufacturer Name";
    emptyTh1.className = "metric-header";
    companyRow.appendChild(emptyTh1);

    // Group consecutive columns by company
    const companyGroups = this.groupByField(pagedColumns, "company");
    companyGroups.forEach((group) => {
      const th = document.createElement("th");
      th.textContent = group.value || "N/A";
      th.colSpan = group.count;
      companyRow.appendChild(th);
    });
    thead.appendChild(companyRow);

    // Header row 2: Product names with colspan
    const productRow = document.createElement("tr");
    const emptyTh2 = document.createElement("th");
    emptyTh2.textContent = "Product";
    emptyTh2.className = "metric-header";
    productRow.appendChild(emptyTh2);

    // Group consecutive columns by product
    const productGroups = this.groupByField(pagedColumns, "product");
    productGroups.forEach((group) => {
      const th = document.createElement("th");
      th.textContent = group.value || "N/A";
      th.colSpan = group.count;
      productRow.appendChild(th);
    });
    thead.appendChild(productRow);
    table.appendChild(thead);

    // Body - each row is a metric
    const tbody = document.createElement("tbody");
    this.rowMetrics.forEach((metric, metricIdx) => {
      const row = document.createElement("tr");

      // Metric label (first column) - clickable for sorting
      const labelTd = document.createElement("td");
      labelTd.innerHTML = metric.label;
      labelTd.className = "metric-label";
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
            company + " " + product + " " + Object.values(values).join(" "),
          );
          if (!columnText.includes(normalizedFilter)) return;
        }

        columns.push({
          company: company,
          product: product,
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
