const { 
	MessageFlags, 
	InteractionContextType, 
	SlashCommandBuilder, 
	PermissionFlagsBits, 
	EmbedBuilder, 
} = require('discord.js');

const CHANNELS = {
	RULES_DISPLAY: '1485683511372546096',
	VERIFICATION: '1485793551349710859',
	INTRODUCTION: '1485683511615553538',
};

const RULE_DATA = [
	{
		color: '#fee75c',
		title: '📜 Server Rules',
		fields: [
			{ name: '1. Respect Everyone', value: 'No harassment, hate speech, discrimination, or personal attacks.' },
			{ name: '2. No Spam', value: 'Do not flood channels, spam messages/emojis, or abuse @mentions.' },
			{ name: '3. No NSFW Content', value: 'Pornographic, sexual, or highly offensive material is not allowed.' },
			{ name: '4. No Advertising', value: 'Do not promote servers, links, streams, or services without staff permission (including DMs).' },
			{ name: '5. Gaming Rules', value: '• No cheats, hacks, or exploits\n• Use spoiler tags for game spoilers\n• Keep voice chat respectful (no screaming or soundboard spam)' },
			{ name: '6. Use Correct Channels', value: 'Post content in the appropriate channels.' },
			{ name: '7. Follow Discord ToS', value: 'All members must follow Discord\'s Community Guidelines.' },
		],
	},
	{
		color: '#ed4245',
		title: '🛡️ Moderation & Enforcement',
		fields: [
			{ name: 'Staff Authority', value: 'Moderators have the final say. Looking for loopholes in the rules is not permitted.' },
			{ name: 'Violations', value: '⚠️ Rule violations may result in warnings, mutes, kicks, or bans depending on the severity.' },
			{ name: 'Reporting', value: 'If you see someone breaking the rules, please do not engage. Open a support ticket or contact staff to report the issue.' },
		],
	},
	{
		color: '#5865f2',
		title: '🚀 Next Steps',
		description: `**1.** Go to <#${CHANNELS.VERIFICATION}> to get verified\n**2.** Introduce yourself in <#${CHANNELS.INTRODUCTION}>`,
	},
];

module.exports = {
	name: 'rules',
	description: 'Update the rules embeds!',
	usage: '/rules',

	cooldown: {
		time: 0,
		text: 'None (0)',
	},
	permissions: [
		'Manage Server',
	],
	defer: {
		defer: true,
		ephemeral: true,
	},

	data: new SlashCommandBuilder()
		.setName('rules')
		.setDescription('Update the rules embeds!')

		.setContexts(InteractionContextType.Guild)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

	/**
	 * @async @function
	 * @group Commands @subgroup Admin
	 * @summary Update the rules embeds
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
		const embeds = RULE_DATA.map(data => {
			const embed = new EmbedBuilder()
				.setColor(data.color)
				.setTitle(data.title);

			if (data.fields) {
				embed.addFields(data.fields);
			}
			if (data.description) {
				embed.setDescription(data.description);
			}

			return embed;
		});

		try {
			const targetChannel = await client.channels.fetch(CHANNELS.RULES_DISPLAY);
			await targetChannel.send({ embeds });

			await interaction.followUp({
				content: '✅ The rules have been updated!',
				flags: MessageFlags.Ephemeral,
			});

			return true;
		} catch (error) {
			console.error('Failed to update rules:', error);
			return false;
		}
	},
};
