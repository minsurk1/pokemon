export const typeChart: Record<string, Record<string, number>> = {
  normal: { normal: 1, fire: 1, water: 1, electric: 1, ice: 1, poison: 1, land: 1, esper: 1, fly: 1, forest: 1, legend: 0.5, worm: 1 },
  fire: { normal: 1, fire: 0.5, water: 0.5, electric: 1, ice: 1.5, poison: 1, land: 1, esper: 1, fly: 1, forest: 1.5, legend: 1, worm: 1.5 },
  water: { normal: 1, fire: 1.5, water: 1, electric: 0.5, ice: 1, poison: 1, land: 1.5, esper: 1, fly: 1, forest: 0.5, legend: 1, worm: 1 },
  electric: { normal: 1, fire: 1, water: 1.5, electric: 1, ice: 1, poison: 1, land: 0, esper: 1, fly: 1.5, forest: 0.5, legend: 1, worm: 1 },
  ice: { normal: 1, fire: 0.5, water: 0.5, electric: 1, ice: 0.5, poison: 1, land: 1.5, esper: 1, fly: 1.5, forest: 1.5, legend: 1, worm: 1 },
  poison: { normal: 1, fire: 1, water: 1, electric: 1, ice: 1, poison: 0.5, land: 0.5, esper: 0.5, fly: 1, forest: 1.5, legend: 0.5, worm: 1 },
  land: { normal: 1, fire: 1.5, water: 0.5, electric: 1.5, ice: 1, poison: 1.5, land: 1, esper: 1, fly: 0, forest: 1.5, legend: 1, worm: 1 },
  esper: { normal: 1, fire: 1, water: 1, electric: 1, ice: 1, poison: 1.5, land: 1, esper: 0.5, fly: 1, forest: 1, legend: 1, worm: 0.5 },
  fly: { normal: 1, fire: 1, water: 1, electric: 0.5, ice: 0.5, poison: 1, land: 1.5, esper: 1, fly: 1, forest: 1.5, legend: 1, worm: 1.5 },
  forest: { normal: 1, fire: 0.5, water: 1.5, electric: 1, ice: 1, poison: 0.5, land: 0.5, esper: 1, fly: 0.5, forest: 1, legend: 1, worm: 0.5 },
  legend: { normal: 1.5, fire: 1.5, water: 1.5, electric: 1.5, ice: 1.5, poison: 1.5, land: 1.5, esper: 1.5, fly: 1.5, forest: 1.5, legend: 1, worm: 1.5 },
  worm: { normal: 1, fire: 0.5, water: 1, electric: 1, ice: 0.5, poison: 1, land: 1, esper: 1.5, fly: 0.5, forest: 1.5, legend: 1, worm: 1 },
};
