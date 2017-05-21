import * as fs from 'fs';
import {ReadStream} from 'fs';

export default {
	test: (uri: string): boolean => /^\.|^\//.test(uri),

	read: (path: string): Promise<ReadStream> => {
		return new Promise((resolve, reject) => {
			let readStream = null;

			try {
				readStream = fs.createReadStream(path);
			} catch (e) {
				reject(e);
			}

			resolve(readStream);
		});
	}
};
