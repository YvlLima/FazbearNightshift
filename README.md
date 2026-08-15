# 🔦 Fazbear Nightshift — Bot Discord FNAF PvP 🐻🦊🐥🐰🐇🎭

**Fazbear Nightshift** é um bot de Discord de duelos PvP temáticos baseados no universo de **Five Nights at Freddy's (FNAF)**, desenvolvido em **Node.js (discord.js v14)** com persistência SQLite em tempo real.

Enfrenta outros guardas noturnos, assume o controlo de animatronics icónicos com habilidades especiais únicas e sobe no ranking global dos caçadores mais temidos!

---

## 📸 Identidade Visual (Branding Assets)

- 🖼️ **Foto de Perfil (Avatar)**: [`fnaf_bot_avatar.jpg`](file:///c:/Users/Lima/Desktop/FazbearNightshift/fnaf_bot_avatar.jpg)
- 🎨 **Banner de Perfil**: [`fnaf_bot_banner.jpg`](file:///c:/Users/Lima/Desktop/FazbearNightshift/fnaf_bot_banner.jpg)
- 🏷️ **Logo Nightshift Studios**: [`nightshift_studios_logo_final.jpg`](file:///c:/Users/Lima/Desktop/FazbearNightshift/nightshift_studios_logo_final.jpg)

---

## 🎮 Mecânicas do Jogo

- **Vida dos Jogadores (HP)**: Todos os jogadores iniciam com **100 HP max**.
- **Rotação Dinâmica de Animatronics**: A cada ataque com `/atacar`, o jogador assume um animatronic aleatório **garantidamente diferente** do anterior.
- **Cooldown de Ataque**: 1 minuto de tempo de recarga entre ataques por jogador.
- **Sistema de KO (Desligado)**: Ao reduzir o HP de um oponente a 0 HP, ele é desativado (`💀 [jogador] foi desligado por [animatronic]!`), o atacante ganha **+1 KO (Kill)** no seu histórico e o HP do oponente é restaurado para 100 HP.

### 🤖 Animatronics & Poderes Especiais

| Animatronic | Emoji | Dano Base | Chance Poder | Poder Especial & Efeito |
| :--- | :---: | :---: | :---: | :--- |
| **Freddy** | 🐻 | 12 – 18 | 12% | **Phantom Screech**: Paralisa o alvo por 2 turnos e causa +10 de dano de choque. |
| **Foxy** | 🦊 | 18 – 25 | 18% | **Super Combo**: Esquiva-se completamente do próximo ataque recebido. |
| **Chica** | 🐥 | 10 – 15 | 15% | **Cupcake Bomb**: Causa +16 de dano explosivo adicional ao alvo. |
| **Bonnie** | 🐰 | 15 – 21 | 11% | **Thrash Guitar**: Confunde o alvo; no próximo ataque, o dano vira-se contra ele próprio. |
| **Springtrap** | 🐇 | 12 – 17 | 16% | **Springlock Guilty**: Ganha resistência que divide por 2 o próximo poder recebido. |
| **Puppet** | 🎭 | 20 – 25 | 10% | **Steel Agony**: Imobiliza o alvo por 2 turnos + 6 dano de agonia por turno (12 total). |
| **Toy Freddy** | 🧸 | 14 – 20 | 10% | **AI Rage**: Dobra o dano (2x) e ignora a esquiva do alvo. |
| **Mangle** | 🐺 | 16 – 22 | 14% | **Wire Tangle**: Copia e ativa aleatoriamente o poder de outro animatronic. |
| **Toy Chica** | 🐤 | 11 – 16 | 17% | **Heal Food**: Regenera +12 HP ao atacante (máx. 100 HP). |
| **Toy Bonnie** | 🐰 | 13 – 19 | 9% | **Neon Gas**: Causa 4 dano direto + envenena o alvo por 3 rondas (8 dano/ronda). |
| **Balloon Boy** | 🎈 | 8 – 14 | 8% | **Flash Balloon**: Cega o alvo por 3 ataques (11 dano próprio em cada tentativa). |
| **Circus Baby** | 🎪 | 14 – 20 | 9% | **Scooper Reach**: Danos 2.5x + imobilização por 2 rondas (no-evade/no-resist). |
| **Ballora** | 🩰 | 12 – 18 | 8% | **Spindash Ballet**: Imunidade a dano por 2 rondas + reflete 2x todo o dano recebido. |
| **Funtime Chica** | 🦩 | 13 – 19 | 8% | **Celebrity Flash**: Sorteia 50/50 entre Hipnotizado (stun 2 rondas) ou Confuso (1.5x dano próprio). |
| **Funtime Freddy** | 🐻‍❄️ | 15 – 21 | 11% | **Bon-Bon Rocket**: Copia poder de Funtime Chica ou Funtime Foxy + 6 de dano extra. |
| **Funtime Foxy** | 🦊 | 17 – 23 | 6% | **Hydraulic Overload**: Cura +9 HP + veneno 2.5x no próximo turno (no-resist). |
| **Ennard** | 🕸️ | 16 – 24 | **Gatilho (100%)** | **The Scooping Room**: Emergem após qualquer Funtime (5/5 desbloqueados), herdando 1 dos 5 poderes com 100% de certeza. |
| **Golden Freddy** | ✨ | **100** | **1%** | **Lendário / Secreto**: Aparece com 1% de probabilidade e aplica Instakill imediato! |

---

## 📜 Comandos Slash

| Comando | Parâmetros | Descrição |
| :--- | :--- | :--- |
| `/atacar` | `@alvo` *(obrigatório)* | Desfere um ataque PvP utilizando o teu animatronic atual contra outro jogador. |
| `/status` | `[utilizador]` *(opcional)* | Consulta o HP, KOs, último animatronic, margem de dano e efeitos ativos do jogador. |
| `/leaderboard` | *Nenhum* | Exibe o ranking Top 10 dos jogadores com mais eliminações (KOs). |

---

## 🛠️ Tecnologias Utilizadas

- **Runtime**: Node.js
- **Biblioteca Discord**: `discord.js` v14
- **Base de Dados**: SQLite via `sql.js` (com gravação em ficheiro `fnaf.db`)
- **Variáveis de Ambiente**: `dotenv`

---

## 🚀 Como Instalar e Executar

### 1. Clonar o repositório e instalar dependências
```bash
npm install
```

### 2. Configurar o ficheiro de ambiente `.env`
Cria ou edita o ficheiro `.env` na raiz do projeto:
```env
DISCORD_TOKEN=seu_token_do_bot_aqui
CLIENT_ID=seu_client_id_aqui
GUILD_ID=seu_guild_id_opcional
```

### 3. Registrar os Comandos Slash na API do Discord
```bash
npm run deploy
```

### 4. Iniciar o Bot
```bash
npm start
```

---

## 📄 Termos e Privacidade

- 📜 [Termos de Serviço](file:///c:/Users/Lima/Desktop/FazbearNightshift/TERMS.md) (`TERMS.md`)
- 🔒 [Política de Privacidade](file:///c:/Users/Lima/Desktop/FazbearNightshift/PRIVACY.md) (`PRIVACY.md`)

---

*Desenvolvido para proporcionar a melhor experiência de duelos temáticos de FNAF no Discord!* 🍕⚡

