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

(ARTHUR)

## Fontes/destinos

(ARTHUR)

## Lançamentos

(MARINO)

## Relatórios

(ARTHUR-fontes/destinos; MARINO-categorias e faturas)

## Saúde financeira

(DESAFIO)