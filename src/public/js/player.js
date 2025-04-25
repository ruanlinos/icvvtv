// Configuração do player
let player = null;
let currentStreamUrl = '';

// Inicialização do player
document.addEventListener('DOMContentLoaded', async () => {
    const video = document.getElementById('player');
    const streamStatus = document.querySelector('.stream-status');
    const streamTitle = document.querySelector('.stream-title');
    const streamDescription = document.querySelector('.stream-description');
    const chatInput = document.querySelector('.chat-input input');
    const chatSendButton = document.querySelector('.chat-input button');
    
    // Buscar configurações do servidor
    let streamUrl;
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        streamUrl = config.streamUrl;
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        streamUrl = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'; // URL de fallback
    }
    
    // Configurações do player
    const playerOptions = {
        autoplay: true,
        muted: true,
        controls: true,
        fluid: true,
        aspectRatio: '16:9',
        liveui: true,
        html5: {
            hls: {
                overrideNative: true,
                debug: false,
                enableWorker: true,
                lowLatencyMode: true
            }
        }
    };

    // Inicializar o player
    const player = videojs('player', playerOptions);

    // Configurar a fonte do vídeo
    player.src({
        src: streamUrl,
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
            
            // Habilitar chat
            if (chatInput) {
                chatInput.disabled = false;
                chatInput.placeholder = 'Digite sua mensagem...';
            }
            if (chatSendButton) {
                chatSendButton.disabled = false;
                chatSendButton.title = 'Enviar mensagem';
            }
        } else {
            streamStatus.textContent = 'Offline';
            streamStatus.classList.remove('live');
            streamStatus.classList.add('offline');
            
            // Atualizar título e descrição para offline
            if (streamTitle) {
                streamTitle.textContent = 'Live Offline';
            }
            if (streamDescription) {
                streamDescription.textContent = 'A transmissão está offline no momento. Volte mais tarde para assistir ao vivo.';
            }
            
            // Desabilitar chat
            if (chatInput) {
                chatInput.disabled = true;
                chatInput.placeholder = 'Chat indisponível enquanto a live estiver offline';
                chatInput.value = '';
            }
            if (chatSendButton) {
                chatSendButton.disabled = true;
                chatSendButton.title = 'Chat indisponível';
            }
        }
    }

    // Verificar status inicial
    updateStreamStatus(false);

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