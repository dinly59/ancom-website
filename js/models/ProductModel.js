/**
 * ProductModel - Handles data loading and business logic for products
 *
 * Schema Classes (imported):
 * - EffectiveEmbedmentDepth
 * - AnchorSize
 * - Product
 */
class ProductModel {
  constructor() {
    this.DATA_PATH = "./data/";
    this.PRODUCTS_URL = this.DATA_PATH + "index.json";
    this.products = [];
    this.cachedData = new Map(); // Cache multiple products
  }

  /**
   * Initialize and load product list
   */
  async initialize() {
    this.products = await this.fetchProductList();
    return this.products;
  }

  /**
   * Fetch the list of available products
   */
  async fetchProductList() {
    try {
      const resp = await fetch(this.PRODUCTS_URL);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const list = await resp.json();
      if (!Array.isArray(list)) return [];
      return list;
    } catch (e) {
      console.error("Failed to fetch product list:", e);
      return [];
    }
  }

  /**
   * Load a specific product data (raw JSON)
   */
  async loadProduct(filename) {
    // Return cached if available
    if (this.cachedData.has(filename)) {
      return this.cachedData.get(filename);
    }

    try {
      const resp = await fetch(this.DATA_PATH + filename);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      const data = await resp.json();
      this.cachedData.set(filename, data);
      return data;
    } catch (e) {
      throw new Error(`Failed to load ${filename}: ${e.message}`);
    }
  }

  /**
   * Load a product and convert to typed schema
   */
  async loadProductSchema(filename) {
    const rawData = await this.loadProduct(filename);
    return new Product(rawData);
  }

  /**
   * Load multiple products (raw JSON)
   */
  async loadProducts(filenames) {
    const promises = filenames.map((filename) => this.loadProduct(filename));
    return await Promise.all(promises);
  }

  /**
   * Load multiple products and convert to typed schemas
   */
  async loadProductSchemas(filenames) {
    const rawDataList = await this.loadProducts(filenames);
    return rawDataList.map((data) => new Product(data));
  }

  /**
   * Get all available products
   */
  getProducts() {
    return this.products;
  }

  /**
   * Filter product data based on search term
   */
  filterProductData(data, filterTerm) {
    if (!filterTerm || !data) return data;

    const normalizedFilter = this.normalizeKey(filterTerm);
    const filteredAnchorSizes = [];

    const anchorSizes = data.anchorSizes || [];

    anchorSizes.forEach((a) => {
      const anchorSize = a["Anchor Size"] || a.anchorSize || a || {};
      const hefs =
        anchorSize["Effective Embedment Depth (hef)"] ||
        anchorSize.effectiveEmbedmentDepth ||
        [];

      const filteredHefs = hefs.filter((h) => {
        // Create a searchable string from all properties
        const searchableText = JSON.stringify(h).toLowerCase();
        return this.normalizeKey(searchableText).includes(normalizedFilter);
      });

      if (filteredHefs.length > 0) {
        const filteredAnchorSize = { ...anchorSize };
        if (filteredAnchorSize["Anchor Size"]) {
          filteredAnchorSize["Anchor Size"]["Effective Embedment Depth (hef)"] =
            filteredHefs;
        } else {
          filteredAnchorSize["Effective Embedment Depth (hef)"] = filteredHefs;
        }
        filteredAnchorSizes.push(filteredAnchorSize);
      }
    });

    return {
      ...data,
      anchorSizes: filteredAnchorSizes,
    };
  }

  /**
   * Normalize keys for comparison
   */
  normalizeKey(s) {
    if (s == null) return "";
    return String(s)
      .normalize()
      .replace(/\s+/g, "")
      .replace(/[(),\-_.]/g, "")
      .replace(/[φϕ]/g, "phi")
      .toLowerCase();
  }

  /**
   * Get field value by candidates
   */
  getField(obj, candidates = []) {
    if (!obj) return undefined;

    // Direct candidate check
    for (const c of candidates) {
      if (Object.prototype.hasOwnProperty.call(obj, c)) return obj[c];
    }

    // Normalized & substring fallback
    const props = Object.keys(obj);
    for (const p of props) {
      const np = this.normalizeKey(p);
      for (const c of candidates) {
        const nc = this.normalizeKey(c);
        if (!nc) continue;

        if (np === nc) return obj[p];
        if (np.includes(nc)) return obj[p];

        const m = p.match(/\(([^)]+)\)/);
        if (m && m[1]) {
          const par = this.normalizeKey(m[1]);
          if (par === nc || par.includes(nc)) return obj[p];
        }
      }
    }
    return undefined;
  }

  /**
   * Get phi value by key
   */
  getPhi(obj, phiKey) {
    if (!obj || !phiKey) return undefined;

    if (Object.prototype.hasOwnProperty.call(obj, phiKey)) return obj[phiKey];

    const target = this.normalizeKey(phiKey);
    const props = Object.keys(obj);

    for (const p of props) {
      if (this.normalizeKey(p) === target) return obj[p];

      const m = p.match(/\(([^)]+)\)/);
      if (m && m[1]) {
        const par = this.normalizeKey(m[1]);
        if (par === target || par.includes(target)) return obj[p];
      }

      if (this.normalizeKey(p).includes(target)) return obj[p];
    }
    return undefined;
  }

  /**
   * Format number for display
   */
  formatNumber(v) {
    if (v === null || v === undefined) return "-";
    if (typeof v === "number") return v.toLocaleString();
    return String(v);
  }

  /**
   * Get total row count for a product
   */
  getTotalRowCount(data) {
    const anchorSizes = data?.anchorSizes || [];
    if (!anchorSizes.length) return 0;

    return anchorSizes.reduce((sum, a) => {
      const anchorSize = a["Anchor Size"] || a.anchorSize || a || {};
      return (
        sum +
        (anchorSize["Effective Embedment Depth (hef)"]?.length ||
          anchorSize.effectiveEmbedmentDepths?.length ||
          0)
      );
    }, 0);
  }
}
