const express = require('express');
const router = express.Router();
const pool = require('../database');

// GET: Obtener todos los clientes
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clientes ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error en PostgreSQL:', error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

router.post('/', async (req, res) => {  // Cambiado a '/' porque ya está montado en /api/clientes
  const { nombres, apellidos, numero_documento } = req.body;

  try {
    // Validar si el cliente ya existe
    const existeCliente = await pool.query(
      'SELECT * FROM clientes WHERE numero_documento = $1',
      [numero_documento]
    );

    if (existeCliente.rows.length > 0) {
      return res.status(400).json({ error: 'El número de documento ya está registrado' });
    }

    // Insertar nuevo cliente
    const nuevoCliente = await pool.query(
      'INSERT INTO clientes (nombres, apellidos, numero_documento) VALUES ($1, $2, $3) RETURNING *',
      [nombres, apellidos, numero_documento]
    );

    res.status(201).json({
      mensaje: 'Cliente registrado exitosamente',
      cliente: nuevoCliente.rows[0]
    });

  } catch (error) {
    console.error('Error en PostgreSQL:', error);
    res.status(500).json({ error: 'Error al registrar el cliente' });
  }
});

module.exports = router;