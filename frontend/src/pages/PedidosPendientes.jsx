import { useState, useEffect } from 'react';
import './PedidosPendientes.css'; // Usaremos un nuevo archivo CSS

function PedidosPendientes() {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const cargarPedidosPendientes = async () => {
        try {
            setLoading(true);
            setError('');
            // Apuntamos a la nueva ruta específica del backend
            const response = await fetch('http://localhost:5000/api/pedidos/pendientes');
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Error al cargar los pedidos pendientes');
            }
            const data = await response.json();
            if (data.success) {
                const pedidosFormateados = data.pedidos.map(p => ({
                    ...p,
                    total: Number(p.total)
                }));
                setPedidos(pedidosFormateados);
            } else {
                throw new Error(data.error || 'La respuesta de la API no fue exitosa');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarPedidosPendientes();
    }, []);

    // Función para actualizar estado. Si se cambia, el pedido desaparecerá de esta lista.
    const actualizarEstado = async (pedidoId, nuevoEstado) => {
        try {
            const response = await fetch(`http://localhost:5000/api/pedidos/${pedidoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.details || 'Error al actualizar estado');
            }
            
            // Si la actualización fue exitosa, removemos el pedido de la lista actual.
            setPedidos(prevPedidos => prevPedidos.filter(p => p.id !== pedidoId));

        } catch (err) {
            alert(`Error al actualizar: ${err.message}`);
        }
    };

    return (
        <div className="pedidos-pendientes-container">
            <h2>Pedidos Pendientes</h2>

            {loading && <p className="loading-message">Cargando pedidos...</p>}
            {error && <p className="error-message">⚠️ {error}</p>}

            {!loading && (
                <div className="pedidos-grid">
                    {pedidos.length > 0 ? pedidos.map(pedido => (
                        <div key={pedido.id} className="pedido-card estado-pendiente">
                            <div className="pedido-header">
                                <h3>Pedido #{pedido.id}</h3>
                                <span className="estado">{pedido.estado}</span>
                            </div>
                            <div className="pedido-info">
                                <p><strong>Cliente:</strong> {pedido.cliente?.nombres} {pedido.cliente?.apellidos}</p>
                                <p><strong>Fecha:</strong> {new Date(pedido.fecha_creacion).toLocaleString()}</p>
                                <p><strong>Total:</strong> {Number(pedido.total).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</p>
                            </div>
                            <div className="productos-list">
                                <h4>Productos:</h4>
                                <ul>
                                    {pedido.items?.map((item, index) => (
                                        <li key={index}>
                                            {item.producto?.nombre} - ({item.cantidad} x ${Number(item.precio_unitario).toFixed(2)})
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="acciones">
                                <label>Marcar como:</label>
                                <button onClick={() => actualizarEstado(pedido.id, 'completado')} className="btn-completar">Completado</button>
                                <button onClick={() => actualizarEstado(pedido.id, 'cancelado')} className="btn-cancelar">Cancelado</button>
                            </div>
                        </div>
                    )) : <p className="no-pedidos-message">¡Excelente! No hay pedidos pendientes.</p>}
                </div>
            )}
        </div>
    );
}

export default PedidosPendientes;