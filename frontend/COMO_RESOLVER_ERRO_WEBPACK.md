# Erro: Cannot read properties of undefined (reading 'call')

Esse erro no Next.js em dev costuma ser **cache ou Service Worker** no navegador. Siga na ordem:

## 1. Limpar cache do Next e do navegador

1. **Pare** o servidor do frontend (Ctrl+C).
2. Na **raiz do projeto** (onde está `package.json` com workspaces), rode:

```bash
rm -rf frontend/.next node_modules frontend/node_modules package-lock.json
npm cache clean --force
npm install
```

3. Abra o site em **aba anônima** ou:
   - Chrome: F12 → Application → Storage → **Clear site data** (para `localhost:3000`).
   - Ou desregistre **Service Workers**: Application → Service Workers → Unregister.
4. Suba de novo e acesse:

```bash
npm run dev:frontend
```

Acesse: **http://localhost:3000**

## 2. Se ainda der erro: rodar só o frontend (sem workspace)

Às vezes o problema é o monorepo (pacotes no root). Rode tudo **só dentro do frontend**:

```bash
cd frontend
rm -rf .next node_modules
npm install
npm run dev
```

Use **http://localhost:3000** de novo (de preferência em aba anônima).

## 3. Hard reload

Se a página carregar mas o erro aparecer ao navegar ou ao salvar arquivos:

- **Ctrl+Shift+R** (Windows/Linux) ou **Cmd+Shift+R** (Mac) para recarregar sem cache.

---

O frontend usa **Turbopack** em dev (`next dev --turbo`) para evitar esse erro. Veja **SUBIR_PROJETO.md** na raiz do projeto.
