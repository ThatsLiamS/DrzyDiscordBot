// eslint-disable-next-line no-unused-vars
const { MessageFlags, InteractionContextType, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, CommandInteraction, Client } = require('discord.js');

module.exports = {
	name: 'rules',
	description: 'Update the rules embeds!',
	usage: '/rules',

	cooldown: {
		time: 0,
		text: 'None (0)',
	},
	defer: {
		defer: true,
		ephemeral: true,
	},

	data: new SlashCommandBuilder()
		.setName('rules')
		.setDescription('Update the rule embeds!')
		.setContexts(InteractionContextType.Guild)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

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

		// Embed 1: The Core Rules
		const rulesEmbed = new EmbedBuilder()
			.setColor('#fee75c')
			.setTitle('📜 Server Rules')
			.addFields(
				{ name: '1. Respect Everyone', value: 'No harassment, hate speech, discrimination, or personal attacks.' },
				{ name: '2. No Spam', value: 'Do not flood channels, spam messages/emojis, or abuse @mentions.' },
				{ name: '3. No NSFW Content', value: 'Pornographic, sexual, or highly offensive material is not allowed.' },
				{ name: '4. No Advertising', value: 'Do not promote servers, links, streams, or services without staff permission (including DMs).' },
				{ name: '5. Gaming Rules', value: '• No cheats, hacks, or exploits\n• Use spoiler tags for game spoilers\n• Keep voice chat respectful (no screaming or soundboard spam)' },
				{ name: '6. Use Correct Channels', value: 'Post content in the appropriate channels.' },
				{ name: '7. Follow Discord ToS', value: 'All members must follow Discord\'s Community Guidelines.' },
			);

		// Embed 2: Moderation & Enforcement
		const modEmbed = new EmbedBuilder()
			.setColor('#ed4245') // Red to indicate warnings/rules enforcement
			.setTitle('🛡️ Moderation & Enforcement')
			.addFields(
				{ name: 'Staff Authority', value: 'Moderators have the final say. Looking for loopholes in the rules is not permitted.' },
				{ name: 'Violations', value: '⚠️ Rule violations may result in warnings, mutes, kicks, or bans depending on the severity.' },
				{ name: 'Reporting', value: 'If you see someone breaking the rules, please do not engage. Open a support ticket or contact staff to report the issue.' },
			);

		// Embed 3: Next Steps
		const nextStepsEmbed = new EmbedBuilder()
			.setColor('#5865f2')
			.setTitle('🚀 Next Steps')
			.setDescription('**1.** Go to <#1485793551349710859> to get verified\n**2.** Introduce yourself in <#1485683511615553538>');

		// Example of how to send them all in one message:
		const channel = await client.channels.fetch('1485683511372546096');
		await channel.send({ embeds: [rulesEmbed, modEmbed, nextStepsEmbed] });

		await interaction.followUp({
			content: 'The rules have been updated!',
			flags: MessageFlags.Ephemeral,
		});
	},
};
