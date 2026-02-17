# Bot Telegram - Projeto Financeiro

O bot recebe mensagens em texto livre e cria lançamentos (despesa variável, conta fixa recorrente ou compra parcelada no cartão). As mensagens são recebidas via **webhook**.

---

## 1. Criar o bot no BotFather

1. Abra o Telegram e procure por **@BotFather**.
2. Envie `/newbot`.
3. Siga as instruções:
   - **Nome do bot**: ex: `Meu Financeiro`
   - **Username**: deve terminar em `bot`, ex: `meu_financeiro_bot`
4. O BotFather retorna um **token** no formato:
   ```text
   123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
5. Guarde esse token; você vai usar como `TELEGRAM_BOT_TOKEN` no `.env`.

**Comandos úteis no BotFather (opcional):**

- `/mybots` → ver seus bots
- `/token` → ver o token do bot de novo
- `/setdescription` → descrição que aparece ao iniciar o bot (ex: "Envie despesas em texto livre: 100 gasolina, 1200 aluguel dia 5, etc.")

---

## 2. Variáveis de ambiente

No `backend/.env`:

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_WEBHOOK_URL=https://seu-dominio.com/api/v1/webhook/telegram
```

- **TELEGRAM_BOT_TOKEN**: token obtido no BotFather.
- **TELEGRAM_WEBHOOK_URL**: URL **pública** e **HTTPS** onde o Telegram envia as atualizações. Deve apontar para a rota do webhook da API (ex: `https://seu-dominio.com/api/v1/webhook/telegram`).

Em desenvolvimento local, use um túnel (ngrok, Cloudflare Tunnel, etc.) e coloque a URL do túnel em `TELEGRAM_WEBHOOK_URL`.

---

## 3. Configurar o webhook no Telegram

Depois que a API estiver no ar com a URL pública configurada:

```bash
curl -X POST "https://api.telegram.org/bot<SEU_TOKEN>/setWebhook?url=https://seu-dominio.com/api/v1/webhook/telegram"
```

Substitua `<SEU_TOKEN>` pelo valor de `TELEGRAM_BOT_TOKEN` e a URL pela sua `TELEGRAM_WEBHOOK_URL`.

Resposta esperada:

```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

Para remover o webhook (voltar a usar polling manualmente):

```bash
curl "https://api.telegram.org/bot<SEU_TOKEN>/deleteWebhook"
```

---

## 4. Vincular usuário ao Telegram

O bot identifica o usuário pelo **telegram_id** (id numérico do usuário no Telegram). É necessário vincular a conta do app ao Telegram:

1. No banco, o usuário tem o campo `telegram_id` (opcional).
2. Obtenha seu **telegram_id** (pode usar @userinfobot no Telegram ou um log temporário no webhook).
3. Atualize o usuário no banco, por exemplo:

   ```sql
   UPDATE users SET telegram_id = 'SEU_TELEGRAM_ID' WHERE email = 'seu@email.com';
   ```

Ou implemente no app um fluxo de “Vincular Telegram” (ex: comando `/vincular` + token único no app) que atualize `telegram_id` do usuário logado.

---

## 5. Exemplos de mensagens

O parser interpreta texto livre. Exemplos:

| Mensagem | Tipo | Comportamento |
|----------|------|----------------|
| `100 gasolina` | Despesa variável | Cria despesa de R$ 100 hoje com descrição "gasolina". |
| `1200 aluguel dia 5` | Conta fixa recorrente | Cria conta fixa R$ 1200, descrição "aluguel", todo dia 5. |
| `1000 em 10x no cartao dia 10` | Parcelado no cartão | Cria 10 parcelas de R$ 100 no primeiro cartão do usuário, vencendo no dia 10. |
| `500 em 6x no cartao Nubank dia 15` | Parcelado em cartão específico | Usa o cartão cujo nome contém "Nubank". |

Regras rápidas:

- **Valor** no início (número, aceita vírgula/ponto como decimal).
- **Variável**: valor + descrição (sem “dia” nem “em Nx”) → despesa com vencimento hoje.
- **Fixa**: valor + descrição + `dia N` (1–31) → conta fixa todo mês no dia N.
- **Parcelado**: valor + `em Nx` (ou `em N vezes`) + opcional `no cartao` / `no cartão` + opcional `dia N` (padrão 10). Usa o primeiro cartão do usuário ou o que tiver o nome informado.

---

## 6. Rota do webhook

- **POST** `/api/v1/webhook/telegram`  
- Corpo: objeto **Update** do Telegram (envio automático pelo Telegram).  
- A API responde **200** imediatamente e processa a mensagem em seguida; a resposta ao usuário é enviada via `sendMessage` do Bot API.

Não é necessário enviar essa rota manualmente; basta configurar a URL no `setWebhook` (passo 3).

---

## 7. Resumo

1. Criar bot no **@BotFather** e copiar o token.
2. Definir **TELEGRAM_BOT_TOKEN** e **TELEGRAM_WEBHOOK_URL** no `.env`.
3. Chamar **setWebhook** na API do Telegram com a URL pública.
4. Vincular cada usuário ao **telegram_id** (banco ou fluxo “Vincular Telegram” no app).
5. Enviar mensagens no formato dos exemplos; o bot responde confirmando ou pedindo ajustes.
