const { 
	SlashCommandBuilder, 
	EmbedBuilder, 
	ActionRowBuilder, 
	ButtonBuilder, 
	ButtonStyle, 
	InteractionContextType,
} = require('discord.js');

const SOCIAL_LINKS = [
	{ label: 'TikTok', url: 'https://www.tiktok.com/@drzy_mc' },
	{ label: 'YouTube', url: 'https://www.youtube.com/@drzy_mc' },
	{ label: 'LinkTree', url: 'https://linktr.ee/DrzyMC' },
];

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
	 * @summary Displays official Drzy social links
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
		const embed = new EmbedBuilder()
			.setTitle('🔗 Official Drzy Links')
			.setDescription('Want to catch the latest streams, videos, and clips?\n\nClick the buttons below to follow Drzy on all platforms so you never miss out on the action!')
			.setColor('#FF0050')
			.setThumbnail(client.user.displayAvatarURL());

		const buttons = SOCIAL_LINKS.map(link => 
			new ButtonBuilder()
				.setStyle(ButtonStyle.Link)
				.setLabel(link.label)
				.setURL(link.url),
		);

		const row = new ActionRowBuilder().addComponents(buttons);

		await interaction.followUp({
			embeds: [embed],
			components: [row],
		});

		return true;
	},
};
