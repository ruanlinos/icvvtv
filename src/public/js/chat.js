document.addEventListener('DOMContentLoaded', async () => {
    const socket = io();
    const chatMessages = document.querySelector('#chat-messages');
    const messageForm = document.querySelector('#chat-form');
    const messageInput = document.querySelector('#message-input');
    const sendButton = document.querySelector('#send-button');
    const connectionStatus = document.querySelector('.connection-status');
    const loginOverlay = document.querySelector('#login-overlay');
    const registerOverlay = document.querySelector('#register-overlay');
    const loginForm = document.querySelector('#login-form');
    const registerForm = document.querySelector('#register-form');
    const showRegisterBtn = document.querySelector('#show-register');
    const showLoginBtn = document.querySelector('#show-login');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const chatTabs = document.querySelector('.chat-tabs');
    const adminTab = document.querySelector('.chat-tab[data-target="admin-tab"]');
    const spectatorsList = document.getElementById('spectators-list');

    let isAuthenticated = false;
    let isAdmin = false;

    // Função para verificar se o usuário é admin
    async function checkAdminStatus() {
        const token = localStorage.getItem('token');
        if (!token) return false;

        try {
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            console.log('Dados de verificação:', data);
            return data.user?.role === 'admin' || false;
        } catch (error) {
            console.error('Erro ao verificar status de admin:', error);
            return false;
        }
    }

    // Função para carregar o conteúdo do painel admin
    async function loadAdminContent() {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch('/api/admin/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            const adminContent = document.querySelector('.admin-content');
            adminContent.innerHTML = `
                <div class="admin-stats">
                    <div class="stat-item">
                        <h4>Espectadores Online</h4>
                        <p>${data.onlineUsers}</p>
                    </div>
                    <div class="stat-item">
                        <h4>Mensagens Hoje</h4>
                        <p>${data.messagesToday}</p>
                    </div>
                    <div class="stat-item">
                        <h4>Usuários Registrados</h4>
                        <p>${data.totalUsers}</p>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
            const adminContent = document.querySelector('.admin-content');
            adminContent.innerHTML = `
                <div class="error-message">
                    Erro ao carregar estatísticas. Tente novamente mais tarde.
                </div>
            `;
        }
    }

    // Função para gerenciar as abas
    function setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove classe active de todos os botões e conteúdos
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                // Adiciona classe active no botão clicado
                button.classList.add('active');

                // Mostra o conteúdo correspondente
                const tabId = button.getAttribute('data-tab');
                const tabContent = document.getElementById(tabId);
                if (tabContent) {
                    tabContent.classList.add('active');
                }
            });
        });
    }

    // Função para verificar autenticação
    async function checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
            showLoginOverlay();
            return;
        }

        try {
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            console.log('Auth data:', data);

            if (data.success && data.user) {
                isAuthenticated = true;
                enableChat();
                hideOverlays();
                updateUserMenu(data.user);
                
                // Verifica se é admin e configura as abas
                isAdmin = data.user.role === 'admin';
                if (isAdmin) {
                    const chatTabs = document.querySelector('.chat-tabs');
                    const adminTabButton = document.querySelector('.admin-tab');
                    
                    if (chatTabs && adminTabButton) {
                        chatTabs.style.display = 'block';
                        adminTabButton.style.display = 'flex';
                        
                        // Cria e adiciona o painel admin
                        const adminPanel = createAdminPanel();
                        document.querySelector('.chat-container').appendChild(adminPanel);
                        
                        // Carrega o conteúdo do admin
                        await loadAdminContent();
                        
                        // Configura as abas
                        setupTabs();
                    }
                }
            } else {
                showLoginOverlay();
            }
        } catch (error) {
            console.error('Erro ao verificar auth:', error);
            showLoginOverlay();
        }
    }

    // Verificar autenticação ao carregar
    checkAuth();

    function showLoginOverlay() {
        loginOverlay.classList.add('active');
        registerOverlay.classList.remove('active');
    }

    function showRegisterOverlay() {
        registerOverlay.classList.add('active');
        loginOverlay.classList.remove('active');
    }

    function hideOverlays() {
        loginOverlay.classList.remove('active');
        registerOverlay.classList.remove('active');
    }

    function enableChat() {
        hideOverlays();
        messageInput.disabled = false;
        sendButton.disabled = false;
    }

    function disableChat() {
        messageInput.disabled = true;
        sendButton.disabled = true;
    }

    function addMessage(message, isUser = false) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(isUser ? 'user' : 'system');
        messageElement.textContent = message;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Eventos do Socket.IO
    socket.on('connect', () => {
        connectionStatus.textContent = 'Conectado';
        connectionStatus.classList.remove('disconnected');
        connectionStatus.classList.add('connected');
    });

    socket.on('disconnect', () => {
        connectionStatus.textContent = 'Desconectado';
        connectionStatus.classList.remove('connected');
        connectionStatus.classList.add('disconnected');
    });

    socket.on('chat message', (data) => {
        addMessage(`${data.user}: ${data.message}`);
    });

    socket.on('system message', (message) => {
        addMessage(message);
    });

    socket.on('spectators update', (spectators) => {
        spectatorsList.innerHTML = '';
        spectators.forEach(spectator => {
            const li = document.createElement('li');
            li.textContent = spectator;
            spectatorsList.appendChild(li);
        });
    });

    // Eventos de formulário
    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            showLoginOverlay();
            return;
        }

        const message = messageInput.value.trim();
        if (message) {
            socket.emit('chat message', message);
            addMessage(message, true);
            messageInput.value = '';
        }
    });

    messageInput.addEventListener('input', () => {
        sendButton.disabled = !messageInput.value.trim() || !isAuthenticated;
    });

    // Eventos de autenticação
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm.querySelector('input[type="email"]').value;
        const password = loginForm.querySelector('input[type="password"]').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                isAuthenticated = true;
                enableChat();
                hideLoginOverlay();
                updateUserMenu(data.user);
            } else {
                addMessage('Erro ao fazer login. Verifique suas credenciais.', false);
            }
        } catch (error) {
            addMessage('Erro ao conectar com o servidor.', false);
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = registerForm.querySelector('input[type="text"]').value;
        const email = registerForm.querySelector('input[type="email"]').value;
        const password = registerForm.querySelector('input[type="password"]').value;

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            if (response.ok) {
                addMessage('Registro realizado com sucesso! Faça login para continuar.', false);
                showLoginOverlay();
            } else {
                addMessage('Erro ao registrar. Tente novamente.', false);
            }
        } catch (error) {
            addMessage('Erro ao conectar com o servidor.', false);
        }
    });

    // Eventos de navegação entre overlays
    showLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        hideRegisterOverlay();
        showLoginOverlay();
    });

    showRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        hideLoginOverlay();
        showRegisterOverlay();
    });

    // Funções auxiliares
    function hideLoginOverlay() {
        loginOverlay.classList.remove('active');
    }

    function hideRegisterOverlay() {
        registerOverlay.classList.remove('active');
    }

    function updateUserMenu(user) {
        const userMenu = document.querySelector('.user-menu');
        const userName = document.getElementById('userName');
        const logoutBtn = document.getElementById('logoutBtn');

        if (userMenu && userName && logoutBtn) {
            userName.textContent = user.name;
            userMenu.style.display = 'block';

            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('token');
                disableChat();
                showLoginOverlay();
                userMenu.style.display = 'none';
            });
        }
    }

    // Função para criar o painel admin
    function createAdminPanel() {
        const adminTab = document.createElement('div');
        adminTab.className = 'tab-content';
        adminTab.id = 'admin-tab';
        adminTab.innerHTML = `
            <div class="admin-panel">
                <h3>Painel de Administração</h3>
                <div class="admin-content">
                    <div class="admin-stats">
                        <div class="stat-item">
                            <h4>Espectadores Online</h4>
                            <p>0</p>
                        </div>
                        <div class="stat-item">
                            <h4>Mensagens Hoje</h4>
                            <p>0</p>
                        </div>
                        <div class="stat-item">
                            <h4>Usuários Registrados</h4>
                            <p>0</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return adminTab;
    }
}); 