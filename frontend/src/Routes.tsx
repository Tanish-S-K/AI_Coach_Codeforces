import { Routes, Route } from 'react-router-dom';
import App from './App';
import ContestAdvice from './contest_advice';
import Layout from './Layout';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<App />} />
        <Route path="advice" element={<ContestAdvice />} />
      </Route>
    </Routes>
  );
}
