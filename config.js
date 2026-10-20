// Horizonte Prime — site integrado ao CRM. Segredos permanecem nas credenciais do n8n.
(function () {
  'use strict';
  window.SITE_CONFIG = {
    businessName: 'Horizonte Prime Imóveis',
    businessShortName: 'Horizonte Prime',
    whatsappNumber: '5547999762742',
    city: 'Joinville',
    stateCode: 'SC',
    address: 'Joinville - SC',
    openingHours: 'Segunda a sábado, das 8h às 19h',

    // O sucesso depende da confirmação de gravação pelo CRM.
    useWebhook: true,
    webhookUrl: 'https://n8n.vps12198.panel.icontainer.cloud/webhook/horizonte-prime-site-v1',
    n8nSiteWebhookPath: 'horizonte-prime-site-v1',
    leadDestinationLabel: 'Iana',
    resultTitle: 'Atendimento iniciado',
    salesWhatsappMessage: 'Olá, quero atendimento imobiliário.',

    tenantId: 'horizonte-prime',
    leadSchemaVersion: 'site_lead_v185_crm',
    privacyUrl: 'privacidade.html',
    termsUrl: 'termos.html'
  };
})();
