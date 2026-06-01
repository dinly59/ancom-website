/**
 * NavigationView - Handles navigation and view switching
 */
class NavigationView {
  constructor() {
    this.views = {
      home: document.getElementById("homeView"),
      table: document.getElementById("tableView"),
      compare: document.getElementById("compareView"),
    };
    this.navLinks = document.querySelectorAll(".nav-link");
  }

  /**
   * Show a specific view
   */
  showView(viewName) {
    Object.keys(this.views).forEach((key) => {
      if (this.views[key]) {
        this.views[key].style.display = key === viewName ? "block" : "none";
      }
    });

    // Update active nav link
    this.navLinks.forEach((link) => {
      link.classList.toggle("active", link.dataset.page === viewName);
    });
  }

  /**
   * Get current view from URL hash
   */
  getCurrentView() {
    return window.location.hash.slice(1) || "home";
  }
}
