# Feminnita Backend API

API REST completa para e-commerce Feminnita com todas as funcionalidades de gestão tipo Tray.

## 📋 Funcionalidades

- ✅ **CRUD Completo de Produtos** - Criar, editar, deletar, listar produtos
- ✅ **Gestão de Categorias** - Organização de produtos por categorias
- ✅ **Sistema de Pedidos** - Criação e gestão de pedidos
- ✅ **Autenticação JWT** - Login seguro com tokens
- ✅ **Upload de Imagens** - Sistema de upload com Multer
- ✅ **Gestão de Banners** - Controle de carrosséis e banners
- ✅ **Sistema de Cupons** - Descontos e promoções
- ✅ **Reviews/Avaliações** - Avaliações de produtos
- ✅ **Configurações** - Settings editáveis do sistema
- ✅ **Middleware de Segurança** - Helmet, CORS, Rate Limiting

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+
- PostgreSQL 14+ ou MySQL 8+
- npm ou yarn

### Passo a Passo

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/feminnita.git
cd feminnita/backend
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
PORT=5000
DB_TYPE=postgres
DB_HOST=localhost
DB_NAME=feminnita
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
JWT_SECRET=sua_chave_secreta_forte
```

4. **Crie o banco de dados**
```bash
# PostgreSQL
createdb feminnita

# MySQL
mysql -u root -p -e "CREATE DATABASE feminnita;"
```

5. **Execute as migrations**
```bash
# Importe o schema
psql -d feminnita -f database/schema.sql

# Ou para MySQL
mysql -u root -p feminnita < database/schema.sql
```

6. **Inicie o servidor**
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

A API estará rodando em `http://localhost:5000`

## 📚 Documentação da API

### Autenticação

#### POST /api/auth/register
Registrar novo usuário

**Request:**
```json
{
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "password": "senha123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully"
}
```

#### POST /api/auth/login
Fazer login

**Request:**
```json
{
  "email": "joao@exemplo.com",
  "password": "senha123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "joao@exemplo.com",
    "role": "admin"
  }
}
```

### Produtos

#### GET /api/products
Listar todos os produtos

**Query Parameters:**
- `category` - Filtrar por categoria
- `search` - Buscar por nome ou código
- `minPrice` - Preço mínimo
- `maxPrice` - Preço máximo
- `active` - Produtos ativos (true/false)

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": 1,
      "code": "TP10527",
      "name": "Top Rose Drift",
      "price": 119.50,
      "stock": 50,
      "active": true
    }
  ]
}
```

#### GET /api/products/:id
Buscar produto por ID

#### POST /api/products
Criar novo produto (Admin apenas)

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "code": "TP10527",
  "name": "Top Rose Drift",
  "description": "Top fitness premium",
  "category_id": 1,
  "price": 119.50,
  "stock": 50
}
```

#### PUT /api/products/:id
Atualizar produto (Admin apenas)

#### DELETE /api/products/:id
Deletar produto (Admin apenas)

#### PATCH /api/products/:id/stock
Atualizar estoque (Admin apenas)

**Request:**
```json
{
  "stock": 100
}
```

### Categorias

#### GET /api/categories
Listar todas as categorias

#### POST /api/categories
Criar categoria (Admin apenas)

**Request:**
```json
{
  "name": "Tops",
  "slug": "tops",
  "description": "Tops fitness",
  "image_url": "https://...",
  "active": true
}
```

### Pedidos

#### GET /api/orders
Listar pedidos (Admin apenas)

#### POST /api/orders
Criar novo pedido

**Request:**
```json
{
  "customer": {
    "name": "Maria Silva",
    "email": "maria@exemplo.com",
    "cpf": "12345678900"
  },
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "unit_price": 119.50
    }
  ],
  "payment": {
    "method": "pix",
    "total": 239.00
  }
}
```

### Banners

#### GET /api/banners
Listar banners

#### POST /api/banners
Criar banner (Admin apenas)

**Request:**
```json
{
  "title": "Black Friday",
  "image_url": "https://...",
  "link_url": "/produtos",
  "position": "home",
  "active": true
}
```

### Cupons

#### GET /api/coupons
Listar cupons (Admin apenas)

#### POST /api/coupons
Criar cupom (Admin apenas)

**Request:**
```json
{
  "code": "PRIMEIRACOMPRA",
  "type": "percentage",
  "value": 10,
  "min_purchase": 100,
  "valid_until": "2024-12-31"
}
```

#### POST /api/coupons/validate
Validar cupom

**Request:**
```json
{
  "code": "PRIMEIRACOMPRA",
  "cart_total": 250.00
}
```

### Upload

#### POST /api/upload
Upload de imagem (Requer autenticação)

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**
- `image` - Arquivo de imagem (max 5MB)

**Response:**
```json
{
  "success": true,
  "url": "/uploads/1234567890.jpg"
}
```

## 🔒 Autenticação

A API usa JWT (JSON Web Tokens) para autenticação. Para acessar rotas protegidas:

1. Faça login em `/api/auth/login`
2. Use o token retornado no header `Authorization`
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

- `users` - Usuários do sistema
- `customers` - Clientes
- `products` - Produtos
- `categories` - Categorias
- `product_images` - Imagens dos produtos
- `product_variations` - Variações (cores, tamanhos)
- `orders` - Pedidos
- `order_items` - Itens dos pedidos
- `banners` - Banners/Carrosséis
- `coupons` - Cupons de desconto
- `reviews` - Avaliações
- `settings` - Configurações do sistema

Ver `database/schema.sql` para estrutura completa.

## 📁 Estrutura do Projeto

```
backend/
├── src/
│   ├── config/
│   │   └── database.js       # Configuração do banco
│   ├── controllers/
│   │   └── productController.js
│   ├── middleware/
│   │   └── auth.js          # Autenticação JWT
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── categories.js
│   │   ├── orders.js
│   │   ├── banners.js
│   │   ├── coupons.js
│   │   ├── reviews.js
│   │   ├── customers.js
│   │   ├── settings.js
│   │   └── upload.js
│   └── server.js            # Servidor principal
├── database/
│   └── schema.sql           # Schema do banco
├── uploads/                 # Arquivos enviados
├── .env.example
├── package.json
└── README.md
```

## 🛠️ Tecnologias

- **Express.js** - Framework web
- **PostgreSQL/MySQL** - Banco de dados
- **Sequelize** - ORM
- **JWT** - Autenticação
- **Multer** - Upload de arquivos
- **Bcrypt** - Hash de senhas
- **Helmet** - Segurança
- **CORS** - Cross-Origin Resource Sharing

## 🚀 Deploy

### Heroku
```bash
heroku create feminnita-api
heroku addons:create heroku-postgresql:hobby-dev
git push heroku main
```

### Vercel
```bash
vercel --prod
```

### Docker
```bash
docker build -t feminnita-backend .
docker run -p 5000:5000 feminnita-backend
```

## 📝 Licença

MIT License - veja o arquivo LICENSE para detalhes.

## 👨‍💻 Desenvolvedor

Feminnita - E-commerce completo de moda fitness feminina

---

**Dúvidas?** Abra uma issue no GitHub!
