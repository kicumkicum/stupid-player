const fs = require('fs');


/**
 * @type {Route}
 */
module.exports = {
	regexp: /^\.|^\//,

	/**
	 * @param {string} path
	 * @return {Promise<ReadStream>}
	 */
	read: function(path) {
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
