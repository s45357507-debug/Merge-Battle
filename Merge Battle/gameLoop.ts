// Пример интеграции Board в игровой цикл.
// Не меняет визуальную часть — даёт вам точку входа для render-функций в вашем UI.

import { Board, Direction } from './src/game/Board';
import { buyAndApply } from './shop';

const board = new Board(4,4);
export default board; // чтобы UI модули могли импортировать состояние

// пример: функция для обработки движения
export function handleMove(direction: Direction) {
  const result = board.move(direction);
  // здесь можно уведомить UI: обновить плитки, показать +score
  return result; // { moved: boolean, scoreDelta }
}

// пример: покупка из магазина и немедленное применение
export async function purchaseAndEquip(userId: string | undefined, itemId: string) {
  const { newState, itemEffect, item } = await buyAndApply(userId, itemId);
  if (itemEffect) {
    board.applyItemEffect(itemEffect);
  }
  // можете вернуть newState для отображения нового баланса
  return { newState, item };
}