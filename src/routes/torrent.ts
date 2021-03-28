import torrentStream from 'torrent-stream';
import {Readable} from 'stream';
import {decode as decodeMagnetURI, Instance} from 'magnet-uri';
import combinedStream from 'combined-stream';
import TorrentFile = TorrentStream.TorrentFile;


export default {
	test(str: string): boolean {
		return decodeMagnetURI(str).hasOwnProperty('xt');
	},

	read(uri: string): Promise<FileStream> {
		return new Promise((resolve, reject) => {
			const decodedUri = decodeMagnetURI(uri) as Instance & {'x.filepath': string};
			const encodedFilePath = decodedUri['x.filepath'];

			let totalSize = 0;

			const filePath = decodeURI(encodedFilePath);
			const engine: TorrentStream.TorrentEngine = torrentStream(uri);

			engine.on('ready', () => {
				const files = engine.files;
				const stream = combinedStream.create();

				const append = (file: TorrentFile) => {
					stream.append(file.createReadStream());
					totalSize += file.length;
				};

				if (encodedFilePath) {
					const file = files.filter((file) => file.path === filePath)[0];
					append(file);
				} else {
					// TODO: Implement streaming multiple files
					// files
					// 	.filter((file) => file.name.match(/\.mp3$/))
					// 	.forEach((file) => append(file));
				}

				console.log(totalSize);

				if (totalSize) {
					resolve(stream as unknown as FileStream);
				} else {
				 	reject('File is not found');
				}
			});
		});
	}
}

export interface FileStream extends Readable {
	destroy(): void;
}
