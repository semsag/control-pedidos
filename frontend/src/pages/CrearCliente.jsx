import { useState } from 'react';
import './CrearCliente.css';

function CrearCliente() {
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    numero_documento: ''
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
    if (formData.nombres.length < 3 || formData.apellidos.length < 3 || formData.numero_documento.length < 6) {
      setError('Todos los campos deben tener al menos 3 caracteres (6 para documento)');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/clientes', {
  method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar cliente');
      }

      setSuccess('Cliente registrado exitosamente!');
      // Limpiar formulario
      setFormData({
        nombres: '',
        apellidos: '',
        numero_documento: ''
      });

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="crear-cliente">
      <h2>Registrar Nuevo Cliente</h2>
      {error && <div className="error-message">⚠️ {error}</div>}
      {success && <div className="success-message">✅ {success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="ingreso-datos">
          <label>Nombres de Cliente:</label>
          <input
            type="text"
            name="nombres"
            value={formData.nombres}
            onChange={handleChange}
            placeholder="Mínimo 3 caracteres"
            required
          />
        </div>

        <div className="ingreso-datos">
          <label>Apellidos Cliente:</label>
          <input
            type="text"
            name="apellidos"
            value={formData.apellidos}
            onChange={handleChange}
            placeholder="Mínimo 3 caracteres"
            required
          />
        </div>

        <div className="ingreso-datos">
          <label>Número de Documento:</label>
          <input
            type="text"  // Cambiado a text para permitir diferentes formatos
            name="numero_documento"
            value={formData.numero_documento}
            onChange={handleChange}
            placeholder="Mínimo 6 caracteres"
            required
          />
        </div>

        <button type="submit" className="submit-btn">
          Registrar
        </button>
      </form>
    </div>
  );
}

export default CrearCliente;