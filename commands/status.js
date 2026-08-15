const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database');
const { FUNTIME_NAMES } = require('../game/fnaf');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Consulta o estado de combate imediato (HP, efeitos ativos e progresso do Ennard).')
    .addUserOption(option =>
      option
        .setName('utilizador')
        .setDescription('Consulta o estado de combate de outro jogador (opcional)')
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
    if (player.stunned_turns > 0) activeEffects.push(`⚡ **Imobilizado** (${player.stunned_turns} turnos restantes)`);
    if (player.confused_turns > 0) {
      const multText = (player.confused_multiplier && player.confused_multiplier > 1.0) ? ` [${player.confused_multiplier}x dano próprio]` : '';
      activeEffects.push(`🌀 **Confuso** (no próximo ataque causará dano próprio${multText})`);
    }
    if (player.evade_next === 1) activeEffects.push(`💨 **Esquiva Ativa** (ignora próximo dano)`);
    if (player.resist_next_power === 1) activeEffects.push(`🛡️ **Resistência Ativa** (divide por 2 próximo poder especial)`);
    if (player.invincible_turns > 0) activeEffects.push(`🌟 **Invencível** (${player.invincible_turns} turnos restantes)`);
    if (player.immune_turns > 0) activeEffects.push(`🩰 **Imune (Ballora)** (${player.immune_turns} rondas restantes)`);
    if (player.reflect_turns > 0) activeEffects.push(`🪞 **Reflexo de Dano (Ballora - 1.5x)** (${player.reflect_turns} rondas restantes)`);
    if (player.poisoned_turns > 0) {
      const pDmg = player.poison_damage || 8;
      activeEffects.push(`🧪 **Envenenado** (${pDmg} de dano por turno | ${player.poisoned_turns} rondas restantes)`);
    }
    if (player.blinded_turns > 0) activeEffects.push(`🙈 **Cego** (11 de dano próprio ao atacar | ${player.blinded_turns} ataques restantes)`);

    const effectsText = activeEffects.length > 0 ? activeEffects.join('\n') : 'Nenhum efeito ativo';
    const ennardText = isEnnardUnlocked ? 'Desbloqueado ✅' : `**${funtimesCount}/5** Funtimes descobertos`;

    const embed = new EmbedBuilder()
      .setTitle(`⚔️ Estado de Combate — ${targetUser.username}`)
      .setColor(0x3498db)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        {
          name: '❤️ Vida Atual',
          value: `**${player.current_hp}/${player.max_hp} HP**`,
          inline: true
        },
        {
          name: '🕸️ Progresso do Ennard',
          value: ennardText,
          inline: true
        },
        {
          name: '✨ Efeitos Ativos',
          value: effectsText,
          inline: false
        }
      )
      .setFooter({ text: 'Duelos FNAF PvP • Fazbear Nightshift' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
