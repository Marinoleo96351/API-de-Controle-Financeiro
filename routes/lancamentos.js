const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.status(501).json({ erro: 'Ainda não implementado.' }));

module.exports = router;
