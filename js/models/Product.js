/**
 * Product - Represents a complete product with anchor sizes
 */
class Product {
  constructor(data = {}) {
    this.filename = data.filename || null;
    this.company = new Parameter("Manufacturer Name", data.company || null);
    this.name = new Parameter("Product", data.name || null);
    this.material = new Parameter("Material", data.material || null);
    this.productImage = new Parameter(
      "Product Image",
      data.productImage || data["Product Image"] || null,
    );
    this.anchorType = data.anchorType || null;
    this.evaluationReport = new Parameter(
      "Evaluation Report",
      data.evaluationReport || null,
    );
    this.dateIssued = new Parameter(
      "Date Issued or Renewed",
      data.dateIssued || data["Date Issued or Renewed"] || null,
    );
    this.dateExpires = new Parameter("Date Expires", data.dateExpires || null);
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
    const comp = this.company?.value;
    const prodName = this.name?.value;
    if (comp && prodName) {
      return `${comp} - ${prodName}`;
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
        (e) => e.crackedConcreteData?.value === true || e.crackedConcreteData?.value === "true",
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
