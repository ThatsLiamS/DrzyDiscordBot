// eslint-disable-next-line no-unused-vars
const { MessageFlags, Collection, InteractionType, Interaction, Client } = require('discord.js');

/* Global variable definitions */
const cooldowns = new Collection();

/**
 * @function
 * @group Utility
 * @summary Convert seconds into highest denomination
 * 
 * @param {Integer} seconds
 * 
 * @returns {String}
 * 
 * @author Liam Skinner <me@liamskinner.co.uk>
**/
const formatTime = (seconds) => {

	const denominations = [
		[1, 'Second'],
		[60, 'Minute'],
		[60 * 60, 'Hour'],
	];

	const getDenominationType = (seconds) => {
		if (seconds < 61) { return 0; }
		if (seconds < 3600) { return 1; }
		return 2;
	};
	const type = getDenominationType(seconds);
	const num = Math.floor(seconds / denominations[type][0]);

	return `${num} ${denominations[type][1]}${num !== 1 ? 's' : ''}`;
};

module.exports = {
	name: 'interactionCreate',
	once: false,

	/**
	 * @async @function
	 * @group Events
	 * @summary Handles all interations
	 * 
	 * @param {Interaction} interaction - DiscordJS Guild Object
	 * @param {Client} client - DiscordJS Bot Client Object
	 * 
	 * @returns {Promise<boolean>} True (Success)
	 * @returns {Promise<boolean>} False (Error)
	 * 
	 * @author Liam Skinner <me@liamskinner.co.uk>
	**/
	execute: async (interaction, client) => {

		/* Is interaction a command? */
		if (interaction.type === InteractionType.ApplicationCommand) {

			const cmd = client.commands.get(interaction.commandName);
			if (!cmd) {
				interaction.reply({
					content: 'Sorry, this command is currently unavailable. Please try again later.',
					flags: MessageFlags.Ephemeral,
				});
				return false;
			}

			/* Is the command working? */
			if (cmd['error'] === true) {
				interaction.reply({
					content: 'Sorry, this command is currently unavailable. Please try again later.',
					flags: MessageFlags.Ephemeral,
				});
				return false;
			}

			/* Does the command need referring? */
			if (cmd?.defer?.defer === true) {
				const flags = cmd.defer.ephemeral
					? MessageFlags.Ephemeral
					: '';

				await interaction.deferReply({
					flags,
				});
			}


			/* Work out the appropriate cooldown time */
			if (!cooldowns.has(cmd.name)) {
				cooldowns.set(cmd.name, new Collection());
			}
			const timestamps = cooldowns.get(cmd.name);
			const cooldownAmount = (cmd?.cooldown?.time || 0) * 1000;

			if (timestamps.has(interaction.user.id)) {
				const expiration = Number(timestamps.get(interaction.user.id)) + Number(cooldownAmount);
				const secondsLeft = Math.floor((Number(expiration) - Number(Date.now())) / 1000);

				if (cmd?.defer?.defer === true) {
					await interaction.followUp({
						content: `Please wait **${formatTime(secondsLeft > 1 ? secondsLeft : 1)}** to use that command again!`,
					});
				}
				else {
					await interaction.reply({
						content: `Please wait **${formatTime(secondsLeft > 1 ? secondsLeft : 1)}** to use that command again`,
					});
				}

				return false;
			}


			/* Execute the command file */
			cmd.execute({ interaction, client })

				.then((res) => {
					if (res === true) {
						/* Set and delete the cooldown */
						timestamps.set(interaction.user.id, Date.now());
						setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
					}
				})
				.catch();

			return true;
		}
	},
};
