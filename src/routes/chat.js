const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');

// Middleware para verificar se é admin
const isAdmin = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token não fornecido' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.isAdmin) {
            return res.status(403).json({ message: 'Acesso negado' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido' });
    }
};

// Rota para excluir mensagem
router.post('/delete-message', isAdmin, async (req, res) => {
    try {
        const { messageId } = req.body;
        
        const message = await Message.findByIdAndDelete(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Mensagem não encontrada' });
        }

        // Emitir evento para todos os clientes
        req.app.get('io').emit('chat:delete', { messageId });

        res.json({ message: 'Mensagem excluída com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir mensagem:', error);
        res.status(500).json({ message: 'Erro ao excluir mensagem' });
    }
});

module.exports = router; 