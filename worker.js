/**
 * worker.js — Futebol Pro API Anycast
 * Cloudflare Worker Anycast para Dados Esportivos de Alta Performance (<5ms Anycast)
 * 
 * Cobertura Completa:
 * - Brasileirão Série A & B, Copa do Brasil, Libertadores, Sul-Americana
 * - UEFA Champions League, Premier League, LaLiga, Serie A Itália, Bundesliga
 * - Tabelas de Classificação em Tempo Real (Live Edge Cache + Fallback Soberano)
 * - Jogos, Rodadas, Placares e Lances Ao Vivo
 * - Base Soberana de Clubes, Escudos Oficiais, Estádios e Capacidades
 * - Artilharia, Assistências e Cartões
 * - Simulador de Confronto Direto (Head-to-Head / Elo Rating e Probabilidades)
 * - Renderizador Vetorial SVG de Cards de Jogo e Exportação Universal (JSON, CSV, XML)
 * 
 * @license MIT
 * @see https://github.com/clepta2/futebol-pro
 */

import {
  COMPETICOES,
  ESTADIOS,
  CLUBES,
  TABELAS_SOBERANAS,
  ARTILHARIA_CONSOLIDADA,
  calcularProbabilidadeConfronto,
  renderCardPartidaSvg,
  exportarTabelaCsv,
  exportarTabelaXml
} from './dados-futebol.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
  'Access-Control-Max-Age': '86400'
};

// ─── MATRIZ OFICIAL DE PLANOS (PADRÃO PONTE SUITE - ATÉ 86.400 REQ/DIA) ───
const PLANOS_CONFIG = {
  free: {
    nome: 'Free / Sandbox',
    rpm: 30,
    cotaDiaria: 500,
    prefixo: 'fut_free_',
    cadencia: '30 RPM (0.5 req/s)',
    janelaSegundos: 86400
  },
  starter: {
    nome: 'Starter 86.400 (1 req/s 24/7)',
    rpm: 60,
    cotaDiaria: 86400,
    prefixo: 'fut_start_',
    cadencia: '1 req/s contínuo 24/7',
    janelaSegundos: 86400
  },
  pro: {
    nome: 'Pro (5 req/s)',
    rpm: 300,
    cotaDiaria: 250000,
    prefixo: 'fut_pro_',
    cadencia: '5 req/s contínuo',
    janelaSegundos: 86400
  },
  business: {
    nome: 'Business Enterprise (20 req/s)',
    rpm: 1200,
    cotaDiaria: 1000000,
    prefixo: 'fut_biz_',
    cadencia: '20 req/s contínuo',
    janelaSegundos: 86400
  },
  master: {
    nome: 'Master Admin (Bypass Ilimitado)',
    rpm: 3000,
    cotaDiaria: Infinity,
    prefixo: 'fut_master_',
    cadencia: 'Ilimitada (Sub-5ms Anycast)',
    janelaSegundos: 86400
  }
};

const minuteBuckets = new Map();
const dailyBuckets = new Map();
const edgeCache = new Map();
const WINDOW_MINUTE_MS = 60 * 1000;
const WINDOW_DAILY_MS = 86400 * 1000;
const BOOT_TIME = Date.now();

function resolverPlanoEChave(request) {
  const authHeader = request.headers.get('Authorization') || '';
  const xApiKey = request.headers.get('x-api-key') || '';
  const url = new URL(request.url);
  const queryKey = url.searchParams.get('key') || url.searchParams.get('api_key') || '';

  let token = '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (xApiKey) {
    token = xApiKey.trim();
  } else if (queryKey) {
    token = queryKey.trim();
  }

  if (!token) {
    const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || 'anonymous_ip';
    return { plano: 'free', keyId: `ip_${clientIp}`, config: PLANOS_CONFIG.free, isAnonymous: true };
  }

  if (token.startsWith('fut_master_') || token === 'fut_master_key_bypass') {
    return { plano: 'master', keyId: token, config: PLANOS_CONFIG.master, isAnonymous: false };
  }
  if (token.startsWith('fut_biz_')) {
    return { plano: 'business', keyId: token, config: PLANOS_CONFIG.business, isAnonymous: false };
  }
  if (token.startsWith('fut_pro_')) {
    return { plano: 'pro', keyId: token, config: PLANOS_CONFIG.pro, isAnonymous: false };
  }
  if (token.startsWith('fut_start_')) {
    return { plano: 'starter', keyId: token, config: PLANOS_CONFIG.starter, isAnonymous: false };
  }
  if (token.startsWith('fut_free_') || token.startsWith('fut_test_')) {
    return { plano: 'free', keyId: token, config: PLANOS_CONFIG.free, isAnonymous: false };
  }

  return { plano: 'starter', keyId: token, config: PLANOS_CONFIG.starter, isAnonymous: false };
}

function aplicarRateLimit(keyId, config) {
  const now = Date.now();

  let dailyBucket = dailyBuckets.get(keyId);
  if (!dailyBucket || now > dailyBucket.resetAt) {
    dailyBucket = { count: 0, resetAt: now + WINDOW_DAILY_MS };
    dailyBuckets.set(keyId, dailyBucket);
  }

  let minBucket = minuteBuckets.get(keyId);
  if (!minBucket || now > minBucket.resetAt) {
    minBucket = { count: 0, resetAt: now + WINDOW_MINUTE_MS };
    minuteBuckets.set(keyId, minBucket);
  }

  if (minuteBuckets.size > 10000) {
    for (const [k, v] of minuteBuckets) {
      if (now > v.resetAt) minuteBuckets.delete(k);
    }
  }
  if (dailyBuckets.size > 10000) {
    for (const [k, v] of dailyBuckets) {
      if (now > v.resetAt) dailyBuckets.delete(k);
    }
  }

  const isMaster = config.cotaDiaria === Infinity;
  const resetMinSeconds = Math.max(1, Math.ceil((minBucket.resetAt - now) / 1000));
  const resetDailySeconds = Math.max(1, Math.ceil((dailyBucket.resetAt - now) / 1000));

  if (!isMaster && dailyBucket.count >= config.cotaDiaria) {
    return {
      ok: false,
      error: 'DAILY_LIMIT_EXCEEDED',
      message: `Cota diária de requisições excedida para o plano ${config.nome} (${config.cotaDiaria} req/86400s).`,
      plano: config.nome,
      cotaDiaria: config.cotaDiaria,
      limit: config.rpm,
      remaining: Math.max(0, config.rpm - minBucket.count),
      resetAt: minBucket.resetAt,
      dailyLimit: config.cotaDiaria,
      dailyRemaining: 0,
      dailyResetAt: dailyBucket.resetAt,
      resetSeconds: resetDailySeconds
    };
  }

  if (minBucket.count >= config.rpm) {
    return {
      ok: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: `Limite de requisições por minuto excedido para o plano ${config.nome} (${config.rpm} RPM).`,
      plano: config.nome,
      limit: config.rpm,
      remaining: 0,
      resetAt: minBucket.resetAt,
      dailyLimit: config.cotaDiaria,
      dailyRemaining: Math.max(0, config.cotaDiaria - dailyBucket.count),
      dailyResetAt: dailyBucket.resetAt,
      resetSeconds: resetMinSeconds
    };
  }

  minBucket.count++;
  dailyBucket.count++;

  return {
    ok: true,
    plano: config.nome,
    limit: config.rpm,
    remaining: Math.max(0, config.rpm - minBucket.count),
    resetAt: minBucket.resetAt,
    dailyLimit: config.cotaDiaria,
    dailyRemaining: isMaster ? 'unlimited' : Math.max(0, config.cotaDiaria - dailyBucket.count),
    dailyResetAt: dailyBucket.resetAt,
    resetSeconds: resetMinSeconds
  };
}

function gerarHeadersRateLimit(auth, rateInfo) {
  return {
    'x-futebol-plan': auth.plano || 'free',
    'x-futebol-ratelimit-limit': String(rateInfo.limit || 30),
    'x-futebol-ratelimit-remaining': String(rateInfo.remaining !== undefined ? rateInfo.remaining : 0),
    'x-futebol-ratelimit-reset': String(rateInfo.resetAt || Math.floor((Date.now() + 60000) / 1000)),
    'x-futebol-daily-limit': String(rateInfo.dailyLimit || 500),
    'x-futebol-daily-remaining': String(rateInfo.dailyRemaining !== undefined ? rateInfo.dailyRemaining : 0),
    'x-futebol-engine': 'Ponte Edge Anycast v2.0 (Sub-5ms RAM)'
  };
}

// ─── BUSCA AO VIVO COM EDGE CACHE E FALLBACK SOBERANO ───
async function fetchTabelaLive(campeonatoSlug) {
  const comp = COMPETICOES[campeonatoSlug];
  if (!comp) return null;

  const cacheKey = `standings_${comp.codigoEspn}`;
  const cached = edgeCache.get(cacheKey);
  const now = Date.now();
  if (cached && now < cached.expiresAt) {
    return { tabela: cached.data, fonte: 'edge_cache_live', atualizadoEm: cached.atualizadoEm };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const resp = await fetch(`https://site.api.espn.com/apis/v2/sports/soccer/${comp.codigoEspn}/standings`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json', 'User-Agent': 'FutebolPro-EdgeWorker/1.0' }
    });
    clearTimeout(timeout);

    if (resp.ok) {
      const json = await resp.json();
      const entries = json.children?.[0]?.standings?.entries || [];
      if (entries.length > 0) {
        const tabelaFormatada = entries.map(e => {
          const s = {};
          (e.stats || []).forEach(st => { s[st.name] = st.value; });
          const j = s.gamesPlayed || 0;
          const pts = s.points || 0;
          const pos = s.rank || 0;
          
          let zona = 'Permanência';
          if (campeonatoSlug === 'brasileirao-a') {
            if (pos <= 4) zona = 'Libertadores (G4)';
            else if (pos <= 6) zona = 'Pré-Libertadores';
            else if (pos <= 12) zona = 'Sul-Americana';
            else if (pos >= 17) zona = 'Rebaixamento (Z4)';
          } else if (campeonatoSlug === 'premier-league' || campeonatoSlug === 'la-liga') {
            if (pos <= 4) zona = 'Champions League';
            else if (pos <= 6) zona = 'Europa / Conference League';
            else if (pos >= 18) zona = 'Rebaixamento';
          }

          return {
            pos,
            time: e.team.displayName,
            sigla: e.team.abbreviation,
            logo: e.team.logos?.[0]?.href || '',
            pts,
            j,
            v: s.wins || 0,
            e: s.ties || 0,
            d: s.losses || 0,
            gp: s.pointsFor || 0,
            gc: s.pointsAgainst || 0,
            sg: s.pointDifferential || 0,
            aproveitamento: j > 0 ? Number(((pts / (j * 3)) * 100).toFixed(1)) : 0,
            zona
          };
        });

        edgeCache.set(cacheKey, {
          data: tabelaFormatada,
          expiresAt: now + (3 * 60 * 1000), // 3 minutos de cache
          atualizadoEm: new Date().toISOString()
        });

        return { tabela: tabelaFormatada, fonte: 'live_upstream', atualizadoEm: new Date().toISOString() };
      }
    }
  } catch (err) {
    // Falha de rede ou timeout — aciona fallback soberano instantâneo
  }

  // Fallback Soberano
  const soberana = TABELAS_SOBERANAS[campeonatoSlug];
  if (soberana) {
    return { tabela: soberana, fonte: 'soberana_fallback', atualizadoEm: new Date().toISOString() };
  }

  return null;
}

async function fetchScoreboardLive(campeonatoSlug) {
  const comp = COMPETICOES[campeonatoSlug];
  if (!comp) return [];

  const cacheKey = `scoreboard_${comp.codigoEspn}`;
  const cached = edgeCache.get(cacheKey);
  const now = Date.now();
  if (cached && now < cached.expiresAt) {
    return cached.data;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const resp = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${comp.codigoEspn}/scoreboard`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json', 'User-Agent': 'FutebolPro-EdgeWorker/1.0' }
    });
    clearTimeout(timeout);

    if (resp.ok) {
      const json = await resp.json();
      const events = json.events || [];
      const partidas = events.map(ev => {
        const compEvent = ev.competitions?.[0] || {};
        const homeComp = (compEvent.competitors || []).find(c => c.homeAway === 'home') || {};
        const awayComp = (compEvent.competitors || []).find(c => c.homeAway === 'away') || {};
        const statusType = ev.status?.type || {};

        return {
          id: ev.id,
          data: ev.date,
          status: statusType.name === 'STATUS_IN_PROGRESS' 
            ? 'ao_vivo' 
            : statusType.completed 
              ? 'encerrado' 
              : 'agendado',
          statusDescricao: statusType.description || 'Agendado',
          tempoJogo: ev.status?.displayClock || "0'",
          minuto: ev.status?.clock || 0,
          campeonato: comp.nome,
          campeonatoSlug: comp.slug,
          mandante: {
            id: homeComp.id,
            nome: homeComp.team?.displayName || 'Mandante',
            sigla: homeComp.team?.abbreviation || 'MAN',
            logo: homeComp.team?.logo || homeComp.team?.logos?.[0]?.href || '',
            placar: parseInt(homeComp.score || '0', 10)
          },
          visitante: {
            id: awayComp.id,
            nome: awayComp.team?.displayName || 'Visitante',
            sigla: awayComp.team?.abbreviation || 'VIS',
            logo: awayComp.team?.logo || awayComp.team?.logos?.[0]?.href || '',
            placar: parseInt(awayComp.score || '0', 10)
          },
          estadio: compEvent.venue?.fullName || 'Estádio Oficial',
          cidade: compEvent.venue?.address?.city || 'Brasil'
        };
      });

      edgeCache.set(cacheKey, {
        data: partidas,
        expiresAt: now + (30 * 1000) // 30s TTL para placares ao vivo
      });

      return partidas;
    }
  } catch (err) {
    // Fallback silencioso
  }

  return [];
}

export default {
  async fetch(request, env = {}, ctx) {
    const t0 = performance.now();
    const url = new URL(request.url);

    // 1. CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // 2. Health & Telemetria Anycast
    if (url.pathname === '/health' || url.pathname === '/api/futebol/health') {
      const uptimeSec = Math.floor((Date.now() - BOOT_TIME) / 1000);
      return new Response(JSON.stringify({
        ok: true,
        servico: 'Futebol Pro Anycast API',
        versao: '2.0.0',
        status: 'operacional',
        edgeColo: request.cf?.colo || 'GRU (São Paulo)',
        latenciaEdgeMs: Number((performance.now() - t0).toFixed(2)),
        totalClubesCadastrados: Object.keys(CLUBES).length,
        totalEstadiosCadastrados: ESTADIOS.length,
        totalCompeticoes: Object.keys(COMPETICOES).length,
        uptimeSegundos: uptimeSec,
        memoriaCacheIsolate: `${edgeCache.size} chaves ativas`,
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }

    // 3. Autenticação e Rate Limiting
    const auth = resolverPlanoEChave(request);
    const rateCheck = aplicarRateLimit(auth.keyId, auth.config);
    const rateHeaders = gerarHeadersRateLimit(auth, rateCheck);

    if (!rateCheck.ok) {
      return new Response(JSON.stringify({
        ok: false,
        erro: rateCheck.error,
        mensagem: rateCheck.message,
        plano: rateCheck.plano,
        limiteRpm: rateCheck.limit,
        cotaDiaria: rateCheck.cotaDiaria,
        sugestaoUpgrade: 'Para limites de 86.400 req/dia (1 req/s contínuo) ou bypass ilimitado, use o plano Starter ou Pro.',
        documentacao: 'https://ponte.ozpro.com.br'
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(rateCheck.resetSeconds || 60),
          ...CORS_HEADERS,
          ...rateHeaders
        }
      });
    }

    const path = url.pathname.replace(/\/$/, '');

    // 4. Documentação / Índice Raiz
    if (path === '' || path === '/api' || path === '/api/futebol') {
      return new Response(JSON.stringify({
        ok: true,
        api: 'Futebol Pro API Anycast',
        versao: '2.0.0',
        descricao: 'Dados em Tempo Real de Futebol Brasileiro e Internacional na Borda Cloudflare Anycast (<5ms)',
        planoAtivo: auth.config.nome,
        limiteRpm: auth.config.rpm,
        cotaDiaria: auth.config.cotaDiaria,
        rotas: {
          competicoes: '/api/futebol/competicoes',
          tabela: '/api/futebol/tabela/:campeonato [ex: brasileirao-a, premier-league, la-liga]',
          tabelaFormatos: '/api/futebol/tabela/:campeonato?formato=csv|xml|json',
          jogos: '/api/futebol/jogos/:campeonato',
          aoVivo: '/api/futebol/aovivo',
          clubes: '/api/futebol/clubes [suporta ?estado=SP&pais=Brasil&busca=flamengo]',
          clubeDetalhe: '/api/futebol/clubes/:slug [ex: flamengo, palmeiras, real-madrid]',
          estadios: '/api/futebol/estadios [suporta ?cidade=Rio de Janeiro&uf=RJ]',
          estadioDetalhe: '/api/futebol/estadios/:slug [ex: maracana, allianz-parque]',
          artilharia: '/api/futebol/artilharia/:campeonato',
          simuladorConfronto: '/api/futebol/confronto/:clubeCasa/:clubeVisitante [ex: flamengo/palmeiras]',
          cardSvg: '/api/futebol/card/:casa/:placarCasa/:visitante/:placarVisitante.svg',
          healthcheck: '/api/futebol/health'
        },
        documentacao: 'https://github.com/clepta2/futebol-pro',
        marketplace: 'https://ponte.ozpro.com.br'
      }, null, 2), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
      });
    }

    // 5. Competições Suportadas
    if (path === '/api/futebol/competicoes') {
      return new Response(JSON.stringify({
        ok: true,
        totalCompeticoes: Object.keys(COMPETICOES).length,
        competicoes: Object.values(COMPETICOES)
      }), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
      });
    }

    // 6. Tabela de Classificação
    if (path.startsWith('/api/futebol/tabela/')) {
      const slug = path.split('/')[4]?.toLowerCase();
      if (!slug || !COMPETICOES[slug]) {
        return new Response(JSON.stringify({
          ok: false,
          erro: 'CAMPEONATO_NAO_ENCONTRADO',
          mensagem: `Campeonato "${slug}" não reconhecido. Consulte /api/futebol/competicoes.`,
          competicoesDisponiveis: Object.keys(COMPETICOES)
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...rateHeaders }
        });
      }

      const resultado = await fetchTabelaLive(slug);
      if (!resultado) {
        return new Response(JSON.stringify({
          ok: false,
          erro: 'TABELA_INDISPONIVEL',
          mensagem: 'Não foi possível carregar a tabela para esta competição no momento.'
        }), {
          status: 503,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...rateHeaders }
        });
      }

      const formato = url.searchParams.get('formato') || url.searchParams.get('format') || 'json';

      // Exportação CSV
      if (formato === 'csv') {
        const csv = exportarTabelaCsv(resultado.tabela, COMPETICOES[slug].nome);
        return new Response(csv, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="tabela-${slug}.csv"`,
            ...CORS_HEADERS,
            ...rateHeaders
          }
        });
      }

      // Exportação XML
      if (formato === 'xml') {
        const xml = exportarTabelaXml(resultado.tabela, slug);
        return new Response(xml, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            ...CORS_HEADERS,
            ...rateHeaders
          }
        });
      }

      return new Response(JSON.stringify({
        ok: true,
        campeonato: COMPETICOES[slug].nome,
        slug,
        temporada: COMPETICOES[slug].temporada,
        pais: COMPETICOES[slug].pais,
        fonte: resultado.fonte,
        atualizadoEm: resultado.atualizadoEm,
        totalClubes: resultado.tabela.length,
        tabela: resultado.tabela
      }), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
      });
    }

    // 7. Jogos e Rodadas por Campeonato
    if (path.startsWith('/api/futebol/jogos/')) {
      const slug = path.split('/')[4]?.toLowerCase();
      if (!slug || !COMPETICOES[slug]) {
        return new Response(JSON.stringify({
          ok: false,
          erro: 'CAMPEONATO_NAO_ENCONTRADO',
          mensagem: `Campeonato "${slug}" não cadastrado.`
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...rateHeaders }
        });
      }

      const jogos = await fetchScoreboardLive(slug);
      return new Response(JSON.stringify({
        ok: true,
        campeonato: COMPETICOES[slug].nome,
        slug,
        totalJogos: jogos.length,
        jogos
      }), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
      });
    }

    // 8. Placares e Partidas Ao Vivo (Live Hub)
    if (path === '/api/futebol/aovivo') {
      const campeonatoFiltro = url.searchParams.get('campeonato')?.toLowerCase();
      const ligas = campeonatoFiltro && COMPETICOES[campeonatoFiltro]
        ? [campeonatoFiltro]
        : ['brasileirao-a', 'premier-league', 'la-liga', 'champions-league'];

      const resultadosPorLiga = await Promise.all(ligas.map(l => fetchScoreboardLive(l)));
      const todosJogos = resultadosPorLiga.flat();
      const aoVivo = todosJogos.filter(j => j.status === 'ao_vivo');

      return new Response(JSON.stringify({
        ok: true,
        totalJogosEmAndamento: aoVivo.length,
        totalJogosMonitorados: todosJogos.length,
        emAndamento: aoVivo,
        todosJogos,
        atualizadoEm: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
      });
    }

    // 9. Cadastro Soberano de Clubes
    if (path === '/api/futebol/clubes') {
      const estado = url.searchParams.get('estado')?.toUpperCase();
      const pais = url.searchParams.get('pais')?.toLowerCase();
      const busca = url.searchParams.get('busca')?.toLowerCase() || url.searchParams.get('q')?.toLowerCase();

      let lista = Object.values(CLUBES);
      if (estado) lista = lista.filter(c => c.estado === estado);
      if (pais) lista = lista.filter(c => c.pais?.toLowerCase() === pais);
      if (busca) {
        lista = lista.filter(c => 
          c.nome.toLowerCase().includes(busca) ||
          c.nomeCurto.toLowerCase().includes(busca) ||
          c.sigla.toLowerCase().includes(busca) ||
          c.cidade.toLowerCase().includes(busca)
        );
      }

      return new Response(JSON.stringify({
        ok: true,
        total: lista.length,
        clubes: lista
      }), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
      });
    }

    // 10. Detalhes de um Clube Específico
    if (path.startsWith('/api/futebol/clubes/')) {
      const slug = path.split('/')[4]?.toLowerCase();
      const clube = CLUBES[slug];
      if (!clube) {
        return new Response(JSON.stringify({
          ok: false,
          erro: 'CLUBE_NAO_ENCONTRADO',
          mensagem: `Clube "${slug}" não encontrado no cadastro oficial.`,
          exemplos: ['flamengo', 'palmeiras', 'sao-paulo', 'corinthians', 'real-madrid']
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...rateHeaders }
        });
      }

      return new Response(JSON.stringify({
        ok: true,
        clube
      }), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
      });
    }

    // 11. Cadastro de Estádios
    if (path === '/api/futebol/estadios') {
      const uf = url.searchParams.get('uf')?.toUpperCase();
      const cidade = url.searchParams.get('cidade')?.toLowerCase();

      let lista = ESTADIOS;
      if (uf) lista = lista.filter(e => e.uf === uf);
      if (cidade) lista = lista.filter(e => e.cidade.toLowerCase().includes(cidade));

      return new Response(JSON.stringify({
        ok: true,
        total: lista.length,
        estadios: lista
      }), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
      });
    }

    // 12. Artilharia e Estatísticas
    if (path.startsWith('/api/futebol/artilharia/')) {
      const slug = path.split('/')[4]?.toLowerCase();
      const artilharia = ARTILHARIA_CONSOLIDADA[slug] || ARTILHARIA_CONSOLIDADA['brasileirao-a'];

      return new Response(JSON.stringify({
        ok: true,
        campeonato: COMPETICOES[slug]?.nome || 'Brasileirão Série A',
        slug: slug || 'brasileirao-a',
        totalArtilheiros: artilharia.length,
        ranking: artilharia
      }), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
      });
    }

    // 13. Simulador de Confronto Direto (Head-to-Head & Elo Probabilities)
    if (path.startsWith('/api/futebol/confronto/')) {
      const parts = path.split('/');
      const slugCasa = parts[4]?.toLowerCase();
      const slugVisitante = parts[5]?.toLowerCase();

      const clubeCasa = CLUBES[slugCasa];
      const clubeVisitante = CLUBES[slugVisitante];

      if (!clubeCasa || !clubeVisitante) {
        return new Response(JSON.stringify({
          ok: false,
          erro: 'CLUBES_INVALIDOS',
          mensagem: 'Informe dois clubes válidos cadastrados para o confronto.',
          formatoEsperado: '/api/futebol/confronto/:clubeCasa/:clubeVisitante',
          exemplo: '/api/futebol/confronto/flamengo/palmeiras'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...rateHeaders }
        });
      }

      const analise = calcularProbabilidadeConfronto(clubeCasa, clubeVisitante);
      return new Response(JSON.stringify({
        ok: true,
        confronto: `${clubeCasa.nomeCurto} vs ${clubeVisitante.nomeCurto}`,
        analise
      }), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
      });
    }

    // 14. Renderizador de Card SVG de Partida
    if (path.startsWith('/api/futebol/card/')) {
      // Ex: /api/futebol/card/Flamengo/2/Palmeiras/1.svg
      const cleanPath = path.replace(/\.svg$/, '');
      const parts = cleanPath.split('/');
      const casa = decodeURIComponent(parts[4] || 'Mandante');
      const placarCasa = decodeURIComponent(parts[5] || '0');
      const visitante = decodeURIComponent(parts[6] || 'Visitante');
      const placarVisitante = decodeURIComponent(parts[7] || '0');
      const camp = url.searchParams.get('campeonato') || 'Brasileirão Série A';
      const status = url.searchParams.get('status') || 'ENCERRADO';

      const svg = renderCardPartidaSvg(casa, placarCasa, visitante, placarVisitante, camp, status);
      return new Response(svg, {
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Cache-Control': 'public, max-age=30',
          ...CORS_HEADERS,
          ...rateHeaders
        }
      });
    }

    // Rota Não Encontrada
    return new Response(JSON.stringify({
      ok: false,
      erro: 'ROTA_NAO_ENCONTRADA',
      mensagem: `A rota '${path}' não existe. Acesse /api/futebol para ver os endpoints disponíveis.`
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...rateHeaders }
    });
  }
};
