import path from 'path';
import multer from 'multer';
import crypto from 'crypto';

const tmpPath = path.resolve(__dirname, '..', '..', 'tmp');

export default {
  directory: tmpPath,
  storage: multer.diskStorage({
    destination: path.resolve(__dirname, '..', '..', 'tmp'),
    filename(request, file, callback) {
      const fileHash = crypto.randomBytes(10).toString('hex');

      const fileName = `${fileHash}-${file.originalname}`;

      return callback(null, fileName);
    },
  }),
};
