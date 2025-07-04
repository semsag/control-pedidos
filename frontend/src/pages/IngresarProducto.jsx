import { useState } from 'react';
import './IngresarProducto.css';

function CrearProducto() {
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    precio_unitario: '',
    cantidad: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [productosExistentes, setProductosExistentes] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  const buscarProductos = async (nombre) => {
    if (nombre.length < 3) {
      setProductosExistentes([]);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/productos/buscar?nombre=${nombre}`);
      const data = await response.json();
      if (response.ok) {
        setProductosExistentes(data);
      }
    } catch (err) {
      console.error("Error buscando productos:", err);
    }
  };

  const seleccionarProducto = (producto) => {
    setFormData({
      nombre: producto.nombre,
      categoria: producto.categoria,
      precio_unitario: producto.precio_unitario,
      cantidad: '' // Dejamos cantidad vacía para que el usuario ingrese la nueva cantidad a agregar
    });
    setProductoSeleccionado(producto);
    setProductosExistentes([]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (name === 'nombre') {
      buscarProductos(value);
      // Si el usuario cambia el nombre manualmente, resetear el producto seleccionado
      if (productoSeleccionado && productoSeleccionado.nombre !== value) {
        setProductoSeleccionado(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.nombre || !formData.categoria || !formData.precio_unitario) {
      setError('Nombre, categoría y precio unitario son obligatorios');
      return;
    }

    if (parseFloat(formData.precio_unitario) <= 0) {
      setError('Precio unitario debe ser mayor a 0');
      return;
    }

    if (formData.cantidad && parseInt(formData.cantidad) < 0) {
      setError('La cantidad no puede ser negativa');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          categoria: formData.categoria,
          precio_unitario: parseFloat(formData.precio_unitario),
          cantidad: parseInt(formData.cantidad) || 0
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar producto');
      }

      // Mensaje personalizado según si fue actualización o creación
      setSuccess(
        data.message === 'Producto existente actualizado'
          ? `¡Producto actualizado! Se agregaron ${formData.cantidad || 0} unidades.`
          : '¡Producto registrado exitosamente!'
      );

      // Limpiar formulario
      setFormData({
        nombre: '',
        categoria: '',
        precio_unitario: '',
        cantidad: ''
      });
      setProductoSeleccionado(null);

    } catch (err) {
      // Manejo especial para errores de producto duplicado
      if (err.message.includes('23505')) {
        setError('Este producto ya existe. Busca el producto para actualizar su cantidad.');
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className="crear-productos">
      <div className="contenedor-agregar">
        <h3>Agregar Nuevo Producto</h3>
        {error && <div className="error-message">⚠️ {error}</div>}
        {success && <div className="success-message">✅ {success}</div>}

        <form className="formulario-producto" onSubmit={handleSubmit}>
          <div className="ingreso-datos">
            <label>Nombre:</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Nombre del producto"
              required
            />
            {productosExistentes.length > 0 && (
              <ul className="lista-autocompletar">
                {productosExistentes.map((producto) => (
                  <li
                    key={producto.id}
                    onClick={() => seleccionarProducto(producto)}
                  >
                    {producto.nombre} (Cantidad actual: {producto.cantidad}, Precio: ${producto.precio_unitario})
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="ingreso-datos">
            <label>Categoría:</label>
            <input
              type="text"
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              placeholder="Categoría del producto"
              required
            />
          </div>

          <div className="ingreso-datos">
            <label>Precio Unitario:</label>
            <input
              type="number"
              name="precio_unitario"
              value={formData.precio_unitario}
              onChange={handleChange}
              placeholder="$ 0.00"
              min="0.01"
              step="0.01"
              required
            />
          </div>

          <div className="ingreso-datos">
            <label>Cantidad a {productoSeleccionado ? 'Agregar' : 'Ingresar'}:</label>
            <input
              type="number"
              name="cantidad"
              value={formData.cantidad}
              onChange={handleChange}
              placeholder="0"
              min="0"
            />
            {productoSeleccionado && (
              <p className="info-cantidad">
                Cantidad actual: {productoSeleccionado.cantidad} unidades
              </p>
            )}
          </div>

          <button type="submit" className="boton-agregar">
            {productoSeleccionado ? 'Actualizar Producto' : 'Agregar Producto'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CrearProducto;