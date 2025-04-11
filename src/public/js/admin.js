document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const adminTab = document.getElementById('adminTab');
    const chatTabs = document.getElementById('chatTabs');
    const chatContent = document.getElementById('chatContent');
    const adminContent = document.getElementById('adminContent');
    const streamTitle = document.getElementById('streamTitle');
    const streamDescription = document.getElementById('streamDescription');
    const streamUrl = document.getElementById('streamUrl');
    const isLive = document.getElementById('isLive');
    const saveSettings = document.getElementById('saveSettings');
    const toggleLive = document.getElementById('toggleLive');

    // Verificar se o usuário é administrador
    const checkAdmin = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) return false;

        try {
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            return data.success && data.user.role === 'admin';
        } catch (error) {
            console.error('Erro ao verificar admin:', error);
            return false;
        }
    };

    // Carregar configurações da live
    const loadSettings = async () => {
        try {
            const response = await fetch('/api/stream/settings');
            const data = await response.json();

            streamTitle.value = data.title || '';
            streamDescription.value = data.description || '';
            streamUrl.value = data.streamUrl || '';
            isLive.checked = data.isLive || false;

            // Atualizar informações da live na página
            document.getElementById('streamTitle').textContent = data.title || 'Carregando...';
            document.getElementById('streamDescription').textContent = data.description || '';
            
            // Atualizar player de vídeo se a URL mudar
            const player = videojs('videoPlayer');
            if (data.streamUrl && data.isLive) {
                player.src({ src: data.streamUrl, type: 'application/x-mpegURL' });
                player.play();
            }
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        }
    };

    // Salvar configurações
    const saveStreamSettings = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
            const response = await fetch('/api/stream/settings', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: streamTitle.value,
                    description: streamDescription.value,
                    streamUrl: streamUrl.value
                })
            });

            if (response.ok) {
                // Emitir atualização via Socket.IO
                socket.emit('stream:update', {
                    title: streamTitle.value,
                    description: streamDescription.value,
                    streamUrl: streamUrl.value
                });
                alert('Configurações salvas com sucesso!');
            } else {
                const data = await response.json();
                alert(data.message || 'Erro ao salvar configurações');
            }
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            alert('Erro ao salvar configurações');
        }
    };

    // Iniciar/parar live
    const toggleStreamLive = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
            const response = await fetch('/api/stream/toggle-live', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    isLive: isLive.checked
                })
            });

            if (response.ok) {
                // Emitir atualização via Socket.IO
                socket.emit('stream:status', { isLive: isLive.checked });
                alert(isLive.checked ? 'Live iniciada!' : 'Live encerrada!');
            } else {
                const data = await response.json();
                alert(data.message || 'Erro ao alterar status da live');
            }
        } catch (error) {
            console.error('Erro ao alterar status da live:', error);
            alert('Erro ao alterar status da live');
        }
    };

    // Gerenciar tabs
    const setupTabs = () => {
        const tabs = chatTabs.querySelectorAll('.tab-button');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remover classe active de todas as tabs
                tabs.forEach(t => t.classList.remove('active'));
                // Adicionar classe active na tab clicada
                tab.classList.add('active');

                // Mostrar conteúdo correspondente
                const tabName = tab.getAttribute('data-tab');
                chatContent.classList.toggle('active', tabName === 'chat');
                adminContent.classList.toggle('active', tabName === 'admin');
            });
        });
    };

    // Event Listeners
    saveSettings.addEventListener('click', saveStreamSettings);
    toggleLive.addEventListener('click', toggleStreamLive);

    // Socket.IO Events
    socket.on('stream:update', (data) => {
        document.getElementById('streamTitle').textContent = data.title;
        document.getElementById('streamDescription').textContent = data.description;
        
        const player = videojs('videoPlayer');
        if (data.streamUrl && isLive.checked) {
            player.src({ src: data.streamUrl, type: 'application/x-mpegURL' });
            player.play();
        }
    });

    socket.on('stream:status', (data) => {
        isLive.checked = data.isLive;
        const player = videojs('videoPlayer');
        if (data.isLive && streamUrl.value) {
            player.src({ src: streamUrl.value, type: 'application/x-mpegURL' });
            player.play();
        } else {
            player.pause();
        }
    });

    // Inicialização
    const init = async () => {
        const isAdminUser = await checkAdmin();
        if (isAdminUser) {
            adminTab.style.display = 'block';
            await loadSettings();
            setupTabs();
        }
    };

    init();
}); 