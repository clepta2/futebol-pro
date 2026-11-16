export const WIDGET_JS_CONTENT = `(function() {
  const BASE_URL = (function() {
    const scripts = document.getElementsByTagName('script');
    for (let i = scripts.length - 1; i >= 0; i--) {
      const src = scripts[i].src || '';
      if (src.includes('widget.js')) {
        return src.replace(/\\/widget\\.js.*$/, '');
      }
    }
    return 'https://futebol-pro-api.clepta2.workers.dev';
  })();

  function injectWidgetStyles() {
    if (document.getElementById('futebol-pro-widget-css')) return;
    const style = document.createElement('style');
    style.id = 'futebol-pro-widget-css';
    style.textContent = \`
      .futebol-pro-widget-container {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background: #0f172a;
        color: #f8fafc;
        border: 1px solid #1e293b;
        border-radius: 12px;
        padding: 16px;
        box-sizing: border-box;
        margin: 12px 0;
        max-width: 100%;
        overflow: hidden;
      }
      .futebol-pro-widget-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
        font-weight: 700;
        color: #94a3b8;
        text-transform: uppercase;
        margin-bottom: 12px;
        letter-spacing: 0.5px;
      }
      .futebol-pro-widget-badge {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 700;
      }
      .futebol-pro-widget-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }
      .futebol-pro-widget-table th {
        background: #162032;
        color: #94a3b8;
        padding: 8px 10px;
        text-align: left;
        font-weight: 600;
      }
      .futebol-pro-widget-table td {
        padding: 8px 10px;
        border-bottom: 1px solid #1e293b;
      }
      .futebol-pro-widget-footer {
        margin-top: 10px;
        text-align: right;
        font-size: 10px;
        color: #64748b;
      }
      .futebol-pro-widget-footer a {
        color: #a3e635;
        text-decoration: none;
      }
    \`;
    document.head.appendChild(style);
  }

  async function renderWidget(el) {
    const tipo = el.getAttribute('data-tipo') || 'placar';
    const partidaId = el.getAttribute('data-partida') || 'hist_001';
    const campeonato = el.getAttribute('data-campeonato') || 'brasileirao-a';
    const jogadorId = el.getAttribute('data-jogador') || 'pedro-9';

    injectWidgetStyles();

    if (tipo === 'placar' || tipo === 'card') {
      el.innerHTML = \`
        <div class="futebol-pro-widget-container" style="padding:0; background:transparent; border:none;">
          <img src="\${BASE_URL}/api/futebol/card/Flamengo/2/Palmeiras/1.svg" style="width:100%; height:auto; border-radius:12px;" alt="Placar Futebol Pro">
          <div class="futebol-pro-widget-footer">Powered by <a href="https://ponte.ozpro.com.br" target="_blank">Futebol Pro Anycast</a></div>
        </div>
      \`;
    } else if (tipo === 'campo' || tipo === 'bola') {
      el.innerHTML = \`
        <div class="futebol-pro-widget-container" style="padding:0; background:transparent; border:none;">
          <img src="\${BASE_URL}/api/futebol/partida/\${partidaId}/campo.svg" style="width:100%; height:auto; border-radius:12px;" alt="Campo 2D Futebol Pro">
          <div class="futebol-pro-widget-footer">Rastreamento de Bola • <a href="https://ponte.ozpro.com.br" target="_blank">Futebol Pro</a></div>
        </div>
      \`;
    } else if (tipo === 'atleta' || tipo === 'jogador') {
      el.innerHTML = \`
        <div class="futebol-pro-widget-container" style="padding:0; background:transparent; border:none;">
          <img src="\${BASE_URL}/api/futebol/jogadores/\${jogadorId}/dashboard.svg" style="width:100%; height:auto; border-radius:12px;" alt="Dashboard Atleta">
          <div class="futebol-pro-widget-footer">Scouting Oficial • <a href="https://ponte.ozpro.com.br" target="_blank">Futebol Pro</a></div>
        </div>
      \`;
    } else if (tipo === 'tabela') {
      el.innerHTML = \`
        <div class="futebol-pro-widget-container">
          <div class="futebol-pro-widget-header">
            <span>Classificação • \${campeonato.toUpperCase()}</span>
            <span class="futebol-pro-widget-badge">Oficial</span>
          </div>
          <div style="overflow-x:auto;">
            <table class="futebol-pro-widget-table" id="table-\${campeonato}">
              <thead>
                <tr><th>#</th><th>Clube</th><th style="text-align:center;">PTS</th><th style="text-align:center;">J</th><th style="text-align:center;">V</th><th style="text-align:center;">SG</th></tr>
              </thead>
              <tbody><tr><td colspan="6" style="text-align:center; padding:12px;">Carregando tabela...</td></tr></tbody>
            </table>
          </div>
          <div class="futebol-pro-widget-footer">Dados Anycast &lt;5ms • <a href="https://ponte.ozpro.com.br" target="_blank">Futebol Pro</a></div>
        </div>
      \`;
      try {
        const resp = await fetch(\`\${BASE_URL}/api/futebol/tabela/\${campeonato}\`);
        const data = await resp.json();
        const tbody = el.querySelector('tbody');
        if (tbody && data.tabela) {
          tbody.innerHTML = data.tabela.slice(0, 10).map(t => \`
            <tr>
              <td style="font-weight:700; color:#94a3b8;">\${t.pos}</td>
              <td style="font-weight:600;">\${t.time}</td>
              <td style="text-align:center; font-weight:800; color:#a3e635;">\${t.pts}</td>
              <td style="text-align:center;">\${t.j}</td>
              <td style="text-align:center; color:#10b981;">\${t.v}</td>
              <td style="text-align:center;">\${t.sg > 0 ? '+' + t.sg : t.sg}</td>
            </tr>
          \`).join('');
        }
      } catch (_) {}
    }
  }

  function initWidgets() {
    const targets = document.querySelectorAll('.futebol-pro-widget, [data-futebol-widget]');
    targets.forEach(renderWidget);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidgets);
  } else {
    initWidgets();
  }
})();
`;
