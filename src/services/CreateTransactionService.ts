import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: string;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    if (type !== 'income' && type !== 'outcome') {
      throw new AppError('Type not valid.');
    }

    let selectedCategory = await categoriesRepository.findOne({
      title: category,
    });

    if (!selectedCategory) {
      selectedCategory = await categoriesRepository.create({
        title: category,
      });

      await categoriesRepository.save(selectedCategory);
    }

    const newTransaction = await transactionsRepository.create({
      title,
      value,
      type,
      category_id: selectedCategory.id,
    });

    await transactionsRepository.save(newTransaction);

    return newTransaction;
  }
}

export default CreateTransactionService;
