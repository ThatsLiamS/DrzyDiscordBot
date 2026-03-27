const {
	TikTokLiveConnection,
	ControlEvent,
	WebcastEvent,
} = require('tiktok-live-connector');

const streamManager = require('./streamManager');

const TIKTOK_USERNAME = 'drzy_mc';
const MIN_GIFT_THRESHOLD = 50;

let isLive = false;
let connection = null;
let reconnectTimeout = null;
let isConnecting = false;

/**
 * @function processGift
 * @group Utility @subgroup Monitoring
 * @summary Validates TikTok gift data, calculates value, and delegates to the stream manager.
 *
 * @param {Client} client - DiscordJS Bot Client Object
 * @param {Object} data - Raw gift data from TikTok Webcast API
 *
 * @returns {void}
 *
 * @author Liam Skinner <me@liamskinner.co.uk>
**/
const processGift = (client, data) => {
	const { user, giftDetails, repeatCount, repeatEnd } = data;

	if (!user || !giftDetails) {
		return;
	}

	if (giftDetails.giftType === 1 && !repeatEnd) {
		return;
	}

	const amount = Number(repeatCount) || 1;
	const coinValue = Number(giftDetails.diamondCount) || 1;

	const totalCoins = amount * coinValue;
	if (totalCoins < MIN_GIFT_THRESHOLD) {
		return;
	}

	let embedColor = '#CD7F32';
	if (totalCoins >= 2500) {
		embedColor = '#B9F2FF';
	} else if (totalCoins >= 1000) {
		embedColor = '#FFD700';
	} else if (totalCoins >= 150) {
		embedColor = '#C0C0C0';
	}

	streamManager.announceDonation(client, {
		platform: 'TikTok',
		user: user.nickname || user.uniqueId,
		giftName: giftDetails.giftName,
		amount,
		totalValue: totalCoins,
		currency: ':coin:',
		url: `https://www.tiktok.com/@${TIKTOK_USERNAME}/live`,
		channelId: process.env.Donator_Channel,
		color: embedColor,
	});
};

/**
 * @function destroyConnection
 * @group Utility @subgroup Monitoring
 * @summary Safely cleans up event listeners and terminates the current TikTok connection.
 *
 * @returns {void}
 *
 * @author Liam Skinner <me@liamskinner.co.uk>
**/
const destroyConnection = () => {
	if (!connection) {
		return;
	}

	try {
		connection.removeAllListeners();
		connection.disconnect();
	} catch (err) {
		console.warn('[TikTok] Error during disconnect:', err.message);
	}

	connection = null;
};

/**
 * @function handleDisconnect
 * @group Utility @subgroup Monitoring
 * @summary Sets a timeout to attempt reconnection to the TikTok stream after a drop.
 *
 * @param {Client} client - DiscordJS Bot Client Object
 *
 * @returns {void}
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
 * @async @function handleStreamEnd
 * @group Utility @subgroup Monitoring
 * @summary Handles the stream ending state, updating the database and triggering reconnects.
 *
 * @param {Client} client - DiscordJS Bot Client Object
 *
 * @returns {Promise<void>}
 *
 * @author Liam Skinner <me@liamskinner.co.uk>
**/
const handleStreamEnd = async (client) => {
	if (!isLive) {
		return;
	}

	isLive = false;
	await streamManager.updateLiveState('TikTok', false, TIKTOK_USERNAME);

	handleDisconnect(client);
};

/**
 * @async @function connectToLive
 * @group Utility @subgroup Monitoring
 * @summary Establishes a connection to the TikTok Live Webcast API and manages state.
 *
 * @param {Client} client - DiscordJS Bot Client Object
 *
 * @returns {Promise<void>}
 *
 * @author Liam Skinner <me@liamskinner.co.uk>
**/
const connectToLive = async (client) => {
	if (isConnecting) {
		return;
	}
	isConnecting = true;
	destroyConnection();

	connection = new TikTokLiveConnection(TIKTOK_USERNAME);

	connection.on(ControlEvent.DISCONNECTED, () => handleStreamEnd(client));
	connection.on(WebcastEvent.STREAM_END, () => handleStreamEnd(client));
	connection.on(WebcastEvent.GIFT, (data) => processGift(client, data));

	try {
		await connection.connect();
		if (!isLive) {
			isLive = true;

			await streamManager.updateLiveState('TikTok', true, TIKTOK_USERNAME);
			await streamManager.announceLive(client, {
				platform: 'TikTok',
				username: 'Drzy',
				url: `https://www.tiktok.com/@${TIKTOK_USERNAME}/live`,
				channelId: process.env.Announcement_Tiktok_Channel,
				roleId: process.env.Announcement_Tiktok_Role,
				color: '#00F2FE',
			});
		}
	} catch (err) {
		console.error('[TikTok] Connection failed:', err.message);
		handleDisconnect(client);
	} finally {
		isConnecting = false;
	}
};

/**
 * @async @function startTikTokMonitor
 * @group Utility @subgroup Monitoring
 * @summary Main entry point for initializing the TikTok stream monitoring service.
 *
 * @param {Client} client - DiscordJS Bot Client Object
 *
 * @returns {Promise<void>}
 *
 * @author Liam Skinner <me@liamskinner.co.uk>
**/
const startTikTokMonitor = async (client) => {
	isLive = await streamManager.getLiveState('TikTok');
	connectToLive(client);
};

module.exports = startTikTokMonitor;
