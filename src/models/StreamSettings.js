const mongoose = require('mongoose');

const streamSettingsSchema = new mongoose.Schema({
    title: {
        type: String,
        default: 'Transmissão ao Vivo'
    },
    description: {
        type: String,
        default: 'Sem descrição'
    },
    streamUrl: {
        type: String,
        required: true
    },
    isLive: {
        type: Boolean,
        default: false
    },
    viewerCount: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    settings: {
        allowChat: {
            type: Boolean,
            default: true
        },
        chatDelay: {
            type: Number,
            default: 0
        },
        requireLogin: {
            type: Boolean,
            default: true
        },
        autoStart: {
            type: Boolean,
            default: false
        }
    }
});

// Método para atualizar contagem de visualizações
streamSettingsSchema.methods.updateViewerCount = function(count) {
    this.viewerCount = count;
    return this.save();
};

// Método para atualizar status da transmissão
streamSettingsSchema.methods.updateStreamStatus = function(isLive) {
    this.isLive = isLive;
    this.lastUpdated = Date.now();
    return this.save();
};

module.exports = mongoose.model('StreamSettings', streamSettingsSchema); 