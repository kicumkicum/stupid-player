import * as torrentStream from 'torrent-stream';
import {Readable} from 'stream';


export default {
	regexp: /^magnet*:/,

	read(uri: string): Promise<FileStream> {
		return new Promise((resolve, reject) => {
			// TODO: Символ решетки не уникальный разделитель
			const [magnetUri, path] = uri.split('#');
			const engine: TorrentStream.TorrentEngine = torrentStream(magnetUri);

			engine.on('ready', () => {
				const files = engine.files;
				const file = files.filter((file) => file.path === path)[0];

				if (file) {
					resolve(file.createReadStream());
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
