const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Rota de registro
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validação básica dos dados
        if (!username || !email || !password) {
            return res.status(400).json({ 
                message: 'Todos os campos são obrigatórios',
                fields: {
                    username: !username ? 'Nome de usuário é obrigatório' : null,
                    email: !email ? 'Email é obrigatório' : null,
                    password: !password ? 'Senha é obrigatória' : null
                }
            });
        }

        // Verificar se usuário já existe
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            return res.status(400).json({ 
                message: 'Usuário ou email já existe',
                field: user.email === email ? 'email' : 'username'
            });
        }

        // Criar novo usuário
        user = new User({
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password
        });

        await user.save();

        // Gerar token JWT
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({ 
            message: 'Usuário criado com sucesso',
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Erro no registro:', error);
        
        // Tratamento de erros de validação do Mongoose
        if (error.name === 'ValidationError') {
            const errors = {};
            Object.keys(error.errors).forEach(key => {
                errors[key] = error.errors[key].message;
            });
            return res.status(400).json({ 
                message: 'Erro de validação',
                errors
            });
        }

        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// Rota de login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validação básica
        if (!email || !password) {
            return res.status(400).json({ 
                message: 'Email e senha são obrigatórios',
                fields: {
                    email: !email ? 'Email é obrigatório' : null,
                    password: !password ? 'Senha é obrigatória' : null
                }
            });
        }

        // Verificar se usuário existe
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        // Verificar se está banido
        if (user.isBanned) {
            return res.status(403).json({ message: 'Usuário banido' });
        }

        // Verificar senha
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        // Atualizar último login
        await user.updateLastLogin();

        // Gerar token JWT
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

module.exports = router; 