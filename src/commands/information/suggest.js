// eslint-disable-next-line no-unused-vars
const { InteractionContextType, SlashCommandBuilder, EmbedBuilder, WebhookClient, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, CommandInteraction, Client } = require('discord.js');

const format = (string) => string.split('\n').map((line) => '> ' + line).join('\n');

module.exports = {
	name: 'suggest',
	description: 'Suggest an new stream game, or background music!',
	usage: '/suggest',

	cooldown: {
		time: 1 * 60,
		text: '1 Minute',
	},
	defer: {
		defer: false,
		ephemeral: false,
	},

	data: new SlashCommandBuilder()
		.setName('suggest')
		.setDescription('Suggest an new stream game, or background music!')
		.setContexts(InteractionContextType.Guild),

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
		const category = new ActionRowBuilder().addComponents(
			new TextInputBuilder()
				.setCustomId('category')
				.setLabel('Game, or Music Suggestion')
				.setStyle(TextInputStyle.Short)
				.setMaxLength(5)
				.setMinLength(4),
		);
		const description = new ActionRowBuilder().addComponents(
			new TextInputBuilder()
				.setCustomId('description')
				.setLabel('A clear and concise description')
				.setStyle(TextInputStyle.Paragraph)
				.setMaxLength(2000),
		);

		/* Display the modal */
		modalPopup.addComponents(title, category, description);
		await interaction.showModal(modalPopup);

		/* Get the responses */
		const filter = (modal) => modal.customId === `suggest-${interaction.user.id}-${client.user.id}`;
		const res = interaction.awaitModalSubmit({ filter, time: 150_000 })
			.then(async (modal) => {

				await modal.deferReply({
					ephemeral: true,
				});

				const embed = new EmbedBuilder()
					.setColor('#0099ff')
					.setAuthor({
						name: modal.user.username,
						iconURL: modal.user.displayAvatarURL(),
					})
					.setTitle(`${modal.fields.getTextInputValue('title')}`)
					.setDescription(`**Description:**\n${format(modal.fields.getTextInputValue('description'))}`)
					.setFooter({
						text: `User ID: ${modal.member.id}`,
					})
					.setTimestamp();

				/* Locate the webhook */
				let webhook;
				if (modal.fields.getTextInputValue('category').toLowerCase().startsWith('music')) {
					webhook = new WebhookClient({ url: process.env['Suggestion_Music_Webhook'] });
				} else {
					webhook = new WebhookClient({ url: process.env['Suggestion_Game_Webhook'] });
				}

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
						ephemeral: true,
					});
					return true;

				} catch (error) {
					console.error('Error sending suggestion or reacting:', error);
					await modal.followUp({
						content: 'There was an error submitting your suggestion. Please let a moderator know!',
						ephemeral: true,
					});
					return false;
				}

			})
			/* If they didn't respond in time */
			.catch(async () => {
				await interaction.followUp({
					content: 'Sorry, you took too long to respond.',
					ephemeral: true,
				});
				return false;
			});

		/* Returns boolean to enable the cooldown */
		return res;

	},
};
