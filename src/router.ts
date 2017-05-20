import fileRoute from './routes/file';
import httpRoute from './routes/http';
import {Readable} from 'stream';

export class Router {
	private routes: IRoute[];

	constructor() {
		this.routes = [
			fileRoute,
			httpRoute
		];

	}

	route(uri: string): Promise<SReadStream> {
		const route = this.routes.filter((protocol) => {
			return protocol.regexp.test(uri);
		})[0];

		if (route) {
			return route.read(uri);
		} else {
			return Promise.reject('Uri is not supported');
		}
	}
}

export interface IRoute {
	regexp: RegExp;
	read: (string) => Promise<SReadStream>;
}

export interface SReadStream extends Readable {
	destroy(error?: Error): void;
}
