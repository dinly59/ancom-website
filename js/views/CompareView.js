/**
 * CompareView - Handles product comparison visualization
 */
class CompareView {
  constructor(model) {
    this.model = model;
    this.container = document.getElementById("compareContainer");
    this.colors = ["#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981"];
  }

  /**
   * Show loading state
   */
  showLoading() {
    this.container.innerHTML = `
      <div class="text-center py-16 text-slate-500 animate-pulse">
        <svg class="inline-block w-8 h-8 text-blue-600 animate-spin mb-4" fill="none" viewBox="0 0 24 24">
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

    // Optionally show the selected concrete state
    if (concreteState) {
      const stateBanner = document.createElement("div");
      stateBanner.className =
        "mb-4 px-4 py-2 rounded bg-blue-50 text-blue-800 font-semibold inline-block";
      stateBanner.textContent = `Concrete State: ${concreteState.charAt(0).toUpperCase() + concreteState.slice(1)}`;
      this.container.appendChild(stateBanner);
    }

    // Overview section
    this.renderOverview(productsData, concreteState);

    // Charts section (if chartData provided)
    if (chartData && chartData.tension && chartData.shear) {
      this.renderChartsSection(chartData);
    }
  }

  /**
   * Render overview table
   */
  renderOverview(productsData) {
    const overviewSection = document.createElement("div");
    overviewSection.className =
      "bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden";

    const title = document.createElement("h2");
    title.className =
      "text-2xl font-bold text-slate-800 px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-slate-50";
    title.textContent = "Product Comparison Overview";
    overviewSection.appendChild(title);

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
      th.textContent = data.name || "Product";
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
      (data) => data.company || "-",
    );

    // Anchor size count row
    this.addOverviewRow(
      tbody,
      "Available Sizes",
      productsData,
      (data) => (data.anchorSizes?.length || 0) + " sizes",
    );

    // Total configurations row
    this.addOverviewRow(
      tbody,
      "Total Configurations",
      productsData,
      (data) => this.model.getTotalRowCount(data) + " configurations",
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

    const chartsGrid = document.createElement("div");
    chartsGrid.className = "grid grid-cols-1 gap-6";

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
    div.className = "bg-slate-50 p-4 rounded-lg";

    const titleEl = document.createElement("h3");
    titleEl.className = "text-lg font-semibold text-slate-700 mb-3 text-center";
    titleEl.innerHTML = title;
    div.appendChild(titleEl);

    const chartDiv = document.createElement("div");
    chartDiv.id = id;
    chartDiv.style.height = "420px";
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
    const bandColors = ["rgba(59,130,246,0.06)", "rgba(139,92,246,0.06)"];
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

    Highcharts.chart(containerId, {
      chart: {
        type: "column",
        animation: false,
        style: { fontFamily: "inherit" },
        marginBottom: 100,
      },
      title: { text: null },
      credits: { enabled: false },
      xAxis: {
        type: "category",
        categories: flatCategories,
        plotBands,
        plotLines,
        labels: { style: { fontSize: "11px" } },
        // tickWidth: 0,
      },
      yAxis: {
        title: { text: yTitle },
        min: 0,
        gridLineColor: "#e2e8f0",
        labels: {
          formatter: function () {
            return this.value.toLocaleString();
          },
        },
      },
      plotOptions: {
        column: {
          grouping: false,
          groupPadding: 0.1,
          pointPadding: 0.05,
          maxPointWidth: 40,
          borderRadius: 3,
        },
      },
      tooltip: {
        useHTML: true,
        formatter: function () {
          const ptIdx = this.point.index;
          const grp = groups.find(
            (g) => ptIdx >= g.startIndex && ptIdx <= g.endIndex,
          );
          return (
            `<span style="font-size:11px;font-weight:bold">${this.series.name}</span><br/>` +
            `Diameter: <b>Ø ${grp ? grp.size : ""}</b> &mdash; ` +
            `h<sub>ef</sub>: <b>${this.point.category} in.</b><br/>` +
            `Strength: <b>${(this.y || 0).toLocaleString()} lbs</b>`
          );
        },
      },
      legend: {
        enabled: true,
        align: "center",
        verticalAlign: "bottom",
      },
      series: series,
    });
  }
}
