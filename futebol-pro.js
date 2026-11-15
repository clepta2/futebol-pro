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
   * Obtém jogos e rodadas de uma competição
   * @param {string} campeonato - Ex: 'brasileirao-a'
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
