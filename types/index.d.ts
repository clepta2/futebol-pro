export interface Competicao {
  slug: string;
  codigoEspn: string;
  nome: string;
  temporada: string;
  pais: string;
  tipo: 'pontos_corridos' | 'mata_mata' | 'misto' | 'liga_unica';
  totalClubes?: number;
  rodadasTotais?: number;
}

export interface ClubeClassificacao {
  pos: number;
  time: string;
  sigla?: string;
  logo?: string;
  pts: number;
  j: number;
  v: number;
  e: number;
  d: number;
  gp: number;
  gc: number;
  sg: number;
  aproveitamento: number;
  zona?: string;
  forma?: string[];
}

export interface TabelaResponse {
  ok: boolean;
  campeonato: string;
  slug: string;
  temporada: string;
  pais: string;
  fonte: string;
  atualizadoEm: string;
  totalClubes: number;
  tabela: ClubeClassificacao[];
}

export interface Clube {
  slug: string;
  nome: string;
  nomeCurto: string;
  sigla: string;
  pais: string;
  estado?: string;
  cidade: string;
  fundacao: number;
  estadio: string;
  estadioSlug?: string;
  capacidadeEstadio?: number;
  cores: string[];
  corPrimaria: string;
  corSecundaria: string;
  escudo: string;
  titulosPrincipais: Record<string, number>;
  rivalidades: string[];
  forcaElo: number;
}

export interface Estadio {
  slug: string;
  nome: string;
  cidade: string;
  uf: string;
  pais: string;
  capacidade: number;
  inauguracao: number;
  gramado: string;
  proprietario: string;
  mandantes: string[];
}

export interface PartidaAoVivo {
  id: string;
  data: string;
  status: 'ao_vivo' | 'encerrado' | 'agendado';
  statusDescricao: string;
  tempoJogo: string;
  minuto: number;
  campeonato: string;
  campeonatoSlug: string;
  mandante: {
    id: string;
    nome: string;
    sigla: string;
    logo: string;
    placar: number;
  };
  visitante: {
    id: string;
    nome: string;
    sigla: string;
    logo: string;
    placar: number;
  };
  estadio: string;
  cidade: string;
}

export interface Artilheiro {
  rank: number;
  jogador: string;
  clube: string;
  slugClube: string;
  gols: number;
  assistencias: number;
  jogos: number;
  mediaGols: number;
}

export interface SimulacaoConfronto {
  mandante: {
    nome: string;
    slug: string;
    probabilidadeVitoria: string;
    expectativaGols: number;
    estadio: string;
  };
  empate: {
    probabilidade: string;
  };
  visitante: {
    nome: string;
    slug: string;
    probabilidadeVitoria: string;
    expectativaGols: number;
  };
  palpiteMaisProvavel: string;
  fatorCampo: string;
  timestampCalculo: string;
}

export declare class FutebolPro {
  static baseUrl: string;
  static apiKey: string;
  static configure(config?: { apiKey?: string; baseUrl?: string }): void;
  static getHealth(): Promise<{ ok: boolean; servico: string; versao: string; latenciaEdgeMs: number }>;
  static getCompeticoes(): Promise<{ ok: boolean; totalCompeticoes: number; competicoes: Competicao[] }>;
  static getJogosMundo(filtros?: { data?: string; status?: 'ao_vivo' | 'encerrado' | 'agendado'; liga?: string; busca?: string; agrupadoPorLiga?: boolean }): Promise<{ ok: boolean; escopo: string; dataConsultada: string; totalJogos: number; totalAoVivo: number; totalEncerrados: number; totalAgendados: number; jogos: PartidaAoVivo[] | Record<string, PartidaAoVivo[]> }>;
  static getJogosHoje(): Promise<{ ok: boolean; totalJogos: number; jogos: PartidaAoVivo[] }>;
  static getJogosFuturo(data?: string): Promise<{ ok: boolean; totalJogosFuturos: number; proximasRodadasDestaque: any[]; jogosAgendados: any[] }>;
  static getJogosAntigos(data?: string): Promise<{ ok: boolean; totalHistoricosLendarios: number; totalRecentesFinalizados: number; jogosHistoricosLendarios: any[]; jogosPassadosRecentes: any[] }>;
  static getPartidaDetalhe(partidaId: string): Promise<any>;
  static getLanceALance(partidaId: string, tipo?: string): Promise<{ ok: boolean; partidaId: string; totalLancesRegistrados: number; resumoDisciplinar: any; lancesMinutoAMinuto: any[] }>;
  static getPosicaoBola(partidaId: string): Promise<{ ok: boolean; partidaId: string; tempoJogo: string; posicaoAtualBola: any; campoSvgUrl: string }>;
  static getCampoSvgUrl(partidaId: string): string;
  static getCamisaClubeSvgUrl(clubeSlug: string, options?: { numero?: number; nome?: string; tipo?: 'titular' | 'reserva' }): string;
  static getUniformesClube(clubeSlug: string): Promise<{ ok: boolean; clube: string; uniformes: any }>;
  static getTecnicosClube(clubeSlug: string): Promise<{ ok: boolean; clube: string; tecnicoAtual: any; tecnicosHistoricosLendarios: any[] }>;
  static getBrasoesClube(clubeSlug: string): Promise<{ ok: boolean; clube: string; brasoes: any }>;
  static getCamisaJogadorSvgUrl(jogadorId: string): string;
  static getAvatarJogadorSvgUrl(jogadorId: string): string;
  static getHistoricoClubesJogador(jogadorId: string): Promise<{ ok: boolean; atleta: string; historicoClubesAnos: any[] }>;
  static getGloboPartidas(): Promise<{ ok: boolean; rodada: number; partidas: any[] }>;
  static getGloboClubes(): Promise<{ ok: boolean; totalClubes: number; clubes: Record<string, any> }>;
  static getGloboMercadoStatus(): Promise<{ ok: boolean; mercadoAberto: boolean; status: any }>;
  static getGloboEsquemas(): Promise<{ ok: boolean; esquemas: string[] }>;
  static getEspnNoticias(liga?: string): Promise<{ ok: boolean; liga: string; noticias: any[] }>;
  static getFifaTorneios(): Promise<{ ok: boolean; torneiosOficiais: any[] }>;
  static getMomentumPartida(partidaId: string): Promise<{ ok: boolean; partidaId: string; attackMomentum: any[] }>;
  static getMomentumSvgUrl(partidaId: string): string;
  static getChuteiraDeOuro(): Promise<{ ok: boolean; premio: string; ranking: any[]; chuteiraSvgUrl: string }>;
  static getChuteiraDeOuroSvgUrl(): string;
  static getRankingFifa(): Promise<{ ok: boolean; titulo: string; ranking: any[] }>;
  static getPartidaHandicap(partidaId: string): Promise<{ ok: boolean; partidaId: string; handicapAsiatico: any }>;
  static getMataMata(torneio?: string): Promise<{ ok: boolean; torneiosDisponiveis?: string[]; mataMata?: any; chaveamento?: any; chaveamentoSvgUrl?: string }>;
  static getChaveamentoSvgUrl(torneio?: string): string;
  static getArbitros(id?: string): Promise<{ ok: boolean; totalArbitros?: number; arbitros?: any[]; arbitro?: any }>;
  static getClassicoGaugeSvgUrl(slug: string): string;
  static getPartidaStats(partidaId: string): Promise<{ ok: boolean; partidaId: string; campeonato: string; mandante: any; visitante: any; estatisticasOficiais: any[] }>;
  static getPartidaFantasy(partidaId: string): Promise<{ ok: boolean; partidaId: string; totalAtletasAvaliados: number; melhorDaPartidaFantasy: any; pontuacoesAtletas: any[] }>;
  static getRankingRodadaFantasy(): Promise<{ ok: boolean; rankingTopPontuadores: any[] }>;
  static getTalentosScouting(): Promise<{ ok: boolean; totalTalentosMonitorados: number; talentos: any[] }>;
  static getScoutingTalento(talentoId: string): Promise<{ ok: boolean; relatorioScouting: any }>;
  static cadastrarWebhook(config: { url: string; secret?: string; eventos?: string[]; clubes?: string[] }): Promise<{ ok: boolean; webhook: any }>;
  static listarWebhooks(): Promise<{ ok: boolean; totalWebhooksAtivos: number; webhooks: any[] }>;
  static removerWebhook(webhookId: string): Promise<{ ok: boolean; mensagem: string }>;
  static testarWebhook(): Promise<{ ok: boolean; mensagem: string; payloadDisparado: any }>;
  static forcarSincronizacao(): Promise<{ ok: boolean; mensagem: string; armazenamentoPersistente: string; timestamp: string }>;
  static getWidgetJsUrl(): string;
  static getPartidaXg(partidaId: string): Promise<{ ok: boolean; partidaId: string; analiseXg: any }>;
  static getShotMapSvgUrl(partidaId: string): string;
  static getHeatmapSvgUrl(partidaId: string, equipe?: string): string;
  static getPartidaOdds(partidaId: string): Promise<{ ok: boolean; partidaId: string; mercadosDeOddsPoisson: any }>;
  static getTabelaProjecoes(campeonato?: string): Promise<{ ok: boolean; campeonato: string; projecoes: any[] }>;
  static buscarGlobal(termo: string): Promise<{ ok: boolean; termoPesquisado: string; totalResultados: number; resultados: any }>;
  static getGraficoPartidaUrl(partidaId: string): string;
  static getPartidaEscalacoes(partidaId: string): Promise<{ ok: boolean; partidaId: string; escalacoes: any[] }>;
  static getClassicos(slug?: string): Promise<{ ok: boolean; totalClassicos?: number; classicos?: any; dados?: any }>;
  static compararCarreiras(id1: string, id2: string): Promise<{ ok: boolean; comparacao: any }>;
  static getComparacaoCarreirasSvgUrl(id1: string, id2: string): string;
  static getMelhoresDaTemporada(escopo?: 'global' | 'brasileirao'): Promise<{ ok: boolean; rankingMelhoresDaTemporada: any[]; selecaoIdealDaTemporada: any }>;
  static compararJogadores(id1: string, id2: string): Promise<{ ok: boolean; comparacao: any }>;
  static getAnaliseJogador(jogadorId: string): Promise<{ ok: boolean; analise: any }>;
  static getDashboardJogadorUrl(jogadorId: string): string;
  static getRadarJogadorUrl(jogadorId: string): string;
  static getJogadores(filtros?: { clube?: string; posicao?: string; busca?: string }): Promise<{ ok: boolean; totalJogadores: number; jogadores: any[] }>;
  static getElencoClube(clubeSlug: string): Promise<{ ok: boolean; clube: string; totalJogadores: number; elenco: any[] }>;
  static getTabela(campeonato?: string, formato?: 'json'): Promise<TabelaResponse>;
  static getTabela(campeonato?: string, formato?: 'csv' | 'xml'): Promise<string>;
  static getJogos(campeonato?: string): Promise<{ ok: boolean; totalJogos: number; jogos: PartidaAoVivo[] }>;
  static getAoVivo(campeonato?: string): Promise<{ ok: boolean; totalJogosEmAndamento: number; emAndamento: PartidaAoVivo[]; todosJogos: PartidaAoVivo[] }>;
  static getClubes(filtros?: { estado?: string; pais?: string; busca?: string }): Promise<{ ok: boolean; total: number; clubes: Clube[] }>;
  static getClube(slug: string): Promise<{ ok: boolean; clube: Clube }>;
  static getEstadios(filtros?: { uf?: string; cidade?: string }): Promise<{ ok: boolean; total: number; estadios: Estadio[] }>;
  static getArtilharia(campeonato?: string): Promise<{ ok: boolean; ranking: Artilheiro[] }>;
  static simularConfronto(clubeCasa: string, clubeVisitante: string): Promise<{ ok: boolean; confronto: string; analise: SimulacaoConfronto }>;
  static getCardSvgUrl(timeCasa: string, placarCasa: number | string, timeVisitante: string, placarVisitante: number | string, options?: { campeonato?: string; status?: string }): string;
}

export default FutebolPro;
