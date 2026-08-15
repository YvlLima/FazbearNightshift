const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');
const { getRandomDifferentAnimatronic, getAnimatronicByName, GOLDEN_FREDDY } = require('./game/fnaf');

const dbPath = path.join(__dirname, 'fnaf.db');
const FIXED_PLAYER_MAX_HP = 100;

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
    kills INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
`;

const saveDatabase = () => {
  if (rawDb) {
    const data = rawDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
};

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
    }
    checkStmt.free();

    if (!hasPoisoned || !hasBlinded || !hasKills || !hasReflect || !hasImmune || !hasConfusedMult || !hasPoisonDamage || !hasEnnardPending || !hasEnnardUnlocked || !hasFuntimesSeen || !hasSeenAnimatronics) {
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
        `INSERT INTO players (user_id, animatronic, current_hp, max_hp, min_damage, max_damage, last_attack, stunned_turns, stun_dot, confused_turns, confused_multiplier, evade_next, resist_next_power, invincible_turns, poisoned_turns, poison_damage, blinded_turns, reflect_turns, immune_turns, ennard_pending, ennard_unlocked, funtimes_seen, seen_animatronics, kills)
         VALUES (?, NULL, ?, ?, 0, 0, 0, 0, 0, 0, 1.0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, '[]', '[]', 0)`,
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
      `UPDATE players SET animatronic = 'Golden Freddy', min_damage = 100, max_damage = 100, updated_at = datetime('now') WHERE user_id = ?`,
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

    rawDb.run(
      `UPDATE players SET stunned_turns = ?, stun_dot = ?, confused_turns = ?, confused_multiplier = ?, evade_next = ?, resist_next_power = ?, invincible_turns = ?, poisoned_turns = ?, poison_damage = ?, blinded_turns = ?, reflect_turns = ?, immune_turns = ?, updated_at = datetime('now') WHERE user_id = ?`,
      [stunned_turns, stun_dot, confused_turns, confused_multiplier, evade_next, resist_next_power, invincible_turns, poisoned_turns, poison_damage, blinded_turns, reflect_turns, immune_turns, userId]
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

  recordAnimatronicSeen(userId, animName) {
    const { FUNTIME_NAMES } = require('./game/fnaf');
    const player = this.getOrCreatePlayer(userId);

    let seenList = [];
    try {
      seenList = JSON.parse(player.seen_animatronics || '[]');
    } catch(e) {
      seenList = [];
    }

    let funtimesList = [];
    try {
      funtimesList = JSON.parse(player.funtimes_seen || '[]');
    } catch(e) {
      funtimesList = [];
    }

    let updated = false;
    if (!seenList.includes(animName)) {
      seenList.push(animName);
      updated = true;
    }

    if (FUNTIME_NAMES.includes(animName) && !funtimesList.includes(animName)) {
      funtimesList.push(animName);
      updated = true;
    }

    const isUnlocked = FUNTIME_NAMES.every(name => funtimesList.includes(name));
    const newlyUnlocked = isUnlocked && player.ennard_unlocked === 0;

    if (updated || newlyUnlocked) {
      rawDb.run(
        `UPDATE players SET seen_animatronics = ?, funtimes_seen = ?, ennard_unlocked = ?, updated_at = datetime('now') WHERE user_id = ?`,
        [JSON.stringify(seenList), JSON.stringify(funtimesList), isUnlocked ? 1 : 0, userId]
      );
      saveDatabase();
    }

    return { seenList, funtimesList, ennardUnlocked: isUnlocked };
  },

  getPlayerCollection(userId) {
    const { FUNTIME_NAMES } = require('./game/fnaf');
    const player = this.getOrCreatePlayer(userId);

    let seenList = [];
    try {
      seenList = JSON.parse(player.seen_animatronics || '[]');
    } catch(e) {
      seenList = [];
    }

    let funtimesList = [];
    try {
      funtimesList = JSON.parse(player.funtimes_seen || '[]');
    } catch(e) {
      funtimesList = [];
    }

    const isUnlocked = Boolean(player.ennard_unlocked === 1 || FUNTIME_NAMES.every(name => funtimesList.includes(name)));

    return {
      seenList,
      funtimesList,
      ennardUnlocked: isUnlocked
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
    } catch(e) {
      seenList = [];
    }
    return FUNTIME_NAMES.every(name => seenList.includes(name));
  },

  resetEnnardProgress(userId) {
    const player = this.getOrCreatePlayer(userId);

    let seenList = [];
    try {
      seenList = JSON.parse(player.seen_animatronics || '[]');
    } catch(e) {
      seenList = [];
    }

    // Garantir que o Ennard permanece marcado como visto na coleção geral (pois acabou de emergir!)
    if (!seenList.includes('Ennard')) {
      seenList.push('Ennard');
    }

    // Resetar APENAS o progresso de desbloqueio do Ennard (funtimes_seen)
    // A coleção geral de animatronics (seen_animatronics) mantém os Funtimes já descobertos com ✅!
    rawDb.run(
      `UPDATE players SET funtimes_seen = '[]', ennard_unlocked = 0, ennard_pending = 0, seen_animatronics = ?, updated_at = datetime('now') WHERE user_id = ?`,
      [JSON.stringify(seenList), userId]
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
  }
};

console.log('✅ Base de dados SQLite (FNAF) iniciada com sucesso usando [sql.js WebAssembly]!');

module.exports = dbAdapter;
