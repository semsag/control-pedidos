import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './IngresoAdministrador.css';

export default function IngresoAdministrador() {
  const navegar = useNavigate();
  const [datosFormulario, establecerDatosFormulario] = useState({
    usuario: '',
    contraseña: ''
  });
  const [error, establecerError] = useState('');
  const [cargando, establecerCargando] = useState(false);

  const manejarEnvio = async (e) => {
    e.preventDefault();
    establecerError('');
    establecerCargando(true);

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_usuario: datosFormulario.usuario,
          contraseña: datosFormulario.contraseña
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Credenciales incorrectas');
      }

      // Verificar que sea administrador
      if (data.usuario.tipo_usuario !== 'administrador') {
        throw new Error('Acceso restringido: se requieren permisos de administrador');
      }

      navegar('/admin/MenuAdministrador');

    } catch (error) {
      establecerError(error.message);
      establecerDatosFormulario(prev => ({ ...prev, contraseña: '' }));
    } finally {
      establecerCargando(false);
    }
  };

  return (
    <div className="contenedor-externo">
      <h2>Inicio de Sesión (Administrador)</h2>
      {error && <div className="mensaje-error">⚠️ {error}</div>}

      <form onSubmit={manejarEnvio}>
        <div className="campo-datos">
          <label>Usuario:</label>
          <input
            type="text"
            value={datosFormulario.usuario}
            onChange={(e) => establecerDatosFormulario({
              ...datosFormulario,
              usuario: e.target.value
            })}
            required
            disabled={cargando}
            placeholder="Ingrese su usuario"
          />
        </div>

        <div className="campo-datos">
          <label>Contraseña:</label>
          <input
            type="password"
            value={datosFormulario.contraseña}
            onChange={(e) => establecerDatosFormulario({
              ...datosFormulario,
              contraseña: e.target.value
            })}
            required
            disabled={cargando}
            placeholder="Ingrese su contraseña"
          />
        </div>

        <button
          type="submit"
          className="boton-iniciar-sesion"
          disabled={cargando}
        >
          {cargando ? 'Verificando...' : 'Iniciar Sesión'}
        </button>
      </form>
    </div>
  );
}