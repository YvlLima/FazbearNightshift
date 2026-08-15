# 🔦 Fazbear Nightshift — Bot Discord FNAF PvP 🐻🦊🐥🐰🐇🎭

**Fazbear Nightshift** é um bot de Discord de duelos PvP temáticos de **Five Nights at Freddy's (FNAF)** em **Node.js (discord.js v14)** com persistência SQLite em tempo real.

---

## 📸 Identidade Visual (Branding Assets)

- 🖼️ **Foto de Perfil (Avatar)**: [`fnaf_bot_avatar.jpg`](file:///c:/Users/Lima/Desktop/TheDealer/fnaf_bot_avatar.jpg)
- 🎨 **Banner de Perfil**: [`fnaf_bot_banner.jpg`](file:///c:/Users/Lima/Desktop/TheDealer/fnaf_bot_banner.jpg)

---

## 🎮 Mecânicas do Jogo

- **Vida Fixa do Jogador**: Cada jogador tem **100 HP fixos**.
- **Rotação Dinâmica de Animatronic**: A cada ataque desferido via `/atacar`, o atacante assume um animatronic aleatório **garantidamente diferente** do anterior.
- **Margem de Dano Dinâmica**: Cada animatronic causa dano sorteado dentro da sua margem única:
  - 🐻 **Freddy**: 12 – 18 Dano
  - 🦊 **Foxy**: 18 – 25 Dano
  - 🐥 **Chica**: 10 – 15 Dano *(Habilidade Especial: Cura +5 HP ao atacante)*
  - 🐰 **Bonnie**: 15 – 21 Dano
  - 🐇 **Springtrap**: 12 – 17 Dano
  - 🎭 **Puppet**: 20 – 25 Dano
- **Cooldown**: 1 minuto entre ataques por jogador.
- **Sistema de KO (Desligado)**: Quando um jogador atinge 0 HP, é desativado (`💀 [jogador] foi desligado por [animatronic]!`) e a sua vida é reiniciada para 100 HP.

---

## 📜 Comandos Slash

| Comando | Descrição |
| :--- | :--- |
| `/atacar @alvo` | Desfere um ataque com um animatronic sorteado contra o jogador-alvo. |
| `/status [jogador]` | Exibe a vida atual (100 HP max), último animatronic utilizado e respetivo dano do jogador. |

---

## 🚀 Como Iniciar

1. Instalar dependências:
   ```bash
   npm install
   ```
2. Configurar o ficheiro `.env`:
   ```env
   DISCORD_TOKEN=seu_token_aqui
   CLIENT_ID=seu_client_id_aqui
   GUILD_ID=seu_guild_id_opcional
   ```
3. Registar os comandos slash na API do Discord:
   ```bash
   npm run deploy
   ```
4. Iniciar o bot:
   ```bash
   npm start
   ```
