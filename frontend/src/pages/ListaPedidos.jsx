import { useState, useEffect } from 'react';
import './ListaPedidos.css';

function ListaPedidos() {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('todos');

    useEffect(() => {
        const cargarPedidos = async () => {
            try {
                setLoading(true);
                setError('');
                const response = await fetch('http://localhost:5000/api/pedidos');
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'Error al cargar pedidos');
                }
                const data = await response.json();
                if (data.success) {
                    setPedidos(data.pedidos);
                } else {
                    throw new Error(data.error || 'La respuesta de la API no fue exitosa');
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        cargarPedidos();
    }, []);

    const actualizarEstado = async (pedidoId, nuevoEstado) => {
        try {
            setError('');
            const response = await fetch(`http://localhost:5000/api/pedidos/${pedidoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado })
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.details || 'Error al actualizar estado');
            }
            setPedidos(prevPedidos =>
                prevPedidos.map(pedido =>
                    pedido.id === pedidoId ? { ...pedido, estado: nuevoEstado } : pedido
                )
            );
        } catch (err) {
            setError(err.message);
        }
    };

    const pedidosFiltrados = filtroEstado === 'todos'
        ? pedidos
        : pedidos.filter(pedido => pedido.estado === filtroEstado);

    return (
        <div className="lista-pedidos-container">
            <h2>Listado de Pedidos</h2>
            
            <div className="filtros">
                <label>Filtrar por estado:</label>
                <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                >
                    <option value="todos">Todos</option>
                    <option value="pendiente">Pendientes</option>
                    <option value="completado">Completados</option>
                    <option value="cancelado">Cancelados</option>
                </select>
            </div>

            {loading && <p>Cargando pedidos...</p>}
            {error && <p className="error">⚠️ Error: {error}</p>}

            {!loading && !error && (
                <div className="pedidos-grid">
                    {pedidosFiltrados.length > 0 ? pedidosFiltrados.map(pedido => (
                        <div key={pedido.id} className={`pedido-card estado-${pedido.estado}`}>
                            <div className="pedido-header">
                                <h3>Pedido #{pedido.id}</h3>
                                <span className={`estado`}>{pedido.estado.replace('_', ' ')}</span>
                            </div>
                            <div className="pedido-info">
                                <p><strong>Cliente:</strong> {pedido.cliente?.nombres} {pedido.cliente?.apellidos}</p>
                                <p><strong>Fecha:</strong> {new Date(pedido.fecha_creacion).toLocaleString()}</p>
                                <p><strong>Total:</strong> ${Number(pedido.total).toFixed(2)}</p>
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
                                <label>Cambiar estado:</label>
                                <select
                                    value={pedido.estado}
                                    onChange={(e) => actualizarEstado(pedido.id, e.target.value)}
                                >
                                    <option value="pendiente">Pendiente</option>
                                    <option value="completado">Completado</option>
                                    <option value="cancelado">Cancelado</option>
                                </select>
                            </div>
                        </div>
                    )) : <p>No hay pedidos que coincidan con el filtro.</p>}
                </div>
            )}
        </div>
    );
}

export default ListaPedidos;
