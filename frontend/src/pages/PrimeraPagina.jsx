import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo-coelagro.jpg';
import './PrimeraPagina.css';


export default function PrimeraPagina() {
  const navigate = useNavigate();

  return (
    <div>
      <img
        src={logo}
        alt="logo COELAGRO"
        className="logo-coelagro"
      />

      <div id="ingresos">
        <button id="boton-administrador"
          onClick={() => navigate('/ingreso-administrador')}>
          <span>Administrador</span>
        </button>
        <button id="boton-usuario"
          onClick={() => navigate('/ingreso-usuario')}>
          <span>Usuario</span>
        </button>
      </div>
    </div>
  );
}