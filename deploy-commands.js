const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');

if (!config.token || config.token === 'seu_token_aqui') {
  console.error('❌ ERRO: DISCORD_TOKEN não está configurado no ficheiro .env!');
  process.exit(1);
}

if (!config.clientId || config.clientId === 'seu_client_id_aqui') {
  console.error('❌ ERRO: CLIENT_ID não está configurado no ficheiro .env!');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  } else {
    console.warn(`[AVISO] O comando em ${filePath} não contém as propriedades obrigatórias "data" ou "execute".`);
  }
}

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    console.log(`🚀 A preparar registo global de ${commands.length} comandos no Discord...`);

    // 1. Limpar comandos específicos de Guild antigos para evitar duplicação no menu
    if (config.guildId && config.guildId !== 'seu_guild_id_aqui') {
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: [] }
      );
      console.log(`🧹 Comandos específicos do servidor [${config.guildId}] removidos com sucesso.`);
    }

    // 2. Registar comandos GLOBALMENTE
    const globalData = await rest.put(
      Routes.applicationCommands(config.clientId),
      { body: commands }
    );

    console.log(`🌐 ${globalData.length} comandos registados GLOBALMENTE com sucesso!`);
    console.log('ℹ️ Nota: O registo global pode demorar até 1 hora a propagar para todos os servidores do Discord.');

  } catch (error) {
    console.error('❌ Erro ao registar comandos slash:', error);
  }
})();
