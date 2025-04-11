// Configuração do player
let player = null;
let currentStreamUrl = '';

// Inicialização do player
document.addEventListener('DOMContentLoaded', () => {
    player = videojs('videoPlayer', {
        fluid: true,
        aspectRatio: '16:9',
        autoplay: true,
        controls: true,
        preload: 'auto',
        playbackRates: [0.5, 1, 1.5, 2],
        controlBar: {
            children: [
                'playToggle',
                'volumePanel',
                'currentTimeDisplay',
                'timeDivider',
                'durationDisplay',
                'progressControl',
                'liveDisplay',
                'customControlSpacer',
                'playbackRateMenuButton',
                'fullscreenToggle'
            ]
        }
    });

    // Configurar qualidade automática
    player.on('loadedmetadata', () => {
        const qualities = player.qualities();
        if (qualities && qualities.length > 0) {
            player.quality(qualities[qualities.length - 1]); // Seleciona a melhor qualidade
        }
    });

    // Atualizar contador de visualizações
    let viewerCount = 0;
    const viewerCountElement = document.querySelector('#viewerCount span');
    
    socket.on('viewer count', (count) => {
        viewerCount = count;
        viewerCountElement.textContent = count;
    });

    // Atualizar informações da transmissão
    socket.on('stream info', (info) => {
        document.getElementById('streamTitle').textContent = info.title || 'Transmissão ao Vivo';
        document.getElementById('streamDescription').textContent = info.description || 'Sem descrição';
        
        if (info.url && info.url !== currentStreamUrl) {
            updateStreamUrl(info.url);
        }
    });
});

// Função para atualizar a URL do stream
function updateStreamUrl(url) {
    if (!player || !url) return;

    currentStreamUrl = url;
    
    player.src({
        src: url,
        type: detectStreamType(url)
    });

    player.play().catch((error) => {
        console.error('Erro ao iniciar reprodução:', error);
    });
}

// Função para detectar o tipo de stream baseado na URL
function detectStreamType(url) {
    const extension = url.split('.').pop().toLowerCase();
    
    switch (extension) {
        case 'm3u8':
            return 'application/x-mpegURL';
        case 'mpd':
            return 'application/dash+xml';
        case 'mp4':
            return 'video/mp4';
        default:
            return 'application/x-mpegURL'; // Assume HLS por padrão
    }
}

// Função para alternar modo teatro
function toggleTheaterMode() {
    const videoContainer = document.querySelector('.video-container');
    const chatContainer = document.querySelector('.chat-container');
    
    videoContainer.classList.toggle('theater-mode');
    chatContainer.classList.toggle('theater-mode');
    
    player.fluid(true); // Atualiza o tamanho do player
}

// Limpar recursos ao fechar a página
window.addEventListener('beforeunload', () => {
    if (player) {
        player.dispose();
    }
}); 