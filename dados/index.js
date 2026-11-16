import fs from 'fs';
import path from 'path';

let elencos = {};
let premier = {};
let laliga = {};
let copa = {};
let brasileirao = [];

try {
  const dir = path.resolve('dados');
  if (fs.existsSync(path.join(dir, 'elencos-serie-a.json'))) {
    elencos = JSON.parse(fs.readFileSync(path.join(dir, 'elencos-serie-a.json'), 'utf8'));
  }
  if (fs.existsSync(path.join(dir, 'premier-league-2026.json'))) {
    premier = JSON.parse(fs.readFileSync(path.join(dir, 'premier-league-2026.json'), 'utf8'));
  }
  if (fs.existsSync(path.join(dir, 'laliga-2026.json'))) {
    laliga = JSON.parse(fs.readFileSync(path.join(dir, 'laliga-2026.json'), 'utf8'));
  }
  if (fs.existsSync(path.join(dir, 'copa-do-mundo-2026.json'))) {
    copa = JSON.parse(fs.readFileSync(path.join(dir, 'copa-do-mundo-2026.json'), 'utf8'));
  }
  if (fs.existsSync(path.join(dir, 'brasileirao-partidas.json'))) {
    brasileirao = JSON.parse(fs.readFileSync(path.join(dir, 'brasileirao-partidas.json'), 'utf8'));
  }
} catch (_) {}

export const ELENCOS_SERIE_A_SOBERANOS = elencos;
export const PREMIER_LEAGUE_2026_SOBERANO = premier;
export const LALIGA_2026_SOBERANO = laliga;
export const COPA_DO_MUNDO_2026_SOBERANO = copa;
export const BRASILEIRAO_HISTORICO_SOBERANO = brasileirao;
