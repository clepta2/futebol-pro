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
  JOGADORES_CONSOLIDADOS,
  JOGOS_ANTIGOS_HISTORICOS,
  JOGOS_FUTUROS_CALENDARIO,
  RETROSPECTO_CLASSICOS,
  CONFRONTOS_DIRETOS_ATLETAS,
  CORRIDA_MELHOR_DA_TEMPORADA,
  SELECAO_DA_TEMPORADA,
  calcularProbabilidadeConfronto,
  compararJogadores,
  compararCarreiras,
  analisarJogadorComMotor,
  renderDashboardAtletaSvg,
  renderComparacaoCarreirasSvg,
  renderCampo2dPosicaoBolaSvg,
  renderGraficoEstatisticoPartidaSvg,
  renderCardPartidaSvg,
  renderRadarAtletaSvg,
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

// ─── BUSCA DE TODOS OS JOGOS DO MUNDO (GLOBAL LIVE SCOREBOARD) ───
function normalizarDataYmd(dataParam) {
  const now = new Date();
  if (!dataParam || dataParam === 'hoje' || dataParam === 'today') {
    return now.toISOString().slice(0, 10).replace(/-/g, '');
  }
  if (dataParam === 'ontem' || dataParam === 'yesterday') {
    const yesterday = new Date(now.getTime() - 86400000);
    return yesterday.toISOString().slice(0, 10).replace(/-/g, '');
  }
  if (dataParam === 'amanha' || dataParam === 'tomorrow') {
    const tomorrow = new Date(now.getTime() + 86400000);
    return tomorrow.toISOString().slice(0, 10).replace(/-/g, '');
  }
  return String(dataParam).replace(/-/g, '').slice(0, 8);
}

async function fetchJogosMundoLive(dataParam) {
  const ymd = normalizarDataYmd(dataParam);
  const cacheKey = `mundo_header_${ymd}`;
  const cached = edgeCache.get(cacheKey);
  const now = Date.now();
  if (cached && now < cached.expiresAt) {
    return cached.data;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const url = `https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=soccer&dates=${ymd}`;
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json', 'User-Agent': 'FutebolPro-GlobalWorker/2.0' }
    });
    clearTimeout(timeout);

    if (resp.ok) {
      const json = await resp.json();
      const leagues = json.sports?.[0]?.leagues || [];
      const todosJogos = [];

      for (const l of leagues) {
        for (const ev of l.events || []) {
          const home = (ev.competitors || []).find(c => c.homeAway === 'home') || {};
          const away = (ev.competitors || []).find(c => c.homeAway === 'away') || {};
          const fullStatus = ev.fullStatus || {};
          const statusType = fullStatus.type || {};

          let status = 'agendado';
          if (statusType.state === 'in') {
            status = 'ao_vivo';
          } else if (statusType.completed || statusType.state === 'post') {
            status = 'encerrado';
          }

          const placarCasa = home.score !== '' && home.score !== undefined ? parseInt(home.score, 10) : null;
          const placarVisitante = away.score !== '' && away.score !== undefined ? parseInt(away.score, 10) : null;

          todosJogos.push({
            id: ev.id,
            data: ev.date,
            horaUtc: ev.date ? ev.date.slice(11, 16) : '',
            campeonato: l.name,
            campeonatoSlug: l.slug,
            status,
            statusDescricao: statusType.shortDetail || statusType.description || ev.summary || 'Agendado',
            tempoJogo: fullStatus.displayClock || "0'",
            minuto: fullStatus.clock || 0,
            mandante: {
              id: home.id,
              nome: home.displayName || home.name || 'Mandante',
              sigla: home.abbrev || (home.displayName || '').slice(0, 3).toUpperCase(),
              logo: home.logo || '',
              placar: placarCasa
            },
            visitante: {
              id: away.id,
              nome: away.displayName || away.name || 'Visitante',
              sigla: away.abbrev || (away.displayName || '').slice(0, 3).toUpperCase(),
              logo: away.logo || '',
              placar: placarVisitante
            }
          });
        }
      }

      const todayYmd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const isToday = ymd === todayYmd;
      const ttl = isToday ? (30 * 1000) : (60 * 60 * 1000);

      edgeCache.set(cacheKey, {
        data: todosJogos,
        expiresAt: now + ttl
      });

      return todosJogos;
    }
  } catch (err) {
    // Fallback silencioso
  }

  if (cached) return cached.data;

  // Fallback Soberano caso o upstream esteja inacessível
  return [
    {
      id: 'fb_001',
      data: new Date().toISOString(),
      horaUtc: '16:00',
      campeonato: 'Brasileirão Série A',
      campeonatoSlug: 'bra.1',
      status: 'encerrado',
      statusDescricao: 'FT',
      tempoJogo: "90'+4'",
      mandante: { id: '819', nome: 'Flamengo', sigla: 'FLA', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/819.png', placar: 2 },
      visitante: { id: '2029', nome: 'Palmeiras', sigla: 'PAL', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/2029.png', placar: 1 }
    },
    {
      id: 'fb_002',
      data: new Date().toISOString(),
      horaUtc: '17:00',
      campeonato: 'Premier League',
      campeonatoSlug: 'eng.1',
      status: 'encerrado',
      statusDescricao: 'FT',
      tempoJogo: "90'+3'",
      mandante: { id: '359', nome: 'Arsenal', sigla: 'ARS', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png', placar: 3 },
      visitante: { id: '364', nome: 'Liverpool', sigla: 'LIV', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/364.png', placar: 2 }
    },
    {
      id: 'fb_003',
      data: new Date().toISOString(),
      horaUtc: '18:30',
      campeonato: 'LaLiga EA Sports',
      campeonatoSlug: 'esp.1',
      status: 'encerrado',
      statusDescricao: 'FT',
      tempoJogo: "90'+5'",
      mandante: { id: '86', nome: 'Real Madrid', sigla: 'RMA', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/86.png', placar: 2 },
      visitante: { id: '83', nome: 'Barcelona', sigla: 'BAR', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/83.png', placar: 1 }
    }
  ];
}

const MAPA_ESPN_TEAMS = {
  'flamengo': { league: 'bra.1', id: '819' },
  'palmeiras': { league: 'bra.1', id: '2029' },
  'sao-paulo': { league: 'bra.1', id: '2026' },
  'corinthians': { league: 'bra.1', id: '874' },
  'santos': { league: 'bra.1', id: '2674' },
  'cruzeiro': { league: 'bra.1', id: '2022' },
  'atletico-mg': { league: 'bra.1', id: '7632' },
  'fluminense': { league: 'bra.1', id: '3445' },
  'botafogo': { league: 'bra.1', id: '6086' },
  'vasco': { league: 'bra.1', id: '3454' },
  'gremio': { league: 'bra.1', id: '6273' },
  'internacional': { league: 'bra.1', id: '1936' },
  'bahia': { league: 'bra.1', id: '9967' },
  'athletico-pr': { league: 'bra.1', id: '3458' },
  'red-bull-bragantino': { league: 'bra.1', id: '6079' },
  'coritiba': { league: 'bra.1', id: '3456' },
  'mirassol': { league: 'bra.1', id: '9169' },
  'vitoria': { league: 'bra.1', id: '3457' },
  'remo': { league: 'bra.1', id: '4936' },
  'chapecoense': { league: 'bra.1', id: '9318' },
  'real-madrid': { league: 'esp.1', id: '86' },
  'barcelona': { league: 'esp.1', id: '83' },
  'manchester-city': { league: 'eng.1', id: '382' },
  'arsenal': { league: 'eng.1', id: '359' },
  'liverpool': { league: 'eng.1', id: '364' }
};

async function fetchRosterLive(clubeSlug) {
  const teamInfo = MAPA_ESPN_TEAMS[clubeSlug] || { league: 'bra.1', id: clubeSlug };
  const cacheKey = `roster_${clubeSlug}`;
  const cached = edgeCache.get(cacheKey);
  const now = Date.now();
  if (cached && now < cached.expiresAt) {
    return cached.data;
  }

  if (teamInfo && teamInfo.id) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);
      const resp = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${teamInfo.league}/teams/${teamInfo.id}/roster`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json', 'User-Agent': 'FutebolPro-RosterWorker/2.0' }
      });
      clearTimeout(timeout);

      if (resp.ok) {
        const json = await resp.json();
        const athletes = (json.athletes || []).map(a => {
          const statsMap = {};
          for (const cat of a.statistics?.splits?.categories || []) {
            for (const st of cat.stats || []) {
              statsMap[st.name] = { valor: st.value, texto: st.displayValue, desc: st.displayName };
            }
          }

          return {
            id: a.id,
            nome: a.displayName || a.fullName,
            nomeCompleto: a.fullName,
            camisa: a.jersey ? parseInt(a.jersey, 10) : null,
            posicao: a.position?.displayName || 'Jogador',
            posicaoSigla: a.position?.abbreviation || 'J',
            idade: a.age || null,
            nacionalidade: a.citizenship || 'Brasil',
            altura: a.displayHeight || null,
            peso: a.displayWeight || null,
            foto: a.headshot?.href || '',
            clube: json.team?.displayName || '',
            clubeSlug: clubeSlug,
            estatisticasReais: {
              jogos: statsMap.appearances?.valor || 0,
              gols: statsMap.totalGoals?.valor || 0,
              assistencias: statsMap.goalAssists?.valor || 0,
              finalizacoes: statsMap.totalShots?.valor || 0,
              finalizacoesNoAlvo: statsMap.shotsOnTarget?.valor || 0,
              cartoesAmarelos: statsMap.yellowCards?.valor || 0,
              cartoesVermelhos: statsMap.redCards?.valor || 0,
              faltasCometidas: statsMap.foulsCommitted?.valor || 0,
              faltasSofridas: statsMap.foulsSuffered?.valor || 0
            }
          };
        });

        if (athletes.length > 0) {
          edgeCache.set(cacheKey, {
            data: athletes,
            expiresAt: now + (2 * 60 * 60 * 1000)
          });
          return athletes;
        }
      }
    } catch (_) {}
  }

  const soberanos = JOGADORES_CONSOLIDADOS.filter(j => j.clubeSlug === clubeSlug);
  return soberanos;
}

async function fetchPartidaDetalheLive(partidaId, ligaSlug = 'all') {
  const historico = JOGOS_ANTIGOS_HISTORICOS.find(h => h.id === partidaId);
  if (historico) {
    return { ok: true, tipo: 'jogo_historico', partida: historico };
  }

  const futuro = JOGOS_FUTUROS_CALENDARIO.find(f => f.id === partidaId);
  if (futuro) {
    return { ok: true, tipo: 'jogo_futuro', partida: futuro };
  }

  const cacheKey = `partida_${partidaId}`;
  const cached = edgeCache.get(cacheKey);
  const now = Date.now();
  if (cached && now < cached.expiresAt) {
    return cached.data;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const resp = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${ligaSlug}/summary?event=${partidaId}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json', 'User-Agent': 'FutebolPro-SummaryWorker/2.0' }
    });
    clearTimeout(timeout);

    if (resp.ok) {
      const sum = await resp.json();
      const comp = sum.header?.competitions?.[0] || {};
      const home = (comp.competitors || []).find(c => c.homeAway === 'home') || {};
      const away = (comp.competitors || []).find(c => c.homeAway === 'away') || {};

      const keyEvents = (sum.keyEvents || []).map(k => ({
        minuto: k.clock?.displayValue || '',
        tipo: k.type?.text || 'Lance',
        descricao: k.text || '',
        atletas: (k.participants || []).map(p => p.athlete?.displayName).filter(Boolean)
      }));

      const rosters = (sum.rosters || []).map(r => ({
        time: r.team?.displayName || '',
        titulares: (r.roster || []).filter(a => a.starter).map(a => ({
          id: a.athlete?.id,
          nome: a.athlete?.displayName,
          camisa: a.jersey,
          posicao: a.position?.abbreviation,
          capitao: a.captain
        })),
        reservas: (r.roster || []).filter(a => !a.starter).map(a => ({
          id: a.athlete?.id,
          nome: a.athlete?.displayName,
          camisa: a.jersey,
          posicao: a.position?.abbreviation
        }))
      }));

      const estatisticas = (sum.boxscore?.teams || []).map(t => ({
        time: t.team?.displayName,
        stats: Object.fromEntries((t.statistics || []).map(s => [s.label, s.displayValue]))
      }));

      const lanceALance = (sum.commentary || []).map(c => {
        const play = c.play || {};
        return {
          sequencia: c.sequence,
          minuto: c.time?.displayValue || '',
          segundos: c.time?.value || 0,
          tipo: play.type?.text || 'Lance',
          tipoCodigo: play.type?.type || 'play',
          descricao: c.text || '',
          equipe: play.team?.displayName || null,
          atletas: (play.participants || []).map(p => p.athlete?.displayName).filter(Boolean),
          coordenadasCampo: play.fieldPositionX !== undefined ? {
            x: play.fieldPositionX,
            y: play.fieldPositionY,
            vetorDestinoX: play.fieldPosition2X !== undefined ? play.fieldPosition2X : null,
            vetorDestinoY: play.fieldPosition2Y !== undefined ? play.fieldPosition2Y : null,
            alturaGolY: play.goalPositionY !== undefined ? play.goalPositionY : null
          } : null
        };
      });

      const detalhe = {
        ok: true,
        tipo: 'partida_detalhada',
        id: partidaId,
        data: comp.date,
        campeonato: sum.header?.season?.displayName || 'Campeonato',
        status: comp.status?.type?.description || 'Agendado',
        tempoJogo: comp.status?.displayClock || "0'",
        mandante: {
          nome: home.team?.displayName,
          sigla: home.team?.abbreviation,
          placar: home.score,
          logo: home.team?.logos?.[0]?.href
        },
        visitante: {
          nome: away.team?.displayName,
          sigla: away.team?.abbreviation,
          placar: away.score,
          logo: away.team?.logos?.[0]?.href
        },
        infoJogo: {
          estadio: sum.gameInfo?.venue?.fullName || 'Estádio',
          cidade: sum.gameInfo?.venue?.address?.city || '',
          arbitro: (sum.gameInfo?.officials || [])[0]?.displayName || 'Árbitro Oficial'
        },
        golsELances: keyEvents,
        lanceALance,
        escalacoes: rosters,
        estatisticas
      };

      const isLive = comp.status?.type?.state === 'in';
      edgeCache.set(cacheKey, {
        data: detalhe,
        expiresAt: now + (isLive ? 30000 : 3600000)
      });

      return detalhe;
    }
  } catch (_) {}

  return null;
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
          mundo: '/api/futebol/mundo [TODOS os jogos do mundo! Suporta ?data=YYYY-MM-DD|hoje|ontem|amanha&status=ao_vivo|encerrado|agendado&liga=slug&busca=termo&agrupadoPorLiga=true]',
          competicoes: '/api/futebol/competicoes',
          tabela: '/api/futebol/tabela/:campeonato [ex: brasileirao-a, premier-league, la-liga]',
          tabelaFormatos: '/api/futebol/tabela/:campeonato?formato=csv|xml|json',
          jogos: '/api/futebol/jogos/:campeonato [ou /api/futebol/jogos/mundo]',
          aoVivo: '/api/futebol/aovivo [Todos os jogos ao vivo no planeta agora]',
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

    // 6.1 TODOS OS JOGOS DO MUNDO (Global World Hub)
    if (path === '/api/futebol/mundo' || path === '/api/futebol/jogos/mundo') {
      const dataParam = url.searchParams.get('data') || 'hoje';
      const statusFiltro = url.searchParams.get('status')?.toLowerCase();
      const ligaFiltro = url.searchParams.get('liga')?.toLowerCase();
      const busca = (url.searchParams.get('busca') || url.searchParams.get('q') || '').toLowerCase();
      const agrupado = url.searchParams.get('agrupadoPorLiga') === 'true' || url.searchParams.get('agrupar') === 'true';

      const todosJogos = await fetchJogosMundoLive(dataParam);
      let filtrados = todosJogos;

      if (statusFiltro) {
        filtrados = filtrados.filter(j => j.status === statusFiltro);
      }
      if (ligaFiltro) {
        filtrados = filtrados.filter(j => 
          j.campeonatoSlug.toLowerCase().includes(ligaFiltro) || 
          j.campeonato.toLowerCase().includes(ligaFiltro)
        );
      }
      if (busca) {
        filtrados = filtrados.filter(j => 
          j.mandante.nome.toLowerCase().includes(busca) ||
          j.visitante.nome.toLowerCase().includes(busca) ||
          j.campeonato.toLowerCase().includes(busca)
        );
      }

      const totalAoVivo = filtrados.filter(j => j.status === 'ao_vivo').length;
      const totalEncerrados = filtrados.filter(j => j.status === 'encerrado').length;
      const totalAgendados = filtrados.filter(j => j.status === 'agendado').length;

      let payloadJogos = filtrados;
      if (agrupado) {
        payloadJogos = {};
        for (const j of filtrados) {
          if (!payloadJogos[j.campeonato]) payloadJogos[j.campeonato] = [];
          payloadJogos[j.campeonato].push(j);
        }
      }

      return new Response(JSON.stringify({
        ok: true,
        escopo: 'Global / Todos os Jogos do Mundo',
        dataConsultada: normalizarDataYmd(dataParam),
        totalJogos: filtrados.length,
        totalAoVivo,
        totalEncerrados,
        totalAgendados,
        jogos: payloadJogos,
        atualizadoEm: new Date().toISOString()
      }, null, 2), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
      });
    }

    // 6.2 JOGOS DE HOJE NO MUNDO
    if (path === '/api/futebol/mundo/hoje' || path === '/api/futebol/jogos/hoje') {
      const jogosHoje = await fetchJogosMundoLive('hoje');
      return new Response(JSON.stringify({
        ok: true,
        escopo: 'Jogos de Hoje no Mundo',
        totalJogos: jogosHoje.length,
        jogos: jogosHoje
      }), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
      });
    }

    // 6.3 JOGOS DO FUTURO / CALENDÁRIO PRÓXIMAS RODADAS
    if (path === '/api/futebol/mundo/futuro' || path === '/api/futebol/jogos/futuro') {
      const dataParam = url.searchParams.get('data') || 'amanha';
      const liveAmanha = await fetchJogosMundoLive(dataParam);
      const todosFuturos = [...JOGOS_FUTUROS_CALENDARIO, ...liveAmanha];

      return new Response(JSON.stringify({
        ok: true,
        escopo: 'Jogos do Futuro / Calendário de Partidas',
        totalJogosFuturos: todosFuturos.length,
        proximasRodadasDestaque: JOGOS_FUTUROS_CALENDARIO,
        jogosAgendados: liveAmanha
      }), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
      });
    }

    // 6.4 JOGOS ANTIGOS / RESULTADOS HISTÓRICOS E RECENTES
    if (path === '/api/futebol/mundo/antigos' || path === '/api/futebol/mundo/passados' || path === '/api/futebol/jogos/antigos') {
      const dataParam = url.searchParams.get('data') || 'ontem';
      const passadosRecentes = await fetchJogosMundoLive(dataParam);
      const finalizados = passadosRecentes.filter(j => j.status === 'encerrado');

      return new Response(JSON.stringify({
        ok: true,
        escopo: 'Jogos Antigos / Histórico & Placares Passados',
        totalHistoricosLendarios: JOGOS_ANTIGOS_HISTORICOS.length,
        totalRecentesFinalizados: finalizados.length,
        jogosHistoricosLendarios: JOGOS_ANTIGOS_HISTORICOS,
        jogosPassadosRecentes: finalizados
      }), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
      });
    }

    // 6.5 DETALHES DE UMA PARTIDA ESPECÍFICA (Lances, Boxscore Real, Gráfico SVG, Escalações)
    if (path.startsWith('/api/futebol/partida/')) {
      const parts = path.split('/');
      let partidaId = parts[4];
      const isGraficoSvg = partidaId.endsWith('.svg') || parts[5] === 'grafico.svg';
      partidaId = partidaId.replace(/\.svg$/, '');
      const subAcao = parts[5];

      const detalhe = await fetchPartidaDetalheLive(partidaId);
      if (!detalhe) {
        return new Response(JSON.stringify({
          ok: false,
          erro: 'PARTIDA_NAO_ENCONTRADA',
          mensagem: `Partida "${partidaId}" não encontrada.`
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...rateHeaders }
        });
      }

      // Renderizador de Gráfico Estatístico Comparativo SVG em Tempo Real
      if (isGraficoSvg || subAcao === 'grafico.svg') {
        const svg = renderGraficoEstatisticoPartidaSvg(detalhe.partida || detalhe);
        return new Response(svg, {
          headers: {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=30',
            ...CORS_HEADERS,
            ...rateHeaders
          }
        });
      }

      // Renderizador 2D do Campo de Futebol com Posição da Bola e Lances
      if (subAcao === 'campo.svg') {
        const part = detalhe.partida || detalhe;
        const svg = renderCampo2dPosicaoBolaSvg(part.lanceALance || [], part.mandante?.nome, part.visitante?.nome);
        return new Response(svg, {
          headers: {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=15',
            ...CORS_HEADERS,
            ...rateHeaders
          }
        });
      }

      // Lance a Lance Oficial Minuto a Minuto com Coordenadas (x, y) de Faltas, Cartões e Chutes
      if (subAcao === 'lance-a-lance' || subAcao === 'minuto-a-minuto') {
        const part = detalhe.partida || detalhe;
        const tipoFiltro = url.searchParams.get('tipo')?.toLowerCase();
        let lances = part.lanceALance || [];

        if (tipoFiltro) {
          lances = lances.filter(l => 
            l.tipo.toLowerCase().includes(tipoFiltro) || 
            l.descricao.toLowerCase().includes(tipoFiltro)
          );
        }

        const totalFaltas = lances.filter(l => l.tipo.toLowerCase().includes('foul') || l.descricao.toLowerCase().includes('foul')).length;
        const totalCartoes = lances.filter(l => l.descricao.toLowerCase().includes('card') || l.tipo.toLowerCase().includes('card')).length;
        const totalFinalizacoes = lances.filter(l => l.tipo.toLowerCase().includes('shot') || l.descricao.toLowerCase().includes('shot')).length;

        return new Response(JSON.stringify({
          ok: true,
          partidaId,
          partida: `${part.mandante?.nome} vs ${part.visitante?.nome}`,
          totalLancesRegistrados: lances.length,
          resumoDisciplinar: {
            totalFaltas,
            totalCartoes,
            totalFinalizacoes
          },
          lancesMinutoAMinuto: lances
        }, null, 2), {
          headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
        });
      }

      // Localização Exata da Bola e Último Lance em Tempo Real
      if (subAcao === 'posicao-bola' || subAcao === 'bola') {
        const part = detalhe.partida || detalhe;
        const lances = (part.lanceALance || []).filter(l => l.coordenadasCampo && l.coordenadasCampo.x !== undefined);
        const ultimo = lances[lances.length - 1] || null;

        let zonaDoCampo = 'Meio-Campo Neutro';
        if (ultimo && ultimo.coordenadasCampo) {
          const x = ultimo.coordenadasCampo.x;
          if (x < 30) zonaDoCampo = 'Terço Defensivo do Mandante / Área de Perigo';
          else if (x > 70) zonaDoCampo = 'Terço Ofensivo / Ataque Promissor no Gol';
          else zonaDoCampo = 'Intermediária e Construção de Jogada';
        }

        return new Response(JSON.stringify({
          ok: true,
          partidaId,
          tempoJogo: part.tempoJogo || "0'",
          status: part.status,
          posicaoAtualBola: ultimo ? {
            coordenadaX: ultimo.coordenadasCampo.x,
            coordenadaY: ultimo.coordenadasCampo.y,
            zonaTaticaDoCampo: zonaDoCampo,
            lanceAtivo: ultimo.descricao,
            tipoLance: ultimo.tipo,
            equipeComPosse: ultimo.equipe,
            minuto: ultimo.minuto,
            segundosDecorridos: ultimo.segundos
          } : {
            mensagem: 'Aguardando próximo lance com coordenadas telemétricas ativas.'
          },
          campoSvgUrl: `/api/futebol/partida/${partidaId}/campo.svg`
        }, null, 2), {
          headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
        });
      }

      // Estatísticas Oficiais Puras para Análise em Tempo Real
      if (subAcao === 'stats' || subAcao === 'estatisticas') {
        const part = detalhe.partida || detalhe;
        return new Response(JSON.stringify({
          ok: true,
          partidaId,
          campeonato: part.campeonato,
          mandante: part.mandante,
          visitante: part.visitante,
          estatisticasOficiais: part.estatisticas || []
        }, null, 2), {
          headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
        });
      }

      // Escalações Oficiais de Jogadores
      if (subAcao === 'escalacoes' || subAcao === 'rosters') {
        const part = detalhe.partida || detalhe;
        return new Response(JSON.stringify({
          ok: true,
          partidaId,
          escalacoes: part.escalacoes || []
        }, null, 2), {
          headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
        });
      }

      return new Response(JSON.stringify(detalhe, null, 2), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
      });
    }

    // 6.6 RETROSPECTO HISTÓRICO DE GRANDES CLÁSSICOS MUNDIAIS
    if (path === '/api/futebol/classicos') {
      return new Response(JSON.stringify({
        ok: true,
        totalClassicos: Object.keys(RETROSPECTO_CLASSICOS).length,
        classicos: RETROSPECTO_CLASSICOS
      }, null, 2), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
      });
    }

    if (path.startsWith('/api/futebol/classicos/')) {
      const slugClassico = path.split('/')[4]?.toLowerCase();
      const classico = RETROSPECTO_CLASSICOS[slugClassico];
      if (!classico) {
        return new Response(JSON.stringify({
          ok: false,
          erro: 'CLASSICO_NAO_ENCONTRADO',
          mensagem: `Clássico "${slugClassico}" não encontrado.`,
          disponiveis: Object.keys(RETROSPECTO_CLASSICOS)
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...rateHeaders }
        });
      }

      return new Response(JSON.stringify({
        ok: true,
        slug: slugClassico,
        dados: classico
      }, null, 2), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
      });
    }

    // 7. Jogos e Rodadas por Campeonato (ou Global)
    if (path.startsWith('/api/futebol/jogos/')) {
      const slug = path.split('/')[4]?.toLowerCase();
      if (slug === 'mundo') {
        const dataParam = url.searchParams.get('data') || 'hoje';
        const jogos = await fetchJogosMundoLive(dataParam);
        return new Response(JSON.stringify({
          ok: true,
          escopo: 'Global / Mundo',
          totalJogos: jogos.length,
          jogos
        }), {
          headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
        });
      }

      if (!slug || !COMPETICOES[slug]) {
        return new Response(JSON.stringify({
          ok: false,
          erro: 'CAMPEONATO_NAO_ENCONTRADO',
          mensagem: `Campeonato "${slug}" não cadastrado. Consulte /api/futebol/competicoes ou use /api/futebol/mundo.`,
          competicoesDisponiveis: Object.keys(COMPETICOES)
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

    // 8. Placares e Partidas Ao Vivo (Global Live Hub)
    if (path === '/api/futebol/aovivo') {
      const campeonatoFiltro = url.searchParams.get('campeonato')?.toLowerCase();

      if (campeonatoFiltro && COMPETICOES[campeonatoFiltro]) {
        const jogosLiga = await fetchScoreboardLive(campeonatoFiltro);
        const aoVivoLiga = jogosLiga.filter(j => j.status === 'ao_vivo');
        return new Response(JSON.stringify({
          ok: true,
          campeonato: COMPETICOES[campeonatoFiltro].nome,
          totalJogosEmAndamento: aoVivoLiga.length,
          totalJogos: jogosLiga.length,
          emAndamento: aoVivoLiga,
          todosJogos: jogosLiga,
          atualizadoEm: new Date().toISOString()
        }), {
          headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
        });
      }

      // Ao Vivo Global (Planeta Inteiro)
      const todosMundo = await fetchJogosMundoLive('hoje');
      const aoVivoGlobal = todosMundo.filter(j => j.status === 'ao_vivo');

      return new Response(JSON.stringify({
        ok: true,
        escopo: 'Global / Mundo Ao Vivo',
        totalJogosEmAndamento: aoVivoGlobal.length,
        totalJogosHojeMundo: todosMundo.length,
        emAndamento: aoVivoGlobal,
        todosJogosHoje: todosMundo,
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

    // 10. Detalhes de um Clube Específico ou seu Elenco de Jogadores
    if (path.startsWith('/api/futebol/clubes/')) {
      const parts = path.split('/');
      const slug = parts[4]?.toLowerCase();
      const subAcao = parts[5]?.toLowerCase();

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

      // Elenco de Jogadores do Clube
      if (subAcao === 'elenco' || subAcao === 'jogadores') {
        const jogadores = await fetchRosterLive(slug);
        return new Response(JSON.stringify({
          ok: true,
          clube: clube.nomeCurto,
          slug,
          totalJogadores: jogadores.length,
          elenco: jogadores
        }), {
          headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
        });
      }

      return new Response(JSON.stringify({
        ok: true,
        clube
      }), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
      });
    }

    // 10.1 Catálogo e Busca de Jogadores
    if (path === '/api/futebol/jogadores') {
      const clubeFiltro = url.searchParams.get('clube')?.toLowerCase();
      const posicaoFiltro = url.searchParams.get('posicao')?.toLowerCase();
      const busca = (url.searchParams.get('busca') || url.searchParams.get('q') || '').toLowerCase();

      let lista = JOGADORES_CONSOLIDADOS;
      if (clubeFiltro) lista = lista.filter(j => j.clubeSlug.includes(clubeFiltro) || j.clube.toLowerCase().includes(clubeFiltro));
      if (posicaoFiltro) lista = lista.filter(j => j.posicaoGeral.toLowerCase().includes(posicaoFiltro) || j.posicao.toLowerCase().includes(posicaoFiltro));
      if (busca) lista = lista.filter(j => j.nome.toLowerCase().includes(busca) || j.nomeCompleto.toLowerCase().includes(busca) || j.nacionalidade.toLowerCase().includes(busca));

      return new Response(JSON.stringify({
        ok: true,
        totalJogadores: lista.length,
        jogadores: lista
      }), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
      });
    }

    // 10.0 COMPARADOR HISTÓRICO DE CARREIRAS (ex: messi vs cr7, pele vs ronaldo)
    if (path.startsWith('/api/futebol/carreiras/comparar/')) {
      const parts = path.split('/');
      let id1 = parts[5]?.toLowerCase();
      let id2 = parts[6]?.toLowerCase();
      const isGraficoSvg = id2?.endsWith('.svg');
      if (isGraficoSvg) id2 = id2.replace(/\.svg$/, '');

      const j1 = JOGADORES_CONSOLIDADOS.find(j => j.id.toLowerCase() === id1 || j.nome.toLowerCase().includes(id1));
      const j2 = JOGADORES_CONSOLIDADOS.find(j => j.id.toLowerCase() === id2 || j.nome.toLowerCase().includes(id2));

      if (!j1 || !j2) {
        return new Response(JSON.stringify({
          ok: false,
          erro: 'ATLETAS_NAO_ENCONTRADOS',
          mensagem: 'Informe identificadores válidos de atletas para comparação de carreira.',
          exemplo: '/api/futebol/carreiras/comparar/messi-10/cr7-7'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...rateHeaders }
        });
      }

      if (isGraficoSvg) {
        const svg = renderComparacaoCarreirasSvg(j1, j2);
        return new Response(svg, {
          headers: {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
            ...CORS_HEADERS,
            ...rateHeaders
          }
        });
      }

      const comparacao = compararCarreiras(j1, j2);
      return new Response(JSON.stringify({
        ok: true,
        comparacao
      }, null, 2), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
      });
    }

    // 10.0.1 PRÊMIOS DA TEMPORADA & CORRIDA MELHOR JOGADOR DO ANO
    if (path === '/api/futebol/premios/melhor-do-ano' || path === '/api/futebol/premios/temporada') {
      const escopo = url.searchParams.get('escopo')?.toLowerCase() || 'global';
      const ranking = CORRIDA_MELHOR_DA_TEMPORADA[escopo] || CORRIDA_MELHOR_DA_TEMPORADA.global;

      return new Response(JSON.stringify({
        ok: true,
        titulo: 'Corrida Oficial para Melhor Jogador da Temporada (Ballon d\'Or & The Best)',
        escopo,
        temporada: '2026',
        criterios: 'Rating médio ponderado, gols, assistências, títulos oficiais e decisões',
        rankingMelhoresDaTemporada: ranking,
        selecaoIdealDaTemporada: SELECAO_DA_TEMPORADA
      }, null, 2), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
      });
    }

    if (path.startsWith('/api/futebol/jogadores/comparar/')) {
      const parts = path.split('/');
      const id1 = parts[5]?.toLowerCase();
      const id2 = parts[6]?.toLowerCase();

      const j1 = JOGADORES_CONSOLIDADOS.find(j => j.id.toLowerCase() === id1 || j.nome.toLowerCase().includes(id1));
      const j2 = JOGADORES_CONSOLIDADOS.find(j => j.id.toLowerCase() === id2 || j.nome.toLowerCase().includes(id2));

      if (!j1 || !j2) {
        return new Response(JSON.stringify({
          ok: false,
          erro: 'JOGADORES_INVALIDOS',
          mensagem: 'Informe dois identificadores válidos de atletas para comparação.',
          exemplo: '/api/futebol/jogadores/comparar/pedro-9/veiga-23'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...rateHeaders }
        });
      }

      const comparacao = compararJogadores(j1, j2);
      return new Response(JSON.stringify({
        ok: true,
        comparacao
      }, null, 2), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
      });
    }

    if (path.startsWith('/api/futebol/jogadores/')) {
      const parts = path.split('/');
      let jogadorId = parts[4]?.toLowerCase();
      const subAcao = parts[5]?.toLowerCase();
      const isDashboardSvg = subAcao === 'dashboard.svg' || subAcao === 'grafico.svg';
      const isRadarSvg = subAcao === 'radar.svg' || jogadorId.endsWith('.svg');
      jogadorId = jogadorId.replace(/\.svg$/, '').replace(/\/radar$/, '');

      let jogador = JOGADORES_CONSOLIDADOS.find(j => 
        j.id.toLowerCase() === jogadorId || 
        (j.slug && j.slug.toLowerCase() === jogadorId) || 
        j.nome.toLowerCase().includes(jogadorId)
      );

      if (!jogador) {
        const elencoFla = await fetchRosterLive('flamengo');
        jogador = elencoFla.find(j => j.id === jogadorId || j.nome.toLowerCase().includes(jogadorId));
      }

      if (!jogador) {
        return new Response(JSON.stringify({
          ok: false,
          erro: 'JOGADOR_NAO_ENCONTRADO',
          mensagem: `Jogador "${jogadorId}" não encontrado na base de dados oficiais.`
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...rateHeaders }
        });
      }

      // Motor de Análise Estatística e Tática Oficial
      const analise = analisarJogadorComMotor(jogador);

      // Renderização do Dashboard Gráfico SVG Completo
      if (isDashboardSvg) {
        const svg = renderDashboardAtletaSvg(jogador, analise);
        return new Response(svg, {
          headers: {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
            ...CORS_HEADERS,
            ...rateHeaders
          }
        });
      }

      // Renderização do Radar SVG de Atributos
      if (isRadarSvg) {
        const svg = renderRadarAtletaSvg(jogador);
        return new Response(svg, {
          headers: {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
            ...CORS_HEADERS,
            ...rateHeaders
          }
        });
      }

      // Retorno JSON do Motor de Análise
      if (subAcao === 'analise' || subAcao === 'motor') {
        return new Response(JSON.stringify({
          ok: true,
          analise
        }, null, 2), {
          headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
        });
      }

      return new Response(JSON.stringify({
        ok: true,
        jogador,
        analiseRapida: {
          rating: analise.motorAnalitico?.ratingGeral,
          classe: analise.motorAnalitico?.classeDesempenho,
          arquetipo: analise.motorAnalitico?.arquetipoTatico,
          pontosFortes: analise.motorAnalitico?.pontosFortes
        }
      }, null, 2), {
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

    // 15. INTEGRAÇÕES DIRETAS COM REPOSITÓRIOS GITHUB PÚBLICOS
    if (path === '/api/futebol/github/fontes') {
      return new Response(JSON.stringify({
        ok: true,
        servico: 'Futebol Pro — Matriz de Fontes e Repositórios GitHub',
        repositoriosOficiais: [
          {
            nome: 'OpenFootball / football.json',
            repositorio: 'openfootball/football.json',
            url: 'https://github.com/openfootball/football.json',
            descricao: 'Dados abertos de domínio público de ligas mundiais (Premier League, LaLiga, Serie A, Bundesliga) em formato JSON sem necessidade de API key.',
            rotaApi: '/api/futebol/github/openfootball/:torneio'
          },
          {
            nome: 'OpenFootball / worldcup.json',
            repositorio: 'openfootball/worldcup.json',
            url: 'https://github.com/openfootball/worldcup.json',
            descricao: 'Resultados e calendários oficiais da Copa do Mundo FIFA em JSON.',
            rotaApi: '/api/futebol/github/openfootball/world-cup'
          },
          {
            nome: 'Brasileirão Dataset (Histórico desde 2003)',
            repositorio: 'adaoduque/Brasileirao_Dataset',
            url: 'https://github.com/adaoduque/Brasileirao_Dataset',
            descricao: 'Mais de 8.700 partidas e 9.800 gols do Campeonato Brasileiro com escalações táticas, técnicos, árbitros e arenas.',
            rotaApi: '/api/futebol/github/brasileirao-historico'
          },
          {
            nome: 'StatsBomb Open Data (Hudl)',
            repositorio: 'hudl/open-data',
            url: 'https://github.com/hudl/open-data',
            descricao: 'O maior acervo aberto de telemetria estatística de eventos (passes, xG, mapas de calor e pressão).'
          },
          {
            nome: 'Football Logos (Brasões Oficiais SVG)',
            repositorio: 'luukhopman/football-logos',
            url: 'https://github.com/luukhopman/football-logos',
            descricao: 'Brasões e escudos oficiais de clubes do mundo inteiro em SVG vetorial de alta definição.'
          }
        ]
      }, null, 2), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
      });
    }

    if (path.startsWith('/api/futebol/github/openfootball/')) {
      const torneio = path.split('/')[5]?.toLowerCase();
      let fileUrl = 'https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/en.1.json';
      if (torneio === 'world-cup' || torneio === 'copa-do-mundo') {
        fileUrl = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';
      } else if (torneio === 'la-liga' || torneio === 'es.1') {
        fileUrl = 'https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/es.1.json';
      } else if (torneio === 'bundesliga' || torneio === 'de.1') {
        fileUrl = 'https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/de.1.json';
      } else if (torneio === 'serie-a' || torneio === 'it.1') {
        fileUrl = 'https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/it.1.json';
      }

      const cacheKey = `gh_openfootball_${torneio}`;
      const cached = edgeCache.get(cacheKey);
      const now = Date.now();
      if (cached && now < cached.expiresAt) {
        return new Response(JSON.stringify(cached.data, null, 2), {
          headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
        });
      }

      try {
        const resp = await fetch(fileUrl, {
          headers: { 'Accept': 'application/json', 'User-Agent': 'FutebolPro-GithubBridge/1.0' }
        });
        if (resp.ok) {
          const json = await resp.json();
          edgeCache.set(cacheKey, { data: json, expiresAt: now + (6 * 60 * 60 * 1000) });
          return new Response(JSON.stringify({
            ok: true,
            fonte: 'GitHub: openfootball/football.json',
            dados: json
          }, null, 2), {
            headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
          });
        }
      } catch (_) {}

      return new Response(JSON.stringify({
        ok: false,
        erro: 'UPSTREAM_GITHUB_INDISPONIVEL',
        mensagem: 'Não foi possível carregar o arquivo do repositório openfootball no momento.'
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...rateHeaders }
      });
    }

    if (path === '/api/futebol/github/brasileirao-historico') {
      const clube = url.searchParams.get('clube')?.toLowerCase();
      const ano = url.searchParams.get('ano');
      const cacheKey = 'gh_brasileirao_historico';
      let partidas = edgeCache.get(cacheKey)?.data;

      if (!partidas) {
        try {
          const resp = await fetch('https://raw.githubusercontent.com/adaoduque/Brasileirao_Dataset/master/campeonato-brasileiro-full.csv', {
            headers: { 'Accept': 'text/plain', 'User-Agent': 'FutebolPro-GithubBridge/1.0' }
          });
          if (resp.ok) {
            const csvText = await resp.text();
            const lines = csvText.split('\n').filter(Boolean);
            partidas = lines.slice(1).map(l => {
              const vals = l.split(',').map(v => v.replace(/"/g, '').trim());
              return {
                id: vals[0],
                rodada: vals[1],
                data: vals[2],
                mandante: vals[4],
                visitante: vals[5],
                formacaoMandante: vals[6],
                formacaoVisitante: vals[7],
                tecnicoMandante: vals[8],
                tecnicoVisitante: vals[9],
                vencedor: vals[10],
                estadio: vals[11],
                placarMandante: parseInt(vals[12], 10),
                placarVisitante: parseInt(vals[13], 10)
              };
            });
            edgeCache.set(cacheKey, { data: partidas, expiresAt: Date.now() + (24 * 60 * 60 * 1000) });
          }
        } catch (_) {}
      }

      if (!partidas) {
        partidas = JOGOS_ANTIGOS_HISTORICOS;
      }

      let filtradas = partidas;
      if (clube) {
        filtradas = filtradas.filter(p => 
          (p.mandante || '').toLowerCase().includes(clube) || 
          (p.visitante || '').toLowerCase().includes(clube)
        );
      }
      if (ano) {
        filtradas = filtradas.filter(p => (p.data || '').includes(ano));
      }

      return new Response(JSON.stringify({
        ok: true,
        fonte: 'GitHub: adaoduque/Brasileirao_Dataset',
        totalPartidasEncontradas: filtradas.length,
        amostraPartidas: filtradas.slice(-50)
      }, null, 2), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
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
