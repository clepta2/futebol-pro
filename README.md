# ⚽ Futebol Pro API • Inteligência & Dados Esportivos Anycast

> **API e SDK Oficial de Alta Performance na Borda Cloudflare Anycast (<5ms) para Dados de Futebol Brasileiro e Internacional: Classificação, Placares Ao Vivo, Clubes, Estádios, Elo Rating e Cards Vetoriais SVG.**

[![Status](https://img.shields.io/badge/Status-Produção%20Tier--1-success.svg)](#)
[![Infra](https://img.shields.io/badge/Infra-Cloudflare%20Workers%20Anycast-orange.svg)](#)
[![Latência](https://img.shields.io/badge/Latência-%3C5ms%20RAM%20Edge-blue.svg)](#)
[![Auth](https://img.shields.io/badge/Auth-RFC%206750%20Bearer%20Token-emerald.svg)](#)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

---

## 🧭 Visão Geral

O **Futebol Pro API** foi construído seguindo a arquitetura padrão da suíte **Ponte API**, combinando:
1. **Base Soberana Embutida em RAM (<2ms):** Cadastro completo de mais de 40 clubes e estádios históricos, clássicos, tabelas consolidadas, artilharia e cálculo matemático de pontos, saldo e aproveitamento.
2. **Edge Cache Inteligente com Live Feeds:** Atualização contínua de placares ao vivo e rodadas em andamento com cache dinâmico de 30s a 180s para garantir zero sobrecarga de rede e 100% de disponibilidade Anycast.
3. **Simulador Estatístico de Confrontos (Rating Elo):** Algoritmo preditivo que calcula probabilidade de vitória, empate e gols esperados com fator de mando de campo (+65 Elo).
4. **Renderizador Vetorial SVG de Cards:** Gera cards de jogo em SVG direto da borda Cloudflare, prontos para redes sociais, notícias esportivas e embeds.
5. **Exportação Multi-Formato:** Dados de tabela disponíveis em **JSON**, **CSV** (Google Sheets / Excel) e **XML**.

---

## 📦 Matriz de Planos & Vazão Contínua

| Plano | Limite RPM | Cota Diária | Prefixo de Chave | Latência |
|---|---|---|---|---|
| **Free / Sandbox** | 30 RPM | 500 req/dia | `fut_free_` / `fut_test_` | &lt; 5ms Anycast |
| **Starter (24/7)** | 60 RPM | 86.400 req/dia (1 req/s) | `fut_start_` | &lt; 3ms Anycast |
| **Pro** | 300 RPM | 250.000 req/dia (5 req/s) | `fut_pro_` | &lt; 2ms Anycast |
| **Business** | 1.200 RPM | 1.000.000 req/dia (20 req/s) | `fut_biz_` | &lt; 2ms Anycast |
| **Master Admin** | 3.000 RPM | Ilimitada (Bypass) | `fut_master_` | &lt; 1ms Anycast |

---

## 🚀 Endpoints REST

### 1. 🌍 Hub Global: Todos os Jogos do Mundo
`GET /api/futebol/mundo` (ou `/api/futebol/jogos/mundo`)  
Retorna todos os jogos de futebol do planeta Terra organizados por liga e campeonato!

**Filtros Suportados:**
- `?data=hoje` (ou `?data=YYYY-MM-DD`, `?data=ontem`, `?data=amanha` ou `?data=YYYYMMDD`)
- `?status=ao_vivo` (ou `encerrado`, `agendado`)
- `?liga=eng.1` (ou nome da liga, ex: `premier`, `la-liga`, `serie-a`)
- `?busca=Real Madrid` (filtro por nome de time ou torneio)
- `?agrupadoPorLiga=true` (retorna dicionário chaveado pelo nome do campeonato)

### 2. 🔴 Placares Ao Vivo do Planeta Inteiro
`GET /api/futebol/aovivo`  
Monitoramento contínuo em tempo real com minutos e placar atualizado com latência sub-5ms Anycast.

### 3. 📅 Jogos de Hoje, do Futuro e Antigos
- `GET /api/futebol/mundo/hoje`: Todas as partidas programadas e em andamento para hoje no mundo.
- `GET /api/futebol/mundo/futuro`: Calendário de próximas rodadas e confrontos agendados nos próximos dias e semanas.
- `GET /api/futebol/mundo/antigos`: Resultados de partidas passadas recentes e histórico de finais lendárias com súmula completa de gols e cartões.

### 4. 📊 Análise Estatística, Posição da Bola & Gráficos em Tempo Real
- `GET /api/futebol/partida/:id/lance-a-lance`: Linha do tempo minuto a minuto com descrição, tipo de lance e **coordenadas de campo $(X, Y)$ exatas de cada falta, cartão, chute e gol**.
- `GET /api/futebol/partida/:id/posicao-bola`: Rastreamento em tempo real da posição atual da bola no gramado com zona tática de perigo.
- `GET /api/futebol/partida/:id/campo.svg`: Visualização 2D espacial do campo em SVG com todos os eventos plotados nas coordenadas $(X, Y)$ reais e a bola pulsando.
- `GET /api/futebol/partida/:id/stats`: Estatísticas oficiais verídicas da partida para analistas e apostas (Posse %, Finalizações, Chutes a Gol, Passes %, Faltas, Escanteios, Desarmes e Defesas).
- `GET /api/futebol/partida/:id/grafico.svg`: Gráfico de barras bi-direcional vetorial SVG renderizado na borda com os dados reais do boxscore oficial.
- `GET /api/futebol/partida/:id/escalacoes`: Escalações oficiais completas com titulares, posições de campo, reservas e capitães.

### 5. 🏃 Dados de Todos os Jogadores & Gráfico Radar SVG
- `GET /api/futebol/clubes/:slug/elenco`: Elenco completo de todos os jogadores do time (40+ atletas reais) com foto oficial, número da camisa, idade, peso, altura, nacionalidade e estatísticas reais da temporada (gols, assistências, finalizações, faltas, desarmes).
- `GET /api/futebol/jogadores/:id`: Perfil e métricas oficiais de desempenho do atleta na temporada.
- `GET /api/futebol/jogadores/:id/grafico.svg`: Gráfico de radar hexagonal SVG de atributos verídicos do atleta.
- `GET /api/futebol/jogadores/:id/dashboard.svg`: Dashboard visual SVG completo de scouting com histórico de gols por temporada.
- `GET /api/futebol/jogadores/:id/analise`: Diagnóstico tático pelo motor analítico com rating geral (0 a 10), arquétipo e pontaria.

### 6. ⚖️ Comparador Histórico de Carreiras & Corrida Melhor da Temporada
- `GET /api/futebol/carreiras/comparar/:id1/:id2`: Comparação profunda de carreiras oficiais completas (ex: `messi-10/cr7-7`, `pele-10/ronaldo-9`) com gols totais, assistências, jogos, médias, títulos coletivos, Bolas de Ouro e histórico de confrontos diretos mútuos.
- `GET /api/futebol/carreiras/comparar/:id1/:id2.svg`: Gráfico visual bi-direcional em SVG comparando as duas carreiras lado a lado.
- `GET /api/futebol/premios/melhor-do-ano`: Corrida oficial para Melhor Jogador da Temporada (Ballon d'Or & Bola de Ouro Placar) e Seleção Ideal da Temporada (XI Titular).

### 7. 🎮 Motor de Fantasy Game (Cartola FC / Fantasy League)
- `GET /api/futebol/partida/:id/fantasy`: Pontuações individuais calculadas a partir de scouts reais (Gol +8, Assistência +5, SG +5, FD +1.2, FT +3, FS +0.5, FC -0.5, CA -1.5, CV -5.0).
- `GET /api/futebol/fantasy/ranking-rodada`: Top pontuadores oficiais da rodada.

### 8. 🌟 Scouting Automatizado & Projeção Sub-21
- `GET /api/futebol/scouting/talentos`: Radar de jovens promessas mundiais (Estêvão, Lamine Yamal, Endrick).
- `GET /api/futebol/scouting/:talentoId`: Relatório analítico comparativo do atleta com lendas mundiais na mesma idade (ex: Estêvão aos 19 vs Neymar aos 19; Yamal aos 19 vs Messi aos 19).

### 9. 🔔 Webhooks & Alertas Push em Tempo Real
- `POST /api/futebol/webhooks/cadastrar`: Cadastra URL de webhook com filtros de eventos (`gol`, `cartao_vermelho`, `inicio_jogo`, `fim_jogo`) e clubes.
- `GET /api/futebol/webhooks/listar`: Lista webhooks ativos.
- `DELETE /api/futebol/webhooks/:id`: Remove webhook.
- `POST /api/futebol/webhooks/testar`: Dispara simulação de gol para testes de integração.

### 10. 🧩 Widgets Embeddables de 1 Linha (`widget.js`)
Incorpore placares, tabelas e rastreamento em qualquer site externo com uma única tag:
```html
<div class="futebol-pro-widget" data-tipo="placar" data-partida="hist_001"></div>
<script src="https://futebol-pro-api.clepta2.workers.dev/widget.js" async></script>
```

### 11. 📊 Tabela de Classificação & Projeções
`GET /api/futebol/tabela/:campeonato`  
Parâmetro opcional: `?formato=json|csv|xml` ou `GET /api/futebol/tabela/:campeonato/projecoes` para probabilidades de Título, G4 e Z4.

### 12. 🏆 Torneios Mata-Mata & Diagrama SVG de Chaveamento
- `GET /api/futebol/matamata/:torneio`: Confrontos de ida e volta, placares agregados e final (Libertadores, Copa do Brasil, Champions League).
- `GET /api/futebol/matamata/:torneio/chaveamento.svg`: Diagrama vetorial visual SVG completo do chaveamento do torneio.

### 13. 👨‍⚖️ Árbitros FIFA & Estatísticas Disciplinares
- `GET /api/futebol/arbitros`: Catálogo de árbitros oficiais com médias de cartões amarelos, vermelhos, faltas por jogo, pênaltis e índice de rigor disciplinar.
- `GET /api/futebol/arbitros/:id`: Ficha técnica de arbitragem (ex: `wilton-sampaio`, `raphael-claus`, `szymon-marciniak`).

### 14. 🎲 Linhas de Handicap Asiático
- `GET /api/futebol/partida/:id/handicap`: Cálculo matemático de linhas de handicap asiático (-0.25, -0.5, -0.75, -1.0, +0.25, +0.5, +0.75, +1.0) com probabilidades e odds justas.

### 15. 🎚️ Gauge Gráfico de Clássicos H2H em SVG
- `GET /api/futebol/classicos/:slug/gauge.svg`: Renderizador SVG de proporção tripla de vitórias e empates do dérbi.

### 16. 📺 Integrações Oficiais de Grandes Portais (Globo, ESPN & FIFA)
- **Grupo Globo & Cartola FC:**
  - `GET /api/futebol/globo/partidas`: Rodada oficial da Série A com horários de TV e estádios no padrão ge.globo.
  - `GET /api/futebol/globo/clubes`: 68 clubes com escudos oficiais de alta resolução da CDN `s3.glbimg.com`.
  - `GET /api/futebol/globo/mercado-status`: Status oficial do mercado (aberto/fechado e timestamp de fechamento).
  - `GET /api/futebol/globo/esquemas`: Esquemas táticos oficiais (4-3-3, 3-4-3, 3-5-2, etc.).
- **ESPN Worldwide Sports News:**
  - `GET /api/futebol/espn/noticias?liga=bra.1`: Feed de notícias jornalísticas em tempo real com manchete, resumo, autor, fotos e links originais (suporta `bra.1`, `eng.1`, `esp.1`, `uefa.champions`).
- **FIFA (Fédération Internationale de Football Association):**
  - `GET /api/futebol/fifa/torneios`: Calendário e detalhes da Copa do Mundo FIFA 2026, Super Mundial de Clubes FIFA 2025/2026 e Copa Intercontinental.
  - `GET /api/futebol/ranking-fifa`: Top 10 oficial de seleções masculinas do mundo.

### 17. 🛡️ Cadastro Oficial de Clubes
`GET /api/futebol/clubes`  
Filtros opcionais: `?estado=SP`, `?pais=Brasil`, `?busca=flamengo`

### 18. 🏟️ Estádios Oficiais
`GET /api/futebol/estadios`  
Filtros opcionais: `?uf=RJ`, `?cidade=Rio de Janeiro`

### 9. 🎯 Artilharia & Estatísticas
`GET /api/futebol/artilharia/:campeonato`

### 10. ⚔️ Simulador de Confronto (Rating Elo)
`GET /api/futebol/confronto/:clubeCasa/:clubeVisitante`

```bash
curl -s "https://ponte.ozpro.com.br/api/futebol/confronto/flamengo/palmeiras" \
  -H "Authorization: Bearer pnt_live_..."
```

```json
{
  "ok": true,
  "confronto": "Flamengo vs Palmeiras",
  "analise": {
    "mandante": {
      "nome": "Flamengo",
      "slug": "flamengo",
      "probabilidadeVitoria": "51%",
      "expectativaGols": 1.5,
      "estadio": "Maracanã"
    },
    "empate": {
      "probabilidade": "25%"
    },
    "visitante": {
      "nome": "Palmeiras",
      "slug": "palmeiras",
      "probabilidadeVitoria": "24%",
      "expectativaGols": 1.0
    },
    "palpiteMaisProvavel": "Vitória do Flamengo",
    "fatorCampo": "+65 Elo (Mandante)"
  }
}
```

### 8. Card Vetorial SVG Dinâmico
`GET /api/futebol/card/:timeCasa/:placarCasa/:timeVisitante/:placarVisitante.svg`

```html
<img src="https://ponte.ozpro.com.br/api/futebol/card/Flamengo/2/Palmeiras/1.svg" alt="Card Placar">
```

---

## 💻 Uso do SDK Isomórfico (Node.js / Browser)

```javascript
import { FutebolPro } from 'futebol-pro';

// Configuração opcional com sua chave de produção
FutebolPro.configure({
  apiKey: 'pnt_live_89f2a7...',
  baseUrl: 'https://ponte.ozpro.com.br'
});

// 1. Obter tabela do Brasileirão
const { tabela } = await FutebolPro.getTabela('brasileirao-a');
console.log('Líder:', tabela[0].time, tabela[0].pts, 'pontos');

// 2. Placares ao vivo
const live = await FutebolPro.getAoVivo();
console.log('Jogos em andamento:', live.totalJogosEmAndamento);

// 3. Simular confronto
const { analise } = await FutebolPro.simularConfronto('flamengo', 'palmeiras');
console.log('Probabilidades:', analise);
```

---

## 🛠️ Deploy no Cloudflare Workers

```bash
cd futebol-pro
wrangler deploy
```

---

## 📄 Licença

Distribuído sob licença MIT. Consulte o arquivo `LICENSE` para mais detalhes.
