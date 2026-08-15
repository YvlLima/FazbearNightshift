const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Consulta a tua vida, eliminações e o teu último animatronic/dano.')
    .addUserOption(option =>
      option
        .setName('utilizador')
        .setDescription('Consulta o status de outro jogador (opcional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    if (db.init) await db.init();

    const targetUser = interaction.options.getUser('utilizador') || interaction.user;

    // Impedir consulta de status de bots
    if (targetUser.bot) {
      return interaction.reply({
        content: '❌ Os bots não participam no jogo!',
        ephemeral: true
      });
    }

    // Obter dados do jogador sem alterar o animatronic
    const player = db.getOrCreatePlayer(targetUser.id);
    const hasAttacked = Boolean(player.last_attack > 0 && player.animatronic);

    const { FUNTIME_NAMES } = require('../game/fnaf');
    let funtimesSeenList = [];
    try {
      funtimesSeenList = JSON.parse(player.funtimes_seen || '[]');
    } catch(e) {
      funtimesSeenList = [];
    }
    const funtimesCount = FUNTIME_NAMES.filter(name => funtimesSeenList.includes(name)).length;
    const isEnnardUnlocked = funtimesCount === 5;

    const activeEffects = [];
    if (player.ennard_pending === 1) activeEffects.push(`🕸️ **Ennard Pendente** (Emergirá com 100% de certeza no próximo ataque!)`);
    if (player.stunned_turns > 0) activeEffects.push(`⚡ **Paralisado/Imobilizado** (${player.stunned_turns} turnos restantes)`);
    if (player.confused_turns > 0) {
      const multText = (player.confused_multiplier && player.confused_multiplier > 1.0) ? ` [${player.confused_multiplier}x dano próprio]` : '';
      activeEffects.push(`🌀 **Confuso** (no próximo ataque causará dano próprio${multText})`);
    }
    if (player.evade_next === 1) activeEffects.push(`💨 **Esquiva Ativa** (ignora próximo dano)`);
    if (player.resist_next_power === 1) activeEffects.push(`🛡️ **Resistência Ativa** (divide por 2 próximo poder especial)`);
    if (player.invincible_turns > 0) activeEffects.push(`🌟 **Invencível** (${player.invincible_turns} turnos restantes)`);
    if (player.immune_turns > 0) activeEffects.push(`🩰 **Imunidade (Ballora)** (${player.immune_turns} rondas restantes)`);
    if (player.reflect_turns > 0) activeEffects.push(`🪞 **Reflexo de Dano (Ballora - 2x)** (${player.reflect_turns} rondas restantes)`);
    if (player.poisoned_turns > 0) {
      const pDmg = player.poison_damage || 8;
      activeEffects.push(`🧪 **Envenenado** (${pDmg} de dano por turno | ${player.poisoned_turns} rondas restantes)`);
    }
    if (player.blinded_turns > 0) activeEffects.push(`🙈 **Cego** (11 de dano próprio ao atacar | ${player.blinded_turns} ataques restantes)`);

    const embed = new EmbedBuilder()
      .setTitle(`👤 Status de ${targetUser.username}`)
      .setColor(0x3498db)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        {
          name: '❤️ Vida',
          value: `**${player.current_hp}/${player.max_hp} HP**`,
          inline: true
        },
        {
          name: '☠️ Eliminações',
          value: `**${player.kills || 0} KOs**`,
          inline: true
        },
        {
          name: '🕸️ Coleção Ennard',
          value: `**${funtimesCount}/5 Funtimes** ${isEnnardUnlocked ? '✨ *(Desbloqueado!)*' : ''}`,
          inline: true
        }
      )
      .setTimestamp();

    // Apenas adiciona as secções de animatronic e dano se o jogador já tiver efetuado algum ataque
    if (hasAttacked) {
      embed.addFields(
        {
          name: '🤖 Último Animatronic',
          value: `${player.emoji} **${player.animatronic}**`,
          inline: true
        },
        {
          name: '⚔️ Dano',
          value: `**${player.min_damage} - ${player.max_damage}**`,
          inline: true
        }
      );
    }

    if (activeEffects.length > 0) {
      embed.addFields({
        name: '✨ Efeitos Ativos',
        value: activeEffects.join('\n'),
        inline: false
      });
    }

    await interaction.reply({ embeds: [embed] });
  }
};
