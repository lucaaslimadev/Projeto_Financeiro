# Próximos passos – Webhook do Telegram

## 1. Pegar a URL do ngrok

No terminal onde o **ngrok** está rodando, na linha **Forwarding**, copie a URL **https** (ex.: `https://abc123.ngrok-free.app`).

---

## 2. Colocar a URL no .env

Abra `backend/.env` e preencha:

```env
TELEGRAM_WEBHOOK_URL=https://SUA-URL-DO-NGROK.ngrok-free.app/api/v1/webhook/telegram
```

(Substitua `SUA-URL-DO-NGROK` pela URL que você copiou.)

---

## 3. Registrar o webhook no Telegram

No terminal, rode (trocando pela **mesma** URL do passo 2):

```bash
curl -X POST "https://api.telegram.org/bot8593967819:AAGyY0l0JW34ZsW7uTBCBpowQjm-OzF0CyU/setWebhook?url=https://SUA-URL-DO-NGROK.ngrok-free.app/api/v1/webhook/telegram"
```

Resposta esperada: `{"ok":true,"result":true,...}`

---

## 4. Conferir se está tudo rodando

- **Backend:** `cd backend && npm run dev` (porta 3001)
- **Ngrok:** `ngrok http 3001` (em outro terminal)

---

## 5. Testar no Telegram

Abra o seu bot no Telegram e envie, por exemplo:

- `100 gasolina`
- `1200 aluguel dia 5`

O bot deve responder confirmando o lançamento (usuário Lucas Lima já está vinculado ao seu telegram_id).
