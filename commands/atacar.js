const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../database');
const { executeCombatRound } = require('../game/combatEngine');
const { getAnimatronicByName, resolveDirectGifUrl } = require('../game/fnaf');

/**
 * Cria a barra de botões interativos para o embed de duelo.
 * @param {boolean} isDisabled - Se verdadeiro, os botões são exibidos desativados.
 * @returns {ActionRowBuilder}
 */
/**
 * Cria a barra de botões interativos para o embed de duelo.
 * @param {boolean} isRematchDisabled - Se verdadeiro, o botão de Revanche fica desativado.
 * @param {boolean} isProfileDisabled - Se verdadeiro, o botão de Ver Perfil fica desativado.
 * @returns {ActionRowBuilder}
 */
function createDuelActionRow(isRematchDisabled = false, isProfileDisabled = false) {
  const rematchBtn = new ButtonBuilder()
    .setCustomId('rematch')
    .setLabel('⚔️ Revanche')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(isRematchDisabled);

  const profileBtn = new ButtonBuilder()
    .setCustomId('view_profile')
    .setLabel('📊 Ver Perfil')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(isProfileDisabled);

  return new ActionRowBuilder().addComponents(rematchBtn, profileBtn);
}

/**
 * Executa a lógica de apresentação e coleção de botões para um duelo.
 */
async function processDuel({ interaction, attackerUser, targetUser }) {
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply();
  }

  const result = executeCombatRound({ attackerUser, targetUser });

  // 1. Caso de Cooldown
  if (result.type === 'cooldown') {
    const cooldownEmbed = new EmbedBuilder()
      .setTitle('⏳ Cooldown de Ataque')
      .setDescription(
        `Tens de aguardar **${result.remainingSeconds} segundos** antes de desferires outro ataque!${
          result.isDoubleCooldown
            ? ' *(Cooldown Duplo de 2 minutos ativo!)*'
            : result.hasReducedCooldown
            ? ' *(Cooldown Reduzido de 30s ativo!)*'
            : ''
        }`
      )
      .setColor(0xf1c40f)
      .setTimestamp();

    await interaction.editReply({ embeds: [cooldownEmbed] });
    return false;
  }

  // 2. Caso de Invocação do Scott Cawthon
  if (result.type === 'scott') {
    const scottEmbed = new EmbedBuilder()
      .setTitle('👨‍💻 SCOTT CAWTHON ASSUMIU O CONTROLO! 👨‍💻')
      .setColor(0xff0000)
      .setThumbnail(attackerUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        {
          name: '🎮 O Criador Entrou no Jogo!',
          value: `**${attackerUser.username}** invocou **Scott Cawthon**, a entidade suprema e criadora de FNAF!`,
          inline: false
        },
        {
          name: '💻 Poder Especial: Developer Console',
          value:
            `🔴 **1. Reset Total**: Reduziu o HP de **${targetUser.username}** a **0 HP** *(KO Instantâneo)*, ignorando qualquer defesa!\n` +
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

    if (result.animInfo && result.animInfo.gif && result.animInfo.gif !== 'COLOCAR_URL_AQUI') {
      const directGifUrl = await resolveDirectGifUrl(result.animInfo.gif);
      if (directGifUrl) scottEmbed.setImage(directGifUrl);
    }

    const row = createDuelActionRow(false, false);
    const response = await interaction.editReply({ embeds: [scottEmbed], components: [row] });
    attachButtonCollector(response, interaction, attackerUser, targetUser);
    return true;
  }

  // 3. Caso de Atacante Paralisado
  if (result.type === 'stunned') {
    const stunEmbed = new EmbedBuilder()
      .setTitle('⚡ Ataque Bloqueado — Atacante Paralisado!')
      .setDescription(
        `**${attackerUser.username}** tentou atacar mas está **paralisado/imobilizado** e não pode atacar neste turno! (Turnos restantes: **${result.remainingStun}**)${result.dotMessage}${result.koText}`
      )
      .setColor(0x95a5a6)
      .setFooter({ text: 'Cooldown de 1 minuto aplicado ao atacante.' })
      .setTimestamp();

    await interaction.editReply({ embeds: [stunEmbed] });
    return true;
  }

  // 4. Caso de Atacante Desligado por Efeito de Status (Veneno/Cegueira)
  if (result.type === 'status_ko') {
    const statusKoEmbed = new EmbedBuilder()
      .setTitle('💀 Atacante Desligado por Efeito de Status!')
      .setDescription(
        `**${attackerUser.username}** tentou atacar mas sucumbiu aos efeitos de status!${result.statusDamageText}\n\n⚙️ A vida de **${attackerUser.username}** foi reiniciada para 100 HP.`
      )
      .setColor(0x992d22)
      .setFooter({ text: 'Cooldown de 1 minuto aplicado ao atacante.' })
      .setTimestamp();

    await interaction.editReply({ embeds: [statusKoEmbed] });
    return true;
  }

  // 5. Caso de Ataque Confuso (Dano Próprio)
  if (result.type === 'confused') {
    let koMessage = '';
    if (result.isSelfKo) {
      koMessage = `\n\n💀 **${attackerUser.username}** foi desligado pelo seu próprio ataque confuso!\n⚙️ A vida de **${attackerUser.username}** foi reiniciada para 100 HP.`;
    }

    const multText = result.mult > 1.0 ? ` *(Dano multiplicado por ${result.mult}x!)*` : '';
    const confusedEmbed = new EmbedBuilder()
      .setTitle('🌀 Ataque Confuso — Dano Próprio!')
      .setColor(0x9b59b6)
      .setThumbnail(attackerUser.displayAvatarURL({ dynamic: true }))
      .setDescription(
        `**${attackerUser.username}** usou **${result.attacker.emoji} ${result.attacker.animatronic}** mas estava **confuso**!${result.statusDamageText}\n\n💥 Em vez de atacar o alvo, o dano de **${result.damageDealt}** virou-se contra si próprio!${multText} (${result.newAttackerHp}/${result.maxHp} HP)${koMessage}`
      )
      .setFooter({ text: 'Cooldown de 1 minuto aplicado ao atacante.' })
      .setTimestamp();

    if (result.animInfo && result.animInfo.gif && result.animInfo.gif !== 'COLOCAR_URL_AQUI') {
      const directGifUrl = await resolveDirectGifUrl(result.animInfo.gif);
      if (directGifUrl) confusedEmbed.setImage(directGifUrl);
    }

    const row = createDuelActionRow(false, false);
    const response = await interaction.editReply({ embeds: [confusedEmbed], components: [row] });
    attachButtonCollector(response, interaction, attackerUser, targetUser);
    return true;
  }

  // 6. Caso do Golden Freddy
  if (result.type === 'golden_freddy') {
    let koMessage = '';
    if (result.isKo) {
      koMessage = `\n\n💀 **${targetUser.username}** foi desligado por **Golden Freddy**!\n⚙️ A vida de **${targetUser.username}** foi reiniciada para 100 HP.`;
    }

    const defenderHpText = result.isKo ? '0/100 HP *(Desligado)*' : `${result.newTargetHp}/100 HP`;

    const goldenEmbed = new EmbedBuilder()
      .setTitle('✨ GOLDEN FREDDY APARECEU! ✨')
      .setColor(0xffd700)
      .setThumbnail(attackerUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        {
          name: `🌟 Atacante Lendário: ✨ Golden Freddy`,
          value: `**${attackerUser.username}** invocou o lendário **Golden Freddy**!${result.statusDamageText}`,
          inline: false
        },
        {
          name: `💥 Poder Lendário: Golden Jumpscare!`,
          value: `Causou **75 de dano fixo** a **${targetUser.username}**, ignorando qualquer forma de defesa ou resistência!\n🌟 **${attackerUser.username}** ganhou **2 turnos de Invencibilidade Total**!`,
          inline: false
        },
        {
          name: `🛡️ Defensor: 👤 ${targetUser.username}`,
          value: `Ficou com **${defenderHpText}**`,
          inline: false
        }
      );

    if (koMessage) {
      goldenEmbed.setDescription(koMessage);
    }

    goldenEmbed
      .setFooter({
        text: result.hasReducedCooldown
          ? 'Cooldown reduzido de 30s aplicado ao atacante.'
          : 'Cooldown de 1 minuto aplicado ao atacante.'
      })
      .setTimestamp();

    if (result.animInfo && result.animInfo.gif && result.animInfo.gif !== 'COLOCAR_URL_AQUI') {
      const directGifUrl = await resolveDirectGifUrl(result.animInfo.gif);
      if (directGifUrl) goldenEmbed.setImage(directGifUrl);
    }

    const row = createDuelActionRow(false, false);
    const response = await interaction.editReply({ embeds: [goldenEmbed], components: [row] });
    attachButtonCollector(response, interaction, attackerUser, targetUser);
    return true;
  }

  // 7. Duelo Padrão / Regular
  if (result.type === 'duel') {
    const embedColor = result.isTargetKo
      ? 0x992d22
      : result.isEnnardForced
      ? 0x4a4b4d
      : result.isPowerActivated
      ? 0xf1c40f
      : 0xe74c3c;

    const embedTitle = result.isEnnardForced
      ? '🕸️ Duelo FNAF — ENNARD EMERGIU!'
      : '⚔️ Duelo FNAF — Ataque Desferido!';

    const embed = new EmbedBuilder()
      .setTitle(embedTitle)
      .setColor(embedColor)
      .setThumbnail(attackerUser.displayAvatarURL({ dynamic: true }))
      .addFields({
        name: `🗡️ Atacante: ${result.attacker.emoji} ${result.attacker.animatronic}`,
        value: `**${attackerUser.username}** usou **${result.attacker.animatronic}** e causou **${result.totalDamageDealt}** de dano! *(Margem: ${result.attacker.min_damage}–${result.attacker.max_damage})*${result.statusDamageText}${result.balloraReflectMsg}`,
        inline: false
      });

    if (result.isInvincible) {
      embed.addFields({
        name: '🌟 Invencibilidade Ativa!',
        value: `**${targetUser.username}** está sob a aura de invencibilidade do Golden Freddy e ignorou todo o dano recebido! (Turnos restantes: **${result.target.invincible_turns}**)`,
        inline: false
      });
    } else if (result.isBalloraImmune) {
      embed.addFields({
        name: '🩰 Imunidade da Ballora Ativa!',
        value: `**${targetUser.username}** está imune a dano pela dança da Ballora e ignorou o ataque!`,
        inline: false
      });
    } else if (result.isEvaded) {
      embed.addFields({
        name: '💨 Esquiva Ativada!',
        value: `**${targetUser.username}** esquivou-se completamente do dano base deste ataque!`,
        inline: false
      });
    }

    if (result.isPowerActivated) {
      embed.addFields({
        name: `✨ Poder Especial Ativado: ${result.animInfo.power ? result.animInfo.power.name : 'Scooping Room'}`,
        value: result.powerEffectText,
        inline: false
      });
    }

    embed.addFields({
      name: `🛡️ Defensor: 👤 ${targetUser.username}`,
      value: `Ficou com **${result.newTargetHp}/${result.target.max_hp} HP**`,
      inline: false
    });

    embed
      .setFooter({
        text: result.hasReducedCooldown
          ? 'Cooldown reduzido de 30s aplicado ao atacante.'
          : 'Cooldown de 1 minuto aplicado ao atacante.'
      })
      .setTimestamp();

    if (result.animInfo && result.animInfo.gif && result.animInfo.gif !== 'COLOCAR_URL_AQUI') {
      const directGifUrl = await resolveDirectGifUrl(result.animInfo.gif);
      if (directGifUrl) embed.setImage(directGifUrl);
    }

    if (result.isTargetKo) {
      embed.setDescription(result.koMessage + result.lifeSaverMsg);
    } else if (result.lifeSaverMsg) {
      embed.setDescription(result.lifeSaverMsg);
    }

    const row = createDuelActionRow(false, false);
    const response = await interaction.editReply({ embeds: [embed], components: [row] });
    attachButtonCollector(response, interaction, attackerUser, targetUser);
    return true;
  }

  return false;
}

/**
 * Anexa o collector de interações para os botões Revanche e Ver Perfil.
 */
function attachButtonCollector(responseMessage, parentInteraction, attackerUser, targetUser) {
  if (!responseMessage || typeof responseMessage.createMessageComponentCollector !== 'function') {
    return;
  }

  const collector = responseMessage.createMessageComponentCollector({
    time: 5 * 60 * 1000 // Expira em 5 minutos
  });

  collector.on('collect', async (btnInteraction) => {
    // 1. Botão Ver Perfil (disponível para qualquer pessoa)
    if (btnInteraction.customId === 'view_profile') {
      if (db.init) await db.init();
      const player = db.getOrCreatePlayer(btnInteraction.user.id);
      const totalAttacks = player.total_attacks || 0;
      const totalWins = player.total_wins || 0;
      const totalDeaths = player.total_deaths || 0;

      const totalDuelsFinished = totalWins + totalDeaths;
      const winRateText = totalDuelsFinished > 0
        ? `${((totalWins / totalDuelsFinished) * 100).toFixed(1)}%`
        : 'Sem dados suficientes';

      const lastAnimName = player.animatronic || 'Nenhum';
      const lastAnim = getAnimatronicByName(lastAnimName);
      const lastEmoji = lastAnim ? lastAnim.emoji : '🤖';

      const profileEmbed = new EmbedBuilder()
        .setTitle(`👤 Perfil de Guarda Noturno — ${btnInteraction.user.username}`)
        .setColor(0x9b59b6)
        .setThumbnail(btnInteraction.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .addFields(
          { name: '❤️ Vida Atual', value: `**${player.current_hp}/${player.max_hp} HP**`, inline: true },
          { name: '🤖 Último Animatronic Usado', value: `${lastEmoji} **${lastAnimName}**`, inline: true },
          { name: '⚔️ Total de Ataques', value: `**${totalAttacks} ataques**`, inline: true },
          { name: '🎯 Vitórias (KOs Causados)', value: `**${totalWins} vitórias**`, inline: true },
          { name: '💀 Mortes (Derrotas)', value: `**${totalDeaths} mortes**`, inline: true },
          { name: '📊 Taxa de Vitórias', value: `**${winRateText}**`, inline: true }
        )
        .setFooter({ text: 'Duelos FNAF PvP • Fazbear Nightshift' })
        .setTimestamp();

      return btnInteraction.reply({ embeds: [profileEmbed], ephemeral: true });
    }

    // 2. Botão Revanche
    if (btnInteraction.customId === 'rematch') {
      // O botão "Revanche" só pode ser usado pelo jogador que foi ATACADO (o defensor targetUser)
      if (btnInteraction.user.id !== targetUser.id) {
        return btnInteraction.reply({
          content: '❌ Só quem sofreu o ataque pode pedir revanche!',
          ephemeral: true
        });
      }

      // No duelo de revanche:
      // O novo atacante é quem pediu a revanche (defensor original: targetUser)
      // O novo alvo é o agressor original (attackerUser)
      const isExecuted = await processDuel({
        interaction: btnInteraction,
        attackerUser: targetUser,
        targetUser: attackerUser
      });

      // Se a revanche foi executada com sucesso (não barrada por cooldown), desativa apenas o botão de revanche no embed original
      if (isExecuted) {
        try {
          const disabledRow = createDuelActionRow(true, false);
          if (typeof parentInteraction.editReply === 'function') {
            await parentInteraction.editReply({ components: [disabledRow] });
          }
        } catch (err) {
          // Ignorar se a mensagem original tiver sido removida
        }
      }
    }
  });

  collector.on('end', async () => {
    try {
      const disabledRow = createDuelActionRow(true, true);
      if (typeof parentInteraction.editReply === 'function') {
        await parentInteraction.editReply({ components: [disabledRow] });
      }
    } catch (err) {
      // Ignorar erros caso a mensagem original tenha sido apagada
    }
  });
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
    await interaction.deferReply();

    if (db.init) await db.init();

    const attackerUser = interaction.user;
    const targetUser = interaction.options.getUser('alvo');

    // 1. Validação: Impedir atacar a si próprio
    if (attackerUser.id === targetUser.id) {
      return interaction.editReply({
        content: '❌ Não podes atacar a ti próprio!'
      });
    }

    // 2. Validação: Impedir atacar bots do Discord
    if (targetUser.bot) {
      return interaction.editReply({
        content: '❌ Os bots não participam nos duelos!'
      });
    }

    await processDuel({ interaction, attackerUser, targetUser });
  }
};
