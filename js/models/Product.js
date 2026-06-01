/**
 * Product - Represents a complete product with anchor sizes
 */
class Product {
  constructor(data = {}) {
    this.name = data.name || null;
    this.company = data.company || null;
    this.anchorSizes = [];

    const anchorSizeArray = data.anchorSizes || [];
    this.anchorSizes = anchorSizeArray.map((a) => new AnchorSize(a));
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
}
