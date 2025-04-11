document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('stream-player');
    const streamStatus = document.querySelector('.stream-status');
    
    if (Hls.isSupported()) {
        const hls = new Hls({
            debug: false,
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
        });

        hls.loadSource('/stream/playlist.m3u8');
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(error => {
                console.error('Erro ao iniciar a reprodução:', error);
            });
            updateStreamStatus(true);
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
                switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        console.error('Erro de rede:', data);
                        hls.startLoad();
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        console.error('Erro de mídia:', data);
                        hls.recoverMediaError();
                        break;
                    default:
                        console.error('Erro fatal:', data);
                        hls.destroy();
                        break;
                }
            }
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Suporte nativo para HLS (Safari)
        video.src = '/stream/playlist.m3u8';
        video.addEventListener('loadedmetadata', () => {
            video.play().catch(error => {
                console.error('Erro ao iniciar a reprodução:', error);
            });
            updateStreamStatus(true);
        });
    }

    // Função para atualizar o status da stream
    function updateStreamStatus(isLive) {
        if (isLive) {
            streamStatus.textContent = 'AO VIVO';
            streamStatus.classList.remove('offline');
            streamStatus.classList.add('live');
        } else {
            streamStatus.textContent = 'OFFLINE';
            streamStatus.classList.remove('live');
            streamStatus.classList.add('offline');
        }
    }

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
}); 