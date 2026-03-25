// eslint-disable-next-line no-unused-vars
const { MessageFlags, InteractionContextType, SlashCommandBuilder, EmbedBuilder, WebhookClient, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, CommandInteraction, Client } = require('discord.js');

const format = (string) => string.split('\n').map((line) => '> ' + line).join('\n');

module.exports = {
	name: 'suggest',
	description: 'Suggest an new stream game, or background music!',
	usage: '/suggest <category>',

	cooldown: {
		time: 1 * 60,
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
	 * @summary Submit suggestion report
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
		const category = interaction.options.getString('platform');


		/* Create modal to display */
		const modalPopup = new ModalBuilder()
			.setCustomId(`suggest-${interaction.user.id}-${client.user.id}`)
			.setTitle('Drzy\'s Stream Suggestion!');

		/* Add input fields */
		const title = new ActionRowBuilder().addComponents(
			new TextInputBuilder()
				.setCustomId('title')
				.setLabel('Short title')
				.setStyle(TextInputStyle.Short)
				.setMaxLength(150)
				.setMinLength(5),
		);
		const description = new ActionRowBuilder().addComponents(
			new TextInputBuilder()
				.setCustomId('description')
				.setLabel('A clear and concise description')
				.setStyle(TextInputStyle.Paragraph)
				.setMaxLength(2000),
		);

		/* Display the modal */
		modalPopup.addComponents(title, description);
		await interaction.showModal(modalPopup);

		/* Get the responses */
		const filter = (modal) => modal.customId === `suggest-${interaction.user.id}-${client.user.id}`;
		const res = interaction.awaitModalSubmit({ filter, time: 150_000 })
			.then(async (modal) => {

				await modal.deferReply({
					flags: MessageFlags.Ephemeral,
				});

				const categoryFlag = category === 'music' ? 'Music: ' : 'Game: ';

				const embed = new EmbedBuilder()
					.setColor('#0099ff')
					.setAuthor({
						name: modal.user.username,
						iconURL: modal.user.displayAvatarURL(),
					})
					.setTitle(categoryFlag + modal.fields.getTextInputValue('title'))
					.setDescription(`**Description:**\n${format(modal.fields.getTextInputValue('description'))}`)
					.setFooter({
						text: `User ID: ${modal.member.id}`,
					})
					.setTimestamp();

				/* Locate the webhook */
				const webhook = category === 'music'
					? new WebhookClient({ url: process.env['Suggestion_Music_Webhook'] })
					: new WebhookClient({ url: process.env['Suggestion_Game_Webhook'] });

				try {
					/* Send the webhook and impersonate the user */
					const sentMsg = await webhook.send({
						username: modal.user.username,
						avatarURL: modal.user.displayAvatarURL(),
						embeds: [embed],
					});

					/* Have the main Bot Client fetch the webhook's message and react to it */
					const channel = await client.channels.fetch(sentMsg.channel_id);
					const fetchedMsg = await channel.messages.fetch(sentMsg.id);
					
					await fetchedMsg.react('👍');
					await fetchedMsg.react('👎');

					/* Let the user know it was successful */
					await modal.followUp({
						content: 'Thank you, your suggestion has been sent.',
						flags: MessageFlags.Ephemeral,
					});
					return true;

				} catch (error) {
					console.error('Error sending suggestion or reacting:', error);
					await modal.followUp({
						content: 'There was an error submitting your suggestion. Please use the `/report` command!',
						flags: MessageFlags.Ephemeral,
					});
					return false;
				}

			})
			/* If they didn't respond in time */
			.catch(async () => {
				await interaction.followUp({
					content: 'Sorry, you took too long to respond.',
					flags: MessageFlags.Ephemeral,
				});
				return false;
			});

		/* Returns boolean to enable the cooldown */
		return res;

	},
};
