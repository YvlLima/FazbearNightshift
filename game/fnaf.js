/**
 * Módulo com a definição do roster de Animatronics e lógica do jogo FNAF PvP.
 */

// Objeto especial para o Golden Freddy (Animatronic Secreto com 1% de chance)
const GOLDEN_FREDDY = {
  name: 'Golden Freddy',
  emoji: '✨',
  minDamage: 100,
  maxDamage: 100,
  description: 'Lendário e extremamente raro. Garante vitória instantânea sempre que aparece.',
  gif: 'https://media.giphy.com/media/VsvjvEa5FF3lTcjdov/giphy.gif',
  power: {
    name: 'Golden Jumpscare',
    chance: 0.01, // 1%
    description: 'Aparece com 1% de probabilidade: aplica Instakill imediato ao alvo (100 de dano) e concede ao próprio atacante 2 turnos de invencibilidade total.'
  }
};

// Roster fixo de 11 animatronics padrão (sorteio normal nos 99% dos casos)
const ANIMATRONICS = [
  {
    name: 'Freddy',
    emoji: '🐻',
    minDamage: 12,
    maxDamage: 18,
    description: 'Animatronic líder equilibrado com boa força de ataque.',
    gif: 'https://media.giphy.com/media/11GdBibqqMOXkc/giphy.gif',
    power: {
      name: 'Phantom Screech',
      chance: 0.12, // 12%
      description: 'Paralisa o alvo por 2 turnos e causa +10 de dano de choque adicional (reduzido para +5 se o alvo tiver Resistência ativa do Springlock Guilty).'
    }
  },
  {
    name: 'Foxy',
    emoji: '🦊',
    minDamage: 18,
    maxDamage: 25,
    description: 'Rápido e agressivo com dano elevado.',
    gif: 'https://media.giphy.com/media/QsgJi30B9ByH7tRhGV/giphy.gif',
    power: {
      name: 'Super Combo',
      chance: 0.14, // 14%
      description: 'O próprio atacante esquiva-se completamente do próximo ataque recebido.'
    }
  },
  {
    name: 'Chica',
    emoji: '🐥',
    minDamage: 10,
    maxDamage: 15,
    description: 'Animatronic esfomeada que ataca com o seu Cupcake Bomb.',
    gif: 'https://media.giphy.com/media/ARFSAYXIWnLcQ/giphy.gif',
    power: {
      name: 'Cupcake Bomb',
      chance: 0.15, // 15%
      description: 'Causa +16 de dano explosivo extra ao alvo (reduzido para +8 se o alvo tiver Resistência ativa do Springlock Guilty).'
    }
  },
  {
    name: 'Bonnie',
    emoji: '🐰',
    minDamage: 15,
    maxDamage: 21,
    description: 'Versátil e com bom equilíbrio de atributos.',
    gif: 'https://media.giphy.com/media/YnHuRxgwtlh0k/giphy.gif',
    power: {
      name: 'Thrash Guitar',
      chance: 0.11, // 11%
      description: 'Confunde o alvo por 1 ataque — no próximo ataque que realizar, todo o dano que causaria vira-se contra si próprio.'
    }
  },
  {
    name: 'Springtrap',
    emoji: '🐇',
    minDamage: 12,
    maxDamage: 17,
    description: 'Ameaça constante e imprevisível.',
    gif: 'https://media.giphy.com/media/3lrsPjxa4dFzB0f4TE/giphy.gif',
    power: {
      name: 'Springlock Guilty',
      chance: 0.16, // 16%
      description: 'Concede ao próprio atacante uma Resistência que divide por 2 o próximo dano de poder especial recebido (exceto Golden Freddy e poderes que ignoram resistência).'
    }
  },
  {
    name: 'Puppet',
    emoji: '🎭',
    minDamage: 20,
    maxDamage: 25,
    description: 'Dano devastador com ataques letais.',
    gif: 'https://media.giphy.com/media/VHmenyqdCbn32/giphy.gif',
    power: {
      name: 'Steel Agony',
      chance: 0.10, // 10%
      description: 'Imobiliza o alvo por 2 turnos e causa 5 de dano de agonia por turno durante esse período (10 de dano contínuo total, ignorando resistência).'
    }
  },
  {
    name: 'Toy Freddy',
    emoji: '🧸',
    minDamage: 14,
    maxDamage: 20,
    description: 'Gamer obsessivo que calcula ataques de alta precisão.',
    gif: 'https://media.giphy.com/media/d0O0yEvQlyHt1W2Wrd/giphy.gif',
    power: {
      name: 'AI Rage',
      chance: 0.10, // 10%
      description: 'Duplica (2x) o dano do ataque e ignora completamente qualquer esquiva ativa do alvo.'
    }
  },
  {
    name: 'Mangle',
    emoji: '🐺',
    minDamage: 16,
    maxDamage: 22,
    description: 'Construção desarticulada e imprevisível.',
    gif: 'https://media.giphy.com/media/QVp2ggOV3uXLi/giphy.gif',
    power: {
      name: 'Wire Tangle',
      chance: 0.14, // 14%
      description: 'Copia aleatoriamente o poder especial de um dos Toys (Toy Chica, Toy Bonnie, Toy Freddy) ou do Balloon Boy.'
    }
  },
  {
    name: 'Toy Chica',
    emoji: '🐤',
    minDamage: 11,
    maxDamage: 16,
    description: 'Elegante e sorrateira com lanches revigorantes.',
    gif: 'https://media.giphy.com/media/TQevPAh9wfiWc1WEov/giphy.gif',
    power: {
      name: 'Heal Food',
      chance: 0.17, // 17%
      description: 'Regenera +15 HP ao próprio atacante (até ao máximo de 100 HP).'
    }
  },
  {
    name: 'Toy Bonnie',
    emoji: '🐰',
    minDamage: 13,
    maxDamage: 19,
    description: 'Animatronic com vislumbre de luzes de néon venenosas.',
    gif: 'https://media.giphy.com/media/2Xflxzqb74is5dRwE5W/giphy.gif',
    power: {
      name: 'Neon Gas',
      chance: 0.09, // 9%
      description: 'Causa +4 de dano direto ao alvo (reduzido para +2 por Resistência) e envenena-o por 3 rondas (8 de dano por turno, 24 de dano contínuo total).'
    }
  },
  {
    name: 'Balloon Boy',
    emoji: '🎈',
    minDamage: 8,
    maxDamage: 14,
    description: 'Provocador e irritante que cega os oponentes.',
    gif: 'https://media.giphy.com/media/XNWNulPYk7PUy2VByy/giphy.gif',
    power: {
      name: 'Flash Balloon',
      chance: 0.08, // 8%
      description: 'Cega o alvo por 2 ataques — em cada tentativa de ataque realizada pelo alvo durante esse período, ele sofre 14 de dano próprio, ignorando resistência.'
    }
  },
  {
    name: 'Circus Baby',
    emoji: '🎪',
    minDamage: 14,
    maxDamage: 20,
    description: 'Líder assustadora que aprisiona oponentes com a sua garra hidráulica.',
    gif: 'https://media.giphy.com/media/ZpNCs9BuQvfZYFXNoZ/giphy.gif',
    power: {
      name: 'Scooper Reach',
      chance: 0.09, // 9%
      description: 'Duplica (2x) o dano do ataque e imobiliza o alvo por 2 rondas, ignorando esquiva e resistência do alvo.'
    }
  },
  {
    name: 'Ballora',
    emoji: '🩰',
    minDamage: 12,
    maxDamage: 18,
    description: 'Bailarina graciosa com movimentos defensivos letais.',
    gif: 'https://media.giphy.com/media/j7fhAf2L27Be8EMCf3/giphy.gif',
    power: {
      name: 'Spindash Ballet',
      chance: 0.08, // 8%
      description: 'O próprio atacante fica imune a dano e reflete 1.5x qualquer dano que sofrer durante os próximos 2 ataques que receber como alvo.'
    }
  },
  {
    name: 'Funtime Chica',
    emoji: '🦩',
    minDamage: 13,
    maxDamage: 19,
    description: 'Estrela carismática com flashes hipnóticos e desorientadores.',
    gif: 'https://media.giphy.com/media/XtdIzxbtPcMbefA0jV/giphy.gif',
    power: {
      name: 'Celebrity Flash',
      chance: 0.08, // 8%
      description: 'Sorteia 50/50 entre Hipnotizar o alvo (imobilizado por 2 rondas) ou Confundi-lo (causa 1.5x de dano próprio no próximo ataque).'
    }
  },
  {
    name: 'Funtime Freddy',
    emoji: '🐻‍❄️',
    minDamage: 15,
    maxDamage: 21,
    description: 'Imprevisível e hiperativo que lança o seu marionete Bon-Bon.',
    gif: 'https://media.giphy.com/media/kdBDSfLNaVNUBN5ZjW/giphy.gif',
    power: {
      name: 'Bon-Bon Rocket',
      chance: 0.11, // 11%
      description: 'Copia o poder especial de Funtime Chica ou Funtime Foxy e adiciona +6 de dano fixo extra ao ataque (reduzido para +3 com Resistência).'
    }
  },
  {
    name: 'Funtime Foxy',
    emoji: '🦊',
    minDamage: 17,
    maxDamage: 23,
    description: 'Performer extravagante de ataques hidráulicos e regeneração.',
    gif: 'https://media.giphy.com/media/KpRuNSxFCr2Zld0ktG/giphy.gif',
    power: {
      name: 'Hydraulic Overload',
      chance: 0.06, // 6%
      description: 'Regenera +9 HP ao próprio atacante e envenena o alvo por 1 ronda com dano contínuo equivalente a 2.5x o dano principal, ignorando resistência.'
    }
  },
  {
    name: 'Glamrock Freddy',
    emoji: '🎤',
    minDamage: 14,
    maxDamage: 20,
    description: 'Líder dos Glamrocks com a escotilha torácica protetora.',
    gif: 'https://media.giphy.com/media/Yztj5QCINQerTUlNF1/giphy.gif',
    power: {
      name: 'Stomach Hatch Protect',
      chance: 0.09, // 9%
      description: 'Engole o próximo ataque recebido pelo atacante (0 dano sofrido) e devolve-o duplicado (2x) como dano ao agressor (reduzido para metade se o agressor tiver Resistência).'
    }
  },
  {
    name: 'Glamrock Chica',
    emoji: '🎸',
    minDamage: 11,
    maxDamage: 17,
    description: 'Guitarrista voraz que resiste aos danos mais críticos.',
    gif: 'https://media.giphy.com/media/8dokXZ8JnJRHVVYnfE/giphy.gif',
    power: {
      name: 'Garbage Gobble',
      chance: 0.11, // 11%
      description: 'Se o HP do atacante estiver abaixo de 20%, ativa modo de sobrevivência por 2 ataques: impede a morte (HP mínimo 1) e duplica (2x) o dano dos seus próprios ataques nesse período.'
    }
  },
  {
    name: 'Roxy',
    emoji: '🏎️',
    minDamage: 15,
    maxDamage: 21,
    description: 'Pilota narcisista com visão de raios-X e deteção de falhas.',
    gif: 'https://media.giphy.com/media/r6vcGAWmg2S7Dpc4YJ/giphy.gif',
    power: {
      name: "Roxy's Eyes",
      chance: 0.08, // 8%
      description: 'Anula todos os efeitos negativos ativos no próprio atacante e confunde o alvo por 1 ataque com +9 de dano auto-infligido adicional.'
    }
  },
  {
    name: 'Monty',
    emoji: '🐊',
    minDamage: 16,
    maxDamage: 22,
    description: 'Baixista agressivo com investidas violentas e saltos devastadores.',
    gif: 'https://media.giphy.com/media/F2Xih8X6VCCTifqlSo/giphy.gif',
    power: {
      name: 'Monty Thrash',
      chance: 0.12, // 12%
      description: 'Causa +10 de dano fixo adicional ao alvo (reduzido para +5 com Resistência) e concede esquiva total ao próprio atacante no próximo ataque recebido.'
    }
  },
  {
    name: 'Sundrop/Moondrop',
    emoji: '☀️',
    minDamage: 13,
    maxDamage: 19,
    description: 'Animatronic de personalidade dupla que alterna entre luz e trevas.',
    gif: 'https://media.giphy.com/media/ZsyeN9Qljuvzo6IDj4/giphy.gif',
    power: {
      name: 'Day/Night Shift',
      chance: 0.06, // 6%
      description: 'Sorteia 50/50 entre Modo Sun (cura +15 HP ao próprio atacante) ou Modo Moon (cega o alvo por 2 turnos e aumenta o dano deste ataque em 2.5x).'
    }
  },
  {
    name: 'Vanny',
    emoji: '🔪',
    minDamage: 12,
    maxDamage: 18,
    description: 'Seguidora mascarada que corrompe o sistema de combate.',
    gif: 'https://media.giphy.com/media/YoXdoyeLiMp3IesV65/giphy.gif',
    power: {
      name: 'Glitch Override',
      chance: 0.12, // 12%
      description: 'Aplica o estado Hackeado ao alvo por 2 ataques — em cada ataque que realizar nesse período, o alvo sofre 50% de auto-dano sobre o dano que causar.'
    }
  },
  {
    name: 'Security Puppet',
    emoji: '🎁',
    minDamage: 10,
    maxDamage: 16,
    description: 'Guardião de emergência que restaura sistemas críticos.',
    gif: 'https://media.giphy.com/media/xfP3NKiqib8xOBYUBx/giphy.gif',
    power: {
      name: 'Security Healing',
      chance: 0.13, // 13%
      description: 'Regenera +40 HP ao próprio atacante (até ao máximo de 100 HP), mas impõe-lhe cooldown duplo (2 minutos de espera) no seu próximo ataque.'
    }
  },
  {
    name: 'The Mimic',
    emoji: '🤖',
    minDamage: 15,
    maxDamage: 23,
    description: 'Endosqueleto antigo capaz de replicar qualquer padrão de combate.',
    gif: 'https://media.giphy.com/media/2366jOUMQShVQ3ZaNF/giphy.gif',
    power: {
      name: 'Data Copy',
      chance: 0.03, // 3%
      description: 'Copia o poder especial de qualquer animatronic do roster (exceto Golden Freddy e Ennard) e duplica (2x) todos os seus valores numéricos de dano.'
    }
  },
  {
    name: 'Ennard',
    emoji: '🕸️',
    minDamage: 16,
    maxDamage: 24,
    description: 'Fusão de peças dos animatronics Funtime. Aparece obrigatoriamente após qualquer um deles, herdando aleatoriamente um dos seus poderes com certeza absoluta.',
    gif: 'https://media.giphy.com/media/7EsrkwGqL82GONjDOR/giphy.gif',
    power: {
      name: 'The Scooping Room',
      chance: null,
      description: 'Emergem com 100% de certeza na ronda seguinte após o jogador utilizar qualquer um dos 5 Funtimes na coleção, herdando aleatoriamente o seu poder especial.'
    }
  },
  {
    name: 'Scott Cawthon',
    emoji: '👨‍💻',
    minDamage: 100,
    maxDamage: 100,
    description: 'O criador. A entidade mais poderosa do jogo — reescreve as regras a seu favor sempre que aparece. Requer a coleção completa (exceto Golden Freddy) para ter hipótese de surgir.',
    gif: 'https://media.giphy.com/media/Gyol2Mkqle6gZ3oPOS/giphy.gif',
    power: {
      name: 'Developer Console',
      chance: 0.10,
      description: 'Reseta o HP do alvo a 0 (KO instantâneo), concede 5 turnos de invencibilidade ao atacante (God Mode), limpa os seus efeitos negativos e inflige todos os status negativos no alvo por 3 rondas (Patch Notes), previne a própria morte (Infinite Respawn) e concede cooldown reduzido de 30s nos próximos 5 ataques (No Cooldown).'
    }
  }
];

const FUNTIME_NAMES = ['Circus Baby', 'Ballora', 'Funtime Chica', 'Funtime Freddy', 'Funtime Foxy'];
const MANGLE_COPIABLE_NAMES = ['Toy Chica', 'Toy Bonnie', 'Toy Freddy', 'Balloon Boy'];

/**
 * Retorna um animatronic aleatório do roster padrão (exclui Golden Freddy, Ennard e Scott Cawthon).
 * @returns {object} Objeto do animatronic selecionado
 */
function getRandomAnimatronic() {
  // O sorteio normal exclui Ennard e Scott Cawthon
  const regularAnimatronics = ANIMATRONICS.filter(a => a.name !== 'Ennard' && a.name !== 'Scott Cawthon');
  const randomIndex = Math.floor(Math.random() * regularAnimatronics.length);
  return { ...regularAnimatronics[randomIndex] };
}

/**
 * Retorna um animatronic aleatório do roster padrão garantidamente DIFERENTE do atual.
 * @param {string} currentName - Nome do animatronic a excluir
 * @returns {object} Objeto do novo animatronic selecionado
 */
function getRandomDifferentAnimatronic(currentName) {
  if (!currentName) return getRandomAnimatronic();

  // Exclui Ennard, Scott Cawthon e o animatronic atual do sorteio normal
  const filtered = ANIMATRONICS.filter(
    a => a.name !== 'Ennard' && a.name !== 'Scott Cawthon' && a.name.toLowerCase() !== currentName.toLowerCase()
  );

  const randomIndex = Math.floor(Math.random() * filtered.length);
  return { ...filtered[randomIndex] };
}

/**
 * Procura os dados padrão de um animatronic pelo nome (incluindo Golden Freddy se solicitado).
 * @param {string} name - Nome do animatronic
 * @returns {object|null}
 */
function getAnimatronicByName(name) {
  if (!name) return null;
  if (name.toLowerCase() === 'golden freddy') {
    return { ...GOLDEN_FREDDY };
  }
  const found = ANIMATRONICS.find(a => a.name.toLowerCase() === name.toLowerCase());
  return found ? { ...found } : null;
}

/**
 * Calcula o dano aleatório gerado dentro da margem (minDamage a maxDamage) do animatronic.
 * @param {object} animatronic - Objeto do animatronic
 * @returns {number} Valor de dano sorteado
 */
function rollDamage(animatronic) {
  if (animatronic.name === 'Golden Freddy') return 100;
  const min = animatronic.minDamage;
  const max = animatronic.maxDamage;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Converte links de página do Tenor em URLs diretas de ficheiro de imagem/GIF para o Discord Embed.
 * @param {string} url - URL do GIF
 * @returns {Promise<string>} URL direta de imagem/GIF
 */
async function resolveDirectGifUrl(url) {
  if (!url || typeof url !== 'string' || url === 'COLOCAR_URL_AQUI') return null;

  // 1. Se já for uma URL direta de CDN de media (ex: media.giphy.com, media.tenor.com, media1.tenor.com, i.imgur.com)
  if (
    url.includes('giphy.com') ||
    url.includes('media.tenor.com') ||
    url.includes('media1.tenor.com') ||
    url.includes('c.tenor.com') ||
    url.includes('i.imgur.com')
  ) {
    return url;
  }

  // 2. Se for um link de página do Tenor sem ser CDN direto (ex: tenor.com/ZHXs.gif ou tenor.com/view/...)
  if (url.includes('tenor.com')) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: AbortSignal.timeout(2000)
      });
      const html = await response.text();
      const match = html.match(/og:image\x22 content=\x22([^\x22]+)\x22/) || html.match(/content=\x22([^\x22]+\.gif[^\x22]*)\x22/);
      if (match && match[1]) {
        return match[1];
      }
    } catch (err) {
      console.warn(`[AVISO] Não foi possível resolver o link do Tenor (${url}):`, err.message);
    }
    return null;
  }

  // 3. Caso geral para outras imagens com extensão direta de ficheiro (.gif, .png, .jpg, .webp)
  const cleanUrl = url.split('?')[0].toLowerCase();
  const isDirectImage = ['.gif', '.png', '.jpg', '.webp'].some(ext => cleanUrl.endsWith(ext));
  if (isDirectImage) {
    return url;
  }

  return null;
}

/**
 * Retorna a lista completa de todos os animatronics (incluindo Golden Freddy).
 * @returns {Array<object>}
 */
function getAllAnimatronics() {
  return [...ANIMATRONICS, { ...GOLDEN_FREDDY }];
}

const MIMIC_EXCLUDED_NAMES = ['Golden Freddy', 'Ennard', 'The Mimic', 'Scott Cawthon'];

module.exports = {
  GOLDEN_FREDDY,
  ANIMATRONICS,
  FUNTIME_NAMES,
  MANGLE_COPIABLE_NAMES,
  MIMIC_EXCLUDED_NAMES,
  getRandomAnimatronic,
  getRandomDifferentAnimatronic,
  getAnimatronicByName,
  getAllAnimatronics,
  rollDamage,
  resolveDirectGifUrl
};
