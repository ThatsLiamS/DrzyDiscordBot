const {
	Events,
	EmbedBuilder,
} = require('discord.js');

const CHANNELS = {
	WELCOME: '1486456125036560528',
	RULES: '1485683511372546096',
	VERIFICATION: '1485793551349710859',
	INTRODUCTION: '1485683511615553538',
};

module.exports = {
	name: Events.GuildMemberAdd,
	once: false,

	/**
	 * @async @function
	 * @group Events
	 * @summary Welcome new guild members
	 *
	 * @param {GuildMember} member - DiscordJS GuildMember Object
	 * @param {Client} client - DiscordJS Bot Client Object
	 *
	 * @author Liam Skinner <me@liamskinner.co.uk>
	**/
	execute: async (member, client) => {

		try {
			const welcomeEmbed = new EmbedBuilder()
				.setColor('#00FF00')
				.setTitle(`Welcome to the server, ${member.user.username}! 🎉`)
				.setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
				.setDescription(`We are so glad to have you here, ${member.user.username}! To get started, please check out the channels below:`)
				.addFields(
					{ 
						name: '📜 1. Read the Rules', 
						value: `Please read through <#${CHANNELS.RULES}> to keep the server safe and fun for everyone.`, 
						inline: false,
					},
					{ 
						name: '🎭 2. Get your Roles', 
						value: `Head over to <#${CHANNELS.VERIFICATION}> to **verify your account** and get notification pings.`, 
						inline: false ,
					},
					{ 
						name: '👋 3. Introduce Yourself', 
						value: `Say hello and tell us a bit about yourself in <#${CHANNELS.INTRODUCTION}>!`, 
						inline: false ,
					},
				)
				.setFooter({ 
					text: `Member #${member.guild.memberCount}`, 
					iconURL: member.guild.iconURL(),
				})
				.setTimestamp();

			const channel = await client.channels.fetch(CHANNELS.WELCOME);

			if (channel) {
				await channel.send({
					content: `Hey <@${member.user.id}>, welcome!`,
					embeds: [welcomeEmbed],
				});
			}

		} catch (error) {
			console.error(`Error in GuildMemberAdd event for ${member.user.tag}:`, error);
		}
	},
};
