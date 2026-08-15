const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('servidor-ranking')
    .setDescription('Consulta o ranking de KOs dos jogadores deste servidor.'),

  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: '❌ Este comando só pode ser utilizado dentro de um servidor!',
        ephemeral: true
      });
    }

    // Evita o timeout de 3s do Discord diferindo a resposta imediatamente
    await interaction.deferReply();

    if (db.init) await db.init();

    const allPlayersWithKills = db.getAllPlayersWithKills();

    const embed = new EmbedBuilder()
      .setTitle(`🏆 Ranking do Servidor — ${interaction.guild.name}`)
      .setColor(0xFFD700)
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setTimestamp();

    if (!allPlayersWithKills || allPlayersWithKills.length === 0) {
      embed.setDescription('Ainda ninguém foi derrotado neste servidor. Sê o primeiro a desligar um oponente!');
      return interaction.editReply({ embeds: [embed] });
    }

    // Filtrar os jogadores com KOs que pertencem a este servidor (até ao limite de 10)
    const localPlayers = [];
    for (const p of allPlayersWithKills) {
      if (localPlayers.length >= 10) break;

      let member = interaction.guild.members.cache.get(p.user_id);
      if (!member) {
        try {
          member = await interaction.guild.members.fetch(p.user_id);
        } catch (e) {
          member = null;
        }
      }

      if (member) {
        localPlayers.push(p);
      }
    }

    if (localPlayers.length === 0) {
      embed.setDescription('Nenhum membro ativo deste servidor possui KOs registados ainda.');
      return interaction.editReply({ embeds: [embed] });
    }

    const medals = ['🥇', '🥈', '🥉'];
    const lines = localPlayers.map((player, index) => {
      const rankIcon = medals[index] || `**${index + 1}º**`;
      const killText = player.kills === 1 ? '1 kill' : `${player.kills} kills`;
      return `${rankIcon} <@${player.user_id}> — **${killText}**`;
    });

    embed.setDescription(lines.join('\n\n'));
    embed.setFooter({ text: 'Ranking Local • Fazbear Nightshift' });

    await interaction.editReply({ embeds: [embed] });
  }
};
