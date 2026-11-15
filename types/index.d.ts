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
