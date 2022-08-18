import * as http from 'http';
import * as https from 'https';

export default {
	test: (uri: string): boolean => /^https*:\/\//.test(uri),

	read: (url: string): Promise<http.IncomingMessage> => {
		return new Promise((resolve, reject) => {
			const get = url.indexOf('https') === 0 ? https.get : http.get;

			let res_ = null;

			const onError = (err) => {
				if (res_) {
					res_.emit('error', err);
				}
			};

			const clientRequest = get(url, (res) => {
				const statusCode = res['statusCode'];
				const contentType = res['headers']['content-type'];

				if (statusCode === 200 && contentType.indexOf('audio/mpeg') > -1) {
					const onEnd = () => {
						clientRequest.off('error', onError);
						res.off('end', onEnd);
					};

					res.on('end', onEnd);
					res_ = res;

					resolve(res);
				} else {
					reject({
						statusCode: statusCode,
						contentType: contentType
					});
				}
			});

			clientRequest.on('error', onError);
		});
	},
};
