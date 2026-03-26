const {
	MessageFlags,
	InteractionContextType,
	SlashCommandBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
} = require('discord.js');

const WIN_PATTERNS = [
	[0, 1, 2], [3, 4, 5], [6, 7, 8],
	[0, 3, 6], [1, 4, 7], [2, 5, 8],
	[0, 4, 8], [2, 4, 6],
];

/**
 * @function checkWinner
 * @summary Checks if a player has won the game
 * 
 * @param {Array<string|null>} board - The current state of the board
 *
 * @returns {string|null} 'X', 'O', or null if no winner
 *
 * @author Liam Skinner <me@liamskinner.co.uk>
**/
const checkWinner = (board) => {
	for (const [a, b, c] of WIN_PATTERNS) {
		if (board[a] && board[a] === board[b] && board[a] === board[c]) {
			return board[a];
		}
	}
	return null;
};

/**
 * @function createBoard
 * @summary Generates ActionRows for the Tic-Tac-Toe board
 *
 * @param {Array<string|null>} board - The current state of the board
 * @param {boolean} disabled - Whether the buttons should be disabled
 *
 * @returns {ActionRowBuilder[]} Array of ActionRows containing buttons
 *
 * @author Liam Skinner <me@liamskinner.co.uk>
**/
const createBoard = (board, disabled = false) => {
	const rows = [];
	for (let i = 0; i < 3; i++) {
		const row = new ActionRowBuilder();
		for (let j = 0; j < 3; j++) {
			const index = i * 3 + j;
			const value = board[index];

			const buttonConfig = {
				X: { label: '✖️', style: ButtonStyle.Primary },
				O: { label: '⭕', style: ButtonStyle.Danger },
				default: { label: '➖', style: ButtonStyle.Secondary },
			};
			const config = buttonConfig[value] || buttonConfig.default;

			row.addComponents(
				new ButtonBuilder()
					.setCustomId(`ttt_${index}`)
					.setLabel(config.label)
					.setStyle(config.style)
					.setDisabled(value !== null || disabled),
			);
		}
		rows.push(row);
	}
	return rows;
};

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

	/**
	 * @async @function
	 * @group Commands @subgroup Fun
	 * @summary 1v1 Tic Tac Toe
	 *
	 * @param {Object} param
	 * @param {CommandInteraction} param.interaction - DiscordJS Slash Command Object
	 *
	 * @returns {Promise<boolean>} True (Success) - triggers cooldown.
	 * @returns {Promise<boolean>} False (Error) - skips cooldown.
	 *
	 * @author Liam Skinner <me@liamskinner.co.uk>
	**/
	execute: async ({ interaction }) => {
		const opponent = interaction.options.getUser('opponent');
		const challenger = interaction.user;

		if (opponent.bot || opponent.id === challenger.id) {
			await interaction.followUp({
				content: "❌ You can't play against a bot or yourself!",
				flags: MessageFlags.Ephemeral,
			});
			return false;
		}

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

		challengeCollector.on('collect', async (btn) => {
			if (btn.user.id !== opponent.id) {
				return btn.reply({ content: "You're not the challenged player!", flags: MessageFlags.Ephemeral });
			}

			if (btn.customId === 'decline') {
				challengeCollector.stop('declined');
				return btn.update({ content: `❌ ${opponent} declined the challenge.`, components: [] });
			}

			challengeCollector.stop('accepted');
			await btn.update({ content: '✅ Challenge accepted! Starting game...', components: [] });

			/**
			 * @async @function startGame
			 * @summary Inner function to handle the game loop logic
			 *
			 * @author Liam Skinner <me@liamskinner.co.uk>
			**/
			const startGame = async () => {
				const board = Array(9).fill(null);
				let currentSymbol = 'X';
				const players = { X: challenger, O: opponent };

				const gameMsg = await interaction.editReply({
					content: `🎮 **Tic-Tac-Toe**\n${challenger} (✖️) vs ${opponent} (⭕)\n\nIt is ${players[currentSymbol]}'s turn!`,
					components: createBoard(board),
				});

				const gameCollector = gameMsg.createMessageComponentCollector({
					componentType: ComponentType.Button,
					time: 300_000,
				});

				gameCollector.on('collect', async (gBtn) => {
					const currentPlayer = players[currentSymbol];

					if (![challenger.id, opponent.id].includes(gBtn.user.id)) {
						return gBtn.reply({ content: "This isn't your game!", flags: MessageFlags.Ephemeral });
					}

					if (gBtn.user.id !== currentPlayer.id) {
						return gBtn.reply({ content: 'Wait your turn!', flags: MessageFlags.Ephemeral });
					}

					const index = Number(gBtn.customId.split('_')[1]);
					board[index] = currentSymbol;

					const winner = checkWinner(board);
					const isDraw = !board.includes(null);
					let statusText = `🎮 **Tic-Tac-Toe**\n${challenger} (✖️) vs ${opponent} (⭕)\n\n`;

					if (winner) {
						statusText += `🏆 **${players[winner]} WINS!**`;
						gameCollector.stop('finished');
					} else if (isDraw) {
						statusText += '👔 **IT\'S A DRAW!**';
						gameCollector.stop('finished');
					} else {
						currentSymbol = currentSymbol === 'X' ? 'O' : 'X';
						statusText += `It is ${players[currentSymbol]}'s turn!`;
					}

					await gBtn.update({
						content: statusText,
						components: createBoard(board, !!winner || isDraw),
					});
				});

				gameCollector.on('end', async (_, reason) => {
					if (reason === 'time') {
						await interaction.editReply({
							content: '⏳ Game timed out.',
							components: createBoard(board, true),
						});
					}
				});
			};

			await startGame();
		});

		challengeCollector.on('end', async (_, reason) => {
			if (reason === 'time') {
				await challengeMsg.edit({ content: '⏳ Challenge timed out.', components: [] });
			}
		});

		return true;
	},
};
