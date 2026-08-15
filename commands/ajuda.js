const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ajuda')
    .setDescription('Exibe o guia de comandos, regras e mecânicas do jogo FNAF Nightshift.'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🐻 Fazbear Nightshift — Guia & Comandos')
      .setColor(0x1abc9c)
      .setDescription('Bem-vindo ao **Fazbear Nightshift**! Um jogo PvP no Discord inspirado em Five Nights at Freddy\'s com duelos estratégicos entre guardas noturnos e animatronics.\n\n---')
      .addFields(
        {
          name: '📜 Comandos Slash Disponíveis',
          value:
            '`/atacar [alvo]` — Desfere um ataque ao jogador alvo com o teu animatronic.\n' +
            '`/status [utilizador]` — Consulta o estado de combate imediato (HP, efeitos ativos e progresso do Ennard).\n' +
            '`/perfil [utilizador]` — Consulta o perfil acumulado (HP, último animatronic, KOs, total de ataques e % de vitórias).\n' +
            '`/historico [utilizador]` — Mostra o registo dos últimos 10 duelos de um jogador.\n' +
            '`/colecao` — Consulta a tua coleção de animatronics descobertos.\n' +
            '`/animatronic [nome]` — Consulta a ficha técnica e poder de qualquer animatronic.\n' +
            '`/leaderboard` — Exibe o ranking global dos caçadores com mais KOs.\n' +
            '`/servidor-ranking` — Exibe o ranking de KOs filtrado para os membros deste servidor.\n' +
            '`/ajuda` — Exibe esta mensagem de ajuda e guia do jogo.',
          inline: false
        },
        {
          name: '🎮 Mecânicas Principais',
          value:
            '❤️ **Vida (HP)**: Todos os jogadores iniciam com **100 HP**.\n' +
            '⏳ **Cooldown**: Existe **1 minuto** de tempo de recarga entre ataques.\n' +
            '🎲 **Sorteio Dinâmico**: A cada ataque, assumes um animatronic aleatório garantidamente **diferente** do anterior!\n' +
            '⚡ **Poderes Especiais**: Cada animatronic possui um poder único com chance percentual de ativação (dano extra, cura, paralisia, veneno, cegueira, imunidade, reflexo de dano, etc.).\n' +
            '💀 **Sistema de KO**: Reduzir o HP do oponente a 0 desativa-o, garante-te **+1 KO** e restaura a vida do oponente para **100 HP**.',
          inline: false
        },
        {
          name: '✨ Animatronics Secretos & Especiais',
          value:
            '🐺 **Mangle**: Copia aleatoriamente o poder especial de um dos Toys (Toy Chica, Toy Bonnie, Toy Freddy) ou do Balloon Boy.\n' +
            '🕸️ **Ennard**: Fusão dos 5 animatronics Funtime. Após descobrires os 5 Funtimes na tua coleção (Baby, Ballora, Funtime Chica, Funtime Freddy, Funtime Foxy), o **Ennard** emergirá no teu próximo ataque com **100% de probabilidade** de herdar um dos seus poderes!\n' +
            '✨ **Golden Freddy**: 1% de chance ultra-rara de ser sorteado em qualquer ataque! Causa **Instakill imediato (100 de dano)** e concede-te **2 turnos de invencibilidade total**.',
          inline: false
        },
        {
          name: '💡 Dicas de Estratégia',
          value:
            '• Usa `/status` para verificar a tua vida, o progresso do Ennard e os teus efeitos ativos antes de entrar em combate!\n' +
            '• Usa `/perfil` para acompanhar as tuas estatísticas acumuladas, total de ataques e % de vitórias.\n' +
            '• Usa `/animatronic` para estudar a margem de dano e os efeitos dos poderes de cada animatronic!',
          inline: false
        }
      )
      .setFooter({ text: 'Fazbear Nightshift • Duelos PvP' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
