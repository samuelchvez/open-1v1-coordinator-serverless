export { default as tictactoe } from './tictactoe';

export const getGameNameAndVersion = (gameId: string): Array<string> => 
  gameId.split('@');
