(function(){
  'use strict';
  window.AutoZapMei = {
    animate(root) {
      const paper = root.querySelector('.mei-paper');
      if (!paper) return;
      const sections = paper.querySelectorAll('.mei-lead-grid, .mei-news-columns > section, .mei-second-grid > *, .mei-callout');
      if (!('IntersectionObserver' in window)) return;
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('mei-revealed');
          observer.unobserve(entry.target);
        });
      }, {threshold: 0.08});
      sections.forEach((section, index) => {
        section.classList.add('mei-reveal');
        section.style.setProperty('--mei-delay', (index % 3) * 90 + 'ms');
        observer.observe(section);
      });
    },
    render() {
      return `<section class="step-card mei-editorial-step">
        <article class="mei-paper" aria-label="Guia de formalização AutoZap Start">
          <div class="mei-paper-meta"><span>GUIA DO PEQUENO NEGÓCIO</span><span>EDIÇÃO ESPECIAL · FORMALIZAÇÃO</span></div>
          <header class="mei-masthead"><span>Jornal do</span><strong>Primeiro Passo</strong><small>Uma publicação do AutoZap Start · conteúdo educativo</small></header>
          <div class="mei-paper-strip"><span>NEGÓCIOS & OPORTUNIDADES</span><span>Etapa opcional · sua identidade continua gratuita</span></div>
          <div class="mei-lead-grid">
            <div class="mei-lead-copy"><span class="mei-eyebrow">DA IDEIA À EMPRESA</span><h2>Sua ideia já tem nome.<br>Agora ela pode ter <em>CNPJ.</em></h2><p class="mei-deck">Você não precisa começar grande. Pode começar organizado — com uma marca, um plano e o próximo passo ao seu alcance.</p><p>O MEI pode ser o caminho para formalizar uma atividade que se enquadre nas regras. O cadastro é feito pela internet e a abertura pelo portal oficial é gratuita.</p><a class="mei-editorial-link" href="https://www.gov.br/pt-br/servicos/realizar-registro-como-microempreendedor-individual-mei" target="_blank" rel="noopener noreferrer">Conheça o processo oficial ↗</a></div>
            <figure class="mei-lead-photo"><img src="./assets/mei/loja.jpg" alt="Comerciante atrás do balcão de uma pequena loja" width="1400" height="934"><figcaption>Todo negócio começa com alguém que decide dar o primeiro passo. Foto ilustrativa: Ali Mkumbwa / Unsplash.</figcaption></figure>
          </div>
          <div class="mei-news-columns">
            <section><span class="mei-eyebrow">CONFIANÇA</span><h3>Uma marca que se apresenta com clareza.</h3><p>Identificar a empresa e explicar quem está por trás da loja ajuda o cliente a entender com quem está negociando. Atendimento, garantia e pós-venda continuam sendo essenciais: confiança se constrói no dia a dia.</p></section>
            <section><span class="mei-eyebrow">FORNECEDORES</span><h3>Mais organização para negociar e crescer.</h3><p>Ter os dados da empresa organizados pode facilitar cadastros comerciais e conversas com parceiros. Preço, crédito e condições de compra dependem da análise e das regras de cada fornecedor.</p></section>
            <section><span class="mei-eyebrow">GESTÃO</span><h3>Seu dinheiro e o da loja, cada um no seu lugar.</h3><p>Registrar vendas, acompanhar despesas e separar as finanças pessoais das do negócio ajuda você a conhecer o resultado da loja. Conta e Pix em nome da empresa podem fazer parte dessa organização, conforme as condições da instituição.</p></section>
          </div>
          <div class="mei-second-grid">
            <figure class="mei-detail-photo"><img loading="lazy" src="./assets/mei/balcao.jpg" alt="Atendimento em um balcão comercial com equipamento de pagamento" width="1000" height="750"><figcaption>Organização também aparece no atendimento. Foto ilustrativa: SumUp / Unsplash; sem vínculo com o AutoZap.</figcaption></figure>
            <section class="mei-checklist-editorial"><span class="mei-eyebrow">ANTES DE COMEÇAR</span><h3>O próximo passo pode ser mais simples do que parece.</h3><ol><li><strong>Confira se o MEI combina com sua atividade.</strong><span>Consulte as ocupações permitidas e os critérios de enquadramento no portal oficial.</span></li><li><strong>Tenha sua conta gov.br e seus dados em mãos.</strong><span>O serviço oficial informa o nível de acesso e os dados necessários.</span></li><li><strong>Leia as responsabilidades antes de concluir.</strong><span>A abertura é gratuita; depois existem obrigações, como o DAS mensal e a declaração anual. A emissão de notas segue as regras aplicáveis à atividade.</span></li></ol><p class="mei-small-note">Com seus dados preparados, você pode iniciar o processo online pelo portal oficial.</p></section>
          </div>
          <section class="mei-callout"><div><span class="mei-eyebrow">SEU PRÓXIMO CAPÍTULO</span><h3>Começar agora é uma decisão.<br>Formalizar é o próximo passo.</h3><p>Confira as regras e inicie seu cadastro pelo canal oficial, quando fizer sentido para você.</p></div><div class="mei-callout-actions"><a class="builder-primary" href="https://www.gov.br/pt-br/servicos/realizar-registro-como-microempreendedor-individual-mei" target="_blank" rel="noopener noreferrer">Quero conhecer a abertura do MEI ↗</a><button class="builder-secondary" type="button" data-action="skip-formalization">Prefiro continuar sem MEI agora</button></div></section>
          <footer class="mei-paper-footer"><p>O AutoZap Start não realiza a abertura nem cobra por esse serviço. Formalizar não é requisito para criar sua identidade aqui.</p><p>Fontes: <a href="https://www.gov.br/pt-br/servicos/realizar-registro-como-microempreendedor-individual-mei" target="_blank" rel="noopener noreferrer">Serviço oficial de formalização</a> · <a href="https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/perguntas-frequentes" target="_blank" rel="noopener noreferrer">Perguntas frequentes do MEI</a>. Fotos: <a href="https://unsplash.com/photos/EOkN2pRjFsg" target="_blank" rel="noopener noreferrer">Ali Mkumbwa</a> e <a href="https://unsplash.com/photos/IlHemAQpJ-U" target="_blank" rel="noopener noreferrer">SumUp</a>, sob licença Unsplash.</p></footer>
        </article><div class="builder-actions mei-page-actions"><button class="builder-secondary" type="button" data-action="back">Voltar</button><button class="builder-primary" type="button" data-action="next">Continuar para estoque</button></div>
      </section>`;
    }
  };
})();
