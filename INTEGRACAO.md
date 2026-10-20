# Integração do atendimento

O formulário envia a solicitação para o endpoint configurado em `config.js`. O site só exibe confirmação quando o servidor retorna `ok: true`, `status: lead_saved` e o mesmo `request_id` enviado. Um HTTP 200 genérico não significa registro concluído.

O n8n valida consentimento e campos, consulta o catálogo no Supabase, valida a referência do imóvel e grava o lead no CRM do tenant `horizonte-prime`. Preços enviados pelo navegador não são usados como fonte comercial. Credenciais ficam exclusivamente no n8n.

O registro no CRM não envia mensagens nem confirma visitas. O atendimento pelo WhatsApp depende de o número comercial estar conectado à instância e ao webhook da imobiliária. Não confundir o registro do formulário com uma mensagem já enviada.

Em indisponibilidade, os campos são preservados e há um link explícito para continuar pelo WhatsApp. Não há abertura automática de pop-up após a falha.

## Verificação

Sem instalação ou build:

```sh
node --test tests/catalog.test.cjs
node --check site.js
node --check home.js
node --check property.js
```

Os testes executam os filtros usados no site, verificam as fotos dos 22 imóveis e protegem contra uma referência inexistente abrir outro imóvel. A publicação segue a branch `base` no GitHub Pages.
