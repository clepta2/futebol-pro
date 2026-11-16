import { FutebolPro } from './futebol-pro.js';
import worker from './worker.js';

console.log('🧪 Iniciando Bateria de Testes do FutebolPro API & SDK Oficial...\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    passCount++;
    console.log(`  ✅ ${message}`);
  } else {
    failCount++;
    console.error(`  ❌ FALHA: ${message}`);
    throw new Error(message);
  }
}

// ─── 1. RESOLUÇÃO DE AUTENTICAÇÃO RFC 6750 & MATRIZ DE PLANOS ───
console.log('--- 1. Padrão de Autenticação RFC 6750 & Resolução de Nível ---');

// 1.1 Requisição anônima (sem chave) deve assumir plano Free
const resFree = await worker.fetch(new Request('https://api.test/api/futebol/competicoes'), {});
assert(resFree.status === 200, 'Requisição anônima responde HTTP 200');
assert(resFree.headers.get('x-futebol-plan') === 'free', 'Requisição anônima recebe plano free');
assert(resFree.headers.get('x-futebol-ratelimit-limit') === '30', 'Plano free tem limite de 30 RPM');

// 1.2 Requisição com chave Starter (86.400 req/dia)
const resStarter = await worker.fetch(new Request('https://api.test/api/futebol/competicoes', {
  headers: { 'Authorization': 'Bearer fut_start_live_sample123' }
}), {});
assert(resStarter.headers.get('x-futebol-plan') === 'starter', 'Token fut_start_ resolve plano starter');
assert(resStarter.headers.get('x-futebol-ratelimit-limit') === '60', 'Plano starter tem 60 RPM');

// 1.3 Requisição com chave Pro via x-api-key
const resPro = await worker.fetch(new Request('https://api.test/api/futebol/competicoes', {
  headers: { 'x-api-key': 'fut_pro_live_sandbox456' }
}), {});
assert(resPro.headers.get('x-futebol-plan') === 'pro', 'Header x-api-key fut_pro_ resolve plano pro');
assert(resPro.headers.get('x-futebol-ratelimit-limit') === '300', 'Plano pro tem 300 RPM');

// 1.4 Requisição com chave Business
const resBiz = await worker.fetch(new Request('https://api.test/api/futebol/competicoes', {
  headers: { 'Authorization': 'Bearer fut_biz_prod_key789' }
}), {});
assert(resBiz.headers.get('x-futebol-plan') === 'business', 'Token fut_biz_ resolve plano business');
assert(resBiz.headers.get('x-futebol-ratelimit-limit') === '1200', 'Plano business tem 1200 RPM');

// 1.5 Requisição com chave Master Admin
const resMaster = await worker.fetch(new Request('https://api.test/api/futebol/competicoes', {
  headers: { 'Authorization': 'Bearer fut_master_key_bypass' }
}), {});
assert(resMaster.headers.get('x-futebol-plan') === 'master', 'Token fut_master_ resolve plano master');
assert(resMaster.headers.get('x-futebol-ratelimit-limit') === '3000', 'Plano master tem 3000 RPM');

// ─── 2. TESTE DE RATE LIMITING DINÂMICO & HTTP 429 ───
console.log('\n--- 2. Rate Limiting Dinâmico & Bloqueio HTTP 429 ---');

const testKey = 'fut_free_overflow_test_key';
let atingiu429 = false;
let retryAfterHeader = null;

for (let i = 0; i < 35; i++) {
  const r = await worker.fetch(new Request('https://api.test/api/futebol/competicoes', {
    headers: { 'Authorization': `Bearer ${testKey}` }
  }), {});
  if (r.status === 429) {
    atingiu429 = true;
    retryAfterHeader = r.headers.get('Retry-After');
    break;
  }
}
assert(atingiu429, 'Rate limiter bloqueia com HTTP 429 ao ultrapassar cota RPM do plano free');
assert(retryAfterHeader !== null, 'Header Retry-After retornado corretamente no HTTP 429');

// ─── 3. HEALTHCHECK & TELEMETRIA ANYCAST ───
console.log('\n--- 3. Healthcheck & Telemetria Anycast ---');

const resHealth = await worker.fetch(new Request('https://api.test/api/futebol/health'), {});
assert(resHealth.status === 200, 'Endpoint /api/futebol/health responde 200');
const dataHealth = await resHealth.json();
assert(dataHealth.ok === true, 'Health reporta status ok: true');
assert(dataHealth.servico.includes('Futebol Pro'), 'Nome do serviço validado no healthcheck');
assert(dataHealth.totalClubesCadastrados >= 20, 'Total de clubes cadastrados reportado');

// ─── 4. COMPETIÇÕES & TABELAS ───
console.log('\n--- 4. Competições, Tabelas e Exportações Multi-Formato ---');

// 4.1 Competições
const resComp = await worker.fetch(new Request('https://api.test/api/futebol/competicoes'), {});
const dataComp = await resComp.json();
assert(dataComp.ok === true, 'Competições retornam ok: true');
assert(dataComp.totalCompeticoes >= 8, 'Mínimo de 8 competições suportadas');

// 4.2 Tabela Brasileirão Série A
const resTabA = await worker.fetch(new Request('https://api.test/api/futebol/tabela/brasileirao-a'), {});
assert(resTabA.status === 200, 'Tabela Brasileirão Série A responde HTTP 200');
const dataTabA = await resTabA.json();
assert(dataTabA.tabela && dataTabA.tabela.length === 20, 'Tabela do Brasileirão possui exatamente 20 clubes');
assert(dataTabA.tabela[0].pos === 1, 'Primeiro colocado está na posição 1');
assert(dataTabA.tabela[0].pts > 0, 'Líder possui pontuação válida calculada');

// 4.3 Exportação CSV
const resCsv = await worker.fetch(new Request('https://api.test/api/futebol/tabela/brasileirao-a?formato=csv'), {});
assert(resCsv.headers.get('Content-Type').includes('text/csv'), 'Header text/csv retornado para formato=csv');
const textCsv = await resCsv.text();
assert(textCsv.startsWith('Posicao,Time,Sigla,Pontos'), 'Cabeçalho CSV validado corretamente');

// 4.4 Exportação XML
const resXml = await worker.fetch(new Request('https://api.test/api/futebol/tabela/brasileirao-a?formato=xml'), {});
assert(resXml.headers.get('Content-Type').includes('application/xml'), 'Header application/xml retornado para formato=xml');
const textXml = await resXml.text();
assert(textXml.includes('<?xml version="1.0"'), 'Documento XML válido retornado');

// 4.5 Campeonato Inexistente (404)
const resInvalido = await worker.fetch(new Request('https://api.test/api/futebol/tabela/campeonato-fantasma'), {});
assert(resInvalido.status === 404, 'Competição inexistente retorna 404 Not Found');

// ─── 5. CLUBES E ESTÁDIOS SOBERANOS ───
console.log('\n--- 5. Clubes, Estádios e Filtros ---');

// 5.1 Listagem de Clubes
const resClubes = await worker.fetch(new Request('https://api.test/api/futebol/clubes'), {});
const dataClubes = await resClubes.json();
assert(dataClubes.total >= 20, 'Mais de 20 clubes cadastrados');

// 5.2 Filtro por Estado (SP)
const resSp = await worker.fetch(new Request('https://api.test/api/futebol/clubes?estado=SP'), {});
const dataSp = await resSp.json();
assert(dataSp.clubes.every(c => c.estado === 'SP'), 'Todos os clubes filtrados pertencem a SP');

// 5.3 Detalhe do Flamengo
const resFla = await worker.fetch(new Request('https://api.test/api/futebol/clubes/flamengo'), {});
assert(resFla.status === 200, 'Consulta de clube /flamengo responde HTTP 200');
const dataFla = await resFla.json();
assert(dataFla.clube.nomeCurto === 'Flamengo', 'Nome do clube validado');
assert(dataFla.clube.estadio === 'Maracanã', 'Estádio do Flamengo é o Maracanã');
assert(dataFla.clube.forcaElo > 1800, 'Rating Elo do Flamengo calculado');

// 5.4 Estádios
const resEst = await worker.fetch(new Request('https://api.test/api/futebol/estadios'), {});
const dataEst = await resEst.json();
assert(dataEst.total >= 15, 'Mínimo de 15 estádios cadastrados');
assert(dataEst.estadios.some(e => e.slug === 'maracana'), 'Estádio Maracanã presente na lista');

// ─── 6. ARTILHARIA, CONFRONTO E CARD SVG ───
console.log('\n--- 6. Artilharia, Confronto Direto e Card Vetorial SVG ---');

// 6.1 Artilharia
const resArt = await worker.fetch(new Request('https://api.test/api/futebol/artilharia/brasileirao-a'), {});
const dataArt = await resArt.json();
assert(dataArt.ranking && dataArt.ranking.length > 0, 'Ranking de artilharia retornado');
assert(dataArt.ranking[0].gols >= 10, 'Artilheiro possui mais de 10 gols');

// 6.2 Confronto Direto (Simulação Elo)
const resConf = await worker.fetch(new Request('https://api.test/api/futebol/confronto/flamengo/palmeiras'), {});
assert(resConf.status === 200, 'Simulação de confronto responde HTTP 200');
const dataConf = await resConf.json();
assert(dataConf.analise.mandante.probabilidadeVitoria, 'Probabilidade de vitória do mandante calculada');
assert(dataConf.analise.empate.probabilidade, 'Probabilidade de empate calculada');
assert(dataConf.analise.visitante.probabilidadeVitoria, 'Probabilidade do visitante calculada');

// 6.3 Card SVG
const resCard = await worker.fetch(new Request('https://api.test/api/futebol/card/Flamengo/2/Palmeiras/1.svg'), {});
assert(resCard.status === 200, 'Card SVG responde HTTP 200');
assert(resCard.headers.get('Content-Type').includes('image/svg+xml'), 'Header image/svg+xml retornado');
const svgContent = await resCard.text();
assert(svgContent.includes('<svg') && svgContent.includes('FUTEBOL PRO ANYCAST'), 'SVG contém marca dágua e estrutura gráfica');

// 6.4 SDK Helper
const svgUrl = FutebolPro.getCardSvgUrl('Flamengo', 2, 'Palmeiras', 1);
assert(svgUrl.includes('Flamengo/2/Palmeiras/1.svg'), 'Helper do SDK gera URL de card SVG corretamente');

// ─── 7. TODOS OS JOGOS DO MUNDO (GLOBAL WORLD HUB) ───
console.log('\n--- 7. Hub Global: Todos os Jogos do Mundo ---');

// 7.1 Consulta global de partidas do dia
const resMundo = await worker.fetch(new Request('https://api.test/api/futebol/mundo'), {});
assert(resMundo.status === 200, 'Endpoint /api/futebol/mundo responde HTTP 200');
const dataMundo = await resMundo.json();
assert(dataMundo.ok === true, 'Mundo reporta ok: true');
assert(dataMundo.totalJogos > 0, 'Jogos do mundo retornam partidas ativas');
assert(dataMundo.escopo.includes('Global'), 'Escopo global validado');

// 7.2 Rota alias /api/futebol/jogos/mundo
const resAlias = await worker.fetch(new Request('https://api.test/api/futebol/jogos/mundo'), {});
assert(resAlias.status === 200, 'Rota alias /api/futebol/jogos/mundo responde 200');
const dataAlias = await resAlias.json();
assert(dataAlias.totalJogos > 0, 'Alias retorna jogos com sucesso');

// 7.3 Agrupamento por Liga
const resAgrupado = await worker.fetch(new Request('https://api.test/api/futebol/mundo?agrupadoPorLiga=true'), {});
const dataAgrupado = await resAgrupado.json();
assert(typeof dataAgrupado.jogos === 'object' && !Array.isArray(dataAgrupado.jogos), 'Parâmetro agrupadoPorLiga retorna dicionário de ligas');

// 7.4 Filtro por Status
const resStatus = await worker.fetch(new Request('https://api.test/api/futebol/mundo?status=encerrado'), {});
const dataStatus = await resStatus.json();
assert(dataStatus.jogos.every(j => j.status === 'encerrado'), 'Filtro status=encerrado respeitado');

// 7.5 Ao Vivo Global
const resAoVivoGlobal = await worker.fetch(new Request('https://api.test/api/futebol/aovivo'), {});
assert(resAoVivoGlobal.status === 200, 'Endpoint /api/futebol/aovivo responde HTTP 200');
const dataAoVivoGlobal = await resAoVivoGlobal.json();
assert(dataAoVivoGlobal.escopo.includes('Global') || dataAoVivoGlobal.ok === true, 'Ao vivo global validado');

// ─── 8. JOGOS DE HOJE, FUTUROS, ANTIGOS E JOGADORES ───
console.log('\n--- 8. Jogos de Hoje, Futuros, Antigos & Dados de Jogadores ---');

// 8.1 Jogos de Hoje
const resHoje = await worker.fetch(new Request('https://api.test/api/futebol/mundo/hoje'), {});
assert(resHoje.status === 200, 'Endpoint /api/futebol/mundo/hoje responde HTTP 200');
const dataHoje = await resHoje.json();
assert(dataHoje.totalJogos > 0, 'Jogos de hoje retornados com sucesso');

// 8.2 Jogos do Futuro / Próximas Rodadas
const resFuturo = await worker.fetch(new Request('https://api.test/api/futebol/mundo/futuro'), {});
assert(resFuturo.status === 200, 'Endpoint /api/futebol/mundo/futuro responde HTTP 200');
const dataFuturo = await resFuturo.json();
assert(dataFuturo.totalJogosFuturos > 0, 'Jogos futuros retornados com sucesso');
assert(dataFuturo.proximasRodadasDestaque.length > 0, 'Destaques do futuro encontrados no calendário');

// 8.3 Jogos Antigos e Históricos
const resAntigos = await worker.fetch(new Request('https://api.test/api/futebol/mundo/antigos'), {});
assert(resAntigos.status === 200, 'Endpoint /api/futebol/mundo/antigos responde HTTP 200');
const dataAntigos = await resAntigos.json();
assert(dataAntigos.totalHistoricosLendarios >= 5, 'Mínimo de 5 confrontos históricos lendários cadastrados');
assert(dataAntigos.jogosHistoricosLendarios[0].gols.length > 0, 'Gols históricos com minutos presentes');

// 8.4 Detalhes de Partida Antiga (hist_001 - Final Libertadores 2019)
const resPartidaHist = await worker.fetch(new Request('https://api.test/api/futebol/partida/hist_001'), {});
assert(resPartidaHist.status === 200, 'Endpoint /api/futebol/partida/hist_001 responde HTTP 200');
const dataPartidaHist = await resPartidaHist.json();
assert(dataPartidaHist.partida.mandante.nome === 'Flamengo', 'Mandante da final histórica é o Flamengo');
assert(dataPartidaHist.partida.gols.some(g => g.jogador.includes('Gabigol')), 'Gols históricos do Gabigol registrados');

// 8.5 Elenco de Jogadores do Clube (/clubes/flamengo/elenco)
const resElenco = await worker.fetch(new Request('https://api.test/api/futebol/clubes/flamengo/elenco'), {});
assert(resElenco.status === 200, 'Endpoint /api/futebol/clubes/flamengo/elenco responde HTTP 200');
const dataElenco = await resElenco.json();
assert(dataElenco.totalJogadores > 0, 'Elenco do clube possui jogadores');
assert(dataElenco.elenco[0].nome, 'Nome de jogador do elenco validado');

// 8.6 Catálogo de Jogadores
const resJogadores = await worker.fetch(new Request('https://api.test/api/futebol/jogadores?busca=Pedro'), {});
assert(resJogadores.status === 200, 'Endpoint /api/futebol/jogadores responde HTTP 200');
const dataJogadores = await resJogadores.json();
assert(dataJogadores.jogadores.some(j => j.nome === 'Pedro'), 'Jogador Pedro encontrado na busca');

// 8.7 Perfil Específico de Jogador
const resPed = await worker.fetch(new Request('https://api.test/api/futebol/jogadores/pedro-9'), {});
assert(resPed.status === 200, 'Endpoint /api/futebol/jogadores/pedro-9 responde HTTP 200');
const dataPed = await resPed.json();
assert(dataPed.jogador.clube === 'Flamengo', 'Clube do Pedro validado');
assert(dataPed.jogador.posicao === 'Atacante', 'Posição do jogador validada');

// ─── 9. CLÁSSICOS H2H, COMPARADOR, RADAR SVG E NOTÍCIAS ───
console.log('\n--- 9. Clássicos H2H, Comparador, Radar SVG & Notícias de Jogos ---');

// 9.1 Clássicos Mundiais H2H
const resClassicos = await worker.fetch(new Request('https://api.test/api/futebol/classicos'), {});
assert(resClassicos.status === 200, 'Endpoint /api/futebol/classicos responde HTTP 200');
const dataClassicos = await resClassicos.json();
assert(dataClassicos.totalClassicos >= 5, 'Mínimo de 5 grandes clássicos mundiais cadastrados');

// 9.2 Clássico Específico (Flamengo vs Palmeiras)
const resClasEsp = await worker.fetch(new Request('https://api.test/api/futebol/classicos/flamengo-palmeiras'), {});
assert(resClasEsp.status === 200, 'Endpoint /classicos/flamengo-palmeiras responde 200');
const dataClasEsp = await resClasEsp.json();
assert(dataClasEsp.dados.totalJogos > 100, 'Total de jogos do confronto histórico retornado');
assert(dataClasEsp.dados.ultimosConfrontos.length > 0, 'Últimos confrontos diretos retornados');

// 9.3 Comparador de Jogadores
const resCompJg = await worker.fetch(new Request('https://api.test/api/futebol/jogadores/comparar/pedro-9/veiga-23'), {});
assert(resCompJg.status === 200, 'Endpoint /jogadores/comparar/pedro-9/veiga-23 responde 200');
const dataCompJg = await resCompJg.json();
assert(dataCompJg.comparacao.jogador1.nome === 'Pedro', 'Jogador 1 é Pedro');
assert(dataCompJg.comparacao.jogador2.nome.includes('Veiga'), 'Jogador 2 é Raphael Veiga');
assert(dataCompJg.comparacao.vereditoEstatistico, 'Veredito estatístico comparativo gerado');

// 9.4 Radar Vetorial SVG de Atributos do Atleta
const resRadar = await worker.fetch(new Request('https://api.test/api/futebol/jogadores/pedro-9/radar.svg'), {});
assert(resRadar.status === 200, 'Endpoint /radar.svg responde HTTP 200');
assert(resRadar.headers.get('Content-Type').includes('image/svg+xml'), 'Header image/svg+xml retornado');
const svgRadar = await resRadar.text();
assert(svgRadar.includes('<polygon') && svgRadar.includes('FINALIZAÇÃO'), 'Polígono radar com habilidades gerado no SVG');

// 9.4.1 Motor de Análise Estatística e Tática do Atleta
const resAnalise = await worker.fetch(new Request('https://api.test/api/futebol/jogadores/pedro-9/analise', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resAnalise.status === 200, 'Endpoint /jogadores/:id/analise responde 200');
const dataAnalise = await resAnalise.json();
assert(dataAnalise.analise.motorAnalitico.ratingGeral >= 8.5, 'Rating geral do atleta calculado pelo motor analítico');
assert(dataAnalise.analise.motorAnalitico.arquetipoTatico.includes('Centroavante'), 'Arquétipo tático identificado');

// 9.4.2 Dashboard Gráfico SVG Completo do Atleta
const resDashSvg = await worker.fetch(new Request('https://api.test/api/futebol/jogadores/pedro-9/dashboard.svg', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resDashSvg.status === 200, 'Endpoint /dashboard.svg responde 200');
assert(resDashSvg.headers.get('Content-Type').includes('image/svg+xml'), 'Header image/svg+xml retornado');
const textDash = await resDashSvg.text();
assert(textDash.includes('EVOLUÇÃO HISTÓRICA DE GOLS'), 'Dashboard SVG contém gráfico de evolução histórica');

// 9.5 Estatísticas Oficiais Reais da Partida
const resStats = await worker.fetch(new Request('https://api.test/api/futebol/partida/hist_001/stats', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resStats.status === 200, 'Endpoint /partida/:id/stats responde HTTP 200');
const dataStats = await resStats.json();
assert(dataStats.ok === true, 'Stats oficiais reportam ok: true');

// 9.6 Gráfico Comparativo SVG da Partida em Tempo Real
const resGraficoPartida = await worker.fetch(new Request('https://api.test/api/futebol/partida/hist_001/grafico.svg', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resGraficoPartida.status === 200, 'Endpoint /partida/:id/grafico.svg responde HTTP 200');
assert(resGraficoPartida.headers.get('Content-Type').includes('image/svg+xml'), 'Header image/svg+xml retornado para gráfico da partida');
const textGrafico = await resGraficoPartida.text();
assert(textGrafico.includes('<svg') && textGrafico.includes('ANÁLISE ESTATÍSTICA OFICIAL'), 'Gráfico SVG contém barras e estatísticas reais');

// ─── 10. REPOSITÓRIOS GITHUB OFICIAIS & DADOS ABERTOS ───
console.log('\n--- 10. Repositórios GitHub Oficiais & Dados Abertos ---');

// 10.1 Fontes GitHub
const resGhFontes = await worker.fetch(new Request('https://api.test/api/futebol/github/fontes', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resGhFontes.status === 200, 'Endpoint /api/futebol/github/fontes responde 200');
const dataGhFontes = await resGhFontes.json();
assert(dataGhFontes.repositoriosOficiais.length >= 4, 'Mínimo de 4 repositórios GitHub mapeados');

// 10.2 Brasileirão Histórico do GitHub
const resGhBra = await worker.fetch(new Request('https://api.test/api/futebol/github/brasileirao-historico', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resGhBra.status === 200, 'Endpoint /api/futebol/github/brasileirao-historico responde 200');
const dataGhBra = await resGhBra.json();
assert(dataGhBra.totalPartidasEncontradas > 0, 'Partidas históricas do GitHub retornadas com sucesso');


// ─── 11. COMPARADOR DE CARREIRAS & MELHOR DA TEMPORADA ───
console.log('\n--- 11. Comparador de Carreiras Históricas & Melhor da Temporada ---');

// 11.1 Comparação Completa de Carreira (Messi vs Cristiano Ronaldo)
const resCarreiras = await worker.fetch(new Request('https://api.test/api/futebol/carreiras/comparar/messi-10/cr7-7', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resCarreiras.status === 200, 'Endpoint /carreiras/comparar responde 200');
const dataCarreiras = await resCarreiras.json();
assert(dataCarreiras.comparacao.atleta1.golsCarreira > 800, 'Gols de carreira do Messi validados (>800)');
assert(dataCarreiras.comparacao.atleta2.golsCarreira > 850, 'Gols de carreira do CR7 validados (>850)');
assert(dataCarreiras.comparacao.confrontosDiretosEmCampo.totalConfrontos === 36, 'Total de 36 confrontos diretos Messi vs CR7 confirmado');

// 11.2 Gráfico SVG Bi-Direcional de Carreiras
const resCarreirasSvg = await worker.fetch(new Request('https://api.test/api/futebol/carreiras/comparar/messi-10/cr7-7.svg', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resCarreirasSvg.status === 200, 'Endpoint /carreiras/comparar/...svg responde 200');
assert(resCarreirasSvg.headers.get('Content-Type').includes('image/svg+xml'), 'Header image/svg+xml retornado para comparação de carreiras');
const textCarreirasSvg = await resCarreirasSvg.text();
assert(textCarreirasSvg.includes('COMPARAÇÃO HISTÓRICA DE CARREIRAS'), 'Gráfico SVG de carreiras gerado com sucesso');

// 11.3 Corrida Melhor Jogador da Temporada (Ballon d''Or & The Best)
const resPremios = await worker.fetch(new Request('https://api.test/api/futebol/premios/melhor-do-ano', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resPremios.status === 200, 'Endpoint /premios/melhor-do-ano responde 200');
const dataPremios = await resPremios.json();
assert(dataPremios.rankingMelhoresDaTemporada.length >= 5, 'Mínimo de 5 postulantes na corrida de melhor da temporada');
assert(dataPremios.selecaoIdealDaTemporada.titulares.length === 11, 'Seleção ideal da temporada possui exatamente 11 titulares');


// ─── 12. LANCE A LANCE MINUTO A MINUTO, FALTAS, CARTÕES E POSIÇÃO DA BOLA ───
console.log('\n--- 12. Lance a Lance Minuto a Minuto, Faltas, Cartões & Posição da Bola ---');

// 12.1 Lance a Lance Minuto a Minuto com Coordenadas
const resLances = await worker.fetch(new Request('https://api.test/api/futebol/partida/hist_001/lance-a-lance', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resLances.status === 200, 'Endpoint /partida/:id/lance-a-lance responde 200');
const dataLances = await resLances.json();
assert(dataLances.ok === true, 'Lance a lance reporta ok: true');

// 12.2 Posição da Bola e Zona Tática em Tempo Real
const resBola = await worker.fetch(new Request('https://api.test/api/futebol/partida/hist_001/posicao-bola', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resBola.status === 200, 'Endpoint /partida/:id/posicao-bola responde 200');
const dataBola = await resBola.json();
assert(dataBola.posicaoAtualBola !== undefined, 'Posição da bola calculada e retornada');

// 12.3 Campo 2D SVG Espacial com Coordenadas de Lances
const resCampoSvg = await worker.fetch(new Request('https://api.test/api/futebol/partida/hist_001/campo.svg', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resCampoSvg.status === 200, 'Endpoint /partida/:id/campo.svg responde 200');
assert(resCampoSvg.headers.get('Content-Type').includes('image/svg+xml'), 'Header image/svg+xml retornado para campo 2d');
const textCampoSvg = await resCampoSvg.text();
assert(textCampoSvg.includes('RASTREAMENTO ESPACIAL DE CAMPO'), 'Campo 2D SVG gerado com sucesso');


// ─── 13. EXPECTED GOALS (xG), SHOT MAP, HEATMAP, ODDS & OMNISEARCH ───
console.log('\n--- 13. Expected Goals (xG), Shot Map, Heatmap, Odds Poisson & Omnisearch ---');

// 13.1 xG da Partida
const resXg = await worker.fetch(new Request('https://api.test/api/futebol/partida/hist_001/xg', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resXg.status === 200, 'Endpoint /partida/:id/xg responde 200');
const dataXg = await resXg.json();
assert(dataXg.analiseXg.xgTotalMandante >= 0, 'xG acumulado do mandante calculado');

// 13.2 Shot Map SVG
const resShotMap = await worker.fetch(new Request('https://api.test/api/futebol/partida/hist_001/shotmap.svg', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resShotMap.status === 200, 'Endpoint /partida/:id/shotmap.svg responde 200');
assert(resShotMap.headers.get('Content-Type').includes('image/svg+xml'), 'Header image/svg+xml retornado para shot map');
const textShotMap = await resShotMap.text();
assert(textShotMap.includes('MAPA DE FINALIZAÇÕES E EXPECTED GOALS'), 'SVG do shot map gerado');

// 13.3 Heatmap Tático SVG
const resHeatmap = await worker.fetch(new Request('https://api.test/api/futebol/partida/hist_001/heatmap.svg', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resHeatmap.status === 200, 'Endpoint /partida/:id/heatmap.svg responde 200');
assert(resHeatmap.headers.get('Content-Type').includes('image/svg+xml'), 'Header image/svg+xml retornado para heatmap');

// 13.4 Mercados de Odds Justas (Poisson)
const resOdds = await worker.fetch(new Request('https://api.test/api/futebol/partida/hist_001/odds', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resOdds.status === 200, 'Endpoint /partida/:id/odds responde 200');
const dataOdds = await resOdds.json();
assert(dataOdds.mercadosDeOddsPoisson.mercado1X2.mandante.oddJusta > 1, 'Odd justa 1X2 calculada');

// 13.5 Projeções da Tabela (Título, G4 e Z4)
const resProj = await worker.fetch(new Request('https://api.test/api/futebol/tabela/brasileirao-a/projecoes', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resProj.status === 200, 'Endpoint /tabela/:camp/projecoes responde 200');
const dataProj = await resProj.json();
assert(dataProj.projecoes.length === 20, 'Projeção calculada para os 20 clubes da Série A');
assert(dataProj.projecoes[0].probabilidadeTitulo.includes('%'), 'Probabilidade de título formatada');

// 13.6 Busca Global Omnisearch
const resBusca = await worker.fetch(new Request('https://api.test/api/futebol/busca?q=flamengo', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resBusca.status === 200, 'Endpoint /busca?q=termo responde 200');
const dataBusca = await resBusca.json();
assert(dataBusca.totalResultados > 0, 'Resultados unificados encontrados no omnisearch');
assert(dataBusca.resultados.clubes.length > 0, 'Clube encontrado na busca global');


// ─── 14. FANTASY GAME, SCOUTING SUB-21, WEBHOOKS & WIDGET.JS ───
console.log('\n--- 14. Fantasy Game, Scouting Sub-21, Webhooks & Widget.js ---');

// 14.1 Servir widget.js client-side
const resWidget = await worker.fetch(new Request('https://api.test/widget.js'), {});
assert(resWidget.status === 200, 'Endpoint /widget.js responde 200');
assert(resWidget.headers.get('Content-Type').includes('application/javascript'), 'Header application/javascript retornado');
const textWidget = await resWidget.text();
assert(textWidget.includes('futebol-pro-widget'), 'Código client-side do widget validado');

// 14.2 Fantasy Game da Partida
const resFantasy = await worker.fetch(new Request('https://api.test/api/futebol/partida/hist_001/fantasy', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resFantasy.status === 200, 'Endpoint /partida/:id/fantasy responde 200');
const dataFantasy = await resFantasy.json();
assert(dataFantasy.pontuacoesAtletas.length > 0, 'Pontuação de atletas calculada na partida');

// 14.3 Ranking da Rodada Fantasy Game
const resRankFant = await worker.fetch(new Request('https://api.test/api/futebol/fantasy/ranking-rodada', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resRankFant.status === 200, 'Endpoint /fantasy/ranking-rodada responde 200');
const dataRankFant = await resRankFant.json();
assert(dataRankFant.rankingTopPontuadores.length >= 5, 'Top 5 pontuadores da rodada retornados');

// 14.4 Radar de Talentos Sub-21
const resTalentos = await worker.fetch(new Request('https://api.test/api/futebol/scouting/talentos', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resTalentos.status === 200, 'Endpoint /scouting/talentos responde 200');
const dataTalentos = await resTalentos.json();
assert(dataTalentos.totalTalentosMonitorados >= 3, 'Talentos Sub-21 retornados');

// 14.5 Relatório e Projeção de Talento (Estêvão)
const resEstevao = await worker.fetch(new Request('https://api.test/api/futebol/scouting/estevao-41', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resEstevao.status === 200, 'Endpoint /scouting/:id responde 200');
const dataEstevao = await resEstevao.json();
assert(dataEstevao.relatorioScouting.comparacaoLendaMesmaIdade.lenda.includes('Neymar'), 'Comparação etária com Neymar validada');

// 14.6 Cadastro e Listagem de Webhook
const resCadWh = await worker.fetch(new Request('https://api.test/api/futebol/webhooks/cadastrar', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer fut_master_suite', 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://meuapp.com/webhook', eventos: ['gol', 'cartao_vermelho'] })
}), {});
assert(resCadWh.status === 200, 'Endpoint POST /webhooks/cadastrar responde 200');
const dataCadWh = await resCadWh.json();
assert(dataCadWh.webhook.id.startsWith('wh_'), 'Webhook ID gerado com sucesso');
const whId = dataCadWh.webhook.id;

const resListWh = await worker.fetch(new Request('https://api.test/api/futebol/webhooks/listar', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resListWh.status === 200, 'Endpoint GET /webhooks/listar responde 200');
const dataListWh = await resListWh.json();
assert(dataListWh.totalWebhooksAtivos >= 1, 'Webhook cadastrado listado');

// 14.7 Teste e Remoção de Webhook
const resTestWh = await worker.fetch(new Request('https://api.test/api/futebol/webhooks/testar', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resTestWh.status === 200, 'Endpoint POST /webhooks/testar responde 200');

const resDelWh = await worker.fetch(new Request('https://api.test/api/futebol/webhooks/' + whId, {
  method: 'DELETE',
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resDelWh.status === 200, 'Endpoint DELETE /webhooks/:id responde 200');


// ─── 15. CAMISAS/MANTOS SVG, TÉCNICOS, BRASÕES E HISTÓRICO DE CLUBES ───
console.log('\n--- 15. Camisas/Mantos SVG, Técnicos, Brasões & Histórico de Clubes ---');

// 15.1 Camisa / Manto do Clube SVG
const resCamisaClube = await worker.fetch(new Request('https://api.test/api/futebol/clubes/flamengo/camisa-titular.svg?numero=9&nome=PEDRO', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resCamisaClube.status === 200, 'Endpoint /clubes/:slug/camisa-titular.svg responde 200');
assert(resCamisaClube.headers.get('Content-Type').includes('image/svg+xml'), 'Header image/svg+xml retornado para camisa');
const textCamisa = await resCamisaClube.text();
assert(textCamisa.includes('PEDRO') && textCamisa.includes('Manto Oficial'), 'Camisa SVG contém nome e detalhes oficiais');

// 15.2 Técnicos Atuais e Históricos do Clube
const resTec = await worker.fetch(new Request('https://api.test/api/futebol/clubes/flamengo/tecnicos', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resTec.status === 200, 'Endpoint /clubes/:slug/tecnicos responde 200');
const dataTec = await resTec.json();
assert(dataTec.tecnicoAtual.nome.includes('Filipe'), 'Técnico atual do clube identificado');
assert(dataTec.tecnicosHistoricosLendarios.length >= 2, 'Técnicos históricos lendários listados');

// 15.3 Brasões e Logos Oficiais
const resBrasao = await worker.fetch(new Request('https://api.test/api/futebol/clubes/flamengo/brasao', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resBrasao.status === 200, 'Endpoint /clubes/:slug/brasao responde 200');
const dataBrasao = await resBrasao.json();
assert(dataBrasao.brasoes.oficialPng.includes('819.png'), 'Brasão PNG oficial retornado');

// 15.4 Avatar SVG do Jogador
const resAvSvg = await worker.fetch(new Request('https://api.test/api/futebol/jogadores/pedro-9/avatar.svg', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resAvSvg.status === 200, 'Endpoint /jogadores/:id/avatar.svg responde 200');
assert(resAvSvg.headers.get('Content-Type').includes('image/svg+xml'), 'Header image/svg+xml retornado para avatar');

// 15.5 Histórico Cronológico de Clubes por Ano do Atleta
const resHistClubes = await worker.fetch(new Request('https://api.test/api/futebol/jogadores/pedro-9/historico', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resHistClubes.status === 200, 'Endpoint /jogadores/:id/historico responde 200');
const dataHistClubes = await resHistClubes.json();
assert(dataHistClubes.historicoClubesAnos.length >= 2, 'Histórico de clubes por ano do atleta retornado');


// ─── 16. ATUALIZAÇÃO AUTOMÁTICA CLOUDFLARE SCHEDULED CRON (24/7) ───
console.log('\n--- 16. Atualização Automática Cloudflare Scheduled Cron (24/7) ---');

let scheduledExecuted = false;
try {
  await worker.scheduled({ cron: '*/5 * * * *', type: 'scheduled' }, {}, { waitUntil: (p) => p });
  scheduledExecuted = true;
} catch (e) {
  console.error('Scheduled cron error:', e);
}
assert(scheduledExecuted === true, 'Gatilho automático Cloudflare scheduled executado com sucesso');

// 16.2 Sincronização Manual / On-Demand e Persistência Imediata
const resSync = await worker.fetch(new Request('https://api.test/api/futebol/sync', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resSync.status === 200, 'Endpoint POST /sync responde 200');
const dataSync = await resSync.json();
assert(dataSync.ok === true, 'Sincronização reporta ok: true');
assert(dataSync.armazenamentoPersistente !== undefined, 'Armazenamento persistente reportado');


// ─── 17. MATA-MATA BRACKETS, ÁRBITROS FIFA, HANDICAP & CLÁSSICO GAUGE ───
console.log('\n--- 17. Mata-Mata Brackets, Árbitros FIFA, Handicap & Clássico Gauge ---');

// 17.1 Torneio Mata-Mata JSON (Libertadores)
const resMata = await worker.fetch(new Request('https://api.test/api/futebol/matamata/libertadores', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resMata.status === 200, 'Endpoint /matamata/:torneio responde 200');
const dataMata = await resMata.json();
assert(dataMata.chaveamento.semifinais.length === 2, 'Semifinais do mata-mata retornadas');

// 17.2 Chaveamento Mata-Mata SVG
const resChaveSvg = await worker.fetch(new Request('https://api.test/api/futebol/matamata/libertadores/chaveamento.svg', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resChaveSvg.status === 200, 'Endpoint /chaveamento.svg responde 200');
assert(resChaveSvg.headers.get('Content-Type').includes('image/svg+xml'), 'Header image/svg+xml retornado para chaveamento');
const textChave = await resChaveSvg.text();
assert(textChave.includes('CHAVEAMENTO OFICIAL MATA-MATA'), 'Chaveamento SVG gerado');

// 17.3 Catálogo de Árbitros Oficiais
const resArb = await worker.fetch(new Request('https://api.test/api/futebol/arbitros', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resArb.status === 200, 'Endpoint /arbitros responde 200');
const dataArb = await resArb.json();
assert(dataArb.totalArbitros >= 4, 'Mínimo de 4 árbitros oficiais FIFA cadastrados');

// 17.4 Árbitro Específico (Wilton Sampaio)
const resWilton = await worker.fetch(new Request('https://api.test/api/futebol/arbitros/wilton-sampaio', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resWilton.status === 200, 'Endpoint /arbitros/:id responde 200');
const dataWilton = await resWilton.json();
assert(dataWilton.arbitro.mediaFaltasPorJogo > 20, 'Média de faltas do árbitro validada');

// 17.5 Linhas de Handicap Asiático
const resHandicap = await worker.fetch(new Request('https://api.test/api/futebol/partida/hist_001/handicap', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resHandicap.status === 200, 'Endpoint /partida/:id/handicap responde 200');
const dataHandicap = await resHandicap.json();
assert(dataHandicap.handicapAsiatico.linhasHandicapAsiatico.length >= 4, 'Linhas de handicap asiático calculadas');

// 17.6 Clássico Gauge SVG
const resGauge = await worker.fetch(new Request('https://api.test/api/futebol/classicos/flamengo-palmeiras/gauge.svg', {
  headers: { 'Authorization': 'Bearer fut_master_suite' }
}), {});
assert(resGauge.status === 200, 'Endpoint /classicos/:slug/gauge.svg responde 200');
assert(resGauge.headers.get('Content-Type').includes('image/svg+xml'), 'Header image/svg+xml retornado para gauge');
const textGauge = await resGauge.text();
assert(textGauge.includes('CONFRONTOS HISTÓRICOS OFICIAIS'), 'Gauge SVG do clássico gerado');

console.log(`\n🎉 Todos os ${passCount} testes foram executados e APROVADOS com sucesso! Zero falhas (${failCount}).\n`);
