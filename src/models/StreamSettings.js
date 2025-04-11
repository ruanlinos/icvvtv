const mongoose = require('mongoose');

const streamSettingsSchema = new mongoose.Schema({
    title: {
        type: String,
        default: 'ICVV TV - Live'
    },
    description: {
        type: String,
        default: ''
    },
    isLive: {
        type: Boolean,
        default: false
    },
    streamUrl: {
        type: String,
        default: ''
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

// Método para atualizar o contador de visualizações
streamSettingsSchema.methods.updateViewerCount = async function(count) {
    this.viewerCount = count;
    this.lastUpdated = Date.now();
    await this.save();
};

// Método para atualizar as configurações da live
streamSettingsSchema.methods.updateSettings = async function(settings) {
    if (settings.title) this.title = settings.title;
    if (settings.description) this.description = settings.description;
    if (settings.streamUrl) this.streamUrl = settings.streamUrl;
    this.lastUpdated = Date.now();
    await this.save();
};

// Método para iniciar/parar a live
streamSettingsSchema.methods.toggleLive = async function(isLive) {
    this.isLive = isLive;
    this.lastUpdated = Date.now();
    await this.save();
};

const StreamSettings = mongoose.model('StreamSettings', streamSettingsSchema);

module.exports = StreamSettings; 