const fs = require('fs');
const torrentStream = require('torrent-stream');


/**
 * @type {Route}
 */
module.exports = {
	regexp: /magnet:\?xt=urn:[a-z0-9]{20,50}/i,

	/**
	 * @param {string} path
	 * @return {Promise<ReadStream>}
	 */
	read: function(path) {
		'use strict';
		const engine = torrentStream(path);

		return new Promise((resolve, reject) => {
			try {
				engine.on('ready', function() {
					const file = engine.files[0];
					console.log(file.name);
					resolve(file.createReadStream());
				});
			} catch (e) {
				reject(e);
			}
		});
	}
};





