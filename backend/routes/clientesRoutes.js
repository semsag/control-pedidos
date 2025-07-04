const express = require('express');
const router = express.Router();
const pool = require('../database');

/**
 * @route   GET /api/clientes
 * @desc    Obtiene todos los clientes, con opción de filtrar por activos
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const { activos } = req.query;
        let query = 'SELECT id, nombres, apellidos, numero_documento, activo FROM clientes ORDER BY fecha_registro DESC';
        
        if (activos === 'true') {
            query = 'SELECT id, nombres, apellidos, numero_documento, activo FROM clientes WHERE activo = true ORDER BY fecha_registro DESC';
        }

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error en GET /api/clientes:', err);
        res.status(500).json({ 
            error: 'Error al obtener clientes',
            details: err.message 
        });
    }
});


/**
 * @route   POST /api/clientes
 * @desc    Crea un nuevo cliente
 * @access  Public
 */
router.post('/', async (req, res) => {
    // Extraemos los datos del cuerpo de la petición
    const { nombres, apellidos, numero_documento } = req.body;

    // Validación simple en el backend
    if (!nombres || !apellidos || !numero_documento) {
        return res.status(400).json({ 
            success: false, 
            error: 'Todos los campos son obligatorios.' 
        });
    }

    try {
        // Creamos la consulta SQL para insertar el nuevo cliente
        const query = `
            INSERT INTO clientes (nombres, apellidos, numero_documento, fecha_registro, activo)
            VALUES ($1, $2, $3, NOW(), true)
            RETURNING *; 
        `;
        // Los valores a insertar
        const values = [nombres, apellidos, numero_documento];

        // Ejecutamos la consulta
        const result = await pool.query(query, values);

        // Devolvemos una respuesta exitosa (201 Created) con los datos del cliente creado
        res.status(201).json({
            success: true,
            message: 'Cliente registrado exitosamente',
            cliente: result.rows[0]
        });

    } catch (err) {
        console.error('Error en POST /api/clientes:', err);
        // Manejo de error por si el número de documento ya existe (requiere un constraint UNIQUE en la DB)
        if (err.code === '23505') { // Código de error de PostgreSQL para violación de unicidad
            return res.status(409).json({ // 409 Conflict
                success: false,
                error: 'El número de documento ya está registrado.'
            });
        }

        // Error genérico del servidor
        res.status(500).json({ 
            success: false,
            error: 'Error al registrar el cliente.',
            details: err.message 
        });
    }
});


module.exports = router;
