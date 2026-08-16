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
    if (player.blinded_turns > 0) activeEffects.push(`🙈 **Cego** (14 de dano próprio ao atacar | ${player.blinded_turns} ataques restantes)`);
    if (player.stomach_protect_turns === 1) activeEffects.push(`🎤 **Escotilha Torácica (Glamrock Freddy)** (engole próximo ataque e devolve 2x)`);
    if (player.reduced_cooldown_attacks_remaining > 0) activeEffects.push(`⚡ **No Cooldown (Scott Cawthon)** (30s cooldown | ${player.reduced_cooldown_attacks_remaining} ataques restantes)`);
    if (player.double_cooldown_turns > 0) activeEffects.push(`⏳ **Cooldown Duplo** (2 min de espera | ${player.double_cooldown_turns} rondas restantes)`);
    if (player.life_saver_turns > 0) activeEffects.push(`🍕 **Modo Sobrevivência (Garbage Gobble)** (HP mín 1 | ${player.life_saver_turns} rondas restantes)`);
    if (player.double_damage_turns > 0) activeEffects.push(`🎸 **Dano Duplo (2x)** (${player.double_damage_turns} rondas restantes)`);
    if (player.hacked_turns > 0) activeEffects.push(`💻 **Hackeado (Glitch Override)** (50% auto-dano ao atacar | ${player.hacked_turns} ataques restantes)`);

    let seenList = [];
    try {
      seenList = JSON.parse(player.seen_animatronics || '[]');
    } catch(e) {
      seenList = [];
    }
    const isGoldenSeen = seenList.includes('Golden Freddy');
    const isScottUnlocked = db.hasUnlockedScott(targetUser.id);
    let scottText = 'Desbloqueado (10%) ✅';
    if (!isScottUnlocked) {
      if (!isGoldenSeen) {
        scottText = 'Bloqueado 🔒 *(Falta encontrar Golden Freddy)*';
      } else {
        scottText = 'Bloqueado 🔒 *(Coleção incompleta)*';
      }
    }

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
          name: '💻 Scott Cawthon',
          value: scottText,
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

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
