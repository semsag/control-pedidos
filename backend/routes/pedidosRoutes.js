const express = require('express');
const router = express.Router();
const pool = require('../database');

/**
 * @route POST /api/pedidos
 * @description Crea un nuevo pedido con sus items
 * @access Private
 */
router.post('/', async (req, res) => {
    const { cliente_id, items } = req.body;

    // Validación de datos
    if (!cliente_id || !items || items.length === 0) {
        return res.status(400).json({ 
            success: false,
            error: 'Datos incompletos. Se requiere cliente_id y al menos un item' 
        });
    }

    try {
        await pool.query('BEGIN');

        // 1. Crear el pedido inicial con total 0
        const pedidoResult = await pool.query(
            `INSERT INTO pedidos 
             (cliente_id, total, estado) 
             VALUES ($1, 0, 'pendiente') 
             RETURNING id, fecha_creacion`,
            [cliente_id]
        );
        
        const pedidoId = pedidoResult.rows[0].id;
        let totalPedido = 0;

        // 2. Procesar cada item del pedido
        for (const item of items) {
            // Validar item
            if (!item.producto_id || !item.cantidad || !item.precio_unitario) {
                await pool.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    error: 'Cada item debe tener producto_id, cantidad y precio_unitario'
                });
            }

            // Calcular subtotal
            const subtotal = item.cantidad * item.precio_unitario;
            totalPedido += subtotal;

            // Insertar item
            await pool.query(
                `INSERT INTO pedido_items 
                 (pedido_id, producto_id, cantidad, precio_unitario, subtotal) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [pedidoId, item.producto_id, item.cantidad, item.precio_unitario, subtotal]
            );
        }

        // 3. Actualizar el total del pedido
        await pool.query(
            `UPDATE pedidos 
             SET total = $1 
             WHERE id = $2`,
            [totalPedido, pedidoId]
        );

        await pool.query('COMMIT');
        
        // Respuesta exitosa
        res.status(201).json({ 
            success: true,
            pedidoId,
            total: totalPedido,
            message: 'Pedido registrado exitosamente'
        });

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error en transacción de pedido:', error);
        
        // Manejo específico de errores de PostgreSQL
        if (error.code === '23503') { // Violación de llave foránea
            return res.status(400).json({
                success: false,
                error: 'Cliente o producto no existe'
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Error al procesar el pedido',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route GET /api/pedidos
 * @description Obtiene todos los pedidos con sus detalles
 * @access Private
 */
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT 
                p.id,
                p.fecha_creacion,
                p.estado,
                p.total,
                c.id as cliente_id,
                c.nombres as cliente_nombres,
                c.apellidos as cliente_apellidos,
                c.numero_documento as cliente_documento,
                json_agg(
                    json_build_object(
                        'id', pi.id,
                        'producto_id', pr.id,
                        'producto_nombre', pr.nombre,
                        'producto_categoria', pr.categoria,
                        'cantidad', pi.cantidad,
                        'precio_unitario', pi.precio_unitario,
                        'subtotal', pi.subtotal
                    )
                ) as items
            FROM pedidos p
            JOIN clientes c ON p.cliente_id = c.id
            JOIN pedido_items pi ON p.id = pi.pedido_id
            JOIN productos pr ON pi.producto_id = pr.id
            WHERE p.estado != 'cancelado'  -- Excluir pedidos cancelados por defecto
            GROUP BY p.id, c.id
            ORDER BY p.fecha_creacion DESC
            LIMIT 100  -- Limitar para evitar sobrecarga
        `;
        
        const result = await pool.query(query);
        
        res.json({
            success: true,
            count: result.rows.length,
            pedidos: result.rows
        });

    } catch (error) {
        console.error('Error al obtener pedidos:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al obtener los pedidos'
        });
    }
});

/**
 * @route PUT /api/pedidos/:id
 * @description Actualiza el estado de un pedido
 * @access Private (Admin)
 */
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    // Validar estado permitido
    const estadosPermitidos = ['pendiente', 'en_proceso', 'completado', 'cancelado'];
    if (!estadosPermitidos.includes(estado)) {
        return res.status(400).json({
            success: false,
            error: `Estado no válido. Use: ${estadosPermitidos.join(', ')}`
        });
    }

    try {
        // Verificar si el pedido existe
        const pedidoExistente = await pool.query(
            'SELECT id FROM pedidos WHERE id = $1',
            [id]
        );
        
        if (pedidoExistente.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Pedido no encontrado'
            });
        }

        // Actualizar estado
        const result = await pool.query(
            `UPDATE pedidos 
             SET estado = $1 
             WHERE id = $2 
             RETURNING id, estado, fecha_creacion, total`,
            [estado, id]
        );

        res.json({
            success: true,
            pedido: result.rows[0],
            message: `Estado del pedido actualizado a: ${estado}`
        });

    } catch (error) {
        console.error('Error al actualizar pedido:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar el pedido'
        });
    }
});

module.exports = router;