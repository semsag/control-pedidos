import { useState, useEffect } from 'react';
import './Inventario.css';

function Inventario() {
  // Estados separados para la lista y el total
  const [inventario, setInventario] = useState([]);
  const [totalInventario, setTotalInventario] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInventario = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('http://localhost:5000/api/inventario');
        if (!response.ok) {
          throw new Error('Error al cargar el inventario');
        }
        
        const data = await response.json();

        if (data.success) {
          // Asegurarnos que los valores numéricos son tratados como números
          const formattedData = data.inventario.map(item => ({
            ...item,
            valor_unitario: Number(item.valor_unitario) || 0,
            valor_total: Number(item.valor_total) || 0,
            cantidad: Number(item.cantidad) || 0
          }));
          
          setInventario(formattedData);
          setTotalInventario(Number(data.totalInventario) || 0);
        } else {
          throw new Error(data.error || 'La respuesta de la API no fue exitosa');
        }

      } catch (err) {
        console.error("Error cargando inventario:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInventario();
  }, []);

  if (loading) return <div className="loading">Cargando inventario...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="inventario-container">
      <h2>Inventario Actual</h2>
      <table className="inventario-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Cantidad</th>
            <th>Valor Unitario</th>
            <th>Valor Total</th>
          </tr>
        </thead>
        <tbody>
          {inventario.map((item) => (
            <tr key={item.id}>
              <td>{item.nombre || 'Sin nombre'}</td>
              <td>{item.categoria || 'Sin categoría'}</td>
              <td>{item.cantidad}</td>
              {/* Formato de moneda para Colombia */}
              <td>{Number(item.valor_unitario).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
              <td>{Number(item.valor_total).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
            </tr>
          ))}
        </tbody>
        {/* Pie de tabla para mostrar el total general */}
        <tfoot>
          <tr>
            <td colSpan="4" className="total-label">Valor Total del Inventario</td>
            <td className="total-valor">
              {totalInventario.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default Inventario;