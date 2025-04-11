document.addEventListener('DOMContentLoaded', () => {
    const loginOverlay = document.getElementById('login-overlay');
    const registerOverlay = document.getElementById('register-overlay');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterBtn = document.getElementById('show-register');
    const showLoginBtn = document.getElementById('show-login');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    const logoutBtn = document.getElementById('logoutBtn');
    const chatMessages = document.getElementById('chat-messages');

    // Verificar se o usuário está autenticado
    const checkAuth = () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            showLoginOverlay();
            disableChat();
            return;
        }

        fetch('/api/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Token inválido');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                enableChat();
                showUserMenu(data.user);
                hideAuthOverlays();
            } else {
                throw new Error('Falha na verificação');
            }
        })
        .catch(error => {
            console.error('Erro na verificação:', error);
            localStorage.removeItem('authToken');
            showLoginOverlay();
            disableChat();
        });
    };

    // Mostrar overlay de login
    const showLoginOverlay = () => {
        loginOverlay.classList.add('active');
        registerOverlay.classList.remove('active');
        chatMessages.style.opacity = '0.5';
    };

    // Mostrar overlay de registro
    const showRegisterOverlay = () => {
        registerOverlay.classList.add('active');
        loginOverlay.classList.remove('active');
        chatMessages.style.opacity = '0.5';
    };

    // Esconder todos os overlays
    const hideAuthOverlays = () => {
        loginOverlay.classList.remove('active');
        registerOverlay.classList.remove('active');
        chatMessages.style.opacity = '1';
    };

    // Desabilitar chat
    const disableChat = () => {
        messageInput.disabled = true;
        sendButton.disabled = true;
        chatMessages.style.opacity = '0.5';
    };

    // Habilitar chat
    const enableChat = () => {
        messageInput.disabled = false;
        sendButton.disabled = false;
        hideAuthOverlays();
    };

    // Mostrar menu do usuário
    const showUserMenu = (user) => {
        userName.textContent = user.name;
        userMenu.style.display = 'block';
    };

    // Event Listeners
    showRegisterBtn.addEventListener('click', showRegisterOverlay);
    showLoginBtn.addEventListener('click', showLoginOverlay);

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('authToken');
        userMenu.style.display = 'none';
        showLoginOverlay();
        disableChat();
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorElement = document.getElementById('login-error');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('authToken', data.token);
                enableChat();
                showUserMenu(data.user);
            } else {
                errorElement.textContent = data.message || 'Erro ao fazer login';
            }
        } catch (error) {
            errorElement.textContent = 'Erro ao conectar com o servidor';
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const errorElement = document.getElementById('register-error');

        if (password !== confirmPassword) {
            errorElement.textContent = 'As senhas não coincidem';
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('authToken', data.token);
                enableChat();
                showUserMenu(data.user);
            } else {
                errorElement.textContent = data.message || 'Erro ao criar conta';
            }
        } catch (error) {
            errorElement.textContent = 'Erro ao conectar com o servidor';
        }
    });

    // Verificar autenticação ao carregar a página
    checkAuth();
}); 