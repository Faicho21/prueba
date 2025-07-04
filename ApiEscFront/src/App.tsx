import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ProtectedRoute from './components/Routes/ProtectedRoute';
import PublicRoute from './components/Routes/PublicRoute';
import Login from './views/Login';
import MainLayout from './layouts/MainLayaut';
import Carreras from './views/Carreras';

// Lazy imports
const Home = lazy(() => import('./views/Home'));
const Pagos = lazy(() => import('./views/Pagos'));
const MisPagos = lazy(() => import('./views/MisPagos'));
const Perfil = lazy(() => import('./views/Perfil'));
const Alumnos = lazy(() => import('./views/Alumnos'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="text-center mt-5">Cargando vista...</div>}>
        <Routes>
          {/* Rutas públicas */}
          <Route element={<PublicRoute />}>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Rutas protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/pagos" element={<Pagos />} />
              <Route path="/mis-pagos" element={<MisPagos />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/alumnos" element={<Alumnos />} />
              <Route path="/carreras" element={<Carreras />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
