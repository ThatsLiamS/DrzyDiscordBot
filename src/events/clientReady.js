const fs = require('fs');
const path = require('path');

const {
	Events,
	Collection,
} = require('discord.js');

const tiktokMonitor = require('../util/tiktokMonitor');

module.exports = {
	name: Events.ClientReady,
	once: true,

	/**
	 * @async @function
	 * @group Events
	 * @summary Automatic bot set up (triggered once)
	 *
	 * @param {Client} client - DiscordJS Bot Client Object
	 *
	 * @author Liam Skinner <me@liamskinner.co.uk>
	**/
	execute: async (client) => {
		const shardId = client.shard?.ids[0] ?? 0;
		const totalShards = client.shard?.count ?? 1;
		
		console.log(`Ready - ${client.user.username} - Shard ${shardId + 1}/${totalShards}`);

		client.user.setPresence({
			status: 'online',
			activities: [{
				type: 0,
				name: 'Follow my TikTok!',
			}],
		});

		client.commands = new Collection();
		const commandData = [];

		const commandPath = path.join(__dirname, '..', 'commands');
		const categories = fs.readdirSync(commandPath);

		for (const category of categories) {
			const categoryPath = path.join(commandPath, category);
			
			if (!fs.lstatSync(categoryPath).isDirectory()) {
				continue;
			}

			const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));

			for (const file of commandFiles) {
				const filePath = path.join(categoryPath, file);
				// eslint-disable-next-line security/detect-non-literal-require
				const command = require(filePath);

				if (command.data && command.execute) {
					client.commands.set(command.name, command);
					commandData.push(command.data.toJSON());
				}
			}
		}

		try {
			await client.application.commands.set(commandData);
			tiktokMonitor(client);

		} catch (error) {
			console.error('Error during client initialization:', error);

		}
	},
};
