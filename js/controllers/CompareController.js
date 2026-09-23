/**
 * CompareController - Controls product comparison view
 */
class CompareController {
  /**
   * Prepare chart data for the view (xLabels, groups, datasets)
   * @param {Array} productsData
   * @param {string} concreteState
   * @returns {Object} chartData
   */
  prepareChartData(productsData, concreteState) {
    // Helper to parse anchor size for sorting
    const parseSize = (s) => {
      if (!s) return 0;
      if (typeof s === "string" && s.includes("/")) {
        const [num, den] = s.replace('"', "").split("/");
        return parseFloat(num) / parseFloat(den);
      }
      return parseFloat(s) || 0;
    };

    const getAnchorSize = (anchor) =>
      anchor?.["Anchor Size"] || anchor?.anchorSize || anchor || {};
    const getEmbedmentDepths = (anchorSize) =>
      anchorSize?.["Effective Embedment Depth (hef)"] ||
      anchorSize?.effectiveEmbedmentDepths ||
      [];

    const isHefSupported = (h, state) => {
      if (!h) return false;
      if (state === "cracked") {
        return typeof h.supportsCrackedConcrete === "function"
          ? h.supportsCrackedConcrete()
          : Boolean(h.crackedConcreteData?.value);
      }
      if (state === "uncracked") {
        return typeof h.supportsUncrackedConcrete === "function"
          ? h.supportsUncrackedConcrete()
          : true;
      }
      return true;
    };

    // Collect all supported hef values for each anchor size across all products
    const sizeToHefs = new Map();
    productsData.forEach((product) => {
      (product.anchorSizes || []).forEach((a) => {
        const anchorSize = getAnchorSize(a);
        const size = anchorSize.value?.value || anchorSize.value;
        if (!size) return;

        getEmbedmentDepths(anchorSize).forEach((h) => {
          if (isHefSupported(h, concreteState)) {
            if (!sizeToHefs.has(size)) sizeToHefs.set(size, new Set());
            sizeToHefs.get(size).add(h.value?.value || h.value);
          }
        });
      });
    });

    const allSizes = Array.from(sizeToHefs.keys()).sort(
      (a, b) => parseSize(a) - parseSize(b),
    );

    // Build flat x-axis categories + groups metadata for plotBands/plotLines.
    // One slot per hef; grouping:false lets each series render independently
    // so every column is centered on its hef label.
    const flatCategories = []; // flat hef label strings, one per hef
    const groups = [];         // [{size, startIndex, endIndex}]
    const leafOrder = [];      // [{size, hef}] in display order
    let leafIdx = 0;

    allSizes.forEach((size) => {
      if (!sizeToHefs.has(size)) return;
      const hefs = Array.from(sizeToHefs.get(size)).sort(
        (a, b) => parseFloat(a) - parseFloat(b),
      );
      if (!hefs.length) return;
      const startIndex = leafIdx;
      hefs.forEach((hef) => {
        flatCategories.push(String(hef));
        leafOrder.push({ size, hef });
        leafIdx++;
      });
      groups.push({ size, startIndex, endIndex: leafIdx - 1 });
    });

    // Helper to get the correct phi value based on concrete state
    function getPhi(h, key) {
      if (key === "φNsa") return h.tensionSteelStrength?.value ?? null;
      if (key === "φVsa") return h.shearSteelStrength?.value ?? null;
      if (key === "φNcb") {
        return concreteState === "cracked"
          ? h.tensionBreakoutCracked?.value
          : h.tensionBreakoutUncracked?.value;
      }
      if (key === "φNp") {
        return concreteState === "cracked"
          ? h.pulloutCracked?.value
          : h.pulloutUncracked?.value;
      }
      if (key === "φVcp") {
        return concreteState === "cracked"
          ? h.pryoutCracked?.value
          : h.pryoutUncracked?.value;
      }
      return null;
    }

    function getMinimumPhi(h, keys) {
      const values = keys
        .map((key) => getPhi(h, key))
        .filter(
          (value) => value !== null && value !== undefined && value !== "" && value !== "NP",
        )
        .map((value) => Number(value))
        .filter((value) => !Number.isNaN(value));

      if (values.length === 0) return null;

      return Math.min(...values);
    }

    // Build tension series
    const tensionSeries = productsData.map((product, idx) => {
      const map = new Map();
      (product.anchorSizes || []).forEach((a) => {
        const anchorSize = getAnchorSize(a);
        const size = anchorSize.value?.value || anchorSize.value;
        getEmbedmentDepths(anchorSize).forEach((h) => {
          if (isHefSupported(h, concreteState)) {
            map.set(
              `${size}-${h.value?.value || h.value}`,
              getMinimumPhi(h, ["φNsa", "φNcb", "φNp"]),
            );
          }
        });
      });
      return {
        name: product.name?.value || product.name || `Product ${idx + 1}`,
        data: leafOrder.map(({ size, hef }) => map.get(`${size}-${hef}`) ?? null),
        color: this.view.colors[idx % this.view.colors.length],
      };
    });

    // Build shear series
    const shearSeries = productsData.map((product, idx) => {
      const map = new Map();
      (product.anchorSizes || []).forEach((a) => {
        const anchorSize = getAnchorSize(a);
        const size = anchorSize.value?.value || anchorSize.value;
        getEmbedmentDepths(anchorSize).forEach((h) => {
          if (isHefSupported(h, concreteState)) {
            map.set(`${size}-${h.value?.value || h.value}`, getMinimumPhi(h, ["φVsa", "φVcp"]));
          }
        });
      });
      return {
        name: product.name?.value || product.name || `Product ${idx + 1}`,
        data: leafOrder.map(({ size, hef }) => map.get(`${size}-${hef}`) ?? null),
        color: this.view.colors[idx % this.view.colors.length],
      };
    });

    return {
      tension: { flatCategories, groups, series: this.layerSeriesByHeight(tensionSeries) },
      shear: { flatCategories, groups, series: this.layerSeriesByHeight(shearSeries) },
    };
  }

  /**
   * Re-order exactly-2-product series into background/foreground render layers so the
   * shorter bar at each x-position always draws on top instead of being hidden by the taller one.
   * Legend-only proxy series preserve the original product names/colors in the legend.
   * @param {Array} originalSeries - [{ name, data, color }, { name, data, color }]
   */
  layerSeriesByHeight(originalSeries) {
    const [a, b] = originalSeries;
    if (!a || !b) return originalSeries;

    const background = [];
    const foreground = [];
    for (let i = 0; i < a.data.length; i++) {
      const va = a.data[i];
      const vb = b.data[i];
      if (va == null && vb == null) {
        background.push(null);
        foreground.push(null);
      } else if (vb == null || (va != null && va >= vb)) {
        background.push({ y: va, color: a.color, origName: a.name });
        foreground.push(vb == null ? null : { y: vb, color: b.color, origName: b.name });
      } else {
        background.push({ y: vb, color: b.color, origName: b.name });
        foreground.push({ y: va, color: a.color, origName: a.name });
      }
    }

    return [
      { name: a.name, color: a.color, data: [], showInLegend: true, enableMouseTracking: false, zIndex: 0 },
      { name: b.name, color: b.color, data: [], showInLegend: true, enableMouseTracking: false, zIndex: 0 },
      { id: "__background", name: "__background", data: background, showInLegend: false, zIndex: 1 },
      { id: "__foreground", name: "__foreground", data: foreground, showInLegend: false, zIndex: 2 },
    ];
  }

  constructor(model, view) {
    this.model = model;
    this.view = view;

    this.initElements();
    this.bindEvents();
  }

  /**
   * Initialize DOM elements
   */
  initElements() {
    this.compareProduct1 = document.getElementById("compareProduct1");
    this.compareProduct2 = document.getElementById("compareProduct2");
    this.compareBtn = document.getElementById("compareBtn");
    this.concreteStateRadios = document.querySelectorAll(
      'input[name="concreteState"]',
    );
    this.compareCompany1 = document.getElementById("compareCompany1");
    this.compareCompany2 = document.getElementById("compareCompany2");
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    this.compareBtn?.addEventListener("click", () => this.handleCompare());
    this.concreteStateRadios.forEach((radio) => {
      radio.addEventListener("change", () => this.handleConcreteStateChange());
    });
    this.compareCompany1?.addEventListener("change", () => this.handleCompanyFilterChange(1));
    this.compareCompany2?.addEventListener("change", () => this.handleCompanyFilterChange(2));
  }

  /**
   * Initialize with products
   */
  async initialize() {
    this.updateCompareSelects();
  }

  /**
   * Handle change on concrete state radio buttons
   */
  handleConcreteStateChange() {
    this.updateCompareSelects();
  }

  /**
   * Handle change on company filter dropdown
   */
  handleCompanyFilterChange(index) {
    this.updateCompareSelects(index);
  }

  /**
   * Update compare selects based on currently selected concrete state and company filter
   */
  updateCompareSelects(index) {
    const concreteState = this.getConcreteState();
    let allProducts = this.model.getProducts(concreteState);

    // Only update company lists when concrete state changes (i.e. no index provided)
    if (!index) {
      this.populateCompanyFilters(allProducts);
    }

    if (!index || index === 1) {
      this.updateProductSelect(this.compareCompany1, this.compareProduct1, allProducts);
    }
    if (!index || index === 2) {
      this.updateProductSelect(this.compareCompany2, this.compareProduct2, allProducts);
    }
  }

  /**
   * Populate company filter dropdowns
   */
  populateCompanyFilters(products) {
    const companies = [
      ...new Set(
        products
          .map((p) => p.company?.value || p.company)
          .filter(Boolean),
      ),
    ].sort();

    [this.compareCompany1, this.compareCompany2].forEach((select) => {
      if (!select) return;
      const currentCompany = select.value;
      select.innerHTML = '<option value="">All Companies</option>';

      companies.forEach((company) => {
        const opt = document.createElement("option");
        opt.value = company;
        opt.textContent = company;
        select.appendChild(opt);
      });

      if (companies.includes(currentCompany)) {
        select.value = currentCompany;
      } else {
        select.value = "";
      }
    });
  }

  /**
   * Update a specific product select based on its company filter
   */
  updateProductSelect(companySelect, productSelect, allProducts) {
    if (!productSelect) return;

    let products = allProducts;
    const selectedCompany = companySelect?.value;
    if (selectedCompany) {
      products = products.filter(
        (p) => (p.company?.value) === selectedCompany,
      );
    }

    const currentValue = productSelect.value;
    productSelect.innerHTML = '<option value="">Select a product...</option>';

    products.forEach((p) => {
      const opt = document.createElement("option");
      const filename = p.filename || p.name;
      const label = typeof p.getDisplayName === "function" ? p.getDisplayName() : p.name || p.filename;
      opt.value = filename;
      opt.textContent = label;
      productSelect.appendChild(opt);
    });

    if (currentValue && products.some((p) => (p.filename || p.name) === currentValue)) {
      productSelect.value = currentValue;
    } else {
      productSelect.value = "";
    }
  }

  /**
   * Handle compare button click
   */
  async handleCompare() {
    const products = [
      this.compareProduct1?.value,
      this.compareProduct2?.value,
    ].filter(Boolean);
    const concreteState = this.getConcreteState();

    if (products.length !== 2) {
      this.view.showError("Please select exactly 2 products to compare");
      return;
    }

    if (!concreteState) {
      this.view.showError("Please select a concrete state");
      return;
    }

    this.view.showLoading();

    try {
      const productsData = await this.model.loadProductSchemas(products);
      const chartData = this.prepareChartData(productsData, concreteState);
      this.view.render(productsData, concreteState, chartData);
    } catch (e) {
      this.view.showError(`Failed to load comparison: ${e.message}`);
    }
  }

  getConcreteState() {
    for (const radio of this.concreteStateRadios) {
      if (radio.checked) {
        return radio.value;
      }
    }
    return null;
  }
}
