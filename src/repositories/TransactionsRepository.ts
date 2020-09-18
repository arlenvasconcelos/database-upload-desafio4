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
    const balance = (await this.find()).reduce(
      (acc, item) => {
        if (item.type === 'income') acc.income += Number(item.value);
        if (item.type === 'outcome') acc.outcome += Number(item.value);
        return acc;
      },
      {
        income: 0,
        outcome: 0,
        total: 0,
      },
    );

    balance.total = balance.income - balance.outcome;
    return balance;
  }

  public async checkIsPossibleOutcomeTransaction(
    value: number,
  ): Promise<boolean> {
    const balance = await this.getBalance();
    if (balance.total < value) return false;
    return true;
  }
}

export default TransactionsRepository;
