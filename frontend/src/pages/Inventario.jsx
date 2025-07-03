import { useState, useEffect } from 'react';
import './Inventario.css';

function Inventario() {
  const [inventario, setInventario] = useState([]);
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
        
        // Asegurarnos que los valores numéricos son tratados como números
        const formattedData = data.map(item => ({
          ...item,
          valor_unitario: Number(item.valor_unitario) || 0,
          valor_total: Number(item.valor_total) || 0,
          cantidad: Number(item.cantidad) || 0
        }));
        
        setInventario(formattedData);
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
              <td>${typeof item.valor_unitario === 'number' ? item.valor_unitario.toFixed(2) : '0.00'}</td>
              <td>${typeof item.valor_total === 'number' ? item.valor_total.toFixed(2) : '0.00'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Inventario;