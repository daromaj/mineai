# MineAI

MineAI is a Minecraft bot project that uses mineflayer to create an AI-controlled bot capable of exploring the world, interacting with the environment, and creating structures.

## Project Structure

The project has been refactored into multiple files for better organization and maintainability:

- `bot.js`: The main entry point for the bot.
- `src/botConfig.js`: Contains bot configuration and creation logic.
- `src/exploration.js`: Handles world exploration and environment interaction.
- `src/eventHandlers.js`: Sets up event handlers for the bot.
- `src/messageHandlers.js`: Manages message handling for the bot.
- `src/structures.js`: Contains functions for creating various structures.

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up your environment variables in a `.env` file:
   ```
   HOST=your_minecraft_server_host
   PORT=your_minecraft_server_port
   USERNAME=your_bot_username
   ```

## Running the Bot

To start the bot, run:

```
npm start
```

For local development with environment variables from `.env.local`:

```
npm run start:local
```

## Features

- World exploration
- Environment interaction
- Structure creation (Rainbow arc, Settler house)
- Chat interaction

## Customization

You can customize the bot's behavior by modifying the relevant files in the `src` directory. For example, to enable exploration by default, change the `setupEventHandlers` call in `bot.js`:

```javascript
setupEventHandlers(bot, true);
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
