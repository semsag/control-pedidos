const express = require('express');
const router = express.Router();
const pool = require('../database');

// Ruta para obtener el inventario y el valor total
router.get('/', async (req, res) => {
    try {
        // 1. Obtener la lista de productos en el inventario
        // Se selecciona 'i.valor_total' asumiendo que es una columna generada en la BD
        // para ser más eficiente.
        const inventarioResult = await pool.query(`
            SELECT 
                p.id, 
                p.nombre, 
                p.categoria, 
                i.cantidad, 
                i.valor_unitario, 
                i.valor_total 
            FROM productos p
            JOIN inventario i ON p.id = i.producto_id
            ORDER BY p.nombre ASC
        `);

        // 2. Obtener la suma total del valor del inventario
        const totalResult = await pool.query(
            `SELECT SUM(valor_total) as valor_total_inventario FROM inventario`
        );

        const inventario = inventarioResult.rows;
        // Aseguramos que si no hay nada, el total sea 0
        const totalInventario = totalResult.rows[0]?.valor_total_inventario || 0;

        // 3. Enviar ambos resultados en la respuesta
        res.json({
            success: true,
            inventario,
            totalInventario
        });

    } catch (err) {
        console.error('Error en GET /api/inventario:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener el inventario', 
            details: err.message 
        });
    }
});

module.exports = router;
