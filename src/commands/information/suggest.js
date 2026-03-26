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
	name: 'suggest',
	description: 'Suggest an new stream game, or background music!',
	usage: '/suggest <category>',

	cooldown: {
		time: 60,
		text: '1 Minute',
	},
	defer: {
		defer: false,
		ephemeral: true,
	},

	data: new SlashCommandBuilder()
		.setName('suggest')
		.setDescription('Suggest an new stream game, or background music!')
		.setContexts(InteractionContextType.Guild)

		.addStringOption(option => 
			option.setName('category')
				.setDescription('What would you like to suggest?')
				.setRequired(true)
				.addChoices(
					{ name: 'New Game', value: 'game' },
					{ name: 'Background Music', value: 'music' },
				),
		),

	/**
	 * @async @function
	 * @group Commands @subgroup Information
	 * @summary Submit a stream suggestion
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
		const category = interaction.options.getString('category');
		const modalCustomId = `suggest-${interaction.user.id}-${client.user.id}`;

		const modalPopup = new ModalBuilder()
			.setCustomId(modalCustomId)
			.setTitle('Drzy\'s Stream Suggestion!');

		const titleInput = new ActionRowBuilder().addComponents(
			new TextInputBuilder()
				.setCustomId('title')
				.setLabel('Short title')
				.setStyle(TextInputStyle.Short)
				.setMaxLength(150)
				.setMinLength(5),
		);

		const descriptionInput = new ActionRowBuilder().addComponents(
			new TextInputBuilder()
				.setCustomId('description')
				.setLabel('A clear and concise description')
				.setStyle(TextInputStyle.Paragraph)
				.setMaxLength(2000),
		);

		modalPopup.addComponents(titleInput, descriptionInput);
		
		await interaction.showModal(modalPopup);

		try {
			const modalInteraction = await interaction.awaitModalSubmit({ 
				filter: (m) => m.customId === modalCustomId, 
				time: 150_000,
			});

			await modalInteraction.deferReply({ flags: MessageFlags.Ephemeral });

			const isMusic = category === 'music';
			const categoryLabel = isMusic ? 'Music: ' : 'Game: ';
			const suggestionTitle = modalInteraction.fields.getTextInputValue('title');
			const suggestionDesc = modalInteraction.fields.getTextInputValue('description');

			const embed = new EmbedBuilder()
				.setColor('#0099ff')
				.setAuthor({
					name: modalInteraction.user.username,
					iconURL: modalInteraction.user.displayAvatarURL(),
				})
				.setTitle(`${categoryLabel}${suggestionTitle}`)
				.setDescription(`**Description:**\n${format(suggestionDesc)}`)
				.setFooter({ text: `User ID: ${modalInteraction.user.id}` })
				.setTimestamp();

			const webhookUrl = isMusic 
				? process.env['Suggestion_Music_Webhook'] 
				: process.env['Suggestion_Game_Webhook'];
			
			const webhook = new WebhookClient({ url: webhookUrl });

			const sentMsg = await webhook.send({
				username: modalInteraction.user.username,
				avatarURL: modalInteraction.user.displayAvatarURL(),
				embeds: [embed],
			});

			const channel = await client.channels.fetch(sentMsg.channel_id);
			const fetchedMsg = await channel.messages.fetch(sentMsg.id);
			
			await fetchedMsg.react('👍');
			await fetchedMsg.react('👎');

			await modalInteraction.followUp({
				content: 'Thank you, your suggestion has been sent.',
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
