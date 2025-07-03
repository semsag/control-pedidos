import { useState, useEffect } from 'react';
import './IngresarPedidos.css';

function IngresarPedidos() {
    const [formData, setFormData] = useState({
        cliente_id: '',
        items: [{
            producto_id: '',
            cantidad: 0,
            precio_unitario: 0
        }]
    });
    const [clientes, setClientes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError('');
                
                const [clientesRes, productosRes] = await Promise.all([
                    fetch('http://localhost:5000/api/clientes'),
                    fetch('http://localhost:5000/api/productos')
                ]);

                if (!clientesRes.ok || !productosRes.ok) {
                    throw new Error('Error al cargar datos');
                }

                const clientesData = await clientesRes.json();
                const productosData = await productosRes.json();

                // Asegurar que los precios son números
                const productosFormateados = productosData.map(p => ({
                    ...p,
                    precio: Number(p.precio) || 0
                }));

                setClientes(clientesData);
                setProductos(productosFormateados);

            } catch (err) {
                console.error('Error completo:', err);
                setError(`Error cargando datos: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleChange = (e, index) => {
        const { name, value } = e.target;

        if (name === 'cliente_id') {
            setFormData({
                ...formData,
                cliente_id: value
            });
        } else {
            const updatedItems = [...formData.items];
            updatedItems[index][name] = name === 'cantidad' || name === 'precio_unitario'
                ? parseFloat(value) || 0
                : value;

            setFormData({
                ...formData,
                items: updatedItems
            });
        }
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, {
                producto_id: '',
                cantidad: 1,
                precio_unitario: 0
            }]
        });
    };

    const removeItem = (index) => {
        if (formData.items.length <= 1) return;

        const updatedItems = formData.items.filter((_, i) => i !== index);
        setFormData({
            ...formData,
            items: updatedItems
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.cliente_id) {
            setError('Debe seleccionar un cliente');
            return;
        }

        if (formData.items.some(item => !item.producto_id)) {
            setError('Todos los productos deben estar seleccionados');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/pedidos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al registrar pedido');
            }

            setSuccess('Pedido registrado exitosamente!');
            setFormData({
                cliente_id: '',
                items: [{
                    producto_id: '',
                    cantidad: 1,
                    precio_unitario: 0
                }]
            });

        } catch (err) {
            console.error('Error al registrar pedido:', err);
            setError(err.message || 'Error al registrar el pedido');
        }
    };

    return (
        <div className="contenedor-pedidos">
            <div className="contenedor-agregar">
                <h3>Agregar Nuevo Pedido</h3>

                {loading && <div className="loading-message">Cargando datos...</div>}
                {error && <div className="error-message">⚠️ {error}</div>}
                {success && <div className="success-message">✅ {success}</div>}

                {!loading && (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Cliente:</label>
                            <select
                                name="cliente_id"
                                value={formData.cliente_id}
                                onChange={(e) => handleChange(e)}
                                required
                            >
                                <option value="">Seleccione un cliente</option>
                                {clientes.map(cliente => (
                                    <option key={cliente.id} value={cliente.id}>
                                        {cliente.nombres} {cliente.apellidos}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {formData.items.map((item, index) => (
                            <div key={index} className="item-pedido">
                                <div className="form-group">
                                    <label>Producto:</label>
                                    <select
                                        name="producto_id"
                                        value={item.producto_id}
                                        onChange={(e) => handleChange(e, index)}
                                        required
                                    >
                                        <option value="">Seleccione un producto</option>
                                        {productos.map(producto => (
                                            <option key={producto.id} value={producto.id}>
                                                {producto.nombre} - ${Number(producto.precio).toFixed(2)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Cantidad:</label>
                                    <input
                                        type="number"
                                        name="cantidad"
                                        value={item.cantidad}
                                        onChange={(e) => handleChange(e, index)}
                                        min="1"
                                        required
                                    />
                                </div>

                                {formData.items.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                    >
                                        Eliminar
                                    </button>
                                )}
                            </div>
                        ))}

                        <button type="button" onClick={addItem}>
                            + Agregar Producto
                        </button>

                        <button type="submit">
                            Registrar Pedido
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default IngresarPedidos;