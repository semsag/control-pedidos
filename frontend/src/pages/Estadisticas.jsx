import './Estadisticas.css';

function Estadisticas() {
  return (
    <div className="crear-contenedor-de-usuarios">
      <h2>Registrar Nuevo Usuario</h2>

      <form>
        <div className="ingreso-datos">
          <label>Nombre de Usuario:</label>
          <input
            type="text"
            placeholder="Mínimo 4 caracteres"
          />
        </div>

        <div className="ingreso-datos">
          <label>Contraseña:</label>
          <input
            type="password"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div id='seleccionar-tipo-de-usuario'>
          <label>Tipo de Usuario:</label>
          <select>
            <option value="user">Usuario</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        <button id='boton-registrar' type="button" className="submit-btn">
          Registrar
        </button>
      </form>
    </div>
  );
}

export default Estadisticas;