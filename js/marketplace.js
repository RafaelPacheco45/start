(function () {
  'use strict';
  const KEY = 'autozap_start_cart_v1';
  const money = cents => (cents / 100).toLocaleString('pt-BR', {style:'currency',currency:'BRL'});
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fold = text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function photo(value) { try { const u = new URL(value); return (u.protocol === 'https:' || (u.origin === window.location.origin && u.protocol === 'http:')) && !u.username && !u.password ? u.href : ''; } catch { return ''; } }
  function phone(value) { let p=String(value || '').replace(/\D/g,''); if (p.length===10 || p.length===11) p='55'+p; return /^55\d{10,11}$/.test(p) ? p : ''; }
  window.AutoZapMarket = {
    mount(root, api) {
      let products=[], suppliers=[], loading=false, error='', partial=false, query='', category='', supplier='', sort='name', budget='', notice='';
      let page=1;
      const pageSize=6;
      let cart={};
      try { const saved=JSON.parse(localStorage.getItem(KEY)); if (saved && typeof saved==='object' && !Array.isArray(saved)) cart=saved; } catch {}
      const save=()=>{try {localStorage.setItem(KEY,JSON.stringify(cart));}catch{}};
      const key=(s,p)=>JSON.stringify([String(s),String(p)]);
      function reconcile() {
        const next={};
        products.forEach(p=>{const n=Math.floor(Number(cart[p.key])); if(Number.isFinite(n) && n>0 && p.stock>0) next[p.key]=Math.min(n,p.stock);});
        if(JSON.stringify(cart)!==JSON.stringify(next)) notice='Carrinho atualizado conforme a disponibilidade consultada.';
        cart=next; save();
      }
      function chosen() {return products.filter(p=>cart[p.key]>0);}
      function filtered() {
        return products.filter(p=>(!query || fold(p.name+' '+p.supplier.name+' '+p.category).includes(fold(query))) && (!category || p.category===category) && (!supplier || p.supplier.id===supplier))
          .sort((a,b)=>sort==='low'?a.cents-b.cents:sort==='high'?b.cents-a.cents:a.name.localeCompare(b.name,'pt-BR'));
      }
      function quote(s,rows) {
        const number=phone(s.phone || s.raw?.whatsapp);
        if(!number) return '<p class="market-muted">Este fornecedor ainda não informou um WhatsApp válido no Portal.</p>';
        const text=['Olá! Gostaria de confirmar esta cotação pelo AutoZap Start:',...rows.map(p=>`${cart[p.key]} × ${p.name} — ${money(p.cents*cart[p.key])}`),'Subtotal dos produtos: '+money(rows.reduce((sum,p)=>sum+p.cents*cart[p.key],0)),'Pode confirmar disponibilidade, frete e condições de pagamento?'].join('\n');
        return '<a class="builder-primary" target="_blank" rel="noopener noreferrer" href="https://wa.me/'+number+'?text='+encodeURIComponent(text)+'">Consultar fornecedor no WhatsApp ↗</a>';
      }
      function renderResults() {
        const matches=filtered();
        const pages=Math.max(1,Math.ceil(matches.length/pageSize));
        page=Math.max(1,Math.min(page,pages));
        const rows=matches.slice((page-1)*pageSize,page*pageSize);
        root.querySelector('[data-market-results]').innerHTML=loading?'<div class="market-empty" role="status">Buscando produtos dos fornecedores…</div>':error?'<div class="market-empty" role="alert"><h3>Não foi possível carregar o catálogo</h3><p>Tente atualizar em instantes. Nenhum produto fictício foi adicionado.</p></div>':!rows.length?'<div class="market-empty"><h3>'+(products.length?'Nenhum produto com esses filtros':'Novos produtos chegam por aqui')+'</h3><p>'+(products.length?'Experimente outra busca ou categoria.':'Os produtos publicados pelos fornecedores no Portal aparecerão nesta vitrine.')+'</p><a href="https://portal.autozap.log.br/#/select" target="_blank" rel="noopener noreferrer">Sou fornecedor: acessar o Portal ↗</a></div>':rows.map(p=>'<article class="market-product"><div class="market-photo">'+(p.image?'<img loading="lazy" referrerpolicy="no-referrer" src="'+esc(p.image)+'" alt="'+esc(p.name)+'">':'<span>Foto não cadastrada</span>')+'</div><div class="market-product-body"><small>'+esc(p.category)+'</small><h3>'+esc(p.name)+'</h3><span class="market-seller">Vendido por '+esc(p.supplier.name)+'</span><strong class="market-price">'+money(p.cents)+'</strong><span class="market-stock">'+(p.stock?p.stock+' unidades disponíveis':'Sem estoque')+'</span><button type="button" class="builder-primary" data-add="'+esc(p.key)+'" '+(p.stock<1 || (cart[p.key]||0)>=p.stock?'disabled':'')+'>'+(cart[p.key]?'Adicionar mais · '+cart[p.key]+' no carrinho':'Adicionar ao carrinho')+'</button></div></article>').join('');
        root.querySelectorAll('.market-photo img').forEach(img=>img.addEventListener('error',()=>{const span=document.createElement('span');span.textContent='Foto indisponível';img.replaceWith(span);},{once:true}));
        const first=Math.max(1,Math.min(page-2,pages-4));
        const numbers=Array.from({length:Math.min(5,pages)},(_,i)=>first+i);
        root.querySelector('[data-market-pages]').innerHTML=loading || error || !matches.length?'':'<button type="button" data-page="'+(page-1)+'" '+(page===1?'disabled':'')+' aria-label="Página anterior">‹ Anterior</button>'+numbers.map(n=>'<button type="button" data-page="'+n+'" aria-label="Página '+n+'" '+(n===page?'aria-current="page"':'')+'>'+n+'</button>').join('')+'<button type="button" data-page="'+(page+1)+'" '+(page===pages?'disabled':'')+' aria-label="Próxima página">Próxima ›</button>';
        renderCart();
      }
      function renderCart() {
        const rows=chosen();
        const total=rows.reduce((sum,p)=>sum+p.cents*cart[p.key],0);
        root.querySelector('[data-market-cart]').innerHTML='<div class="market-cart-heading"><h3>Seu carrinho</h3><span>'+rows.reduce((sum,p)=>sum+cart[p.key],0)+' itens</span></div>'+(!rows.length?'<p class="market-muted">Escolha os produtos da sua loja. Eles ficam separados por fornecedor aqui.</p>':suppliers.filter(s=>rows.some(p=>p.supplier.id===s.id)).map(s=>{const group=rows.filter(p=>p.supplier.id===s.id);return '<section class="market-cart-group"><h4>'+esc(s.name)+'</h4>'+group.map(p=>'<div class="market-cart-item"><strong>'+esc(p.name)+'</strong><span>'+money(p.cents*cart[p.key])+'</span><div class="market-quantity"><button type="button" data-delta="-1" data-key="'+esc(p.key)+'" aria-label="Diminuir '+esc(p.name)+'">−</button><output>'+cart[p.key]+'</output><button type="button" data-delta="1" data-key="'+esc(p.key)+'" aria-label="Aumentar '+esc(p.name)+'" '+(cart[p.key]>=p.stock?'disabled':'')+'>+</button><button type="button" data-remove="'+esc(p.key)+'">Remover</button></div></div>').join('')+(!loading && !error?quote(s,group):'<p>Atualize o catálogo antes de consultar.</p>')+'</section>';}).join(''))+(rows.length && !loading && !error?'<button type="button" class="builder-primary" data-checkout>Solicitar pedido e frete</button>':'')+'<div class="market-total"><span>Total dos produtos</span><strong>'+money(total)+'</strong></div><p class="market-muted">Frete não incluído. A seleção não reserva estoque nem confirma um pedido. Solicite o frete para liberar o Pix do fornecedor. Acompanhe em Meus pedidos.</p><p role="status" class="market-notice">'+esc(notice)+'</p>';
      }
      function render() {
        if(!root.isConnected) return;
        root.innerHTML='<div class="market-toolbar"><label class="market-search">Buscar produtos<input type="search" data-search placeholder="Busque por produto ou fornecedor" value="'+esc(query)+'"></label><button type="button" class="builder-secondary" data-orders>Meus pedidos</button><button type="button" class="builder-secondary" data-refresh '+(loading?'disabled':'')+'>Atualizar catálogo</button></div><div class="market-filters"><label>Categoria<select data-category><option value="">Todas as categorias</option>'+[...new Set(products.map(p=>p.category))].sort().map(c=>'<option '+(category===c?'selected':'')+'>'+esc(c)+'</option>').join('')+'</select></label><label>Fornecedor<select data-supplier><option value="">Todos os fornecedores</option>'+suppliers.map(s=>'<option value="'+esc(s.id)+'" '+(supplier===s.id?'selected':'')+'>'+esc(s.name)+'</option>').join('')+'</select></label><label>Ordenar<select data-sort><option value="name">Nome do produto</option><option value="low">Menor preço</option><option value="high">Maior preço</option></select></label></div><div class="market-budget"><div><strong>Quanto você quer investir?</strong><small>Monte uma seleção com os produtos disponíveis nos filtros.</small></div><label>Orçamento em reais<input data-budget type="number" min="0.01" step="0.01" placeholder="Ex.: 500" value="'+esc(budget)+'"></label><button type="button" class="builder-secondary" data-suggest '+(loading?'disabled':'')+'>Sugerir meu estoque</button></div>'+(partial?'<p class="market-notice" role="alert">Parte dos fornecedores não carregou. Atualize para consultar o catálogo completo.</p>':'')+'<div class="market-layout"><section><div class="market-products" data-market-results></div><nav class="market-pagination" data-market-pages aria-label="Páginas de produtos"></nav></section><aside class="market-cart" data-market-cart aria-label="Carrinho por fornecedor"></aside></div>';
        root.querySelector('[data-sort]').value=sort;
        renderResults();
      }
      async function load() {
        if(loading) return;
        loading=true; error=''; partial=false; render();
        try {
          if(!api?.apiGetStartSuppliers) throw Error('api_unavailable');
          const res=await api.apiGetStartSuppliers();
          if(!res?.ok) throw Error('suppliers_failed');
          suppliers=(res.suppliers || []).filter(s=>s.id && (!s.status || s.status==='active') && s.raw?.startVisible!==false).map(s=>({...s,id:String(s.id)}));
          const next=[]; let index=0;
          await Promise.all(Array.from({length:Math.min(4,suppliers.length)},async()=>{
            while(index<suppliers.length) {
              const s=suppliers[index++];
              try {
                const r=await api.apiGetStartSupplierProducts(s.id);
                if(!r?.ok) throw Error('products_failed');
                (r.products || []).forEach(p=>{
                  const raw=p.raw || p;
                  if(!p.id || String(p.supplierId)!==s.id || p.active===false || raw.startVisible===false || (raw.status && raw.status!=='active')) return;
                  const cents=Math.round(Number(p.price)*100), stock=Math.floor(Number(p.stock));
                  if(!Number.isSafeInteger(cents) || cents<=0 || !Number.isSafeInteger(stock) || stock<0) return;
                  const k=key(s.id,p.id); if(next.some(p=>p.key===k)) return;
                  next.push({key:k,id:String(p.id),supplier:s,name:String(p.name || 'Produto'),category:String(p.category || raw.category || 'Produtos'),cents,stock,image:photo(p.imageUrl || p.photo)});
                });
              } catch {partial=true;}
            }
          }));
          products=next; reconcile();
        } catch {error='load_failed'; products=[];}
        loading=false; render();
      }
      root.addEventListener('input', e=>{
        if(e.target.matches('[data-search]')) {query=e.target.value;page=1;renderResults();}
        if(e.target.matches('[data-budget]')) budget=e.target.value;
      });
      root.addEventListener('change',e=>{
        if(e.target.matches('[data-category]')) category=e.target.value;
        else if(e.target.matches('[data-supplier]')) supplier=e.target.value;
        else if(e.target.matches('[data-sort]')) sort=e.target.value;
        else return;
        page=1;
        renderResults();
      });
      root.addEventListener('click',e=>{
        const b=e.target.closest('button'); if(!b || b.disabled || !root.contains(b)) return;
        if(b.hasAttribute('data-orders')) {window.AutoZapCheckout?.open({api,history:true});return;}
        if(b.hasAttribute('data-checkout')) {window.AutoZapCheckout?.open({api,items:chosen().map(p=>({...p,quantity:cart[p.key]})),onSubmitted:()=>{cart={};save();renderCart();renderResults();}});return;}
        if(b.hasAttribute('data-refresh')) {load(); return;}
        if(loading || error) return;
        if(b.hasAttribute('data-page')) {page=Number(b.dataset.page);renderResults();root.querySelector('[data-market-results]').scrollIntoView({block:'start',behavior:'smooth'});return;}
        if(b.hasAttribute('data-suggest')) {
          const limit=Math.round(Number(budget)*100);
          if(!Number.isSafeInteger(limit) || limit<=0) {notice='Informe um orçamento maior que zero.';renderCart();return;}
          if(chosen().length) {notice='Para gerar uma nova sugestão, remova os itens atuais. Seu carrinho foi preservado.';renderCart();return;}
          let left=limit;
          filtered().filter(p=>p.stock>0).sort((a,b)=>a.cents-b.cents).forEach(p=>{if(p.cents<=left){cart[p.key]=1;left-=p.cents;}});
          notice=chosen().length?'Sugestão inicial de uma unidade por produto. Ajuste as quantidades como preferir.':'Nenhum produto disponível cabe nesse orçamento e nos filtros escolhidos.';
        } else {
          const k=b.dataset.add || b.dataset.key || b.dataset.remove;
          const p=products.find(p=>p.key===k); if(!p) return;
          if(b.hasAttribute('data-remove')) delete cart[k];
          else {const n=Math.min(p.stock,Math.max(0,(Number(cart[k])||0)+(b.hasAttribute('data-add')?1:Number(b.dataset.delta))));if(n)cart[k]=n;else delete cart[k];}
          notice='';
        }
        save();renderResults();
      });
      load();
      return {refresh:load};
    }
  };
})();
