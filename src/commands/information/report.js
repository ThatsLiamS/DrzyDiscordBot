const { 
	MessageFlags, 
	InteractionContextType, 
	SlashCommandBuilder, 
	EmbedBuilder, 
	WebhookClient, 
	ModalBuilder, 
	ActionRowBuilder, 
	TextInputBuilder, 
	TextInputStyle,
} = require('discord.js');

/**
 * @function format
 * @summary Formats a multi-line string into a Discord blockquote
 *
 * @param {string} string - The raw input string
 *
 * @returns {string} The formatted string with blockquote markdown
 *
 * @author Liam Skinner <me@liamskinner.co.uk>
**/
const format = (string) => string.split('\n').map((line) => `> ${line}`).join('\n');

module.exports = {
	name: 'report',
	description: 'Submit a bug report to the developer!',
	usage: '/report',

	cooldown: {
		time: 60,
		text: '1 Minute',
	},
	defer: {
		defer: false,
		ephemeral: true,
	},

	data: new SlashCommandBuilder()
		.setName('report')
		.setDescription('Submit a bug report to the developer!')
		.setContexts(InteractionContextType.Guild),

	/**
	 * @async @function
	 * @group Commands @subgroup Information
	 * @summary Submit bug report
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
		const modalCustomId = `report-${interaction.user.id}-${client.user.id}`;
		
		const modalPopup = new ModalBuilder()
			.setCustomId(modalCustomId)
			.setTitle('Drzy\'s Bug Report!');

		const titleInput = new ActionRowBuilder().addComponents(
			new TextInputBuilder()
				.setCustomId('reportTitle')
				.setLabel('Short title')
				.setStyle(TextInputStyle.Short)
				.setMaxLength(150)
				.setMinLength(5),
		);

		const descriptionInput = new ActionRowBuilder().addComponents(
			new TextInputBuilder()
				.setCustomId('reportDescription')
				.setLabel('A clear and concise description')
				.setStyle(TextInputStyle.Paragraph)
				.setMaxLength(2000)
				.setMinLength(50),
		);

		const reproduceInput = new ActionRowBuilder().addComponents(
			new TextInputBuilder()
				.setCustomId('reportReproduce')
				.setLabel('Steps to reproduce the behavior')
				.setStyle(TextInputStyle.Paragraph)
				.setMaxLength(2000)
				.setMinLength(50)
				.setPlaceholder('1. Go to \'....\'\n2. Click on \'....\'\n3. Scroll down to \'....\''),
		);

		modalPopup.addComponents(titleInput, descriptionInput, reproduceInput);
		
		await interaction.showModal(modalPopup);

		try {
			const modalInteraction = await interaction.awaitModalSubmit({ 
				filter: (m) => m.customId === modalCustomId, 
				time: 150_000 ,
			});

			await modalInteraction.deferReply({ flags: MessageFlags.Ephemeral });

			const reportTitle = modalInteraction.fields.getTextInputValue('reportTitle');
			const formattedDescription = format(modalInteraction.fields.getTextInputValue('reportDescription'));
			const formattedSteps = format(modalInteraction.fields.getTextInputValue('reportReproduce'));

			const embed = new EmbedBuilder()
				.setColor('#0099ff')
				.setTitle(reportTitle)
				.setDescription(`**Description:**\n${formattedDescription}\n\n**Steps to Reproduce:**\n${formattedSteps}`)
				.setAuthor({
					name: modalInteraction.user.username,
					iconURL: modalInteraction.user.displayAvatarURL(),
				})
				.setFooter({
					text: `User ID: ${modalInteraction.user.id}`,
				})
				.setTimestamp();

			const webhook = new WebhookClient({ url: process.env['Report_Webhook'] });
			
			await webhook.send({
				username: client.user.username,
				avatarURL: client.user.displayAvatarURL(),
				embeds: [embed],
			});

			await modalInteraction.followUp({
				content: 'Thank you for helping us make Drzy Bot even better.',
				flags: MessageFlags.Ephemeral,
			});

			return true;
		}
		catch {
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({
					content: 'Sorry, you took too long to respond or an error occurred.',
					flags: MessageFlags.Ephemeral,
				});
			}
			return false;
		}
	},
};
