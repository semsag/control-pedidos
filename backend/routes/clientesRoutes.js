const express = require('express');
const router = express.Router();
const pool = require('../database');

router.get('/', async (req, res) => {
    try {
        const { activos } = req.query;
        let query = 'SELECT id, nombres, apellidos, numero_documento FROM clientes';
        
        if (activos === 'true') {
            query += ' WHERE activo = true';
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

module.exports = router;