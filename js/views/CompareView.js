/**
 * CompareView - Handles product comparison visualization
 */
class CompareView {
  constructor(model) {
    this.model = model;
    this.container = document.getElementById("compareContainer");
    this.colors = ["#DF4907", "#0F172A", "#F59E0B", "#94A3B8", "#22C55E"];
    this.bindPrintReflow();
  }

  /**
   * Highcharts measures the container in pixels once at creation and won't shrink that
   * fixed SVG width on its own for the narrower print page. Reflow on "beforeprint" (and
   * via matchMedia as a fallback) so each chart re-measures against the print layout.
   * Bound once per page load since every CompareView instance shares the same window.
   */
  bindPrintReflow() {
    if (CompareView.__printReflowBound) return;
    CompareView.__printReflowBound = true;

    const reflowCharts = () => {
      (window.Highcharts?.charts || []).forEach((chart) => chart && chart.reflow());
    };
    window.addEventListener("beforeprint", reflowCharts);
    if (window.matchMedia) {
      window.matchMedia("print").addEventListener("change", (e) => {
        if (e.matches) reflowCharts();
      });
    }
  }

  /**
   * Show loading state
   */
  showLoading() {
    this.container.innerHTML = `
      <div class="text-center py-16 text-slate-500 animate-pulse">
        <svg class="inline-block w-8 h-8 text-[#DF4907] animate-spin mb-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-lg">Loading comparison...</p>
      </div>
    `;
  }

  /**
   * Show error message
   */
  showError(message) {
    this.container.innerHTML = `
      <div class="text-center py-16 text-red-600">
        <svg class="inline-block w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-lg font-semibold">${message}</p>
      </div>
    `;
  }

  /**
   * Render comparison view
   */
  /**
   * Render comparison view
   * @param {Array} productsData
   * @param {string} concreteState
   * @param {Object} chartData - { tension: {datasets, xLabels, groups}, shear: {datasets, xLabels, groups} }
   */
  render(productsData, concreteState, chartData) {
    this.container.innerHTML = "";

    // Print-only header + watermark; hidden on screen, shown via @media print.
    this.container.appendChild(this.buildPrintReportHeader());
    this.container.appendChild(this.buildPrintWatermark());

    // Export/Print toolbar (hidden when printing)
    this.container.appendChild(this.buildExportToolbar());

    // Overview section (with integrated concrete state)
    this.renderOverview(productsData, concreteState);

    // Charts section (if chartData provided)
    if (chartData && chartData.tension && chartData.shear) {
      this.renderChartsSection(chartData);
    }
  }

  /**
   * Print-only header shown at the top of the printed/exported report.
   * Populated with the preparer's name right before printing.
   */
  buildPrintReportHeader() {
    const header = document.createElement("div");
    header.className = "print-report-header";
    header.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <div style="font-size:18px; font-weight:800; color:#0f172a;">Anchor Size Specifications Comparison</div>
          <div style="font-size:11px; color:#9a3412; font-weight:700; letter-spacing:0.08em; text-transform:uppercase;">Internal Only &mdash; Do Not Distribute</div>
        </div>
        <div style="text-align:right; font-size:11px; color:#475569;">
          <div>Generated: <span class="print-report-date">-</span></div>
          <div>Prepared by: <span class="print-report-preparer">-</span></div>
        </div>
      </div>
    `;
    return header;
  }

  /**
   * Single centered diagonal "INTERNAL ONLY" watermark; repeats once per printed
   * page because it's position:fixed, not because the markup itself is tiled.
   */
  buildPrintWatermark() {
    const watermark = document.createElement("div");
    watermark.className = "print-watermark";
    const label = document.createElement("span");
    label.textContent = "Simpson Strong‑Tie";
    watermark.appendChild(label);
    return watermark;
  }

  /**
   * Toolbar with the Export/Print entry point (hidden in the printed output).
   */
  buildExportToolbar() {
    const toolbar = document.createElement("div");
    toolbar.className = "no-print flex justify-end mb-4";

    const printBtn = document.createElement("button");
    printBtn.type = "button";
    printBtn.className =
      "inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold text-sm transition-colors";
    printBtn.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m0 0v4a1 1 0 001 1h8a1 1 0 001-1v-4m-10 0h10M7 9V4a1 1 0 011-1h8a1 1 0 011 1v5" />
      </svg>
      Export / Print Report
    `;
    printBtn.addEventListener("click", () => this.openExportModal());

    toolbar.appendChild(printBtn);
    return toolbar;
  }

  /**
   * Small modal asking for an optional preparer name, then triggers window.print().
   * There is no sign-in system yet, so the name is entered manually rather than pulled
   * from an authenticated session.
   */
  openExportModal() {
    const savedName = localStorage.getItem("ancom_report_preparer") || "";

    const overlay = document.createElement("div");
    overlay.className =
      "no-print fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50";
    overlay.innerHTML = `
      <div class="bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-full max-w-sm">
        <h3 class="text-lg font-bold text-slate-800 mb-1">Export / Print Report</h3>
        <p class="text-sm text-slate-500 mb-4">This report is for internal use only. Enter your name so it's recorded on the printed copy.</p>
        <label class="block text-sm font-semibold text-slate-700 mb-2">Prepared by (optional)</label>
        <input type="text" class="export-preparer-input w-full px-3 py-2 border border-slate-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#DF4907]" placeholder="Your name" value="${savedName.replace(/"/g, "&quot;")}" />
        <div class="flex justify-end gap-2">
          <button type="button" class="export-cancel-btn px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium">Cancel</button>
          <button type="button" class="export-confirm-btn px-4 py-2 rounded-lg bg-[#DF4907] hover:bg-[#c23f06] text-white font-semibold">Print</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const input = overlay.querySelector(".export-preparer-input");
    input.focus();

    const close = () => overlay.remove();
    overlay.querySelector(".export-cancel-btn").addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    overlay.querySelector(".export-confirm-btn").addEventListener("click", () => {
      const preparer = input.value.trim();
      localStorage.setItem("ancom_report_preparer", preparer);
      close();
      this.printReport(preparer);
    });
  }

  /**
   * Stamps the print header with the preparer name/timestamp, then opens the browser print dialog.
   */
  printReport(preparer) {
    const dateEl = this.container.querySelector(".print-report-date");
    const preparerEl = this.container.querySelector(".print-report-preparer");
    if (dateEl) dateEl.textContent = new Date().toLocaleString();
    if (preparerEl) preparerEl.textContent = preparer || "Not specified";

    // Defensive reflow in case "beforeprint" fires too late in this browser;
    // the real fix is the bindPrintReflow() listener re-measuring at print time.
    (window.Highcharts?.charts || []).forEach((chart) => chart && chart.reflow());
    window.print();
  }

  /**
   * Render overview table
   */
  renderOverview(productsData, concreteState) {
    const overviewSection = document.createElement("div");
    overviewSection.className =
      "bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden";

    const cardHeader = document.createElement("div");
    cardHeader.className =
      "px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex flex-wrap items-center justify-between gap-3";

    const title = document.createElement("h2");
    title.className =
      "text-xl sm:text-2xl font-bold text-slate-800 tracking-tight";
    title.textContent = "Product Comparison Overview";
    cardHeader.appendChild(title);

    if (concreteState) {
      const stateName =
        concreteState.charAt(0).toUpperCase() + concreteState.slice(1);
      const stateBadge = document.createElement("div");
      stateBadge.className =
        "inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl shadow-xs";
      stateBadge.innerHTML = `
        <span class="text-sm font-semibold text-slate-600">Concrete State:</span>
        <span class="px-2.5 py-1 rounded-lg bg-[#ffb3c6] text-slate-900 text-sm font-extrabold uppercase tracking-wider shadow-2xs">${stateName}</span>
      `;
      cardHeader.appendChild(stateBadge);
    }

    overviewSection.appendChild(cardHeader);

    const wrapper = document.createElement("div");
    wrapper.className = "overflow-x-auto";

    const table = document.createElement("table");
    table.className = "w-full border-collapse";

    // Header
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const th1 = document.createElement("th");
    th1.className =
      "px-4 py-3 text-left text-xs font-semibold text-slate-700 bg-slate-100 border-b-2 border-slate-300 uppercase sticky left-0";
    th1.textContent = "Specification";
    headerRow.appendChild(th1);

    productsData.forEach((data) => {
      const th = document.createElement("th");
      th.className =
        "px-4 py-3 text-left text-xs font-semibold text-slate-700 bg-slate-100 border-b-2 border-slate-300 uppercase";
      th.textContent = data.name?.value || data.name || "Product";
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement("tbody");

    // Company row
    this.addOverviewRow(
      tbody,
      "Company",
      productsData,
      (data) => data.company?.value || data.company || "-",
    );

    // Anchor size count row
    this.addOverviewRow(
      tbody,
      "Available Sizes",
      productsData,
      (data) => (data.anchorSizes?.length || 0) + " sizes",
    );

    // Type of Anchor row
    this.addOverviewRow(
      tbody,
      "Type of Anchor",
      productsData,
      (data) => data.anchorType?.value || "-",
    );

    table.appendChild(tbody);
    wrapper.appendChild(table);
    overviewSection.appendChild(wrapper);
    this.container.appendChild(overviewSection);
  }

  /**
   * Add a row to overview table
   */
  addOverviewRow(tbody, label, productsData, valueFn) {
    const row = document.createElement("tr");
    const labelCell = document.createElement("td");
    labelCell.className =
      "px-4 py-3 text-sm font-semibold text-slate-700 bg-slate-50 border-b border-slate-200 sticky left-0";
    labelCell.textContent = label;
    row.appendChild(labelCell);

    productsData.forEach((data) => {
      const td = document.createElement("td");
      td.className =
        "px-4 py-3 text-sm text-slate-700 border-b border-slate-200";
      td.textContent = valueFn(data);
      row.appendChild(td);
    });

    tbody.appendChild(row);
  }

  /**
   * Render charts section
   */
  /**
   * Render charts section using precomputed chartData
   */
  renderChartsSection(chartData) {
    const chartsSection = document.createElement("div");
    chartsSection.className =
      "bg-white rounded-xl shadow-md border border-slate-200 p-6";

    const chartTitle = document.createElement("h2");
    chartTitle.className = "text-2xl font-bold text-slate-800 mb-4";
    chartTitle.textContent = "Anchor Size Specifications Comparison";
    chartsSection.appendChild(chartTitle);

    // Plain block stacking (not grid/flex) so print's `break-inside: avoid`
    // on each chart card is actually honored by Chromium's page fragmentation.
    const chartsGrid = document.createElement("div");
    chartsGrid.className = "space-y-6";

    // Tension chart
    const tensionChartDiv = this.createChartContainer(
      "tensionChart",
      "Tension Strength",
    );
    chartsGrid.appendChild(tensionChartDiv);

    // Shear chart
    const shearChartDiv = this.createChartContainer(
      "shearChart",
      "Shear Strength",
    );
    chartsGrid.appendChild(shearChartDiv);

    chartsSection.appendChild(chartsGrid);
    this.container.appendChild(chartsSection);

    // Render charts after DOM update
    setTimeout(() => {
      this.renderCharts(chartData);
    }, 100);
  }

  /**
   * Create chart container
   */
  createChartContainer(id, title) {
    const div = document.createElement("div");
    div.className =
      "chart-print-card bg-white p-6 rounded-xl border border-slate-100 shadow-sm transition-shadow hover:shadow-md";

    const titleEl = document.createElement("h3");
    titleEl.className = "text-xl font-bold text-slate-800 mb-4 text-center";
    titleEl.innerHTML = title;
    div.appendChild(titleEl);

    const chartDiv = document.createElement("div");
    chartDiv.id = id;
    chartDiv.style.height = "450px";
    div.appendChild(chartDiv);

    return div;
  }

  /**
   * Render charts using precomputed chartData (Highcharts grouped categories)
   */
  renderCharts(chartData) {
    this.renderHighchart(
      "tensionChart",
      chartData.tension.flatCategories,
      chartData.tension.groups,
      chartData.tension.series,
      "Tension Strength (lbs)",
    );
    this.renderHighchart(
      "shearChart",
      chartData.shear.flatCategories,
      chartData.shear.groups,
      chartData.shear.series,
      "Shear Strength (lbs)",
    );
  }

  /**
   * Render a Highcharts column chart with uniform hef spacing.
   * All hef values are flat x-positions (equal width) so spacing is
   * identical across the whole chart. Diameter groups are shown via
   * alternating plotBands and dashed plotLines between them.
   */
  renderHighchart(containerId, flatCategories, groups, series, yTitle) {
    const el = document.getElementById(containerId);
    if (!el || !window.Highcharts) return;

    // Alternating subtle background bands per diameter group
    const bandColors = ["rgba(223,73,7,0.045)", "rgba(148,163,184,0.07)"];
    const plotBands = groups.map((g, i) => ({
      from: g.startIndex - 0.5,
      to: g.endIndex + 0.5,
      color: bandColors[i % bandColors.length],
      label: {
        text: `Ø ${g.size}`,
        align: "center",
        verticalAlign: "bottom",
        y: 45,
        style: { fontWeight: "bold", fontSize: "12px", color: "#334155" },
      },
    }));

    // Dashed separator lines between groups
    const plotLines = groups.slice(0, -1).map((g) => ({
      value: g.endIndex + 0.5,
      color: "#94a3b8",
      width: 1,
      dashStyle: "Dash",
      zIndex: 4,
    }));

    // Product legend items (id-less proxy series) toggle an isolate/ghost view:
    // clicking a product highlights its bars solid and turns the other product's
    // bars into a dashed outline; clicking the same item again restores both.
    // Hovering a bar fades out bars belonging to the other product/color so a
    // single product's bars can be tracked across the whole chart.
    const applyProductHighlight = (chart) => {
      const selected = chart.__selectedProduct;
      const hovered = chart.__hoveredProduct;
      ["__background", "__foreground"].forEach((id) => {
        const layer = chart.get(id);
        if (!layer) return;
        layer.points.forEach((point) => {
          if (!point.graphic || point.y == null) return;
          const origName = point.custom?.origName;
          const isDimmed = selected && origName !== selected;
          const isFaded = hovered && origName !== hovered;
          point.graphic.attr(
            isDimmed
              ? {
                fill: "none",
                stroke: point.color,


              }
              : {
                fill: point.color,
                stroke: "none",
                "stroke-width": 0,
                "stroke-dasharray": "none",
              },
          );
          point.graphic.attr({ opacity: isFaded ? 0.25 : 1 });
        });
      });
    };

    series.forEach((s) => {
      if (s.id) return; // background/foreground render layers, not legend items
      s.events = {
        legendItemClick: function (e) {
          e.preventDefault();
          const chart = this.chart;
          chart.__selectedProduct =
            chart.__selectedProduct === this.name ? null : this.name;
          // Only the NOT-selected product's legend label gets the dash; never the picked one.
          chart.series.forEach((series2) => {
            if (series2.id) return;
            if (series2.visible === false) series2.setVisible(true, false);
            const legendGroup =
              series2.legendGroup || series2.legendItem?.group;
            if (!legendGroup) return;
            const isOther =
              chart.__selectedProduct && series2.name !== chart.__selectedProduct;
            legendGroup.css({
              opacity: isOther ? 0.45 : 1,
              textDecoration: isOther ? "line-through" : "none",
            });
          });
          applyProductHighlight(chart);
          return false;
        },
      };
    });

    const renderRowLabels = (chart) => {
      if (chart.__hefRowLabel) {
        chart.__hefRowLabel.destroy();
        chart.__hefRowLabel = null;
      }

      if (!flatCategories || flatCategories.length === 0) return;

      const yBottom = chart.plotTop + chart.plotHeight;
      const labelX = chart.plotLeft + chart.plotWidth + 10;

      chart.__hefRowLabel = chart.renderer
        .text('h<sub>ef</sub> (in.)', labelX, yBottom + 20)
        .attr({
          align: "left",
          zIndex: 5,
        })
        .css({
          fontSize: "11px",
          fontWeight: "600",
          color: "#64748b",
        })
        .add();
    };

    Highcharts.chart(containerId, {
      chart: {
        type: "column",
        animation: { duration: 500 },
        backgroundColor: "transparent",
        style: { fontFamily: "inherit" },
        marginBottom: 100,

        marginRight: 60,
        events: {
          render: function () {
            applyProductHighlight(this);
            renderRowLabels(this);
          },
        },
      },
      title: { text: null },
      credits: { enabled: false },
      xAxis: {
        type: "category",
        categories: flatCategories,
        plotBands,
        plotLines,

        labels: {
          style: { fontSize: "11px", color: "#64748b" },
          y: 20
        },
        tickWidth: 0,
        lineColor: "#cbd5e1"
      },
      yAxis: {
        title: {
          text: yTitle,
          style: { color: "#475569", fontWeight: "600", fontSize: "14px" },
          margin: 24
        },
        min: 0,
        gridLineColor: "#e2e8f0",
        labels: {
          style: { color: "#64748b" },
          formatter: function () {
            return Highcharts.numberFormat(this.value, 0, ".", ",");
          },
        },
      },
      plotOptions: {
        column: {
          grouping: false,
          groupPadding: 0.1,
          pointPadding: 0.05,
          maxPointWidth: 40,
          borderRadius: 4,
          borderWidth: 0,
          // Disable Highcharts' built-in per-series dimming of the "other" layer on
          // hover; our own origName/color-based fade in applyProductHighlight replaces it.
          states: { hover: { enabled: false }, inactive: { opacity: 1 } },
          point: {
            events: {
              mouseOver: function () {
                const origName = this.custom?.origName;
                if (origName == null) return;
                const chart = this.series.chart;
                chart.__hoveredProduct = origName;
                applyProductHighlight(chart);
              },
              mouseOut: function () {
                const chart = this.series.chart;
                chart.__hoveredProduct = null;
                applyProductHighlight(chart);
              },
            },
          },
        },
      },
      tooltip: {
        useHTML: true,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderColor: "#e2e8f0",
        borderRadius: 8,
        shadow: {
          color: "rgba(0, 0, 0, 0.1)",
          offsetX: 0,
          offsetY: 4,
          width: 8,
          opacity: 0.1
        },
        padding: 12,
        formatter: function () {
          const ptIdx = this.point.index;
          const grp = groups.find(
            (g) => ptIdx >= g.startIndex && ptIdx <= g.endIndex,
          );
          const productName = this.point.custom?.origName || this.series.name;
          const failureMode = this.point.custom?.failureMode || "Unavailable";
          return (
            `<div style="font-family: inherit; color: #334155;">` +
            `<div style="font-size:13px; font-weight:700; color: #0f172a; margin-bottom: 6px;">${productName}</div>` +
            `<div style="font-size:12px; margin-bottom: 4px;">Diameter: <span style="font-weight:600;">Ø ${grp ? grp.size : ""}</span> &mdash; h<sub style="font-size:9px">ef</sub>: <span style="font-weight:600;">${this.point.category} in.</span></div>` +
            `<div style="font-size:12px;">Strength: <span style="font-weight:700; color: #DF4907;">${Highcharts.numberFormat(this.y || 0, 0, ".", ",")} lbs</span></div>` +
            `<div style="font-size:12px;">Governing failure mode: <span style="font-weight:600;">${failureMode}</span></div>` +
            `</div>`
          );
        },
      },
      legend: {
        enabled: true,
        align: "center",
        verticalAlign: "bottom",
        itemStyle: { color: "#475569", fontWeight: "500", cursor: "pointer" },
        itemHoverStyle: { color: "#0f172a" }
      },
      series: series,
    });
  }
}
