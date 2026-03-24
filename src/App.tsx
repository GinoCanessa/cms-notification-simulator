import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import SimulatorPage from './components/simulator/SimulatorPage';
import OverviewPage from './components/overview/OverviewPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/simulator" element={<SimulatorPage />} />
      </Route>
    </Routes>
  );
}
