document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const connectionStatus = document.querySelector('.connection-status');

    // Função para adicionar mensagem ao chat
    const addMessage = (username, message, isSystem = false, timestamp = null) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = isSystem ? 'system-message' : 'message';
        
        if (!isSystem) {
            const usernameSpan = document.createElement('span');
            usernameSpan.className = 'message-username';
            usernameSpan.textContent = username + ': ';
            messageDiv.appendChild(usernameSpan);
        }
        
        const contentSpan = document.createElement('span');
        contentSpan.className = 'message-content';
        contentSpan.textContent = message;
        messageDiv.appendChild(contentSpan);

        if (timestamp) {
            const timeSpan = document.createElement('span');
            timeSpan.className = 'message-time';
            timeSpan.textContent = new Date(timestamp).toLocaleTimeString();
            messageDiv.appendChild(timeSpan);
        }
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    // Eventos do Socket.IO
    socket.on('connect', () => {
        connectionStatus.textContent = 'Conectado';
        connectionStatus.style.backgroundColor = '#4CAF50';
        
        // Verificar autenticação ao conectar
        const token = localStorage.getItem('authToken');
        if (token) {
            socket.emit('auth:verify', { token }, (response) => {
                if (!response.success) {
                    localStorage.removeItem('authToken');
                    window.location.reload();
                }
            });
        }
    });

    socket.on('disconnect', () => {
        connectionStatus.textContent = 'Desconectado';
        connectionStatus.style.backgroundColor = '#f44336';
    });

    // Receber histórico de mensagens
    socket.on('chat history', (messages) => {
        chatMessages.innerHTML = ''; // Limpar mensagens existentes
        messages.forEach(msg => {
            addMessage(msg.username, msg.message, false, msg.timestamp);
        });
    });

    socket.on('chat message', (data) => {
        addMessage(data.username, data.message, false, data.timestamp);
    });

    socket.on('system message', (message) => {
        addMessage('', message, true);
    });

    // Enviar mensagem
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = messageInput.value.trim();
        
        if (message) {
            const token = localStorage.getItem('authToken');
            if (!token) {
                addMessage('', 'Você precisa estar autenticado para enviar mensagens', true);
                return;
            }

            socket.emit('chat message', { 
                message,
                token
            }, (response) => {
                if (response.success) {
                    messageInput.value = '';
                } else {
                    addMessage('', response.message || 'Erro ao enviar mensagem', true);
                }
            });
        }
    });

    // Habilitar/desabilitar botão de enviar
    messageInput.addEventListener('input', () => {
        sendButton.disabled = !messageInput.value.trim();
    });
}); 