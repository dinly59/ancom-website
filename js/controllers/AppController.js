/**
 * AppController - Main application controller
 */
class AppController {
  constructor() {
    this.model = new ProductModel();
    this.navigationView = new NavigationView();
    this.tableView = new TableView(this.model);
    this.compareView = new CompareView(this.model);

    this.tableController = new TableController(this.model, this.tableView);
    this.compareController = new CompareController(this.model, this.compareView);
  }

  /**
   * Initialize the application
   */
  async initialize() {
    try {
      // Load products
      await this.model.initialize();

      // Initialize controllers
      await this.tableController.initialize();
      await this.compareController.initialize();

      // Setup routing
      this.setupRouting();

      // Handle initial route
      this.handleRoute();
    } catch (e) {
      console.error("Failed to initialize application:", e);
    }
  }

  /**
   * Setup routing handlers
   */
  setupRouting() {
    window.addEventListener("hashchange", () => this.handleRoute());
  }

  /**
   * Handle route changes
   */
  handleRoute() {
    const view = this.navigationView.getCurrentView();
    this.navigationView.showView(view);

    // Auto-load first product when entering table view
    if (view === "table") {
      this.tableController.loadFirstProduct();
    }
  }
}

// Initialize application when DOM is ready
window.addEventListener("load", async () => {
  const app = new AppController();
  await app.initialize();
});
