// eslint-disable-next-line no-unused-vars
const { InteractionContextType, SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, CommandInteraction } = require('discord.js');

module.exports = {
	name: 'links',
	description: 'Useful Drzy links!',
	usage: '/links',

	cooldown: {
		time: 0,
		text: 'None (0)',
	},
	defer: {
		defer: true,
		ephemeral: false,
	},

	data: new SlashCommandBuilder()
		.setName('links')
		.setDescription('Useful Drzy links!')
		.setContexts(InteractionContextType.Guild),

	/**
	 * @async @function
	 * @group Commands @subgroup Information
	 * @summary Shares details about the bot
	 * 
	 * @param {Object} param
	 * @param {CommandInteraction} param.interaction - DiscordJS Slash Command Object
	 * 
	 * @returns {Promise<boolean>} True (Success) - triggers cooldown.
	 * @returns {Promise<boolean>} False (Error) - skips cooldown.
	 * 
	 * @author Liam Skinner <me@liamskinner.co.uk>
	**/
	execute: async ({ interaction }) => {

		/* Create embed full of information */
		const embed = new EmbedBuilder()
			.setTitle('🔗 Official Drzy Links')
			.setDescription('Want to catch the latest streams, videos, and clips?\n\nClick the buttons below to follow Drzy on all platforms so you never miss out on the action!')
			.setColor('#FF0050')
			.setThumbnail(interaction.client.user.displayAvatarURL());

		/* Create row of external link buttons */
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
				new ButtonBuilder()
					.setStyle(ButtonStyle.Link)
					.setLabel('LinkTree')
					.setURL('https://linktr.ee/DrzyMC'),
			);

		/* Returns true to enable the cooldown */
		await interaction.followUp({
			embeds: [embed],
			components: [row],
		});

		return true;
	},
};
