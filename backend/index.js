const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const clientesRoutes = require('./routes/clientesRoutes');
const productosRoutes = require('./routes/productosRoutes');
const inventarioRoutes = require('./routes/inventarioRoutes');
const pedidosRoutes = require('./routes/pedidosRoutes');




const app = express();
const PORT = 5000;

// Middlewares
app.use(cors()); // Permite peticiones desde el frontend
app.use(express.json()); // Para leer datos JSON del body


// Rutas
app.use('/api', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/pedidos', pedidosRoutes);


// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

app.get('/', (req, res) => {
  res.send('Servidor backend corriendo correctamente.');
});
