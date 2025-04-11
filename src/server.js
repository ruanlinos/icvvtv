const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
require('dotenv').config();

const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const streamRoutes = require('./routes/stream');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Conectar ao banco de dados
connectDB();

// Disponibilizar io globalmente para as rotas
app.set('io', io);

// Configuração do Express
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuração da sessão
const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'sua_chave_secreta',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 24 * 60 * 60 // 1 dia
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 1 dia
    }
});

app.use(sessionMiddleware);

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/stream', streamRoutes);

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Array para armazenar as mensagens da sessão atual
const chatMessages = [];

// Configuração do Socket.IO
io.on('connection', (socket) => {
    console.log('Novo usuário conectado');

    // Enviar histórico de mensagens para o novo usuário
    socket.emit('chat history', chatMessages);

    // Incrementar contador de visualizações
    const StreamSettings = require('./models/StreamSettings');
    StreamSettings.findOne().then(settings => {
        if (settings) {
            settings.updateViewerCount(settings.viewerCount + 1);
            io.emit('viewer count', settings.viewerCount);
        }
    });

    socket.on('chat message', async (data) => {
        try {
            const token = data.token;
            if (!token) {
                socket.emit('system message', 'Você precisa estar autenticado para enviar mensagens');
                return;
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);
            
            if (!user) {
                socket.emit('system message', 'Usuário não encontrado');
                return;
            }

            const messageData = {
                username: user.username,
                message: data.message,
                timestamp: new Date()
            };

            // Adicionar mensagem ao histórico
            chatMessages.push(messageData);

            // Limitar o histórico a 100 mensagens
            if (chatMessages.length > 100) {
                chatMessages.shift();
            }

            // Enviar mensagem para todos os usuários
            io.emit('chat message', messageData);
        } catch (error) {
            console.error('Erro ao processar mensagem:', error);
            socket.emit('system message', 'Erro ao enviar mensagem');
        }
    });

    socket.on('disconnect', () => {
        console.log('Usuário desconectado');
        // Decrementar contador de visualizações
        StreamSettings.findOne().then(settings => {
            if (settings && settings.viewerCount > 0) {
                settings.updateViewerCount(settings.viewerCount - 1);
                io.emit('viewer count', settings.viewerCount);
            }
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}); 