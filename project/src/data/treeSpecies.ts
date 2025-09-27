import { TreeSpecies } from '../types';

export const treeSpecies: TreeSpecies[] = [
  {
    id: '1',
    name: 'Grevillea robusta',
    scientificName: 'Grevillea robusta',
    growthRate: 15.2, // kg biomass per year
    description: 'Fast-growing tree with good timber value and soil improvement properties.',
    nativeRegions: ['Australia'],
    optimalSpacing: 3,
    mortalityRate: 0.15
  },
  {
    id: '2',
    name: 'Eucalyptus',
    scientificName: 'Eucalyptus spp.',
    growthRate: 18.5,
    description: 'Fast-growing species with high carbon sequestration potential.',
    nativeRegions: ['Australia', 'Southeast Asia'],
    optimalSpacing: 3,
    mortalityRate: 0.12
  },
  {
    id: '3',
    name: 'Black Wattle',
    scientificName: 'Acacia mearnsii',
    growthRate: 12.8,
    description: 'Nitrogen-fixing tree with good biomass production.',
    nativeRegions: ['Australia'],
    optimalSpacing: 2.5,
    mortalityRate: 0.18
  },
  {
    id: '4',
    name: 'Markhamia',
    scientificName: 'Markhamia lutea',
    growthRate: 10.5,
    description: 'Indigenous tree with multiple uses and good adaptation.',
    nativeRegions: ['East Africa'],
    optimalSpacing: 4,
    mortalityRate: 0.2
  },
  {
    id: '5',
    name: 'East African Cordia',
    scientificName: 'Cordia africana',
    growthRate: 11.2,
    description: 'Valuable timber tree with good growth characteristics.',
    nativeRegions: ['East Africa', 'Central Africa'],
    optimalSpacing: 4,
    mortalityRate: 0.17
  }
];