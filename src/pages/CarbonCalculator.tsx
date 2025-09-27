import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { ArrowLeft, Calculator, Info, Plus, Trash2 } from 'lucide-react';
import { AppRoutes } from '../types';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// ===== Types =====
type RegionType = 'dry' | 'moist';
type DensityMode = 'spacing' | 'density';
type ScheduleMode = 'constant' | 'custom';

interface SpeciesRow {
  id: string;
  name: string;
  region: RegionType;
  percent: string;          // % of total project area (used to split each year's planted area)
  inputMode: DensityMode;
  spacing?: string;         // meters (if spacing)
  density?: string;         // trees/ha (if density)
  growthRateCmYr?: string;  // optional override (cm/yr)
  initialDbhCm?: string;    // DBH at year 0 (cm)

  // NEW: custom biomass equation
  useCustomEq?: boolean;    // if true, use customEquation instead of default allometry
  customEquation?: string;  // e.g., exp(-1.996 + 2.32*ln(D))
}

interface YearRecord {
  year: number;
  credits: number;          // total tCO2e that year (all species, all cohorts)
  biomassKg: number;
  survivingTrees: number;
  perSpecies: Array<{
    speciesId: string;
    name: string;
    credits: number;
    biomassKg: number;
    survivingTrees: number;
    dbhCm: number;          // age-specific DBH (info)
  }>;
}

interface CalcResult {
  totalCredits: number;     // cumulative tCO2e across modeled years
  yearlyBreakdown: YearRecord[];
  speciesSummary: Array<{ speciesId: string; name: string; totalCredits: number }>; // cumulative per species
}

// ===== Helpers =====
const exp = Math.exp;
const ln = Math.log;

function defaultAllometryBiomassKg(D_cm: number, region: RegionType): number {
  // D in cm, biomass in kg/tree
  // Dry:  exp(-1.996 + 2.32 * ln(D))
  // Moist: exp(-2.134 + 2.530 * ln(D))
  if (!D_cm || isNaN(D_cm) || D_cm <= 0) return 0;
  return region === 'dry' ? exp(-1.996 + 2.32 * ln(D_cm)) : exp(-2.134 + 2.530 * ln(D_cm));
}

function kgBiomassToTonsCO2e(biomassKg: number): number {
  // Biomass→C (0.47) → CO2 (44/12) → tonnes
  return (biomassKg * 0.47 * (44 / 12)) / 1000;
}

function densityFromSpacing(spacingMeters: number): number {
  if (!spacingMeters || spacingMeters <= 0) return 0;
  return 10000 / (spacingMeters * spacingMeters);
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// >>> NEW: format helper for CO2e numbers (commas + 2 decimals)
const fmt2 = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Very small, guarded expression “evaluator” for biomass equations.
// Accepts: numbers, + - * / ( ), commas, decimal points,
// symbol D (dbh, cm), and functions: exp( ), ln( ), sqrt( ), pow(a,b), min(a,b), max(a,b).
// It rejects anything else and then maps to Math.* before computing.
// If evaluation fails, returns NaN (caller will fallback to default allometry).
function evalBiomassExpr(D: number, exprRaw: string): number {
  if (!exprRaw) return NaN;
  let expr = exprRaw.trim();

  // Quick guard: only allow whitelisted characters/tokens
  // Note: case-insensitive match for function names and D
  const allowed = /^[0-9+\-*/().,\sDdepxowlnqrtmacs]*$/i; // covers digits, ops, whitespace, D, and function letters
  if (!allowed.test(expr)) return NaN;

  // Normalize spacing and lowercase function names while preserving D
  // Replace function tokens with Math.* equivalents
  // We intentionally DO NOT support '^' to avoid ambiguity; encourage pow(a,b)
  expr = expr
    .replace(/ln\s*\(/gi, 'Math.log(')
    .replace(/exp\s*\(/gi, 'Math.exp(')
    .replace(/sqrt\s*\(/gi, 'Math.sqrt(')
    .replace(/pow\s*\(/gi, 'Math.pow(')
    .replace(/min\s*\(/gi, 'Math.min(')
    .replace(/max\s*\(/gi, 'Math.max(');

  // Replace standalone D with (D) to avoid e.g. "Dexp" collisions (already filtered above)
  // Use word boundary to minimize false positives
  expr = expr.replace(/\bD\b/g, '(D)');

  // Last guard: reject "constructor", "__proto__", "prototype", "=>", "new", etc.
  if (/(constructor|__proto__|prototype|=>|new\s)/i.test(expr)) return NaN;

  try {
    // Only D is provided to the function scope.
    // eslint-disable-next-line no-new-func
    const fn = new Function('D', `return (${expr});`);
    const val = fn(D);
    if (typeof val !== 'number' || !isFinite(val)) return NaN;
    return val;
  } catch {
    return NaN;
  }
}

// Nice distinct colors for species lines (Total uses green)
const SERIES_COLORS = [
  'rgba(53, 162, 235, 1)',
  'rgba(255, 99, 132, 1)',
  'rgba(255, 159, 64, 1)',
  'rgba(153, 102, 255, 1)',
  'rgba(201, 203, 207, 1)',
  'rgba(255, 205, 86, 1)',
  'rgba(99, 255, 132, 1)',
  'rgba(132, 99, 255, 1)',
];

export function CarbonCalculator() {
  const navigate = useNavigate();

  // Project-level params
  const [projectAreaHa, setProjectAreaHa] = useState<string>(''); // Reference area (for sanity checks/UI)
  const [plantingYear, setPlantingYear] = useState<string>(new Date().getFullYear().toString());
  const [creditingEndYear, setCreditingEndYear] = useState<string>((new Date().getFullYear() + 20).toString());
  const [mortalityRate, setMortalityRate] = useState<string>('');  // %/yr
  const [considerMortality, setConsiderMortality] = useState<'yes' | 'no'>('yes');
  const [defaultGrowthRate, setDefaultGrowthRate] = useState<string>('0.2'); // cm/yr
  const [forceYearZeroZero, setForceYearZeroZero] = useState<boolean>(true);

  // Planting schedule
  const [useSchedule, setUseSchedule] = useState<boolean>(false);
  const [scheduleYears, setScheduleYears] = useState<string>('5'); // number of years planting continues (from planting year)
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('custom');
  const [constantAreaPerYear, setConstantAreaPerYear] = useState<string>(''); // used if scheduleMode === 'constant'
  const [customSchedule, setCustomSchedule] = useState<Array<{ year: number; areaHa: string }>>([]);

  // Species rows
  const [rows, setRows] = useState<SpeciesRow[]>([
    { id: uid(), name: '', region: 'dry', percent: '', inputMode: 'spacing', spacing: '', growthRateCmYr: '', initialDbhCm: '0', useCustomEq: false, customEquation: '' }
  ]);

  // Results
  const [calc, setCalc] = useState<CalcResult | null>(null);
  const chartRef = useRef<ChartJS | null>(null);

  // Keep chart resource clean
  useEffect(() => { if (chartRef.current) chartRef.current.destroy(); }, [calc]);

  // Initialize or refresh the schedule table whenever config changes meaningfully
  useEffect(() => {
    if (!useSchedule) { setCustomSchedule([]); return; }
    const py = parseInt(plantingYear || '0', 10);
    const n = clamp(parseInt(scheduleYears || '0', 10), 0, 200);
    const rowsBuilt: Array<{ year: number; areaHa: string }> = [];
    for (let i = 0; i < n; i++) {
      const y = py + i;
      const prev = customSchedule.find(r => r.year === y);
      rowsBuilt.push({ year: y, areaHa: prev ? prev.areaHa : '' });
    }
    setCustomSchedule(rowsBuilt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useSchedule, plantingYear, scheduleYears, scheduleMode]);

  const yearsSpan = useMemo(() => {
    const py = parseInt(plantingYear || '0', 10);
    const ey = parseInt(creditingEndYear || '0', 10);
    return clamp(ey - py, 0, 300); // inclusive loop will be 0..span
  }, [plantingYear, creditingEndYear]);

  const totalPercent = useMemo(
    () => rows.reduce((sum, r) => sum + (parseFloat(r.percent || '0') || 0), 0),
    [rows]
  );

  // Row helpers
  const addRow = () => setRows(prev => [
    ...prev,
    { id: uid(), name: '', region: 'dry', percent: '', inputMode: 'spacing', spacing: '', growthRateCmYr: '', initialDbhCm: '0', useCustomEq: false, customEquation: '' }
  ]);
  const removeRow = (id: string) => setRows(prev => prev.filter(r => r.id !== id));
  const updateRow = (id: string, patch: Partial<SpeciesRow>) =>
    setRows(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));

  // Validation
  const validate = (): string | null => {
    if (!plantingYear) return 'Enter planting year.';
    if (!creditingEndYear) return 'Enter project crediting end year.';
    const py = parseInt(plantingYear, 10);
    const ey = parseInt(creditingEndYear, 10);
    if (isNaN(py) || isNaN(ey)) return 'Years must be numbers.';
    if (ey < py) return 'End year must be ≥ planting year.';

    if (rows.length === 0) return 'Add at least one species.';
    if (totalPercent <= 0) return 'Species % must be > 0.';
    if (totalPercent > 100) return 'Species % sum cannot exceed 100%.';
    for (const r of rows) {
      if (!r.name) return 'Each species row needs a name.';
      if (!r.percent) return `Enter % area for "${r.name}".`;
      if (r.inputMode === 'spacing' && !r.spacing) return `Enter spacing (m) for "${r.name}".`;
      if (r.inputMode === 'density' && !r.density) return `Enter density (trees/ha) for "${r.name}".`;
      if (r.useCustomEq && !r.customEquation) return `Enter a biomass equation for "${r.name}" or turn off "custom".`;
    }

    if (useSchedule) {
      const n = clamp(parseInt(scheduleYears || '0', 10), 0, 200);
      if (n <= 0) return 'Schedule years must be > 0.';
      if (scheduleMode === 'constant') {
        if (!constantAreaPerYear) return 'Enter constant area per year (ha).';
      } else {
        if (customSchedule.length !== n) return 'Schedule rows did not initialize correctly.';
        const anyMissing = customSchedule.some(r => r.areaHa === '' || parseFloat(r.areaHa) < 0);
        if (anyMissing) return 'Enter non-negative area (ha) for each schedule year.';
      }
    } else {
      if (!projectAreaHa) return 'Enter Total Project Area (ha).';
    }
    return null;
  };

  // Calculation
  const calculate = () => {
    const err = validate();
    if (err) { alert(err); return; }

    const py = parseInt(plantingYear, 10);
    const ey = parseInt(creditingEndYear, 10);
    const nYears = ey - py; // loop 0..nYears inclusive

    // mortality handling
    const mortFrac = clamp(parseFloat(mortalityRate || '0') / 100, 0, 1);
    const mort = considerMortality === 'yes' ? mortFrac : 0;

    const defaultGR = parseFloat(defaultGrowthRate || '0.2');

    // Build per-year planted area schedule (ha)
    const scheduled: Array<{ year: number; areaHa: number }> = [];
    if (useSchedule) {
      const n = clamp(parseInt(scheduleYears || '0', 10), 0, 200);
      for (let i = 0; i < n; i++) {
        const y = py + i;
        const area =
          scheduleMode === 'constant'
            ? (parseFloat(constantAreaPerYear || '0') || 0)
            : (parseFloat(customSchedule.find(r => r.year === y)?.areaHa || '0') || 0);
        scheduled.push({ year: y, areaHa: Math.max(0, area) });
      }
    } else {
      const areaTotal = parseFloat(projectAreaHa || '0') || 0;
      scheduled.push({ year: py, areaHa: Math.max(0, areaTotal) });
    }

    // Precompute species static values
    const speciesSetup = rows.map(r => {
      const densityHa =
        r.inputMode === 'density'
          ? Math.max(0, parseFloat(r.density || '0'))
          : densityFromSpacing(parseFloat(r.spacing || '0'));
      const gr = parseFloat(r.growthRateCmYr || '') || defaultGR;
      const d0 = parseFloat(r.initialDbhCm || '0') || 0;

      // Build evaluator for this species: custom or default
      const useCustom = !!r.useCustomEq && !!r.customEquation;
      const eq = (D: number) => {
        if (useCustom) {
          const v = evalBiomassExpr(D, r.customEquation || '');
          if (!isNaN(v) && v >= 0) return v;
          // if invalid, silently fall back to default (also helps during typing)
        }
        return defaultAllometryBiomassKg(D, r.region);
      };

      return {
        id: r.id,
        name: r.name || 'Unnamed',
        region: r.region as RegionType,
        percent: clamp(parseFloat(r.percent || '0'), 0, 100),
        densityHa,
        growthRateCmYr: gr,
        initialDbhCm: d0,
        biomassFn: eq
      };
    });

    const yearly: YearRecord[] = [];

    // For each model year g (0..nYears), sum across cohorts (schedule years) and species
    for (let g = 0; g <= nYears; g++) {
      const year = py + g;

      let totalBiomassKg = 0;
      let totalCreditsT = 0;
      let totalTrees = 0;

      const perSpeciesAgg = speciesSetup.map(s => ({
        speciesId: s.id,
        name: s.name,
        credits: 0,
        biomassKg: 0,
        survivingTrees: 0,
        dbhCm: 0
      }));

      scheduled.forEach(sch => {
        const cohortStartIdx = sch.year - py; // offset into model years
        if (cohortStartIdx > g) return; // cohort not planted yet
        const cohortAge = g - cohortStartIdx;

        speciesSetup.forEach((sp, idx) => {
          if (sp.percent <= 0) return;

          // area allocated to this species in this cohort (ha)
          const areaForSpeciesHa = (sp.percent / 100) * sch.areaHa;

          // initial trees for this cohort & species
          const initialTrees = areaForSpeciesHa * sp.densityHa;

          // surviving trees at age with (optional) mortality
          const surviving = initialTrees * Math.pow(1 - mort, cohortAge);

          // DBH at this age
          let dbh = sp.initialDbhCm + sp.growthRateCmYr * cohortAge;
          if (forceYearZeroZero && cohortAge === 0) dbh = 0;

          // biomass per tree via species-specific fn (custom or default)
          const biomassPerTreeKg = sp.biomassFn(dbh);
          let speciesBiomassKg = biomassPerTreeKg * surviving;
          if (forceYearZeroZero && cohortAge === 0) speciesBiomassKg = 0;

          const speciesCO2eT = kgBiomassToTonsCO2e(speciesBiomassKg);

          totalBiomassKg += speciesBiomassKg;
          totalCreditsT += speciesCO2eT;
          totalTrees += surviving;

          perSpeciesAgg[idx].credits += speciesCO2eT;
          perSpeciesAgg[idx].biomassKg += speciesBiomassKg;
          perSpeciesAgg[idx].survivingTrees += surviving;
          perSpeciesAgg[idx].dbhCm = dbh;
        });
      });

      yearly.push({ year, credits: totalCreditsT, biomassKg: totalBiomassKg, survivingTrees: totalTrees, perSpecies: perSpeciesAgg });
    }

    // CUMULATIVE totals across modeled years
    const totalCreditsAll = yearly.reduce((sum, d) => sum + d.credits, 0);

    // Per-species cumulative summary
    const speciesSummary = speciesSetup.map(sp => {
      const sumSpecies = yearly.reduce((sum, d) => {
        const ps = d.perSpecies.find(p => p.speciesId === sp.id);
        return sum + (ps ? ps.credits : 0);
      }, 0);
      return { speciesId: sp.id, name: sp.name, totalCredits: sumSpecies };
    });

    setCalc({ totalCredits: totalCreditsAll, yearlyBreakdown: yearly, speciesSummary });
  };

  // Chart: Total + per-species
  const chartData = useMemo(() => {
    if (!calc) return null;
    const labels = calc.yearlyBreakdown.map(d => d.year.toString());

    const datasets: any[] = [{
      label: 'Total CO₂e (t)',
      data: calc.yearlyBreakdown.map(d => d.credits),
      borderColor: 'rgb(64,145,108)',
      backgroundColor: 'rgba(64,145,108,0.10)',
      fill: true,
      tension: 0.35,
      borderWidth: 2
    }];

    rows.forEach((r, idx) => {
      const color = SERIES_COLORS[idx % SERIES_COLORS.length];
      const series = calc.yearlyBreakdown.map(d => {
        const ps = d.perSpecies.find(p => p.speciesId === r.id);
        return ps ? ps.credits : 0;
      });
      datasets.push({
        label: `${r.name || 'Unnamed'} (t)`,
        data: series,
        borderColor: color,
        backgroundColor: color.replace(', 1)', ', 0.08)'),
        fill: false,
        tension: 0.35,
        borderWidth: 1.5,
        pointRadius: 0
      });
    });

    return { labels, datasets };
  }, [calc, rows]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Projected CO₂e Over Time (per species & total)' },
      tooltip: { mode: 'index' as const, intersect: false }
    },
    interaction: { mode: 'nearest' as const, intersect: false },
    scales: { y: { beginAtZero: true, title: { display: true, text: 'tCO₂e' } } }
  };

  // UI helpers for schedule
  const yearsSpanAgain = useMemo(() => {
    const py = parseInt(plantingYear || '0', 10);
    const ey = parseInt(creditingEndYear || '0', 10);
    return clamp(ey - py, 0, 300);
  }, [plantingYear, creditingEndYear]);

  const scheduleSum = useMemo(() => {
    if (!useSchedule) return 0;
    if (scheduleMode === 'constant') {
      const n = clamp(parseInt(scheduleYears || '0', 10), 0, 200);
      return n * (parseFloat(constantAreaPerYear || '0') || 0);
    }
    return customSchedule.reduce((s, r) => s + (parseFloat(r.areaHa || '0') || 0), 0);
  }, [useSchedule, scheduleMode, scheduleYears, constantAreaPerYear, customSchedule]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-earth-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(AppRoutes.RESULTS)}
            className="flex items-center text-primary-600"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Results
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel */}
          <div className="lg:col-span-5 space-y-6">
            {/* Project parameters */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-primary-600">Project Parameters</CardTitle>
                <CardDescription>Area, mortality, years & defaults</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  type="number"
                  label="Total Project Area (ha)"
                  value={projectAreaHa}
                  onChange={(e) => setProjectAreaHa(e.target.value)}
                  placeholder="e.g., 5100"
                  min="0"
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    label="Planting Year"
                    value={plantingYear}
                    onChange={(e) => setPlantingYear(e.target.value)}
                    placeholder="e.g., 2026"
                  />
                  <Input
                    type="number"
                    label="Crediting Period End Year"
                    value={creditingEndYear}
                    onChange={(e) => setCreditingEndYear(e.target.value)}
                    placeholder="e.g., 2065"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="Consider Mortality"
                    value={considerMortality}
                    onChange={(e) => setConsiderMortality(e.target.value as 'yes' | 'no')}
                    options={[
                      { value: 'yes', label: 'Yes' },
                      { value: 'no', label: 'No' }
                    ]}
                  />
                  <Input
                    type="number"
                    label="Mortality Rate (%/yr)"
                    value={mortalityRate}
                    onChange={(e) => setMortalityRate(e.target.value)}
                    placeholder="e.g., 10"
                    min="0"
                    max="100"
                  />
                </div>

                <Input
                  type="number"
                  label="Default DBH Growth Rate if Unknown (cm/yr)"
                  value={defaultGrowthRate}
                  onChange={(e) => setDefaultGrowthRate(e.target.value)}
                  min="0"
                  step="0.01"
                />

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={forceYearZeroZero}
                    onChange={(e) => setForceYearZeroZero(e.target.checked)}
                  />
                  <span>Force Year 0 biomass & credits to 0</span>
                </label>

                <div className="text-xs text-gray-600 bg-primary-50 p-3 rounded-md">
                  <div className="flex items-center font-medium mb-1">
                    <Info className="h-4 w-4 mr-2" />
                    Biomass & Conversion
                  </div>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>Default (Dry): <code>exp(-1.996 + 2.32·ln(D))</code> | Default (Moist): <code>exp(-2.134 + 2.530·ln(D))</code></li>
                    <li>Custom equation allowed per species. Use <code>D</code> for DBH in cm (e.g., <code>exp(-1.996 + 2.32*ln(D))</code>).</li>
                    <li>CO₂e (t) = Biomass(kg) × 0.47 × (44/12) ÷ 1000</li>
                  </ul>
                </div>

                <div className="text-sm text-gray-700">
                  Years modeled: <b>{yearsSpan}</b> ({plantingYear} → {creditingEndYear})
                </div>
              </CardContent>
            </Card>

            {/* Planting Schedule */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-primary-600">Planting Schedule (optional)</CardTitle>
                <CardDescription>Allocate area planted per year; species % splits this area</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={useSchedule}
                    onChange={(e) => setUseSchedule(e.target.checked)}
                  />
                  <span>Enable planting schedule</span>
                </label>

                {useSchedule && (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <Input
                        type="number"
                        label="Schedule Years"
                        value={scheduleYears}
                        onChange={(e) => setScheduleYears(e.target.value)}
                        placeholder="e.g., 5"
                        min="1"
                      />
                      <Select
                        label="Mode"
                        value={scheduleMode}
                        onChange={(e) => setScheduleMode(e.target.value as ScheduleMode)}
                        options={[
                          { value: 'custom', label: 'Custom per year' },
                          { value: 'constant', label: 'Constant per year' }
                        ]}
                      />
                      {scheduleMode === 'constant' && (
                        <Input
                          type="number"
                          label="Area planted each year (ha)"
                          value={constantAreaPerYear}
                          onChange={(e) => setConstantAreaPerYear(e.target.value)}
                          placeholder="e.g., 1000"
                          min="0"
                        />
                      )}
                    </div>

                    {scheduleMode === 'custom' && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Area planted (ha)</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {customSchedule.map((row, idx) => (
                              <tr key={row.year}>
                                <td className="px-4 py-2 text-sm text-gray-700">{row.year}</td>
                                <td className="px-4 py-2">
                                  <input
                                    type="number"
                                    className="w-full border rounded px-2 py-1 text-sm"
                                    value={row.areaHa}
                                    min={0}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      setCustomSchedule(prev => {
                                        const copy = [...prev];
                                        copy[idx] = { ...copy[idx], areaHa: v };
                                        return copy;
                                      });
                                    }}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="text-sm text-gray-700">
                      Scheduled total area: <b>{scheduleSum.toLocaleString(undefined, { maximumFractionDigits: 2 })} ha</b>
                      {projectAreaHa && parseFloat(projectAreaHa) > 0 && (
                        <span className="ml-2">
                          (Project area: {parseFloat(projectAreaHa).toLocaleString(undefined, { maximumFractionDigits: 2 })} ha)
                        </span>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Species mix */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-primary-600">Species Mix & Assumptions</CardTitle>
                <CardDescription>% of area, spacing/density, growth & DBH, optional custom biomass</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {rows.map((r) => (
                  <div key={r.id} className="border border-gray-200 rounded-lg p-3 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-4">
                        <Input
                          label="Species Name"
                          value={r.name}
                          onChange={(e) => updateRow(r.id, { name: e.target.value })}
                          placeholder="e.g., Tectona grandis"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <Select
                          label="Region"
                          value={r.region}
                          onChange={(e) => updateRow(r.id, { region: e.target.value as RegionType })}
                          options={[
                            { value: 'dry', label: 'Dry' },
                            { value: 'moist', label: 'Moist' }
                          ]}
                        />
                      </div>

                      <div className="md:col-span-3">
                        <Input
                          type="number"
                          label="% of Project Area"
                          value={r.percent}
                          onChange={(e) => updateRow(r.id, { percent: e.target.value })}
                          placeholder="e.g., 40"
                          min="0"
                          max="100"
                        />
                      </div>

                      <div className="md:col-span-2 flex items-end">
                        <Button
                          variant="ghost"
                          onClick={() => removeRow(r.id)}
                          disabled={rows.length === 1}
                          className="text-red-600"
                          title="Remove species"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-3">
                        <Select
                          label="Planting Density Input"
                          value={r.inputMode}
                          onChange={(e) => updateRow(r.id, { inputMode: e.target.value as DensityMode })}
                          options={[
                            { value: 'spacing', label: 'Spacing (m)' },
                            { value: 'density', label: 'Density (trees/ha)' }
                          ]}
                        />
                      </div>

                      {r.inputMode === 'spacing' ? (
                        <div className="md:col-span-3">
                          <Input
                            type="number"
                            label="Spacing (m)"
                            value={r.spacing || ''}
                            onChange={(e) => updateRow(r.id, { spacing: e.target.value, density: '' })}
                            placeholder="e.g., 3"
                            min="0.5"
                            step="0.1"
                          />
                        </div>
                      ) : (
                        <div className="md:col-span-3">
                          <Input
                            type="number"
                            label="Density (trees/ha)"
                            value={r.density || ''}
                            onChange={(e) => updateRow(r.id, { density: e.target.value, spacing: '' })}
                            placeholder="e.g., 1111"
                            min="1"
                          />
                        </div>
                      )}

                      <div className="md:col-span-3">
                        <Input
                          type="number"
                          label="Growth Rate (cm/yr, optional)"
                          value={r.growthRateCmYr || ''}
                          onChange={(e) => updateRow(r.id, { growthRateCmYr: e.target.value })}
                          placeholder={`default ${defaultGrowthRate}`}
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <Input
                          type="number"
                          label="Initial DBH at Year 0 (cm)"
                          value={r.initialDbhCm || '0'}
                          onChange={(e) => updateRow(r.id, { initialDbhCm: e.target.value })}
                          placeholder="0"
                          min="0"
                          step="0.1"
                        />
                      </div>
                    </div>

                    {/* Custom biomass equation toggle + input */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-3">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={!!r.useCustomEq}
                            onChange={(e) => updateRow(r.id, { useCustomEq: e.target.checked })}
                          />
                          <span>Use custom biomass equation</span>
                        </label>
                      </div>
                      {r.useCustomEq && (
                        <div className="md:col-span-9">
                          <Input
                            label="Equation in kg/tree (use D for DBH in cm)"
                            value={r.customEquation || ''}
                            onChange={(e) => updateRow(r.id, { customEquation: e.target.value })}
                            placeholder="e.g., exp(-1.996 + 2.32*ln(D))"
                          />
                          <div className="text-xs text-gray-600 mt-1">
                            Allowed: <code>+, -, *, /, (, ), D</code> and functions <code>exp, ln, sqrt, pow(a,b), min, max</code>.
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-600">
                      {r.inputMode === 'spacing' && !!r.spacing && (
                        <>Implied density: {densityFromSpacing(parseFloat(r.spacing)).toFixed(0)} trees/ha</>
                      )}
                      {r.inputMode === 'density' && !!r.density && (
                        <>Implied spacing: ~{(() => {
                          const d = parseFloat(r.density || '0');
                          if (d <= 0) return '—';
                          const s = Math.sqrt(10000 / d);
                          return s.toFixed(2) + ' m';
                        })()}</>
                      )}
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between">
                  <div className={`text-sm ${totalPercent > 100 ? 'text-red-600' : 'text-gray-700'}`}>
                    Species % total: <b>{totalPercent.toFixed(1)}%</b>
                  </div>
                  <Button variant="outline" onClick={addRow}>
                    <Plus className="h-4 w-4 mr-2" /> Add Species
                  </Button>
                </div>

                <Button className="w-full" onClick={calculate}>
                  <Calculator className="mr-2 h-4 w-4" />
                  Calculate Carbon
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-7 space-y-6">
            {calc && (
              <Card className="bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-primary-600">Results</CardTitle>
                  <CardDescription>
                    Terminal year: {calc.yearlyBreakdown.at(-1)!.year}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-primary-50 rounded-lg p-4">
                      <div className="text-sm text-primary-600 mb-1">Cumulative CO₂e (sum over period)</div>
                      <div className="text-2xl font-bold text-primary-700">
                        {fmt2(calc.totalCredits)} tCO₂e
                      </div>
                    </div>
                    <div className="bg-earth-50 rounded-lg p-4">
                      <div className="text-sm text-earth-600 mb-1">Surviving Trees (terminal year)</div>
                      <div className="text-2xl font-bold text-earth-700">
                        {Math.round(calc.yearlyBreakdown.at(-1)!.survivingTrees).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-primary-50 rounded-lg p-4">
                      <div className="text-sm text-primary-600 mb-1">Years Modeled</div>
                      <div className="text-2xl font-bold text-primary-700">
                        {calc.yearlyBreakdown.length - 1}
                      </div>
                    </div>
                  </div>

                  <div className="h-[320px] mb-6">
                    <Line ref={chartRef} data={chartData!} options={chartOptions} />
                  </div>

                  {/* Per-species cumulative summary */}
                  <div className="overflow-x-auto mb-6">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Species</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cumulative CO₂e (t)</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {calc.speciesSummary.map(s => (
                          <tr key={s.speciesId}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{s.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {fmt2(s.totalCredits)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Yearly totals */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total CO₂e (t)</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Biomass (kg)</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Surviving Trees</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {calc.yearlyBreakdown.map((d) => (
                          <tr key={d.year}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{d.year}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{fmt2(d.credits)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{Math.round(d.biomassKg).toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{Math.round(d.survivingTrees).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
