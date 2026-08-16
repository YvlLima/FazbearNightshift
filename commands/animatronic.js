const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAllAnimatronics, getAnimatronicByName, resolveDirectGifUrl } = require('../game/fnaf');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('animatronic')
    .setDescription('Consulta a ficha técnica e poder de qualquer animatronic do roster.')
    .addStringOption(option =>
      option
        .setName('nome')
        .setDescription('Escolhe ou digita o nome do animatronic')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    const allAnimatronics = getAllAnimatronics();
    let filtered = allAnimatronics.filter(a =>
      a.name.toLowerCase().includes(focusedValue)
    );
    // Se a pesquisa estiver vazia, colocar os secretos (Scott, Golden Freddy, Ennard) no topo para estarem sempre visíveis nas 25 opções do Discord
    if (!focusedValue) {
      const secrets = ['Scott Cawthon', 'Golden Freddy', 'Ennard'];
      filtered.sort((a, b) => {
        const aSecret = secrets.includes(a.name) ? -1 : 1;
        const bSecret = secrets.includes(b.name) ? -1 : 1;
        return aSecret - bSecret;
      });
    }
    await interaction.respond(
      filtered.slice(0, 25).map(a => ({ name: `${a.emoji} ${a.name}`, value: a.name }))
    );
  },

  async execute(interaction) {
    const animName = interaction.options.getString('nome');
    const anim = getAnimatronicByName(animName);

    if (!anim) {
      return interaction.reply({
        content: `❌ Animatronic **"${animName}"** não foi encontrado no roster!`,
        ephemeral: true
      });
    }

    let chanceText = 'Sem poder ativo';
    let powerName = 'Nenhum';
    let powerDesc = 'Este animatronic não possui poder especial.';

    if (anim.power) {
      powerName = anim.power.name;
      powerDesc = anim.power.description;
      if (anim.power.chance === null) {
        chanceText = 'Gatilho Especial (100%)';
      } else {
        chanceText = `${Math.round(anim.power.chance * 100)}% de probabilidade`;
      }
    }

    const damageText = (anim.minDamage === 100 && anim.maxDamage === 100)
      ? '⚡ **100** *(Instakill)*'
      : `⚔️ **${anim.minDamage} – ${anim.maxDamage}**`;

    const embed = new EmbedBuilder()
      .setTitle(`${anim.emoji} Ficha Técnica — ${anim.name}`)
      .setColor(0x34495e)
      .setDescription(`*${anim.description}*`)
      .addFields(
        {
          name: '💥 Dano Base',
          value: damageText,
          inline: true
        },
        {
          name: '✨ Poder Especial',
          value: `**${powerName}**`,
          inline: true
        },
        {
          name: '🎯 Chance de Ativação',
          value: `**${chanceText}**`,
          inline: true
        },
        {
          name: '📖 Efeito do Poder',
          value: powerDesc,
          inline: false
        }
      )
      .setFooter({ text: 'Roster Fazbear Nightshift' })
      .setTimestamp();

    if (anim.gif && anim.gif !== 'COLOCAR_URL_AQUI') {
      const directGifUrl = await resolveDirectGifUrl(anim.gif);
      if (directGifUrl) embed.setImage(directGifUrl);
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
