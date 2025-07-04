import { useState, useEffect, useCallback } from 'react';
import './Estadisticas.css';

function Estadisticas() {
  const [resumen, setResumen] = useState({ completado: 0, pendiente: 0, cancelado: 0 });
  const [pedidos, setPedidos] = useState([]);
  // El filtro por estado ahora es parte del objeto de filtros
  const [filtros, setFiltros] = useState({ cliente: '', documento: '', producto: '', estado: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEstadisticas = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filtros.cliente) params.append('cliente', filtros.cliente);
      if (filtros.documento) params.append('documento', filtros.documento);
      if (filtros.producto) params.append('producto', filtros.producto);
      // Añadimos el filtro de estado a la petición
      if (filtros.estado) params.append('estado', filtros.estado);
      
      const response = await fetch(`http://localhost:5000/api/estadisticas?${params.toString()}`);
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Error al cargar las estadísticas');
      }

      const data = await response.json();
      if (data.success) {
        setResumen(data.resumen);
        setPedidos(data.pedidos);
      } else {
        throw new Error(data.error || 'La respuesta de la API no fue exitosa');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filtros]); // La dependencia ahora es el objeto de filtros completo

  useEffect(() => {
    fetchEstadisticas();
  }, [fetchEstadisticas]);

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prevFiltros => ({
      ...prevFiltros,
      [name]: value
    }));
  };

  // Nueva función para manejar el clic en las tarjetas de estado
  const handleEstadoFilterClick = (estado) => {
    setFiltros(prevFiltros => ({
      ...prevFiltros,
      // Si el estado clickeado ya está activo, lo quitamos (mostramos todos)
      // Si no, lo establecemos como el nuevo filtro.
      estado: prevFiltros.estado === estado ? null : estado,
    }));
  };

  return (
    <div className="estadisticas-container">
      <h1>Estadísticas de Pedidos</h1>

      {/* --- Sección de Resumen (Ahora son botones) --- */}
      <div className="stats-summary">
        {/* Se añade un onClick y una clase 'active' si el filtro corresponde */}
        <div 
          className={`stat-card completado ${filtros.estado === 'completado' ? 'active' : ''}`}
          onClick={() => handleEstadoFilterClick('completado')}
        >
          <h3>{resumen.completado}</h3>
          <p>Completados</p>
        </div>
        <div 
          className={`stat-card pendiente ${filtros.estado === 'pendiente' ? 'active' : ''}`}
          onClick={() => handleEstadoFilterClick('pendiente')}
        >
          <h3>{resumen.pendiente}</h3>
          <p>Pendientes</p>
        </div>
        <div 
          className={`stat-card cancelado ${filtros.estado === 'cancelado' ? 'active' : ''}`}
          onClick={() => handleEstadoFilterClick('cancelado')}
        >
          <h3>{resumen.cancelado}</h3>
          <p>Cancelados</p>
        </div>
      </div>

      {/* --- Sección de Filtros (sin cambios) --- */}
      <div className="filtros-container">
        <h3>Filtrar Pedidos</h3>
        <div className="filtros-grid">
          <input
            type="text"
            name="cliente"
            placeholder="Buscar por nombre de cliente..."
            value={filtros.cliente}
            onChange={handleFiltroChange}
          />
          <input
            type="text"
            name="documento"
            placeholder="Buscar por documento..."
            value={filtros.documento}
            onChange={handleFiltroChange}
          />
          <input
            type="text"
            name="producto"
            placeholder="Buscar por nombre de producto..."
            value={filtros.producto}
            onChange={handleFiltroChange}
          />
        </div>
      </div>

      {/* --- Sección de Resultados --- */}
      <div className="resultados-container">
        {loading && <p className="loading-text">Cargando datos...</p>}
        {error && <p className="error-message">⚠️ Error: {error}</p>}
        {!loading && !error && (
          <table>
            <thead>
              <tr>
                <th>ID Pedido</th>
                <th>Cliente</th>
                <th>Documento</th>
                <th>Estado</th>
                <th>Productos</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.length > 0 ? (
                pedidos.map(pedido => (
                  <tr key={pedido.id}>
                    <td>#{pedido.id}</td>
                    <td>{pedido.cliente.nombres} {pedido.cliente.apellidos}</td>
                    <td>{pedido.cliente.numero_documento}</td>
                    <td><span className={`estado-label estado-${pedido.estado}`}>{pedido.estado}</span></td>
                    <td>
                      <ul className="productos-en-tabla">
                        {pedido.items?.map((item, index) => (
                          <li key={index}>
                            {item.cantidad} x {item.producto_nombre}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td>${Number(pedido.total).toLocaleString('es-CO')}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-results">No se encontraron pedidos con los filtros aplicados.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Estadisticas;
