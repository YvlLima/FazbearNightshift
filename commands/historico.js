const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database');
const { getAnimatronicByName } = require('../game/fnaf');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('historico')
    .setDescription('Consulta os últimos 10 duelos de um jogador.')
    .addUserOption(option =>
      option
        .setName('utilizador')
        .setDescription('O jogador cujo histórico pretendes consultar (opcional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    if (db.init) await db.init();

    const targetUser = interaction.options.getUser('utilizador') || interaction.user;
    const history = db.getDuelHistory(targetUser.id, 10);

    const embed = new EmbedBuilder()
      .setTitle(`📜 Histórico de Duelos — ${targetUser.username}`)
      .setColor(0x3498db)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
      .setFooter({ text: 'Últimos 10 duelos registados • Fazbear Nightshift' })
      .setTimestamp();

    if (!history || history.length === 0) {
      embed.setDescription('Nenhum duelo registado no histórico para este jogador.');
      return interaction.reply({ embeds: [embed] });
    }

    const lines = history.map((entry) => {
      const anim = getAnimatronicByName(entry.animatronic);
      const emoji = anim ? anim.emoji : '🤖';
      const koBadge = entry.was_ko ? '💀 **KO**' : 'sem KO';
      const relativeTime = `<t:${Math.floor(entry.timestamp / 1000)}:R>`;

      return `🗡️ <@${entry.attacker_id}> atacou <@${entry.target_id}> com ${emoji} **${entry.animatronic}** — **${entry.damage}** dano [${koBadge}] — ${relativeTime}`;
    });

    embed.setDescription(lines.join('\n\n'));

    await interaction.reply({ embeds: [embed] });
  }
};
