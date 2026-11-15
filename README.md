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

### 3. Tabela de Classificação
`GET /api/futebol/tabela/:campeonato`  
Parâmetro opcional: `?formato=json|csv|xml`

**Competições Suportadas:**
- `brasileirao-a` (Brasileirão Série A)
- `brasileirao-b` (Brasileirão Série B)
- `premier-league` (Inglaterra)
- `la-liga` (Espanha)
- `serie-a-italia` (Itália)
- `bundesliga` (Alemanha)
- `ligue-1` (França)
- `eredivisie` (Holanda)
- `primeira-liga` (Portugal)
- `mls` (Estados Unidos)
- `saudi-league` (Arábia Saudita)
- `liga-argentina` (Argentina)
- `championship` (Inglaterra 2ª Div)
- `champions-league` (UEFA Champions League)
- `libertadores` (CONMEBOL Libertadores)
- `uefa-nations` (UEFA Nations League)

```bash
curl -s "https://ponte.ozpro.com.br/api/futebol/tabela/brasileirao-a" \
  -H "Authorization: Bearer pnt_live_..."
```

### 2. Placares Ao Vivo & Em Andamento
`GET /api/futebol/aovivo`

```bash
curl -s "https://ponte.ozpro.com.br/api/futebol/aovivo" \
  -H "Authorization: Bearer pnt_live_..."
```

### 3. Cadastro Oficial de Clubes
`GET /api/futebol/clubes`  
Filtros opcionais: `?estado=SP`, `?pais=Brasil`, `?busca=flamengo`

```bash
curl -s "https://ponte.ozpro.com.br/api/futebol/clubes?estado=SP" \
  -H "Authorization: Bearer pnt_live_..."
```

### 4. Detalhes de um Clube Específico
`GET /api/futebol/clubes/:slug` (ex: `flamengo`, `palmeiras`, `real-madrid`)

### 5. Estádios Oficiais
`GET /api/futebol/estadios`  
Filtros opcionais: `?uf=RJ`, `?cidade=Rio de Janeiro`

### 6. Artilharia & Estatísticas
`GET /api/futebol/artilharia/:campeonato`

### 7. Simulador de Confronto (Rating Elo)
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
