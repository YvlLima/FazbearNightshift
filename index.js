const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const db = require('./database');

// Criação da instância do cliente do Discord
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Coleção para armazenar os comandos slash
client.commands = new Collection();

// Carregamento dinâmico de comandos da pasta /commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    console.log(`📌 Comando carregado: /${command.data.name}`);
  } else {
    console.warn(`[AVISO] O comando em ${filePath} não possui "data" ou "execute".`);
  }
}

// Evento quando o bot fica online
client.once(Events.ClientReady, async (c) => {
  if (db.init) {
    await db.init();
  }
  console.log(`🚀 Bot online com sucesso! Autenticado como: ${c.user.tag}`);
});

// Tratar erros do cliente Discord e Rejeições Não Tratadas sem derrubar o processo do bot
client.on('error', (err) => console.error('⚠️ [ERRO CLIENTE DISCORD]:', err.message));
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ [REJEIÇÃO NÃO TRATADA]:', reason);
});

// Handler central de interações de comandos slash
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.error(`Nenhum comando correspondente a ${interaction.commandName} foi encontrado.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`❌ Erro ao executar o comando /${interaction.commandName}:`, error);

    try {
      const errorMessage = {
        content: '❌ Ocorreu um erro ao processar este comando. Tenta novamente mais tarde!',
        ephemeral: true
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    } catch (interactionErr) {
      // Ignorar erros de interações expiradas ou desconhecidas (ex: 10062 Unknown Interaction)
      console.warn(`[AVISO] Não foi possível responder à interação expirada: ${interactionErr.message}`);
    }
  }
});

// Função de login resiliente com reconexão automática em caso de oscilação de rede
async function startBot() {
  if (!config.token || config.token === 'seu_token_aqui') {
    console.error('❌ ERRO: DISCORD_TOKEN não está definido no .env!');
    process.exit(1);
  }

  try {
    await client.login(config.token);
  } catch (err) {
    console.warn(`⚠️ Oscilação de rede ao ligar à API do Discord (${err.message}). A tentar reconectar em 5 segundos...`);
    setTimeout(startBot, 5000);
  }
}

startBot();
