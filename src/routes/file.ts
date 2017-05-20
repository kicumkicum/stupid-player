import * as fs from 'fs';
import {ReadStream} from 'fs';

export default {
	regexp: /^\.|^\//,

	read: function(path: string): Promise<ReadStream> {
		'use strict';

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
