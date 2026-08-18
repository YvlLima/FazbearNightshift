const db = require('../database');
const config = require('../config');
const {
  rollDamage,
  getAnimatronicByName,
  FUNTIME_NAMES,
  MANGLE_COPIABLE_NAMES,
  MIMIC_EXCLUDED_NAMES,
  ANIMATRONICS
} = require('./fnaf');

/**
 * Aplica o efeito de um poder especial a um atacante e alvo.
 * Utilizado tanto pelo próprio dono do poder como por poderes de cópia (Mangle, The Mimic, Funtime Freddy).
 */
function applyPowerEffect(powerAnimName, attackerUser, targetUser, target, attacker, isInvincible, baseDamage = 0) {
  const animData = getAnimatronicByName(powerAnimName);
  if (!animData || !animData.power) return null;

  const power = animData.power;
  let extraDamage = 0;
  let effectText = '';

  switch (powerAnimName) {
    case 'Freddy': {
      let shockDamage = 10;
      let resistNote = '';
      if (!isInvincible && target.resist_next_power === 1) {
        shockDamage = Math.floor(shockDamage / 2);
        db.updatePlayerEffects(targetUser.id, { resist_next_power: 0 });
        resistNote = ' *(Reduzido para 5 de dano pela Resistência!)*';
      }
      extraDamage = shockDamage;
      db.updatePlayerEffects(targetUser.id, { stunned_turns: 2 });
      effectText = `⚡ **${power.name}**: Paralisa **${targetUser.username}** durante 2 turnos e causa +${shockDamage} de dano de choque adicional!${resistNote}`;
      break;
    }
    case 'Foxy': {
      db.updatePlayerEffects(attackerUser.id, { evade_next: 1 });
      effectText = `💨 **${power.name}**: **${attackerUser.username}** esquivar-se-á completamente do próximo ataque recebido!`;
      break;
    }
    case 'Chica': {
      let bombDamage = 16;
      let resistNote = '';
      if (!isInvincible && target.resist_next_power === 1) {
        bombDamage = Math.floor(bombDamage / 2);
        db.updatePlayerEffects(targetUser.id, { resist_next_power: 0 });
        resistNote = ' *(Reduzido para 8 de dano pela Resistência!)*';
      }
      extraDamage = bombDamage;
      effectText = `💣 **${power.name}**: Lançou uma bomba cupcake explosiva causando +${bombDamage} de dano extra a **${targetUser.username}**!${resistNote}`;
      break;
    }
    case 'Bonnie': {
      db.updatePlayerEffects(targetUser.id, { confused_turns: 1, confused_multiplier: 1.0 });
      effectText = `🎸 **${power.name}**: **${targetUser.username}** ficou confuso! No próximo ataque dele, o dano vira-se contra ele próprio!`;
      break;
    }
    case 'Springtrap': {
      db.updatePlayerEffects(attackerUser.id, { resist_next_power: 1 });
      effectText = `🛡️ **${power.name}**: **${attackerUser.username}** ativou uma armadura de resistência! O dano do próximo poder especial recebido será dividido por 2!`;
      break;
    }
    case 'Puppet': {
      db.updatePlayerEffects(targetUser.id, { stunned_turns: 2, stun_dot: 5 });
      effectText = `⛓️ **${power.name}**: Imobilizou **${targetUser.username}** em cabos de aço durante 2 turnos (sofrerá 5 de dano por cada turno imobilizado)!`;
      break;
    }
    case 'Toy Freddy': {
      effectText = `🧸 **${power.name}**: Entrou em fúria de IA! Multiplicou o dano do ataque por 2x e ignorou a esquiva do alvo!`;
      break;
    }
    case 'Toy Chica': {
      const currentAttacker = db.getOrCreatePlayer(attackerUser.id);
      const healedHp = Math.min(attacker.max_hp || 100, currentAttacker.current_hp + 15);
      db.updatePlayerHp(attackerUser.id, healedHp);
      effectText = `🐤 **${power.name}**: Comeu um lanche revigorante e curou **+15 HP** ao atacante! (${healedHp}/100 HP)`;
      break;
    }
    case 'Toy Bonnie': {
      let initialDmg = 4;
      let resistNote = '';
      if (!isInvincible && target.resist_next_power === 1) {
        initialDmg = Math.floor(initialDmg / 2);
        db.updatePlayerEffects(targetUser.id, { resist_next_power: 0 });
        resistNote = ' *(Reduzido para 2 de dano pela Resistência!)*';
      }
      extraDamage = initialDmg;
      db.updatePlayerEffects(targetUser.id, { poisoned_turns: 3, poison_damage: 5 });
      effectText = `🧪 **${power.name}**: Causou +${initialDmg} de dano direto inicial${resistNote} e envenenou **${targetUser.username}** durante 3 rondas (sofrerá 5 de dano por ronda)!`;
      break;
    }
    case 'Balloon Boy': {
      db.updatePlayerEffects(targetUser.id, { blinded_turns: 2 });
      effectText = `🎈 **${power.name}**: Cegou **${targetUser.username}** durante os próximos 2 ataques dele (sofrerá 17 de dano a cada ataque tentado)!`;
      break;
    }
    case 'Circus Baby': {
      const totalScooperDmg = Math.round(baseDamage * 2.0);
      extraDamage = totalScooperDmg - baseDamage;
      db.updatePlayerEffects(targetUser.id, { stunned_turns: 2 });
      effectText = `🎪 **${power.name}**: Aprisionou **${targetUser.username}** com a sua garra hidráulica por 2 rondas e causou 2x de dano (**${totalScooperDmg}** HP), ignorando esquiva e resistência!`;
      break;
    }
    case 'Ballora': {
      db.updatePlayerEffects(attackerUser.id, { reflect_turns: 1, immune_turns: 1 });
      effectText = `🩰 **${power.name}**: **${attackerUser.username}** ativou a dança da Ballora! Durante 1 ronda, fica completamente imune a dano e reflete 1.5x todo o dano recebido de volta para quem a atacar!`;
      break;
    }
    case 'Funtime Chica': {
      const isStun = Math.random() < 0.5;
      if (isStun) {
        db.updatePlayerEffects(targetUser.id, { stunned_turns: 2 });
        effectText = `🦩 **${power.name}**: **${targetUser.username}** ficou hipnotizado pelo flash e foi imobilizado durante 2 rondas!`;
      } else {
        db.updatePlayerEffects(targetUser.id, { confused_turns: 1, confused_multiplier: 1.5 });
        effectText = `🦩 **${power.name}**: **${targetUser.username}** ficou completamente desorientado! No próximo ataque dele, o dano vira-se contra ele próprio com **1.5x de multiplicador**!`;
      }
      break;
    }
    case 'Funtime Freddy': {
      const ftOptions = ['Funtime Chica', 'Funtime Foxy'];
      const chosenFtName = ftOptions[Math.floor(Math.random() * ftOptions.length)];
      const res = applyPowerEffect(chosenFtName, attackerUser, targetUser, target, attacker, isInvincible, baseDamage);
      if (res) {
        let bonBonDmg = 6;
        let resistNote = '';
        if (!isInvincible && target.resist_next_power === 1) {
          bonBonDmg = Math.floor(bonBonDmg / 2);
          db.updatePlayerEffects(targetUser.id, { resist_next_power: 0 });
          resistNote = ' *(Bónus do Bon-Bon reduzido para +3 pela Resistência!)*';
        }
        extraDamage = res.extraDamage + bonBonDmg;
        effectText = `🐻‍❄️ **${power.name}**: Lançou o Bon-Bon, copiando o poder de **${chosenFtName}** (+${bonBonDmg} de dano extra${resistNote})!\n➜ ${res.effectText}`;
      }
      break;
    }
    case 'Funtime Foxy': {
      const currentAttacker = db.getOrCreatePlayer(attackerUser.id);
      const healedHp = Math.min(attacker.max_hp || 100, currentAttacker.current_hp + 9);
      db.updatePlayerHp(attackerUser.id, healedHp);

      const poisonDmg = Math.round(baseDamage * 2.5);
      db.updatePlayerEffects(targetUser.id, { poisoned_turns: 1, poison_damage: poisonDmg });
      effectText = `🦊 **${power.name}**: Curou **+9 HP** a **${attackerUser.username}** (${healedHp}/100 HP) e envenenou **${targetUser.username}** por 1 ronda com **${poisonDmg}** de dano hidráulico (2.5x), ignorando resistência!`;
      break;
    }
    case 'Glamrock Freddy': {
      db.updatePlayerEffects(attackerUser.id, { stomach_protect_turns: 1 });
      effectText = `🎤 **${power.name}**: **${attackerUser.username}** ativou a escotilha torácica! Engolirá o próximo ataque recebido, devolvendo-o duplicado (2x) como dano ao agressor!`;
      break;
    }
    case 'Glamrock Chica': {
      const currentAttacker = db.getOrCreatePlayer(attackerUser.id);
      if (currentAttacker.current_hp < 20) {
        db.updatePlayerEffects(attackerUser.id, { life_saver_turns: 2, double_damage_turns: 2 });
        effectText = `🎸 **${power.name}**: HP crítico (<20%)! **${attackerUser.username}** ativou o modo de sobrevivência: não pode morrer (HP mín 1) e causará 2x de dano pelos próximos 2 ataques!`;
      } else {
        effectText = `🎸 **${power.name}**: **${attackerUser.username}** tentou ativar o Garbage Gobble, mas o seu HP não estava abaixo de 20% (${currentAttacker.current_hp} HP)!`;
      }
      break;
    }
    case 'Roxy': {
      db.updatePlayerEffects(attackerUser.id, {
        poisoned_turns: 0,
        blinded_turns: 0,
        stunned_turns: 0,
        confused_turns: 0,
        hacked_turns: 0
      });
      db.updatePlayerEffects(targetUser.id, {
        confused_turns: 1,
        confused_multiplier: 1.0,
        extra_self_damage: 9
      });
      effectText = `🏎️ **${power.name}**: **${attackerUser.username}** usou a visão de raios-X para limpar todos os seus efeitos negativos e confundiu **${targetUser.username}** (+9 de auto-dano no próximo ataque)!`;
      break;
    }
    case 'Monty': {
      let mDmg = 10;
      let resistNote = '';
      if (!isInvincible && target.resist_next_power === 1) {
        mDmg = Math.floor(mDmg / 2);
        db.updatePlayerEffects(targetUser.id, { resist_next_power: 0 });
        resistNote = ' *(Reduzido para 5 de dano pela Resistência!)*';
      }
      extraDamage = mDmg;
      db.updatePlayerEffects(attackerUser.id, { evade_next: 1 });
      effectText = `🐊 **${power.name}**: Desferiu um potente chute aéreo com 30% de fúria, causando +${mDmg} de dano extra a **${targetUser.username}**!${resistNote} e ativou esquiva para o próximo ataque recebido!`;
      break;
    }
    case 'Sundrop/Moondrop': {
      const isSun = Math.random() < 0.5;
      if (isSun) {
        const currentAttacker = db.getOrCreatePlayer(attackerUser.id);
        const healedHp = Math.min(100, currentAttacker.current_hp + 15);
        db.updatePlayerHp(attackerUser.id, healedHp);
        effectText = `☀️ **Moondrop (Modo Sun)**: O Sol brilhou! **${attackerUser.username}** curou **+15 HP**! (${healedHp}/100 HP)`;
      } else {
        db.updatePlayerEffects(targetUser.id, { blinded_turns: 2 });
        extraDamage = Math.round(baseDamage * 1.5);
        effectText = `🌙 **Moondrop (Modo Moon)**: A Lua surgiu! Cegou **${targetUser.username}** por 2 turnos e aumentou o dano deste ataque em 2.5x!`;
      }
      break;
    }
    case 'Vanny': {
      db.updatePlayerEffects(targetUser.id, { hacked_turns: 2 });
      effectText = `🔪 **${power.name}**: Hackeou o sistema de **${targetUser.username}** por 2 ataques! Qualquer dano que ele causar resultará em 50% de auto-dano extra!`;
      break;
    }
    case 'Security Puppet': {
      const currentAttacker = db.getOrCreatePlayer(attackerUser.id);
      const healedHp = Math.min(attacker.max_hp || 100, currentAttacker.current_hp + 40);
      db.updatePlayerHp(attackerUser.id, healedHp);
      db.updatePlayerEffects(attackerUser.id, { double_cooldown_turns: 1 });
      effectText = `🎁 **${power.name}**: Restaurou **+40 HP** a **${attackerUser.username}** (${healedHp}/100 HP)! O próximo ataque terá cooldown duplo (2 min)!`;
      break;
    }
    case 'The Mimic': {
      const allRegular = ANIMATRONICS.filter(a => !MIMIC_EXCLUDED_NAMES.includes(a.name));
      const chosenAnim = allRegular[Math.floor(Math.random() * allRegular.length)];
      const res = applyPowerEffect(chosenAnim.name, attackerUser, targetUser, target, attacker, isInvincible, baseDamage);
      if (res) {
        extraDamage = res.extraDamage * 2;
        effectText = `🤖 **${power.name}**: Copiou e duplicou (2x) o poder de **${chosenAnim.name}**!\n➜ ${res.effectText} *(Valores numéricos de dano duplicados!)*`;
      }
      break;
    }
    case 'Scott Cawthon': {
      effectText = `👨‍💻 **${power.name}**: **Scott Cawthon** assumiu o controlo e ativou o Developer Console!`;
      break;
    }
  }

  return { power, extraDamage, effectText };
}

/**
 * Executa uma rodada completa de combate entre o atacante e o alvo.
 * @param {object} params
 * @param {object} params.attackerUser - Objeto do utilizador do Discord (atacante)
 * @param {object} params.targetUser - Objeto do utilizador do Discord (defensor)
 * @returns {object} Resultado do combate para a interface construir a resposta
 */
function executeCombatRound({ attackerUser, targetUser }) {
  const currentAttackerState = db.getOrCreatePlayer(attackerUser.id);
  const now = Date.now();

  // 1. Verificação de Cooldown
  const isDoubleCooldown = currentAttackerState.double_cooldown_turns > 0;
  const hasReducedCooldown = currentAttackerState.reduced_cooldown_attacks_remaining > 0;

  let cooldownMs = config.attackCooldownMs || 60 * 1000;
  if (isDoubleCooldown) {
    cooldownMs = 120 * 1000;
  } else if (hasReducedCooldown) {
    cooldownMs = 30 * 1000;
  }

  const timePassed = now - currentAttackerState.last_attack;

  if (timePassed < cooldownMs) {
    const remainingSeconds = Math.ceil((cooldownMs - timePassed) / 1000);
    return {
      type: 'cooldown',
      remainingSeconds,
      isDoubleCooldown,
      hasReducedCooldown
    };
  }

  if (isDoubleCooldown) {
    db.updatePlayerEffects(attackerUser.id, { double_cooldown_turns: currentAttackerState.double_cooldown_turns - 1 });
  }

  // 2. Verificação do Scott Cawthon (10% chance se desbloqueado)
  const isScottUnlocked = db.hasUnlockedScott(attackerUser.id);
  const isScottDrawn = isScottUnlocked && (Math.random() < 0.10);

  if (isScottDrawn) {
    const attacker = db.assignScott(attackerUser.id);
    const animInfo = getAnimatronicByName('Scott Cawthon');
    db.recordAnimatronicSeen(attackerUser.id, 'Scott Cawthon');

    db.setLastAttack(attackerUser.id, now);
    db.incrementAttacks(attackerUser.id);

    let target = db.getOrCreatePlayer(targetUser.id);
    const originalTargetHp = target.current_hp;

    db.updatePlayerHp(targetUser.id, 0);
    db.incrementWins(attackerUser.id);
    db.incrementPlayerKills(attackerUser.id);
    db.recordDuel({
      attackerId: attackerUser.id,
      targetId: targetUser.id,
      animatronic: 'Scott Cawthon',
      damage: originalTargetHp,
      wasKo: 1,
      timestamp: now
    });
    db.resetPlayerHp(targetUser.id);

    db.updatePlayerHp(attackerUser.id, 100);
    db.updatePlayerEffects(attackerUser.id, { invincible_turns: 5 });

    db.updatePlayerEffects(attackerUser.id, {
      stunned_turns: 0,
      stun_dot: 0,
      poisoned_turns: 0,
      poison_damage: 8,
      blinded_turns: 0,
      confused_turns: 0,
      confused_multiplier: 1.0,
      extra_self_damage: 0,
      hacked_turns: 0,
      double_cooldown_turns: 0
    });

    db.updatePlayerEffects(targetUser.id, {
      stunned_turns: 3,
      stun_dot: 5,
      poisoned_turns: 3,
      poison_damage: 8,
      blinded_turns: 3,
      confused_turns: 3,
      confused_multiplier: 1.0,
      hacked_turns: 3
    });

    db.setReducedCooldownAttacks(attackerUser.id, 5);
    db.resetScottCollection(attackerUser.id);
    db.resetScottCollection(targetUser.id);

    return {
      type: 'scott',
      attacker,
      animInfo,
      targetUser,
      attackerUser
    };
  }

  // 3. Verificação de Imobilização / Paralisa do Atacante
  if (currentAttackerState.stunned_turns > 0) {
    const remainingStun = currentAttackerState.stunned_turns - 1;
    const dotDamage = currentAttackerState.stun_dot || 0;
    let newHp = currentAttackerState.current_hp;
    let dotMessage = '';

    if (dotDamage > 0) {
      newHp = Math.max(0, currentAttackerState.current_hp - dotDamage);
      db.updatePlayerHp(attackerUser.id, newHp);
      dotMessage = `\n🩸 Sofreste **${dotDamage}** de dano de imobilização (Steel Agony)! (${newHp}/${currentAttackerState.max_hp} HP)`;
    }

    db.updatePlayerEffects(attackerUser.id, {
      stunned_turns: remainingStun,
      stun_dot: remainingStun === 0 ? 0 : dotDamage
    });

    db.setLastAttack(attackerUser.id, now);

    let isKo = false;
    let koText = '';
    if (newHp === 0) {
      isKo = true;
      koText = `\n💀 **${attackerUser.username}** foi desligado pelo dano contínuo de imobilização!\n⚙️ A vida de **${attackerUser.username}** foi reiniciada para 100 HP.`;
      db.resetPlayerHp(attackerUser.id);
    }

    return {
      type: 'stunned',
      remainingStun,
      dotMessage,
      koText,
      newHp
    };
  }

  // 4. Verificação de Status Negativos (Veneno e Cegueira)
  let statusDamageText = '';
  let currentAttackerHp = currentAttackerState.current_hp;

  if (currentAttackerState.poisoned_turns > 0) {
    const remainingPoison = currentAttackerState.poisoned_turns - 1;
    const poisonDmg = currentAttackerState.poison_damage || 8;
    currentAttackerHp = Math.max(0, currentAttackerHp - poisonDmg);
    db.updatePlayerHp(attackerUser.id, currentAttackerHp);
    db.updatePlayerEffects(attackerUser.id, {
      poisoned_turns: remainingPoison,
      poison_damage: remainingPoison === 0 ? 8 : poisonDmg
    });
    statusDamageText += `\n🧪 Sofreste **${poisonDmg}** de dano de envenenamento! (${currentAttackerHp}/${currentAttackerState.max_hp} HP)`;
  }

  if (currentAttackerHp > 0 && currentAttackerState.blinded_turns > 0) {
    const remainingBlind = currentAttackerState.blinded_turns - 1;
    currentAttackerHp = Math.max(0, currentAttackerHp - 17);
    db.updatePlayerHp(attackerUser.id, currentAttackerHp);
    db.updatePlayerEffects(attackerUser.id, { blinded_turns: remainingBlind });
    statusDamageText += `\n🙈 Estavas cego (Flash Balloon) e sofreste **17** de dano próprio ao tentar atacar! (${currentAttackerHp}/${currentAttackerState.max_hp} HP)`;
  }

  if (currentAttackerHp === 0) {
    db.setLastAttack(attackerUser.id, now);
    db.incrementPlayerDeaths(attackerUser.id);
    db.resetPlayerHp(attackerUser.id);
    return {
      type: 'status_ko',
      statusDamageText
    };
  }

  // 5. Verificação de Confusão
  if (currentAttackerState.confused_turns > 0) {
    const mult = currentAttackerState.confused_multiplier || 1.0;
    const extraSelfDmg = currentAttackerState.extra_self_damage || 0;
    db.updatePlayerEffects(attackerUser.id, {
      confused_turns: currentAttackerState.confused_turns - 1,
      confused_multiplier: 1.0,
      extra_self_damage: 0
    });

    const attacker = db.assignNewDifferentAnimatronic(attackerUser.id);
    const animInfo = getAnimatronicByName(attacker.animatronic);
    db.recordAnimatronicSeen(attackerUser.id, attacker.animatronic);
    db.setLastAttack(attackerUser.id, now);

    const rawDamage = rollDamage(animInfo);
    const damageDealt = Math.round(rawDamage * mult) + extraSelfDmg;
    const newAttackerHp = Math.max(0, currentAttackerHp - damageDealt);
    db.updatePlayerHp(attackerUser.id, newAttackerHp);

    const isSelfKo = newAttackerHp === 0;
    db.incrementAttacks(attackerUser.id);
    db.recordDuel({
      attackerId: attackerUser.id,
      targetId: targetUser.id,
      animatronic: attacker.animatronic,
      damage: damageDealt,
      wasKo: isSelfKo ? 1 : 0,
      timestamp: now
    });

    if (isSelfKo) {
      db.incrementPlayerDeaths(attackerUser.id);
      db.resetPlayerHp(attackerUser.id);
    }

    if (hasReducedCooldown) {
      db.decrementReducedCooldown(attackerUser.id);
    }

    return {
      type: 'confused',
      attacker,
      animInfo,
      damageDealt,
      newAttackerHp,
      maxHp: currentAttackerState.max_hp,
      mult,
      isSelfKo,
      statusDamageText
    };
  }

  // 6. Sorteio / Atribuição do Animatronic
  const isEnnardForced = currentAttackerState.ennard_pending === 1;
  let isGoldenFreddyDrawn = false;
  let attacker;
  let animInfo;
  let forcedEnnardPowerName = null;

  if (isEnnardForced) {
    attacker = db.assignEnnard(attackerUser.id);
    animInfo = getAnimatronicByName('Ennard');
    db.setEnnardPending(attackerUser.id, 0);
    db.resetEnnardProgress(attackerUser.id);
    forcedEnnardPowerName = FUNTIME_NAMES[Math.floor(Math.random() * FUNTIME_NAMES.length)];
  } else {
    isGoldenFreddyDrawn = Math.random() < 0.03;

    if (isGoldenFreddyDrawn) {
      attacker = db.assignGoldenFreddy(attackerUser.id);
      animInfo = getAnimatronicByName('Golden Freddy');
    } else {
      attacker = db.assignNewDifferentAnimatronic(attackerUser.id);
      animInfo = getAnimatronicByName(attacker.animatronic);
    }

    db.recordAnimatronicSeen(attackerUser.id, attacker.animatronic);

    if (FUNTIME_NAMES.includes(attacker.animatronic)) {
      if (db.hasUnlockedEnnard(attackerUser.id)) {
        db.setEnnardPending(attackerUser.id, 1);
      }
    }
  }

  db.setLastAttack(attackerUser.id, now);
  db.incrementAttacks(attackerUser.id);

  let target = db.getOrCreatePlayer(targetUser.id);

  // 7. Execução do Golden Freddy
  if (isGoldenFreddyDrawn) {
    const gfDamage = 75;
    const newTargetHp = Math.max(0, target.current_hp - gfDamage);
    db.updatePlayerHp(targetUser.id, newTargetHp);
    db.updatePlayerEffects(attackerUser.id, { invincible_turns: 2 });

    const isKo = newTargetHp === 0;

    if (isKo) {
      db.incrementWins(attackerUser.id);
      db.incrementPlayerKills(attackerUser.id);
      db.incrementPlayerDeaths(targetUser.id);
      db.recordDuel({
        attackerId: attackerUser.id,
        targetId: targetUser.id,
        animatronic: 'Golden Freddy',
        damage: gfDamage,
        wasKo: 1,
        timestamp: now
      });
      db.resetPlayerHp(targetUser.id);
    } else {
      db.recordDuel({
        attackerId: attackerUser.id,
        targetId: targetUser.id,
        animatronic: 'Golden Freddy',
        damage: gfDamage,
        wasKo: 0,
        timestamp: now
      });
    }

    if (hasReducedCooldown) {
      db.decrementReducedCooldown(attackerUser.id);
    }

    return {
      type: 'golden_freddy',
      attacker,
      animInfo,
      gfDamage,
      newTargetHp,
      isKo,
      statusDamageText,
      hasReducedCooldown
    };
  }

  // 8. Efeitos Defensivos do Alvo (Invencibilidade, Imunidade e Reflexo da Ballora)
  let isInvincible = false;
  if (target.invincible_turns > 0) {
    isInvincible = true;
    const remainingInvincible = target.invincible_turns - 1;
    db.updatePlayerEffects(targetUser.id, { invincible_turns: remainingInvincible });
    target = db.getOrCreatePlayer(targetUser.id);
  }

  let isBalloraImmune = false;
  let isBalloraReflect = false;

  if (!isInvincible && target.immune_turns > 0) {
    isBalloraImmune = true;
    db.updatePlayerEffects(targetUser.id, { immune_turns: target.immune_turns - 1 });
    target = db.getOrCreatePlayer(targetUser.id);
  }

  if (!isInvincible && target.reflect_turns > 0) {
    isBalloraReflect = true;
    db.updatePlayerEffects(targetUser.id, { reflect_turns: target.reflect_turns - 1 });
    target = db.getOrCreatePlayer(targetUser.id);
  }

  // 9. Dano Base e Poder Especial
  let baseDamage = rollDamage(animInfo);
  let isPowerActivated = false;
  let powerEffectText = '';
  let extraPowerDamage = 0;

  if (isEnnardForced && forcedEnnardPowerName) {
    isPowerActivated = true;
    const result = applyPowerEffect(forcedEnnardPowerName, attackerUser, targetUser, target, attacker, isInvincible, baseDamage);
    if (result) {
      if (forcedEnnardPowerName === 'Toy Freddy') {
        baseDamage = baseDamage * 2;
      } else {
        extraPowerDamage = result.extraDamage;
      }
      powerEffectText = `🕸️ **ENNARD EMERGIU DA SALA DE SCOOPING!**\nHerdou o poder especial de **${forcedEnnardPowerName}** com 100% de certeza!\n➜ ${result.effectText}`;
    }
  } else {
    const powerChance = animInfo.power ? animInfo.power.chance : 0;
    if (!isInvincible && animInfo.power && Math.random() < powerChance) {
      isPowerActivated = true;

      if (attacker.animatronic === 'Mangle') {
        const possiblePowers = MANGLE_COPIABLE_NAMES;
        const copiedAnimName = possiblePowers[Math.floor(Math.random() * possiblePowers.length)];
        const result = applyPowerEffect(copiedAnimName, attackerUser, targetUser, target, attacker, isInvincible, baseDamage);

        if (result) {
          if (copiedAnimName === 'Toy Freddy') {
            if (!isInvincible && target.resist_next_power === 1) {
              baseDamage = Math.round(baseDamage * 1.5);
              db.updatePlayerEffects(targetUser.id, { resist_next_power: 0 });
              result.effectText += ' *(Fúria reduzida para 1.5x pela Resistência!)*';
            } else {
              baseDamage = baseDamage * 2;
            }
          } else {
            extraPowerDamage = result.extraDamage;
          }
          powerEffectText = `🐺 **${animInfo.power.name}**: Copiou o poder de **${copiedAnimName}** (${result.power.name})!\n➜ ${result.effectText}`;
        }
      } else {
        const result = applyPowerEffect(attacker.animatronic, attackerUser, targetUser, target, attacker, isInvincible, baseDamage);
        if (result) {
          if (attacker.animatronic === 'Toy Freddy') {
            if (!isInvincible && target.resist_next_power === 1) {
              baseDamage = Math.round(baseDamage * 1.5);
              db.updatePlayerEffects(targetUser.id, { resist_next_power: 0 });
              result.effectText += ' *(Fúria reduzida para 1.5x pela Resistência!)*';
            } else {
              baseDamage = baseDamage * 2;
            }
          } else {
            extraPowerDamage = result.extraDamage;
          }
          powerEffectText = result.effectText;
        }
      }
    }
  }

  // 10. Esquiva do Alvo
  let isEvaded = false;
  const isEvadeIgnored = isPowerActivated && (
    attacker.animatronic === 'Toy Freddy' ||
    attacker.animatronic === 'Circus Baby' ||
    powerEffectText.includes('Toy Freddy') ||
    powerEffectText.includes('Scooper Reach')
  );

  if (!isInvincible && target.evade_next === 1) {
    if (isEvadeIgnored) {
      db.updatePlayerEffects(targetUser.id, { evade_next: 0 });
      target = db.getOrCreatePlayer(targetUser.id);
    } else {
      isEvaded = true;
      baseDamage = 0;
      db.updatePlayerEffects(targetUser.id, { evade_next: 0 });
      target = db.getOrCreatePlayer(targetUser.id);
    }
  }

  if (isInvincible || isBalloraImmune) {
    baseDamage = 0;
  }

  // Sincronizar o HP atual do atacante com a BD caso tenha ocorrido cura durante o poder especial
  const freshAttackerState = db.getOrCreatePlayer(attackerUser.id);
  currentAttackerHp = freshAttackerState.current_hp;

  // 11. Cálculo Final de Dano e Contra-Ataques
  if (currentAttackerState.double_damage_turns > 0) {
    baseDamage = baseDamage * 2;
    db.updatePlayerEffects(attackerUser.id, { double_damage_turns: currentAttackerState.double_damage_turns - 1 });
    statusDamageText += '\n🎸 **Garbage Gobble**: Dano do ataque duplicado (2x)!';
  }

  let stomachReflectMsg = '';
  if (!isInvincible && !isBalloraImmune && target.stomach_protect_turns === 1) {
    const incomingDmg = baseDamage + extraPowerDamage;
    let reflectedDmg = Math.round(incomingDmg * 2);
    let resistNote = '';
    if (currentAttackerState.resist_next_power === 1) {
      reflectedDmg = Math.floor(reflectedDmg / 2);
      db.updatePlayerEffects(attackerUser.id, { resist_next_power: 0 });
      resistNote = ' *(Reduzido a metade pela Resistência!)*';
    }
    baseDamage = 0;
    extraPowerDamage = 0;

    db.updatePlayerEffects(targetUser.id, { stomach_protect_turns: 0 });

    if (reflectedDmg > 0) {
      const newAttackerHp = Math.max(0, currentAttackerHp - reflectedDmg);
      db.updatePlayerHp(attackerUser.id, newAttackerHp);
      stomachReflectMsg = `\n\n🎤 **STOMACH HATCH PROTECT**: **${targetUser.username}** engoliu o ataque e devolveu **${reflectedDmg}** de dano (2x) a **${attackerUser.username}**!${resistNote}`;
      if (newAttackerHp === 0) {
        stomachReflectMsg += `\n💀 **${attackerUser.username}** foi desligado pelo contra-ataque do Glamrock Freddy!\n⚙️ A vida de **${attackerUser.username}** foi reiniciada para 100 HP.`;
        db.incrementPlayerDeaths(attackerUser.id);
        db.resetPlayerHp(attackerUser.id);
      }
    }
  }

  let totalDamageDealt = (isInvincible || isBalloraImmune) ? 0 : (baseDamage + extraPowerDamage);
  let balloraReflectMsg = stomachReflectMsg;

  if (isBalloraReflect && totalDamageDealt > 0) {
    const reflectedDmg = Math.round(totalDamageDealt * 1.5);
    const newAttackerHpAfterReflect = Math.max(0, currentAttackerHp - reflectedDmg);
    db.updatePlayerHp(attackerUser.id, newAttackerHpAfterReflect);

    balloraReflectMsg = `\n\n🪞 **DANO REFLETIDO (Spindash Ballet)**: **${targetUser.username}** refletiu 1.5x o dano de volta! **${attackerUser.username}** sofreu **${reflectedDmg}** de dano! (${newAttackerHpAfterReflect}/${currentAttackerState.max_hp} HP)`;

    if (newAttackerHpAfterReflect === 0) {
      balloraReflectMsg += `\n💀 **${attackerUser.username}** foi desligado pelo dano refletido da Ballora!\n⚙️ A vida de **${attackerUser.username}** foi reiniciada para 100 HP.`;
      db.incrementPlayerDeaths(attackerUser.id);
      db.resetPlayerHp(attackerUser.id);
    }

    totalDamageDealt = 0;
  }

  if (currentAttackerState.hacked_turns > 0 && totalDamageDealt > 0) {
    const hackedDmg = Math.round(totalDamageDealt * 0.5);
    currentAttackerHp = Math.max(0, currentAttackerHp - hackedDmg);
    db.updatePlayerHp(attackerUser.id, currentAttackerHp);
    db.updatePlayerEffects(attackerUser.id, { hacked_turns: currentAttackerState.hacked_turns - 1 });
    statusDamageText += `\n💻 Estavas hackeado (Glitch Override) e sofreste **${hackedDmg}** de dano próprio (50% do dano causado)! (${currentAttackerHp}/${currentAttackerState.max_hp} HP)`;
  }

  let newTargetHp = Math.max(0, target.current_hp - totalDamageDealt);
  let lifeSaverMsg = '';
  if (target.life_saver_turns > 0) {
    const remainingLifeSaver = target.life_saver_turns - 1;
    db.updatePlayerEffects(targetUser.id, { life_saver_turns: remainingLifeSaver });
    if (newTargetHp === 0 && totalDamageDealt > 0) {
      newTargetHp = 1;
      lifeSaverMsg = `\n\n🍕 **GARBAGE GOBBLE**: **${targetUser.username}** recusou-se a cair e sobreviveu com **1 HP**!`;
    }
  }
  db.updatePlayerHp(targetUser.id, newTargetHp);

  const isTargetKo = newTargetHp === 0;
  let koMessage = '';
  if (isTargetKo) {
    db.incrementWins(attackerUser.id);
    db.incrementPlayerKills(attackerUser.id);
    db.incrementPlayerDeaths(targetUser.id);
    koMessage = `\n\n💀 **${targetUser.username}** foi desligado por **${attacker.animatronic}**!\n⚙️ A vida de **${targetUser.username}** foi reiniciada para 100 HP.`;
    db.resetPlayerHp(targetUser.id);
  }

  db.recordDuel({
    attackerId: attackerUser.id,
    targetId: targetUser.id,
    animatronic: attacker.animatronic,
    damage: totalDamageDealt,
    wasKo: isTargetKo ? 1 : 0,
    timestamp: now
  });

  if (hasReducedCooldown) {
    db.decrementReducedCooldown(attackerUser.id);
  }

  return {
    type: 'duel',
    attacker,
    animInfo,
    target,
    totalDamageDealt,
    statusDamageText,
    balloraReflectMsg,
    isInvincible,
    isBalloraImmune,
    isEvaded,
    isPowerActivated,
    powerEffectText,
    newTargetHp,
    isTargetKo,
    koMessage,
    lifeSaverMsg,
    hasReducedCooldown,
    isEnnardForced
  };
}

module.exports = {
  applyPowerEffect,
  executeCombatRound
};
