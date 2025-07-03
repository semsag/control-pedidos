const express = require('express');
const router = express.Router(); // Esta línea faltaba
const pool = require('../database');

// Ruta para obtener el inventario
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.id, p.nombre, p.categoria, 
                   i.cantidad, i.valor_unitario, 
                   (i.cantidad * i.valor_unitario) as valor_total
            FROM productos p
            JOIN inventario i ON p.id = i.producto_id
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;