# CicloPag

**O ciclo completo da sua empresa.**

Base inicial do SaaS CicloPag, construída com React, TypeScript, Vite e Supabase, preparada para deploy no Cloudflare Pages.

## Executar localmente

```bash
npm install
npm run dev
```

## Build de produção

```bash
npm run build
```

A saída será criada em `dist`.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e informe a chave pública do Supabase:

```env
VITE_SUPABASE_URL=https://zqmxewoevqupcsqjimxz.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
VITE_APP_NAME=CicloPag
VITE_APP_ENV=development
```

Nunca coloque a chave `service_role` ou outros segredos em variáveis iniciadas por `VITE_`.

## Cloudflare Pages

- Branch de produção: `main`
- Comando de build: `npm run build`
- Diretório de saída: `dist`
- Diretório raiz: vazio
