/**
 * Módulo com a definição do roster de Animatronics e lógica do jogo FNAF PvP.
 */

// Objeto especial para o Golden Freddy (Animatronic Secreto com 3% de chance)
const GOLDEN_FREDDY = {
  name: 'Golden Freddy',
  emoji: '✨',
  minDamage: 75,
  maxDamage: 75,
  description: 'Lendário e extremamente raro. Inflige 75 de dano fixo ignorando qualquer defesa e concede invencibilidade ao atacante.',
  gif: 'https://media.giphy.com/media/VsvjvEa5FF3lTcjdov/giphy.gif',
  power: {
    name: 'Golden Jumpscare',
    chance: 0.03, // 3%
    description: 'Aparece com 3% de probabilidade: causa 75 de dano fixo ao alvo, ignorando qualquer defesa, e concede ao atacante 2 turnos de invencibilidade total.'
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
      description: 'Causa +4 de dano direto ao alvo (reduzido para +2 por Resistência) e envenena-o por 3 rondas (5 de dano por turno, 15 de dano contínuo total).'
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
      description: 'Cega o alvo por 2 ataques — em cada tentativa de ataque realizada pelo alvo durante esse período, ele sofre 17 de dano próprio, ignorando resistência.'
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
      description: 'O próprio atacante fica imune a dano e reflete 1.5x qualquer dano que sofrer durante o próximo 1 ataque que receber como alvo.'
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
      description: 'Sorteia 50/50 entre imobilizar o alvo por 2 rondas ou confundi-lo com 1.5x de dano próprio no próximo ataque.'
    }
  },
  {
    name: 'Funtime Freddy',
    emoji: '🐻‍❄️',
    minDamage: 15,
    maxDamage: 21,
    description: 'Apresentador exuberante com o seu fantoche leal Bon-Bon.',
    gif: 'https://media.giphy.com/media/9d63c5mH2jY9wWzE4Z/giphy.gif',
    power: {
      name: 'Bon-Bon Rocket',
      chance: 0.11, // 11%
      description: 'Lança o Bon-Bon, copiando o poder especial de Funtime Chica ou Funtime Foxy e adicionando +6 de dano extra ao ataque.'
    }
  },
  {
    name: 'Funtime Foxy',
    emoji: '🦊',
    minDamage: 17,
    maxDamage: 23,
    description: 'Ator dramático com sobrecarga hidráulica devastadora.',
    gif: 'https://media.giphy.com/media/1d5RfZgmtYtA5JzE7a/giphy.gif',
    power: {
      name: 'Hydraulic Overload',
      chance: 0.06, // 6%
      description: 'Curar +9 HP ao atacante e envenena o alvo por 1 ronda com 2.5x do dano principal em envenenamento hidráulico (no-resist).'
    }
  },
  {
    name: 'Glamrock Freddy',
    emoji: '🎤',
    minDamage: 14,
    maxDamage: 20,
    description: 'Protetor robusto dos guardas noturnos com escotilha torácica protetora.',
    gif: 'https://media.giphy.com/media/0e3x0k6485Y1J6d56Z/giphy.gif',
    power: {
      name: 'Stomach Hatch Protect',
      chance: 0.09, // 9%
      description: 'Engole o próximo ataque recebido e devolve-o duplicado (2x) como dano de contra-ataque ao agressor.'
    }
  },
  {
    name: 'Glamrock Chica',
    emoji: '🎸',
    minDamage: 11,
    maxDamage: 17,
    description: 'Devoradora de lixo e sobrevivente insaciável.',
    gif: 'https://media.giphy.com/media/7EsrkwGqL82GONjDOR/giphy.gif',
    power: {
      name: 'Garbage Gobble',
      chance: 0.11, // 11%
      description: 'Se o atacante estiver com vida crítica (<20% HP), não pode morrer (HP mín 1) e causa 2x de dano pelos próximos 2 ataques.'
    }
  },
  {
    name: 'Roxy',
    emoji: '🏎️',
    minDamage: 15,
    maxDamage: 21,
    description: 'Competidora confiante com visão aperfeiçoada de raios-X.',
    gif: 'https://media.giphy.com/media/0e3x0k6485Y1J6d56Z/giphy.gif',
    power: {
      name: "Roxy's Eyes",
      chance: 0.08, // 8%
      description: 'Limpa todos os efeitos negativos do atacante e confunde o alvo (+9 de auto-dano no próximo ataque).'
    }
  },
  {
    name: 'Monty',
    emoji: '🐊',
    minDamage: 16,
    maxDamage: 22,
    description: 'Baixista agressivo com fúria incontrolável de crocodilo.',
    gif: 'https://media.giphy.com/media/0e3x0k6485Y1J6d56Z/giphy.gif',
    power: {
      name: 'Monty Thrash',
      chance: 0.12, // 12%
      description: 'Causa +10 de dano fixo adicional ao ataque (fúria 30%) e ativa esquiva para o próprio atacante no próximo turno.'
    }
  },
  {
    name: 'Sundrop/Moondrop',
    emoji: '☀️',
    minDamage: 13,
    maxDamage: 19,
    description: 'Monitor da creche com dupla personalidade solar e lunar.',
    gif: 'https://media.giphy.com/media/0e3x0k6485Y1J6d56Z/giphy.gif',
    power: {
      name: 'Day/Night Shift',
      chance: 0.06, // 6%
      description: 'Sorteia 50/50 entre Modo Sun (+15 HP de cura ao atacante) ou Modo Moon (cega por 2 rondas + 2.5x dano ao alvo).'
    }
  },
  {
    name: 'Vanny',
    emoji: '🔪',
    minDamage: 12,
    maxDamage: 18,
    description: 'Seguidora mascarada que manipula e hackeia o sistema do jogo.',
    gif: 'https://media.giphy.com/media/0e3x0k6485Y1J6d56Z/giphy.gif',
    power: {
      name: 'Glitch Override',
      chance: 0.12, // 12%
      description: 'Hackeia o alvo por 2 ataques — qualquer ataque realizado pelo alvo causará 50% de auto-dano extra a ele próprio.'
    }
  },
  {
    name: 'Security Puppet',
    emoji: '🎁',
    minDamage: 10,
    maxDamage: 16,
    description: 'Marionete de segurança protetora que cura e retarda ações.',
    gif: 'https://media.giphy.com/media/0e3x0k6485Y1J6d56Z/giphy.gif',
    power: {
      name: 'Security Healing',
      chance: 0.13, // 13%
      description: 'Restaura +40 HP ao atacante (até 100 HP) e impõe cooldown duplo (2 min) no próximo ataque do atacante.'
    }
  },
  {
    name: 'The Mimic',
    emoji: '🤖',
    minDamage: 15,
    maxDamage: 23,
    description: 'Entidade de inteligência artificial que aprende e replica comportamentos.',
    gif: 'https://media.giphy.com/media/0e3x0k6485Y1J6d56Z/giphy.gif',
    power: {
      name: 'Data Copy',
      chance: 0.03, // 3%
      description: 'Copia o poder especial de qualquer animatronic do roster (exceto Golden Freddy, Ennard, The Mimic e Scott Cawthon) e duplica (2x) todos os seus valores numéricos de dano.'
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
    description: 'O criador. A entidade mais poderosa do jogo — reescreve as regras a seu favor sempre que aparece. Requer a coleção completa (incluindo Golden Freddy e Ennard) para ter hipótese de surgir.',
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
  const rawClean = name.trim().toLowerCase();
  const textOnly = name.replace(/[^\w\s/.-]/gi, '').trim().toLowerCase();

  if (rawClean === 'golden freddy' || textOnly === 'golden freddy') {
    return { ...GOLDEN_FREDDY };
  }

  const found = ANIMATRONICS.find(a => {
    const aRaw = a.name.trim().toLowerCase();
    const aText = a.name.replace(/[^\w\s/.-]/gi, '').trim().toLowerCase();
    return aRaw === rawClean || (textOnly && aText === textOnly);
  });

  return found ? { ...found } : null;
}

/**
 * Calcula o dano aleatório gerado dentro da margem (minDamage a maxDamage) do animatronic.
 * @param {object} animatronic - Objeto do animatronic
 * @returns {number} Valor de dano sorteado
 */
function rollDamage(animatronic) {
  if (animatronic.name === 'Golden Freddy') return 75;
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
