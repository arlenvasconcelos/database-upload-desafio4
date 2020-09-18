import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import uploadConfig from '../config/upload';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from './CreateTransactionService';

interface Request {
  csvFilename: string;
}

class ImportTransactionsService {
  async execute({ csvFilename }: Request): Promise<Transaction[]> {
    const csvFilePath = path.resolve(uploadConfig.directory, csvFilename);
    const readCSVStream = fs.createReadStream(csvFilePath);

    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const createTransactionService = new CreateTransactionService();

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const lines: Array<[string, string, number, string]> = [];

    parseCSV.on('data', line => {
      lines.push(line);
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const transactions: Array<Transaction> = [];

    lines.forEach(async line => {
      const [title, type, value, category] = line;

      const transaction = await createTransactionService.execute({
        title,
        type,
        value,
        category,
      });

      transactions.push(transaction);
    });

    return transactions;
  }
}

export default ImportTransactionsService;
