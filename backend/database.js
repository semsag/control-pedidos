const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',       // Usuario por defecto de PostgreSQL
  password: 'admin2',     // Tu contraseña
  host: 'localhost',      // Servidor local
  port: 5432,            // Puerto por defecto
  database: 'pedidos_db', // Nombre de tu base de datos
});

module.exports = pool;