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

console.log(`\n🎉 Todos os ${passCount} testes foram executados e APROVADOS com sucesso! Zero falhas (${failCount}).\n`);
