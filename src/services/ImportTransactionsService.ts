import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { getCustomRepository, In, getRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  csvPath: string;
}

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute({ csvPath }: Request): Promise<Transaction[]> {
    const csvFilePath = path.resolve(csvPath);
    const readCSVStream = fs.createReadStream(csvFilePath);

    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);
    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const allCategories: string[] = [];
    const allTransactions: CSVTransaction[] = [];

    parseCSV.on('data', line => {
      const [title, type, value, category] = line;

      allTransactions.push({
        title,
        type,
        category,
        value,
      });

      allCategories.push(category);
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const existingCategories = await categoriesRepository.find({
      where: {
        title: In(allCategories),
      },
    });

    const existingCategoriesTitle = existingCategories.map(
      category => category.title,
    );

    const categoriesToCreate = allCategories
      .filter(title => !existingCategoriesTitle.includes(title))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      categoriesToCreate.map(item => ({
        title: item,
      })),
    );

    await categoriesRepository.save(newCategories);

    const allPersistedCategories = [...existingCategories, ...newCategories];

    const newTransactions = transactionsRepository.create(
      allTransactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: allPersistedCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionsRepository.save(newTransactions);

    return newTransactions;
  }
}

export default ImportTransactionsService;
