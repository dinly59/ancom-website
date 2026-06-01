/**
 * AnchorSize - Represents anchor size with embedment depths
 */
class AnchorSize {
  constructor(data = {}) {
    this.value = data.value || null;
    this.effectiveEmbedmentDepths = [];

    // Parse embedment depths
    const hefArray = data["Effective Embedment Depth (hef)"] || [];
    this.effectiveEmbedmentDepths = hefArray.map(
      (hef) => new EffectiveEmbedmentDepth(hef),
    );
  }

  /**
   * Get embedment depth by value
   */
  getEmbedmentByValue(val) {
    return this.effectiveEmbedmentDepths.find((e) => e.value === val);
  }

  /**
   * Get all embedment depth values
   */
  getEmbedmentValues() {
    return this.effectiveEmbedmentDepths.map((e) => e.value);
  }
}
