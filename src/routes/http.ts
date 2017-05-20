import * as http from 'http';
import * as https from 'https';


export default {
	regexp: /^https*:\/\//,

	read(url: string): Promise<http.IncomingMessage> {
		return new Promise((resolve, reject) => {
			const get = url.indexOf('https') === 0 ? https.get : http.get;

			// @ts-ignore
			get(url, (res) => {
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
}
