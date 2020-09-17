import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    return (await this.find()).reduce(
      (acc, item) => {
        if (item.type === 'income') acc.income += item.value;
        if (item.type === 'outcome') acc.outcome += item.value;
        return acc;
      },
      {
        income: 0,
        outcome: 0,
        total: 0,
      },
    );
  }
}

export default TransactionsRepository;
