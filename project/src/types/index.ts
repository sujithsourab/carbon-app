import { TreeSpecies } from './treeSpecies';

export interface NDVIData {
  statistics: {
    date: string;
    mean: number;
    vegetatedArea: number;
  };
  raster?: string;
}

export interface NDVITimeSeriesData {
  dates: string[];
  means: number[];
  vegetatedAreas: number[];
  raster: string;
}

export interface CarbonCalculation {
  totalCredits: number;
  yearlyBreakdown: {
    year: number;
    credits: number;
    biomass: number;
    survivingTrees: number;
  }[];
}

export enum AppRoutes {
  HOME = '/',
  LOGIN = '/login',
  SIGNUP = '/signup',
  PORTFOLIO = '/portfolio',
  PROJECT_INFO = '/project-info',
  LOADING = '/loading',
  RESULTS = '/results',
  DASHBOARD = '/dashboard',
  SUMMARY = '/summary',
  RS_ANALYSIS = '/rs-analysis',
  PAI_MANAGEMENT = '/pai-management',
  FOREST_COVER = '/forest-cover',
  CARBON_CALCULATOR = '/carbon-calculator',
  TREE_TAGS = '/tree-tags',
  FINANCIAL_MODEL = '/results/financial-model',
  PERFORMANCE_BENCHMARKING = '/performance-benchmarking'
}

export interface DocumentInfo {
  name: string;
  text: string;
}

export interface ProjectInfo {
  id?: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  methodology: string;
  projectType: string;
  projectStage?: string;
  description: string;
  standard: string;
  extractedText?: string;
  documents?: DocumentInfo[];
  trainingDocuments?: DocumentInfo[];
}

export interface DocumentSection {
  id: string;
  title: string;
  content: string;
  subsections?: DocumentSection[];
}

export interface GeneratedDocument {
  sections: DocumentSection[];
}