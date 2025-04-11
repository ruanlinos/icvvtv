const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Message = require('../models/Message');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Rota para obter estatísticas do admin
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Obter total de usuários
        const totalUsers = await User.countDocuments();

        // Obter mensagens de hoje
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const messagesToday = await Message.countDocuments({
            createdAt: { $gte: today }
        });

        // Obter espectadores online (você precisará implementar isso)
        const spectators = 0; // Implemente a lógica para contar espectadores online

        res.json({
            success: true,
            data: {
                totalUsers,
                messagesToday,
                spectators
            }
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar estatísticas'
        });
    }
});

module.exports = router; 