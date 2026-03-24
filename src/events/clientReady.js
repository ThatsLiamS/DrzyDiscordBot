const fs = require('fs');

// eslint-disable-next-line no-unused-vars
const { Collection, Client } = require('discord.js');


module.exports = {
	name: 'clientReady',
	once: true,

	/**
	 * @async @function
	 * @group Events
	 * @summary Automatic bot set up (triggered once)
	 * 
	 * @param {Client} client - DiscordJS Bot Client Object
	 * 
	 * @returns {Promise<boolean>} True (Success)
	 * @returns {Promise<boolean>} False (Error)
	 * 
	 * @author Liam Skinner <me@liamskinner.co.uk>
	**/
	execute: async (client) => {

		console.log(`Ready - ${client.user.username} - Shard ${Number(client.shard.ids) + 1}/${client.shard.count}`);

		/* Set client status */
		client.user.setPresence({
			status: 'online',
			activities: [{
				type: 1,
				name: 'Follow my TikTok!',
			}],
		});

		/* Registering slash commands */
		client.commands = new Collection();
		const data = [];

		const categories = fs.readdirSync(`${__dirname}/../commands/`);
		for (const category of categories) {
			const commandFiles = fs.readdirSync(`${__dirname}/../commands/${category}`).filter(file => file.endsWith('.js'));
			for (const file of commandFiles) {

				// eslint-disable-next-line security/detect-non-literal-require
				const command = require(`${__dirname}/../commands/${category}/${file}`);
				client.commands.set(command.name, command);
				data.push(command.data.toJSON());

			}

		}

		/* Set ApplicationCommand data */
		await client.application.commands.set(data);
		return true;
	},
};
