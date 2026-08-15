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
    description: 'Aparece com 1% de probabilidade e aplica Instakill imediato (100 de dano), reduzindo instantaneamente o HP do oponente a 0!'
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
      description: 'Paralisa o alvo durante 2 ataques dele e causa 10 de dano de choque adicional (reduzido para 5 se o alvo tiver Resistência ativa do Springlock Guilty).'
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
      description: 'O atacante esquiva-se do próximo ataque recebido (ignora completamente o dano).'
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
      description: 'Causa 16 de dano explosivo extra ao alvo (reduzido para 8 se o alvo tiver Resistência ativa do Springlock Guilty).'
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
      description: 'O alvo fica confuso no próximo ataque que desferir: o dano vira-se contra ele próprio.'
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
      description: 'Ganha resistência: no próximo poder especial recebido de outro jogador (exceto Golden Freddy e poderes que ignoram resistência explicitamente), o dano é dividido por 2.'
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
      description: 'Imobiliza o alvo durante 2 ataques dele e causa 5 de dano adicional em cada um desses turnos bloqueados (10 no total).'
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
      description: 'Multiplica o dano deste ataque por 2x e ignora a esquiva do alvo.'
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
      description: 'Copia aleatoriamente o poder de um dos Toys (Toy Freddy, Toy Chica, Toy Bonnie e Balloon Boy).'
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
      description: 'Cura 15 HP ao atacante (até ao máximo de 100 HP).'
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
      description: 'Causa 4 de dano direto inicial e envenena o alvo durante 3 rondas (8 de dano por ronda).'
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
      description: 'Cega o alvo durante os próximos 2 ataques dele (sofrerá 14 de dano por cada ataque tentado), ignorando resistência.'
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
      chance: 0.09, // 9% (Ajustado para balanceamento)
      description: 'Aprisiona o alvo com a garra hidráulica durante 2 rondas — o alvo fica impedido de usar /atacar nesse período — e causa 2x o dano principal do ataque, ignorando esquiva e resistência.'
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
      chance: 0.08, // 8% (Ajustado para balanceamento)
      description: 'O próprio atacante (quem usa a Ballora) fica imune a dano e reflete 1.5x qualquer dano que sofrer, durante os próximos 2 ataques que receber como alvo — não afeta o alvo deste ataque atual.'
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
      description: 'Sorteia entre hipnotizar o alvo (imobiliza 2 rondas) ou confundi-lo (próximo ataque reflete com 1.5x dano).'
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
      chance: 0.11, // 11% (Ajustado para balanceamento)
      description: 'Copia o poder especial da Funtime Chica ou da Funtime Foxy, somando +6 de dano adicional ao ataque.'
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
      description: 'Cura 9 HP ao próprio atacante e envenena o alvo por 1 ronda com dano equivalente a 2.5x o dano principal, ignorando resistência.'
    }
  },
  {
    name: 'Glamrock Freddy',
    emoji: '🎤',
    minDamage: 14,
    maxDamage: 20,
    description: 'Líder dos Glamrocks com a escotilha torácica protetora.',
    gif: 'https://media.giphy.com/media/VnNxHtrNStgRj9pYpG/giphy.gif',
    power: {
      name: 'Stomach Hatch Protect',
      chance: 0.09, // 9%
      description: 'Engole o próximo ataque recebido e devolve-o triplicado (3x) como dano ao agressor, aplicando-lhe 2 rondas de cooldown duplo (2 min de espera).'
    }
  },
  {
    name: 'Glamrock Chica',
    emoji: '🎸',
    minDamage: 11,
    maxDamage: 17,
    description: 'Guitarrista voraz que resiste aos danos mais críticos.',
    gif: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
    power: {
      name: 'Garbage Gobble',
      chance: 0.11, // 11%
      description: 'Se o HP do atacante estiver abaixo de 20%, impede-o de morrer (HP mínimo 1) durante os próximos 3 ataques sofridos e duplica (2x) o dano do seu próprio ataque nesse período.'
    }
  },
  {
    name: 'Roxy',
    emoji: '🏎️',
    minDamage: 15,
    maxDamage: 21,
    description: 'Pilota narcisista com visão de raios-X e deteção de falhas.',
    gif: 'https://media.giphy.com/media/26n6WywJyh39n1pBu/giphy.gif',
    power: {
      name: "Roxy's Eyes",
      chance: 0.08, // 8%
      description: 'Anula qualquer efeito negativo ativo no atacante e confunde o alvo no próximo ataque com +9 de dano auto-infligido.'
    }
  },
  {
    name: 'Monty',
    emoji: '🐊',
    minDamage: 16,
    maxDamage: 22,
    description: 'Baixista agressivo com investidas violentas e saltos devastadores.',
    gif: 'https://media.giphy.com/media/3o6Zt8zHP6tXQdKjfi/giphy.gif',
    power: {
      name: 'Monty Thrash',
      chance: 0.15, // 15%
      description: 'Causa +15 de dano fixo adicional ao ataque com um potente chute aéreo com 30% de fúria.'
    }
  },
  {
    name: 'Sundrop/Moondrop',
    emoji: '☀️',
    minDamage: 13,
    maxDamage: 19,
    description: 'Animatronic de personalidade dupla que alterna entre luz e trevas.',
    gif: 'https://media.giphy.com/media/d1E1msGYEOw80/giphy.gif',
    power: {
      name: 'Day/Night Shift',
      chance: 0.06, // 6%
      description: 'Sorteia 50/50 entre Modo Sun (cura +15 HP ao atacante) ou Modo Moon (cega o alvo por 2 turnos e triplica 3x o dano deste ataque).'
    }
  },
  {
    name: 'Vanny',
    emoji: '🔪',
    minDamage: 12,
    maxDamage: 18,
    description: 'Seguidora mascarada que corrompe o sistema de combate.',
    gif: 'https://media.giphy.com/media/13Hgw8T855u520/giphy.gif',
    power: {
      name: 'Glitch Override',
      chance: 0.12, // 12%
      description: 'Aplica o estado Hackeado ao alvo por 3 ataques — o alvo sofre 50% de auto-dano adicional em cada ataque que realizar nesse período.'
    }
  },
  {
    name: 'Security Puppet',
    emoji: '🎁',
    minDamage: 10,
    maxDamage: 16,
    description: 'Guardião de emergência que restaura sistemas críticos.',
    gif: 'https://media.giphy.com/media/3o7TKs38gPfQDknvwk/giphy.gif',
    power: {
      name: 'Security Healing',
      chance: 0.13, // 13%
      description: 'Restaura instantaneamente o HP do atacante para 100 HP, mas o seu próximo ataque terá cooldown duplicado (2 minutos).'
    }
  },
  {
    name: 'The Mimic',
    emoji: '🤖',
    minDamage: 15,
    maxDamage: 23,
    description: 'Endosqueleto antigo capaz de replicar qualquer padrão de combate.',
    gif: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
    power: {
      name: 'Data Copy',
      chance: 0.04, // 4%
      description: 'Copia o poder de qualquer animatronic do roster (exceto Golden Freddy e Ennard) e duplica 2x os seus valores de dano numéricos.'
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
      description: 'Ativa-se automaticamente na ronda seguinte a qualquer Funtime (Baby, Ballora, Funtime Freddy, Funtime Chica, Funtime Foxy), herdando aleatoriamente um dos 5 poderes principais com 100% de certeza.'
    }
  }
];

const FUNTIME_NAMES = ['Circus Baby', 'Ballora', 'Funtime Chica', 'Funtime Freddy', 'Funtime Foxy'];
const MANGLE_COPIABLE_NAMES = ['Toy Chica', 'Toy Bonnie', 'Toy Freddy', 'Balloon Boy'];

/**
 * Retorna um animatronic aleatório do roster padrão (exclui Golden Freddy).
 * @returns {object} Objeto do animatronic selecionado
 */
function getRandomAnimatronic() {
  // O sorteio normal exclui Ennard (já que Ennard só aparece via gatilho ennard_pending)
  const regularAnimatronics = ANIMATRONICS.filter(a => a.name !== 'Ennard');
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

  // Exclui Ennard e o animatronic atual do sorteio normal
  const filtered = ANIMATRONICS.filter(
    a => a.name !== 'Ennard' && a.name.toLowerCase() !== currentName.toLowerCase()
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

const MIMIC_EXCLUDED_NAMES = ['Golden Freddy', 'Ennard', 'The Mimic'];

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
