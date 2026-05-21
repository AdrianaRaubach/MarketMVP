#  **MarketMVP**
<img src="src/images/image.png" alt="Exemplo imagem">

> Este projeto foi desenvolvido como Atividade avaliada da disciplina Web-2, do Instituto Federal do Rio Grande do Sul.



## 💻 **Tecnologias utilizadas**

Este projeto foi desenvolvido utilizando as seguintes tecnologias:

- ### <img align="center" alt="Node" height="30" width="40" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg"> Node.js

- ### <img align="center" alt="Express" height="30" width="40" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/express/express-original.svg"> Express
- ### <img align="center" alt="SQLite" height="30" width="40" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/sqlite/sqlite-original.svg"> Better-SQLite3

- ### <img align="center" alt="Zod" height="30" width="40" src="https://zod.dev/logo/logo-glow.png"> Zod

- ### <img align="center" alt="TypeScript" height="30" width="40" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg"> TypeScript


- ### <img align="center" alt="Bcrypt" height="30" width="40" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg"> BcryptJS


- ### <img align="center" alt="Nodemailer" height="30" width="40" src="https://nodemailer.com/img/nm_logo_200x136.png"> Nodemailer

- ### <% EJS

- ### <img align="center" alt="Prisma" height="30" width="40"  src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/prisma/prisma-original.svg" /> Prisma



## 🛠️ Instalação e Configuração

1. Clone este repositório

```bash
git clone https://github.com/AdrianaRaubach/MarketMVP.git
```

2. Instale os pacotes e dependências usando npm

```bash
npm install
```

3. Configure as variáveis de ambiente no arquivo .env

```
SESSION_SECRET=
PORT=
ADMIN_EMAIL=admin@marketmvp.com
ADMIN_PASSWORD=Admin@123456
ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=System
SMTP_USER=
SMTP_PASS=

```

4. Rode as migrações do prisma

```bash
npx npm run migrate
```

5. Crie o usuário ADMIN

```bash
npx npm run seed
```

6. Inicie o servidor em modo desenvolvimento

```bash
npx npm run dev:container
```

7. Acesse a aplicação

```bash
http://localhost:3000
```





## ✏️ Autora

- [Adriana Raubach](https://github.com/AdrianaRaubach)
