import { cardRepository } from '../repositories/card.repository.js';
import type { CreateCardInput, UpdateCardInput } from '../validators/card.validator.js';

export const cardService = {
  async create(userId: string, input: CreateCardInput) {
    return cardRepository.create(userId, {
      name: input.name,
      limit: input.limit,
      closingDay: input.closingDay,
      dueDay: input.dueDay,
    });
  },

  async list(userId: string) {
    return cardRepository.findManyByUserId(userId);
  },

  async update(userId: string, cardId: string, input: UpdateCardInput) {
    return cardRepository.update(cardId, userId, input);
  },
};
