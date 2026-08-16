const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database');
const { ANIMATRONICS, FUNTIME_NAMES } = require('../game/fnaf');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('colecao')
    .setDescription('Consulta a tua coleção de animatronics encontrados e o progresso do Ennard.')
    .addUserOption(option =>
      option
        .setName('utilizador')
        .setDescription('Consulta a coleção de outro jogador (opcional)')
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

    const { seenList, funtimesList, ennardUnlocked, scottUnlocked } = db.getPlayerCollection(targetUser.id);

    // Definir as categorias de animatronics
    const classicosNames = ['Freddy', 'Foxy', 'Chica', 'Bonnie', 'Puppet', 'Springtrap'];
    const toysNames = ['Toy Freddy', 'Mangle', 'Toy Chica', 'Toy Bonnie', 'Balloon Boy'];
    const funtimesNames = ['Circus Baby', 'Ballora', 'Funtime Chica', 'Funtime Freddy', 'Funtime Foxy'];
    const glamrocksNames = ['Glamrock Freddy', 'Glamrock Chica', 'Roxy', 'Monty', 'Sundrop/Moondrop', 'Vanny', 'Security Puppet', 'The Mimic'];

    const formatCategory = (nameList) => {
      return nameList.map(name => {
        const found = ANIMATRONICS.find(a => a.name === name);
        const emoji = found ? found.emoji : '🤖';
        const isSeen = seenList.includes(name);
        return isSeen ? `✅ ${emoji} **${name}**` : `🔒 ~~${name}~~`;
      }).join('\n');
    };

    // Secretos: Golden Freddy, Ennard e Scott Cawthon
    const isGoldenSeen = seenList.includes('Golden Freddy');
    const isEnnardSeen = seenList.includes('Ennard');
    let scottStatusText = '🔒 ~~Scott Cawthon~~';
    if (scottUnlocked) {
      scottStatusText = '✅ 👨‍💻 **Scott Cawthon**';
    } else if (!isGoldenSeen) {
      scottStatusText = '🔒 ~~Scott Cawthon~~ **';
    }

    const secretosText = [
      isGoldenSeen ? `✅ ✨ **Golden Freddy**` : `🔒 ~~Golden Freddy~~`,
      isEnnardSeen ? `✅ 🕸️ **Ennard**` : (ennardUnlocked ? `🔓 🕸️ **Ennard** — Desbloqueado!` : `🔒 ~~Ennard~~`),
      scottStatusText
    ].join('\n');

    // Progresso do Ennard
    const missingFuntimes = FUNTIME_NAMES.filter(name => !funtimesList.includes(name));
    let ennardSection = '';

    if (ennardUnlocked) {
      ennardSection = '🎉 **Ennard Desbloqueado!** Já pode aparecer nos teus duelos assim que jogares com um Funtime.';
    } else {
      const foundCount = 5 - missingFuntimes.length;
      ennardSection = `🔓 **Progresso Ennard**: **${foundCount}/5** Funtimes encontrados.\n*(Falta encontrar: ${missingFuntimes.join(', ')})*`;
    }

    const totalRosterCount = ANIMATRONICS.length + 1; // ANIMATRONICS (incl. Ennard e Scott Cawthon) + Golden Freddy = 27 total
    const totalSeenCount = seenList.length;

    const embed = new EmbedBuilder()
      .setTitle(`🖼️ Coleção de Animatronics — ${targetUser.username}`)
      .setColor(0x9b59b6)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .setDescription(`**Progresso Total**: **${totalSeenCount}/${totalRosterCount}** animatronics encontrados!\n\n${ennardSection}`)
      .addFields(
        {
          name: '🐻 Clássicos & Assustadores',
          value: formatCategory(classicosNames),
          inline: true
        },
        {
          name: '🧸 Animatronics Toy',
          value: formatCategory(toysNames),
          inline: true
        },
        {
          name: '🎪 Funtimes (Sister Location)',
          value: formatCategory(funtimesNames),
          inline: true
        },
        {
          name: '🎤 Glamrocks & Security (Security Breach)',
          value: formatCategory(glamrocksNames),
          inline: false
        },
        {
          name: '✨ Secretos & Especiais',
          value: secretosText,
          inline: false
        }
      )
      .setFooter({ text: 'Duelos FNAF PvP • Usa /atacar para descobrir novos animatronics!' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
