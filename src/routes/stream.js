const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const StreamSettings = require('../models/StreamSettings');
const { auth, isAdmin } = require('../middleware/auth');
const Stream = require('../models/Stream');

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

// Rota para obter estatísticas
router.get('/stats', auth, isAdmin, async (req, res) => {
    try {
        const stream = await Stream.findOne().sort({ createdAt: -1 });
        const stats = {
            onlineUsers: 0, // TODO: Implementar contagem de usuários online
            messagesToday: 0, // TODO: Implementar contagem de mensagens
            totalUsers: 0, // TODO: Implementar contagem de usuários
            stream: stream || {
                title: '',
                description: '',
                status: 'offline'
            }
        };
        res.json(stats);
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        res.status(500).json({ message: 'Erro ao carregar estatísticas' });
    }
});

// Rota para atualizar informações da transmissão
router.post('/update', auth, isAdmin, async (req, res) => {
    try {
        const { title, description, status } = req.body;
        
        let stream = await Stream.findOne().sort({ createdAt: -1 });
        
        if (!stream) {
            stream = new Stream({
                title,
                description,
                status
            });
        } else {
            stream.title = title;
            stream.description = description;
            stream.status = status;
        }
        
        await stream.save();

        // Emite evento de atualização para todos os clientes
        req.app.get('io').emit('stream update', {
            title: stream.title,
            description: stream.description,
            status: stream.status
        });

        res.json({ message: 'Transmissão atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar transmissão:', error);
        res.status(500).json({ message: 'Erro ao atualizar transmissão' });
    }
});

// Rota para iniciar a transmissão
router.post('/start', auth, isAdmin, async (req, res) => {
    try {
        let stream = await Stream.findOne().sort({ createdAt: -1 });
        
        if (!stream) {
            stream = new Stream({
                status: 'live'
            });
        } else {
            stream.status = 'live';
        }
        
        await stream.save();

        // Emite evento de início de transmissão
        req.app.get('io').emit('stream start', {
            title: stream.title,
            description: stream.description,
            status: 'live'
        });

        res.json({ message: 'Transmissão iniciada com sucesso' });
    } catch (error) {
        console.error('Erro ao iniciar transmissão:', error);
        res.status(500).json({ message: 'Erro ao iniciar transmissão' });
    }
});

// Rota para encerrar a transmissão
router.post('/stop', auth, isAdmin, async (req, res) => {
    try {
        let stream = await Stream.findOne().sort({ createdAt: -1 });
        
        if (!stream) {
            stream = new Stream({
                status: 'offline'
            });
        } else {
            stream.status = 'offline';
        }
        
        await stream.save();

        // Emite evento de encerramento de transmissão
        req.app.get('io').emit('stream stop', {
            title: stream.title,
            description: stream.description,
            status: 'offline'
        });

        res.json({ message: 'Transmissão encerrada com sucesso' });
    } catch (error) {
        console.error('Erro ao encerrar transmissão:', error);
        res.status(500).json({ message: 'Erro ao encerrar transmissão' });
    }
});

// Rota para obter informações atuais da transmissão
router.get('/current', async (req, res) => {
    try {
        const stream = await Stream.findOne().sort({ createdAt: -1 });
        res.json(stream || {
            title: '',
            description: '',
            status: 'offline'
        });
    } catch (error) {
        console.error('Erro ao obter informações da transmissão:', error);
        res.status(500).json({ message: 'Erro ao obter informações da transmissão' });
    }
});

module.exports = router; 