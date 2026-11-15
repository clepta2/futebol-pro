/**
 * dados-futebol.js
 * Base Soberana de Dados Esportivos para Futebol Pro API
 * 
 * Clubes Oficiais, Estádios, Competições, Tabelas Consolidadas,
 * Artilharia, Confrontos Históricos e Renderizadores Vetoriais SVG.
 * 
 * @license MIT
 * @see https://github.com/clepta2/futebol-pro
 */

export const COMPETICOES = {
  'brasileirao-a': {
    slug: 'brasileirao-a',
    codigoEspn: 'bra.1',
    nome: 'Brasileirão Série A',
    temporada: '2026',
    pais: 'Brasil',
    tipo: 'pontos_corridos',
    totalClubes: 20,
    rodadasTotais: 38,
    zonas: {
      libertadoresG4: [1, 2, 3, 4],
      preLibertadores: [5, 6],
      sulAmericana: [7, 8, 9, 10, 11, 12],
      rebaixamentoZ4: [17, 18, 19, 20]
    }
  },
  'brasileirao-b': {
    slug: 'brasileirao-b',
    codigoEspn: 'bra.2',
    nome: 'Brasileirão Série B',
    temporada: '2026',
    pais: 'Brasil',
    tipo: 'pontos_corridos',
    totalClubes: 20,
    rodadasTotais: 38,
    zonas: {
      acessoG4: [1, 2, 3, 4],
      rebaixamentoZ4: [17, 18, 19, 20]
    }
  },
  'copa-do-brasil': {
    slug: 'copa-do-brasil',
    codigoEspn: 'bra.copa_do_brasil',
    nome: 'Copa do Brasil',
    temporada: '2026',
    pais: 'Brasil',
    tipo: 'mata_mata',
    faseAtual: 'Final'
  },
  'libertadores': {
    slug: 'libertadores',
    codigoEspn: 'conmebol.libertadores',
    nome: 'CONMEBOL Libertadores',
    temporada: '2026',
    pais: 'América do Sul',
    tipo: 'misto',
    faseAtual: 'Fase Final'
  },
  'sul-americana': {
    slug: 'sul-americana',
    codigoEspn: 'conmebol.sudamericana',
    nome: 'CONMEBOL Sul-Americana',
    temporada: '2026',
    pais: 'América do Sul',
    tipo: 'misto'
  },
  'champions-league': {
    slug: 'champions-league',
    codigoEspn: 'uefa.champions',
    nome: 'UEFA Champions League',
    temporada: '2026-2027',
    pais: 'Europa',
    tipo: 'liga_unica',
    zonas: {
      oitavasDiretas: [1, 2, 3, 4, 5, 6, 7, 8],
      playoffs: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
    }
  },
  'premier-league': {
    slug: 'premier-league',
    codigoEspn: 'eng.1',
    nome: 'Premier League',
    temporada: '2026-2027',
    pais: 'Inglaterra',
    tipo: 'pontos_corridos',
    totalClubes: 20,
    rodadasTotais: 38
  },
  'la-liga': {
    slug: 'la-liga',
    codigoEspn: 'esp.1',
    nome: 'LaLiga EA Sports',
    temporada: '2026-2027',
    pais: 'Espanha',
    tipo: 'pontos_corridos',
    totalClubes: 20,
    rodadasTotais: 38
  },
  'serie-a-italia': {
    slug: 'serie-a-italia',
    codigoEspn: 'ita.1',
    nome: 'Serie A Enilive',
    temporada: '2026-2027',
    pais: 'Itália',
    tipo: 'pontos_corridos',
    totalClubes: 20
  },
  'bundesliga': {
    slug: 'bundesliga',
    codigoEspn: 'ger.1',
    nome: 'Bundesliga',
    temporada: '2026-2027',
    pais: 'Alemanha',
    tipo: 'pontos_corridos',
    totalClubes: 18
  },
  'ligue-1': {
    slug: 'ligue-1',
    codigoEspn: 'fra.1',
    nome: 'Ligue 1 McDonald\'s',
    temporada: '2026-2027',
    pais: 'França',
    tipo: 'pontos_corridos',
    totalClubes: 18
  },
  'eredivisie': {
    slug: 'eredivisie',
    codigoEspn: 'ned.1',
    nome: 'Eredivisie',
    temporada: '2026-2027',
    pais: 'Holanda',
    tipo: 'pontos_corridos',
    totalClubes: 18
  },
  'primeira-liga': {
    slug: 'primeira-liga',
    codigoEspn: 'por.1',
    nome: 'Liga Portugal Betclic',
    temporada: '2026-2027',
    pais: 'Portugal',
    tipo: 'pontos_corridos',
    totalClubes: 18
  },
  'mls': {
    slug: 'mls',
    codigoEspn: 'usa.1',
    nome: 'Major League Soccer (MLS)',
    temporada: '2026',
    pais: 'Estados Unidos',
    tipo: 'misto',
    totalClubes: 29
  },
  'saudi-league': {
    slug: 'saudi-league',
    codigoEspn: 'sau.1',
    nome: 'Roshn Saudi League',
    temporada: '2026-2027',
    pais: 'Arábia Saudita',
    tipo: 'pontos_corridos',
    totalClubes: 18
  },
  'liga-argentina': {
    slug: 'liga-argentina',
    codigoEspn: 'arg.1',
    nome: 'Liga Profesional de Fútbol',
    temporada: '2026',
    pais: 'Argentina',
    tipo: 'pontos_corridos',
    totalClubes: 28
  },
  'championship': {
    slug: 'championship',
    codigoEspn: 'eng.2',
    nome: 'EFL Championship',
    temporada: '2026-2027',
    pais: 'Inglaterra',
    tipo: 'pontos_corridos',
    totalClubes: 24
  },
  'uefa-nations': {
    slug: 'uefa-nations',
    codigoEspn: 'uefa.nations',
    nome: 'UEFA Nations League',
    temporada: '2026-2027',
    pais: 'Europa (Seleções)',
    tipo: 'misto'
  },
  'fifa-eliminatorias': {
    slug: 'fifa-eliminatorias',
    codigoEspn: 'fifa.worldq.conmebol',
    nome: 'Eliminatórias da Copa do Mundo FIFA',
    temporada: '2026',
    pais: 'Global',
    tipo: 'pontos_corridos'
  }
};

export const ESTADIOS = [
  {
    slug: 'maracana',
    nome: 'Estádio Jornalista Mário Filho (Maracanã)',
    cidade: 'Rio de Janeiro',
    uf: 'RJ',
    pais: 'Brasil',
    capacidade: 78838,
    inauguracao: 1950,
    gramado: 'Natural',
    proprietario: 'Governo do Estado do RJ',
    mandantes: ['Flamengo', 'Fluminense']
  },
  {
    slug: 'morumbis',
    nome: 'MorumBIS (Cícero Pompeu de Toledo)',
    cidade: 'São Paulo',
    uf: 'SP',
    pais: 'Brasil',
    capacidade: 66795,
    inauguracao: 1960,
    gramado: 'Natural',
    proprietario: 'São Paulo FC',
    mandantes: ['São Paulo']
  },
  {
    slug: 'allianz-parque',
    nome: 'Allianz Parque',
    cidade: 'São Paulo',
    uf: 'SP',
    pais: 'Brasil',
    capacidade: 43713,
    inauguracao: 2014,
    gramado: 'Sintético (Certificado FIFA Quality Pro)',
    proprietario: 'Palmeiras / WTorre',
    mandantes: ['Palmeiras']
  },
  {
    slug: 'neo-quimica-arena',
    nome: 'Neo Química Arena',
    cidade: 'São Paulo',
    uf: 'SP',
    pais: 'Brasil',
    capacidade: 49205,
    inauguracao: 2014,
    gramado: 'Híbrido (GrassMaster)',
    proprietario: 'Corinthians',
    mandantes: ['Corinthians']
  },
  {
    slug: 'mineirao',
    nome: 'Estádio Governador Magalhães Pinto (Mineirão)',
    cidade: 'Belo Horizonte',
    uf: 'MG',
    pais: 'Brasil',
    capacidade: 61846,
    inauguracao: 1965,
    gramado: 'Natural',
    proprietario: 'Governo de Minas Gerais',
    mandantes: ['Cruzeiro']
  },
  {
    slug: 'arena-mrv',
    nome: 'Arena MRV',
    cidade: 'Belo Horizonte',
    uf: 'MG',
    pais: 'Brasil',
    capacidade: 46000,
    inauguracao: 2023,
    gramado: 'Natural',
    proprietario: 'Atlético-MG',
    mandantes: ['Atlético-MG']
  },
  {
    slug: 'beira-rio',
    nome: 'Estádio José Pinheiro Borda (Beira-Rio)',
    cidade: 'Porto Alegre',
    uf: 'RS',
    pais: 'Brasil',
    capacidade: 50842,
    inauguracao: 1969,
    gramado: 'Natural',
    proprietario: 'SC Internacional',
    mandantes: ['Internacional']
  },
  {
    slug: 'arena-do-gremio',
    nome: 'Arena do Grêmio',
    cidade: 'Porto Alegre',
    uf: 'RS',
    pais: 'Brasil',
    capacidade: 55662,
    inauguracao: 2012,
    gramado: 'Natural',
    proprietario: 'Grêmio FBPA',
    mandantes: ['Grêmio']
  },
  {
    slug: 'nilton-santos',
    nome: 'Estádio Olímpico Nilton Santos (Engenhão)',
    cidade: 'Rio de Janeiro',
    uf: 'RJ',
    pais: 'Brasil',
    capacidade: 44661,
    inauguracao: 2007,
    gramado: 'Sintético Pro',
    proprietario: 'Prefeitura do Rio / Botafogo FR',
    mandantes: ['Botafogo']
  },
  {
    slug: 'sao-januario',
    nome: 'Estádio Vasco da Gama (São Januário)',
    cidade: 'Rio de Janeiro',
    uf: 'RJ',
    pais: 'Brasil',
    capacidade: 21880,
    inauguracao: 1927,
    gramado: 'Natural',
    proprietario: 'Vasco da Gama',
    mandantes: ['Vasco da Gama']
  },
  {
    slug: 'ligga-arena',
    nome: 'Ligga Arena (Arena da Baixada)',
    cidade: 'Curitiba',
    uf: 'PR',
    pais: 'Brasil',
    capacidade: 42372,
    inauguracao: 1999,
    gramado: 'Sintético com Teto Retrátil',
    proprietario: 'Athletico Paranaense',
    mandantes: ['Athletico Paranaense']
  },
  {
    slug: 'fonte-nova',
    nome: 'Casa de Apostas Arena Fonte Nova',
    cidade: 'Salvador',
    uf: 'BA',
    pais: 'Brasil',
    capacidade: 50025,
    inauguracao: 2013,
    gramado: 'Natural',
    proprietario: 'Governo da Bahia / Arena Salvador',
    mandantes: ['Bahia']
  },
  {
    slug: 'arena-castelao',
    nome: 'Arena Castelão (Governador Plácido Castelo)',
    cidade: 'Fortaleza',
    uf: 'CE',
    pais: 'Brasil',
    capacidade: 63903,
    inauguracao: 1973,
    gramado: 'Natural',
    proprietario: 'Governo do Ceará',
    mandantes: ['Fortaleza', 'Ceará']
  },
  {
    slug: 'vila-belmiro',
    nome: 'Estádio Urbano Caldeira (Vila Belmiro)',
    cidade: 'Santos',
    uf: 'SP',
    pais: 'Brasil',
    capacidade: 16068,
    inauguracao: 1916,
    gramado: 'Natural',
    proprietario: 'Santos FC',
    mandantes: ['Santos']
  },
  {
    slug: 'couto-pereira',
    nome: 'Estádio Major Antônio Couto Pereira',
    cidade: 'Curitiba',
    uf: 'PR',
    pais: 'Brasil',
    capacidade: 40502,
    inauguracao: 1932,
    gramado: 'Natural',
    proprietario: 'Coritiba FBC',
    mandantes: ['Coritiba']
  },
  {
    slug: 'santiago-bernabeu',
    nome: 'Estadio Santiago Bernabéu',
    cidade: 'Madrid',
    uf: 'MD',
    pais: 'Espanha',
    capacidade: 84744,
    inauguracao: 1947,
    gramado: 'Retrátil Híbrido com Hipogeu Automatizado',
    proprietario: 'Real Madrid CF',
    mandantes: ['Real Madrid']
  },
  {
    slug: 'camp-nou',
    nome: 'Spotify Camp Nou',
    cidade: 'Barcelona',
    uf: 'CT',
    pais: 'Espanha',
    capacidade: 105000,
    inauguracao: 1957,
    gramado: 'Híbrido',
    proprietario: 'FC Barcelona',
    mandantes: ['Barcelona']
  },
  {
    slug: 'wembley',
    nome: 'Wembley Stadium',
    cidade: 'Londres',
    uf: 'ENG',
    pais: 'Inglaterra',
    capacidade: 90000,
    inauguracao: 2007,
    gramado: 'Desso GrassMaster',
    proprietario: 'The Football Association',
    mandantes: ['Seleção Inglesa']
  },
  {
    slug: 'etihad-stadium',
    nome: 'Etihad Stadium (City of Manchester)',
    cidade: 'Manchester',
    uf: 'ENG',
    pais: 'Inglaterra',
    capacidade: 53400,
    inauguracao: 2002,
    gramado: 'Desso GrassMaster',
    proprietario: 'Manchester City Council',
    mandantes: ['Manchester City']
  },
  {
    slug: 'anfield',
    nome: 'Anfield Road',
    cidade: 'Liverpool',
    uf: 'ENG',
    pais: 'Inglaterra',
    capacidade: 61276,
    inauguracao: 1884,
    gramado: 'Híbrido',
    proprietario: 'Liverpool FC',
    mandantes: ['Liverpool']
  }
];

export const CLUBES = {
  'flamengo': {
    slug: 'flamengo',
    nome: 'Clube de Regatas do Flamengo',
    nomeCurto: 'Flamengo',
    sigla: 'FLA',
    pais: 'Brasil',
    estado: 'RJ',
    cidade: 'Rio de Janeiro',
    fundacao: 1895,
    estadio: 'Maracanã',
    estadioSlug: 'maracana',
    capacidadeEstadio: 78838,
    cores: ['#C3281E', '#000000'],
    corPrimaria: '#C3281E',
    corSecundaria: '#000000',
    escudo: 'https://a.espncdn.com/i/teamlogos/soccer/500/819.png',
    titulosPrincipais: {
      mundialInterclubes: 1,
      libertadores: 3,
      brasileirao: 8,
      copaDoBrasil: 5
    },
    rivalidades: ['Vasco da Gama', 'Fluminense', 'Botafogo'],
    forcaElo: 1890
  },
  'palmeiras': {
    slug: 'palmeiras',
    nome: 'Sociedade Esportiva Palmeiras',
    nomeCurto: 'Palmeiras',
    sigla: 'PAL',
    pais: 'Brasil',
    estado: 'SP',
    cidade: 'São Paulo',
    fundacao: 1914,
    estadio: 'Allianz Parque',
    estadioSlug: 'allianz-parque',
    capacidadeEstadio: 43713,
    cores: ['#006437', '#FFFFFF'],
    corPrimaria: '#006437',
    corSecundaria: '#FFFFFF',
    escudo: 'https://a.espncdn.com/i/teamlogos/soccer/500/2029.png',
    titulosPrincipais: {
      libertadores: 3,
      brasileirao: 12,
      copaDoBrasil: 4
    },
    rivalidades: ['Corinthians', 'São Paulo', 'Santos'],
    forcaElo: 1880
  },
  'sao-paulo': {
    slug: 'sao-paulo',
    nome: 'São Paulo Futebol Clube',
    nomeCurto: 'São Paulo',
    sigla: 'SAO',
    pais: 'Brasil',
    estado: 'SP',
    cidade: 'São Paulo',
    fundacao: 1930,
    estadio: 'MorumBIS',
    estadioSlug: 'morumbis',
    capacidadeEstadio: 66795,
    cores: ['#E30613', '#000000', '#FFFFFF'],
    corPrimaria: '#E30613',
    corSecundaria: '#000000',
    escudo: 'https://a.espncdn.com/i/teamlogos/soccer/500/2026.png',
    titulosPrincipais: {
      mundialFifa: 3,
      libertadores: 3,
      brasileirao: 6,
      copaDoBrasil: 1
    },
    rivalidades: ['Palmeiras', 'Corinthians', 'Santos'],
    forcaElo: 1740
  },
  'corinthians': {
    slug: 'corinthians',
    nome: 'Sport Club Corinthians Paulista',
    nomeCurto: 'Corinthians',
    sigla: 'COR',
    pais: 'Brasil',
    estado: 'SP',
    cidade: 'São Paulo',
    fundacao: 1910,
    estadio: 'Neo Química Arena',
    estadioSlug: 'neo-quimica-arena',
    capacidadeEstadio: 49205,
    cores: ['#000000', '#FFFFFF'],
    corPrimaria: '#000000',
    corSecundaria: '#FFFFFF',
    escudo: 'https://a.espncdn.com/i/teamlogos/soccer/500/874.png',
    titulosPrincipais: {
      mundialFifa: 2,
      libertadores: 1,
      brasileirao: 7,
      copaDoBrasil: 3
    },
    rivalidades: ['Palmeiras', 'São Paulo', 'Santos'],
    forcaElo: 1710
  },
  'santos': {
    slug: 'santos',
    nome: 'Santos Futebol Clube',
    nomeCurto: 'Santos',
    sigla: 'SAN',
    pais: 'Brasil',
    estado: 'SP',
    cidade: 'Santos',
    fundacao: 1912,
    estadio: 'Vila Belmiro',
    estadioSlug: 'vila-belmiro',
    capacidadeEstadio: 16068,
    cores: ['#FFFFFF', '#000000'],
    corPrimaria: '#000000',
    corSecundaria: '#FFFFFF',
    escudo: 'https://a.espncdn.com/i/teamlogos/soccer/500/2674.png',
    titulosPrincipais: {
      mundialInterclubes: 2,
      libertadores: 3,
      brasileirao: 8,
      copaDoBrasil: 1
    },
    rivalidades: ['Palmeiras', 'Corinthians', 'São Paulo'],
    forcaElo: 1720
  },
  'cruzeiro': {
    slug: 'cruzeiro',
    nome: 'Cruzeiro Esporte Clube',
    nomeCurto: 'Cruzeiro',
    sigla: 'CRU',
    pais: 'Brasil',
    estado: 'MG',
    cidade: 'Belo Horizonte',
    fundacao: 1921,
    estadio: 'Mineirão',
    estadioSlug: 'mineirao',
    capacidadeEstadio: 61846,
    cores: ['#003A70', '#FFFFFF'],
    corPrimaria: '#003A70',
    corSecundaria: '#FFFFFF',
    escudo: 'https://a.espncdn.com/i/teamlogos/soccer/500/2022.png',
    titulosPrincipais: {
      libertadores: 2,
      brasileirao: 4,
      copaDoBrasil: 6
    },
    rivalidades: ['Atlético-MG', 'América-MG'],
    forcaElo: 1780
  },
  'atletico-mg': {
    slug: 'atletico-mg',
    nome: 'Clube Atlético Mineiro',
    nomeCurto: 'Atlético-MG',
    sigla: 'CAM',
    pais: 'Brasil',
    estado: 'MG',
    cidade: 'Belo Horizonte',
    fundacao: 1908,
    estadio: 'Arena MRV',
    estadioSlug: 'arena-mrv',
    capacidadeEstadio: 46000,
    cores: ['#000000', '#FFFFFF'],
    corPrimaria: '#000000',
    corSecundaria: '#FFFFFF',
    escudo: 'https://a.espncdn.com/i/teamlogos/soccer/500/7632.png',
    titulosPrincipais: {
      libertadores: 1,
      brasileirao: 3,
      copaDoBrasil: 2
    },
    rivalidades: ['Cruzeiro', 'América-MG'],
    forcaElo: 1765
  },
  'fluminense': {
    slug: 'fluminense',
    nome: 'Fluminense Football Club',
    nomeCurto: 'Fluminense',
    sigla: 'FLU',
    pais: 'Brasil',
    estado: 'RJ',
    cidade: 'Rio de Janeiro',
    fundacao: 1902,
    estadio: 'Maracanã',
    estadioSlug: 'maracana',
    capacidadeEstadio: 78838,
    cores: ['#800020', '#006437', '#FFFFFF'],
    corPrimaria: '#800020',
    corSecundaria: '#006437',
    escudo: 'https://a.espncdn.com/i/teamlogos/soccer/500/3445.png',
    titulosPrincipais: {
      libertadores: 1,
      recopa: 1,
      brasileirao: 4,
      copaDoBrasil: 1
    },
    rivalidades: ['Flamengo', 'Vasco da Gama', 'Botafogo'],
    forcaElo: 1770
  },
  'botafogo': {
    slug: 'botafogo',
    nome: 'Botafogo de Futebol e Regatas',
    nomeCurto: 'Botafogo',
    sigla: 'BOT',
    pais: 'Brasil',
    estado: 'RJ',
    cidade: 'Rio de Janeiro',
    fundacao: 1904,
    estadio: 'Nilton Santos',
    estadioSlug: 'nilton-santos',
    capacidadeEstadio: 44661,
    cores: ['#000000', '#FFFFFF'],
    corPrimaria: '#000000',
    corSecundaria: '#FFFFFF',
    escudo: 'https://a.espncdn.com/i/teamlogos/soccer/500/6086.png',
    titulosPrincipais: {
      brasileirao: 2,
      copaConmebol: 1
    },
    rivalidades: ['Flamengo', 'Fluminense', 'Vasco da Gama'],
    forcaElo: 1795
  },
  'vasco': {
    slug: 'vasco',
    nome: 'Club de Regatas Vasco da Gama',
    nomeCurto: 'Vasco da Gama',
    sigla: 'VAS',
    pais: 'Brasil',
    estado: 'RJ',
    cidade: 'Rio de Janeiro',
    fundacao: 1898,
    estadio: 'São Januário',
    estadioSlug: 'sao-januario',
    capacidadeEstadio: 21880,
    cores: ['#000000', '#FFFFFF'],
    corPrimaria: '#000000',
    corSecundaria: '#FFFFFF',
    escudo: 'https://a.espncdn.com/i/teamlogos/soccer/500/3454.png',
    titulosPrincipais: {
      libertadores: 1,
      brasileirao: 4,
      copaDoBrasil: 1,
      mercocul: 1
    },
    rivalidades: ['Flamengo', 'Fluminense', 'Botafogo'],
    forcaElo: 1725
  },
  'gremio': {
    slug: 'gremio',
    nome: 'Grêmio Foot-Ball Porto Alegrense',
    nomeCurto: 'Grêmio',
    sigla: 'GRE',
    pais: 'Brasil',
    estado: 'RS',
    cidade: 'Porto Alegre',
    fundacao: 1903,
    estadio: 'Arena do Grêmio',
    estadioSlug: 'arena-do-gremio',
    capacidadeEstadio: 55662,
    cores: ['#0080FF', '#000000', '#FFFFFF'],
    corPrimaria: '#0080FF',
    corSecundaria: '#000000',
    escudo: 'https://a.espncdn.com/i/teamlogos/soccer/500/6273.png',
    titulosPrincipais: {
      mundialInterclubes: 1,
      libertadores: 3,
      brasileirao: 2,
      copaDoBrasil: 5
    },
    rivalidades: ['Internacional', 'Juventude'],
    forcaElo: 1720
  },
  'internacional': {
    slug: 'internacional',
    nome: 'Sport Club Internacional',
    nomeCurto: 'Internacional',
    sigla: 'INT',
    pais: 'Brasil',
    estado: 'RS',
    cidade: 'Porto Alegre',
    fundacao: 1909,
    estadio: 'Beira-Rio',
    estadioSlug: 'beira-rio',
    capacidadeEstadio: 50842,
    cores: ['#E50000', '#FFFFFF'],
    corPrimaria: '#E50000',
    corSecundaria: '#FFFFFF',
    escudo: 'https://a.espncdn.com/i/teamlogos/soccer/500/1936.png',
    titulosPrincipais: {
      mundialFifa: 1,
      libertadores: 2,
      brasileirao: 3,
      copaDoBrasil: 1
    },
    rivalidades: ['Grêmio', 'Juventude'],
    forcaElo: 1740
  },
  'bahia': {
    slug: 'bahia',
    nome: 'Esporte Clube Bahia',
    nomeCurto: 'Bahia',
    sigla: 'BAH',
    pais: 'Brasil',
    estado: 'BA',
    cidade: 'Salvador',
    fundacao: 1931,
    estadio: 'Arena Fonte Nova',
    estadioSlug: 'fonte-nova',
    capacidadeEstadio: 50025,
    cores: ['#003399', '#CC0000', '#FFFFFF'],
    corPrimaria: '#003399',
    corSecundaria: '#CC0000',
    escudo: 'https://a.espncdn.com/i/teamlogos/soccer/500/9967.png',
    titulosPrincipais: {
      brasileirao: 2,
      copaDoNordeste: 4
    },
    rivalidades: ['Vitória'],
    forcaElo: 1750
  },
  'athletico-pr': {
    slug: 'athletico-pr',
    nome: 'Club Athletico Paranaense',
    nomeCurto: 'Athletico Paranaense',
    sigla: 'CAP',
    pais: 'Brasil',
    estado: 'PR',
    cidade: 'Curitiba',
    fundacao: 1924,
    estadio: 'Ligga Arena',
    estadioSlug: 'ligga-arena',
    capacidadeEstadio: 42372,
    cores: ['#C8102E', '#000000'],
    corPrimaria: '#C8102E',
    corSecundaria: '#000000',
    escudo: 'https://a.espncdn.com/i/teamlogos/soccer/500/3458.png',
    titulosPrincipais: {
      sulAmericana: 2,
      brasileirao: 1,
      copaDoBrasil: 1
    },
    rivalidades: ['Coritiba', 'Paraná Clube'],
    forcaElo: 1755
  },
  'red-bull-bragantino': {
    slug: 'red-bull-bragantino',
    nome: 'Red Bull Bragantino',
    nomeCurto: 'Red Bull Bragantino',
    sigla: 'BRA',
    pais: 'Brasil',
    estado: 'SP',
    cidade: 'Bragança Paulista',
    fundacao: 1928,
    estadio: 'Estádio Nabi Abi Chedid',
    capacidadeEstadio: 17022,
    cores: ['#FFFFFF', '#D10A11'],
    corPrimaria: '#D10A11',
    corSecundaria: '#FFFFFF',
    escudo: 'https://a.espncdn.com/i/teamlogos/soccer/500/6079.png',
    titulosPrincipais: {
      serieB: 2,
      paulistao: 1
    },
    rivalidades: ['Ponte Preta'],
    forcaElo: 1735
  },
  'coritiba': {
    slug: 'coritiba',
    nome: 'Coritiba Foot Ball Club',
    nomeCurto: 'Coritiba',
    sigla: 'CFC',
    pais: 'Brasil',
    estado: 'PR',
    cidade: 'Curitiba',
    fundacao: 1909,
    estadio: 'Couto Pereira',
    estadioSlug: 'couto-pereira',
    capacidadeEstadio: 40502,
    cores: ['#005A36', '#FFFFFF'],
    corPrimaria: '#005A36',
    corSecundaria: '#FFFFFF',
    escudo: 'https://a.espncdn.com/i/teamlogos/soccer/500/3456.png',
    titulosPrincipais: {
      brasileirao: 1,
      serieB: 2
    },
    rivalidades: ['Athletico Paranaense', 'Paraná Clube'],
    forcaElo: 1690
  },
  'real-madrid': {
    slug: 'real-madrid',
    nome: 'Real Madrid Club de Fútbol',
    nomeCurto: 'Real Madrid',
    sigla: 'RMA',
    pais: 'Espanha',
    estado: 'MD',
    cidade: 'Madrid',
    fundacao: 1902,
    estadio: 'Santiago Bernabéu',
    estadioSlug: 'santiago-bernabeu',
    capacidadeEstadio: 84744,
    cores: ['#FFFFFF', '#00529F', '#FEBE10'],
    corPrimaria: '#00529F',
    corSecundaria: '#FFFFFF',
    escudo: 'https://a.espncdn.com/i/teamlogos/soccer/500/86.png',
    titulosPrincipais: {
      mundialFifa: 8,
      championsLeague: 15,
      laLiga: 36,
      copaDelRey: 20
    },
    rivalidades: ['Barcelona', 'Atlético de Madrid'],
    forcaElo: 2010
  },
  'barcelona': {
    slug: 'barcelona',
    nome: 'Futbol Club Barcelona',
    nomeCurto: 'Barcelona',
    sigla: 'BAR',
    pais: 'Espanha',
    estado: 'CT',
    cidade: 'Barcelona',
    fundacao: 1899,
    estadio: 'Spotify Camp Nou',
    estadioSlug: 'camp-nou',
    capacidadeEstadio: 105000,
    cores: ['#004D98', '#A50044', '#EDBB00'],
    corPrimaria: '#004D98',
    corSecundaria: '#A50044',
    escudo: 'https://a.espncdn.com/i/teamlogos/soccer/500/83.png',
    titulosPrincipais: {
      mundialFifa: 3,
      championsLeague: 5,
      laLiga: 27,
      copaDelRey: 31
    },
    rivalidades: ['Real Madrid', 'Espanyol'],
    forcaElo: 1980
  },
  'manchester-city': {
    slug: 'manchester-city',
    nome: 'Manchester City Football Club',
    nomeCurto: 'Manchester City',
    sigla: 'MCI',
    pais: 'Inglaterra',
    estado: 'ENG',
    cidade: 'Manchester',
    fundacao: 1880,
    estadio: 'Etihad Stadium',
    estadioSlug: 'etihad-stadium',
    capacidadeEstadio: 53400,
    cores: ['#6CABDD', '#1C2C5B'],
    corPrimaria: '#6CABDD',
    corSecundaria: '#1C2C5B',
    escudo: 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png',
    titulosPrincipais: {
      mundialFifa: 1,
      championsLeague: 1,
      premierLeague: 10,
      faCup: 7
    },
    rivalidades: ['Manchester United', 'Liverpool'],
    forcaElo: 2005
  },
  'arsenal': {
    slug: 'arsenal',
    nome: 'Arsenal Football Club',
    nomeCurto: 'Arsenal',
    sigla: 'ARS',
    pais: 'Inglaterra',
    estado: 'ENG',
    cidade: 'Londres',
    fundacao: 1886,
    estadio: 'Emirates Stadium',
    capacidadeEstadio: 60704,
    cores: ['#EF0107', '#FFFFFF', '#063672'],
    corPrimaria: '#EF0107',
    corSecundaria: '#FFFFFF',
    escudo: 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png',
    titulosPrincipais: {
      premierLeague: 13,
      faCup: 14
    },
    rivalidades: ['Tottenham Hotspur', 'Chelsea'],
    forcaElo: 1960
  },
  'liverpool': {
    slug: 'liverpool',
    nome: 'Liverpool Football Club',
    nomeCurto: 'Liverpool',
    sigla: 'LIV',
    pais: 'Inglaterra',
    estado: 'ENG',
    cidade: 'Liverpool',
    fundacao: 1892,
    estadio: 'Anfield Road',
    estadioSlug: 'anfield',
    capacidadeEstadio: 61276,
    cores: ['#C8102E', '#00B2A9', '#F6EB61'],
    corPrimaria: '#C8102E',
    corSecundaria: '#00B2A9',
    escudo: 'https://a.espncdn.com/i/teamlogos/soccer/500/364.png',
    titulosPrincipais: {
      mundialFifa: 1,
      championsLeague: 6,
      premierLeague: 19,
      faCup: 8
    },
    rivalidades: ['Everton', 'Manchester United', 'Manchester City'],
    forcaElo: 1970
  }
};

export const TABELAS_SOBERANAS = {
  'brasileirao-a': [
    { pos: 1, time: 'Flamengo', slug: 'flamengo', sigla: 'FLA', pts: 76, j: 34, v: 23, e: 7, d: 4, gp: 71, gc: 29, sg: 42, aproveitamento: 74.5, forma: ['V', 'V', 'E', 'V', 'V'], zona: 'Libertadores (G4)' },
    { pos: 2, time: 'Palmeiras', slug: 'palmeiras', sigla: 'PAL', pts: 73, j: 34, v: 21, e: 10, d: 3, gp: 62, gc: 23, sg: 39, aproveitamento: 71.6, forma: ['V', 'V', 'V', 'E', 'V'], zona: 'Libertadores (G4)' },
    { pos: 3, time: 'Cruzeiro', slug: 'cruzeiro', sigla: 'CRU', pts: 60, j: 34, v: 18, e: 6, d: 10, gp: 55, gc: 48, sg: 7, aproveitamento: 58.8, forma: ['E', 'V', 'D', 'V', 'E'], zona: 'Libertadores (G4)' },
    { pos: 4, time: 'Fluminense', slug: 'fluminense', sigla: 'FLU', pts: 57, j: 34, v: 16, e: 9, d: 9, gp: 55, gc: 42, sg: 13, aproveitamento: 55.9, forma: ['V', 'E', 'V', 'E', 'D'], zona: 'Libertadores (G4)' },
    { pos: 5, time: 'Athletico Paranaense', slug: 'athletico-pr', sigla: 'CAP', pts: 54, j: 34, v: 15, e: 9, d: 10, gp: 51, gc: 43, sg: 8, aproveitamento: 52.9, forma: ['V', 'E', 'D', 'V', 'V'], zona: 'Pré-Libertadores' },
    { pos: 6, time: 'Bahia', slug: 'bahia', sigla: 'BAH', pts: 53, j: 34, v: 14, e: 11, d: 9, gp: 50, gc: 45, sg: 5, aproveitamento: 52.0, forma: ['E', 'D', 'V', 'E', 'V'], zona: 'Pré-Libertadores' },
    { pos: 7, time: 'Atlético-MG', slug: 'atletico-mg', sigla: 'CAM', pts: 51, j: 35, v: 14, e: 9, d: 12, gp: 44, gc: 40, sg: 4, aproveitamento: 48.6, forma: ['D', 'V', 'E', 'D', 'V'], zona: 'Sul-Americana' },
    { pos: 8, time: 'Red Bull Bragantino', slug: 'red-bull-bragantino', sigla: 'BRA', pts: 47, j: 34, v: 13, e: 8, d: 13, gp: 44, gc: 39, sg: 5, aproveitamento: 46.1, forma: ['V', 'D', 'E', 'V', 'D'], zona: 'Sul-Americana' },
    { pos: 9, time: 'Santos', slug: 'santos', sigla: 'SAN', pts: 47, j: 34, v: 12, e: 11, d: 11, gp: 50, gc: 49, sg: 1, aproveitamento: 46.1, forma: ['E', 'V', 'V', 'E', 'D'], zona: 'Sul-Americana' },
    { pos: 10, time: 'São Paulo', slug: 'sao-paulo', sigla: 'SAO', pts: 44, j: 34, v: 12, e: 8, d: 14, gp: 39, gc: 39, sg: 0, aproveitamento: 43.1, forma: ['D', 'D', 'V', 'E', 'V'], zona: 'Sul-Americana' },
    { pos: 11, time: 'Vasco da Gama', slug: 'vasco', sigla: 'VAS', pts: 44, j: 34, v: 12, e: 8, d: 14, gp: 45, gc: 50, sg: -5, aproveitamento: 43.1, forma: ['V', 'D', 'D', 'E', 'V'], zona: 'Sul-Americana' },
    { pos: 12, time: 'Botafogo', slug: 'botafogo', sigla: 'BOT', pts: 42, j: 34, v: 11, e: 9, d: 14, gp: 46, gc: 53, sg: -7, aproveitamento: 41.2, forma: ['D', 'E', 'V', 'D', 'E'], zona: 'Sul-Americana' },
    { pos: 13, time: 'Coritiba', slug: 'coritiba', sigla: 'CFC', pts: 42, j: 34, v: 11, e: 9, d: 14, gp: 40, gc: 51, sg: -11, aproveitamento: 41.2, forma: ['V', 'E', 'D', 'V', 'D'], zona: 'Permanência' },
    { pos: 14, time: 'Mirassol', slug: 'mirassol', sigla: 'MIR', pts: 41, j: 35, v: 10, e: 11, d: 14, gp: 39, gc: 48, sg: -9, aproveitamento: 39.0, forma: ['E', 'D', 'E', 'V', 'D'], zona: 'Permanência' },
    { pos: 15, time: 'Vitória', slug: 'vitoria', sigla: 'VIT', pts: 38, j: 34, v: 10, e: 8, d: 16, gp: 35, gc: 51, sg: -16, aproveitamento: 37.3, forma: ['D', 'V', 'D', 'E', 'D'], zona: 'Permanência' },
    { pos: 16, time: 'Internacional', slug: 'internacional', sigla: 'INT', pts: 38, j: 34, v: 9, e: 11, d: 14, gp: 38, gc: 42, sg: -4, aproveitamento: 37.3, forma: ['E', 'E', 'D', 'D', 'V'], zona: 'Permanência' },
    { pos: 17, time: 'Corinthians', slug: 'corinthians', sigla: 'COR', pts: 37, j: 34, v: 9, e: 10, d: 15, gp: 36, gc: 42, sg: -6, aproveitamento: 36.3, forma: ['D', 'E', 'D', 'V', 'D'], zona: 'Rebaixamento (Z4)' },
    { pos: 18, time: 'Grêmio', slug: 'gremio', sigla: 'GRE', pts: 37, j: 34, v: 9, e: 10, d: 15, gp: 38, gc: 47, sg: -9, aproveitamento: 36.3, forma: ['D', 'D', 'V', 'E', 'D'], zona: 'Rebaixamento (Z4)' },
    { pos: 19, time: 'Remo', slug: 'remo', sigla: 'REM', pts: 29, j: 34, v: 6, e: 11, d: 17, gp: 37, gc: 57, sg: -20, aproveitamento: 28.4, forma: ['D', 'D', 'E', 'D', 'E'], zona: 'Rebaixamento (Z4)' },
    { pos: 20, time: 'Chapecoense', slug: 'chapecoense', sigla: 'CHA', pts: 21, j: 34, v: 4, e: 9, d: 21, gp: 33, gc: 70, sg: -37, aproveitamento: 20.6, forma: ['D', 'D', 'D', 'D', 'E'], zona: 'Rebaixamento (Z4)' }
  ],
  'premier-league': [
    { pos: 1, time: 'Arsenal', slug: 'arsenal', sigla: 'ARS', pts: 27, j: 10, v: 9, e: 0, d: 1, gp: 15, gc: 5, sg: 10, aproveitamento: 90.0, zona: 'Champions League' },
    { pos: 2, time: 'Brighton & Hove Albion', slug: 'brighton', sigla: 'BHA', pts: 22, j: 10, v: 7, e: 1, d: 2, gp: 26, gc: 7, sg: 19, aproveitamento: 73.3, zona: 'Champions League' },
    { pos: 3, time: 'Manchester City', slug: 'manchester-city', sigla: 'MCI', pts: 21, j: 10, v: 7, e: 0, d: 3, gp: 21, gc: 13, sg: 8, aproveitamento: 70.0, zona: 'Champions League' },
    { pos: 4, time: 'Liverpool', slug: 'liverpool', sigla: 'LIV', pts: 18, j: 10, v: 5, e: 3, d: 2, gp: 14, gc: 10, sg: 4, aproveitamento: 60.0, zona: 'Champions League' },
    { pos: 5, time: 'Chelsea', slug: 'chelsea', sigla: 'CHE', pts: 16, j: 10, v: 5, e: 1, d: 4, gp: 19, gc: 16, sg: 3, aproveitamento: 53.3, zona: 'Europa League' }
  ]
};

export const ARTILHARIA_CONSOLIDADA = {
  'brasileirao-a': [
    { rank: 1, jogador: 'Pedro', clube: 'Flamengo', slugClube: 'flamengo', gols: 21, assistencias: 6, jogos: 29, mediaGols: 0.72 },
    { rank: 2, jogador: 'Estêvão', clube: 'Palmeiras', slugClube: 'palmeiras', gols: 17, assistencias: 9, jogos: 31, mediaGols: 0.55 },
    { rank: 3, jogador: 'Yuri Alberto', clube: 'Corinthians', slugClube: 'corinthians', gols: 16, assistencias: 4, jogos: 32, mediaGols: 0.50 },
    { rank: 4, jogador: 'Pablo Vegetti', clube: 'Vasco da Gama', slugClube: 'vasco', gols: 15, assistencias: 2, jogos: 33, mediaGols: 0.45 },
    { rank: 5, jogador: 'Luciano', clube: 'São Paulo', slugClube: 'sao-paulo', gols: 14, assistencias: 5, jogos: 30, mediaGols: 0.47 },
    { rank: 6, jogador: 'Matheus Pereira', clube: 'Cruzeiro', slugClube: 'cruzeiro', gols: 12, assistencias: 11, jogos: 33, mediaGols: 0.36 },
    { rank: 7, jogador: 'Paulinho', clube: 'Atlético-MG', slugClube: 'atletico-mg', gols: 12, assistencias: 4, jogos: 28, mediaGols: 0.43 },
    { rank: 8, jogador: 'Everton Ribeiro', clube: 'Bahia', slugClube: 'bahia', gols: 9, assistencias: 10, jogos: 32, mediaGols: 0.28 }
  ]
};

/**
 * Simula um confronto direto entre dois clubes
 * Baseado no Elo Rating relativo e fator campo
 */
export function calcularProbabilidadeConfronto(clubeCasa, clubeVisitante) {
  const eloCasa = (clubeCasa.forcaElo || 1700) + 65; // Vantagem de jogar em casa (+65 Elo)
  const eloVisitante = clubeVisitante.forcaElo || 1700;

  const diffElo = eloCasa - eloVisitante;
  const probVitoriaCasa = 1 / (1 + Math.pow(10, -diffElo / 400));
  
  // Taxa média de empate no futebol brasileiro: 26% a 29%
  const probEmpate = Math.max(0.18, 0.28 - Math.abs(diffElo) / 2500);
  const probRestante = 1 - probEmpate;
  
  const vitoriaCasaAjustada = Math.round((probVitoriaCasa * probRestante) * 100);
  const empateAjustado = Math.round(probEmpate * 100);
  const vitoriaVisitanteAjustada = Math.max(1, 100 - vitoriaCasaAjustada - empateAjustado);

  const expectativaGolsCasa = Number(((eloCasa / eloVisitante) * 1.45).toFixed(1));
  const expectativaGolsVisitante = Number(((eloVisitante / eloCasa) * 1.05).toFixed(1));

  return {
    mandante: {
      nome: clubeCasa.nomeCurto || clubeCasa.nome,
      slug: clubeCasa.slug,
      probabilidadeVitoria: `${vitoriaCasaAjustada}%`,
      expectativaGols: expectativaGolsCasa,
      estadio: clubeCasa.estadio || 'Estádio do Mandante'
    },
    empate: {
      probabilidade: `${empateAjustado}%`
    },
    visitante: {
      nome: clubeVisitante.nomeCurto || clubeVisitante.nome,
      slug: clubeVisitante.slug,
      probabilidadeVitoria: `${vitoriaVisitanteAjustada}%`,
      expectativaGols: expectativaGolsVisitante
    },
    palpiteMaisProvavel: vitoriaCasaAjustada > 50 
      ? `Vitória do ${clubeCasa.nomeCurto}`
      : vitoriaVisitanteAjustada > 45 
        ? `Vitória do ${clubeVisitante.nomeCurto}`
        : 'Equilíbrio / Chance Alta de Empate',
    fatorCampo: '+65 Elo (Mandante)',
    timestampCalculo: new Date().toISOString()
  };
}

/**
 * Renderiza um Card de Partida SVG de altíssima definição
 */
export function renderCardPartidaSvg(timeCasa, placarCasa, timeVisitante, placarVisitante, campeonato, status) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 240" width="680" height="240">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a101d"/>
      <stop offset="100%" stop-color="#05080f"/>
    </linearGradient>
    <linearGradient id="scoreBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#16233b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Card Background -->
  <rect width="680" height="240" rx="16" fill="url(#bg)" stroke="#1e293b" stroke-width="1.5"/>
  
  <!-- Header Bar -->
  <path d="M 0 16 C 0 7.16 7.16 0 16 0 L 664 0 C 672.84 0 680 7.16 680 16 L 680 44 L 0 44 Z" fill="#0f172a"/>
  <circle cx="28" cy="22" r="4" fill="#10b981" filter="url(#glow)"/>
  <text x="42" y="27" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="#a3e635" letter-spacing="1">
    FUTEBOL PRO ANYCAST • ${campeonato.toUpperCase()}
  </text>
  <text x="652" y="27" text-anchor="end" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#94a3b8">
    ${status}
  </text>

  <!-- Time Mandante (Esquerda) -->
  <g transform="translate(40, 65)">
    <circle cx="50" cy="50" r="40" fill="#1e293b" stroke="#334155" stroke-width="2"/>
    <text x="50" y="58" text-anchor="middle" font-family="system-ui, sans-serif" font-size="22" font-weight="800" fill="#f8fafc">
      ${timeCasa.slice(0, 3).toUpperCase()}
    </text>
    <text x="50" y="112" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="#f8fafc">
      ${timeCasa}
    </text>
    <text x="50" y="130" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="500" fill="#64748b">
      Mandante
    </text>
  </g>

  <!-- Placar Central -->
  <g transform="translate(240, 75)">
    <rect width="200" height="90" rx="12" fill="url(#scoreBg)" stroke="#334155" stroke-width="1.5"/>
    <text x="55" y="62" text-anchor="middle" font-family="ui-monospace, monospace" font-size="52" font-weight="900" fill="#f8fafc">
      ${placarCasa}
    </text>
    <text x="100" y="58" text-anchor="middle" font-family="ui-monospace, monospace" font-size="32" font-weight="700" fill="#64748b">
      :
    </text>
    <text x="145" y="62" text-anchor="middle" font-family="ui-monospace, monospace" font-size="52" font-weight="900" fill="#f8fafc">
      ${placarVisitante}
    </text>
  </g>

  <!-- Time Visitante (Direita) -->
  <g transform="translate(540, 65)">
    <circle cx="50" cy="50" r="40" fill="#1e293b" stroke="#334155" stroke-width="2"/>
    <text x="50" y="58" text-anchor="middle" font-family="system-ui, sans-serif" font-size="22" font-weight="800" fill="#f8fafc">
      ${timeVisitante.slice(0, 3).toUpperCase()}
    </text>
    <text x="50" y="112" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="#f8fafc">
      ${timeVisitante}
    </text>
    <text x="50" y="130" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="500" fill="#64748b">
      Visitante
    </text>
  </g>

  <!-- Footer Watermark -->
  <text x="340" y="215" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" fill="#475569">
    Ponte API Gateway • https://ponte.ozpro.com.br
  </text>
</svg>`;
}

/**
 * Exporta Tabela de Classificação em Formato CSV
 */
export function exportarTabelaCsv(tabela, nomeCampeonato = 'Campeonato') {
  const header = 'Posicao,Time,Sigla,Pontos,Jogos,Vitorias,Empates,Derrotas,GolsPro,GolsContra,SaldoGols,Aproveitamento,Zona';
  const rows = tabela.map(t => [
    t.pos,
    `"${t.time}"`,
    t.sigla || '',
    t.pts,
    t.j,
    t.v,
    t.e,
    t.d,
    t.gp,
    t.gc,
    t.sg,
    `${t.aproveitamento || ((t.pts / (t.j * 3)) * 100).toFixed(1)}%`,
    `"${t.zona || ''}"`
  ].join(','));

  return [header, ...rows].join('\n');
}

/**
 * Exporta Tabela de Classificação em Formato XML
 */
export function exportarTabelaXml(tabela, campeonato = 'campeonato') {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<campeonato id="${campeonato}" atualizadoEm="${new Date().toISOString()}">\n  <tabela>\n`;
  for (const t of tabela) {
    xml += `    <posicao rank="${t.pos}">\n`;
    xml += `      <time>${t.time}</time>\n`;
    xml += `      <sigla>${t.sigla || ''}</sigla>\n`;
    xml += `      <pontos>${t.pts}</pontos>\n`;
    xml += `      <jogos>${t.j}</jogos>\n`;
    xml += `      <vitorias>${t.v}</vitorias>\n`;
    xml += `      <empates>${t.e}</empates>\n`;
    xml += `      <derrotas>${t.d}</derrotas>\n`;
    xml += `      <golsPro>${t.gp}</golsPro>\n`;
    xml += `      <golsContra>${t.gc}</golsContra>\n`;
    xml += `      <saldoGols>${t.sg}</saldoGols>\n`;
    xml += `      <aproveitamento>${t.aproveitamento || ((t.pts / (t.j * 3)) * 100).toFixed(1)}%</aproveitamento>\n`;
    xml += `      <zona>${t.zona || ''}</zona>\n`;
    xml += `    </posicao>\n`;
  }
  xml += `  </tabela>\n</campeonato>`;
  return xml;
}
