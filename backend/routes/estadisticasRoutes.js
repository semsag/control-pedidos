const express = require('express');
const router = express.Router();
const pool = require('../database');

/**
 * @route   GET /api/estadisticas
 * @desc    Obtiene estadísticas de pedidos y una lista filtrable de los mismos.
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        // --- 1. Obtener el resumen de estados (Completado, Pendiente, Cancelado) ---
        const resumenResult = await pool.query(`
            SELECT estado, COUNT(id)::int as count 
            FROM pedidos 
            GROUP BY estado;
        `);

        // Convertir el resultado en un objeto fácil de usar: { completado: 5, pendiente: 10, ... }
        const resumen = resumenResult.rows.reduce((acc, row) => {
            acc[row.estado] = row.count;
            return acc;
        }, { completado: 0, pendiente: 0, cancelado: 0 });

        // --- 2. Obtener la lista de pedidos con filtros dinámicos ---
        // Se añade el filtro por 'estado'
        const { cliente, documento, producto, estado } = req.query;

        let whereClauses = [];
        let queryParams = [];
        let paramIndex = 1;

        let queryText = `
            SELECT 
                p.id, 
                p.fecha_creacion, 
                p.estado, 
                p.total,
                json_build_object(
                    'id', c.id, 
                    'nombres', c.nombres, 
                    'apellidos', c.apellidos,
                    'numero_documento', c.numero_documento
                ) as cliente,
                (SELECT json_agg(
                    json_build_object(
                        'producto_nombre', pr.nombre, 
                        'cantidad', pi.cantidad, 
                        'precio_unitario', pi.precio_unitario
                    )
                )
                 FROM pedido_items pi 
                 JOIN productos pr ON pi.producto_id = pr.id 
                 WHERE pi.pedido_id = p.id) as items
            FROM pedidos p
            JOIN clientes c ON p.cliente_id = c.id
        `;

        // Añadir filtro por estado del pedido
        if (estado && ['pendiente', 'completado', 'cancelado'].includes(estado)) {
            whereClauses.push(`p.estado = $${paramIndex++}`);
            queryParams.push(estado);
        }
        if (cliente) {
            whereClauses.push(`(c.nombres || ' ' || c.apellidos) ILIKE $${paramIndex++}`);
            queryParams.push(`%${cliente}%`);
        }
        if (documento) {
            whereClauses.push(`c.numero_documento ILIKE $${paramIndex++}`);
            queryParams.push(`%${documento}%`);
        }
        if (producto) {
            whereClauses.push(`
                EXISTS (
                    SELECT 1 
                    FROM pedido_items pi_sub
                    JOIN productos pr_sub ON pi_sub.producto_id = pr_sub.id
                    WHERE pi_sub.pedido_id = p.id AND pr_sub.nombre ILIKE $${paramIndex++}
                )
            `);
            queryParams.push(`%${producto}%`);
        }

        if (whereClauses.length > 0) {
            queryText += ` WHERE ${whereClauses.join(' AND ')}`;
        }

        queryText += ` GROUP BY p.id, c.id ORDER BY p.fecha_creacion DESC;`;

        const pedidosResult = await pool.query(queryText, queryParams);

        res.json({
            success: true,
            resumen,
            pedidos: pedidosResult.rows
        });

    } catch (err) {
        console.error('Error en GET /api/estadisticas:', err);
        res.status(500).json({
            success: false,
            error: 'Error al obtener las estadísticas',
            details: err.message
        });
    }
});

module.exports = router;
