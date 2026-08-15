const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database');
const { ANIMATRONICS, GOLDEN_FREDDY, FUNTIME_NAMES } = require('../game/fnaf');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('colecao')
    .setDescription('Consulta a tua coleção de animatronics encontrados e o progresso do Ennard.'),

  async execute(interaction) {
    if (db.init) await db.init();

    const user = interaction.user;
    const { seenList, funtimesList, ennardUnlocked } = db.getPlayerCollection(user.id);

    // Definir as categorias de animatronics
    const classicosNames = ['Freddy', 'Foxy', 'Chica', 'Bonnie', 'Puppet', 'Springtrap'];
    const toysNames = ['Toy Freddy', 'Mangle', 'Toy Chica', 'Toy Bonnie', 'Balloon Boy'];
    const funtimesNames = ['Circus Baby', 'Ballora', 'Funtime Chica', 'Funtime Freddy', 'Funtime Foxy'];

    const formatCategory = (nameList) => {
      return nameList.map(name => {
        const found = ANIMATRONICS.find(a => a.name === name);
        const emoji = found ? found.emoji : '🤖';
        const isSeen = seenList.includes(name);
        return isSeen ? `✅ ${emoji} **${name}**` : `🔒 ~~${name}~~`;
      }).join('\n');
    };

    // Secretos: Golden Freddy e Ennard
    const isGoldenSeen = seenList.includes('Golden Freddy');
    const isEnnardSeen = seenList.includes('Ennard');

    const secretosText = [
      isGoldenSeen ? `✅ ✨ **Golden Freddy** *(Lendário)*` : `🔒 ~~Golden Freddy~~ *(Lendário)*`,
      isEnnardSeen ? `✅ 🕸️ **Ennard** *(Sala de Scooping)*` : (ennardUnlocked ? `🔓 🕸️ **Ennard** *(Desbloqueado!)*` : `🔒 ~~Ennard~~ *(Bloqueado)*`)
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

    const totalRosterCount = ANIMATRONICS.length + 1; // ANIMATRONICS + Golden Freddy
    const totalSeenCount = seenList.length;

    const embed = new EmbedBuilder()
      .setTitle(`🖼️ Coleção de Animatronics — ${user.username}`)
      .setColor(0x9b59b6)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
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
