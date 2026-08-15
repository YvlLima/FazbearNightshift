require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID, // Opcional: para registar comandos numa guilda específica rapidamente
  ownerId: process.env.OWNER_ID, // Opcional: ID do criador do bot
  attackCooldownMs: 60 * 1000 // Cooldown de 1 minuto entre ataques por jogador
};
