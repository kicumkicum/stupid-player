/**
 * @type {Array.<Route>}
 */
const routes = [
	require('./routes/file'),
	require('./routes/http')
];


/**
 * @type {Router}
 */
module.exports = (function() {
	'use strict';
	return class Router {
		/**
		 * @param {string} uri
		 * @return {Promise<ReadStream>}
		 */
		route(uri) {
			var route = routes.filter((protocol) => {
				return protocol.regexp.test(uri);
			})[0];

			if (route) {
				return route.read(uri);
			} else {
				return Promise.reject('Uri is not supported');
			}
		}

		/**
		 * @typedef {{
		 *     regexp: RegExp,
		 *     read: function(string): Promise<ReadStream>
		 * }}
		 */
		static Route() {}
	};
})();
