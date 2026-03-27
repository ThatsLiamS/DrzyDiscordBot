const {
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require('discord.js');
const pluralize = require('pluralize');


const db = require('./databaseManager');


/**
 * @async @function announceLive
 * @group Utility @subgroup Stream Management
 * @summary Platform-agnostic function to announce when a stream goes live.
 *
 * @param {Client} client - DiscordJS Bot Client Object
 * @param {Object} options - Configuration for the live announcement
 *
 * @returns {Promise<void>}
 *
 * @author Liam Skinner <me@liamskinner.co.uk>
**/
const announceLive = async (client, options) => {
	const { platform, username, url, channelId, roleId, color = '#00F2FE' } = options;

	const footerTexts = {
		tiktok: "🎵 Don't forget to drop a follow",
		youtube: "🔴 Don't forget to subscribe",
	};
	const footerText = footerTexts[platform.toLowerCase()] || '📺 Thanks for watching and supporting!';

	const embed = new EmbedBuilder()
		.setColor(color)
		.setAuthor({ name: username, iconURL: client.user.displayAvatarURL() })
		.setTitle(`🔔 LIVE NOW ON ${platform.toUpperCase()}`)
		.setURL(url)
		.setDescription(`${username} is now live on ${platform}! Come hang out and join the stream!`)
		.setFooter({ text: footerText })
		.setTimestamp();
		
	const row = new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setLabel('Watch Stream')
			.setURL(url),
	);
		
	try {
		const targetChannel = await client.channels.fetch(channelId);
		if (!targetChannel) {
			return;
		}

		await targetChannel.send({
			content: roleId ? `Hey <@&${roleId}>, ${username} is live!` : `${username} is live on ${platform}!`,
			embeds: [embed],
			components: [row], 
		});
	} catch (error) {
		console.error(`❌ Error sending ${platform} Live Embed:`, error.message);
	}
};

/**
 * @async @function announceDonation
 * @group Utility @subgroup Stream Management
 * @summary Platform-agnostic function to log significant stream gifts/donations.
 *
 * @param {Client} client - DiscordJS Bot Client Object
 * @param {Object} options - Configuration for the donation announcement
 *
 * @returns {Promise<void>}
 *
 * @author Liam Skinner <me@liamskinner.co.uk>
**/
const announceDonation = async (client, options) => {
	const { platform, user, giftName, amount, totalValue, currency, url, channelId, color = '#FFD700' } = options;

	const isVowel = /^[aeiou]/i.test(giftName);
	const article = isVowel ? 'an' : 'a';

	const titleText = amount === 1 
		? `${user} sent ${article} ${giftName}!` 
		: `${user} sent ${amount} ${pluralize(giftName)}!`;

	const embed = new EmbedBuilder()
		.setColor(color)
		.setAuthor({ name: `New ${platform} Gift! 🎁` })
		.setTitle(titleText)
		.setURL(url)
		.addFields(
			{ name: 'Amount', value: `${amount}x ${pluralize(giftName, amount)}`, inline: true },
			{ name: 'Value', value: `${totalValue} ${currency}`, inline: true },
		)
		.setFooter({ text: `${platform} Event` })
		.setTimestamp();

	try {
		const targetChannel = await client.channels.fetch(channelId);
		if (targetChannel) {
			await targetChannel.send({ embeds: [embed] });
		}
	} catch (error) {
		console.error(`❌ Error sending ${platform} Gift Embed:`, error.message);
	}
};


/**
 * @async @function updateLiveState
 * @group Utility @subgroup Stream Management
 * @summary Updates the stream's live status in the database.
 *
 * @param {string} platform - The platform name (used as the database key)
 * @param {boolean} status - The new live status (true/false)
 * @param {string} username - The streamer's username
 *
 * @returns {Promise<void>}
 *
 * @author Liam Skinner <me@liamskinner.co.uk>
**/
const updateLiveState = async (platform, status, username) => {
	await db.setValue('system', platform.toLowerCase(), { 
		isLive: status, 
		lastUpdated: Date.now(),
		username: username,
	});
};

/**
 * @async @function getLiveState
 * @group Utility @subgroup Stream Management
 * @summary Retrieves the last known live status from the database.
 *
 * @param {string} platform - The platform name (used as the database key)
 *
 * @returns {Promise<boolean>} - Returns true if the stream was marked as live
 *
 * @author Liam Skinner <me@liamskinner.co.uk>
**/
const getLiveState = async (platform) => {
	const data = await db.getValue('system', platform.toLowerCase());
	return data ? data.isLive : false;
};

module.exports = {
	announceLive,
	announceDonation,
	updateLiveState,
	getLiveState,
};
