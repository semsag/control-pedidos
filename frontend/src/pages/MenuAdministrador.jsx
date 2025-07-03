// src/pages/MenuAdministrador.jsx
import { useNavigate } from 'react-router-dom';
import './MenuAdministrador.css';



export default function MenuAdministrador() {
  const navigate = useNavigate();

  const modulos = [
    { titulo: "Crear Usuario", icono: "👥", path: "/CrearUsuario" },
    { titulo: "Ingresar Producto", icono: "📦", path: "/IngresarProducto" },
    { titulo: "Inventario", icono: "📦📦", path: "/Inventario" },
    { titulo: "Crear Cliente", icono: "👤", path: "/CrearCliente" },
    { titulo: "Estadísticas", icono: "📊", path: "/Estadisticas" },
    
  ];

  return (
    <div className='contenedor-administrativo'>
      <h1 id='titulo-panel-administrativo'>Panel Administrativo</h1>
      <div className='modulos-administrador'>
        {modulos.map((modulo, index) => (
          <div
            key={index}
            onClick={() => navigate(modulo.path)}
            role="button">
            <span>{modulo.icono}</span>
            <h2 className='titulos-modulos'>{modulo.titulo}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}