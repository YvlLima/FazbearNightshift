const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');
const { getRandomDifferentAnimatronic, getAnimatronicByName, GOLDEN_FREDDY } = require('./game/fnaf');

const dbPath = path.join(__dirname, 'fnaf.db');
const FIXED_PLAYER_MAX_HP = 100;

/**
 * Converte o campo animatronics_history em objeto mapa { "Animatronic": count }.
 * Suporta retrocompatibilidade com arrays legados e mapas JSON.
 */
function parseAnimatronicsHistory(rawJson) {
  if (!rawJson) return {};
  try {
    const parsed = JSON.parse(rawJson);
    if (Array.isArray(parsed)) {
      const map = {};
      for (const name of parsed) {
        if (typeof name === 'string' && name.trim()) {
          map[name] = 1;
        }
      }
      return map;
    } else if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
  } catch (e) {}
  return {};
}

/**
 * Converte o campo seen_animatronics em array de strings com os animatronics do ciclo atual.
 */
function parseCurrentSeenList(rawJson) {
  if (!rawJson) return [];
  try {
    const parsed = JSON.parse(rawJson);
    if (Array.isArray(parsed)) {
      return parsed.filter(name => typeof name === 'string' && name.trim());
    } else if (typeof parsed === 'object' && parsed !== null) {
      return Object.keys(parsed);
    }
  } catch (e) {}
  return [];
}

let sqlEngine;
let rawDb;

/**
 * Script de criação da tabela de jogadores para o jogo FNAF PvP com poderes, efeitos, invencibilidade, envenenamento, cegueira e contagem de KOs (kills).
 */
const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS players (
    user_id TEXT PRIMARY KEY,
    animatronic TEXT DEFAULT NULL,
    current_hp INTEGER NOT NULL DEFAULT ${FIXED_PLAYER_MAX_HP},
    max_hp INTEGER NOT NULL DEFAULT ${FIXED_PLAYER_MAX_HP},
    min_damage INTEGER NOT NULL DEFAULT 0,
    max_damage INTEGER NOT NULL DEFAULT 0,
    last_attack INTEGER NOT NULL DEFAULT 0,
    stunned_turns INTEGER NOT NULL DEFAULT 0,
    stun_dot INTEGER NOT NULL DEFAULT 0,
    confused_turns INTEGER NOT NULL DEFAULT 0,
    confused_multiplier REAL NOT NULL DEFAULT 1.0,
    evade_next INTEGER NOT NULL DEFAULT 0,
    resist_next_power INTEGER NOT NULL DEFAULT 0,
    invincible_turns INTEGER NOT NULL DEFAULT 0,
    poisoned_turns INTEGER NOT NULL DEFAULT 0,
    poison_damage INTEGER NOT NULL DEFAULT 8,
    blinded_turns INTEGER NOT NULL DEFAULT 0,
    reflect_turns INTEGER NOT NULL DEFAULT 0,
    immune_turns INTEGER NOT NULL DEFAULT 0,
    ennard_pending INTEGER NOT NULL DEFAULT 0,
    ennard_unlocked INTEGER NOT NULL DEFAULT 0,
    funtimes_seen TEXT NOT NULL DEFAULT '[]',
    seen_animatronics TEXT NOT NULL DEFAULT '[]',
    animatronics_history TEXT NOT NULL DEFAULT '{}',
    kills INTEGER NOT NULL DEFAULT 0,
    total_attacks INTEGER NOT NULL DEFAULT 0,
    total_wins INTEGER NOT NULL DEFAULT 0,
    total_deaths INTEGER NOT NULL DEFAULT 0,
    stomach_protect_turns INTEGER NOT NULL DEFAULT 0,
    double_cooldown_turns INTEGER NOT NULL DEFAULT 0,
    life_saver_turns INTEGER NOT NULL DEFAULT 0,
    double_damage_turns INTEGER NOT NULL DEFAULT 0,
    extra_self_damage INTEGER NOT NULL DEFAULT 0,
    hacked_turns INTEGER NOT NULL DEFAULT 0,
    scott_unlocked INTEGER NOT NULL DEFAULT 0,
    reduced_cooldown_attacks_remaining INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS duel_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attacker_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    animatronic TEXT NOT NULL,
    damage INTEGER NOT NULL,
    was_ko INTEGER NOT NULL DEFAULT 0,
    timestamp INTEGER NOT NULL
  );
`;

let saveTimer = null;
let isDirty = false;
const DEBOUNCE_MS = 1500;

/**
 * Força a gravação imediata em disco de quaisquer dados pendentes na memória RAM.
 */
const flushDatabase = () => {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (rawDb && isDirty) {
    try {
      const data = rawDb.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
      isDirty = false;
    } catch (err) {
      console.error('❌ Erro ao salvar base de dados em disco:', err.message);
    }
  }
};

/**
 * Agenda a gravação em disco com debounce de 1.5s para otimizar operações I/O síncronas.
 */
const saveDatabase = () => {
  isDirty = true;
  if (!saveTimer) {
    saveTimer = setTimeout(() => {
      flushDatabase();
    }, DEBOUNCE_MS);
  }
};

// Handlers de encerramento do processo para garantir que zero dados são perdidos
process.on('SIGINT', () => {
  flushDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  flushDatabase();
  process.exit(0);
});

process.on('beforeExit', () => {
  flushDatabase();
});

const filebuffer = fs.existsSync(dbPath) ? fs.readFileSync(dbPath) : null;

let dbReadyPromise = initSqlJs().then(SQL => {
  sqlEngine = SQL;
  rawDb = new SQL.Database(filebuffer);

  try {
    const checkStmt = rawDb.prepare("PRAGMA table_info(players);");
    let hasPoisoned = false;
    let hasBlinded = false;
    let hasKills = false;
    let hasReflect = false;
    let hasImmune = false;
    let hasConfusedMult = false;
    let hasPoisonDamage = false;
    let hasEnnardPending = false;
    let hasEnnardUnlocked = false;
    let hasFuntimesSeen = false;
    let hasSeenAnimatronics = false;
    let hasTotalAttacks = false;
    let hasTotalWins = false;
    let hasTotalDeaths = false;
    let hasStomachProtect = false;
    let hasDoubleCooldown = false;
    let hasLifeSaver = false;
    let hasDoubleDamage = false;
    let hasExtraSelfDamage = false;
    let hasHackedTurns = false;
    let hasScottUnlocked = false;
    let hasReducedCooldown = false;
    let hasAnimatronicsHistory = false;

    while (checkStmt.step()) {
      const obj = checkStmt.getAsObject();
      if (obj.name === 'poisoned_turns') hasPoisoned = true;
      if (obj.name === 'blinded_turns') hasBlinded = true;
      if (obj.name === 'kills') hasKills = true;
      if (obj.name === 'reflect_turns') hasReflect = true;
      if (obj.name === 'immune_turns') hasImmune = true;
      if (obj.name === 'confused_multiplier') hasConfusedMult = true;
      if (obj.name === 'poison_damage') hasPoisonDamage = true;
      if (obj.name === 'ennard_pending') hasEnnardPending = true;
      if (obj.name === 'ennard_unlocked') hasEnnardUnlocked = true;
      if (obj.name === 'funtimes_seen') hasFuntimesSeen = true;
      if (obj.name === 'seen_animatronics') hasSeenAnimatronics = true;
      if (obj.name === 'animatronics_history') hasAnimatronicsHistory = true;
      if (obj.name === 'total_attacks') hasTotalAttacks = true;
      if (obj.name === 'total_wins') hasTotalWins = true;
      if (obj.name === 'total_deaths') hasTotalDeaths = true;
      if (obj.name === 'stomach_protect_turns') hasStomachProtect = true;
      if (obj.name === 'double_cooldown_turns') hasDoubleCooldown = true;
      if (obj.name === 'life_saver_turns') hasLifeSaver = true;
      if (obj.name === 'double_damage_turns') hasDoubleDamage = true;
      if (obj.name === 'extra_self_damage') hasExtraSelfDamage = true;
      if (obj.name === 'hacked_turns') hasHackedTurns = true;
      if (obj.name === 'scott_unlocked') hasScottUnlocked = true;
      if (obj.name === 'reduced_cooldown_attacks_remaining') hasReducedCooldown = true;
    }
    checkStmt.free();

    if (!hasPoisoned || !hasBlinded || !hasKills || !hasReflect || !hasImmune || !hasConfusedMult || !hasPoisonDamage || !hasEnnardPending || !hasEnnardUnlocked || !hasFuntimesSeen || !hasSeenAnimatronics || !hasAnimatronicsHistory || !hasTotalAttacks || !hasTotalWins || !hasTotalDeaths || !hasStomachProtect || !hasDoubleCooldown || !hasLifeSaver || !hasDoubleDamage || !hasExtraSelfDamage || !hasHackedTurns || !hasScottUnlocked || !hasReducedCooldown) {
      console.log('🔄 A atualizar estrutura da tabela com os novos campos...');
      try {
        if (!hasPoisoned) rawDb.run("ALTER TABLE players ADD COLUMN poisoned_turns INTEGER NOT NULL DEFAULT 0;");
        if (!hasBlinded) rawDb.run("ALTER TABLE players ADD COLUMN blinded_turns INTEGER NOT NULL DEFAULT 0;");
        if (!hasKills) rawDb.run("ALTER TABLE players ADD COLUMN kills INTEGER NOT NULL DEFAULT 0;");
        if (!hasReflect) rawDb.run("ALTER TABLE players ADD COLUMN reflect_turns INTEGER NOT NULL DEFAULT 0;");
        if (!hasImmune) rawDb.run("ALTER TABLE players ADD COLUMN immune_turns INTEGER NOT NULL DEFAULT 0;");
        if (!hasConfusedMult) rawDb.run("ALTER TABLE players ADD COLUMN confused_multiplier REAL NOT NULL DEFAULT 1.0;");
        if (!hasPoisonDamage) rawDb.run("ALTER TABLE players ADD COLUMN poison_damage INTEGER NOT NULL DEFAULT 8;");
        if (!hasEnnardPending) rawDb.run("ALTER TABLE players ADD COLUMN ennard_pending INTEGER NOT NULL DEFAULT 0;");
        if (!hasEnnardUnlocked) rawDb.run("ALTER TABLE players ADD COLUMN ennard_unlocked INTEGER NOT NULL DEFAULT 0;");
        if (!hasFuntimesSeen) rawDb.run("ALTER TABLE players ADD COLUMN funtimes_seen TEXT NOT NULL DEFAULT '[]';");
        if (!hasSeenAnimatronics) rawDb.run("ALTER TABLE players ADD COLUMN seen_animatronics TEXT NOT NULL DEFAULT '[]';");
        if (!hasAnimatronicsHistory) {
          rawDb.run("ALTER TABLE players ADD COLUMN animatronics_history TEXT NOT NULL DEFAULT '{}';");
          try {
            const stmt = rawDb.prepare("SELECT user_id, seen_animatronics FROM players;");
            const migrations = [];
            while (stmt.step()) {
              migrations.push(stmt.getAsObject());
            }
            stmt.free();
            for (const row of migrations) {
              const map = parseAnimatronicsHistory(row.seen_animatronics);
              rawDb.run("UPDATE players SET animatronics_history = ? WHERE user_id = ?", [JSON.stringify(map), row.user_id]);
            }
          } catch (migErr) {}
        }
        if (!hasTotalAttacks) rawDb.run("ALTER TABLE players ADD COLUMN total_attacks INTEGER NOT NULL DEFAULT 0;");
        if (!hasTotalWins) rawDb.run("ALTER TABLE players ADD COLUMN total_wins INTEGER NOT NULL DEFAULT 0;");
        if (!hasTotalDeaths) rawDb.run("ALTER TABLE players ADD COLUMN total_deaths INTEGER NOT NULL DEFAULT 0;");
        if (!hasStomachProtect) rawDb.run("ALTER TABLE players ADD COLUMN stomach_protect_turns INTEGER NOT NULL DEFAULT 0;");
        if (!hasDoubleCooldown) rawDb.run("ALTER TABLE players ADD COLUMN double_cooldown_turns INTEGER NOT NULL DEFAULT 0;");
        if (!hasLifeSaver) rawDb.run("ALTER TABLE players ADD COLUMN life_saver_turns INTEGER NOT NULL DEFAULT 0;");
        if (!hasDoubleDamage) rawDb.run("ALTER TABLE players ADD COLUMN double_damage_turns INTEGER NOT NULL DEFAULT 0;");
        if (!hasExtraSelfDamage) rawDb.run("ALTER TABLE players ADD COLUMN extra_self_damage INTEGER NOT NULL DEFAULT 0;");
        if (!hasHackedTurns) rawDb.run("ALTER TABLE players ADD COLUMN hacked_turns INTEGER NOT NULL DEFAULT 0;");
        if (!hasScottUnlocked) rawDb.run("ALTER TABLE players ADD COLUMN scott_unlocked INTEGER NOT NULL DEFAULT 0;");
        if (!hasReducedCooldown) rawDb.run("ALTER TABLE players ADD COLUMN reduced_cooldown_attacks_remaining INTEGER NOT NULL DEFAULT 0;");
      } catch (e) {
        console.error('Erro na migração:', e.message);
      }
    }
  } catch (err) {
    // Tabela não existia
  }

  rawDb.run(CREATE_TABLE_SQL);
  saveDatabase();
});

const dbAdapter = {
  type: 'sql.js',
  async init() {
    await dbReadyPromise;
  },

  getOrCreatePlayer(userId) {
    const stmt = rawDb.prepare('SELECT * FROM players WHERE user_id = :userId');
    stmt.bind({ ':userId': userId });

    let player = null;
    if (stmt.step()) {
      player = stmt.getAsObject();
    }
    stmt.free();

    if (!player) {
      rawDb.run(
        `INSERT INTO players (user_id, animatronic, current_hp, max_hp, min_damage, max_damage, last_attack, stunned_turns, stun_dot, confused_turns, confused_multiplier, evade_next, resist_next_power, invincible_turns, poisoned_turns, poison_damage, blinded_turns, reflect_turns, immune_turns, ennard_pending, ennard_unlocked, funtimes_seen, seen_animatronics, kills, total_attacks, total_wins, stomach_protect_turns, double_cooldown_turns, life_saver_turns, double_damage_turns, extra_self_damage, hacked_turns, scott_unlocked, reduced_cooldown_attacks_remaining)
         VALUES (?, NULL, ?, ?, 0, 0, 0, 0, 0, 0, 1.0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, '[]', '[]', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)`,
        [
          userId,
          FIXED_PLAYER_MAX_HP,
          FIXED_PLAYER_MAX_HP
        ]
      );
      saveDatabase();
      return this.getOrCreatePlayer(userId);
    }

    if (player.animatronic) {
      const animData = getAnimatronicByName(player.animatronic);
      player.emoji = animData ? animData.emoji : '🤖';
    } else {
      player.emoji = '';
    }

    return player;
  },

  assignGoldenFreddy(userId) {
    this.getOrCreatePlayer(userId);
    rawDb.run(
      `UPDATE players SET animatronic = 'Golden Freddy', min_damage = 75, max_damage = 75, updated_at = datetime('now') WHERE user_id = ?`,
      [userId]
    );
    saveDatabase();
    return this.getOrCreatePlayer(userId);
  },

  assignEnnard(userId) {
    this.getOrCreatePlayer(userId);
    const ennardData = getAnimatronicByName('Ennard');
    const minDmg = ennardData ? ennardData.minDamage : 16;
    const maxDmg = ennardData ? ennardData.maxDamage : 24;

    rawDb.run(
      `UPDATE players SET animatronic = 'Ennard', min_damage = ?, max_damage = ?, updated_at = datetime('now') WHERE user_id = ?`,
      [minDmg, maxDmg, userId]
    );
    saveDatabase();
    return this.getOrCreatePlayer(userId);
  },

  assignScott(userId) {
    this.getOrCreatePlayer(userId);
    const scottData = getAnimatronicByName('Scott Cawthon');
    const minDmg = scottData ? scottData.minDamage : 100;
    const maxDmg = scottData ? scottData.maxDamage : 100;

    rawDb.run(
      `UPDATE players SET animatronic = 'Scott Cawthon', min_damage = ?, max_damage = ?, updated_at = datetime('now') WHERE user_id = ?`,
      [minDmg, maxDmg, userId]
    );
    saveDatabase();
    return this.getOrCreatePlayer(userId);
  },

  assignNewDifferentAnimatronic(userId) {
    const currentPlayer = this.getOrCreatePlayer(userId);
    const currentName = currentPlayer ? currentPlayer.animatronic : null;
    const newAnim = getRandomDifferentAnimatronic(currentName);

    rawDb.run(
      `UPDATE players SET animatronic = ?, min_damage = ?, max_damage = ?, updated_at = datetime('now') WHERE user_id = ?`,
      [newAnim.name, newAnim.minDamage, newAnim.maxDamage, userId]
    );
    saveDatabase();
    return this.getOrCreatePlayer(userId);
  },

  updatePlayerHp(userId, newHp) {
    this.getOrCreatePlayer(userId);
    rawDb.run(
      `UPDATE players SET current_hp = ?, updated_at = datetime('now') WHERE user_id = ?`,
      [newHp, userId]
    );
    saveDatabase();
    return this.getOrCreatePlayer(userId);
  },

  setLastAttack(userId, timestamp) {
    this.getOrCreatePlayer(userId);
    rawDb.run(
      `UPDATE players SET last_attack = ?, updated_at = datetime('now') WHERE user_id = ?`,
      [timestamp, userId]
    );
    saveDatabase();
    return this.getOrCreatePlayer(userId);
  },

  updatePlayerEffects(userId, effects = {}) {
    this.getOrCreatePlayer(userId);
    const player = this.getOrCreatePlayer(userId);

    const stunned_turns = effects.stunned_turns !== undefined ? effects.stunned_turns : player.stunned_turns;
    const stun_dot = effects.stun_dot !== undefined ? effects.stun_dot : player.stun_dot;
    const confused_turns = effects.confused_turns !== undefined ? effects.confused_turns : player.confused_turns;
    const confused_multiplier = effects.confused_multiplier !== undefined ? effects.confused_multiplier : (player.confused_multiplier || 1.0);
    const evade_next = effects.evade_next !== undefined ? effects.evade_next : player.evade_next;
    const resist_next_power = effects.resist_next_power !== undefined ? effects.resist_next_power : player.resist_next_power;
    const invincible_turns = effects.invincible_turns !== undefined ? effects.invincible_turns : player.invincible_turns;
    const poisoned_turns = effects.poisoned_turns !== undefined ? effects.poisoned_turns : player.poisoned_turns;
    const poison_damage = effects.poison_damage !== undefined ? effects.poison_damage : (player.poison_damage || 8);
    const blinded_turns = effects.blinded_turns !== undefined ? effects.blinded_turns : player.blinded_turns;
    const reflect_turns = effects.reflect_turns !== undefined ? effects.reflect_turns : player.reflect_turns;
    const immune_turns = effects.immune_turns !== undefined ? effects.immune_turns : player.immune_turns;
    const stomach_protect_turns = effects.stomach_protect_turns !== undefined ? effects.stomach_protect_turns : (player.stomach_protect_turns || 0);
    const double_cooldown_turns = effects.double_cooldown_turns !== undefined ? effects.double_cooldown_turns : (player.double_cooldown_turns || 0);
    const life_saver_turns = effects.life_saver_turns !== undefined ? effects.life_saver_turns : (player.life_saver_turns || 0);
    const double_damage_turns = effects.double_damage_turns !== undefined ? effects.double_damage_turns : (player.double_damage_turns || 0);
    const extra_self_damage = effects.extra_self_damage !== undefined ? effects.extra_self_damage : (player.extra_self_damage || 0);
    const hacked_turns = effects.hacked_turns !== undefined ? effects.hacked_turns : (player.hacked_turns || 0);

    rawDb.run(
      `UPDATE players SET stunned_turns = ?, stun_dot = ?, confused_turns = ?, confused_multiplier = ?, evade_next = ?, resist_next_power = ?, invincible_turns = ?, poisoned_turns = ?, poison_damage = ?, blinded_turns = ?, reflect_turns = ?, immune_turns = ?, stomach_protect_turns = ?, double_cooldown_turns = ?, life_saver_turns = ?, double_damage_turns = ?, extra_self_damage = ?, hacked_turns = ?, updated_at = datetime('now') WHERE user_id = ?`,
      [stunned_turns, stun_dot, confused_turns, confused_multiplier, evade_next, resist_next_power, invincible_turns, poisoned_turns, poison_damage, blinded_turns, reflect_turns, immune_turns, stomach_protect_turns, double_cooldown_turns, life_saver_turns, double_damage_turns, extra_self_damage, hacked_turns, userId]
    );
    saveDatabase();
    return this.getOrCreatePlayer(userId);
  },

  setEnnardPending(userId, pending) {
    this.getOrCreatePlayer(userId);
    rawDb.run(
      `UPDATE players SET ennard_pending = ?, updated_at = datetime('now') WHERE user_id = ?`,
      [pending ? 1 : 0, userId]
    );
    saveDatabase();
    return this.getOrCreatePlayer(userId);
  },

  setReducedCooldownAttacks(userId, count) {
    this.getOrCreatePlayer(userId);
    rawDb.run(
      `UPDATE players SET reduced_cooldown_attacks_remaining = ?, updated_at = datetime('now') WHERE user_id = ?`,
      [count, userId]
    );
    saveDatabase();
    return this.getOrCreatePlayer(userId);
  },

  decrementReducedCooldown(userId) {
    const player = this.getOrCreatePlayer(userId);
    if (player.reduced_cooldown_attacks_remaining > 0) {
      const nextCount = player.reduced_cooldown_attacks_remaining - 1;
      rawDb.run(
        `UPDATE players SET reduced_cooldown_attacks_remaining = ?, updated_at = datetime('now') WHERE user_id = ?`,
        [nextCount, userId]
      );
      saveDatabase();
    }
    return this.getOrCreatePlayer(userId);
  },

  recordAnimatronicSeen(userId, animName) {
    const { FUNTIME_NAMES, getAllAnimatronics } = require('./game/fnaf');
    const player = this.getOrCreatePlayer(userId);

    // 1. Contador histórico permanente (nunca é resetado)
    const historyMap = parseAnimatronicsHistory(player.animatronics_history);
    if (Object.keys(historyMap).length === 0 && player.seen_animatronics) {
      Object.assign(historyMap, parseAnimatronicsHistory(player.seen_animatronics));
    }
    historyMap[animName] = (historyMap[animName] || 0) + 1;

    // 2. Coleção do ciclo atual para desbloqueios (resetada pelo Scott)
    const currentSeenList = parseCurrentSeenList(player.seen_animatronics);
    if (!currentSeenList.includes(animName)) {
      currentSeenList.push(animName);
    }

    let funtimesList = [];
    try {
      funtimesList = JSON.parse(player.funtimes_seen || '[]');
      if (!Array.isArray(funtimesList)) funtimesList = [];
    } catch(e) {
      funtimesList = [];
    }

    if (FUNTIME_NAMES.includes(animName) && !funtimesList.includes(animName)) {
      funtimesList.push(animName);
    }

    const isEnnardUnlocked = FUNTIME_NAMES.every(name => funtimesList.includes(name));
    const requiredScottNames = getAllAnimatronics().filter(a => a.name !== 'Scott Cawthon').map(a => a.name);
    const isScottUnlocked = requiredScottNames.length > 0 && requiredScottNames.every(name => currentSeenList.includes(name));

    rawDb.run(
      `UPDATE players SET animatronics_history = ?, seen_animatronics = ?, funtimes_seen = ?, ennard_unlocked = ?, scott_unlocked = ?, updated_at = datetime('now') WHERE user_id = ?`,
      [JSON.stringify(historyMap), JSON.stringify(currentSeenList), JSON.stringify(funtimesList), isEnnardUnlocked ? 1 : 0, isScottUnlocked ? 1 : 0, userId]
    );
    saveDatabase();

    return { seenMap: historyMap, seenList: currentSeenList, funtimesList, ennardUnlocked: isEnnardUnlocked, scottUnlocked: isScottUnlocked };
  },

  getPlayerCollection(userId) {
    const { FUNTIME_NAMES, getAllAnimatronics } = require('./game/fnaf');
    const player = this.getOrCreatePlayer(userId);

    const historyMap = parseAnimatronicsHistory(player.animatronics_history);
    if (Object.keys(historyMap).length === 0 && player.seen_animatronics) {
      Object.assign(historyMap, parseAnimatronicsHistory(player.seen_animatronics));
    }

    const currentSeenList = parseCurrentSeenList(player.seen_animatronics);

    let funtimesList = [];
    try {
      funtimesList = JSON.parse(player.funtimes_seen || '[]');
      if (!Array.isArray(funtimesList)) funtimesList = [];
    } catch(e) {
      funtimesList = [];
    }

    const isEnnardUnlocked = Boolean(player.ennard_unlocked === 1 || FUNTIME_NAMES.every(name => funtimesList.includes(name)));

    const requiredScottNames = getAllAnimatronics().filter(a => a.name !== 'Scott Cawthon').map(a => a.name);
    const isScottUnlocked = Boolean(player.scott_unlocked === 1 || (requiredScottNames.length > 0 && requiredScottNames.every(name => currentSeenList.includes(name))));

    if (isScottUnlocked && player.scott_unlocked === 0) {
      rawDb.run(
        `UPDATE players SET scott_unlocked = 1, updated_at = datetime('now') WHERE user_id = ?`,
        [userId]
      );
      saveDatabase();
    }

    return {
      seenMap: historyMap,
      seenList: currentSeenList,
      funtimesList,
      ennardUnlocked: isEnnardUnlocked,
      scottUnlocked: isScottUnlocked
    };
  },

  recordFuntimeSeen(userId, animName) {
    return this.recordAnimatronicSeen(userId, animName);
  },

  hasUnlockedEnnard(userId) {
    const { FUNTIME_NAMES } = require('./game/fnaf');
    const player = this.getOrCreatePlayer(userId);
    if (player.ennard_unlocked === 1) return true;
    let seenList = [];
    try {
      seenList = JSON.parse(player.funtimes_seen || '[]');
      if (!Array.isArray(seenList)) seenList = [];
    } catch(e) {
      seenList = [];
    }
    return FUNTIME_NAMES.every(name => seenList.includes(name));
  },

  hasUnlockedScott(userId) {
    const { getAllAnimatronics } = require('./game/fnaf');
    const player = this.getOrCreatePlayer(userId);
    if (player.scott_unlocked === 1) return true;
    const currentSeenList = parseCurrentSeenList(player.seen_animatronics);
    const requiredScottNames = getAllAnimatronics().filter(a => a.name !== 'Scott Cawthon').map(a => a.name);
    const isUnlocked = requiredScottNames.length > 0 && requiredScottNames.every(name => currentSeenList.includes(name));
    if (isUnlocked && player.scott_unlocked === 0) {
      rawDb.run(
        `UPDATE players SET scott_unlocked = 1, updated_at = datetime('now') WHERE user_id = ?`,
        [userId]
      );
      saveDatabase();
    }
    return isUnlocked;
  },

  resetEnnardProgress(userId) {
    const { getAllAnimatronics } = require('./game/fnaf');
    const player = this.getOrCreatePlayer(userId);

    const historyMap = parseAnimatronicsHistory(player.animatronics_history);
    historyMap['Ennard'] = (historyMap['Ennard'] || 0) + 1;

    const currentSeenList = parseCurrentSeenList(player.seen_animatronics);
    if (!currentSeenList.includes('Ennard')) {
      currentSeenList.push('Ennard');
    }

    const requiredScottNames = getAllAnimatronics().filter(a => a.name !== 'Scott Cawthon').map(a => a.name);
    const isScottUnlocked = requiredScottNames.length > 0 && requiredScottNames.every(name => currentSeenList.includes(name));

    // Resetar APENAS o progresso de desbloqueio do Ennard (funtimes_seen)
    rawDb.run(
      `UPDATE players SET funtimes_seen = '[]', ennard_unlocked = 0, ennard_pending = 0, scott_unlocked = ?, seen_animatronics = ?, animatronics_history = ?, updated_at = datetime('now') WHERE user_id = ?`,
      [isScottUnlocked ? 1 : 0, JSON.stringify(currentSeenList), JSON.stringify(historyMap), userId]
    );
    saveDatabase();

    return this.getOrCreatePlayer(userId);
  },

  resetScottCollection(userId) {
    this.getOrCreatePlayer(userId);

    // Reseta APENAS o progresso de desbloqueio do ciclo atual
    // animatronics_history (contadores permanentes) NUNCA é resetado!
    rawDb.run(
      `UPDATE players SET funtimes_seen = '[]', ennard_unlocked = 0, ennard_pending = 0, scott_unlocked = 0, seen_animatronics = '[]', updated_at = datetime('now') WHERE user_id = ?`,
      [userId]
    );
    saveDatabase();

    return this.getOrCreatePlayer(userId);
  },

  incrementPlayerKills(userId) {
    this.getOrCreatePlayer(userId);
    rawDb.run(
      `UPDATE players SET kills = kills + 1, updated_at = datetime('now') WHERE user_id = ?`,
      [userId]
    );
    saveDatabase();
    return this.getOrCreatePlayer(userId);
  },

  getTopKillsLeaderboard(limit = 10) {
    const stmt = rawDb.prepare('SELECT user_id, kills FROM players WHERE kills > 0 ORDER BY kills DESC LIMIT :limit');
    stmt.bind({ ':limit': limit });

    const list = [];
    while (stmt.step()) {
      list.push(stmt.getAsObject());
    }
    stmt.free();
    return list;
  },

  resetPlayerHp(userId) {
    this.getOrCreatePlayer(userId);
    rawDb.run(
      `UPDATE players SET current_hp = max_hp, stunned_turns = 0, stun_dot = 0, confused_turns = 0, confused_multiplier = 1.0, evade_next = 0, resist_next_power = 0, invincible_turns = 0, poisoned_turns = 0, poison_damage = 8, blinded_turns = 0, reflect_turns = 0, immune_turns = 0, updated_at = datetime('now') WHERE user_id = ?`,
      [userId]
    );
    saveDatabase();
    return this.getOrCreatePlayer(userId);
  },

  incrementAttacks(userId) {
    this.getOrCreatePlayer(userId);
    rawDb.run(
      `UPDATE players SET total_attacks = total_attacks + 1, updated_at = datetime('now') WHERE user_id = ?`,
      [userId]
    );
    saveDatabase();
    return this.getOrCreatePlayer(userId);
  },

  incrementWins(userId) {
    this.getOrCreatePlayer(userId);
    rawDb.run(
      `UPDATE players SET total_wins = total_wins + 1, updated_at = datetime('now') WHERE user_id = ?`,
      [userId]
    );
    saveDatabase();
    return this.getOrCreatePlayer(userId);
  },

  incrementPlayerDeaths(userId) {
    this.getOrCreatePlayer(userId);
    rawDb.run(
      `UPDATE players SET total_deaths = total_deaths + 1, updated_at = datetime('now') WHERE user_id = ?`,
      [userId]
    );
    saveDatabase();
    return this.getOrCreatePlayer(userId);
  },

  recordDuel({ attackerId, targetId, animatronic, damage, wasKo, timestamp }) {
    rawDb.run(
      `INSERT INTO duel_history (attacker_id, target_id, animatronic, damage, was_ko, timestamp)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [attackerId, targetId, animatronic, damage, wasKo ? 1 : 0, timestamp || Date.now()]
    );
    saveDatabase();
  },

  getDuelHistory(userId, limit = 10) {
    const stmt = rawDb.prepare(
      `SELECT * FROM duel_history
       WHERE attacker_id = :userId OR target_id = :userId
       ORDER BY timestamp DESC LIMIT :limit`
    );
    stmt.bind({ ':userId': userId, ':limit': limit });

    const list = [];
    while (stmt.step()) {
      list.push(stmt.getAsObject());
    }
    stmt.free();
    return list;
  },

  getFavoriteAnimatronic(userId) {
    const stmt = rawDb.prepare(
      `SELECT animatronic, COUNT(*) as count FROM duel_history
       WHERE attacker_id = :userId
       GROUP BY animatronic
       ORDER BY count DESC LIMIT 1`
    );
    stmt.bind({ ':userId': userId });

    let fav = null;
    if (stmt.step()) {
      fav = stmt.getAsObject().animatronic;
    }
    stmt.free();

    if (!fav) {
      const player = this.getOrCreatePlayer(userId);
      fav = player.animatronic || 'Nenhum';
    }
    return fav;
  },

  getAllPlayersWithKills() {
    const stmt = rawDb.prepare('SELECT user_id, kills FROM players WHERE kills > 0 ORDER BY kills DESC');
    const list = [];
    while (stmt.step()) {
      list.push(stmt.getAsObject());
    }
    stmt.free();
    return list;
  },

  wipePlayerData(userId) {
    this.getOrCreatePlayer(userId);
    rawDb.run("DELETE FROM players WHERE user_id = ?;", [userId]);
    rawDb.run("DELETE FROM duel_history WHERE attacker_id = ? OR target_id = ?;", [userId, userId]);
    saveDatabase();
    return this.getOrCreatePlayer(userId);
  },

  flush() {
    flushDatabase();
  }
};

console.log('✅ Base de dados SQLite (FNAF) iniciada com sucesso usando [sql.js WebAssembly]!');

module.exports = dbAdapter;
