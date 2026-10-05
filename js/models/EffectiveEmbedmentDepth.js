/**
 * EffectiveEmbedmentDepth - Represents strength and depth specifications
 */
class EffectiveEmbedmentDepth {
  constructor(data = {}, context = {}) {
    this.value = new Parameter(
      "Effective Embedment Depth (hef)",
      data.value || null,
    );
    this.productName = context.productName || data.productName || null;
    this.filename = context.filename || data.filename || null;
    this.anchorSize =
      context.anchorSize || data["Anchor Size"] || data.anchorSize || null;
    this.drillBitDiameter = new Parameter("Drill Bit Diameter", data["Drill Bit Diameter"] || null);
    this.nominalEmbedmentDepth = new Parameter("Nominal Embedment Depth (hnom)", data["Nominal Embedment Depth (hnom)"] || null);
    this.minimumHoleDepth = new Parameter("Minimum Hole Depth (hhole)", data["Minimum Hole Depth (hhole)"] || null);
    this.headType = new Parameter("Head Type", data["Head Type"] || null);
    this.crackedConcreteData = new Parameter(
      "Cracked Concrete Data",
      data["Cracked Concrete Data"] === true || data["Cracked Concrete Data"] === "true"
    );
    this.seismicCategories = new Parameter("Seismic Categories", data["Seismic Categories"] || null);
    this.anchorCategory = new Parameter("Anchor Category", data["Anchor Category"] || null);

    // Installation properties
    this.cmin = new Parameter("cmin (Minimum Edge Distance)", data["cmin (Minimum Edge Distance)"] || null);
    this.cminForS = new Parameter("for s ≥", data["for s ≥"] || null);
    this.smin = new Parameter("smin (Minimum Spacing Distance)", data["smin (Minimum Spacing Distance)"] || null);
    this.sminForC = new Parameter("for c ≥", data["for c ≥"] || null);
    this.hmin = new Parameter("hmin (Minimum Concrete Thickness)", data["hmin (Minimum Concrete Thickness)"] || null);

    // Tension properties
    this.anchorSteelElementDuctility = new Parameter("Anchor Steel Element Ductility", data["Anchor Steel Element Ductility"] || null);
    this.steelStrengthInTension = new Parameter("Steel Strength in Tension (Nsa)", data["Steel Strength in Tension (Nsa)"] || null);
    this.strengthReductionFactorSteelTension = new Parameter("Strength Reduction Factor - Steel Tension", data["Strength Reduction Factor - Steel Tension"] || null);
    this.tensionSteelStrength = new Parameter("Tension Steel Strength (φNsa)", data["Tension Steel Strength (φNsa)"] || null);

    this.effectivenessFactorUncracked = new Parameter("Effectiveness Factor - Uncracked Concrete (kuncr)", data["Effectiveness Factor - Uncracked Concrete (kuncr)"] || null);
    this.effectivenessFactorCracked = new Parameter("Effectiveness Factor - Cracked Concrete (kcr)", data["Effectiveness Factor - Cracked Concrete (kcr)"] || null);
    this.strengthReductionFactorBreakoutTension = new Parameter("Strength Reduction Factor - Breakout Tension", data["Strength Reduction Factor - Breakout Tension"] || null);

    this.tensionBreakoutUncracked = new Parameter("Tension Breakout Strength - Uncracked Concrete (φNcb,uncr)", data["Tension Breakout Strength - Uncracked Concrete (φNcb,uncr)"] || null);
    this.tensionBreakoutCracked = new Parameter("Tension Breakout Strength - Cracked Concrete (φNcb,cr)", data["Tension Breakout Strength - Cracked Concrete (φNcb,cr)"] || null);
    this.tensionBreakoutSeismic = new Parameter("Tension Breakout Strength - Seismic (0.75φNcb)", data["Tension Breakout Strength - Seismic (0.75φNcb)"] || null);

    this.pulloutResistanceUncracked = new Parameter("Pullout Resistance - Uncracked Concrete (Np,uncr)", data["Pullout Resistance - Uncracked Concrete (Np,uncr)"] || null);
    this.pulloutResistanceCracked = new Parameter("Pullout Resistance - Cracked Concrete (Np,cr)", data["Pullout Resistance - Cracked Concrete (Np,cr)"] || null);
    this.pulloutResistanceSeismic = new Parameter("Pullout Resistance - Seismic (Np,eq)", data["Pullout Resistance - Seismic (Np,eq)"] || null);

    this.strengthReductionFactorPullout = new Parameter("Strength Reduction Factor - Pullout", data["Strength Reduction Factor - Pullout"] || null);
    this.pulloutUncracked = new Parameter("Pullout Strength - Uncracked Concrete (φNp,uncr)", data["Pullout Strength - Uncracked Concrete (φNp,uncr)"] || null);
    this.pulloutCracked = new Parameter("Pullout Strength - Cracked Concrete (φNp,cr)", data["Pullout Strength - Cracked Concrete (φNp,cr)"] || null);
    this.pulloutSeismic = new Parameter("Pullout Strength - Seismic (0.75φNp,eq)", data["Pullout Strength - Seismic (0.75φNp,eq)"] || null);

    // Shear properties
    this.steelStrengthInShear = new Parameter("Steel Strength in Shear (Vsa)", data["Steel Strength in Shear (Vsa)"] || null);
    this.strengthReductionFactorSteelShear = new Parameter("Strength Reduction Factor - Steel Shear", data["Strength Reduction Factor - Steel Shear"] || null);
    this.shearSteelStrength = new Parameter("Shear Steel Strength (φVsa)", data["Shear Steel Strength (φVsa)"] || null);

    this.coefficientForPryoutStrength = new Parameter("Coefficient for Pryout Strength (kcp)", data["Coefficient for Pryout Strength (kcp)"] || null);
    this.strengthReductionFactorPryout = new Parameter("Strength Reduction Factor - Pryout", data["Strength Reduction Factor - Pryout"] || null);

    this.pryoutUncracked = new Parameter("Pryout Strength - Uncracked Concrete (φVcp,uncr)", data["Pryout Strength - Uncracked Concrete (φVcp,uncr)"] || null);
    this.pryoutCracked = new Parameter("Pryout Strength - Cracked Concrete (φVcp,cr)", data["Pryout Strength - Cracked Concrete (φVcp,cr)"] || null);

    this.seismicSteelStrengthInShear = new Parameter("Seismic Steel Strength in Shear (Vsa,eq)", data["Seismic Steel Strength in Shear (Vsa,eq)"] || null);
    this.seismicStrengthReductionFactorSteelShear = new Parameter("Seismic_Strength Reduction Factor - Steel Shear", data["Seismic_Strength Reduction Factor - Steel Shear"] || null);
    this.seismicShearSteelStrength = new Parameter("Seismic_Shear Steel Strength (φVsa)", data["Seismic_Shear Steel Strength (φVsa)"] || null);



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
      this.isValidVal(this.tensionBreakoutCracked?.value) ||
      this.isValidVal(this.pulloutCracked?.value) ||
      this.isValidVal(this.pryoutCracked?.value)
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
    const hefLabel = `hef: ${this.value?.value}`;
    const locationStr = [productLabel, sizeLabel, hefLabel]
      .filter(Boolean)
      .join(" | ");

    // Conflict 1: Flag claims cracked concrete supported, but no valid cracked strength values exist
    if (this.crackedConcreteData?.value && !hasCrackedStrength) {
      const msg = `Database Data Conflict Error [${locationStr}]: has "Cracked Concrete Data": true, but no valid cracked strength values exist (all are NP, null, or invalid). Please fix the database file.`;
      console.error(msg);
      if (typeof window !== "undefined" && typeof window.alert === "function") {
        window.alert(msg);
      }
    }

    // Conflict 2: Flag claims cracked concrete NOT supported (false), but valid cracked strength values exist
    if (!this.crackedConcreteData?.value && hasCrackedStrength) {
      const msg = `Database Data Conflict Error [${locationStr}]: has "Cracked Concrete Data": false, but contains valid cracked strength values. Please fix the database file.`;
      console.error(msg);
      if (typeof window !== "undefined" && typeof window.alert === "function") {
        window.alert(msg);
      }
    }

    // Conflict 3: Flag claims cracked concrete supported (true), but one of the cracked strength values is "NP"
    const hasNPInCrackedStrength =
      this.tensionBreakoutCracked?.value === "NP" ||
      this.pulloutCracked?.value === "NP" ||
      this.pryoutCracked?.value === "NP";

    if (this.crackedConcreteData?.value && hasNPInCrackedStrength) {
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
