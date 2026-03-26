const { 
	MessageFlags, 
	InteractionContextType, 
	SlashCommandBuilder, 
	EmbedBuilder, 
	ButtonBuilder, 
	ButtonStyle, 
	ActionRowBuilder,
} = require('discord.js');

/**
 * @function formatUsage
 * @summary Formats command usage strings into inline code blocks
 *
 * @param {string} string - The raw usage string
 *
 * @returns {string} The formatted usage string
 *
 * @author Liam Skinner <me@liamskinner.co.uk>
**/
const formatUsage = (string) => string.split('\n').map((str) => `\`${str}\``).join('\n');

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
		const query = interaction.options.getString('command')?.toLowerCase();
		const categories = ['information', 'fun', 'admin'];

		if (query) {
			const command = client.commands.get(query);

			if (command) {
				const embed = new EmbedBuilder()
					.setColor('#0099FF')
					.setTitle(`${command.name.charAt(0).toUpperCase() + command.name.slice(1)} Command`)
					.setDescription(command.description)
					.addFields({ name: '__Usage:__', value: formatUsage(command.usage), inline: false })
					.setTimestamp();

				if (command.cooldown?.text) {
					embed.addFields({ name: '__Cooldown:__', value: command.cooldown.text, inline: false });
				}

				if (command.permissions?.length) {
					embed.addFields({ name: '__Permissions:__', value: `\`${command.permissions.join('` `')}\``, inline: false });
				}

				if (command.error) {
					embed.setColor('Red')
						.addFields({ name: '__Error:__', value: 'This command is currently unavailable, please try again later.', inline: false });
				}

				await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
				return true;
			}

			if (categories.includes(query)) {
				const categoryCommands = client.commands.filter(cmd => 
					cmd.subgroup?.toLowerCase() === query || cmd.group?.toLowerCase() === query,
				);

				const description = categoryCommands.size > 0
					? categoryCommands.map(cmd => formatUsage(cmd.usage)).join('\n')
					: 'No commands found in this category.';

				const embed = new EmbedBuilder()
					.setTitle(`${query.charAt(0).toUpperCase() + query.slice(1)} Commands`)
					.setDescription(`__**${query.charAt(0).toUpperCase() + query.slice(1)} Commands**__\n${description}`)
					.setColor('#0099FF');

				await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
				return true;
			}
		}

		const mainEmbed = new EmbedBuilder()
			.setTitle('Drzy Commands')
			.setDescription('Use `/help <category>` to get commands in one category, or `/help <command>` to get more info on a single command')
			.addFields(
				{ name: '🛎️ Information', value: '`help`, `links`, `report`, `suggest`', inline: false },
				{ name: '🎲 Fun', value: '`tictactoe`', inline: false },
				{ name: '🛡️ Admin', value: '`new-video`, `rules`', inline: false },
			)
			.setColor('#0099FF');

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

		await interaction.followUp({
			embeds: [mainEmbed],
			components: [row],
			flags: MessageFlags.Ephemeral,
		});

		return true;
	},
};
