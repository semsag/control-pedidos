import { useState, useEffect } from 'react';
import './ListaPedidos.css';

function ListaPedidos() {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('todos');

    // Función para cargar pedidos (sin cambios)
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
                    // Asegurarse de que los totales sean números para evitar errores de formato
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
        cargarPedidos();
    }, []);

    // --- FUNCIÓN ACTUALIZARESTADO MEJORADA ---
    const actualizarEstado = async (pedidoId, nuevoEstado) => {
        // Guardar el estado original para poder revertirlo en caso de error
        const pedidoOriginal = pedidos.find(p => p.id === pedidoId);
        if (!pedidoOriginal) return;

        const estadoOriginal = pedidoOriginal.estado;

        // Actualización optimista: Cambia el estado en la UI inmediatamente
        setPedidos(prevPedidos =>
            prevPedidos.map(pedido =>
                pedido.id === pedidoId ? { ...pedido, estado: nuevoEstado } : pedido
            )
        );
        setError(''); // Limpiar errores anteriores

        try {
            const response = await fetch(`http://localhost:5000/api/pedidos/${pedidoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado })
            });

            // Si la respuesta no es exitosa, procesamos el error
            if (!response.ok) {
                const errData = await response.json();
                // Usamos el mensaje de 'details' que ahora es más específico
                throw new Error(errData.details || errData.error || 'Error al actualizar estado');
            }
            // Si todo fue bien, la UI ya está actualizada y no hay que hacer más.

        } catch (err) {
            // Si hay un error, lo mostramos y revertimos el cambio en la UI
            setError(err.message);
            setPedidos(prevPedidos =>
                prevPedidos.map(pedido =>
                    pedido.id === pedidoId ? { ...pedido, estado: estadoOriginal } : pedido
                )
            );
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
            {/* Mostramos el error de forma más prominente */}
            {error && <p className="error-message">⚠️ Error: {error}</p>}

            {!loading && (
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
                                <p><strong>Total:</strong> ${pedido.total ? pedido.total.toFixed(2) : '0.00'}</p>
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
