const {
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require('discord.js');
const {
	TikTokLiveConnection,
	ControlEvent,
	WebcastEvent,
} = require('tiktok-live-connector');

const db = require('./databaseManager');

const TIKTOK_USERNAME = 'drzy_mc';
const MIN_GIFT_THRESHOLD = 50;

let isLive = false;
let connection = null;
let reconnectTimeout = null;

/**
 * @async @function sendLiveEmbed
 * @group Utility @subgroup Monitoring
 * @summary Announces when the TikTok stream goes live
 *
 * @param {Client} client - DiscordJS Bot Client Object
 *
 * @returns {Promise<void>}
 *
 * @author Liam Skinner <me@liamskinner.co.uk>
**/
const sendLiveEmbed = async (client) => {
	const channelId = process.env.Announcement_Tiktok_Channel;
	const roleId = process.env.Announcement_Tiktok_Role;

	const embed = new EmbedBuilder()
		.setColor('#00F2FE')
		.setAuthor({ name: 'Drzy', iconURL: client.user.displayAvatarURL() })
		.setTitle('🔴 LIVE NOW ON TIKTOK')
		.setURL(`https://www.tiktok.com/@${TIKTOK_USERNAME}/live`)
		.setDescription('Drzy is now live on TikTok! Come hang out and join the stream!')
		.setFooter({ text: "🎵 Don't forget to drop a follow!" })
		.setTimestamp();
		
	const row = new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setLabel('Watch Stream')
			.setURL(`https://www.tiktok.com/@${TIKTOK_USERNAME}/live`),
	);
		
	try {
		const targetChannel = await client.channels.fetch(channelId);
		if (!targetChannel) {
			return;
		}

		await targetChannel.send({
			content: roleId ? `Hey <@&${roleId}>, Drzy is live!` : 'Drzy is live on TikTok!',
			embeds: [embed],
			components: [row], 
		});
	}
	catch (error) {
		console.error('❌ Error sending Live Embed:', error.message);
	}
};

/**
 * @async @function sendGiftEmbed
 * @group Utility @subgroup Monitoring
 * @summary Logs significant TikTok gifts to a specific channel
 *
 * @param {Client} client - DiscordJS Bot Client Object
 * @param {Object} data - Formatted gift data
 *
 * @returns {Promise<void>}
 *
 * @author Liam Skinner <me@liamskinner.co.uk>
**/
const sendGiftEmbed = async (client, data) => {
	const channelId = process.env.Donator_Channel;
	const { user, gift, amount, totalCoins } = data;

	const embed = new EmbedBuilder()
		.setColor('#FFD700')
		.setAuthor({ name: 'New TikTok Live Gift 🎁' })
		.setTitle(`${user} sent a ${gift}!`)
		.setURL(`https://www.tiktok.com/@${TIKTOK_USERNAME}/live`)
		.addFields(
			{ name: 'Amount', value: `${amount}x ${gift}${amount === 1 ? '' : 's'}`, inline: true },
			{ name: 'Value', value: `${totalCoins} Coins`, inline: true },
		)
		.setFooter({ text: 'TikTok Live Gift Event' })
		.setTimestamp();
		
	try {
		const targetChannel = await client.channels.fetch(channelId);
		if (targetChannel) {
			await targetChannel.send({ embeds: [embed] });
		}
	}
	catch (error) {
		console.error('❌ Error sending Gift Embed:', error.message);
	}
};

/**
 * @function processGift
 * @group Utility @subgroup Monitoring
 * @summary Validates and prepares gift data for Discord logging
 *
 * @param {Client} client - DiscordJS Bot Client Object
 * @param {Object} data - Raw gift data from TikTok Webcast
 *
 * @author Liam Skinner <me@liamskinner.co.uk>
**/
const processGift = (client, data) => {
	const { user, giftDetails, repeatCount, repeatEnd, diamondCount } = data;
	
	if (!user || !giftDetails) {
		return;
	}

	if (giftDetails.giftType === 1 && !repeatEnd) {
		return;
	}

	const amount = Number(repeatCount) || 1;
	const totalCoins = amount * (Number(diamondCount) || 0);

	if (totalCoins < MIN_GIFT_THRESHOLD) {
		return;
	}

	sendGiftEmbed(client, {
		user: user.nickname || user.uniqueId,
		gift: giftDetails.giftName,
		amount,
		totalCoins,
	});
};

/**
 * @function updateLiveState
 * @group Utility @subgroup Monitoring
 * @summary Updates the live status in both local memory and the database
 *
 * @param {boolean} status - The new live status
 *
 * @author Liam Skinner <me@liamskinner.co.uk>
**/
const updateLiveState = async (status) => {
	isLive = status;
	await db.setValue('system', 'tiktok', { 
		isLive: status, 
		lastUpdated: Date.now(),
		username: TIKTOK_USERNAME,
	});
};

/**
 * @function handleDisconnect
 * @group Utility @subgroup Monitoring
 * @summary Manages reconnection attempts when the TikTok stream ends or drops
 *
 * @param {Client} client - DiscordJS Bot Client Object
 *
 * @author Liam Skinner <me@liamskinner.co.uk>
**/
const handleDisconnect = (client) => {
	if (reconnectTimeout) {
		return;
	}

	reconnectTimeout = setTimeout(() => {
		reconnectTimeout = null;
		connectToLive(client);
	}, 60_000);
};

/**
 * @function connectToLive
 * @group Utility @subgroup Monitoring
 * @summary Establishes a connection to the TikTok Live Webcast API
 *
 * @param {Client} client - DiscordJS Bot Client Object
 *
 * @author Liam Skinner <me@liamskinner.co.uk>
**/
const connectToLive = (client) => {
	if (connection) {
		try { 
			connection.disconnect(); 
		} catch (err) {
			console.warn('Failed to disconnect previous TikTok connection:', err.message);
		}
	}


	connection = new TikTokLiveConnection(TIKTOK_USERNAME);

	connection.connect()
		.then(async () => {
			if (!isLive) {
				await updateLiveState(true);
				await sendLiveEmbed(client);
			}
		})
		.catch(() => handleDisconnect(client));

	connection.on(ControlEvent.DISCONNECTED, async () => {
		await updateLiveState(false);
		handleDisconnect(client);
	});

	connection.on(WebcastEvent.STREAM_END, async () => {
		await updateLiveState(false);
		handleDisconnect(client);
	});

	connection.on(WebcastEvent.GIFT, (data) => processGift(client, data));
};

/**
 * @async @function startTikTokMonitor
 * @group Utility @subgroup Monitoring
 * @summary Main entry point for starting the TikTok monitoring service
 *
 * @param {Client} client - DiscordJS Bot Client Object
 *
 * @author Liam Skinner <me@liamskinner.co.uk>
**/
const startTikTokMonitor = async (client) => {
	const data = await db.getValue('system', 'tiktok');
	if (data) {
		isLive = data.isLive;
	}

	connectToLive(client);
};

module.exports = startTikTokMonitor;
