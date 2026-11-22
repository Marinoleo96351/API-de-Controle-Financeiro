# Testes das requisições

Comandos para o **Git Bash** (no PowerShell e no cmd as aspas simples do `-d` não funcionam).
Antes de testar: MySQL rodando, `schema.sql` e `seed.sql` executados e `npm run dev` ligado.
Usuários de demonstração: `ana@email.com` e `bruno@email.com`, senha `Senha1234`.

## Token

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" \
  -d '{"email":"ana@email.com","senha":"Senha1234"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).token")
```

O token vale 1 hora. Se der 401, rode o comando de novo.

## Autenticação

(MARINO)

## Categorias

Pré-requisito: variável `$TOKEN` definida (veja a seção Token).

### Listar todas (200)

```bash
curl -i -H "Authorization: Bearer $TOKEN" http://localhost:3000/categorias
```

Resposta: lista com as categorias da Ana (`id`, `nome`, `tipo`).

### Listar só saídas (200)

```bash
curl -i -H "Authorization: Bearer $TOKEN" "http://localhost:3000/categorias?tipo=saida"
```

Resposta: só categorias com `tipo: "saida"`.

### Filtro com tipo inválido (400)

```bash
curl -i -H "Authorization: Bearer $TOKEN" "http://localhost:3000/categorias?tipo=outro"
```

Resposta: `{"erro":"Dados inválidos.","campos":{"tipo":"..."}}`.

### Criar (201)

```bash
curl -i -X POST http://localhost:3000/categorias -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"nome":"Pets","tipo":"saida"}'
```

Resposta: `{"id":19,"nome":"Pets","tipo":"saida"}` (o `id` depende do banco).

### Criar repetida (409)

Rode o comando de criar de novo.

Resposta: `{"erro":"Categoria já existe.","campos":{"nome":"..."}}`.

### Criar sem nome (400)

```bash
curl -i -X POST http://localhost:3000/categorias -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"tipo":"saida"}'
```

Resposta: `campos.nome`.

### Criar com tipo inválido (400)

```bash
curl -i -X POST http://localhost:3000/categorias -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"nome":"X","tipo":"outro"}'
```

Resposta: `campos.tipo`.

### Atualizar (200)

Troque `ID` pelo id da categoria criada.

```bash
curl -i -X PUT http://localhost:3000/categorias/ID -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"nome":"Animais","tipo":"saida"}'
```

Resposta: `{"id":ID,"nome":"Animais","tipo":"saida"}`.

### Trocar o tipo de categoria com lançamentos (409)

A categoria 3 (Alimentação) tem lançamentos no seed.

```bash
curl -i -X PUT http://localhost:3000/categorias/3 -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"nome":"Alimentação","tipo":"entrada"}'
```

Resposta: `{"erro":"Não é possível trocar o tipo ...","campos":{"tipo":"..."}}`.

### Excluir (204)

```bash
curl -i -X DELETE http://localhost:3000/categorias/ID -H "Authorization: Bearer $TOKEN"
```

Resposta: sem corpo.

### Excluir categoria com lançamentos (409)

```bash
curl -i -X DELETE http://localhost:3000/categorias/3 -H "Authorization: Bearer $TOKEN"
```

Resposta: `{"erro":"Não é possível excluir: existem lançamentos usando esta categoria."}`.

### Id inexistente (404)

```bash
curl -i -X DELETE http://localhost:3000/categorias/9999 -H "Authorization: Bearer $TOKEN"
```

Resposta: `{"erro":"Categoria não encontrada."}`.

### Sem token (401)

```bash
curl -i http://localhost:3000/categorias
```

## Fontes/destinos

Pré-requisito: variável `$TOKEN` definida (veja a seção Token).

### Listar todas (200)

```bash
curl -i -H "Authorization: Bearer $TOKEN" http://localhost:3000/fontes-destinos
```

Resposta: lista com as fontes/destinos da Ana (`id`, `nome`, `tipo`, `diaFechamento`, `diaVencimento`, `limite`). O `limite` vem como número.

### Listar só cartões (200)

```bash
curl -i -H "Authorization: Bearer $TOKEN" "http://localhost:3000/fontes-destinos?tipo=cartao_credito"
```

Resposta: só os cartões (Cartão Nubank e Visa crédito no seed).

### Filtro com tipo inválido (400)

```bash
curl -i -H "Authorization: Bearer $TOKEN" "http://localhost:3000/fontes-destinos?tipo=pix"
```

Resposta: `campos.tipo`.

### Criar cartão (201)

```bash
curl -i -X POST http://localhost:3000/fontes-destinos -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"nome":"Cartão Teste","tipo":"cartao_credito","diaFechamento":3,"diaVencimento":10,"limite":1000}'
```

Resposta: `{"id":9,"nome":"Cartão Teste","tipo":"cartao_credito","diaFechamento":3,"diaVencimento":10,"limite":1000}` (o `id` depende do banco).

### Criar conta (201)

Os campos de cartão são gravados como `null`, mesmo que venham no corpo.

```bash
curl -i -X POST http://localhost:3000/fontes-destinos -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"nome":"Carteira","tipo":"conta"}'
```

Resposta: `diaFechamento`, `diaVencimento` e `limite` nulos.

### Criar repetida (409)

Rode de novo o comando de criar cartão.

Resposta: `{"erro":"Fonte/destino já existe.","campos":{"nome":"..."}}`.

### Cartão sem limite (400)

```bash
curl -i -X POST http://localhost:3000/fontes-destinos -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"nome":"Cartão X","tipo":"cartao_credito","diaFechamento":3,"diaVencimento":10}'
```

Resposta: `campos.limite`.

### Dia de fechamento inválido (400)

```bash
curl -i -X POST http://localhost:3000/fontes-destinos -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"nome":"Cartão X","tipo":"cartao_credito","diaFechamento":32,"diaVencimento":10,"limite":1000}'
```

Resposta: `campos.diaFechamento`.

### Tipo inválido (400)

```bash
curl -i -X POST http://localhost:3000/fontes-destinos -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"nome":"Teste","tipo":"pix"}'
```

Resposta: `campos.tipo`.

### Atualizar (200)

Troque `ID` pelo id do cartão criado.

```bash
curl -i -X PUT http://localhost:3000/fontes-destinos/ID -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"nome":"Cartão Teste","tipo":"cartao_credito","diaFechamento":5,"diaVencimento":12,"limite":2000}'
```

Resposta: cartão com `diaFechamento` 5, `diaVencimento` 12 e `limite` 2000.

### Excluir (204)

```bash
curl -i -X DELETE http://localhost:3000/fontes-destinos/ID -H "Authorization: Bearer $TOKEN"
```

Resposta: sem corpo.

### Excluir fonte com lançamentos (409)

A "Conta corrente" da Ana (id 1) tem lançamentos no seed.

```bash
curl -i -X DELETE http://localhost:3000/fontes-destinos/1 -H "Authorization: Bearer $TOKEN"
```

Resposta: `{"erro":"Não é possível excluir: existem lançamentos usando esta fonte/destino."}`.

### Id inexistente (404)

```bash
curl -i -X DELETE http://localhost:3000/fontes-destinos/9999 -H "Authorization: Bearer $TOKEN"
```

Resposta: `{"erro":"Fonte/destino não encontrada."}`.

### Sem token (401)

```bash
curl -i http://localhost:3000/fontes-destinos
```

## Lançamentos

(MARINO)

## Relatórios

(ARTHUR-fontes/destinos; MARINO-categorias e faturas)

## Saúde financeira

(DESAFIO)