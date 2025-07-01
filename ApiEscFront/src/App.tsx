import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { lazy } from 'react'
import ProtectedRoute from './components/Routes/ProtectedRoute'
import PublicRoute from './components/Routes/PublicRoute'
import Login from './views/Login'
import MainLayout from './layouts/MainLayaut'

function App() {
  const Home = lazy(() => import('./views/Home'))
  const Pagos = lazy(() => import('./views/Pagos'))
  const Perfil = lazy(() => import('./views/Perfil'))
  const Alumnos = lazy(() => import('./views/Alumnos'))

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/pagos" element={<Pagos />} />
            <Route path="/perfil" element={<Perfil/>} />
            <Route path="/alumnos" element={<Alumnos />} />
            <Route path="/Notificaciones" element={<Home />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App;
