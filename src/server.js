const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
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

// Configuração do Socket.IO
io.on('connection', (socket) => {
    console.log('Novo usuário conectado');

    // Incrementar contador de visualizações
    const StreamSettings = require('./models/StreamSettings');
    StreamSettings.findOne().then(settings => {
        if (settings) {
            settings.updateViewerCount(settings.viewerCount + 1);
            io.emit('viewer count', settings.viewerCount);
        }
    });

    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
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