const { readdirSync } = require('fs');

// eslint-disable-next-line no-unused-vars
const { MessageFlags, InteractionContextType, SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, CommandInteraction, Client } = require('discord.js');

/* Formats command usage */
const formatUsage = (string) => string.split('\n').map((str) => '`' + str + '`').join('\n');


module.exports = {
	name: 'help',
	description: 'Get a list of my commands',
	usage: '/help [command]',

	cooldown: {
		time: 0,
		text: 'None (0)',
	},
	defer: {
		defer: true,
		ephemeral: true,
	},

	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Get a list of my commands!')
		.setContexts(InteractionContextType.Guild)
		.addStringOption(option => option
			.setName('command')
			.setDescription('Which command or category?')
			.setRequired(false),
		),

	/**
	 * @async @function
	 * @group Commands @subgroup Information
	 * @summary Help management - overview, or specific command
	 * 
	 * @param {Object} param
	 * @param {CommandInteraction} param.interaction - DiscordJS Slash Command Object
	 * @param {Client} param.client - DiscordJS Bot Client Object
	 * 
	 * @returns {Promise<boolean>} True (Success) - triggers cooldown.
	 * @returns {Promise<boolean>} False (Error) - skips cooldown.
	 * 
	 * @author Liam Skinner <me@liamskinner.co.uk>
	**/
	execute: async ({ interaction, client }) => {

		const cmdName = interaction.options.getString('command')?.toLowerCase();

		/* Shows information on a selected command */
		const cmd = client.commands.get(cmdName);
		if (cmd) {
			const embed = new EmbedBuilder()
				.setColor('#0099FF')
				.setTitle(cmd.name.charAt(0).toUpperCase() + cmd.name.slice(1) + ' Command')
				.setDescription(cmd.description)
				.setTimestamp()
				.addFields({ name: '__Usage:__', value: `${formatUsage(cmd.usage)}`, inline: false });

			if (cmd?.cooldown?.text) {
				embed.addFields({ name: '__Cooldown:__', value: `${cmd.cooldown.text}`, inline: false });
			}
			if (cmd?.permissions?.[0]) {
				embed.addFields({ name: '__Permissions:__', value: '`' + cmd.permissions.join('` `') + '`', inline: false });
			}
			if (cmd.error === true) {
				embed.addFields({ name: '__Error:__', value: 'This command is currently unavailable, please try again later.', inline: false })
					.setColor('Red');
			}

			/* Send the command-specific embed and return true */
			await interaction.followUp({
				embeds: [embed],
				flags: MessageFlags.Ephemeral,
			});
			return true;
		}

		/* Filter through the files and get the commands from the selected category */
		const categories = ['information']; 
		if (categories.includes(cmdName)) {
			let description = '__**Information Commands**__\n';

			try {
				// Ensure this path matches your folder structure!
				const commandFiles = readdirSync(`${__dirname}/../../commands/${cmdName}`).filter(file => file.endsWith('.js'));
				for (const file of commandFiles) {
					// eslint-disable-next-line security/detect-non-literal-require
					const command = require(`${__dirname}/../../commands/${cmdName}/${file}`);
					description = description + `${formatUsage(command.usage)}\n`;
				}
			} catch (error) {
				console.error('Error reading category directory:', error);
				description += 'Error loading commands for this category.';
			}

			const embed = new EmbedBuilder()
				.setTitle(cmdName.charAt(0).toUpperCase() + cmdName.slice(1) + ' Commands')
				.setDescription(description)
				.setColor('#0099FF');

			/* Send the category's commands, and return true */
			await interaction.followUp({
				embeds: [embed],
				flags: MessageFlags.Ephemeral,
			});
			return true;
		}

		/* List of all our command categories */
		const embed = new EmbedBuilder()
			.setTitle('Drzy Commands')
			.setDescription('Use `/help <category>` to get commands in one category, or `/help <command>` to get more info on a single command')
			.addFields(
				{ name: '🛎️ Information', value: '`help`, `links`, `report`, `suggest`', inline: false },
				{ name: '🎲 Fun', value: '`tictactoe`', inline: false },
				{ name: '🛡️ Admin', value: '`new-video`, `rules`', inline: false },
			)
			.setColor('#0099FF');

		/* Creates row of external link buttons */
		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setStyle(ButtonStyle.Link)
					.setLabel('TikTok')
					.setURL('https://www.tiktok.com/@drzy_mc'),
				new ButtonBuilder()
					.setStyle(ButtonStyle.Link)
					.setLabel('YouTube')
					.setURL('https://www.youtube.com/@drzy_mc'),
			);

		/* Returns true to enable the cooldown */
		await interaction.followUp({
			embeds: [embed],
			components: [row],
			flags: MessageFlags.Ephemeral,
		});

		return true;
	},
};
