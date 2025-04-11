const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Token não fornecido' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded.userId });

        if (!user) {
            return res.status(401).json({ message: 'Usuário não encontrado' });
        }

        if (user.isBanned) {
            return res.status(403).json({ message: 'Usuário banido' });
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token inválido' });
    }
};

const isModerator = (req, res, next) => {
    if (req.user.role !== 'moderator' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado' });
    }
    next();
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado' });
    }
    next();
};

module.exports = { auth, isModerator, isAdmin }; 