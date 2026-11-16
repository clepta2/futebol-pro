/**
 * futebol-pro.js
 * SDK Oficial para Node.js, Browser e Edge Runtimes
 * Futebol Pro API — Dados Esportivos de Alta Performance na Borda Anycast
 * 
 * @license MIT
 * @see https://github.com/clepta2/futebol-pro
 */

export class FutebolPro {
  static baseUrl = 'https://ponte.ozpro.com.br';
  static apiKey = '';

  /**
   * Configura o cliente global com URL base e chave de autenticação
   * @param {Object} config - { apiKey?: string, baseUrl?: string }
   */
  static configure(config = {}) {
    if (config.baseUrl) this.baseUrl = config.baseUrl.replace(/\/$/, '');
    if (config.apiKey) this.apiKey = config.apiKey;
  }

  /**
   * Headers padrão para requisição com Bearer Token RFC 6750
   * @private
   */
  static _getHeaders() {
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'FutebolPro-SDK/1.0.0'
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
      headers['x-api-key'] = this.apiKey;
    }
    return headers;
  }

  /**
   * Consulta a telemetria e integridade do cluster Anycast
   * @returns {Promise<Object>}
   */
  static async getHealth() {
    const resp = await fetch(`${this.baseUrl}/api/futebol/health`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao consultar healthcheck: HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Lista todas as competições cobertas pela API
   * @returns {Promise<Object>}
   */
  static async getCompeticoes() {
    const resp = await fetch(`${this.baseUrl}/api/futebol/competicoes`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao listar competições: HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Obtém a tabela de classificação de uma competição
   * @param {string} campeonato - Ex: 'brasileirao-a', 'premier-league', 'la-liga'
   * @param {'json'|'csv'|'xml'} [formato='json'] - Formato de exportação
   * @returns {Promise<Object|string>}
   */
  static async getTabela(campeonato = 'brasileirao-a', formato = 'json') {
    const resp = await fetch(`${this.baseUrl}/api/futebol/tabela/${campeonato}?formato=${formato}`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao obter tabela (${campeonato}): HTTP ${resp.status}`);
    if (formato === 'csv' || formato === 'xml') {
      return await resp.text();
    }
    return await resp.json();
  }

  /**
   * Obtém todos os jogos do mundo (Global World Hub) com filtros de data, status e liga
   * @param {Object} [filtros] - { data?: string, status?: 'ao_vivo'|'encerrado'|'agendado', liga?: string, busca?: string, agrupadoPorLiga?: boolean }
   * @returns {Promise<Object>}
   */
  static async getJogosMundo(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.data) params.set('data', filtros.data);
    if (filtros.status) params.set('status', filtros.status);
    if (filtros.liga) params.set('liga', filtros.liga);
    if (filtros.busca) params.set('busca', filtros.busca);
    if (filtros.agrupadoPorLiga) params.set('agrupadoPorLiga', 'true');

    const query = params.toString() ? `?${params.toString()}` : '';
    const resp = await fetch(`${this.baseUrl}/api/futebol/mundo${query}`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao obter jogos do mundo: HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Obtém jogos de hoje no mundo
   * @returns {Promise<Object>}
   */
  static async getJogosHoje() {
    const resp = await fetch(`${this.baseUrl}/api/futebol/mundo/hoje`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao obter jogos de hoje: HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Obtém jogos do futuro e próximas rodadas
   * @param {string} [data] - 'amanha' ou 'YYYY-MM-DD'
   * @returns {Promise<Object>}
   */
  static async getJogosFuturo(data = 'amanha') {
    const resp = await fetch(`${this.baseUrl}/api/futebol/mundo/futuro?data=${data}`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao obter jogos do futuro: HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Obtém jogos antigos e resultados históricos
   * @param {string} [data] - 'ontem' ou 'YYYY-MM-DD'
   * @returns {Promise<Object>}
   */
  static async getJogosAntigos(data = 'ontem') {
    const resp = await fetch(`${this.baseUrl}/api/futebol/mundo/antigos?data=${data}`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao obter jogos antigos: HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Obtém detalhes completos de uma partida (lances, escalações, boxscore, gols)
   * @param {string} partidaId
   * @returns {Promise<Object>}
   */
  static async getPartidaDetalhe(partidaId) {
    const resp = await fetch(`${this.baseUrl}/api/futebol/partida/${partidaId}`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao obter detalhes da partida (${partidaId}): HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Obtém o lance a lance minuto a minuto com coordenadas (x, y) de faltas, cartões e chutes
   * @param {string} partidaId
   * @param {string} [tipo] - Filtro opcional ('foul', 'card', 'shot', 'goal')
   * @returns {Promise<Object>}
   */
  static async getLanceALance(partidaId, tipo) {
    const query = tipo ? `?tipo=${encodeURIComponent(tipo)}` : '';
    const resp = await fetch(`${this.baseUrl}/api/futebol/partida/${partidaId}/lance-a-lance${query}`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao obter lance a lance (${partidaId}): HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Obtém a localização exata da bola em tempo real e zona tática
   * @param {string} partidaId
   * @returns {Promise<Object>}
   */
  static async getPosicaoBola(partidaId) {
    const resp = await fetch(`${this.baseUrl}/api/futebol/partida/${partidaId}/posicao-bola`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao obter posição da bola (${partidaId}): HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Obtém a URL do Campo 2D SVG com plotagem espacial dos lances e da bola
   * @param {string} partidaId
   * @returns {string}
   */
  static getCampoSvgUrl(partidaId) {
    return `${this.baseUrl}/api/futebol/partida/${partidaId}/campo.svg`;
  }

  /**
   * Obtém a análise de Expected Goals (xG) da partida
   * @param {string} partidaId
   * @returns {Promise<Object>}
   */
  static async getPartidaXg(partidaId) {
    const resp = await fetch(`${this.baseUrl}/api/futebol/partida/${partidaId}/xg`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao obter xG da partida (${partidaId}): HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Obtém a URL do Mapa de Chutes e Expected Goals (Shot Map SVG)
   * @param {string} partidaId
   * @returns {string}
   */
  static getShotMapSvgUrl(partidaId) {
    return `${this.baseUrl}/api/futebol/partida/${partidaId}/shotmap.svg`;
  }

  /**
   * Obtém a URL do Mapa de Calor Tático (Heatmap SVG) da equipe
   * @param {string} partidaId
   * @param {string} [equipe]
   * @returns {string}
   */
  static getHeatmapSvgUrl(partidaId, equipe) {
    const q = equipe ? `?equipe=${encodeURIComponent(equipe)}` : '';
    return `${this.baseUrl}/api/futebol/partida/${partidaId}/heatmap.svg${q}`;
  }

  /**
   * Obtém os mercados de odds justas calculados pela distribuição de Poisson da partida
   * @param {string} partidaId
   * @returns {Promise<Object>}
   */
  static async getPartidaOdds(partidaId) {
    const resp = await fetch(`${this.baseUrl}/api/futebol/partida/${partidaId}/odds`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao obter odds da partida (${partidaId}): HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Obtém as pontuações e scouts detalhados de Fantasy Game dos atletas na partida
   * @param {string} partidaId
   * @returns {Promise<Object>}
   */
  static async getPartidaFantasy(partidaId) {
    const resp = await fetch(`${this.baseUrl}/api/futebol/partida/${partidaId}/fantasy`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao obter fantasy da partida (${partidaId}): HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Obtém o ranking oficial dos maiores pontuadores da rodada de Fantasy Game
   * @returns {Promise<Object>}
   */
  static async getRankingRodadaFantasy() {
    const resp = await fetch(`${this.baseUrl}/api/futebol/fantasy/ranking-rodada`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao obter ranking fantasy da rodada: HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Obtém o radar de jovens promessas Sub-21 e comparações históricas
   * @returns {Promise<Object>}
   */
  static async getTalentosScouting() {
    const resp = await fetch(`${this.baseUrl}/api/futebol/scouting/talentos`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao listar talentos de scouting: HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Obtém o relatório e projeção futura de um jovem talento específico
   * @param {string} talentoId
   * @returns {Promise<Object>}
   */
  static async getScoutingTalento(talentoId) {
    const resp = await fetch(`${this.baseUrl}/api/futebol/scouting/${talentoId}`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao obter scouting do talento (${talentoId}): HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Cadastra um novo webhook para receber alertas push de gols e cartões vermelhos
   * @param {Object} config - { url: string, secret?: string, eventos?: string[], clubes?: string[] }
   * @returns {Promise<Object>}
   */
  static async cadastrarWebhook(config) {
    const resp = await fetch(`${this.baseUrl}/api/futebol/webhooks/cadastrar`, {
      method: 'POST',
      headers: { ...this._getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!resp.ok) throw new Error(`Erro ao cadastrar webhook: HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Lista todos os webhooks ativos
   * @returns {Promise<Object>}
   */
  static async listarWebhooks() {
    const resp = await fetch(`${this.baseUrl}/api/futebol/webhooks/listar`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao listar webhooks: HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Remove um webhook cadastrado
   * @param {string} webhookId
   * @returns {Promise<Object>}
   */
  static async removerWebhook(webhookId) {
    const resp = await fetch(`${this.baseUrl}/api/futebol/webhooks/${webhookId}`, {
      method: 'DELETE',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao remover webhook (${webhookId}): HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Dispara simulação de teste de evento de gol via webhook
   * @returns {Promise<Object>}
   */
  static async testarWebhook() {
    const resp = await fetch(`${this.baseUrl}/api/futebol/webhooks/testar`, {
      method: 'POST',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao testar webhook: HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Obtém a URL oficial do script client-side widget.js
   * @returns {string}
   */
  static getWidgetJsUrl() {
    return `${this.baseUrl}/widget.js`;
  }

  /**
   * Obtém as projeções matemáticas da tabela (chances de título, G4 e risco de rebaixamento)
   * @param {string} campeonato
   * @returns {Promise<Object>}
   */
  static async getTabelaProjecoes(campeonato = 'brasileirao-a') {
    const resp = await fetch(`${this.baseUrl}/api/futebol/tabela/${campeonato}/projecoes`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao obter projeções da tabela (${campeonato}): HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Realiza busca global unificada por clube, jogador, estádio ou torneio
   * @param {string} termo
   * @returns {Promise<Object>}
   */
  static async buscarGlobal(termo) {
    const resp = await fetch(`${this.baseUrl}/api/futebol/busca?q=${encodeURIComponent(termo)}`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro na busca global: HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Obtém as estatísticas oficiais da partida (posse de bola, finalizações, faltas, escanteios)
   * @param {string} partidaId
   * @returns {Promise<Object>}
   */
  static async getPartidaStats(partidaId) {
    const resp = await fetch(`${this.baseUrl}/api/futebol/partida/${partidaId}/stats`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao obter estatísticas da partida (${partidaId}): HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Obtém a URL do Gráfico Estatístico Comparativo SVG em Tempo Real da Partida
   * @param {string} partidaId
   * @returns {string}
   */
  static getGraficoPartidaUrl(partidaId) {
    return `${this.baseUrl}/api/futebol/partida/${partidaId}/grafico.svg`;
  }

  /**
   * Obtém as escalações oficiais com titulares, reservas e capitão
   * @param {string} partidaId
   * @returns {Promise<Object>}
   */
  static async getPartidaEscalacoes(partidaId) {
    const resp = await fetch(`${this.baseUrl}/api/futebol/partida/${partidaId}/escalacoes`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao obter escalações da partida (${partidaId}): HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Obtém retrospecto histórico de clássicos mundiais
   * @param {string} [slug] - Ex: 'flamengo-palmeiras', 'real-madrid-barcelona'
   * @returns {Promise<Object>}
   */
  static async getClassicos(slug) {
    const url = slug 
      ? `${this.baseUrl}/api/futebol/classicos/${slug}`
      : `${this.baseUrl}/api/futebol/classicos`;
    const resp = await fetch(url, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao obter clássicos: HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Compara a carreira inteira de dois atletas (gols, jogos, títulos, prêmios)
   * @param {string} id1 - Ex: 'messi-10', 'pele-10'
   * @param {string} id2 - Ex: 'cr7-7', 'ronaldo-9'
   * @returns {Promise<Object>}
   */
  static async compararCarreiras(id1, id2) {
    const resp = await fetch(`${this.baseUrl}/api/futebol/carreiras/comparar/${id1}/${id2}`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao comparar carreiras: HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Obtém a URL do Gráfico SVG de Comparação de Carreiras
   * @param {string} id1
   * @param {string} id2
   * @returns {string}
   */
  static getComparacaoCarreirasSvgUrl(id1, id2) {
    return `${this.baseUrl}/api/futebol/carreiras/comparar/${id1}/${id2}.svg`;
  }

  /**
   * Consulta a corrida de Melhor Jogador da Temporada e Seleção do Ano
   * @param {'global'|'brasileirao'} [escopo='global']
   * @returns {Promise<Object>}
   */
  static async getMelhoresDaTemporada(escopo = 'global') {
    const resp = await fetch(`${this.baseUrl}/api/futebol/premios/melhor-do-ano?escopo=${escopo}`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao consultar melhores da temporada: HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Compara dois jogadores em métricas estatísticas e médias
   * @param {string} id1
   * @param {string} id2
   * @returns {Promise<Object>}
   */
  static async compararJogadores(id1, id2) {
    const resp = await fetch(`${this.baseUrl}/api/futebol/jogadores/comparar/${id1}/${id2}`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao comparar jogadores: HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Obtém a análise estatística e parecer tático do motor de análise oficial
   * @param {string} jogadorId
   * @returns {Promise<Object>}
   */
  static async getAnaliseJogador(jogadorId) {
    const resp = await fetch(`${this.baseUrl}/api/futebol/jogadores/${jogadorId}/analise`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao obter análise do jogador (${jogadorId}): HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Obtém a URL do Dashboard Gráfico SVG Completo do Jogador (Card de Scouting e Evolução)
   * @param {string} jogadorId
   * @returns {string}
   */
  static getDashboardJogadorUrl(jogadorId) {
    return `${this.baseUrl}/api/futebol/jogadores/${jogadorId}/dashboard.svg`;
  }

  /**
   * Obtém a URL do Gráfico Radar SVG de atributos do atleta
   * @param {string} jogadorId
   * @returns {string}
   */
  static getRadarJogadorUrl(jogadorId) {
    return `${this.baseUrl}/api/futebol/jogadores/${jogadorId}/radar.svg`;
  }

  /**
   * Lista jogadores cadastrados com filtros
   * @param {Object} [filtros] - { clube?: string, posicao?: string, busca?: string }
   * @returns {Promise<Object>}
   */
  static async getJogadores(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.clube) params.set('clube', filtros.clube);
    if (filtros.posicao) params.set('posicao', filtros.posicao);
    if (filtros.busca) params.set('busca', filtros.busca);

    const query = params.toString() ? `?${params.toString()}` : '';
    const resp = await fetch(`${this.baseUrl}/api/futebol/jogadores${query}`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao listar jogadores: HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Obtém o elenco de jogadores de um clube específico
   * @param {string} clubeSlug - Ex: 'flamengo', 'palmeiras'
   * @returns {Promise<Object>}
   */
  static async getElencoClube(clubeSlug) {
    const resp = await fetch(`${this.baseUrl}/api/futebol/clubes/${clubeSlug}/elenco`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao obter elenco (${clubeSlug}): HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Obtém jogos e rodadas de uma competição
   * @param {string} campeonato - Ex: 'brasileirao-a' ou 'mundo'
   * @returns {Promise<Object>}
   */
  static async getJogos(campeonato = 'brasileirao-a') {
    const resp = await fetch(`${this.baseUrl}/api/futebol/jogos/${campeonato}`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao obter jogos (${campeonato}): HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Obtém placares e partidas em andamento em tempo real (Ao Vivo)
   * @param {string} [campeonato] - Filtro opcional de campeonato
   * @returns {Promise<Object>}
   */
  static async getAoVivo(campeonato) {
    const url = campeonato 
      ? `${this.baseUrl}/api/futebol/aovivo?campeonato=${campeonato}`
      : `${this.baseUrl}/api/futebol/aovivo`;
    const resp = await fetch(url, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao obter jogos ao vivo: HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Lista todos os clubes cadastrados com filtros opcionais
   * @param {Object} [filtros] - { estado?: string, pais?: string, busca?: string }
   * @returns {Promise<Object>}
   */
  static async getClubes(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.estado) params.set('estado', filtros.estado);
    if (filtros.pais) params.set('pais', filtros.pais);
    if (filtros.busca) params.set('busca', filtros.busca);

    const query = params.toString() ? `?${params.toString()}` : '';
    const resp = await fetch(`${this.baseUrl}/api/futebol/clubes${query}`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao listar clubes: HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Obtém os dados cadastrais completos de um clube
   * @param {string} slug - Ex: 'flamengo', 'palmeiras', 'sao-paulo'
   * @returns {Promise<Object>}
   */
  static async getClube(slug) {
    const resp = await fetch(`${this.baseUrl}/api/futebol/clubes/${slug}`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao obter clube (${slug}): HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Lista estádios com filtros opcionais
   * @param {Object} [filtros] - { uf?: string, cidade?: string }
   * @returns {Promise<Object>}
   */
  static async getEstadios(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.uf) params.set('uf', filtros.uf);
    if (filtros.cidade) params.set('cidade', filtros.cidade);

    const query = params.toString() ? `?${params.toString()}` : '';
    const resp = await fetch(`${this.baseUrl}/api/futebol/estadios${query}`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao listar estádios: HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Obtém ranking de artilharia e assistências
   * @param {string} campeonato - Ex: 'brasileirao-a'
   * @returns {Promise<Object>}
   */
  static async getArtilharia(campeonato = 'brasileirao-a') {
    const resp = await fetch(`${this.baseUrl}/api/futebol/artilharia/${campeonato}`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao obter artilharia (${campeonato}): HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Simula um confronto direto entre dois clubes (probabilidade de vitória e expectativa de gols)
   * @param {string} clubeCasa - Slug do clube mandante (ex: 'flamengo')
   * @param {string} clubeVisitante - Slug do clube visitante (ex: 'palmeiras')
   * @returns {Promise<Object>}
   */
  static async simularConfronto(clubeCasa, clubeVisitante) {
    const resp = await fetch(`${this.baseUrl}/api/futebol/confronto/${clubeCasa}/${clubeVisitante}`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao simular confronto: HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Gera URL para o Card SVG dinâmico de partida
   * @param {string} timeCasa 
   * @param {number|string} placarCasa 
   * @param {string} timeVisitante 
   * @param {number|string} placarVisitante 
   * @param {Object} [options] - { campeonato?: string, status?: string }
   * @returns {string}
   */
  static getCardSvgUrl(timeCasa, placarCasa, timeVisitante, placarVisitante, options = {}) {
    const camp = encodeURIComponent(options.campeonato || 'Brasileirão Série A');
    const status = encodeURIComponent(options.status || 'ENCERRADO');
    return `${this.baseUrl}/api/futebol/card/${encodeURIComponent(timeCasa)}/${placarCasa}/${encodeURIComponent(timeVisitante)}/${placarVisitante}.svg?campeonato=${camp}&status=${status}`;
  }
}

export default FutebolPro;
