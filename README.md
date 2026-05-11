# 🛍️ Feminnita - E-commerce Completo

E-commerce completo de moda fitness feminina com frontend Next.js e backend Node.js/Express. Sistema completo de gestão tipo Tray com todas as funcionalidades profissionais.

![Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 📋 Sobre o Projeto

Feminnita é uma plataforma completa de e-commerce desenvolvida para moda fitness feminina, inspirada no site Angê, com um painel administrativo completo similar ao Tray.

### ✨ Funcionalidades Principais

#### **Frontend (Loja)**
- 🏠 Homepage com produtos em destaque
- 🔍 Busca avançada com filtros (categoria, cor, tamanho, preço)
- 🛒 Carrinho de compras completo
- 💳 Checkout com múltiplas formas de pagamento (PIX, Boleto, Cartão)
- 📦 Cálculo de frete integrado (Melhor Envio)
- ⭐ Sistema de reviews e avaliações
- ❤️ Lista de favoritos/wishlist
- 🔄 Comparação de até 3 produtos
- 📱 WhatsApp flutuante
- 📧 Newsletter
- 📸 Galeria Instagram
- 🎟️ Sistema de cupons de desconto
- 🔔 Notificações de estoque
- 👤 Área do cliente com histórico de pedidos

#### **Backend (API + Admin)**
- 🔐 Autenticação JWT
- 📦 CRUD completo de produtos
- 🏷️ Gestão de categorias
- 🛍️ Gestão de pedidos
- 🎨 Gestão de banners/carrosséis
- 🎫 Sistema de cupons
- ⭐ Gestão de reviews
- 📊 Dashboard com estatísticas
- 🖼️ Upload de imagens
- ⚙️ Configurações editáveis
- 📧 Integração com email
- 💰 Integração com gateways de pagamento

## 🚀 Tecnologias Utilizadas

### Frontend
- **Next.js 15** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI
- **Lucide Icons** - Ícones
- **Bun** - Runtime e package manager

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **PostgreSQL/MySQL** - Banco de dados
- **Sequelize** - ORM
- **JWT** - Autenticação
- **Multer** - Upload de arquivos
- **Bcrypt** - Hash de senhas

### Integrações
- **Google Analytics 4** - Analytics
- **Facebook Pixel** - Marketing
- **Melhor Envio** - Frete
- **Stripe** - Pagamentos
- **Nodemailer** - Email

## 📂 Estrutura do Projeto

```
feminnita/
├── src/                      # Frontend Next.js
│   ├── app/                  # Pages (App Router)
│   │   ├── admin/           # Painel admin
│   │   ├── produto/         # Páginas de produto
│   │   ├── carrinho/        # Carrinho
│   │   ├── checkout/        # Checkout
│   │   ├── meus-pedidos/    # Área do cliente
│   │   └── ...
│   ├── components/          # Componentes reutilizáveis
│   └── data/               # JSON de dados (mock)
├── backend/                # Backend API
│   ├── src/
│   │   ├── routes/         # Rotas da API
│   │   ├── controllers/    # Controllers
│   │   ├── middleware/     # Middleware (auth, etc)
│   │   ├── config/         # Configurações
│   │   └── server.js       # Servidor principal
│   └── database/           # Schemas e migrations
└── README.md
```

## 🔧 Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- Bun (ou npm/yarn)
- PostgreSQL 14+ ou MySQL 8+

### 1️⃣ Frontend

```bash
# Instalar dependências
cd feminnita
bun install

# Configurar variáveis de ambiente (opcional)
cp .env.example .env.local

# Executar em desenvolvimento
bun run dev
```

Frontend rodará em: `http://localhost:3000`

### 2️⃣ Backend

```bash
# Instalar dependências
cd backend
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Criar banco de dados
createdb feminnita

# Executar migrations
psql -d feminnita -f database/schema.sql

# Executar servidor
npm run dev
```

Backend rodará em: `http://localhost:5000`

## 📖 Documentação

### Frontend

#### Páginas Principais
- `/` - Homepage
- `/produtos` - Listagem de produtos com filtros
- `/produto/[id]` - Página de produto individual
- `/carrinho` - Carrinho de compras
- `/checkout` - Finalização de compra
- `/pedido-confirmado` - Confirmação de pedido
- `/meus-pedidos` - Histórico de pedidos
- `/favoritos` - Lista de favoritos
- `/comparar` - Comparação de produtos
- `/admin` - Painel administrativo

#### Admin
- `/admin/dashboard` - Dashboard com estatísticas
- `/admin/produtos` - Gestão de produtos
- `/admin/pedidos` - Gestão de pedidos
- `/admin/configuracoes` - Configurações do sistema
- `/cupons` - Gestão de cupons

### Backend API

Ver documentação completa em [`backend/README.md`](backend/README.md)

#### Endpoints Principais

```
POST   /api/auth/login           # Login
POST   /api/auth/register        # Registro
GET    /api/products             # Listar produtos
POST   /api/products             # Criar produto
GET    /api/orders               # Listar pedidos
POST   /api/orders               # Criar pedido
GET    /api/categories           # Listar categorias
POST   /api/upload               # Upload de imagem
```

## 🗄️ Banco de Dados

### Tabelas Principais
- `users` - Usuários do sistema
- `products` - Produtos
- `categories` - Categorias
- `orders` - Pedidos
- `coupons` - Cupons de desconto
- `reviews` - Avaliações
- `banners` - Banners/Carrosséis

Ver schema completo em [`backend/database/schema.sql`](backend/database/schema.sql)

## 🎨 Funcionalidades Detalhadas

### 1. Sistema de Produtos
- CRUD completo de produtos
- Múltiplas imagens por produto
- Variações de cor e tamanho
- Controle de estoque
- Produtos em destaque

### 2. Carrinho e Checkout
- Adicionar/remover produtos
- Atualizar quantidades
- Cálculo automático de frete
- Desconto PIX (10%)
- Múltiplas formas de pagamento
- Aplicação de cupons

### 3. Sistema de Cupons
- Cupons percentuais ou fixos
- Valor mínimo de compra
- Limite de usos
- Data de validade
- Desconto máximo

### 4. Reviews
- Avaliação por estrelas (1-5)
- Comentários
- Tamanho e cor comprados
- Botão "útil"
- Aprovação por admin

### 5. Integrações
- **Marketing**: Google Analytics, Facebook Pixel, Hotjar
- **Frete**: Melhor Envio (PAC, SEDEX, Jadlog)
- **Pagamento**: PIX, Boleto, Cartão
- **Email**: Confirmação de pedido, Newsletter

## 🚀 Deploy

### Frontend (Vercel)
```bash
vercel --prod
```

### Backend (Heroku)
```bash
heroku create feminnita-api
heroku addons:create heroku-postgresql
git push heroku main
```

## 📊 Próximos Passos para Produção

### Backend Real
- [ ] Implementar todas as queries do banco de dados
- [ ] Conectar com banco PostgreSQL/MySQL real
- [ ] Implementar validações completas
- [ ] Rate limiting e segurança
- [ ] Testes unitários e integração

### Integrações Reais
- [ ] Melhor Envio API completa
- [ ] Gateway de pagamento (Stripe, Mercado Pago)
- [ ] Serviço de email (SendGrid, Mailgun)
- [ ] Storage de imagens (Cloudinary, S3)
- [ ] Webhooks de pagamento

### Funcionalidades Adicionais
- [ ] Recuperação de senha
- [ ] Verificação de email
- [ ] Carrinho abandonado automático
- [ ] Recomendação de produtos
- [ ] Programa de fidelidade
- [ ] Multi-idioma

## 📝 Como Usar

### Testando a Loja
1. Acesse `http://localhost:3000`
2. Navegue pelos produtos
3. Adicione itens ao carrinho
4. Finalize uma compra de teste
5. Veja o pedido em "Meus Pedidos"

### Acessando o Admin
1. Acesse `http://localhost:3000/admin`
2. Use as credenciais padrão ou crie uma conta
3. Gerencie produtos, pedidos e configurações

### Usando a API
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@feminnita.com","password":"senha123"}'

# Listar produtos
curl http://localhost:5000/api/products

# Criar produto (com token)
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"TP001","name":"Top Fitness","price":99.90}'
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Ver arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Autor

**Feminnita Team**

- Website: [feminnita.com](https://feminnita.com)
- Email: contato@feminnita.com

## 📞 Suporte

Tem dúvidas ou problemas?

- Abra uma [Issue](https://github.com/seu-usuario/feminnita/issues)
- Email: suporte@feminnita.com

---

⭐ Se este projeto te ajudou, deixe uma estrela no GitHub!

**Desenvolvido com ❤️ para mulheres que amam fitness**
