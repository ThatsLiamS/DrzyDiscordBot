const {
	Collection,
	InteractionType,
	MessageFlags,
} = require('discord.js');

const cooldowns = new Collection();

/**
 * @function formatTime
 * @group Utility
 * @summary Convert seconds into the highest appropriate denomination
 *
 * @param {number} seconds - The time in seconds
 *
 * @returns {string} Formatted string (e.g., "5 Minutes")
 *
 * @author Liam Skinner <me@liamskinner.co.uk>
**/
const formatTime = (seconds) => {
	if (seconds < 60) {
		return `${seconds} Second${seconds !== 1 ? 's' : ''}`;
	}
	if (seconds < 3600) {
		const minutes = Math.floor(seconds / 60);
		return `${minutes} Minute${minutes !== 1 ? 's' : ''}`;
	}
	const hours = Math.floor(seconds / 3600);
	return `${hours} Hour${hours !== 1 ? 's' : ''}`;
};

module.exports = {
	name: 'interactionCreate',
	once: false,

	/**
	 * @async @function
	 * @group Events
	 * @summary Handles all interactions
	 *
	 * @param {Interaction} interaction - DiscordJS Interaction Object
	 * @param {Client} client - DiscordJS Bot Client Object
	 *
	 * @returns {Promise<boolean>} True (Success)
	 * @returns {Promise<boolean>} False (Error)
	 *
	 * @author Liam Skinner <me@liamskinner.co.uk>
	**/
	execute: async (interaction, client) => {
		if (interaction.type !== InteractionType.ApplicationCommand) {
			return false;
		}

		const command = client.commands.get(interaction.commandName);

		if (!command || command.error) {
			const errorPayload = {
				content: 'Sorry, this command is currently unavailable. Please try again later.',
				flags: MessageFlags.Ephemeral,
			};
			
			if (interaction.deferred) {
				await interaction.followUp(errorPayload);
			}
			else {
				await interaction.reply(errorPayload);
			}
			
			return false;
		}

		if (command.defer?.defer) {
			await interaction.deferReply({
				flags: command.defer.ephemeral ? MessageFlags.Ephemeral : undefined,
			});
		}

		if (!cooldowns.has(command.name)) {
			cooldowns.set(command.name, new Collection());
		}

		const now = Date.now();
		const timestamps = cooldowns.get(command.name);
		const cooldownAmount = (command.cooldown?.time || 0) * 1000;

		if (timestamps.has(interaction.user.id)) {
			const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

			if (now < expirationTime) {
				const timeLeft = Math.round((expirationTime - now) / 1000);
				const response = {
					content: `Please wait **${formatTime(timeLeft > 0 ? timeLeft : 1)}** to use that command again!`,
					flags: MessageFlags.Ephemeral,
				};

				if (interaction.deferred) {
					await interaction.followUp(response);
				}
				else {
					await interaction.reply(response);
				}

				return false;
			}
		}

		try {
			const success = await command.execute({ interaction, client });

			if (success) {
				timestamps.set(interaction.user.id, now);
				setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
			}

			return true;
		} catch (error) {
			console.error(`Error executing ${interaction.commandName}:`, error);
			return false;
		}
	},
};
