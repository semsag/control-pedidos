const express = require('express');
const router = express.Router();
const pool = require('../database');
const bcrypt = require('bcrypt');


router.post('/usuarios', async (req, res) => {
  const { nombre_usuario, contraseña, tipo_usuario } = req.body;
 
  if (!nombre_usuario || !contraseña || !tipo_usuario) {
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  }

  try {
      const existeUsuario = await pool.query(
      'SELECT * FROM usuarios WHERE nombre_usuario = $1',
      [nombre_usuario]
    );

    if (existeUsuario.rows.length > 0) {
      return res.status(409).json({ error: 'El nombre de usuario ya está en uso' });
    }
        
    const salt = await bcrypt.genSalt(10);
    const contraseñaHasheada = await bcrypt.hash(contraseña, salt);
    
    
    const nuevoUsuarioResult = await pool.query(
      'INSERT INTO usuarios (nombre_usuario, contraseña, tipo_usuario) VALUES ($1, $2, $3) RETURNING *',
      [nombre_usuario, contraseñaHasheada, tipo_usuario]
    );

    const usuarioCreado = nuevoUsuarioResult.rows[0];

    delete usuarioCreado.contraseña;

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario: usuarioCreado
    });

  } catch (error) {
    console.error('Error en PostgreSQL al registrar usuario:', error);
    res.status(500).json({ error: 'Error interno al registrar el usuario' });
  }
});

router.post('/login', async (req, res) => {
  const { nombre_usuario, contraseña } = req.body;

  try {
      const result = await pool.query(
      'SELECT * FROM usuarios WHERE nombre_usuario = $1',
      [nombre_usuario]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const usuario = result.rows[0];

    const contraseñaValida = await bcrypt.compare(contraseña, usuario.contraseña);

    if (!contraseñaValida) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    delete usuario.contraseña;


    res.json({
      mensaje: 'Inicio de sesión exitoso',
      usuario: usuario
    });

  } catch (error) {
    console.error('Error en el servidor durante el login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

module.exports = router;