import { useState, useEffect } from 'react';
import './IngresarPedidos.css';

function IngresarPedidos() {
    const [formData, setFormData] = useState({
        cliente_id: '',
        items: [{
            producto_id: '',
            cantidad: '',
            precio_unitario: '',
        }]
    });
    const [clientes, setClientes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);

    // Cargar clientes y productos
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError('');

                const [clientesRes, productosRes] = await Promise.all([
                    fetch('http://localhost:5000/api/clientes'),
                    fetch('http://localhost:5000/api/productos?disponibles=true')
                ]);

                if (!clientesRes.ok || !productosRes.ok) {
                    throw new Error('Error al cargar datos');
                }

                const clientesData = await clientesRes.json();
                const productosData = await productosRes.json();

                setClientes(clientesData);
                setProductos(productosData);

            } catch (err) {
                setError(`Error cargando datos: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleChange = (e, index) => {
        const { name, value } = e.target;
    
        // Si el cambio es en el cliente, actualízalo y retorna
        if (name === 'cliente_id') {
            setFormData({ ...formData, cliente_id: value });
            return; // Salimos de la función aquí
        }
    
        // Para los cambios en los items del pedido
        const updatedItems = [...formData.items];
        // Es importante crear una copia del item para no mutar el estado directamente
        const currentItem = { ...updatedItems[index] };
    
        if (name === 'producto_id') {
            // Convierte el ID a número para una búsqueda segura en el array
            const productoSeleccionado = productos.find(p => p.id === Number(value));
            
            currentItem.producto_id = value;
            // Asigna el precio del producto encontrado, o un string vacío si no se encuentra
            currentItem.precio_unitario = productoSeleccionado ? productoSeleccionado.precio_unitario : ''; 
        
        } else if (name === 'cantidad') {
            // Usa parseInt con base 10 y maneja el caso de que el input esté vacío
            currentItem.cantidad = parseInt(value, 10) || ''; 
        
        } else if (name === 'precio_unitario') {
            // Usa parseFloat para precios y maneja el caso de que el input esté vacío
            currentItem.precio_unitario = parseFloat(value) || '';
        }
    
        updatedItems[index] = currentItem;
    
        setFormData({
            ...formData,
            items: updatedItems
        });
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, {
                producto_id: '',
                cantidad: '',
                precio_unitario: '',
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

    const calcularTotal = () => {
        return formData.items.reduce((total, item) => {
            // Asegúrate de que los valores sean numéricos antes de multiplicar
            const cantidad = Number(item.cantidad) || 0;
            const precio = Number(item.precio_unitario) || 0;
            return total + (cantidad * precio);
        }, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validaciones
        if (!formData.cliente_id) {
            setError('Debe seleccionar un cliente');
            return;
        }

        if (formData.items.some(item => !item.producto_id || Number(item.cantidad) <= 0)) {
            setError('Todos los productos deben estar seleccionados con cantidades válidas');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/pedidos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cliente_id: formData.cliente_id,
                    items: formData.items.map(item => ({
                        ...item,
                        cantidad: Number(item.cantidad),
                        precio_unitario: Number(item.precio_unitario)
                    }))
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al registrar pedido');
            }

            setSuccess('Pedido registrado exitosamente!');

            // Resetear formulario
            setFormData({
                cliente_id: '',
                items: [{
                    producto_id: '',
                    cantidad: '',
                    precio_unitario: '',
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
                                onChange={handleChange} // No necesitas pasar el índice aquí
                                required
                            >
                                <option value="">Seleccione un cliente</option>
                                {clientes.map(cliente => (
                                    <option key={cliente.id} value={cliente.id}>
                                        {cliente.nombres} {cliente.apellidos} - {cliente.numero_documento}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="items-pedido">
                            <h4>Productos:</h4>
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
                                                <option
                                                    key={producto.id}
                                                    value={producto.id}
                                                    disabled={producto.cantidad <= 0}
                                                >
                                                    {producto.nombre} -
                                                    ${Number(producto.precio_unitario).toFixed(2)} -
                                                    Stock: {producto.cantidad}
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

                                    <div className="form-group">
                                        <label>Precio Unitario:</label>
                                        <input
                                            type="number"
                                            name="precio_unitario"
                                            value={item.precio_unitario}
                                            onChange={(e) => handleChange(e, index)}
                                            min="0"
                                            step="0.01"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Subtotal:</label>
                                        <span>${(Number(item.cantidad) * Number(item.precio_unitario)).toFixed(2)}</span>
                                    </div>

                                    {formData.items.length > 1 && (
                                        <button
                                            type="button"
                                            className="btn-eliminar"
                                            onClick={() => removeItem(index)}
                                        >
                                            Eliminar
                                        </button>
                                    )}
                                </div>
                            ))}

                            <button
                                type="button"
                                className="btn-agregar"
                                onClick={addItem}
                            >
                                + Agregar Producto
                            </button>
                        </div>

                        <div className="total-pedido">
                            <h4>Total del Pedido:</h4>
                            <span>${calcularTotal().toFixed(2)}</span>
                        </div>

                        <button type="submit" className="btn-registrar">
                            Registrar Pedido
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default IngresarPedidos;