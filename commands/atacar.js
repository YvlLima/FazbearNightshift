const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database');
const config = require('../config');
const { rollDamage, getAnimatronicByName, resolveDirectGifUrl } = require('../game/fnaf');

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
      db.updatePlayerEffects(targetUser.id, { stunned_turns: 2, stun_dot: 6 });
      effectText = `⛓️ **${power.name}**: Imobilizou **${targetUser.username}** em cabos de aço durante 2 turnos (sofrerá 6 de dano por cada turno imobilizado)!`;
      break;
    }
    case 'Toy Freddy': {
      effectText = `🧸 **${power.name}**: Entrou em fúria de IA! Multiplicou o dano do ataque por 2x e ignorou a esquiva do alvo!`;
      break;
    }
    case 'Toy Chica': {
      const currentAttacker = db.getOrCreatePlayer(attackerUser.id);
      const healedHp = Math.min(attacker.max_hp || 100, currentAttacker.current_hp + 12);
      db.updatePlayerHp(attackerUser.id, healedHp);
      effectText = `🐤 **${power.name}**: Comeu um lanche revigorante e curou **+12 HP** ao atacante! (${healedHp}/100 HP)`;
      break;
    }
    case 'Toy Bonnie': {
      extraDamage = 4;
      db.updatePlayerEffects(targetUser.id, { poisoned_turns: 3, poison_damage: 8 });
      effectText = `🧪 **${power.name}**: Causou +4 de dano direto inicial e envenenou **${targetUser.username}** durante 3 rondas (sofrerá 8 de dano por ronda)!`;
      break;
    }
    case 'Balloon Boy': {
      db.updatePlayerEffects(targetUser.id, { blinded_turns: 3 });
      effectText = `🎈 **${power.name}**: Cegou **${targetUser.username}** durante os próximos 3 ataques dele (sofrerá 11 de dano a cada ataque tentado)!`;
      break;
    }
    case 'Circus Baby': {
      const totalScooperDmg = Math.round(baseDamage * 2.5);
      extraDamage = totalScooperDmg - baseDamage;
      db.updatePlayerEffects(targetUser.id, { stunned_turns: 2 });
      effectText = `🎪 **${power.name}**: Aprisionou **${targetUser.username}** com a sua garra hidráulica por 2 rondas e causou 2.5x de dano (**${totalScooperDmg}** HP), ignorando esquiva e resistência!`;
      break;
    }
    case 'Ballora': {
      db.updatePlayerEffects(attackerUser.id, { reflect_turns: 2, immune_turns: 2 });
      effectText = `🩰 **${power.name}**: **${attackerUser.username}** ativou a dança da Ballora! Durante 2 rondas, fica completamente imune a dano e reflete 2x todo o dano recebido de volta para quem a atacar!`;
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
        extraDamage = res.extraDamage + 6;
        effectText = `🐻‍❄️ **${power.name}**: Lançou o Bon-Bon, copiando o poder de **${chosenFtName}** (+6 de dano extra)!\n➜ ${res.effectText}`;
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

    // 4. Verificar cooldown de 1 minuto (60.000 ms) por jogador
    const now = Date.now();
    const cooldownMs = config.attackCooldownMs || 60 * 1000;
    const timePassed = now - currentAttackerState.last_attack;

    if (timePassed < cooldownMs) {
      const remainingSeconds = Math.ceil((cooldownMs - timePassed) / 1000);
      const cooldownEmbed = new EmbedBuilder()
        .setTitle('⏳ Cooldown de Ataque')
        .setDescription(`Tens de aguardar **${remainingSeconds} segundos** antes de desferires outro ataque!`)
        .setColor(0xf1c40f)
        .setTimestamp();

      return interaction.reply({ embeds: [cooldownEmbed], ephemeral: true });
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

    // Cegueira (Flash Balloon: 11 dano próprio ao tentar atacar)
    if (currentAttackerHp > 0 && currentAttackerState.blinded_turns > 0) {
      const remainingBlind = currentAttackerState.blinded_turns - 1;
      currentAttackerHp = Math.max(0, currentAttackerHp - 11);
      db.updatePlayerHp(attackerUser.id, currentAttackerHp);
      db.updatePlayerEffects(attackerUser.id, { blinded_turns: remainingBlind });
      statusDamageText += `\n🙈 Estavas cego (Flash Balloon) e sofreste **11** de dano próprio ao tentar atacar! (${currentAttackerHp}/${currentAttackerState.max_hp} HP)`;
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
      db.updatePlayerEffects(attackerUser.id, {
        confused_turns: currentAttackerState.confused_turns - 1,
        confused_multiplier: 1.0
      });

      const attacker = db.assignNewDifferentAnimatronic(attackerUser.id);
      const animInfo = getAnimatronicByName(attacker.animatronic);
      db.setLastAttack(attackerUser.id, now);

      const rawDamage = rollDamage(animInfo);
      const damageDealt = Math.round(rawDamage * mult);
      const newAttackerHp = Math.max(0, currentAttackerHp - damageDealt);
      db.updatePlayerHp(attackerUser.id, newAttackerHp);

      const isSelfKo = newAttackerHp === 0;
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

    // 8. SORTEIO DO ANIMATRONIC: 1% de chance secreta para GOLDEN FREDDY
    const isGoldenFreddyDrawn = Math.random() < 0.01;
    let attacker;
    let animInfo;

    if (isGoldenFreddyDrawn) {
      attacker = db.assignGoldenFreddy(attackerUser.id);
      animInfo = getAnimatronicByName('Golden Freddy');
    } else {
      attacker = db.assignNewDifferentAnimatronic(attackerUser.id);
      animInfo = getAnimatronicByName(attacker.animatronic);
    }
    db.setLastAttack(attackerUser.id, now);

    // 9. Obter dados atualizados do alvo
    let target = db.getOrCreatePlayer(targetUser.id);

    // 10. EXECUÇÃO ESPECIAL DO GOLDEN FREDDY (ONE-HIT-KILL + INVENCIBILIDADE AO ATACANTE)
    if (isGoldenFreddyDrawn) {
      db.updatePlayerHp(targetUser.id, 0);
      db.updatePlayerEffects(attackerUser.id, { invincible_turns: 2 });
      db.incrementPlayerKills(attackerUser.id);

      const koMessage = `\n\n💀 **${targetUser.username}** foi desligado por **Golden Freddy**!\n⚙️ A vida de **${targetUser.username}** foi reiniciada para 100 HP.`;
      db.resetPlayerHp(targetUser.id);

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
        .setFooter({ text: 'Cooldown de 1 minuto aplicado ao atacante.' })
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

    const powerChance = animInfo.power ? animInfo.power.chance : 0;
    if (!isInvincible && animInfo.power && Math.random() < powerChance) {
      isPowerActivated = true;

      if (attacker.animatronic === 'Mangle') {
        const possiblePowers = [
          'Freddy', 'Foxy', 'Chica', 'Bonnie', 'Springtrap',
          'Puppet', 'Toy Freddy', 'Toy Chica', 'Toy Bonnie', 'Balloon Boy',
          'Circus Baby', 'Ballora', 'Funtime Chica', 'Funtime Freddy', 'Funtime Foxy'
        ];
        const copiedAnimName = possiblePowers[Math.floor(Math.random() * possiblePowers.length)];
        const result = applyPowerEffect(copiedAnimName, attackerUser, targetUser, target, attacker, isInvincible, baseDamage);

        if (result) {
          if (copiedAnimName === 'Toy Freddy') {
            baseDamage = baseDamage * 2;
          } else {
            extraPowerDamage = result.extraDamage;
          }
          powerEffectText = `🐺 **${animInfo.power.name}**: Copiou o poder de **${copiedAnimName}** (${result.power.name})!\n➜ ${result.effectText}`;
        }
      } else {
        const result = applyPowerEffect(attacker.animatronic, attackerUser, targetUser, target, attacker, isInvincible, baseDamage);
        if (result) {
          if (attacker.animatronic === 'Toy Freddy') {
            baseDamage = baseDamage * 2;
          } else {
            extraPowerDamage = result.extraDamage;
          }
          powerEffectText = result.effectText;
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

    // 14. CÁLCULO FINAL DE DANO E HP DO ALVO OU REFLEXO DA BALLORA
    let totalDamageDealt = (isInvincible || isBalloraImmune) ? 0 : (baseDamage + extraPowerDamage);
    let balloraReflectMsg = '';

    if (isBalloraReflect && totalDamageDealt > 0) {
      const reflectedDmg = Math.round(totalDamageDealt * 2);
      const newAttackerHpAfterReflect = Math.max(0, currentAttackerHp - reflectedDmg);
      db.updatePlayerHp(attackerUser.id, newAttackerHpAfterReflect);

      balloraReflectMsg = `\n\n🪞 **DANO REFLETIDO (Spindash Ballet)**: **${targetUser.username}** refletiu 2x o dano de volta! **${attackerUser.username}** sofreu **${reflectedDmg}** de dano! (${newAttackerHpAfterReflect}/${currentAttackerState.max_hp} HP)`;

      if (newAttackerHpAfterReflect === 0) {
        balloraReflectMsg += `\n💀 **${attackerUser.username}** foi desligado pelo dano refletido da Ballora!\n⚙️ A vida de **${attackerUser.username}** foi reiniciada para 100 HP.`;
        db.resetPlayerHp(attackerUser.id);
      }

      totalDamageDealt = 0;
    }

    const newTargetHp = Math.max(0, target.current_hp - totalDamageDealt);
    db.updatePlayerHp(targetUser.id, newTargetHp);

    // 15. Verificar se o alvo foi desligado (0 HP)
    const isTargetKo = newTargetHp === 0;
    let koMessage = '';
    if (isTargetKo) {
      db.incrementPlayerKills(attackerUser.id);
      koMessage = `\n\n💀 **${targetUser.username}** foi desligado por **${attacker.animatronic}**!\n⚙️ A vida de **${targetUser.username}** foi reiniciada para 100 HP.`;
      db.resetPlayerHp(targetUser.id);
    }

    // 16. CONSTRUÇÃO DO EMBED FINAL DE DUELO
    const embed = new EmbedBuilder()
      .setTitle('⚔️ Duelo FNAF — Ataque Desferido!')
      .setColor(isTargetKo ? 0x992d22 : (isPowerActivated ? 0xf1c40f : 0xe74c3c))
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
        name: `✨ Poder Especial Ativado: ${animInfo.power.name}`,
        value: powerEffectText,
        inline: false
      });
    }

    embed.addFields({
      name: `🛡️ Defensor: 👤 ${targetUser.username}`,
      value: `Ficou com **${newTargetHp}/${target.max_hp} HP**`,
      inline: false
    });

    embed.setFooter({ text: 'Cooldown de 1 minuto aplicado ao atacante.' }).setTimestamp();

    if (animInfo && animInfo.gif && animInfo.gif !== 'COLOCAR_URL_AQUI') {
      const directGifUrl = await resolveDirectGifUrl(animInfo.gif);
      if (directGifUrl) embed.setImage(directGifUrl);
    }

    if (isTargetKo) {
      embed.setDescription(koMessage);
    }

    await interaction.reply({ embeds: [embed] });
  }
};

