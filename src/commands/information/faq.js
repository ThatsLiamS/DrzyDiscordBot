const { SlashCommandBuilder, EmbedBuilder, InteractionContextType } = require('discord.js');

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

	execute: async ({ interaction, client }) => {
		// Grab the value they selected from the drop-down
		const topic = interaction.options.getString('topic');
		
		// Set up the base embed (using an orange/bronze color, but feel free to change it!)
		const embed = new EmbedBuilder()
			.setColor('#cd7f32')
			.setAuthor({ name: 'Drzy FAQ', iconURL: client.user.displayAvatarURL() })
			.setTimestamp();

		// Fill the embed with different info depending on what they picked
		switch (topic) {
		case 'mods':
			embed.setTitle('🛠️ Drzy\'s Mods & Shaders')
				.setDescription('Here is everything Drzy uses to make his Minecraft look and feel amazing:')
				.addFields(
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
				);
			break;

		case 'world':
			embed.setTitle('🌍 World Information')
				.setDescription('Details about the world Drzy is currently playing on:')
				.addFields(
					{ name: 'Platform', value: 'Minecraft Java Edition', inline: false },
					{ name: 'Seed', value: '*To Be Announced!*', inline: false },
					{ name: 'World Type', value: '*To Be Announced!*', inline: false },
				);
			break;

		case 'play':
			embed.setTitle('🤝 Can I play with Drzy?')
				.setDescription('The streamed realm is currently a **strict single-player experience**.\n\nDrzy takes real pride in knowing he gathered every single resource and built everything entirely from scratch, with absolutely no handouts from followers. Because of this, he does not accept players into the world.');
			break;
		}

		// Send the final response!
		await interaction.followUp({ embeds: [embed] });
		return true;
	},
};
