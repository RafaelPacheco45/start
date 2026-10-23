(function () {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const labels = {pending:'Aguardando pagamento',approved:'Pagamento aprovado · site em preparação',rejected:'Pagamento recusado',cancelled:'Pagamento cancelado',refunded:'Pagamento devolvido',charged_back:'Pagamento contestado',checkout_failed:'Checkout não concluído'};

  function safeUrl(value, site = false) {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.username || url.password || url.port) return '';
      if (site) return url.hostname === 'aip.autozap.log.br' && /^\/start\/sites\/[a-f0-9]{48}$/.test(url.pathname) && !url.search && !url.hash ? url.href : '';
      return ['www.mercadopago.com.br','mercadopago.com.br'].includes(url.hostname) ? url.href : '';
    } catch { return ''; }
  }

  window.AutoZapSiteCheckout = {open({api, project = {}, history = false}) {
    const dialog = document.createElement('dialog');
    dialog.className = 'start-checkout';
    dialog.setAttribute('aria-label', history ? 'Compra do seu site' : 'Comprar site');
    let pending = false;
    let automatic = false;
    let refreshTimer;
    let refreshCount = 0;
    const key = crypto.randomUUID();
    dialog.innerHTML = '<header class="checkout-header"><div><span>AUTOZAP START</span><h2>' + (history ? 'Compra do seu site' : 'Seu site profissional · R$ 50') + '</h2></div><button data-close aria-label="Fechar">×</button></header><div data-checkout-content><p role="status">Consultando…</p></div>';
    document.body.appendChild(dialog);
    const content = dialog.querySelector('[data-checkout-content]');
    const status = text => { const element = dialog.querySelector('[role="status"]'); if (element) element.textContent = text; };

    async function request(path, options = {}) {
      const result = await api.apiRequest(path, {...options, startSession:true});
      if (!result?.ok) throw Error('Não foi possível concluir agora. Seus dados foram preservados. Tente novamente ou consulte suas compras.');
      return result.data || result;
    }

    async function list() {
      pending = true;
      clearTimeout(refreshTimer);
      status('Consultando…');
      try {
        const data = await request('/start/purchases');
        if (!dialog.isConnected) return;
        const purchases = data.purchases || [];
        content.innerHTML = purchases.map(purchase => {
          const site = purchase.status === 'approved' && purchase.fulfilled ? safeUrl(purchase.site_url, true) : '';
          const payment = purchase.status === 'pending' ? safeUrl(purchase.checkout_url) : '';
          return '<article class="checkout-order"><h3>' + escape(purchase.packageName) + '</h3><p>' + escape(site ? 'Seu site está pronto' : labels[purchase.status] || 'Pagamento em análise') + '</p><p>R$ ' + Number(purchase.amount).toFixed(2).replace('.',',') + '</p><small>Pedido ' + escape(purchase.id) + '</small>' + (site ? '<p><a class="builder-primary" href="' + escape(site) + '" target="_blank" rel="noopener noreferrer">Abrir meu site ↗</a></p><p><a href="' + escape(site) + '">' + escape(site) + '</a></p>' : '') + (payment ? '<p><a class="builder-primary" href="' + escape(payment) + '">Continuar pagamento</a></p>' : '') + '</article>';
        }).join('') || '<p>Nenhuma compra nesta sessão.</p>';
        content.innerHTML += '<p role="status" aria-live="polite"></p><button class="builder-secondary" data-refresh>Atualizar status</button>';
        if (refreshCount++ < 24 && purchases.some(purchase => purchase.status === 'pending' || (purchase.status === 'approved' && !purchase.fulfilled))) refreshTimer = setTimeout(list, 5000);
      } catch (error) {
        status(error.message);
        if (!content.querySelector('[data-refresh]')) content.insertAdjacentHTML('beforeend', '<button class="builder-secondary" data-refresh>Tentar novamente</button>');
      } finally { pending = false; }
    }

    async function form() {
      pending = true;
      try {
        const config = await request('/start/packages');
        if (!dialog.isConnected) return;
        automatic = config.automaticSiteDelivery === true;
        content.innerHTML = '<p>Identidade: <strong>' + escape(project.name) + '</strong>. Pagamento único pelo Mercado Pago.</p><p>' + (automatic ? 'Uma página para sua loja, com sua identidade, lista de produtos e botão do WhatsApp. Após a confirmação do pagamento, o endereço AutoZap fica disponível em “Minha compra do site”. Não inclui domínio próprio.' : 'A preparação e a entrega do site são manuais. Acompanhe seu pagamento em “Minha compra do site”.') + '</p><form><div class="checkout-fields"><label>Nome completo<input name="name" autocomplete="name" maxlength="120" required></label><label>E-mail para contato<input name="email" type="email" autocomplete="email" maxlength="180" required></label><label>WhatsApp da loja (com DDI, ex.: 5511999999999)<input name="phone" type="tel" autocomplete="tel" maxlength="25" required></label></div>' + (automatic ? '<label class="checkout-consent"><input name="publishSite" type="checkbox" required> Autorizo publicar a identidade da loja, cidade, produtos e este WhatsApp no site. Meu nome de comprador e e-mail não serão publicados.</label>' : '') + '<label class="checkout-consent"><input type="checkbox" required> Autorizo o envio dos dados necessários ao Mercado Pago para este pagamento.</label><p role="status" aria-live="polite"></p><footer class="checkout-footer"><button type="button" class="builder-secondary" data-close>Voltar</button><button class="builder-primary" type="submit">Ir ao Mercado Pago · R$ 50</button></footer></form>';
      } catch (error) {
        content.innerHTML = '<p role="status"></p><button data-retry class="builder-secondary">Tentar novamente</button>';
        status(error.message);
      } finally { pending = false; }
    }

    dialog.addEventListener('submit', async event => {
      event.preventDefault();
      if (pending || !event.target.reportValidity()) return;
      const fields = new FormData(event.target);
      const phone = String(fields.get('phone') || '').replace(/[\s()+-]/g, '');
      if (automatic && !/^\d{10,15}$/.test(phone)) { status('Informe o WhatsApp com código do país e DDD, usando apenas números.'); return; }
      pending = true;
      const button = event.target.querySelector('[type="submit"]');
      button.disabled = true;
      status('Preparando pagamento…');
      try {
        const result = await request('/start/checkout', {method:'POST', body:{packageId:'site-start',idempotencyKey:key,buyerName:fields.get('name'),buyerEmail:fields.get('email'),buyerPhone:fields.get('phone'),project:{...project,...(automatic ? {publishSite:fields.get('publishSite') === 'on',publicWhatsapp:phone} : {})}}});
        const url = safeUrl(result.checkout_url);
        if (!url) throw Error('O link de pagamento não foi validado. Consulte sua compra antes de tentar novamente.');
        location.assign(url);
      } catch (error) { status(error.message); }
      finally { pending = false; button.disabled = false; }
    });
    dialog.addEventListener('click', event => {
      if (event.target.closest('[data-close]')) { if (!pending) dialog.close(); return; }
      if (pending) return;
      if (event.target.closest('[data-refresh]')) { refreshCount = 0; list(); }
      if (event.target.closest('[data-retry]')) form();
    });
    dialog.addEventListener('cancel', event => { if (pending) event.preventDefault(); });
    dialog.addEventListener('close', () => { clearTimeout(refreshTimer); dialog.remove(); });
    dialog.showModal();
    if (history) list(); else form();
  }};
})();
