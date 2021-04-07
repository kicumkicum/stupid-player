import fileRoute from './routes/file';
import httpRoute from './routes/http';
import torrentRoute from './routes/torrent';
import {Readable} from 'stream';

const Routes = [
	torrentRoute,
	fileRoute,
	httpRoute,
];

export const route = (uri: string): Promise<SReadStream> => {
	const route = Routes.filter((protocol) => {
		return protocol.test(uri);
	})[0];

	if (route) {
		return route.read(uri);
	} else {
		return Promise.reject('Uri is not supported');
	}
};

export interface IRoute {
	test: (string: string) => boolean;
	read: (string: string) => Promise<SReadStream>;
}

export interface SReadStream extends Readable {
	destroy(error?: Error): void;
}
