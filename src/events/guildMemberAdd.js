const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
	name: Events.GuildMemberAdd,
	once: false,
	
	execute: async (member, client) => {

		const rulesChannelId ='1485683511372546096';
		const rolesChannelId = '1485793551349710859';
		const introChannelId = '1485683511615553538';

		try {

			// Build the welcome embed
			const welcomeEmbed = new EmbedBuilder()
				.setColor('#00FF00')
				.setTitle(`Welcome to the server, ${member.user.username}! 🎉`)
				.setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))

				.setDescription(`We are so glad to have you here, ${member.user.username}! To get started, please check out the channels below:`)
				.addFields(
					{ name: '📜 1. Read the Rules', value: `Please read through <#${rulesChannelId}> to keep the server safe and fun for everyone.`, inline: false },
					{ name: '🎭 2. Get your Roles', value: `Head over to <#${rolesChannelId}> to **verify your account** and get notification pings.`, inline: false },
					{ name: '👋 3. Introduce Yourself', value: `Say hello and tell us a bit about yourself in <#${introChannelId}>!`, inline: false },
				)
				.setFooter({ text: `Member #${member.guild.memberCount}`, iconURL: member.guild.iconURL() })
				.setTimestamp();

			try {
				const channel = await client.channels.fetch('1486456125036560528');

				await channel.send({
					content: `Hey <@${member.user.id}>, welcome!`,
					embeds: [welcomeEmbed],
				});
			} catch {
				// 
			}

		} catch {
			//
		}
	},
};
