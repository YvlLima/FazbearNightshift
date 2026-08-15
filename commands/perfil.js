const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database');
const { getAnimatronicByName } = require('../game/fnaf');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('perfil')
    .setDescription('Consulta o perfil e estatísticas de combate de um jogador.')
    .addUserOption(option =>
      option
        .setName('utilizador')
        .setDescription('O jogador cujo perfil pretendes consultar (opcional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    if (db.init) await db.init();

    const targetUser = interaction.options.getUser('utilizador') || interaction.user;
    const player = db.getOrCreatePlayer(targetUser.id);

    const totalAttacks = player.total_attacks || 0;
    const totalWins = player.total_wins || 0;
    const winRate = totalAttacks > 0 ? ((totalWins / totalAttacks) * 100).toFixed(1) : '0.0';

    const ennardUnlocked = db.hasUnlockedEnnard(targetUser.id);
    const ennardText = ennardUnlocked ? '✅ Desbloqueado' : '❌ Bloqueado';

    const lastAnimName = player.animatronic || 'Nenhum';
    const lastAnim = getAnimatronicByName(lastAnimName);
    const lastEmoji = lastAnim ? lastAnim.emoji : '🤖';

    const embed = new EmbedBuilder()
      .setTitle(`👤 Perfil de Guarda Noturno — ${targetUser.username}`)
      .setColor(0x9b59b6)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        {
          name: '❤️ Estado Atual',
          value: `**HP:** ${player.current_hp} / ${player.max_hp} HP`,
          inline: true
        },
        {
          name: '🤖 Último Animatronic Usado',
          value: `${lastEmoji} **${lastAnimName}**`,
          inline: true
        },
        {
          name: '💀 Estatísticas de KO',
          value: `**Total KOs (Kills):** ${player.kills}\n**Vitórias (KOs causados):** ${totalWins}`,
          inline: true
        },
        {
          name: '⚔️ Desempenho em Duelos',
          value: `**Total de Ataques:** ${totalAttacks}\n**Taxa de Vitórias:** ${winRate}%`,
          inline: true
        },
        {
          name: '🕸️ Progresso do Ennard',
          value: `${ennardText}`,
          inline: true
        }
      )
      .setFooter({ text: 'Duelos FNAF PvP • Fazbear Nightshift' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
