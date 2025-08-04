import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import { Layout } from "./pages/Layout";
import { AuthForm } from "./pages/Login";
import { Cuenta } from "./pages/Cuenta";
import { ProductosProvider } from "./context/DatosPublicContext";
import { DatosAdminProvider } from "./context/DatosAdminContext";
import { AuthProvider } from "./context/AuthContext";
import { ComponentesProvider } from "./context/ControladorComponentes";
import AdminPanel from "./pages/PanelAdministracion";
import ProtectedRoute from "./components/RouteProtected";
import ProtectedAuth from "./components/RouteAuth";
import { AdministrarPorX } from "./pages/AdministrarPorX";
import { ActionsProvider } from "./context/ActionsContext";
import VerVentas from "./pages/Ventas";
import { LoadingProvider } from "./context/LoadingContext";
import { AppDataProvider } from "./context/AppDataContext";
import DetalleVenta from "./pages/DetalleVenta";

function App() {
  return (
    <Router>
      <LoadingProvider>
        <AuthProvider>
          <AppDataProvider>
            <ProductosProvider>
              <DatosAdminProvider>
                <ActionsProvider>
                  <ComponentesProvider>
                    <Routes>
                      <Route element={<Layout />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<AuthForm />} />
                        <Route
                          path="/Mi-cuenta"
                          element={
                            <ProtectedAuth>
                              <Cuenta />
                            </ProtectedAuth>
                          }
                        />
                        <Route
                          path="/ventas"
                          element={
                            <ProtectedAuth>
                              <VerVentas />
                            </ProtectedAuth>
                          }
                        />
                        <Route
                          path="/detalle-venta/:id"
                          element={
                            <ProtectedAuth>
                              <DetalleVenta />
                            </ProtectedAuth>
                          }
                        />
                        <Route
                          path="/admin-panel/gestionar/"
                          element={
                            <ProtectedRoute>
                              <AdminPanel />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/admin-panel/gestionar/:param?"
                          element={
                            <ProtectedRoute>
                              <AdministrarPorX />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="/*" element={<div>Error 404</div>} />
                      </Route>
                    </Routes>
                  </ComponentesProvider>
                </ActionsProvider>
              </DatosAdminProvider>
            </ProductosProvider>
          </AppDataProvider>
        </AuthProvider>
      </LoadingProvider>
    </Router>
  );
}

export default App;
