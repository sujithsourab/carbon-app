import { TreeSpecies, CarbonCalculation } from '../types';

export function calculateCarbonCredits(
  species: TreeSpecies,
  numTrees: number,
  plantingYear: number,
  mortalityRate: number,
  spacing: number
): CarbonCalculation {
  const currentYear = new Date().getFullYear();
  const yearsGrown = currentYear - plantingYear;
  const mortality = mortalityRate / 100;

  // Calculate area and density
  const areaPerTree = spacing * spacing; // m²
  const totalArea = (areaPerTree * numTrees) / 10000; // Convert to hectares

  const yearlyBreakdown = Array.from({ length: yearsGrown + 1 }, (_, index) => {
    const year = plantingYear + index;
    const survivingTrees = numTrees * Math.pow(1 - mortality, index);
    const biomassPerTree = species.growthRate * index;
    const totalBiomass = survivingTrees * biomassPerTree;
    
    // Convert biomass to CO₂e
    // Biomass to Carbon: multiply by 0.47 (carbon content)
    // Carbon to CO₂: multiply by 44/12 (molecular weight ratio)
    const credits = totalBiomass * 0.47 * (44/12) / 1000; // Convert to tonnes

    return {
      year,
      credits,
      biomass: totalBiomass,
      survivingTrees
    };
  });

  const totalCredits = yearlyBreakdown[yearlyBreakdown.length - 1].credits;

  return {
    totalCredits,
    yearlyBreakdown
  };
}