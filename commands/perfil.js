const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database');
const { getAnimatronicByName } = require('../game/fnaf');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('perfil')
    .setDescription('Consulta o perfil e estatísticas de combate acumuladas de um jogador.')
    .addUserOption(option =>
      option
        .setName('utilizador')
        .setDescription('O jogador cujo perfil pretendes consultar (opcional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    if (db.init) await db.init();

    const targetUser = interaction.options.getUser('utilizador') || interaction.user;

    if (targetUser.bot) {
      return interaction.reply({
        content: '❌ Os bots não participam no jogo!',
        ephemeral: true
      });
    }

    const player = db.getOrCreatePlayer(targetUser.id);

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

    const embed = new EmbedBuilder()
      .setTitle(`👤 Perfil de Guarda Noturno — ${targetUser.username}`)
      .setColor(0x9b59b6)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        {
          name: '❤️ Vida Atual',
          value: `**${player.current_hp}/${player.max_hp} HP**`,
          inline: true
        },
        {
          name: '🤖 Último Animatronic Usado',
          value: `${lastEmoji} **${lastAnimName}**`,
          inline: true
        },
        {
          name: '⚔️ Total de Ataques',
          value: `**${totalAttacks} ataques**`,
          inline: true
        },
        {
          name: '🎯 Vitórias (KOs Causados)',
          value: `**${totalWins} vitórias**`,
          inline: true
        },
        {
          name: '💀 Mortes (Derrotas)',
          value: `**${totalDeaths} mortes**`,
          inline: true
        },
        {
          name: '📊 Taxa de Vitórias',
          value: `**${winRateText}**`,
          inline: true
        }
      )
      .setFooter({ text: 'Duelos FNAF PvP • Fazbear Nightshift' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
