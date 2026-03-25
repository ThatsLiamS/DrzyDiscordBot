// eslint-disable-next-line no-unused-vars
const { MessageFlags, InteractionContextType, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, CommandInteraction, Client, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
	name: 'new-video',
	description: 'Announce a new video on TikTok or YouTube!',
	usage: '/new-video <platform>',

	cooldown: {
		time: 0,
		text: 'None (0)',
	},
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
	 * @group Commands @subgroup Announce new video
	 * @summary 
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

		const modalPopup = new ModalBuilder()
			.setCustomId(`post-${platform}-${interaction.user.id}`)
			.setTitle(`New ${platform === 'tiktok' ? 'TikTok' : 'YouTube'} Video!`);

		const title = new ActionRowBuilder().addComponents(
			new TextInputBuilder()
				.setCustomId('title')
				.setLabel('Video Title')
				.setStyle(TextInputStyle.Short)
				.setMaxLength(100)
				.setRequired(true),
		);
		
		const link = new ActionRowBuilder().addComponents(
			new TextInputBuilder()
				.setCustomId('link')
				.setLabel('Video URL (Include https://)')
				.setStyle(TextInputStyle.Short)
				.setRequired(true),
		);
		
		const description = new ActionRowBuilder().addComponents(
			new TextInputBuilder()
				.setCustomId('description')
				.setLabel('Message / Description (Optional)')
				.setStyle(TextInputStyle.Paragraph)
				.setMaxLength(2000)
				.setRequired(false),
		);

		modalPopup.addComponents(title, link, description);
		await interaction.showModal(modalPopup);

		const filter = (modal) => modal.customId === `post-${platform}-${interaction.user.id}`;
		
		const res = interaction.awaitModalSubmit({ filter, time: 300_000 })
			.then(async (modal) => {

				await modal.deferReply({
					flags: MessageFlags.Ephemeral,
				});

				const inputTitle = modal.fields.getTextInputValue('title');
				const inputLink = modal.fields.getTextInputValue('link');
				const inputDesc = modal.fields.getTextInputValue('description');

				let channelId = '';
				let rolePing = '';
				let embedColor = '';
				let footerText = '';
				let buttonLabel = '';
				let defaultDesc = '';

				if (platform === 'tiktok') {
					channelId = process.env['Announcement_Tiktok_Channel'];
					rolePing = `<@&${process.env['Announcement_Tiktok_Role']}>`;
					embedColor = '#00F2FE';
					footerText = '🎵 Don\'t forget to drop a follow!';
					buttonLabel = 'Watch on TikTok';
					defaultDesc = 'Check out Drzy\'s newest TikTok video!';
				} else {
					channelId = process.env['Announcement_YouTube_Channel'];
					rolePing = `<@&${process.env['Announcement_YouTube_Role']}>`;
					embedColor = '#FF0000';
					footerText = '🔴 Don\'t forget to subscribe!';
					buttonLabel = 'Watch on YouTube';
					defaultDesc = 'Drzy just uploaded a brand new video to YouTube!';
				}

				const finalDescription = inputDesc ? inputDesc : defaultDesc;

				const embed = new EmbedBuilder()
					.setColor(embedColor)
					.setAuthor({ name: 'Drzy', iconURL: client.user.displayAvatarURL() })
					.setTitle(inputTitle)
					.setURL(inputLink)
					.setDescription(finalDescription)
					.setFooter({ text: footerText })
					.setTimestamp();

				const row = new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setStyle(ButtonStyle.Link)
						.setLabel(buttonLabel)
						.setURL(inputLink),
				);

				try {
					const targetChannel = await client.channels.fetch(channelId);
					
					const sentMsg = await targetChannel.send({
						content: `Hey ${rolePing}, a new video just dropped!`,
						embeds: [embed],
						components: [row], 
					});

					await sentMsg.react('🔥');

					await modal.followUp({
						content: `✅ Successfully announced your new ${platform} video!`,
						flags: MessageFlags.Ephemeral,
					});
					return true;

				} catch (error) {
					console.error(error);
					await modal.followUp({
						content: 'There was an error submitting your suggestion. Please use the `/report` command!',
						flags: MessageFlags.Ephemeral,
					});
					return false;
				}

			})
			.catch(async () => {
				await interaction.followUp({
					content: 'Sorry, you took too long to fill out the form.',
					flags: MessageFlags.Ephemeral,
				});
				return false;
			});

		return res;
	},
};
