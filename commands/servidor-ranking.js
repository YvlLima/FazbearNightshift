const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('servidor-ranking')
    .setDescription('Consulta o ranking de KOs dos jogadores deste servidor.'),

  async execute(interaction) {
    if (db.init) await db.init();

    if (!interaction.guild) {
      return interaction.reply({
        content: '❌ Este comando só pode ser utilizado dentro de um servidor!',
        ephemeral: true
      });
    }

    const allPlayersWithKills = db.getAllPlayersWithKills();

    const embed = new EmbedBuilder()
      .setTitle(`🏆 Ranking do Servidor — ${interaction.guild.name}`)
      .setColor(0xFFD700)
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setTimestamp();

    if (!allPlayersWithKills || allPlayersWithKills.length === 0) {
      embed.setDescription('Ainda ninguém foi derrotado neste servidor. Sê o primeiro a desligar um oponente!');
      return interaction.reply({ embeds: [embed] });
    }

    // Tentar obter a lista de membros do servidor para filtrar apenas quem pertence a esta guild
    let guildMemberIds = new Set();
    try {
      const members = await interaction.guild.members.fetch();
      guildMemberIds = new Set(members.keys());
    } catch (e) {
      // Se não conseguir dar fetch massivo, usa os membros em cache
      guildMemberIds = new Set(interaction.guild.members.cache.keys());
    }

    const localPlayers = allPlayersWithKills.filter(p => guildMemberIds.has(p.user_id)).slice(0, 10);

    if (localPlayers.length === 0) {
      embed.setDescription('Nenhum membro ativo deste servidor possui KOs registados ainda.');
      return interaction.reply({ embeds: [embed] });
    }

    const medals = ['🥇', '🥈', '🥉'];
    const lines = localPlayers.map((player, index) => {
      const rankIcon = medals[index] || `**${index + 1}º**`;
      const killText = player.kills === 1 ? '1 kill' : `${player.kills} kills`;
      return `${rankIcon} <@${player.user_id}> — **${killText}**`;
    });

    embed.setDescription(lines.join('\n\n'));
    embed.setFooter({ text: 'Ranking Local • Fazbear Nightshift' });

    await interaction.reply({ embeds: [embed] });
  }
};
