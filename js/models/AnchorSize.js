/**
 * AnchorSize - Represents anchor size with embedment depths
 */
class AnchorSize {
  constructor(data = {}, parentContext = {}) {
    this.value = new Parameter("Anchor Size", data.value || null);
    this.effectiveEmbedmentDepths = [];

    // Parse embedment depths
    const hefArray = data["Effective Embedment Depth (hef)"] || [];
    this.effectiveEmbedmentDepths = hefArray.map(
      (hef) =>
        new EffectiveEmbedmentDepth(hef, {
          productName: parentContext.productName,
          filename: parentContext.filename,
          anchorSize: this.value.value,
        }),
    );
  }
}
