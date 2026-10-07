# FireHelpBeta

Versão de apresentação do projeto FireHelp, preparada para funcionar **sem Google Login e sem depender do endpoint do Supabase**.

## Acesso

- Primeiro acesso: clique em **Primeiro acesso? Criar conta**.
- Informe nome, CPF, e-mail e senha.
- **O primeiro cadastro realizado no navegador é automaticamente o Gerente/Admin do projeto.**
- Os próximos cadastros entram como membros.
- O gerente pode acessar **Moderação**, suspender/reativar membros e promover membros a gestores.

## Importante

Esta versão Beta usa armazenamento local do navegador (`localStorage`) para a apresentação. Ela mantém a interface e os fluxos principais do FireHelp, mas **não é a versão de produção** e não substitui a autenticação/banco do Supabase.

Para a apresentação, use o mesmo navegador/computador em que o primeiro cadastro foi feito.

## Executar

```bash
npm install
npm run dev
```

Depois abra o endereço indicado pelo Vite, normalmente `http://localhost:3000`.
