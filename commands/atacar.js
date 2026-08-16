const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database');
const config = require('../config');
const { rollDamage, getAnimatronicByName, resolveDirectGifUrl, FUNTIME_NAMES, MANGLE_COPIABLE_NAMES, MIMIC_EXCLUDED_NAMES, ANIMATRONICS } = require('../game/fnaf');

/**
 * Função utilitária reutilizável para aplicar o efeito de um poder especial a um atacante e alvo.
 * Utilizada tanto pelo próprio dono do poder como pelos poderes de cópia do Mangle e Funtime Freddy.
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
        shockDamage = Math.floor(shockDamage / 2); // 5
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
        bombDamage = Math.floor(bombDamage / 2); // 8
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
        initialDmg = Math.floor(initialDmg / 2); // 2
        db.updatePlayerEffects(targetUser.id, { resist_next_power: 0 });
        resistNote = ' *(Reduzido para 2 de dano pela Resistência!)*';
      }
      extraDamage = initialDmg;
      db.updatePlayerEffects(targetUser.id, { poisoned_turns: 3, poison_damage: 8 });
      effectText = `🧪 **${power.name}**: Causou +${initialDmg} de dano direto inicial${resistNote} e envenenou **${targetUser.username}** durante 3 rondas (sofrerá 8 de dano por ronda)!`;
      break;
    }
    case 'Balloon Boy': {
      db.updatePlayerEffects(targetUser.id, { blinded_turns: 2 });
      effectText = `🎈 **${power.name}**: Cegou **${targetUser.username}** durante os próximos 2 ataques dele (sofrerá 14 de dano a cada ataque tentado)!`;
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
      db.updatePlayerEffects(attackerUser.id, { reflect_turns: 2, immune_turns: 2 });
      effectText = `🩰 **${power.name}**: **${attackerUser.username}** ativou a dança da Ballora! Durante 2 rondas, fica completamente imune a dano e reflete 1.5x todo o dano recebido de volta para quem a atacar!`;
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
          bonBonDmg = Math.floor(bonBonDmg / 2); // 3
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
        mDmg = Math.floor(mDmg / 2); // 5
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
      effectText = `🎁 **${power.name}**: Restaurou **+40 HP** a **${attackerUser.username}** (${healedHp}/100 HP)! O próximo ataque terá cooldown duplicado (2 min)!`;
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

module.exports = {
  data: new SlashCommandBuilder()
    .setName('atacar')
    .setDescription('Desfere um ataque com o teu animatronic a outro jogador!')
    .addUserOption(option =>
      option
        .setName('alvo')
        .setDescription('O jogador que pretendes atacar')
        .setRequired(true)
    ),

  async execute(interaction) {
    if (db.init) await db.init();

    const attackerUser = interaction.user;
    const targetUser = interaction.options.getUser('alvo');

    // 1. Validação: Impedir atacar a si próprio
    if (attackerUser.id === targetUser.id) {
      return interaction.reply({
        content: '❌ Não podes atacar a ti próprio!',
        ephemeral: true
      });
    }

    // 2. Validação: Impedir atacar bots do Discord
    if (targetUser.bot) {
      return interaction.reply({
        content: '❌ Os bots não participam nos duelos!',
        ephemeral: true
      });
    }

    // 3. Obter registo atual do atacante para verificar o cooldown e efeitos
    const currentAttackerState = db.getOrCreatePlayer(attackerUser.id);

    // 4. Verificar cooldown (com suporte a double_cooldown_turns e reduced_cooldown_attacks_remaining)
    const now = Date.now();
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
      const cooldownEmbed = new EmbedBuilder()
        .setTitle('⏳ Cooldown de Ataque')
        .setDescription(`Tens de aguardar **${remainingSeconds} segundos** antes de desferires outro ataque!${isDoubleCooldown ? ' *(Cooldown Duplo de 2 minutos ativo!)*' : (hasReducedCooldown ? ' *(Cooldown Reduzido de 30s ativo!)*' : '')}`)
        .setColor(0xf1c40f)
        .setTimestamp();

      return interaction.reply({ embeds: [cooldownEmbed], ephemeral: true });
    }

    if (isDoubleCooldown) {
      db.updatePlayerEffects(attackerUser.id, { double_cooldown_turns: currentAttackerState.double_cooldown_turns - 1 });
    }

    // 4.5. VERIFICAÇÃO DE APARIÇÃO DO SCOTT CAWTHON (10% DE CHANCE SE DESBLOQUEADO)
    const isScottUnlocked = db.hasUnlockedScott(attackerUser.id);
    const isScottDrawn = isScottUnlocked && (Math.random() < 0.10);

    if (isScottDrawn) {
      const attacker = db.assignScott(attackerUser.id);
      const animInfo = getAnimatronicByName('Scott Cawthon');

      db.setLastAttack(attackerUser.id, now);
      db.incrementAttacks(attackerUser.id);

      let target = db.getOrCreatePlayer(targetUser.id);
      const originalTargetHp = target.current_hp;

      // 1. Reset Total: reduz HP do alvo a 0 (KO) e reseta HP do alvo para 100
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

      // 2. God Mode: 100 HP e 5 turnos de invencibilidade total ao atacante
      db.updatePlayerHp(attackerUser.id, 100);
      db.updatePlayerEffects(attackerUser.id, { invincible_turns: 5 });

      // 3. Patch Notes (efeito duplo, sequencial):
      // a) Remove do próprio atacante todos os efeitos negativos
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

      // b) Aplica ao alvo renascido (100 HP) TODOS os efeitos negativos por 3 rondas
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

      // 4. Infinite Respawn: atacante mantido com 100 HP (sem KO)
      // 5. No Cooldown: 30s de cooldown nos próximos 5 ataques
      db.setReducedCooldownAttacks(attackerUser.id, 5);

      // Reset total da coleção do atacante (exceto Golden Freddy) e scott_unlocked = false
      db.resetScottCollection(attackerUser.id);

      const scottEmbed = new EmbedBuilder()
        .setTitle('👨‍💻 SCOTT CAWTHON ASSUMIU O CONTROLO! 👨‍💻')
        .setColor(0xFF0000)
        .setThumbnail(attackerUser.displayAvatarURL({ dynamic: true }))
        .addFields(
          {
            name: '🎮 O Criador Entrou no Jogo!',
            value: `**${attackerUser.username}** invocou **Scott Cawthon**, a entidade suprema e criadora de FNAF!`,
            inline: false
          },
          {
            name: '💻 Poder Especial: Developer Console',
            value: `🔴 **1. Reset Total**: Reduziu o HP de **${targetUser.username}** a **0 HP** *(KO Instantâneo)*, ignorando qualquer defesa!\n` +
                   `🛡️ **2. God Mode**: **${attackerUser.username}** recuperou HP máximo (100 HP) e ganhou **5 turnos de Invencibilidade Total**!\n` +
                   `🔄 **3. Patch Notes**: Limpou todos os seus próprios status negativos e infligiu **TODOS os efeitos negativos** (Stun, Poison, Blind, Confusion e Hack por 3 rondas) em **${targetUser.username}**!\n` +
                   `♾️ **4. Infinite Respawn**: Preveniu qualquer KO contra o atacante neste turno!\n` +
                   `⚡ **5. No Cooldown**: Cooldown de ataque reduzido para **30s** nos próximos **5 ataques** de **${attackerUser.username}**!`,
            inline: false
          },
          {
            name: `🛡️ Defensor: 👤 ${targetUser.username}`,
            value: `Ficou com **100/100 HP** *(Desligado e Renascido com Todos os Efeitos Negativos)*`,
            inline: false
          },
          {
            name: '🌀 Reset de Coleção Completa!',
            value: `Toda a coleção de **${attackerUser.username}** foi reiniciada (exceto Golden Freddy)! Terá de reunir todos os 25 animatronics novamente para voltar a desbloquear Scott Cawthon.`,
            inline: false
          }
        )
        .setDescription(`\n💀 **${targetUser.username}** foi desligado por **Scott Cawthon**!\n⚙️ A vida de **${targetUser.username}** foi reiniciada para 100 HP.`)
        .setFooter({ text: 'Developer Console • Cooldown reduzido de 30s ativado para os próximos 5 ataques!' })
        .setTimestamp();

      if (animInfo && animInfo.gif && animInfo.gif !== 'COLOCAR_URL_AQUI') {
        const directGifUrl = await resolveDirectGifUrl(animInfo.gif);
        if (directGifUrl) scottEmbed.setImage(directGifUrl);
      }

      return interaction.reply({ embeds: [scottEmbed] });
    }

    // 5. VERIFICAÇÃO DE EFEITOS NO ATACANTE (PARALISIA / IMOBILIZAÇÃO)
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

      const stunEmbed = new EmbedBuilder()
        .setTitle('⚡ Ataque Bloqueado — Atacante Paralisado!')
        .setDescription(`**${attackerUser.username}** tentou atacar mas está **paralisado/imobilizado** e não pode atacar neste turno! (Turnos restantes: **${remainingStun}**)${dotMessage}${koText}`)
        .setColor(0x95a5a6)
        .setFooter({ text: 'Cooldown de 1 minuto aplicado ao atacante.' })
        .setTimestamp();

      return interaction.reply({ embeds: [stunEmbed] });
    }

    // 6. VERIFICAÇÃO DE DANO DE STATUS NO ATACANTE (ENVENENAMENTO E CEGUEIRA)
    let statusDamageText = '';
    let currentAttackerHp = currentAttackerState.current_hp;

    // Envenenamento
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

    // Cegueira (Flash Balloon: 14 dano próprio ao tentar atacar)
    if (currentAttackerHp > 0 && currentAttackerState.blinded_turns > 0) {
      const remainingBlind = currentAttackerState.blinded_turns - 1;
      currentAttackerHp = Math.max(0, currentAttackerHp - 14);
      db.updatePlayerHp(attackerUser.id, currentAttackerHp);
      db.updatePlayerEffects(attackerUser.id, { blinded_turns: remainingBlind });
      statusDamageText += `\n🙈 Estavas cego (Flash Balloon) e sofreste **14** de dano próprio ao tentar atacar! (${currentAttackerHp}/${currentAttackerState.max_hp} HP)`;
    }

    // Verificar se o atacante foi desligado por envenenamento/cegueira antes de prosseguir
    if (currentAttackerHp === 0) {
      db.setLastAttack(attackerUser.id, now);
      db.resetPlayerHp(attackerUser.id);
      const statusKoEmbed = new EmbedBuilder()
        .setTitle('💀 Atacante Desligado por Efeito de Status!')
        .setDescription(`**${attackerUser.username}** tentou atacar mas sucumbiu aos efeitos de status!${statusDamageText}\n\n⚙️ A vida de **${attackerUser.username}** foi reiniciada para 100 HP.`)
        .setColor(0x992d22)
        .setFooter({ text: 'Cooldown de 1 minuto aplicado ao atacante.' })
        .setTimestamp();

      return interaction.reply({ embeds: [statusKoEmbed] });
    }

    // 7. VERIFICAÇÃO DE EFEITOS NO ATACANTE (CONFUSÃO)
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

      let koMessage = '';
      if (isSelfKo) {
        koMessage = `\n\n💀 **${attackerUser.username}** foi desligado pelo seu próprio ataque confuso!\n⚙️ A vida de **${attackerUser.username}** foi reiniciada para 100 HP.`;
        db.resetPlayerHp(attackerUser.id);
      }

      const multText = mult > 1.0 ? ` *(Dano multiplicado por ${mult}x!)*` : '';
      const confusedEmbed = new EmbedBuilder()
        .setTitle('🌀 Ataque Confuso — Dano Próprio!')
        .setColor(0x9b59b6)
        .setThumbnail(attackerUser.displayAvatarURL({ dynamic: true }))
        .setDescription(`**${attackerUser.username}** usou **${attacker.emoji} ${attacker.animatronic}** mas estava **confuso**!${statusDamageText}\n\n💥 Em vez de atacar o alvo, o dano de **${damageDealt}** virou-se contra si próprio!${multText} (${newAttackerHp}/${currentAttackerState.max_hp} HP)${koMessage}`)
        .setFooter({ text: 'Cooldown de 1 minuto aplicado ao atacante.' })
        .setTimestamp();

      if (animInfo && animInfo.gif && animInfo.gif !== 'COLOCAR_URL_AQUI') {
        const directGifUrl = await resolveDirectGifUrl(animInfo.gif);
        if (directGifUrl) confusedEmbed.setImage(directGifUrl);
      }

      return interaction.reply({ embeds: [confusedEmbed] });
    }

    // 8. VERIFICAÇÃO DE GATILHO DO ENNARD (SALA DE SCOOPING)
    const isEnnardForced = currentAttackerState.ennard_pending === 1;
    let isGoldenFreddyDrawn = false;
    let attacker;
    let animInfo;
    let forcedEnnardPowerName = null;

    if (isEnnardForced) {
      attacker = db.assignEnnard(attackerUser.id);
      animInfo = getAnimatronicByName('Ennard');
      db.setEnnardPending(attackerUser.id, 0); // Consome o gatilho pendente

      // Resetar o progresso dos 5 Funtimes na coleção do jogador após aparição do Ennard
      db.resetEnnardProgress(attackerUser.id);

      // Sortear aleatoriamente 1 dos 5 Funtimes para herdar o poder com 100% de certeza
      forcedEnnardPowerName = FUNTIME_NAMES[Math.floor(Math.random() * FUNTIME_NAMES.length)];
    } else {
      // Sorteio regular: 1% de chance secreta para GOLDEN FREDDY ou animatronic normal
      isGoldenFreddyDrawn = Math.random() < 0.01;

      if (isGoldenFreddyDrawn) {
        attacker = db.assignGoldenFreddy(attackerUser.id);
        animInfo = getAnimatronicByName('Golden Freddy');
      } else {
        attacker = db.assignNewDifferentAnimatronic(attackerUser.id);
        animInfo = getAnimatronicByName(attacker.animatronic);
      }

      // Registar qualquer animatronic sorteado no histórico de coleção do jogador
      db.recordAnimatronicSeen(attackerUser.id, attacker.animatronic);

      // Se saiu um dos 5 Funtimes, verificar se a coleção está completa e ativar gatilho do Ennard
      if (FUNTIME_NAMES.includes(attacker.animatronic)) {
        if (db.hasUnlockedEnnard(attackerUser.id)) {
          db.setEnnardPending(attackerUser.id, 1);
        }
      }
    }
    db.setLastAttack(attackerUser.id, now);
    db.incrementAttacks(attackerUser.id);

    // 9. Obter dados atualizados do alvo
    let target = db.getOrCreatePlayer(targetUser.id);

    // 10. EXECUÇÃO ESPECIAL DO GOLDEN FREDDY (ONE-HIT-KILL + INVENCIBILIDADE AO ATACANTE)
    if (isGoldenFreddyDrawn) {
      db.updatePlayerHp(targetUser.id, 0);
      db.updatePlayerEffects(attackerUser.id, { invincible_turns: 2 });
      db.incrementWins(attackerUser.id);
      db.incrementPlayerKills(attackerUser.id);
      db.recordDuel({
        attackerId: attackerUser.id,
        targetId: targetUser.id,
        animatronic: 'Golden Freddy',
        damage: 100,
        wasKo: 1,
        timestamp: now
      });

      const koMessage = `\n\n💀 **${targetUser.username}** foi desligado por **Golden Freddy**!\n⚙️ A vida de **${targetUser.username}** foi reiniciada para 100 HP.`;
      db.resetPlayerHp(targetUser.id);

      if (hasReducedCooldown) {
        db.decrementReducedCooldown(attackerUser.id);
      }

      const goldenEmbed = new EmbedBuilder()
        .setTitle('✨ GOLDEN FREDDY APARECEU! ✨')
        .setColor(0xFFD700)
        .setThumbnail(attackerUser.displayAvatarURL({ dynamic: true }))
        .addFields(
          {
            name: `🌟 Atacante Lendário: ✨ Golden Freddy`,
            value: `**${attackerUser.username}** invocou o lendário **Golden Freddy**!${statusDamageText}`,
            inline: false
          },
          {
            name: `💀 Efeito Lendário: One-Hit-Kill Instantâneo!`,
            value: `Reduziu a vida de **${targetUser.username}** diretamente a **0 HP**, ignorando qualquer forma de defesa ou resistência!\n🌟 **${attackerUser.username}** ganhou **2 turnos de invencibilidade total**!`,
            inline: false
          },
          {
            name: `🛡️ Defensor: 👤 ${targetUser.username}`,
            value: `Ficou com **0/100 HP** *(Desligado)*`,
            inline: false
          }
        )
        .setDescription(koMessage)
        .setFooter({ text: hasReducedCooldown ? 'Cooldown reduzido de 30s aplicado ao atacante.' : 'Cooldown de 1 minuto aplicado ao atacante.' })
        .setTimestamp();

      return interaction.reply({ embeds: [goldenEmbed] });
    }

    // 11. VERIFICAÇÃO DE EFEITOS DEFENSIVOS DO ALVO (INVENCIBILIDADE, IMUNIDADE E REFLEXO DA BALLORA)
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

    // 12. PREPARAR DANO BASE E SORTEIO DO PODER ESPECIAL (POWER)
    let baseDamage = rollDamage(animInfo);
    let isPowerActivated = false;
    let powerEffectText = '';
    let extraPowerDamage = 0;

    if (isEnnardForced && forcedEnnardPowerName) {
      // ENNARD: Ativação com 100% de garantia do poder Funtime herdado
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

    // 13. VERIFICAÇÃO DE ESQUIVA DO ALVO (Super Combo do Foxy / Evade)
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

    // 14. CÁLCULO FINAL DE DANO E HP DO ALVO OU REFLEXO DA BALLORA / STOMACH HATCH
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
    if (target.life_saver_turns > 0 && newTargetHp === 0 && totalDamageDealt > 0) {
      newTargetHp = 1;
      db.updatePlayerEffects(targetUser.id, { life_saver_turns: target.life_saver_turns - 1 });
      lifeSaverMsg = `\n\n🍕 **GARBAGE GOBBLE**: **${targetUser.username}** recusou-se a cair e sobreviveu com **1 HP**!`;
    }
    db.updatePlayerHp(targetUser.id, newTargetHp);

    // 15. Verificar se o alvo foi desligado (0 HP)
    const isTargetKo = newTargetHp === 0;
    let koMessage = '';
    if (isTargetKo) {
      db.incrementWins(attackerUser.id);
      db.incrementPlayerKills(attackerUser.id);
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

    // 16. CONSTRUÇÃO DO EMBED FINAL DE DUELO
    const embedColor = isTargetKo ? 0x992d22 : (isEnnardForced ? 0x4a4b4d : (isPowerActivated ? 0xf1c40f : 0xe74c3c));
    const embedTitle = isEnnardForced ? '🕸️ Duelo FNAF — ENNARD EMERGIU!' : '⚔️ Duelo FNAF — Ataque Desferido!';

    const embed = new EmbedBuilder()
      .setTitle(embedTitle)
      .setColor(embedColor)
      .setThumbnail(attackerUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        {
          name: `🗡️ Atacante: ${attacker.emoji} ${attacker.animatronic}`,
          value: `**${attackerUser.username}** usou **${attacker.animatronic}** e causou **${totalDamageDealt}** de dano! *(Margem: ${attacker.min_damage}–${attacker.max_damage})*${statusDamageText}${balloraReflectMsg}`,
          inline: false
        }
      );

    if (isInvincible) {
      embed.addFields({
        name: '🌟 Invencibilidade Ativa!',
        value: `**${targetUser.username}** está sob a aura de invencibilidade do Golden Freddy e ignorou todo o dano recebido! (Turnos restantes: **${target.invincible_turns}**)`,
        inline: false
      });
    } else if (isBalloraImmune) {
      embed.addFields({
        name: '🩰 Imunidade da Ballora Ativa!',
        value: `**${targetUser.username}** está imune a dano pela dança da Ballora e ignorou o ataque!`,
        inline: false
      });
    } else if (isEvaded) {
      embed.addFields({
        name: '💨 Esquiva Ativada!',
        value: `**${targetUser.username}** esquivou-se completamente do dano base deste ataque!`,
        inline: false
      });
    }

    if (isPowerActivated) {
      embed.addFields({
        name: `✨ Poder Especial Ativado: ${animInfo.power ? animInfo.power.name : 'Scooping Room'}`,
        value: powerEffectText,
        inline: false
      });
    }

    embed.addFields({
      name: `🛡️ Defensor: 👤 ${targetUser.username}`,
      value: `Ficou com **${newTargetHp}/${target.max_hp} HP**`,
      inline: false
    });

    if (hasReducedCooldown) {
      db.decrementReducedCooldown(attackerUser.id);
    }

    embed.setFooter({ text: hasReducedCooldown ? 'Cooldown reduzido de 30s aplicado ao atacante.' : 'Cooldown de 1 minuto aplicado ao atacante.' }).setTimestamp();

    if (animInfo && animInfo.gif && animInfo.gif !== 'COLOCAR_URL_AQUI') {
      const directGifUrl = await resolveDirectGifUrl(animInfo.gif);
      if (directGifUrl) embed.setImage(directGifUrl);
    }

    if (isTargetKo) {
      embed.setDescription(koMessage + lifeSaverMsg);
    } else if (lifeSaverMsg) {
      embed.setDescription(lifeSaverMsg);
    }

    await interaction.reply({ embeds: [embed] });
  }
};

