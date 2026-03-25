const {
	MessageFlags,
	InteractionContextType,
	SlashCommandBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
} = require('discord.js');

module.exports = {
	name: 'tictactoe',
	description: 'Challenge someone to a game of Tic-Tac-Toe!',
	usage: '/tictactoe <opponent>',

	defer: {
		defer: true,
		ephemeral: false,
	},

	data: new SlashCommandBuilder()
		.setName('tictactoe')
		.setDescription('Challenge someone to a game of Tic-Tac-Toe!')
		.setContexts(InteractionContextType.Guild)

		.addUserOption(option =>
			option.setName('opponent')
				.setDescription('The user you want to play against')
				.setRequired(true),
		),

	execute: async ({ interaction }) => {
		const opponent = interaction.options.getUser('opponent');
		const challenger = interaction.user;

		if (opponent.bot || opponent.id === challenger.id) {
			return interaction.followUp({
				content: "❌ You can't play against a bot or yourself!",
				flags: MessageFlags.Ephemeral,
			});
		}

		// ---------------------------
		// SAFE REPLY HELPER
		// ---------------------------
		const safeReply = async (btn, options) => {
			if (!btn.replied && !btn.deferred) {
				return btn.reply(options);
			}
		};

		// ---------------------------
		// CHALLENGE PHASE
		// ---------------------------
		const challengeRow = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId('accept').setLabel('Accept').setStyle(ButtonStyle.Success),
			new ButtonBuilder().setCustomId('decline').setLabel('Decline').setStyle(ButtonStyle.Danger),
		);

		const challengeMsg = await interaction.followUp({
			content: `🎮 ${opponent}, you've been challenged by ${challenger}!\nDo you accept?`,
			components: [challengeRow],
			fetchReply: true,
		});

		const challengeCollector = challengeMsg.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: 60_000,
		});

		let gameStarted = false;

		challengeCollector.on('collect', async (btn) => {
			try {
				if (btn.user.id !== opponent.id) {
					return safeReply(btn, {
						content: "You're not the challenged player!",
						flags: MessageFlags.Ephemeral,
					});
				}

				await btn.deferUpdate(); // ALWAYS ACKNOWLEDGE

				if (btn.customId === 'decline') {
					challengeCollector.stop('declined');
					return challengeMsg.edit({
						content: `❌ ${opponent} declined the challenge.`,
						components: [],
					});
				}

				if (btn.customId === 'accept') {
					gameStarted = true;
					challengeCollector.stop('accepted');

					await challengeMsg.edit({
						content: '✅ Challenge accepted! Starting game...',
						components: [],
					});

					startGame();
				}
			} catch (err) {
				console.error(err);
			}
		});

		challengeCollector.on('end', async (_, reason) => {
			if (!gameStarted && reason !== 'declined') {
				await challengeMsg.edit({
					content: '⏳ Challenge timed out.',
					components: [],
				});
			}
		});

		// ---------------------------
		// GAME LOGIC
		// ---------------------------
		async function startGame() {
			const board = Array(9).fill(null);
			const players = {
				X: challenger,
				O: opponent,
			};

			let currentSymbol = 'X';
			let isGameOver = false;

			const buildBoard = () => {
				const rows = [];
				for (let i = 0; i < 3; i++) {
					const row = new ActionRowBuilder();

					for (let j = 0; j < 3; j++) {
						const index = i * 3 + j;
						const value = board[index];

						row.addComponents(
							new ButtonBuilder()
								.setCustomId(`ttt_${index}`)
								.setLabel(value === 'X' ? '✖️' : value === 'O' ? '⭕' : '➖')
								.setStyle(
									value === 'X'
										? ButtonStyle.Primary
										: value === 'O'
											? ButtonStyle.Danger
											: ButtonStyle.Secondary,
								)
								.setDisabled(value !== null || isGameOver),
						);
					}

					rows.push(row);
				}
				return rows;
			};

			const gameMsg = await challengeMsg.edit({
				content: `🎮 **Tic-Tac-Toe**\n${challenger} (✖️) vs ${opponent} (⭕)\n\nIt is ${players[currentSymbol]}'s turn!`,
				components: buildBoard(),
			});

			const collector = gameMsg.createMessageComponentCollector({
				componentType: ComponentType.Button,
				time: 300_000,
			});

			collector.on('collect', async (btn) => {
				try {
					const player = players[currentSymbol];

					if (![challenger.id, opponent.id].includes(btn.user.id)) {
						return safeReply(btn, {
							content: "This isn't your game!",
							flags: MessageFlags.Ephemeral,
						});
					}

					if (btn.user.id !== player.id) {
						return safeReply(btn, {
							content: 'Wait your turn!',
							flags: MessageFlags.Ephemeral,
						});
					}

					await btn.deferUpdate(); // CRITICAL

					const index = Number(btn.customId.split('_')[1]);

					if (board[index] !== null) {
						return; // Already handled safely
					}

					board[index] = currentSymbol;

					const winPatterns = [
						[0,1,2],[3,4,5],[6,7,8],
						[0,3,6],[1,4,7],[2,5,8],
						[0,4,8],[2,4,6],
					];

					const hasWon = winPatterns.some(([a,b,c]) =>
						board[a] && board[a] === board[b] && board[a] === board[c],
					);

					const isDraw = !board.includes(null);

					let content = `🎮 **Tic-Tac-Toe**\n${challenger} (✖️) vs ${opponent} (⭕)\n\n`;

					if (hasWon) {
						isGameOver = true;
						content += `🏆 **${player} WINS!**`;
					} else if (isDraw) {
						isGameOver = true;
						content += '👔 **IT\'S A DRAW!**';
					} else {
						currentSymbol = currentSymbol === 'X' ? 'O' : 'X';
						content += `It is ${players[currentSymbol]}'s turn!`;
					}

					await gameMsg.edit({
						content,
						components: buildBoard(),
					});

					if (isGameOver) {collector.stop('finished');}
				} catch (err) {
					console.error(err);
				}
			});

			collector.on('end', async (_, reason) => {
				if (reason === 'time') {
					isGameOver = true;

					await gameMsg.edit({
						content: '⏳ Game timed out.',
						components: buildBoard(),
					});
				}
			});
		}
	},
};
