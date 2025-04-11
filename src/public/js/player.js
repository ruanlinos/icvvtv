// Configuração do player
let player = null;
let currentStreamUrl = '';

// Inicialização do player
document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('player');
    const streamStatus = document.querySelector('.stream-status');
    
    // Configurações do player
    const playerOptions = {
        autoplay: true,
        muted: true,
        controls: true,
        fluid: true,
        aspectRatio: '16:9',
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
        },
        html5: {
            hls: {
                overrideNative: true,
                debug: false,
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90,
                maxBufferLength: 30,
                maxMaxBufferLength: 600,
                maxBufferSize: 60 * 1000 * 1000,
                maxBufferHole: 0.5,
                manifestLoadingTimeOut: 10000,
                manifestLoadingMaxRetry: 3,
                manifestLoadingRetryDelay: 1000,
                levelLoadingTimeOut: 10000,
                levelLoadingMaxRetry: 3,
                levelLoadingRetryDelay: 1000,
                fragLoadingTimeOut: 20000,
                fragLoadingMaxRetry: 3,
                fragLoadingRetryDelay: 1000
            }
        }
    };

    // Inicializar o player
    const player = videojs('player', playerOptions);

    // Configurar a fonte do vídeo
    player.src({
        src: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        type: 'application/x-mpegURL'
    });

    // Eventos do player
    player.on('loadedmetadata', () => {
        console.log('Metadata carregada');
        updateStreamStatus(true);
    });

    player.on('error', (error) => {
        console.error('Erro no player:', error);
        updateStreamStatus(false);
    });

    player.on('waiting', () => {
        console.log('Player aguardando dados...');
    });

    player.on('playing', () => {
        console.log('Player iniciou a reprodução');
        updateStreamStatus(true);
    });

    player.on('pause', () => {
        console.log('Player pausado');
    });

    // Função para atualizar o status da stream
    function updateStreamStatus(isLive) {
        if (isLive) {
            streamStatus.textContent = 'AO VIVO';
            streamStatus.classList.remove('offline');
            streamStatus.classList.add('live');
        } else {
            streamStatus.textContent = 'Offline';
            streamStatus.classList.remove('live');
            streamStatus.classList.add('offline');
        }
    }

    // Verificar status inicial
    updateStreamStatus(false);

    // Verificar status da stream periodicamente
    setInterval(async () => {
        try {
            const response = await fetch('/api/stream/status');
            const data = await response.json();
            updateStreamStatus(data.isLive);
        } catch (error) {
            console.error('Erro ao verificar status da stream:', error);
            updateStreamStatus(false);
        }
    }, 30000); // Verifica a cada 30 segundos

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

    // Limpar recursos ao fechar a página
    window.addEventListener('beforeunload', () => {
        if (player) {
            player.dispose();
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