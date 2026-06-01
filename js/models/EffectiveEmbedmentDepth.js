/**
 * EffectiveEmbedmentDepth - Represents strength and depth specifications
 */
class EffectiveEmbedmentDepth {
  constructor(data = {}) {
    this.value = data.value || null;
    this.drillBitDiameter = data["Drill Bit Diameter"] || null;
    this.nominalEmbedmentDepth = data["Nominal Embedment Depth (hnom)"] || null;
    this.minimumHoleDepth = data["Minimum Hole Depth (hhole)"] || null;
    this.crackedConcreteData = data["Cracked Concrete Data"] || false;
    this.seismicCategories = data["Seismic Categories"] || null;
    this.anchorCategory = data["Anchor Category"] || null;

    // Tension properties
    this.tensionSteelStrength = data["Tension Steel Strength (φNsa)"] || null;
    this.tensionBreakoutUncracked =
      data["Tension Breakout Strength - Uncracked Concrete (φNcb,uncr)"] ||
      null;
    this.tensionBreakoutCracked =
      data["Tension Breakout Strength - Cracked Concrete (φNcb,cr)"] || null;
    this.pulloutUncracked =
      data["Pullout Strength - Uncracked Concrete (φNp,uncr)"] || null;
    this.pulloutCracked =
      data["Pullout Strength - Cracked Concrete (φNp,cr)"] || null;

    // Shear properties
    this.shearSteelStrength = data["Shear Steel Strength (φVsa)"] || null;
    this.pryoutUncracked =
      data["Pryout Strength - Uncracked Concrete (φVcp,uncr)"] || null;
    this.pryoutCracked =
      data["Pryout Strength - Cracked Concrete (φVcp,cr)"] || null;
  }

  /**
   * Get all tension-related strength values
   */
  getTensionValues() {
    return {
      steel: this.tensionSteelStrength,
      uncracked: this.tensionBreakoutUncracked,
      cracked: this.tensionBreakoutCracked,
      pulloutUncracked: this.pulloutUncracked,
      pulloutCracked: this.pulloutCracked,
    };
  }

  /**
   * Get all shear-related strength values
   */
  getShearValues() {
    return {
      steel: this.shearSteelStrength,
      pryoutUncracked: this.pryoutUncracked,
      pryoutCracked: this.pryoutCracked,
    };
  }
}
