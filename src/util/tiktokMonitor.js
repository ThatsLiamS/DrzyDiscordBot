const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { TikTokLiveConnection, ControlEvent, WebcastEvent } = require('tiktok-live-connector');

const tiktokUsername = 'drzy_mc';

// State management
let isLive = false;
let connection = null;
let reconnectTimeout = null;

const connectToLive = (client) => {
	connection = new TikTokLiveConnection(tiktokUsername);

	connection.connect()
		.then(() => {
			if (!isLive) {
				isLive = true;
				sendLiveEmbed(client);
			}
		})
		.catch((err) => {
			console.error('❌ Failed to connect to TikTok Live:', err.message);
			handleDisconnect(client);
		});

	connection.on(ControlEvent.DISCONNECTED, () => {
		if (isLive) {
			isLive = false;
		}
		handleDisconnect(client);
	});

	connection.on(WebcastEvent.STREAM_END, () => {
		if (isLive) {
			isLive = false;
		}
		handleDisconnect(client);
	});

	connection.on(WebcastEvent.GIFT, (data) => processGift(client, data));
};

// Handlers
const handleDisconnect = (client) => {
	if (reconnectTimeout) {
		return;
	}

	reconnectTimeout = setTimeout(() => {
		reconnectTimeout = null;
		connectToLive(client);
	}, 60_000);
};

const processGift = (client, data) => {
	const { user, giftDetails: gift, repeatCount, repeatEnd, diamondCount } = data;
	if (!user || !gift) {return;}

	// Ignore streak gifts until they are finished
	const isStreak = gift.giftType === 1;
	if (isStreak && !repeatEnd) {
		return;
	}

	const amount = Number(repeatCount) || 1;
	const coinsPerGift = Number(diamondCount) || 1;
	const totalCoins = amount * coinsPerGift;

	// Minimum coin threshold
	if (totalCoins < 50) {
		return;
	}

	const giftData = {
		user: user.uniqueId,
		gift: gift.giftName,
		amount,
		totalCoins,
	};

	sendGiftEmbed(client, giftData);
};


const sendLiveEmbed = async (client) => {
	const channelId = process.env.Announcement_Tiktok_Channel;
	const roleId = process.env.Announcement_Tiktok_Role;

	const embed = new EmbedBuilder()
		.setColor('#00F2FE')
		.setAuthor({ name: 'Drzy', iconURL: client.user.displayAvatarURL() })
		.setTitle('🔴 LIVE NOW ON TIKTOK')
		.setURL(`https://www.tiktok.com/@${tiktokUsername}/live`)
		.setDescription("Check out Drzy's newest TikTok video!")
		.setFooter({ text: "🎵 Don't forget to drop a follow!" })
		.setTimestamp();
		
	const row = new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setLabel('Watch on TikTok')
			.setURL(`https://www.tiktok.com/@${tiktokUsername}/live`),
	);
		
	try {
		const targetChannel = await client.channels.fetch(channelId);
		if (!targetChannel) {return;}

		const sentMsg = await targetChannel.send({
			content: roleId ? `Hey <@&${roleId}>, a new video just dropped!` : 'A new video just dropped!',
			embeds: [embed],
			components: [row], 
		});

		await sentMsg.react('🔥');
	} catch (error) {
		console.error('❌ Error sending Live Embed:', error.message);
	}
};

const sendGiftEmbed = async (client, data) => {
	const channelId = process.env.Donator_Channel;
	const { user, gift, amount, totalCoins } = data;

	const embed = new EmbedBuilder()
		.setColor('#FFD700')
		.setAuthor({ name: 'New TikTok Live Gift 🎁' })
		.setTitle(`${user || 'Unknown User'} sent a ${gift || 'gift'}!`)
		.setURL(`https://www.tiktok.com/@${tiktokUsername}/live`)
		.addFields(
			{
				name: 'Amount',
				value: `${amount}x ${gift}${amount === 1 ? '' : 's'}`,
				inline: true,
			},
			{
				name: 'Total Coins',
				value: `${totalCoins} :coin:`,
				inline: true,
			},
		)
		.setFooter({ text: 'TikTok Live Gift Event' })
		.setTimestamp();
		
	try {
		const targetChannel = await client.channels.fetch(channelId);
		if (!targetChannel) {
			return;
		}
		
		await targetChannel.send({ embeds: [embed] });
	} catch (error) {
		console.error('❌ Error sending Gift Embed:', error.message);
	}
};

const startTikTokMonitor = (client) => {
	connectToLive(client);
};

module.exports = startTikTokMonitor;
