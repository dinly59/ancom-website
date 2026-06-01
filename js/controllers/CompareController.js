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

    // Collect unique anchor sizes across all products
    const uniqueSizes = new Set();
    productsData.forEach((product) => {
      (product.anchorSizes || []).forEach((a) => {
        const size = getAnchorSize(a).value;
        if (size) uniqueSizes.add(size);
      });
    });
    const allSizes = Array.from(uniqueSizes).sort(
      (a, b) => parseSize(a) - parseSize(b),
    );

    // For each size collect all hef values from all products
    const sizeToHefs = new Map();
    productsData.forEach((product) => {
      (product.anchorSizes || []).forEach((a) => {
        const anchorSize = getAnchorSize(a);
        const size = anchorSize.value;
        if (!size) return;
        if (!sizeToHefs.has(size)) sizeToHefs.set(size, new Set());
        getEmbedmentDepths(anchorSize).forEach((h) =>
          sizeToHefs.get(size).add(h.value),
        );
      });
    });

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
      if (key === "φNsa") return h.tensionSteelStrength ?? null;
      if (key === "φVsa") return h.shearSteelStrength ?? null;
      if (key === "φNcb") {
        return concreteState === "cracked"
          ? h.tensionBreakoutCracked
          : h.tensionBreakoutUncracked;
      }
      if (key === "φNp") {
        return concreteState === "cracked"
          ? h.pulloutCracked
          : h.pulloutUncracked;
      }
      if (key === "φVcp") {
        return concreteState === "cracked"
          ? h.pryoutCracked
          : h.pryoutUncracked;
      }
      return null;
    }

    function getMinimumPhi(h, keys) {
      const values = keys
        .map((key) => getPhi(h, key))
        .filter(
          (value) => value !== null && value !== undefined && value !== "",
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
        const size = anchorSize.value;
        getEmbedmentDepths(anchorSize).forEach((h) => {
          map.set(
            `${size}-${h.value}`,
            getMinimumPhi(h, ["φNsa", "φNcb", "φNp"]),
          );
        });
      });
      return {
        name: product.name || `Product ${idx + 1}`,
        data: leafOrder.map(({ size, hef }) => map.get(`${size}-${hef}`) ?? null),
        color: this.view.colors[idx % this.view.colors.length],
      };
    });

    // Build shear series
    const shearSeries = productsData.map((product, idx) => {
      const map = new Map();
      (product.anchorSizes || []).forEach((a) => {
        const anchorSize = getAnchorSize(a);
        const size = anchorSize.value;
        getEmbedmentDepths(anchorSize).forEach((h) => {
          map.set(`${size}-${h.value}`, getMinimumPhi(h, ["φVsa", "φVcp"]));
        });
      });
      return {
        name: product.name || `Product ${idx + 1}`,
        data: leafOrder.map(({ size, hef }) => map.get(`${size}-${hef}`) ?? null),
        color: this.view.colors[idx % this.view.colors.length],
      };
    });

    return {
      tension: { flatCategories, groups, series: tensionSeries },
      shear: { flatCategories, groups, series: shearSeries },
    };
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
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    this.compareBtn?.addEventListener("click", () => this.handleCompare());
  }

  /**
   * Initialize with products
   */
  async initialize() {
    const products = this.model.getProducts();
    this.populateCompareSelects(products);
  }

  /**
   * Populate comparison dropdowns
   */
  populateCompareSelects(products) {
    [this.compareProduct1, this.compareProduct2].forEach((select) => {
      if (select) {
        select.innerHTML = '<option value="">Select a product...</option>';
        products.forEach((p) => {
          const opt = document.createElement("option");
          opt.value = p;
          opt.textContent = p.replace(/\.json$/, "");
          select.appendChild(opt);
        });
      }
    });
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
