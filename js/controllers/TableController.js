/**
 * TableController - Controls table view interactions
 */
class TableController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.currentProduct = null;
    this.currentFilter = "";

    this.initElements();
    this.bindEvents();
  }

  /**
   * Initialize DOM elements
   */
  initElements() {
    this.productSelect = document.getElementById("productSelect");
    this.filterInput = document.getElementById("filter");
    this.clearFilterBtn = document.getElementById("clearFilter");
    this.compactToggle = document.getElementById("compactToggle");
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Product selection
    this.productSelect?.addEventListener("change", () =>
      this.handleProductChange(),
    );

    // Filter input
    this.filterInput?.addEventListener("input", () =>
      this.handleFilterChange(),
    );

    // Clear filter button
    this.clearFilterBtn?.addEventListener("click", () =>
      this.handleClearFilter(),
    );

    // Compact mode toggle
    this.compactToggle?.addEventListener("change", (e) =>
      this.handleCompactToggle(e),
    );

    // Connect view event handlers
    this.view.onSort = (columnIndex) => this.handleSort(columnIndex);
    this.view.onPrevPage = () => this.handlePrevPage();
    this.view.onNextPage = () => this.handleNextPage();
  }

  /**
   * Initialize with products
   */
  async initialize() {
    const products = this.model.getProducts();
    this.populateProductSelect(products);
  }

  /**
   * Populate product dropdown
   */
  populateProductSelect(products) {
    if (!this.productSelect) return;

    this.productSelect.innerHTML =
      '<option value="">Select a product...</option>';
    products.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p;
      opt.textContent = p.replace(/\.json$/, "");
      this.productSelect.appendChild(opt);
    });
  }

  /**
   * Load and render first product
   */
  async loadFirstProduct() {
    const products = this.model.getProducts();
    if (products.length > 0 && !this.currentProduct) {
      this.productSelect.value = products[0];
      await this.handleProductChange();
    }
  }

  /**
   * Handle product selection change
   */
  async handleProductChange() {
    const filename = this.productSelect.value;
    if (!filename) return;

    this.view.showLoading();
    try {
      const data = await this.model.loadProduct(filename);
      this.currentProduct = filename;
      this.view.resetPage();
      this.renderTable(data);
      console.log(filename, data);
    } catch (e) {
      this.view.showError(e.message);
    }
  }

  /**
   * Handle filter change
   */
  handleFilterChange() {
    this.currentFilter = this.filterInput.value.trim();
    this.view.resetPage();
    this.reloadCurrentProduct();
  }

  /**
   * Handle clear filter
   */
  handleClearFilter() {
    this.filterInput.value = "";
    this.currentFilter = "";
    this.view.resetSort();
    this.view.resetPage();
    this.reloadCurrentProduct();
  }

  /**
   * Handle compact mode toggle
   */
  handleCompactToggle(e) {
    const compactMode = e.target.checked;
    document.documentElement.classList.toggle("compact", compactMode);
  }

  /**
   * Handle column sort
   */
  handleSort(columnIndex) {
    if (this.view.sortColumn === columnIndex) {
      this.view.sortAscending = !this.view.sortAscending;
    } else {
      this.view.sortColumn = columnIndex;
      this.view.sortAscending = true;
    }
    this.reloadCurrentProduct();
  }

  /**
   * Handle previous page
   */
  handlePrevPage() {
    if (this.view.currentPage > 1) {
      this.view.currentPage--;
      this.reloadCurrentProduct();
    }
  }

  /**
   * Handle next page
   */
  handleNextPage() {
    this.view.currentPage++;
    this.reloadCurrentProduct();
  }

  /**
   * Reload current product with filters
   */
  async reloadCurrentProduct() {
    if (!this.currentProduct) return;

    try {
      const data = await this.model.loadProduct(this.currentProduct);
      this.renderTable(data);
    } catch (e) {
      this.view.showError(e.message);
    }
  }

  /**
   * Render table with current filter
   */
  renderTable(data) {
    this.view.render(data, this.currentFilter);
  }
}
