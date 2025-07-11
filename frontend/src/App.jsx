
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import PrimeraPagina from "./pages/PrimeraPagina";

import IngresoAdministrador from './pages/IngresoAdministrador';
import MenuAdministrador from './pages/MenuAdministrador';
import CrearUsuario from './pages/CrearUsuario';
import IngresarProducto from './pages/IngresarProducto';
import CrearCliente from './pages/CrearCliente';
import Estadisticas from './pages/Estadisticas';
import PedidosPendientes from './pages/PedidosPendientes';

import IngresoUsuario from "./pages/IngresoUsuario";
import MenuUsuario from './pages/MenuUsuario';
import IngresarPedidos from './pages/IngresarPedidos';
import ListaPedidos from './pages/ListaPedidos';
import Inventario from './pages/Inventario';


const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('authToken');
  const userData = JSON.parse(localStorage.getItem('userData'));
  
  if (!token || userData?.role !== 'administrador') {
    return <Navigate to="/ingreso-administrador" replace />;
  }
  
  return children;
};


const ProtectedUserRoute = ({ children }) => {
  const token = localStorage.getItem('authToken');
  const userData = JSON.parse(localStorage.getItem('userData'));
  
  if (!token || !userData) {
    return <Navigate to="/ingreso-usuario" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        
        <Route path="/" element={<PrimeraPagina />} />
        <Route path="/ingreso-administrador" element={<IngresoAdministrador />} />
        <Route path="/ingreso-usuario" element={<IngresoUsuario />} />

        
        <Route 
          path="admin/MenuAdministrador" 
          element={
            <ProtectedRoute>
              <MenuAdministrador />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/CrearUsuario" 
          element={
            <ProtectedRoute>
              <CrearUsuario />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/IngresarProducto" 
          element={
            <ProtectedRoute>
              <IngresarProducto />
            </ProtectedRoute>
          } 
        />
         <Route 
          path="/Inventario" 
          element={
            <ProtectedRoute>
              <Inventario />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/CrearCliente" 
          element={
            <ProtectedRoute>
              <CrearCliente />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/Estadisticas" 
          element={
            <ProtectedRoute>
              <Estadisticas/>
            </ProtectedRoute>
          } 
        />

        
        <Route 
          path="admin/MenuUsuario" 
          element={
            <ProtectedUserRoute>
              <MenuUsuario />
            </ProtectedUserRoute>
          } 
        />
        <Route 
          path= "/IngresarPedidos" 
          element={
            <ProtectedUserRoute>
              <IngresarPedidos />
            </ProtectedUserRoute>
          } 
        />
        <Route 
          path="PedidosPendientes" 
          element={
            <ProtectedUserRoute>
              <PedidosPendientes/>
            </ProtectedUserRoute>
          } 
        />
        <Route 
          path="ListaPedidos" 
          element={
            <ProtectedUserRoute>
              <ListaPedidos/>
            </ProtectedUserRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;