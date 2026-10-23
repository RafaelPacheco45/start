(function(){
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>(Number(v)/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const labels={awaiting_shipping_quote:'Aguardando cotação de frete',awaiting_payment:'Aguardando Pix',payment_reported:'Pagamento informado · aguardando conferência',payment_received:'Pagamento recebido',shipped:'Pedido enviado',cancelled:'Pedido cancelado',expired:'Prazo do Pix encerrado'};
  window.AutoZapCheckout={
    open({api,items=[],history=false,onSubmitted=()=>{}}){
      const dialog=document.createElement('dialog');dialog.className='start-checkout';
      let pending=false,orders=[],idempotencyKey=crypto.randomUUID();
      const subtotal=items.reduce((sum,p)=>sum+p.cents*p.quantity,0);
      const field=(name,label,type='text',extra='')=>'<label>'+label+'<input name="'+name+'" type="'+type+'" '+extra+' required></label>';
      dialog.innerHTML='<header class="checkout-header"><div><span>AUTOZAP START</span><h2>'+(history?'Meus pedidos':'Prepare seu pedido')+'</h2></div><button type="button" data-close aria-label="Fechar checkout">×</button></header><div data-checkout-content></div>';
      document.body.appendChild(dialog);
      const content=dialog.querySelector('[data-checkout-content]');
      function status(text){const el=dialog.querySelector('[data-checkout-status]');if(el)el.textContent=text;}
      async function request(path,options={}){
        if(!api?.apiRequest) throw Error('O serviço de pedidos está indisponível. Tente novamente mais tarde.');
        const result=await api.apiRequest(path,{...options,startSession:true});
        if(!result?.ok) {const messages={supplier_receiving_not_configured:'Um fornecedor ainda não cadastrou o Pix no Portal. Consulte-o antes de solicitar este pedido.',product_unavailable:'Um produto ficou indisponível. Atualize o catálogo.',stock_or_price_unavailable:'O estoque ou preço mudou. Atualize o catálogo.',invalid_order_state:'O pedido mudou de situação. Atualize antes de continuar.'};throw Error(messages[result?.data?.error || result?.error] || 'Não foi possível concluir. Confira os dados e tente novamente; nenhum pagamento foi confirmado.');}
        return result.data || result;
      }
      function showOrders(){
        content.innerHTML='<div class="checkout-order-list">'+(orders.length?orders.map(order=>{
          const id=order.id;
          const payment=order.expiresAt && Date.parse(order.expiresAt)<=Date.now()?null:order.payment;
          return '<article class="checkout-order"><span class="checkout-status">'+esc(labels[order.status] || 'Pedido em análise')+'</span><h3>'+esc(order.supplierName || order.supplier?.name || 'Fornecedor')+'</h3><small>Pedido '+esc(id)+'</small><ul>'+(order.items || []).map(p=>'<li><span>'+esc(p.quantity)+' × '+esc(p.name)+'</span><strong>'+money(p.unitPriceCents*p.quantity)+'</strong></li>').join('')+'</ul><div class="checkout-total"><span>Produtos</span><strong>'+money(order.subtotalCents)+'</strong></div><div class="checkout-total"><span>Frete</span><strong>'+(order.freightCents==null?'A confirmar':money(order.freightCents))+'</strong></div>'+(order.totalCents!=null?'<div class="checkout-total"><span>Total</span><strong>'+money(order.totalCents)+'</strong></div>':'')+(order.status==='awaiting_shipping_quote'?'<p>O fornecedor vai informar o frete. O Pix será liberado após a definição do total. Consulte a atualização por aqui.</p>':'')+(order.status==='awaiting_payment' && payment?.payload?'<div class="checkout-pix"><strong>Pague diretamente ao fornecedor</strong><p>Validade: '+esc(new Date(order.expiresAt).toLocaleString('pt-BR'))+'. Atualize o pedido antes de pagar.</p><p>Recebedor: '+esc(payment.recipientName)+'</p><p>Confira o nome e o valor no aplicativo do seu banco antes de pagar.</p><label>Pix copia e cola<textarea readonly>'+esc(payment.payload)+'</textarea></label><button type="button" data-copy="'+esc(id)+'">Copiar Pix</button><button type="button" class="builder-primary" data-report="'+esc(id)+'">Já fiz o Pix</button><small>Esse botão informa o pagamento ao fornecedor. A confirmação depende da conferência do recebimento.</small></div>':'')+'</article>';
        }).join(''):'<p>Você ainda não tem pedidos nesta sessão.</p>')+'</div><p role="status" data-checkout-status></p><footer class="checkout-footer"><button type="button" class="builder-secondary" data-refresh-orders>Atualizar pedidos</button><button type="button" class="builder-secondary" data-close>Fechar</button></footer>';
      }
      async function loadOrders(){pending=true;status('Consultando pedidos…');try{const data=await request('/start/orders');orders=data.orders || [];showOrders();}catch(e){status(e.message);}finally{pending=false;}}
      if(history){content.innerHTML='<p role="status" data-checkout-status>Consultando pedidos…</p>';loadOrders();}
      else content.innerHTML='<div class="checkout-steps"><strong>1. Dados e entrega</strong><span>2. Cotação de frete</span><span>3. Pix ao fornecedor</span></div><form data-order-form><div class="checkout-columns"><div><h3>Quem está comprando?</h3><div class="checkout-fields">'+field('buyerName','Nome completo','text','autocomplete="name" maxlength="120"')+field('email','E-mail','email','autocomplete="email" maxlength="180"')+field('phone','Celular com DDD','tel','autocomplete="tel" maxlength="20"')+'</div><h3>Onde você quer receber?</h3><div class="checkout-fields">'+field('recipient','Nome do destinatário','text','maxlength="120"')+field('postalCode','CEP','text','autocomplete="shipping postal-code" inputmode="numeric" pattern="[0-9]{5}-?[0-9]{3}" maxlength="9"')+field('street','Rua ou avenida','text','autocomplete="shipping address-line1" maxlength="180"')+field('number','Número','text','maxlength="20"')+'<label>Complemento (opcional)<input name="complement" maxlength="100" autocomplete="shipping address-line2"></label>'+field('district','Bairro','text','maxlength="100"')+field('city','Cidade','text','autocomplete="shipping address-level2" maxlength="100"')+'<label>Estado<select name="state" required><option value="">Selecione</option>'+['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(s=>'<option>'+s+'</option>').join('')+'</select></label></div></div><aside class="checkout-summary"><h3>Resumo da seleção</h3><ul>'+items.map(p=>'<li><span>'+p.quantity+' × '+esc(p.name)+'<small>'+esc(p.supplier.name)+'</small></span><strong>'+money(p.cents*p.quantity)+'</strong></li>').join('')+'</ul><div class="checkout-total"><span>Produtos</span><strong>'+money(subtotal)+'</strong></div><p>Frete a confirmar pelo fornecedor. O envio desta solicitação ainda não reserva estoque nem exige pagamento.</p><p>Se houver mais de um fornecedor, cada um receberá um pedido separado.</p></aside></div><label class="checkout-consent"><input name="consent" type="checkbox" required> Autorizo compartilhar meus dados de contato e entrega com os fornecedores deste pedido.</label><p role="status" data-checkout-status></p><footer class="checkout-footer"><button type="button" class="builder-secondary" data-close>Voltar ao carrinho</button><button type="submit" class="builder-primary">Solicitar pedido e frete</button></footer></form>';
      dialog.addEventListener('submit',async e=>{
        e.preventDefault();if(pending)return;
        const form=e.target;if(!form.reportValidity())return;
        const data=Object.fromEntries(new FormData(form));pending=true;
        const button=form.querySelector('[type="submit"]');button.disabled=true;status('Enviando pedido…');
        try{
          const result=await request('/start/orders',{method:'POST',body:{idempotencyKey,items:items.map(p=>({supplierId:p.supplier.id,productId:p.id,quantity:p.quantity})),buyer:{name:data.buyerName,email:data.email,phone:data.phone},delivery:{recipient:data.recipient,postalCode:data.postalCode,street:data.street,number:data.number,complement:data.complement,district:data.district,city:data.city,state:data.state}}});
          if(!Array.isArray(result.orders) || !result.orders.length)throw Error('O servidor não confirmou a criação do pedido. Tente novamente.');
          orders=result.orders;onSubmitted();showOrders();
        }catch(e){status(e.message);}finally{pending=false;button.disabled=false;}
      });
      dialog.addEventListener('click',async e=>{
        const b=e.target.closest('button');if(!b)return;
        if(b.hasAttribute('data-close')){if(!pending)dialog.close();return;}
        if(pending)return;
        if(b.hasAttribute('data-refresh-orders'))return loadOrders();
        if(b.hasAttribute('data-copy')){try{await navigator.clipboard.writeText(orders.find(o=>o.id===b.dataset.copy).payment.payload);status('Pix copiado. Confira o recebedor no banco.');}catch{status('Selecione o código Pix e copie manualmente.');}return;}
        if(b.hasAttribute('data-report')){
          if(!window.confirm('Você já realizou o Pix para este pedido? O fornecedor será avisado para conferir o recebimento.'))return;
          pending=true;b.disabled=true;
          try{await request('/start/orders/'+encodeURIComponent(b.dataset.report)+'/payment-report',{method:'POST',body:{}});pending=false;await loadOrders();}catch(e){status(e.message);}finally{pending=false;b.disabled=false;}
        }
      });
      dialog.addEventListener('cancel',e=>{if(pending)e.preventDefault();});
      dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
    }
  };
})();
