# API de Controle Financeiro

Trabalho final da disciplina de Programação Web Back-end: uma API REST para controle financeiro pessoal, com usuários, categorias, fontes/destinos, lançamentos (inclusive parcelados), relatórios e previsão de faturas de cartão.

**Integrantes:** Leonardo Marino Scarparo Silva e Arthur Henrique de Melo Almeida

**Tecnologias:** Node.js, Express, MySQL (mysql2), JWT (jsonwebtoken e express-jwt) e bcrypt.

## Requisitos

- Node.js instalado
- MySQL 8.0.16 ou mais novo (o `CHECK` só funciona a partir dessa versão)
- Git


## Como rodar o projeto

1. Clone o repositório e entre na pasta:

```bash
git clone https://github.com/Marinoleo96351/API-de-Controle-Financeiro.git
cd API-de-Controle-Financeiro
```

2. Instale as dependências:

```bash
npm install
```

3. Crie o arquivo `.env` a partir do exemplo e preencha a senha do seu MySQL:

```bash
cp .env.example .env
```

4. Crie o banco e as tabelas, e depois carregue os dados de demonstração (o MySQL precisa estar rodando):

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

Se o comando `mysql` não for reconhecido no Windows, use o caminho completo, por exemplo `"/c/Program Files/MySQL/MySQL Server 8.0/bin/mysql"`, ou execute os dois arquivos no MySQL Workbench.

5. Suba a API:

```bash
npm run dev
```

A API fica em `http://localhost:3000`.

Para refazer o banco do zero: `DROP DATABASE api_financas;` e rode o `schema.sql` e o `seed.sql` de novo.

## Usuários de demonstração

| Usuário | E-mail | Senha |
| --- | --- | --- |
| Ana Souza | ana@email.com | Senha1234 |
| Bruno Lima | bruno@email.com | Senha1234 |

A Ana tem lançamentos de setembro a novembro de 2026 e uma compra parcelada (Notebook em 10x). O Bruno tem poucos lançamentos, para mostrar que um usuário não vê os dados do outro.


## Rotas

Todas exigem o cabeçalho `Authorization: Bearer TOKEN`, exceto cadastro e login.

| Método | Caminho | Protegida | O que faz |
| --- | --- | --- | --- |
| POST | `/auth/cadastro` | não | Cria o usuário (com categorias padrão e Conta corrente) |
| POST | `/auth/login` | não | Devolve o token JWT (vale 1 hora) |
| GET | `/auth/me` | sim | Dados do usuário logado |
| GET | `/categorias` | sim | Lista categorias (filtro `?tipo=entrada` ou `saida`) |
| POST | `/categorias` | sim | Cria categoria |
| PUT | `/categorias/:id` | sim | Atualiza categoria (não troca o tipo se houver lançamentos) |
| DELETE | `/categorias/:id` | sim | Exclui categoria (409 se tiver lançamentos) |
| GET | `/fontes-destinos` | sim | Lista fontes/destinos (filtro `?tipo=`) |
| POST | `/fontes-destinos` | sim | Cria fonte/destino |
| PUT | `/fontes-destinos/:id` | sim | Atualiza fonte/destino |
| DELETE | `/fontes-destinos/:id` | sim | Exclui fonte/destino (409 se tiver lançamentos) |
| GET | `/lancamentos` | sim | Lista com filtros (`inicio`, `fim`, `tipo`, `categoriaId`, `fonteDestinoId`, `pagina`), paginação de 20 e resumo. Sem datas, usa o mês corrente |
| POST | `/lancamentos` | sim | Cria lançamento; com `parcelas` (1 a 48) cria compra parcelada, só saída em cartão de crédito |
| GET | `/lancamentos/:id` | sim | Busca um lançamento |
| PUT | `/lancamentos/:id` | sim | Atualiza um lançamento |
| DELETE | `/lancamentos/:id` | sim | Exclui um lançamento (`?todasParcelas=true` exclui o grupo inteiro) |
| GET | `/relatorios/fontes-destinos` | sim | Entradas por fonte, saídas por destino e saldo das contas (`?inicio=&fim=`) |
| GET | `/relatorios/categorias` | sim | Relatório por categoria |
| GET | `/relatorios/faturas` | sim | Previsão de faturas dos cartões |