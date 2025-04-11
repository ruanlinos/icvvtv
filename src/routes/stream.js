const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const StreamSettings = require('../models/StreamSettings');
const { auth, isAdmin } = require('../middleware/auth');

// Middleware para verificar se o usuário é administrador
const isAdminMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token não fornecido' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Acesso negado' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token inválido' });
    }
};

// Obter configurações da live
router.get('/settings', async (req, res) => {
    try {
        const settings = await StreamSettings.findOne();
        if (!settings) {
            const newSettings = new StreamSettings();
            await newSettings.save();
            return res.json(newSettings);
        }
        res.json(settings);
    } catch (error) {
        console.error('Erro ao obter configurações:', error);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// Atualizar configurações da live (apenas admin)
router.put('/settings', isAdminMiddleware, async (req, res) => {
    try {
        const settings = await StreamSettings.findOne();
        if (!settings) {
            return res.status(404).json({ message: 'Configurações não encontradas' });
        }

        await settings.updateSettings(req.body);
        res.json({ message: 'Configurações atualizadas com sucesso', settings });
    } catch (error) {
        console.error('Erro ao atualizar configurações:', error);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// Iniciar/parar live (apenas admin)
router.post('/toggle-live', isAdminMiddleware, async (req, res) => {
    try {
        const settings = await StreamSettings.findOne();
        if (!settings) {
            return res.status(404).json({ message: 'Configurações não encontradas' });
        }

        const { isLive } = req.body;
        await settings.toggleLive(isLive);
        res.json({ 
            message: isLive ? 'Live iniciada' : 'Live encerrada',
            settings 
        });
    } catch (error) {
        console.error('Erro ao alterar status da live:', error);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// Atualizar contagem de visualizações
router.put('/viewers', auth, isAdmin, async (req, res) => {
    try {
        const { count } = req.body;
        
        const settings = await StreamSettings.findOne();
        if (!settings) {
            return res.status(404).json({ message: 'Configurações não encontradas' });
        }

        await settings.updateViewerCount(count);

        // Emitir atualização via Socket.IO
        req.app.get('io').emit('viewer count', count);

        res.json({ viewerCount: count });
    } catch (error) {
        console.error('Erro ao atualizar contagem de visualizações:', error);
        res.status(500).json({ message: 'Erro ao atualizar contagem de visualizações' });
    }
});

module.exports = router; 