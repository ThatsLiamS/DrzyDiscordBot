const { 
	MessageFlags, 
	InteractionContextType, 
	SlashCommandBuilder, 
	PermissionFlagsBits, 
	EmbedBuilder, 
	ModalBuilder, 
	ActionRowBuilder, 
	TextInputBuilder, 
	TextInputStyle, 
	ButtonBuilder, 
	ButtonStyle ,
} = require('discord.js');

const PLATFORM_CONFIG = {
	tiktok: {
		getChannel: () => process.env['Announcement_Tiktok_Channel'],
		getRole: () => `<@&${process.env['Announcement_Tiktok_Role']}>`,

		color: '#00F2FE',
		footer: '🎵 Don\'t forget to drop a follow!',
		buttonLabel: 'Watch on TikTok',
		defaultDesc: 'Check out Drzy\'s newest TikTok video!',
	},

	youtube: {
		getChannel: () => process.env['Announcement_YouTube_Channel'],
		getRole: () => `<@&${process.env['Announcement_YouTube_Role']}>`,

		color: '#FF0000',
		footer: '🔴 Don\'t forget to subscribe!',
		buttonLabel: 'Watch on YouTube',
		defaultDesc: 'Drzy just uploaded a brand new video to YouTube!',
	},
};

module.exports = {
	name: 'new-video',
	description: 'Announce a new video on TikTok or YouTube!',
	usage: '/new-video <platform>',

	cooldown: {
		time: 0,
		text: 'None (0)',
	},
	permissions: [
		'Manage Server',
	],
	defer: {
		defer: false,
		ephemeral: true,
	},

	data: new SlashCommandBuilder()
		.setName('new-video')
		.setDescription('Announce a new video on TikTok or YouTube!')
		.setContexts(InteractionContextType.Guild)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

		.addStringOption(option => 
			option.setName('platform')
				.setDescription('Which platform is this video for?')
				.setRequired(true)
				.addChoices(
					{ name: '🎵 TikTok', value: 'tiktok' },
					{ name: '🔴 YouTube', value: 'youtube' },
				),
		),

	/**
	 * @async @function
	 * @group Commands @subgroup Admin
	 * @summary Announce new video
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
		const platform = interaction.options.getString('platform');
		const config = PLATFORM_CONFIG[platform];
		const modalCustomId = `post-${platform}-${interaction.user.id}`;

		const modalPopup = new ModalBuilder()
			.setCustomId(modalCustomId)
			.setTitle(`New ${platform.charAt(0).toUpperCase() + platform.slice(1)} Video!`);

		const titleInput = new ActionRowBuilder().addComponents(
			new TextInputBuilder()
				.setCustomId('title')
				.setLabel('Video Title')
				.setStyle(TextInputStyle.Short)
				.setMaxLength(100)
				.setRequired(true),
		);
		
		const linkInput = new ActionRowBuilder().addComponents(
			new TextInputBuilder()
				.setCustomId('link')
				.setLabel('Video URL (Include https://)')
				.setStyle(TextInputStyle.Short)
				.setRequired(true),
		);
		
		const descriptionInput = new ActionRowBuilder().addComponents(
			new TextInputBuilder()
				.setCustomId('description')
				.setLabel('Message / Description (Optional)')
				.setStyle(TextInputStyle.Paragraph)
				.setMaxLength(2000)
				.setRequired(false),
		);

		modalPopup.addComponents(titleInput, linkInput, descriptionInput);
		
		await interaction.showModal(modalPopup);

		try {
			const modalInteraction = await interaction.awaitModalSubmit({ 
				filter: (m) => m.customId === modalCustomId, 
				time: 300_000,
			});

			await modalInteraction.deferReply({ flags: MessageFlags.Ephemeral });

			const inputTitle = modalInteraction.fields.getTextInputValue('title');
			const inputLink = modalInteraction.fields.getTextInputValue('link');
			const inputDesc = modalInteraction.fields.getTextInputValue('description');

			const embed = new EmbedBuilder()
				.setColor(config.color)
				.setAuthor({ name: 'Drzy', iconURL: client.user.displayAvatarURL() })
				.setTitle(inputTitle)
				.setURL(inputLink)
				.setDescription(inputDesc || config.defaultDesc)
				.setFooter({ text: config.footer })
				.setTimestamp();

			const row = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setStyle(ButtonStyle.Link)
					.setLabel(config.buttonLabel)
					.setURL(inputLink),
			);

			const targetChannel = await client.channels.fetch(config.getChannel());
			
			const sentMsg = await targetChannel.send({
				content: `Hey ${config.getRole()}, a new video just dropped!`,
				embeds: [embed],
				components: [row], 
			});

			await sentMsg.react('🔥');

			await modalInteraction.followUp({
				content: `✅ Successfully announced your new ${platform} video!`,
				flags: MessageFlags.Ephemeral,
			});

			return true;
		}
		catch {
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({
					content: 'There was an error making the announcement. Please use the `/report` command!',
					flags: MessageFlags.Ephemeral,
				});
			}
			return false;
		}
	},
};
