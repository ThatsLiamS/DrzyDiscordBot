const fs = require('fs');
const path = require('path');

require('dotenv').config();
const {
	Client,
	GatewayIntentBits,
	Partials,
} = require('discord.js');
const express = require('express');


const app = express();

app.get('/', (_req, res) => res.send('Hello World!'));
app.listen(3000, () => {
	const dateObj = new Date();
	
	const hours = dateObj.getHours().toString().padStart(2, '0');
	const minutes = dateObj.getMinutes().toString().padStart(2, '0');
	const time = `${hours}:${minutes}`;

	const day = dateObj.getDate().toString().padStart(2, '0');
	const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
	const year = dateObj.getFullYear();
	const date = `${day}/${month}/${year}`;

	console.log(`Restarted: ${time}, ${date} UTC`);
});


const client = new Client({
	intents: [
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildWebhooks,
	],
	partials: [
		Partials.Channel,
		Partials.Message,
		Partials.Reaction,
	],
});

/**
 * @function loadEvents
 * @group Core
 * @summary Dynamically loads and registers event listeners
 *
 * @param {Client} botClient - DiscordJS Bot Client Object
 *
 * @author Liam Skinner <me@liamskinner.co.uk>
**/
const loadEvents = (botClient) => {
	const eventsPath = path.join(__dirname, 'events');
	const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

	for (const file of eventFiles) {
		const filePath = path.join(eventsPath, file);
		// eslint-disable-next-line security/detect-non-literal-require
		const event = require(filePath);

		if (event.once) {
			botClient.once(event.name, (...args) => event.execute(...args, botClient));
		} else {
			botClient.on(event.name, (...args) => event.execute(...args, botClient));
		}
	}
};

loadEvents(client);

client.login(process.env['BotToken']);
