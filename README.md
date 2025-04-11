# ICVV TV - Sistema de Streaming para Igreja

Sistema de streaming ao vivo com chat integrado para igrejas, desenvolvido com Node.js, Express e Socket.IO.

## Funcionalidades

- Sistema de autenticação (login/registro)
- Chat em tempo real
- Moderação de chat (banir/excluir mensagens)
- Gerenciamento de transmissão ao vivo
- Interface responsiva e moderna

## Requisitos

- Node.js (v14 ou superior)
- MongoDB
- NPM ou Yarn

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/icvvtv.git
cd icvvtv
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/icvvtv
SESSION_SECRET=sua_chave_secreta_muito_segura
JWT_SECRET=sua_chave_jwt_muito_segura
```

4. Inicie o servidor:
```bash
npm start
```

Para desenvolvimento, use:
```bash
npm run dev
```

## Estrutura do Projeto

```
icvvtv/
├── src/
│   ├── models/         # Modelos do MongoDB
│   ├── routes/         # Rotas da API
│   ├── middleware/     # Middlewares
│   ├── public/         # Arquivos estáticos
│   │   ├── css/
│   │   ├── js/
│   │   └── index.html
│   └── server.js       # Arquivo principal
├── .env                # Variáveis de ambiente
└── package.json        # Dependências e scripts
```

## Uso

1. Acesse `http://localhost:3000` no navegador
2. Crie uma conta ou faça login
3. Para moderadores e administradores:
   - Acesse o painel de controle em `/admin`
   - Gerencie usuários e configurações da transmissão

## Contribuição

Contribuições são bem-vindas! Por favor, abra uma issue para discutir mudanças ou envie um pull request.

## Licença

Este projeto está licenciado sob a licença MIT. 