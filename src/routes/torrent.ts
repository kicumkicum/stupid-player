import * as torrentStream from 'torrent-stream';
import {Readable} from 'stream';
import {decode as decodeMagnetURI} from 'magnet-uri';


export default {
	test(str: string): boolean {
		return !!Object.keys(decodeMagnetURI(str)).length;
	},

	read(uri: string): Promise<FileStream> {
		return new Promise((resolve, reject) => {
			const decodedUri = decodeMagnetURI(uri);
			const encodedFilePath = decodedUri['x.filepath'];

			if (encodedFilePath) {
				const filePath = decodeURI(encodedFilePath);
				const engine: TorrentStream.TorrentEngine = torrentStream(uri);

				engine.on('ready', () => {
					const files = engine.files;
					const file = files
						.filter((file) => file.path === filePath)[0];

					if (file) {
						resolve(file.createReadStream());
					} else {
						reject('File is not found');
					}
				});
			} else {
				// TODO: Play all mp3 files
			}
		});
	}
}

export interface FileStream extends Readable {
	destroy(): void;
}
