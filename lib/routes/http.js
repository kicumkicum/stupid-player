const http = require('http');
const https = require('https');


/**
 * @type {Route}
 */
module.exports = {
	regexp: /^https*:\/\//,

	read: function(url) {
		'use strict';

		return new Promise((resolve, reject) => {
			var request = url.indexOf('https') === 0 ? https : http;

			request.get(url, (res, req) => {
				const statusCode = res['statusCode'];
				const contentType = res['headers']['content-type'];

				if (statusCode === 200 && contentType.indexOf('audio/mpeg') > -1) {
					resolve(res);
				} else {
					reject({
						statusCode: statusCode,
						contentType: contentType
					});
				}
			});
		});
	}
};
