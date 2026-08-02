/**
 * Product - Represents a complete product with anchor sizes
 */
class Product {
  constructor(data = {}) {
    this.filename = data.filename || null;
    this.name = data.name || null;
    this.company = data.company || null;
    this.anchorSizes = [];

    const productName = this.getDisplayName();
    const anchorSizeArray = data.anchorSizes || [];
    this.anchorSizes = anchorSizeArray.map(
      (a) => new AnchorSize(a, { productName, filename: this.filename }),
    );
  }

  /**
   * Get display name for product
   */
  getDisplayName() {
    if (this.company && this.name) {
      return `${this.company} - ${this.name}`;
    }

    return "Unnamed Product";
  }

  /**
   * Get all anchor sizes
   */
  getAnchorSizes() {
    return this.anchorSizes.map((a) => a.value);
  }

  /**
  * Get anchor size by value
   */
  getAnchorSizeByValue(sizeValue) {
    return this.anchorSizes.find((a) => a.value === sizeValue);
  }

  /**
   * Get total number of specifications
   */
  getTotalSpecCount() {
    return this.anchorSizes.reduce(
      (sum, a) => sum + a.effectiveEmbedmentDepths.length,
      0,
    );
  }

  /**
   * Check if product supports cracked concrete data (at least 1 hef has crackedConcreteData === true)
   */
  hasCrackedConcreteData() {
    return this.anchorSizes.some((a) =>
      (a.effectiveEmbedmentDepths || []).some(
        (e) => e.crackedConcreteData === true,
      ),
    );
  }

  /**
   * Check if product supports uncracked concrete data (all products support uncracked concrete)
   */
  hasUncrackedConcreteData() {
    return true;
  }

  /**
   * Check if product supports given concrete state ("cracked" or "uncracked")
   */
  supportsConcreteState(state) {
    if (state === "cracked") return this.hasCrackedConcreteData();
    if (state === "uncracked") return this.hasUncrackedConcreteData();
    return true;
  }
}
