import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './IngresoUsuario.css';

export default function IngresoUsuario() {
  const navegar = useNavigate();
  const [datosFormulario, establecerDatosFormulario] = useState({
    usuario: '',
    contraseña: ''
  });
  const [error, establecerError] = useState('');
  const [cargando, establecerCargando] = useState(false);

  // Credenciales de desarrollo
  const CREDENCIALES_ADMIN = {
    usuario: 'usuario',
    contraseña: 'usuario123',
    rol: 'usuario'
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    establecerError('');
    establecerCargando(true);

    try {
      // Validación de credenciales
      if (datosFormulario.usuario !== CREDENCIALES_ADMIN.usuario ||
        datosFormulario.contraseña !== CREDENCIALES_ADMIN.contraseña) {
        throw new Error('Credenciales incorrectas');
      }


      navegar('/admin/MenuUsuario');

    } catch (error) {
      establecerError(error.message);
      // Limpiar contraseña por seguridad
      establecerDatosFormulario(prev => ({ ...prev, contraseña: '' }));
    } finally {
      establecerCargando(false);
    }
  };

  return (
    <div className="contenedor-externo">
      <h2>Inicio de Sesión</h2>
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