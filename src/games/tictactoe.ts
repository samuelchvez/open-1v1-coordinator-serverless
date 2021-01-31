import { PLAYERS } from "@models/Match";


const COINS = {
  player1: 1,
  player2: -1,
  noPlayer: 0,
};

const isValidMove = (gameState: Array<number[]>, move: number): boolean => {
  if (0 <= move && move < 9) {
    const [row, col] = divmod(move, 3);

    return gameState[row][col] === COINS.noPlayer;
  }

  return false;
}

const divmod = (a: number, b: number) => ([Math.floor(a / b), a % b]);

const getWinner = (gameState: Array<number[]>) => {

  // TODO: optimize
  const sums = [
    gameState[0][0] + gameState[0][1] + gameState[0][2],
    gameState[1][0] + gameState[1][1] + gameState[1][2],
    gameState[2][0] + gameState[2][1] + gameState[2][2],
    gameState[0][0] + gameState[1][0] + gameState[2][0],
    gameState[0][1] + gameState[1][1] + gameState[2][1],
    gameState[0][2] + gameState[1][2] + gameState[2][2],
    gameState[0][0] + gameState[1][1] + gameState[2][2],
    gameState[0][2] + gameState[1][1] + gameState[2][0],
  ];

  if (sums.includes(COINS.player1 * 3)) {
    return PLAYERS.player1;
  }

  if (sums.includes(COINS.player2 * 3)) {
    return PLAYERS.player2;
  }

  const hasSpaces = gameState
    .map(row => row.includes(COINS.noPlayer))
    .reduce((acc, value) => acc || value, false);

  return hasSpaces ? PLAYERS.noPlayer : PLAYERS.bothPlayers;
}

export default {
  ['0.0.1']: {
    init: () => ([
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ]),
    next: ({
      gameState,
      nextTurn,
      move,
    }: {
      gameState: Array<number[]>,
      nextTurn: number,
      move: number,
    }) => {
      if (isValidMove(gameState, move)) {
        const [row, col] = divmod(move, 3);
        const newState = gameState.map(row => ([...row]));

        newState[row][col] = nextTurn === PLAYERS.player1
          ? COINS.player1
          : COINS.player2;

        return [
          newState,
          nextTurn === PLAYERS.player1
            ? PLAYERS.player2
            : PLAYERS.player1,
          getWinner(newState),
        ];
      }

      return [gameState, nextTurn, getWinner(gameState)];
    },
  },
};
