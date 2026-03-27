const {
	SlashCommandBuilder,
	EmbedBuilder,
	InteractionContextType,
} = require('discord.js');

const FAQ_CONTENT = {
	mods: {
		title: '🛠️ Drzy\'s Mods & Shaders',
		description: 'Here is everything Drzy uses to make his Minecraft look and feel amazing:',
		fields: [
			{ 
				name: 'Mods', 
				value: '• [Hold my Items](https://modrinth.com/mod/hold-my-items)\n• [Distant Horizons](https://modrinth.com/mod/distanthorizons)\n*...plus a few minor mods!*', 
				inline: false, 
			},
			{ 
				name: 'Shaders', 
				value: '• [Photon Shader](https://modrinth.com/shader/photon-shader)\n*...plus a few resource packs!*', 
				inline: false, 
			},
		],
	},
	world: {
		title: '🌍 World Information',
		description: 'Details about the world Drzy is currently playing on:',
		fields: [
			{ name: 'Platform', value: 'Minecraft Java 1.21.11', inline: false },
			{ name: 'Seed', value: '*To Be Announced!*', inline: false },
		],
	},
	play: {
		title: '🤝 Can I play with Drzy?',
		description: 'The streamed realm is currently a **strict single-player experience**.\n\nDrzy takes real pride in knowing he gathered every single resource and built everything entirely from scratch, with absolutely no handouts from followers. Because of this, he does not accept players into the world.',
	},
};

module.exports = {
	name: 'faq',
	description: 'Get answers to common questions about Drzy!',
	usage: '/faq <topic>',

	cooldown: {
		time: 5,
		text: '5 seconds',
	},
	defer: {
		defer: true,
		ephemeral: false,
	},

	data: new SlashCommandBuilder()
		.setName('faq')
		.setDescription('Get answers to common questions about Drzy\'s stream!')
		.setContexts(InteractionContextType.Guild)

		.addStringOption(option =>
			option.setName('topic')
				.setDescription('Which question do you want answered?')
				.setRequired(true)
				.addChoices(
					{ name: '🛠️ Mods & Shaders', value: 'mods' },
					{ name: '🌍 World Info', value: 'world' },
					{ name: '🤝 Can I play with Drzy?', value: 'play' },
				),
		),

	/**
	 * @async @function
	 * @group Commands @subgroup Information
	 * @summary Provide answers to common questions
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
		const topic = interaction.options.getString('topic');
		const selectedFaq = FAQ_CONTENT[topic];

		if (!selectedFaq) {
			return false;
		}

		const embed = new EmbedBuilder()
			.setColor('#cd7f32')
			.setAuthor({ name: 'Drzy FAQ', iconURL: client.user.displayAvatarURL() })
			.setTitle(selectedFaq.title)
			.setDescription(selectedFaq.description)
			.setTimestamp();

		if (selectedFaq.fields) {
			embed.addFields(selectedFaq.fields);
		}

		await interaction.followUp({ embeds: [embed] });
		return true;
	},
};
