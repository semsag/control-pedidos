import { useNavigate } from 'react-router-dom';
import './MenuUsuario.css';


export default function MenuUsuario() {
    const navigate = useNavigate();

    const modulos = [
        { titulo: "Ingresar Pedidos", icono: "📦", path: "/IngresarPedidos" },
        { titulo: "Pedidos Pendientes", icono: "🚚", path: "/PedidosPendientes" },
        { titulo: "Lista Pedidos", icono: "🎁", path: "/ListaPedidos" },

    ];

    return (
        <div className='contenedor-usuario'>
            <h1 id='titulo-panel-usuario'>Panel Usuario</h1>
            <div className='modulos-usuarios'>
                {modulos.map((modulo, index) => (
                    <div
                        key={index}
                        onClick={() => navigate(modulo.path)}
                        role="button">
                        <span>{modulo.icono}</span>
                        <h2 className='titulos-modulos'>{modulo.titulo}</h2>
                    </div>
                ))}
            </div>
        </div>
    );
}