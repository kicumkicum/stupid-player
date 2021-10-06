import * as fs from 'fs';
import {ReadStream} from 'fs';

export default {
	test: (uri: string): boolean => {
		if (process.platform === 'win32') {
			return /^[a-zA-Z]:\\[\\\S|*\S]?.*$/g.test(uri);
		}

		return /^\.|^\//.test(uri)
	},

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
