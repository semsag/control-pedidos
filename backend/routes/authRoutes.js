const express = require('express');
const router = express.Router();
const pool = require('../database');

// Ruta 1: Login (para cualquier tipo de usuario)
router.post('/login', async (req, res) => {
  const { nombre_usuario, contraseña } = req.body;

  try {
    // Buscar usuario en la base de datos
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE nombre_usuario = $1 AND contraseña = $2',
      [nombre_usuario, contraseña]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Éxito: Devuelve el usuario (incluyendo su tipo)
    res.json({ 
      mensaje: 'Inicio de sesión exitoso', 
      usuario: result.rows[0] 
    });

  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Ruta 2: Registrar nuevo usuario
router.post('/usuarios', async (req, res) => {
  const { nombre_usuario, contraseña, tipo_usuario } = req.body;

  try {
    // Validar si el usuario ya existe
    const existeUsuario = await pool.query(
      'SELECT * FROM usuarios WHERE nombre_usuario = $1',
      [nombre_usuario]
    );

    if (existeUsuario.rows.length > 0) {
      return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
    }

    // Insertar nuevo usuario en PostgreSQL
    const nuevoUsuario = await pool.query(
      'INSERT INTO usuarios (nombre_usuario, contraseña, tipo_usuario) VALUES ($1, $2, $3) RETURNING *',
      [nombre_usuario, contraseña, tipo_usuario]
    );

    // Éxito: Devuelve el usuario creado
    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario: nuevoUsuario.rows[0]
    });

  } catch (error) {
    console.error('Error en PostgreSQL:', error);
    res.status(500).json({ error: 'Error al registrar el usuario' });
  }
});

router.post('/usuarios', async (req, res) => {
  const { nombre_usuario, contraseña, tipo_usuario } = req.body;
  try {
    // 1. Verifica si el usuario ya existe
    const existeUsuario = await pool.query(
      'SELECT * FROM usuarios WHERE nombre_usuario = $1', [nombre_usuario]
    );
    if (existeUsuario.rows.length > 0) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }
    // 2. Inserta el nuevo usuario
    const result = await pool.query(
      'INSERT INTO usuarios (nombre_usuario, contraseña, tipo_usuario) VALUES ($1, $2, $3) RETURNING *',
      [nombre_usuario, contraseña, tipo_usuario]
    );
    res.json({ mensaje: 'Usuario creado!', usuario: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

module.exports = router;