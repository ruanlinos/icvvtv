const express = require('express');
const router = express.Router();
const StreamSettings = require('../models/StreamSettings');
const { auth, isAdmin } = require('../middleware/auth');

// Obter configurações da transmissão
router.get('/settings', async (req, res) => {
    try {
        let settings = await StreamSettings.findOne();
        
        if (!settings) {
            settings = await StreamSettings.create({
                streamUrl: 'https://example.com/stream.m3u8',
                title: 'Transmissão ao Vivo',
                description: 'Bem-vindo à nossa transmissão!'
            });
        }

        res.json(settings);
    } catch (error) {
        console.error('Erro ao obter configurações:', error);
        res.status(500).json({ message: 'Erro ao obter configurações' });
    }
});

// Atualizar configurações da transmissão (requer admin)
router.put('/settings', auth, isAdmin, async (req, res) => {
    try {
        const {
            title,
            description,
            streamUrl,
            isLive,
            settings
        } = req.body;

        let streamSettings = await StreamSettings.findOne();
        
        if (!streamSettings) {
            streamSettings = new StreamSettings();
        }

        // Atualizar campos
        if (title) streamSettings.title = title;
        if (description) streamSettings.description = description;
        if (streamUrl) streamSettings.streamUrl = streamUrl;
        if (typeof isLive === 'boolean') streamSettings.isLive = isLive;
        if (settings) {
            streamSettings.settings = {
                ...streamSettings.settings,
                ...settings
            };
        }

        streamSettings.updatedBy = req.user._id;
        streamSettings.lastUpdated = Date.now();

        await streamSettings.save();

        // Emitir atualização via Socket.IO
        req.app.get('io').emit('stream info', {
            title: streamSettings.title,
            description: streamSettings.description,
            url: streamSettings.streamUrl,
            isLive: streamSettings.isLive
        });

        res.json(streamSettings);
    } catch (error) {
        console.error('Erro ao atualizar configurações:', error);
        res.status(500).json({ message: 'Erro ao atualizar configurações' });
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