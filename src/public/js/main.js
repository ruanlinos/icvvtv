const socket = io();
let currentUser = null;
let token = null;

// Elementos do DOM
const loginArea = document.getElementById('loginArea');
const registerArea = document.getElementById('registerArea');
const chatArea = document.getElementById('chatArea');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const messageForm = document.getElementById('messageForm');
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');

// Event Listeners
document.getElementById('showRegister').addEventListener('click', (e) => {
    e.preventDefault();
    loginArea.classList.add('d-none');
    registerArea.classList.remove('d-none');
});

document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    registerArea.classList.add('d-none');
    loginArea.classList.remove('d-none');
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

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
            token = data.token;
            currentUser = data.user;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(currentUser));
            showChat();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        alert('Erro ao fazer login');
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    console.log("username", username);
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            alert('Conta criada com sucesso! Faça login para continuar.');
            registerArea.classList.add('d-none');
            loginArea.classList.remove('d-none');
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Erro ao registrar:', error);
        alert('Erro ao registrar');
    }
});

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!messageInput.value.trim()) return;

    socket.emit('chat message', {
        userId: currentUser.id,
        username: currentUser.username,
        content: messageInput.value
    });

    messageInput.value = '';
});

// Socket.IO Events
socket.on('chat message', (msg) => {
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.innerHTML = `
        <div class="username">${msg.username}</div>
        <div class="time">${new Date().toLocaleTimeString()}</div>
        <div class="content">${msg.content}</div>
    `;
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

// Funções auxiliares
function showChat() {
    loginArea.classList.add('d-none');
    registerArea.classList.add('d-none');
    chatArea.classList.remove('d-none');
}

// Verificar se já está logado
function checkAuth() {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
        token = storedToken;
        currentUser = JSON.parse(storedUser);
        showChat();
    }
}

// Inicialização
checkAuth(); 