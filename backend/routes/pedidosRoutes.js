const express = require('express');
const router = express.Router();
const pool = require('../database');

// --- LA RUTA POST / Y GET / SE MANTIENEN IGUAL ---
// (Se omiten por brevedad, no necesitan cambios)

/**
 * @route POST /api/pedidos
 * @description Crea un nuevo pedido, valida el stock y descuenta del inventario.
 */
router.post('/', async (req, res) => {
    const { cliente_id, items } = req.body;
    if (!cliente_id || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, error: 'Datos incompletos.' });
    }
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const pedidoResult = await client.query(`INSERT INTO pedidos (cliente_id, total, estado) VALUES ($1, 0, 'pendiente') RETURNING id`, [cliente_id]);
        const pedidoId = pedidoResult.rows[0].id;
        let totalPedido = 0;
        for (const item of items) {
            const productoResult = await client.query('SELECT nombre, cantidad, precio_unitario FROM productos WHERE id = $1 FOR UPDATE', [item.producto_id]);
            if (productoResult.rows.length === 0) throw new Error(`El producto con ID ${item.producto_id} no existe.`);
            const producto = productoResult.rows[0];
            if (producto.cantidad < item.cantidad) throw new Error(`Stock insuficiente para: "${producto.nombre}".`);
            
            const precioUnitario = item.precio_unitario || producto.precio_unitario;

            await client.query('UPDATE productos SET cantidad = cantidad - $1 WHERE id = $2', [item.cantidad, item.producto_id]);
            await client.query('UPDATE inventario SET cantidad = cantidad - $1 WHERE producto_id = $2', [item.cantidad, item.producto_id]);
            
            const subtotal = item.cantidad * precioUnitario;
            totalPedido += subtotal;
            
            await client.query(`INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario, subtotal) VALUES ($1, $2, $3, $4, $5)`, [pedidoId, item.producto_id, item.cantidad, precioUnitario, subtotal]);
        }
        await client.query(`UPDATE pedidos SET total = $1 WHERE id = $2`, [totalPedido, pedidoId]);
        await client.query('COMMIT');
        res.status(201).json({ success: true, pedidoId, message: 'Pedido registrado y stock actualizado.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en transacción de pedido:', error);
        res.status(500).json({ success: false, error: 'Error al procesar el pedido.', details: error.message });
    } finally {
        client.release();
    }
});


/**
 * @route GET /api/pedidos
 * @description Obtiene todos los pedidos con sus detalles.
 */
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT p.id, p.fecha_creacion, p.estado, p.total,
                json_build_object('id', c.id, 'nombres', c.nombres, 'apellidos', c.apellidos) as cliente,
                (SELECT json_agg(json_build_object('id', pi.id, 'cantidad', pi.cantidad, 'precio_unitario', pi.precio_unitario, 'producto', json_build_object('id', pr.id, 'nombre', pr.nombre)))
                 FROM pedido_items pi JOIN productos pr ON pi.producto_id = pr.id WHERE pi.pedido_id = p.id) as items
            FROM pedidos p JOIN clientes c ON p.cliente_id = c.id
            GROUP BY p.id, c.id ORDER BY p.fecha_creacion DESC;`;
        const result = await pool.query(query);
        const pedidos = result.rows.filter(p => p.items); // Filtra pedidos que pudieran no tener items
        res.json({ success: true, count: pedidos.length, pedidos: pedidos });
    } catch (error) {
        console.error('Error al obtener pedidos:', error);
        res.status(500).json({ success: false, error: 'Error al obtener los pedidos' });
    }
});


/**
 * @route PUT /api/pedidos/:id
 * @description Actualiza el estado de un pedido y maneja el inventario.
 * @access Private (Admin)
 */
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { estado: nuevoEstado } = req.body;

    const estadosPermitidos = ['pendiente', 'completado', 'cancelado'];
    if (!estadosPermitidos.includes(nuevoEstado)) {
        return res.status(400).json({
            success: false,
            error: `Estado no válido. Use: ${estadosPermitidos.join(', ')}`
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const pedidoActualResult = await client.query('SELECT estado FROM pedidos WHERE id = $1 FOR UPDATE', [id]);
        if (pedidoActualResult.rows.length === 0) {
            throw new Error('Pedido no encontrado');
        }
        const estadoActual = pedidoActualResult.rows[0].estado;

        if (estadoActual === nuevoEstado) {
            await client.query('COMMIT');
            return res.json({ success: true, message: 'El estado del pedido ya era el solicitado.' });
        }

        // Lógica de inventario
        if (nuevoEstado === 'cancelado' && estadoActual !== 'cancelado') {
            // Si se cancela un pedido (pendiente o completado), se devuelve el stock.
            const itemsResult = await client.query('SELECT producto_id, cantidad FROM pedido_items WHERE pedido_id = $1', [id]);
            for (const item of itemsResult.rows) {
                await client.query('UPDATE productos SET cantidad = cantidad + $1 WHERE id = $2', [item.cantidad, item.producto_id]);
                await client.query('UPDATE inventario SET cantidad = cantidad + $1 WHERE producto_id = $2', [item.cantidad, item.producto_id]);
            }
        } else if (nuevoEstado !== 'cancelado' && estadoActual === 'cancelado') {
            // Si se reactiva un pedido (de cancelado a pendiente o completado), se descuenta el stock de nuevo.
            const itemsResult = await client.query('SELECT producto_id, cantidad FROM pedido_items WHERE pedido_id = $1', [id]);
            for (const item of itemsResult.rows) {
                const stockResult = await client.query('SELECT cantidad, nombre FROM productos WHERE id = $1 FOR UPDATE', [item.producto_id]);
                if (stockResult.rows[0].cantidad < item.cantidad) {
                    // ¡Aquí está la validación clave!
                    throw new Error(`Stock insuficiente para reactivar el pedido (producto: ${stockResult.rows[0].nombre}).`);
                }
                await client.query('UPDATE productos SET cantidad = cantidad - $1 WHERE id = $2', [item.cantidad, item.producto_id]);
                await client.query('UPDATE inventario SET cantidad = cantidad - $1 WHERE producto_id = $2', [item.cantidad, item.producto_id]);
            }
        }
        // Nota: Si se pasa de 'pendiente' a 'completado', no se hace nada con el inventario, lo cual es correcto.

        await client.query('UPDATE pedidos SET estado = $1 WHERE id = $2', [nuevoEstado, id]);
        await client.query('COMMIT');
        res.json({ success: true, message: `Estado del pedido actualizado a: ${nuevoEstado}` });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar estado del pedido:', error);

        // --- MEJORA DE MANEJO DE ERRORES ---
        // Si el error es por stock insuficiente, enviamos un código 409 (Conflicto).
        if (error.message.includes('Stock insuficiente')) {
            return res.status(409).json({
                success: false,
                error: 'Conflicto de inventario',
                details: error.message
            });
        }

        // Para cualquier otro error, mantenemos el 500.
        res.status(500).json({
            success: false,
            error: 'Error interno al actualizar el estado.',
            details: error.message
        });
    } finally {
        client.release();
    }
});

module.exports = router;
