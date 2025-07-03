import { useState } from 'react';
import './CrearUsuario.css';

function CrearUsuario() {
  const [formData, setFormData] = useState({
    nombre_usuario: '',
    contraseña: '',
    tipo_usuario: 'usuario' // Valor por defecto
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validación básica
    if (formData.nombre_usuario.length < 4 || formData.contraseña.length < 6) {
      setError('Usuario mínimo 4 caracteres y contraseña mínimo 6');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar usuario');
      }

      setSuccess('Usuario registrado exitosamente!');
      // Limpiar formulario
      setFormData({
        nombre_usuario: '',
        contraseña: '',
        tipo_usuario: 'usuario'
      });

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="crear-contenedor-de-usuarios">
      <h2>Registrar Nuevo Usuario</h2>
      {error && <div className="error-message">⚠️ {error}</div>}
      {success && <div className="success-message">✅ {success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="ingreso-datos">
          <label>Nombre de Usuario:</label>
          <input
            type="text"
            name="nombre_usuario"
            value={formData.nombre_usuario}
            onChange={handleChange}
            placeholder="Mínimo 4 caracteres"
            required
          />
        </div>

        <div className="ingreso-datos">
          <label>Contraseña:</label>
          <input
            type="password"
            name="contraseña"
            value={formData.contraseña}
            onChange={handleChange}
            placeholder="Mínimo 6 caracteres"
            required
          />
        </div>

        <div id='seleccionar-tipo-de-usuario'>
          <label>Tipo de Usuario:</label>
          <select
            name="tipo_usuario"
            value={formData.tipo_usuario}
            onChange={handleChange}
          >
            <option value="usuario">Usuario</option>
            <option value="administrador">Administrador</option>
          </select>
        </div>

        <button id='boton-registrar' type="submit" className="submit-btn">
          Registrar
        </button>
      </form>
    </div>
  );
}

export default CrearUsuario;