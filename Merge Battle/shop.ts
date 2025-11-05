// Клиентская обёртка для магазина: покупка, получение эффекта и немедленное применение.
// Не меняет UI — возвращает данные для отрисовки/анимаций в вашем текущем коде.

import { purchaseItem } from './economy';

export interface ShopItem {
  id: string;
  title: string;
  price: number;
  slot?: string;
  effect?: any; // ItemEffect из Board
}

export const SHOP_CATALOG: ShopItem[] = [
  { id: 'spawn_boost_1', title: 'Boost Spawn', price: 300, slot: 'default', effect: { type: 'spawnBoost', values: [2,2,4,4] } },
  { id: 'score_x2', title: 'Score x2 (session)', price: 500, slot: 'default', effect: { type: 'scoreMultiplier', multiplier: 2 } }
];

// Покупка: списываем монеты (economy) -> сохраняем в inventory (server) -> возвращаем эффект для немедленного применения
export async function buyAndApply(userId: string | undefined, itemId: string) {
  const item = SHOP_CATALOG.find(i => i.id === itemId);
  if (!item) throw new Error('Item not found');
  const res = await purchaseItem(userId, itemId, item.price);
  if (!res.success) throw new Error(res.error || 'Purchase failed');
  // Возвращаем эффект, чтобы gameLoop/Board применил его сразу
  return { newState: res.state, itemEffect: item.effect, item };
}