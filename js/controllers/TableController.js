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
    this.searchPrevBtn = document.getElementById("searchPrevBtn");
    this.searchNextBtn = document.getElementById("searchNextBtn");
    this.searchMatchCount = document.getElementById("searchMatchCount");
    this.searchSoundToggle = document.getElementById("searchSoundToggle");
    this.soundIconOn = document.getElementById("soundIconOn");
    this.soundIconOff = document.getElementById("soundIconOff");
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

    // Search input (find in table)
    this.filterInput?.addEventListener("input", () =>
      this.handleSearchInput(),
    );

    // Keyboard navigation (Enter = Next, Shift+Enter = Prev, Esc = Clear)
    this.filterInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) {
          this.view.prevMatch();
        } else {
          this.view.nextMatch();
        }
      } else if (e.key === "Escape") {
        this.handleClearFilter();
      }
    });

    // Next / Prev button controls
    this.searchNextBtn?.addEventListener("click", () => this.view.nextMatch());
    this.searchPrevBtn?.addEventListener("click", () => this.view.prevMatch());

    // Sound toggle control
    this.searchSoundToggle?.addEventListener("click", () => {
      const isEnabled = this.view.toggleSound();
      if (this.soundIconOn && this.soundIconOff) {
        this.soundIconOn.classList.toggle("hidden", !isEnabled);
        this.soundIconOff.classList.toggle("hidden", isEnabled);
      }
      if (isEnabled) {
        this.view.playJumpSound();
      }
    });

    // Clear search button
    this.clearFilterBtn?.addEventListener("click", () =>
      this.handleClearFilter(),
    );

    // Match status changes from view
    this.view.onSearchMatchChange = (status) => this.updateSearchStatus(status);

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
      const filename = typeof p === "string" ? p : (p.filename || p.name);
      const label =
        typeof p === "object" && typeof p.getDisplayName === "function"
          ? p.getDisplayName()
          : typeof p === "string"
            ? p.replace(/\.json$/, "")
            : p.name || p.filename;
      opt.value = filename;
      opt.textContent = label;
      this.productSelect.appendChild(opt);
    });
  }

  /**
   * Load and render first product
   */
  async loadFirstProduct() {
    const products = this.model.getProducts();
    if (products.length > 0 && !this.currentProduct) {
      const first = products[0];
      const filename =
        typeof first === "string" ? first : first.filename || first.name;
      this.productSelect.value = filename;
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
      const data = await this.model.loadProductSchema(filename);
      this.currentProduct = filename;
      this.view.resetPage();
      this.renderTable(data);
      console.log(filename, data);
    } catch (e) {
      this.view.showError(e.message);
    }
  }

  /**
   * Handle search input typing
   */
  handleSearchInput() {
    const query = this.filterInput?.value || "";
    this.currentFilter = query.trim();
    if (this.currentFilter) {
      this.view.findMatches(this.currentFilter);
    } else {
      this.view.clearSearch();
    }
  }

  /**
   * Handle clear search
   */
  handleClearFilter() {
    if (this.filterInput) {
      this.filterInput.value = "";
    }
    this.currentFilter = "";
    this.view.clearSearch();
    this.filterInput?.focus();
  }

  /**
   * Update search badge counter and Prev/Next button states
   */
  updateSearchStatus({ current, total, query }) {
    if (!this.searchMatchCount) return;

    if (!query) {
      this.searchMatchCount.classList.add("hidden");
      this.searchMatchCount.textContent = "0 of 0";
      if (this.searchPrevBtn) this.searchPrevBtn.disabled = true;
      if (this.searchNextBtn) this.searchNextBtn.disabled = true;
      return;
    }

    this.searchMatchCount.classList.remove("hidden");
    if (total > 0) {
      this.searchMatchCount.textContent = `${current} of ${total}`;
      this.searchMatchCount.className =
        "text-xs font-bold text-black bg-slate-100 px-2 py-0.5 rounded border border-slate-300";
      if (this.searchPrevBtn) this.searchPrevBtn.disabled = false;
      if (this.searchNextBtn) this.searchNextBtn.disabled = false;
    } else {
      this.searchMatchCount.textContent = "0 of 0";
      this.searchMatchCount.className =
        "text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200";
      if (this.searchPrevBtn) this.searchPrevBtn.disabled = true;
      if (this.searchNextBtn) this.searchNextBtn.disabled = true;
    }
  }

  /**
   * Handle compact mode toggle
   */
  handleCompactToggle(e) {
    const compactMode = e.target.checked;
    document.documentElement.classList.toggle("compact", compactMode);
    this.reloadCurrentProduct();
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
      const data = await this.model.loadProductSchema(this.currentProduct);
      this.renderTable(data);
    } catch (e) {
      this.view.showError(e.message);
    }
  }

  /**
   * Render table and apply in-table search
   */
  renderTable(data) {
    const compactMode = this.compactToggle?.checked || false;
    this.view.render(data, "", compactMode);
    if (this.currentFilter) {
      this.view.findMatches(this.currentFilter, false);
    }
  }
}
