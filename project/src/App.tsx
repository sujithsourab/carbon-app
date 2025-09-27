import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { Landing } from './pages/Landing';
import { Portfolio } from './pages/Portfolio';
import { ProjectInfo } from './pages/ProjectInfo';
import { Loading } from './pages/Loading';
import { Results } from './pages/Results';
import { Summary } from './pages/Summary';
import { RSAnalysis } from './pages/RSAnalysis';
import { PAIManagement } from './pages/PAIManagement';
import { ForestCover } from './pages/ForestCover';
import { CarbonCalculator } from './pages/CarbonCalculator';
import { FinancialModel } from './pages/FinancialModel';
import { TreeTags } from './pages/TreeTags';
import { PerformanceBenchmarking } from './pages/PerformanceBenchmarking';
import { AppRoutes } from './types';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          <Routes>
            <Route path={AppRoutes.HOME} element={<Landing />} />
            <Route path={AppRoutes.PORTFOLIO} element={<Portfolio />} />
            <Route path={AppRoutes.PROJECT_INFO} element={<ProjectInfo />} />
            <Route path={AppRoutes.LOADING} element={<Loading />} />
            <Route path={AppRoutes.RESULTS} element={<Results />} />
            <Route path={`${AppRoutes.RESULTS}/:id`} element={<Results />} />
            <Route path={AppRoutes.SUMMARY} element={<Summary />} />
            <Route path={AppRoutes.RS_ANALYSIS} element={<RSAnalysis />} />
            <Route path={AppRoutes.PAI_MANAGEMENT} element={<PAIManagement />} />
            <Route path={AppRoutes.FOREST_COVER} element={<ForestCover />} />
            <Route path={AppRoutes.CARBON_CALCULATOR} element={<CarbonCalculator />} />
            <Route path={AppRoutes.FINANCIAL_MODEL} element={<FinancialModel />} />
            <Route path={AppRoutes.TREE_TAGS} element={<TreeTags />} />
            <Route path={AppRoutes.PERFORMANCE_BENCHMARKING} element={<PerformanceBenchmarking />} />
            <Route path="*" element={<Navigate to={AppRoutes.HOME} replace />} />
          </Routes>
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;