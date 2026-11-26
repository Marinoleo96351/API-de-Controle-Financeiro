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
| GET | `/saude-financeira` | sim | Indicadores de saúde financeira, projeção de 3 meses e dicas |

## Decisões tomadas

- **Dono vem do token:** o `id` do usuário é lido do JWT (`req.auth.id`), nunca do corpo da requisição. Toda consulta filtra por `usuario_id`.
- **Registro de outro usuário devolve 404**, nunca 403: para quem pede, o registro não existe.
- **Categoria com lançamentos não troca de tipo** (409), senão uma saída ficaria com categoria de entrada.
- **Categoria ou fonte/destino com lançamentos não pode ser excluída** (409), por causa da chave estrangeira.
- **Nome repetido** devolve 409: categoria é única por usuário, nome e tipo; fonte/destino é única por usuário e nome.
- **Conta e renda gravam os campos de cartão como `null`**, mesmo que venham no corpo.
- **Parcelamento:** só saída em cartão de crédito, de 1 a 48 parcelas. As parcelas têm o mesmo `grupo_parcelamento`.
- **Valores monetários** chegam do MySQL como texto (`DECIMAL`) e são convertidos para número antes de calcular e responder.
- **Datas** no formato `AAAA-MM-DD`; datas inexistentes (como 2026-02-30) são recusadas.
- **Relatório por fonte/destino:** `inicio` e `fim` são obrigatórios, e `inicio` não pode ser depois de `fim` (400).
- **Senha** guardada apenas como hash (bcrypt); o `senha_hash` nunca sai nas respostas.
- **Desafio (`GET /saude-financeira`):** o mês analisado é o último mês completo (o anterior ao atual). As médias usam os 3 últimos meses completos, contando só os meses em que o usuário teve lançamentos.
- **Indicadores:** taxa de poupança = (entradas − saídas) ÷ entradas do mês analisado; comprometimento dos cartões = média mensal das faturas que vencem nos próximos 3 meses ÷ média mensal de entradas; meses de reserva = saldo das contas marcadas como reserva ÷ média mensal de saídas; categoria fora da curva = gasto do mês analisado acima da média dos 3 meses anteriores.
- **Projeção de 3 meses:** entradas previstas = média das entradas; saídas previstas = média das saídas que não são de cartão + a fatura do mês.
- **Dicas:** são regras com limites fixos (`if`), não inteligência artificial. Os limites também vêm no campo `limites` da resposta:

| Indicador | Gera dica quando |
| --- | --- |
| Taxa de poupança | menor que 10% |
| Comprometimento dos cartões | maior que 30% |
| Meses de reserva | menor que 3 |
| Categoria fora da curva | mais de 20% acima da média |
| Projeção | saldo previsto negativo |

- **Aviso:** toda resposta traz o campo `aviso`: informações educativas, sem recomendação financeira profissional.

## Testes

Os comandos de teste de todas as rotas estão em [testes/requisicoes.md](testes/requisicoes.md).