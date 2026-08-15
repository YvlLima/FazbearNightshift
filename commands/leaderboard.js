const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Consulta o ranking global dos jogadores com mais eliminações (KOs).'),

  async execute(interaction) {
    if (db.init) await db.init();

    const topPlayers = db.getTopKillsLeaderboard(10);

    const embed = new EmbedBuilder()
      .setTitle('🏆 Leaderboard — Caçadores Mais Temidos')
      .setColor(0xFFD700)
      .setTimestamp();

    if (!topPlayers || topPlayers.length === 0) {
      embed.setDescription('Ainda ninguém foi derrotado. Sê o primeiro a desligar um oponente!');
      return interaction.reply({ embeds: [embed] });
    }

    const medals = ['🥇', '🥈', '🥉'];
    const lines = topPlayers.map((player, index) => {
      const rankIcon = medals[index] || `**${index + 1}º**`;
      const killText = player.kills === 1 ? '1 kill' : `${player.kills} kills`;
      return `${rankIcon} <@${player.user_id}> — **${killText}**`;
    });

    embed.setDescription(lines.join('\n\n'));
    embed.setFooter({ text: 'Duelos FNAF PvP • Fazbear Nightshift' });

    await interaction.reply({ embeds: [embed] });
  }
};
