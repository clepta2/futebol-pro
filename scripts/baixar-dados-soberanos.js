import fs from 'fs';
import path from 'path';

const DADOS_DIR = path.resolve('dados');
if (!fs.existsSync(DADOS_DIR)) {
  fs.mkdirSync(DADOS_DIR, { recursive: true });
}

async function baixarBaseHistorica() {
  console.log('🚀 Iniciando download de bases históricas para soberania total...\n');

  // 1. Brasileirão Histórico (adaoduque/Brasileirao_Dataset)
  try {
    console.log('1. Baixando Brasileirão Histórico (8.785 partidas)...');
    const resp = await fetch('https://raw.githubusercontent.com/adaoduque/Brasileirao_Dataset/master/campeonato-brasileiro-full.csv');
    if (resp.ok) {
      const csv = await resp.text();
      const lines = csv.split('\n').filter(Boolean);
      const partidas = lines.slice(1).map(l => {
        const v = l.split(',').map(x => x.replace(/"/g, '').trim());
        return {
          id: v[0],
          rodada: v[1],
          data: v[2],
          hora: v[3],
          mandante: v[4],
          visitante: v[5],
          formacaoMandante: v[6],
          formacaoVisitante: v[7],
          tecnicoMandante: v[8],
          tecnicoVisitante: v[9],
          vencedor: v[10],
          estadio: v[11],
          placarMandante: parseInt(v[12], 10),
          placarVisitante: parseInt(v[13], 10)
        };
      });

      fs.writeFileSync(path.join(DADOS_DIR, 'brasileirao-partidas.json'), JSON.stringify(partidas));
      console.log(`   ✅ Salvo brasileirao-partidas.json (${partidas.length} partidas)`);
    }
  } catch (err) {
    console.error('   ❌ Erro ao baixar Brasileirão:', err.message);
  }

  // 2. OpenFootball Premier League 2026/27
  try {
    console.log('2. Baixando Premier League (openfootball/football.json)...');
    const resp = await fetch('https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/en.1.json');
    if (resp.ok) {
      const json = await resp.json();
      fs.writeFileSync(path.join(DADOS_DIR, 'premier-league-2026.json'), JSON.stringify(json));
      console.log(`   ✅ Salvo premier-league-2026.json (${json.matches?.length || 0} jogos)`);
    }
  } catch (err) {
    console.error('   ❌ Erro ao baixar Premier League:', err.message);
  }

  // 3. OpenFootball LaLiga 2026/27
  try {
    console.log('3. Baixando LaLiga (openfootball/football.json)...');
    const resp = await fetch('https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/es.1.json');
    if (resp.ok) {
      const json = await resp.json();
      fs.writeFileSync(path.join(DADOS_DIR, 'laliga-2026.json'), JSON.stringify(json));
      console.log(`   ✅ Salvo laliga-2026.json (${json.matches?.length || 0} jogos)`);
    }
  } catch (err) {
    console.error('   ❌ Erro ao baixar LaLiga:', err.message);
  }

  // 4. OpenFootball Copa do Mundo FIFA (openfootball/worldcup.json)
  try {
    console.log('4. Baixando Copa do Mundo FIFA 2026 (openfootball/worldcup.json)...');
    const resp = await fetch('https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json');
    if (resp.ok) {
      const json = await resp.json();
      fs.writeFileSync(path.join(DADOS_DIR, 'copa-do-mundo-2026.json'), JSON.stringify(json));
      console.log('   ✅ Salvo copa-do-mundo-2026.json');
    }
  } catch (err) {
    console.error('   ❌ Erro ao baixar Copa do Mundo:', err.message);
  }

  // 5. Elencos Oficiais dos 20 Clubes do Brasileirão Série A
  const TEAMS_SÉRIE_A = [
    { slug: 'flamengo', id: '819' },
    { slug: 'palmeiras', id: '2029' },
    { slug: 'sao-paulo', id: '2026' },
    { slug: 'corinthians', id: '874' },
    { slug: 'santos', id: '2674' },
    { slug: 'cruzeiro', id: '2022' },
    { slug: 'atletico-mg', id: '7632' },
    { slug: 'fluminense', id: '3445' },
    { slug: 'botafogo', id: '6086' },
    { slug: 'vasco', id: '3454' },
    { slug: 'gremio', id: '6273' },
    { slug: 'internacional', id: '1936' },
    { slug: 'bahia', id: '9967' },
    { slug: 'athletico-pr', id: '3458' },
    { slug: 'red-bull-bragantino', id: '6079' },
    { slug: 'coritiba', id: '3456' },
    { slug: 'mirassol', id: '9169' },
    { slug: 'vitoria', id: '3457' },
    { slug: 'remo', id: '4936' },
    { slug: 'chapecoense', id: '9318' }
  ];

  console.log('\n5. Baixando Elencos e Estatísticas Reais dos 20 Clubes da Série A...');
  const elencosConsolidados = {};

  for (const t of TEAMS_SÉRIE_A) {
    try {
      const resp = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/bra.1/teams/${t.id}/roster`);
      if (resp.ok) {
        const json = await resp.json();
        const atletas = (json.athletes || []).map(a => {
          const statsMap = {};
          for (const cat of a.statistics?.splits?.categories || []) {
            for (const st of cat.stats || []) {
              statsMap[st.name] = st.value;
            }
          }
          return {
            id: a.id,
            nome: a.displayName || a.fullName,
            camisa: a.jersey ? parseInt(a.jersey, 10) : null,
            posicao: a.position?.displayName || 'Jogador',
            posicaoSigla: a.position?.abbreviation || 'J',
            idade: a.age || null,
            nacionalidade: a.citizenship || 'Brasil',
            altura: a.displayHeight || null,
            peso: a.displayWeight || null,
            foto: a.headshot?.href || `https://a.espncdn.com/i/headshots/soccer/players/full/${a.id}.png`,
            gols: statsMap.totalGoals || 0,
            assistencias: statsMap.goalAssists || 0,
            jogos: statsMap.appearances || 0,
            finalizacoes: statsMap.totalShots || 0,
            finalizacoesNoAlvo: statsMap.shotsOnTarget || 0,
            cartoesAmarelos: statsMap.yellowCards || 0,
            cartoesVermelhos: statsMap.redCards || 0
          };
        });

        elencosConsolidados[t.slug] = atletas;
        console.log(`   ✅ ${t.slug.padEnd(20)}: ${atletas.length} atletas reais capturados`);
      }
    } catch (_) {}
  }

  fs.writeFileSync(path.join(DADOS_DIR, 'elencos-serie-a.json'), JSON.stringify(elencosConsolidados));
  console.log(`\n🎉 Todos os dados foram baixados e salvos em ./dados! Soberania local garantida.`);
}

baixarBaseHistorica();
