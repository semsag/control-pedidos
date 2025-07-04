const express = require('express');
const router = express.Router();
const pool = require('../database');

router.get('/', async (req, res) => {
    try {
        const { disponibles } = req.query;
        let query = 'SELECT * FROM productos ORDER BY nombre ASC';

        if (disponibles === 'true') {
            // Filtra solo productos con stock
            query = 'SELECT * FROM productos WHERE cantidad > 0 ORDER BY nombre ASC';
        }

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error en GET /api/productos:', err);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});


router.post('/', async (req, res) => {
    const { nombre, categoria, precio_unitario, cantidad } = req.body;
    
    try {
        await pool.query('BEGIN'); // Iniciar transacción

        // 1. Verificar si el producto ya existe
        const productoExistente = await pool.query(
            'SELECT id, cantidad FROM productos WHERE nombre = $1',
            [nombre]
        );

        if (productoExistente.rows.length > 0) {
            // --- PRODUCTO EXISTENTE ---
            const producto = productoExistente.rows[0];
            const nuevaCantidad = producto.cantidad + (parseInt(cantidad) || 0);

            // 2. Actualizar el producto
            await pool.query(
                'UPDATE productos SET cantidad = $1, precio_unitario = $2 WHERE id = $3',
                [nuevaCantidad, precio_unitario, producto.id]
            );

            // 3. Actualizar el inventario
            await pool.query(
                `INSERT INTO inventario (producto_id, cantidad, valor_unitario) 
                 VALUES ($1, $2, $3)
                 ON CONFLICT (producto_id) 
                 DO UPDATE SET 
                    cantidad = inventario.cantidad + $2,
                    valor_unitario = $3,
                    ultima_actualizacion = CURRENT_TIMESTAMP`,
                [producto.id, parseInt(cantidad) || 0, precio_unitario]
            );

            await pool.query('COMMIT');
            res.status(200).json({
                message: 'Producto existente actualizado',
                id: producto.id
            });
        } else {
            // --- NUEVO PRODUCTO ---
            // 4. Insertar nuevo producto
            const nuevoProducto = await pool.query(
                `INSERT INTO productos (nombre, categoria, precio_unitario, cantidad) 
                 VALUES ($1, $2, $3, $4) 
                 RETURNING id`,
                [nombre, categoria, precio_unitario, parseInt(cantidad) || 0]
            );

            // 5. Insertar en inventario
            await pool.query(
                `INSERT INTO inventario (producto_id, cantidad, valor_unitario) 
                 VALUES ($1, $2, $3)`,
                [nuevoProducto.rows[0].id, parseInt(cantidad) || 0, precio_unitario]
            );

            await pool.query('COMMIT');
            res.status(201).json({
                message: 'Nuevo producto registrado',
                id: nuevoProducto.rows[0].id
            });
        }
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error en transacción:', err);
        
        // Mensaje personalizado si el producto ya existe (por la restricción UNIQUE)
        if (err.code === '23505') {
            res.status(400).json({ error: 'El producto ya existe. Usa la búsqueda para actualizarlo.' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

// Resto de tus rutas (GET /buscar, etc.)
module.exports = router;