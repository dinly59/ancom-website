const DATA_PATH = "./data/";
const PRODUCTS_URL = DATA_PATH + "index.json";
let PRODUCTS = [];

// View management
const views = {
  home: document.getElementById("homeView"),
  table: document.getElementById("tableView"),
  compare: document.getElementById("compareView"),
};

function showView(viewName) {
  Object.keys(views).forEach((key) => {
    if (views[key]) {
      views[key].style.display = key === viewName ? "block" : "none";
    }
  });

  // Update active nav link
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.dataset.page === viewName);
  });
}

function handleRoute() {
  const hash = window.location.hash.slice(1) || "home";
  showView(hash);
  // Auto-load first product when entering table view
  if (hash === "table" && !cachedData && PRODUCTS.length) {
    loadProduct(PRODUCTS[0]).then((d) => renderTable(d));
  }
}

// Initialize routing
window.addEventListener("hashchange", handleRoute);
window.addEventListener("load", async () => {
  await initProducts();
  handleRoute();
});

const productSelect = document.getElementById("productSelect");
const container = document.getElementById("tableContainer");
const filterInput = document.getElementById("filter");
const clearFilterBtn = document.getElementById("clearFilter");
const compactToggle = document.getElementById("compactToggle");
const paginationControls = document.getElementById("paginationControls");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const pageInfo = document.getElementById("pageInfo");

// Compare view elements
const compareProduct1 = document.getElementById("compareProduct1");
const compareProduct2 = document.getElementById("compareProduct2");
const compareBtn = document.getElementById("compareBtn");
const compareContainer = document.getElementById("compareContainer");

// Cache for loaded data
let cachedData = null;
let currentProduct = "";
let sortColumn = -1;
let sortAscending = true;
let compactMode = false;
let currentPage = 1;
const PAGE_SIZE = 10;

function populateSelect() {
  PRODUCTS.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p.replace(/\.json$/, "");
    productSelect.appendChild(opt);
  });
}

function populateCompareSelects() {
  [compareProduct1, compareProduct2].forEach((select) => {
    if (select) {
      PRODUCTS.forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p;
        opt.textContent = p.replace(/\.json$/, "");
        select.appendChild(opt);
      });
    }
  });
}

async function fetchProductList() {
  try {
    const resp = await fetch(PRODUCTS_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const list = await resp.json();
    if (!Array.isArray(list)) return [];
    return list;
  } catch (e) {
    console.error("Failed to fetch product list:", e);
    return [];
  }
}

async function initProducts() {
  PRODUCTS = await fetchProductList();
  // Fallback: if no index provided, keep PRODUCTS empty and let user add manually
  populateSelect();
  populateCompareSelects();
}

function formatNumber(v) {
  if (v === null || v === undefined) return "-";
  if (typeof v === "number") return v.toLocaleString();
  return String(v);
}

// Normalize keys to compare variants like "φNsa", "ϕNsa", "fNsa", or full labels
function normalizeKey(s) {
  if (s == null) return "";
  return String(s)
    .normalize()
    .replace(/\s+/g, "")
    .replace(/[(),\-_.]/g, "")
    .replace(/[φϕ]/g, "phi")
    .toLowerCase();
}

// Lookup by short φ-key (e.g. 'φVcp_cr', 'φNsa').
// Matches exact keys, normalized keys, and parenthetical tokens like '(φVcp,cr)'.
function getPhi(obj, phiKey) {
  if (!obj || !phiKey) return undefined;
  // direct exact property
  if (Object.prototype.hasOwnProperty.call(obj, phiKey)) return obj[phiKey];

  const target = normalizeKey(phiKey);

  const props = Object.keys(obj);
  for (const p of props) {
    // exact normalized match
    if (normalizeKey(p) === target) return obj[p];
    // parenthetical token match
    const m = p.match(/\(([^)]+)\)/);
    if (m && m[1]) {
      const par = normalizeKey(m[1]);
      if (par === target) return obj[p];
      if (par.includes(target)) return obj[p];
    }
    // also check if the property contains the token somewhere
    if (normalizeKey(p).includes(target)) return obj[p];
  }
  return undefined;
}

function getField(obj, candidates = []) {
  if (!obj) return undefined;
  // direct candidate check
  for (const c of candidates) {
    if (Object.prototype.hasOwnProperty.call(obj, c)) return obj[c];
  }
  // normalized & substring fallback (handles parenthetical codes like (φNsa))
  const props = Object.keys(obj);
  for (const p of props) {
    const np = normalizeKey(p);
    for (const c of candidates) {
      const nc = normalizeKey(c);
      if (!nc) continue;
      // exact normalized match
      if (np === nc) return obj[p];
      // if the normalized prop contains the candidate token (e.g., 'phinsa')
      if (np.includes(nc)) return obj[p];
      // check parenthetical token inside the original property name
      const m = p.match(/\(([^)]+)\)/);
      if (m && m[1]) {
        const par = normalizeKey(m[1]);
        if (par === nc) return obj[p];
        if (par.includes(nc)) return obj[p];
      }
    }
  }
  return undefined;
}

function showLoading() {
  container.innerHTML = `
    <div class="loading">
      <svg class="inline-block w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p class="mt-3">Loading product data...</p>
    </div>
  `;
}

function showError(message) {
  container.innerHTML = `
    <div class="error">
      <svg class="inline-block w-16 h-16 text-red-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="text-lg font-semibold">⚠️ ${message}</p>
      <button onclick="location.reload()">Retry</button>
    </div>
  `;
}

function renderTable(data, filter = "") {
  container.innerHTML = "";
  if (!data) {
    showError("No data available");
    return;
  }

  const title = document.createElement("h2");
  title.textContent = data.name || "Product";
  title.className = "flex items-center gap-3";
  title.innerHTML = `
    <svg class="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
    ${data.name || "Product"}
  `;
  container.appendChild(title);

  const wrapper = document.createElement("div");
  wrapper.className = "table-scroll";

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");

  const headers = [
    "Anchor Size",
    "Drill Bit",
    "hef",
    "hnom",
    "hhole",
    "Cracked",
    "Seismic",
    "Category",
    "φNsa",
    "φNcb",
    "φNcb_cr",
    "φNp_uncr",
    "φNp_cr",
    "φVsa",
    "φVcp_uncr",
    "φVcp_cr",
  ];
  headers.forEach((h, idx) => {
    const th = document.createElement("th");
    th.textContent = h;
    th.style.cursor = "pointer";
    th.title = "Click to sort";
    if (sortColumn === idx) {
      th.textContent += sortAscending ? " ▲" : " ▼";
    }
    th.addEventListener("click", () => sortTable(idx));
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  const rows = [];
  (data.diameters || []).forEach((d) => {
    const a = d["Anchor Size"] || d.anchorSize || d["anchorSize"] || {};
    const label = a.value || a["value"] || a.anchorSize || "n/a";
    const drill = a["Drill Bit Diameter"] || a.drill || "-";
    const hefs =
      a["Effective Embedment Depth (hef)"] ||
      a.effectiveEmbedmentDepth ||
      a.effective ||
      [];
    hefs.forEach((h) => {
      const row = document.createElement("tr");
      const cells = [
        label,
        drill,
        formatNumber(h.value),
        formatNumber(h["Nominal Embedment Depth (hnom)"] || h.hnom),
        formatNumber(h["Minimum Hole Depth (hhole)"] || h.hhole),
        h["Cracked Concrete Data"] ? "yes" : "no",
        h["Seismic Categories"] || h.Seismic || "-",
        h["Anchor Category"] || h.Anchor || "-",
        formatNumber(
          getField(h, [
            "Tension Steel Strength (φNsa)",

            "tensionSteelStrength",
            "φNsa",
            "ϕNsa",
          ])
        ),
        formatNumber(
          getField(h, [
            "Tension Breakout Strength - Uncracked Concrete (φNcb,uncr)",

            "φNcb",
            "ϕNcb",
          ])
        ),
        formatNumber(
          getField(h, [
            "Tension Breakout Strength - Cracked Concrete (φNcb,cr)",

            "φNcb_cr",
            "φNcb,cr",
          ])
        ),
        formatNumber(
          getField(h, [
            "Pullout Strength - Uncracked Concrete (φNp,uncr)",

            "φNp",
            "ϕNp",
          ])
        ),
        formatNumber(
          getField(h, [
            "Pullout Strength - Cracked Concrete (φNp,cr)",

            "φNp_cr",
            "φNp,cr",
          ])
        ),
        formatNumber(
          getField(h, [
            "Shear Steel Strength (φVsa)",

            "shearSteelStrength",
            "φVsa",
            "ϕVsa",
          ])
        ),
        formatNumber(
          getField(h, [
            "Pryout Strength - Uncracked Concrete (φVcp,uncr)",

            "φVcp",
            "φVcp_uncr",
          ])
        ),
        formatNumber(
          getField(h, [
            "Pryout Strength - Cracked Concrete (φVcp,cr)",

            "φVcp_cr",
            "φVcp,cr",
          ])
        ),
      ];

      // Normalize row text and filter to support searching for φ/ϕ and other variants
      const rowText = normalizeKey(cells.join(" "));
      const normalizedFilter = normalizeKey(filter || "");
      if (normalizedFilter && !rowText.includes(normalizedFilter)) return;

      headers.forEach((hdr, i) => {
        const td = document.createElement("td");
        td.setAttribute("data-label", hdr);
        td.textContent = cells[i];
        row.appendChild(td);
      });
      rows.push({ row, cells });
    });
  });

  // Apply sorting if active
  if (sortColumn !== -1) {
    rows.sort((a, b) => {
      const aVal = a.cells[sortColumn];
      const bVal = b.cells[sortColumn];
      const aNum = parseFloat(aVal.replace(/,/g, ""));
      const bNum = parseFloat(bVal.replace(/,/g, ""));

      let comparison = 0;
      if (!isNaN(aNum) && !isNaN(bNum)) {
        comparison = aNum - bNum;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }
      return sortAscending ? comparison : -comparison;
    });
  }

  // Append sorted rows
  // Pagination
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * PAGE_SIZE;
  const pagedRows = rows.slice(start, start + PAGE_SIZE);
  pagedRows.forEach((r) => tbody.appendChild(r.row));

  table.appendChild(tbody);

  // Add row count
  const rowCount = document.createElement("p");
  rowCount.className = "row-count";
  const total =
    data.diameters?.reduce(
      (sum, d) =>
        sum +
        (d["Anchor Size"]?.["Effective Embedment Depth (hef)"]?.length || 0),
      0
    ) || 0;
  rowCount.textContent = `Showing ${rows.length} of ${total} rows${
    filter ? " (filtered)" : ""
  }`;
  container.appendChild(rowCount);
  wrapper.appendChild(table);
  container.appendChild(wrapper);

  // Create/Update visible pagination bar under the table
  const existingBar = container.querySelector(".pagination");
  if (existingBar) existingBar.remove();
  if (rows.length > PAGE_SIZE) {
    const paginationEl = document.createElement("div");
    paginationEl.className = "pagination";
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "Prev";
    prevBtn.disabled = currentPage <= 1;
    const info = document.createElement("span");
    info.id = "pageInfoInline";
    info.textContent = `${currentPage} / ${totalPages}`;
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next";
    nextBtn.disabled = currentPage >= totalPages;

    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderTable(cachedData, filterInput.value.trim());
      }
    });
    nextBtn.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderTable(cachedData, filterInput.value.trim());
      }
    });

    paginationEl.appendChild(prevBtn);
    paginationEl.appendChild(info);
    paginationEl.appendChild(nextBtn);
    container.appendChild(paginationEl);
  }
}

function sortTable(columnIndex) {
  if (sortColumn === columnIndex) {
    sortAscending = !sortAscending;
  } else {
    sortColumn = columnIndex;
    sortAscending = true;
  }
  if (cachedData) renderTable(cachedData, filterInput.value.trim());
}

async function loadProduct(filename) {
  // Return cached if same product
  if (currentProduct === filename && cachedData) {
    return cachedData;
  }

  showLoading();
  try {
    const resp = await fetch(DATA_PATH + filename);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    const j = await resp.json();
    cachedData = j;
    currentProduct = filename;
    return j;
  } catch (e) {
    showError(`Failed to load ${filename}: ${e.message}`);
    throw e;
  }
}

productSelect.addEventListener("change", async () => {
  const file = productSelect.value;
  const filter = filterInput.value.trim();
  const data = await loadProduct(file);
  currentPage = 1;
  renderTable(data, filter);
});

filterInput.addEventListener("input", () => {
  if (!cachedData) return;
  // Use cached data instead of re-fetching
  currentPage = 1;
  renderTable(cachedData, filterInput.value.trim());
});

clearFilterBtn.addEventListener("click", () => {
  filterInput.value = "";
  sortColumn = -1;
  currentPage = 1;
  if (cachedData) renderTable(cachedData);
});

compactToggle?.addEventListener("change", (e) => {
  compactMode = e.target.checked;
  document.documentElement.classList.toggle("compact", compactMode);
});

prevPageBtn?.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderTable(cachedData, filterInput.value.trim());
  }
});
nextPageBtn?.addEventListener("click", () => {
  // totalPages will be recalculated in renderTable
  currentPage++;
  renderTable(cachedData, filterInput.value.trim());
});

// Compare functionality
compareBtn?.addEventListener("click", async () => {
  const products = [compareProduct1?.value, compareProduct2?.value].filter(
    Boolean
  );

  if (products.length !== 2) {
    compareContainer.innerHTML = `
      <div class="text-center py-16 text-red-600">
        <svg class="inline-block w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-lg font-semibold">Please select exactly 2 products to compare</p>
      </div>
    `;
    return;
  }

  compareContainer.innerHTML = `
    <div class="text-center py-16 text-slate-500 animate-pulse">
      <svg class="inline-block w-8 h-8 text-blue-600 animate-spin mb-4" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p class="text-lg">Loading comparison...</p>
    </div>
  `;

  try {
    const dataPromises = products.map((p) =>
      fetch(DATA_PATH + p).then((r) => r.json())
    );
    const productsData = await Promise.all(dataPromises);

    renderComparison(productsData);
  } catch (e) {
    compareContainer.innerHTML = `
      <div class="text-center py-16 text-red-600">
        <svg class="inline-block w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-lg font-semibold">Failed to load comparison: ${e.message}</p>
      </div>
    `;
  }
});

function renderComparison(productsData) {
  compareContainer.innerHTML = "";

  // Overview Table Section
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
  const companyRow = document.createElement("tr");
  const companyLabel = document.createElement("td");
  companyLabel.className =
    "px-4 py-3 text-sm font-semibold text-slate-700 bg-slate-50 border-b border-slate-200 sticky left-0";
  companyLabel.textContent = "Company";
  companyRow.appendChild(companyLabel);
  productsData.forEach((data) => {
    const td = document.createElement("td");
    td.className = "px-4 py-3 text-sm text-slate-700 border-b border-slate-200";
    td.textContent = data.company || "-";
    companyRow.appendChild(td);
  });
  tbody.appendChild(companyRow);

  // Diameter count row
  const diameterRow = document.createElement("tr");
  const diameterLabel = document.createElement("td");
  diameterLabel.className =
    "px-4 py-3 text-sm font-semibold text-slate-700 bg-slate-50 border-b border-slate-200 sticky left-0";
  diameterLabel.textContent = "Available Sizes";
  diameterRow.appendChild(diameterLabel);
  productsData.forEach((data) => {
    const td = document.createElement("td");
    td.className = "px-4 py-3 text-sm text-slate-700 border-b border-slate-200";
    td.textContent = (data.diameters?.length || 0) + " sizes";
    diameterRow.appendChild(td);
  });
  tbody.appendChild(diameterRow);

  // Total configurations row
  const configRow = document.createElement("tr");
  const configLabel = document.createElement("td");
  configLabel.className =
    "px-4 py-3 text-sm font-semibold text-slate-700 bg-slate-50 border-b border-slate-200 sticky left-0";
  configLabel.textContent = "Total Configurations";
  configRow.appendChild(configLabel);
  productsData.forEach((data) => {
    const td = document.createElement("td");
    td.className = "px-4 py-3 text-sm text-slate-700 border-b border-slate-200";
    const total =
      data.diameters?.reduce(
        (sum, d) =>
          sum +
          (d["Anchor Size"]?.["Effective Embedment Depth (hef)"]?.length || 0),
        0
      ) || 0;
    td.textContent = total + " configurations";
    configRow.appendChild(td);
  });
  tbody.appendChild(configRow);

  table.appendChild(tbody);
  wrapper.appendChild(table);
  overviewSection.appendChild(wrapper);
  compareContainer.appendChild(overviewSection);

  // Charts Section - Diameter Comparison
  if (productsData.length === 2) {
    const chartsSection = document.createElement("div");
    chartsSection.className =
      "bg-white rounded-xl shadow-md border border-slate-200 p-6";

    const chartTitle = document.createElement("h2");
    chartTitle.className = "text-2xl font-bold text-slate-800 mb-4";
    chartTitle.textContent = "Diameter Specifications Comparison";
    chartsSection.appendChild(chartTitle);

    // Create chart containers
    const chartsGrid = document.createElement("div");
    // Stack charts vertically so each chart can be larger (tension above, shear below)
    chartsGrid.className = "grid grid-cols-1 gap-6";

    // Tension Strength Chart
    const tensionChartDiv = document.createElement("div");
    tensionChartDiv.className = "bg-slate-50 p-4 rounded-lg";
    const tensionTitle = document.createElement("h3");
    tensionTitle.className =
      "text-lg font-semibold text-slate-700 mb-3 text-center";
    tensionTitle.textContent = "Tension Steel Strength (fNsa) by Diameter";
    tensionChartDiv.appendChild(tensionTitle);
    const tensionCanvas = document.createElement("canvas");
    tensionCanvas.id = "tensionChart";
    // make the canvas taller so the chart is larger
    tensionCanvas.style.width = "100%";
    tensionCanvas.style.height = "380px";
    tensionChartDiv.appendChild(tensionCanvas);
    chartsGrid.appendChild(tensionChartDiv);

    // Shear Strength Chart
    const shearChartDiv = document.createElement("div");
    shearChartDiv.className = "bg-slate-50 p-4 rounded-lg";
    const shearTitle = document.createElement("h3");
    shearTitle.className =
      "text-lg font-semibold text-slate-700 mb-3 text-center";
    shearTitle.textContent = "Shear Steel Strength (fVsa) by Diameter";
    shearChartDiv.appendChild(shearTitle);
    const shearCanvas = document.createElement("canvas");
    shearCanvas.id = "shearChart";
    shearCanvas.style.width = "100%";
    shearCanvas.style.height = "380px";
    shearChartDiv.appendChild(shearCanvas);
    chartsGrid.appendChild(shearChartDiv);

    chartsSection.appendChild(chartsGrid);
    compareContainer.appendChild(chartsSection);

    // Render charts after DOM is updated
    setTimeout(() => {
      renderComparisonCharts(productsData);
    }, 100);
  }
}

function renderComparisonCharts(productsData) {
  // Prepare data for charts
  const diameters = new Set();
  const colors = ["#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981"];

  // Build x positions and groups similar to Python approach
  const parseSize = (s) => {
    if (!s) return 0;
    if (s.includes("/")) {
      const [num, den] = s.replace('"', "").split("/");
      return parseFloat(num) / parseFloat(den);
    }
    return parseFloat(s) || 0;
  };

  // Collect all unique diameters present in products (dynamically from compared products)
  const uniqueDiameters = new Set();
  productsData.forEach((product) => {
    product.diameters?.forEach((d) => {
      const size = d["Anchor Size"]?.value;
      if (size) uniqueDiameters.add(size);
    });
  });
  // Sort diameters numerically
  const allDiameters = Array.from(uniqueDiameters).sort(
    (a, b) => parseSize(a) - parseSize(b)
  );
  const dataBySizeThenHef = new Map(); // Map: size -> Map(hef -> [products having this size+hef])

  productsData.forEach((product) => {
    product.diameters?.forEach((d) => {
      const anchorSize = d["Anchor Size"];
      const size = anchorSize?.value;
      if (!size) return;
      const hefs = anchorSize?.["Effective Embedment Depth (hef)"] || [];
      hefs.forEach((h) => {
        if (!dataBySizeThenHef.has(size))
          dataBySizeThenHef.set(size, new Map());
        const hefMap = dataBySizeThenHef.get(size);
        if (!hefMap.has(h.value)) hefMap.set(h.value, []);
        hefMap.get(h.value).push({ product, h });
      });
    });
  });

  // Build x positions incrementally with gaps between diameter groups
  const xPositions = [];
  const xLabels = [];
  const xTicks = [];
  const groups = [];
  const positionToData = []; // maps position index to {size, hef} or null for gap
  let currentPos = 0;
  const groupSpacing = 3; // gap between diameter groups (increased for better visual separation)

  allDiameters.forEach((diameter) => {
    if (!dataBySizeThenHef.has(diameter)) return; // skip if no data for this diameter

    const hefMap = dataBySizeThenHef.get(diameter);
    const hefs = Array.from(hefMap.keys()).sort(
      (a, b) => parseFloat(a) - parseFloat(b)
    );
    if (hefs.length === 0) return;

    const groupStart = currentPos;

    hefs.forEach((hef) => {
      xPositions.push(currentPos);
      xLabels.push(String(hef));
      xTicks.push(currentPos);
      positionToData.push({ size: diameter, hef });
      currentPos++;
    });

    const groupEnd = currentPos - 1;
    groups.push({ size: diameter, startIndex: groupStart, endIndex: groupEnd });

    currentPos += groupSpacing; // add gap after group
  });

  // Plugin to draw group labels and brackets under the x-axis
  const groupLabelPlugin = {
    id: "groupLabels",
    afterDraw: (chart) => {
      const { ctx, chartArea, scales, options } = chart;
      const xScale = scales.x;
      // Read groups and xLabels from chart options if provided, fallback to outer-scope
      const pluginOpts =
        (options && options.plugins && options.groupLabels) || {};
      const localGroups = pluginOpts.groups || groups || [];
      const localXLabels = pluginOpts.xLabels || xLabels || [];

      if (!localGroups.length) return;

      ctx.save();
      ctx.fillStyle = "#0f172a";
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1;
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";

      // Draw one bracket + label per group
      localGroups.forEach((g) => {
        if (g.startIndex == null || g.endIndex == null) return;
        const startPixel = xScale.getPixelForValue(g.startIndex);
        const endPixel = xScale.getPixelForValue(g.endIndex);
        // Guard against invalid coordinates
        if (!isFinite(startPixel) || !isFinite(endPixel)) return;
        const center = (startPixel + endPixel) / 2;
        const bracketY = chartArea.bottom + 8;
        const bracketHeight = 6;
        const labelY = chartArea.bottom + 28;
        ctx.beginPath();
        ctx.moveTo(startPixel, bracketY); // left vertical
        ctx.lineTo(startPixel, bracketY + bracketHeight);
        ctx.moveTo(startPixel, bracketY + bracketHeight);
        ctx.lineTo(endPixel, bracketY + bracketHeight); // horizontal
        ctx.moveTo(endPixel, bracketY); // right vertical
        ctx.lineTo(endPixel, bracketY + bracketHeight);
        ctx.stroke();
        ctx.fillText(`Ø ${g.size}`, center, labelY);
      });

      // Draw hef tick labels above the bracket
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#0f172a";
      localXLabels.forEach((lab, i) => {
        if (lab) {
          const x = xScale.getPixelForValue(i);
          if (!isFinite(x)) return;
          ctx.fillText(lab, x, chartArea.bottom + 2);
        }
      });
      ctx.restore();
    },
  };

  // Prepare datasets for tension strength (map values to x positions)
  const tensionDatasets = productsData.map((product, idx) => {
    // build a map of "size-hef" -> value
    const map = new Map();
    product.diameters?.forEach((d) => {
      const size = d["Anchor Size"]?.value;
      const hefs = d["Anchor Size"]?.["Effective Embedment Depth (hef)"] || [];
      hefs.forEach((h) => {
        map.set(`${size}-${h.value}`, getPhi(h, "φNsa"));
      });
    });

    // create data array aligned with xPositions
    const data = positionToData.map((item) => {
      if (!item) return null; // gap position
      const key = `${item.size}-${item.hef}`;
      return map.has(key) ? map.get(key) : null;
    });

    return {
      label: product.name || `Product ${idx + 1}`,
      data: data,
      borderColor: colors[idx % colors.length],
      backgroundColor: colors[idx % colors.length],
      borderWidth: 2,
    };
  });

  // Prepare datasets for shear strength (aligned with xPositions)
  const shearDatasets = productsData.map((product, idx) => {
    const map = new Map();
    product.diameters?.forEach((d) => {
      const size = d["Anchor Size"]?.value;
      const hefs = d["Anchor Size"]?.["Effective Embedment Depth (hef)"] || [];
      hefs.forEach((h) => {
        map.set(`${size}-${h.value}`, getPhi(h, "φVsa"));
      });
    });

    const data = positionToData.map((item) => {
      if (!item) return null; // gap position
      const key = `${item.size}-${item.hef}`;
      return map.has(key) ? map.get(key) : null;
    });

    return {
      label: product.name || `Product ${idx + 1}`,
      data: data,
      borderColor: colors[idx % colors.length],
      backgroundColor: colors[idx % colors.length],
      borderWidth: 2,
    };
  });

  // Render Tension Strength Chart
  const tensionCtx = document.getElementById("tensionChart");
  if (tensionCtx && window.Chart) {
    new Chart(tensionCtx, {
      type: "bar",
      data: {
        labels: xLabels,
        datasets: tensionDatasets,
      },
      plugins: [groupLabelPlugin],
      options: {
        responsive: true,
        maintainAspectRatio: true,
        categoryPercentage: 0.95,
        barPercentage: 0.85,
        plugins: {
          legend: {
            position: "bottom",
          },
          groupLabels: { groups, xLabels },
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.dataset.label || "";
                if (label) {
                  label += ": ";
                }
                if (context.parsed.y !== null) {
                  label += context.parsed.y.toLocaleString() + " lbs";
                }
                return label;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Tension Strength (lbs)",
            },
          },
          x: {
            type: "category",
            title: {
              display: true,
              text: "hef (in.)",
            },
            ticks: {
              maxRotation: 0,
              autoSkip: false,
              // hide default tick labels; plugin will draw hef labels
              display: false,
            },
          },
        },
      },
    });
  }

  // Render Shear Strength Chart
  const shearCtx = document.getElementById("shearChart");
  if (shearCtx && window.Chart) {
    new Chart(shearCtx, {
      type: "bar",
      data: {
        labels: xLabels,
        datasets: shearDatasets,
      },
      plugins: [groupLabelPlugin],
      options: {
        responsive: true,
        maintainAspectRatio: true,
        categoryPercentage: 0.95,
        barPercentage: 0.85,
        plugins: {
          legend: {
            position: "bottom",
          },
          groupLabels: { groups, xLabels },
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.dataset.label || "";
                if (label) {
                  label += ": ";
                }
                if (context.parsed.y !== null) {
                  label += context.parsed.y.toLocaleString() + " lbs";
                }
                return label;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Shear Strength (lbs)",
            },
          },
          x: {
            type: "category",
            title: {
              display: true,
              text: "hef (in.)",
            },
            ticks: {
              maxRotation: 0,
              autoSkip: false,
              // hide default tick labels; plugin will draw hef labels
              display: false,
            },
          },
        },
      },
    });
  }
}

// Initialize
populateSelect();
populateCompareSelects();
