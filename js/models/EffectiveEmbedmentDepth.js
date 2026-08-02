/**
 * EffectiveEmbedmentDepth - Represents strength and depth specifications
 */
class EffectiveEmbedmentDepth {
  constructor(data = {}, context = {}) {
    this.value = data.value || null;
    this.productName = context.productName || data.productName || null;
    this.filename = context.filename || data.filename || null;
    this.anchorSize = context.anchorSize || data["Anchor Size"] || data.anchorSize || null;
    this.drillBitDiameter = data["Drill Bit Diameter"] || null;
    this.nominalEmbedmentDepth = data["Nominal Embedment Depth (hnom)"] || null;
    this.minimumHoleDepth = data["Minimum Hole Depth (hhole)"] || null;
    this.crackedConcreteData =
      data["Cracked Concrete Data"] === true ||
      data["Cracked Concrete Data"] === "true";
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

    // Validate consistency between cracked flag and cracked strength values
    this.validateData();
  }

  /**
   * Helper to check if a strength value is a valid positive number
   */
  isValidVal(v) {
    return (
      v !== null &&
      v !== undefined &&
      v !== "" &&
      v !== "NP" &&
      !Number.isNaN(Number(v)) &&
      Number(v) > 0
    );
  }

  /**
   * Check if at least one cracked strength value is valid
   */
  hasValidCrackedStrength() {
    return (
      this.isValidVal(this.tensionBreakoutCracked) ||
      this.isValidVal(this.pulloutCracked) ||
      this.isValidVal(this.pryoutCracked)
    );
  }

  /**
   * Validate data consistency and notify on conflict
   */
  validateData() {
    const hasCrackedStrength = this.hasValidCrackedStrength();

    const productLabel = this.productName
      ? `Product: "${this.productName}"`
      : this.filename
        ? `File: "${this.filename}"`
        : "";
    const sizeLabel = this.anchorSize ? `Dia: ${this.anchorSize}` : "";
    const hefLabel = `hef: ${this.value}`;
    const locationStr = [productLabel, sizeLabel, hefLabel]
      .filter(Boolean)
      .join(" | ");

    // Conflict 1: Flag claims cracked concrete supported, but no valid cracked strength values exist
    if (this.crackedConcreteData && !hasCrackedStrength) {
      const msg = `Database Data Conflict Error [${locationStr}]: has "Cracked Concrete Data": true, but no valid cracked strength values exist (all are NP, null, or invalid). Please fix the database file.`;
      console.error(msg);
      if (typeof window !== "undefined" && typeof window.alert === "function") {
        window.alert(msg);
      }
    }

    // Conflict 2: Flag claims cracked concrete NOT supported (false), but valid cracked strength values exist
    if (!this.crackedConcreteData && hasCrackedStrength) {
      const msg = `Database Data Conflict Error [${locationStr}]: has "Cracked Concrete Data": false, but contains valid cracked strength values. Please fix the database file.`;
      console.error(msg);
      if (typeof window !== "undefined" && typeof window.alert === "function") {
        window.alert(msg);
      }
    }

    // Conflict 3: Flag claims cracked concrete supported (true), but one of the cracked strength values is "NP"
    const hasNPInCrackedStrength =
      this.tensionBreakoutCracked === "NP" ||
      this.pulloutCracked === "NP" ||
      this.pryoutCracked === "NP";

    if (this.crackedConcreteData && hasNPInCrackedStrength) {
      const msg = `Database Data Conflict Warning [${locationStr}]: has "Cracked Concrete Data": true, but one of its cracked strength values is set to "NP". Please check/fix the database file.`;
      console.error(msg);
      if (typeof window !== "undefined" && typeof window.alert === "function") {
        window.alert(msg);
      }
    }
  }

  /**
   * Check if this embedment depth supports cracked concrete
   */
  supportsCrackedConcrete() {
    return this.crackedConcreteData && this.hasValidCrackedStrength();
  }

  /**
   * Check if this embedment depth supports uncracked concrete
   */
  supportsUncrackedConcrete() {
    return true;
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
