import {Readable} from 'stream';
import {SReadStream} from './router';
//@ts-ignore
import Speaker from 'speaker';
//@ts-ignore
import * as lame from 'lame';
//@ts-ignore
import * as mpg123Util from 'node-mpg123-util';

const VOLUME_CHANGE_TIMEOUT = 300;

interface Mpg123Util {
	getVolume(mh: Buffer): number;
	setVolume(mh: Buffer, volume: number): void;
}

interface Decoder extends SReadStream {
	mh: Buffer;
}

const wait = (timeout: number): Promise<void> => {
	return new Promise((resolve) => setTimeout(resolve, timeout));
};

const createSpeaker = (onError: (err: string) => void): any => {
	const speaker = new Speaker({});

	speaker.on('error', onError);

	return speaker;
};

const destroySpeaker = (speaker: Speaker): void => {
	const noopErrorHandler = () => {};

	speaker.removeAllListeners('error');

	speaker.on('error', noopErrorHandler);
	speaker.close();

	setTimeout(() => speaker.removeListener('error', noopErrorHandler), 1000);
};

class SoundStream {
	private decoder: lame.Decoder = new lame.Decoder();
	private speaker: Speaker | null = null;
	private mpg123Util: Mpg123Util = mpg123Util;
	private readStream: Readable;

	constructor() {
		this.onError = this.onError.bind(this);

		this.decoder.on('close', this.onDecoderClosed);
        this.decoder.on('error', this.onError);
	}

	connect(readStream: SReadStream) {
		this.readStream = readStream;
		this.speaker = createSpeaker(this.onError);

		this.readStream
			.pipe(this.decoder)
			.pipe(this.speaker);
	}

	destroy() {
		if (this.readStream) {
			this.readStream.unpipe();
		}

		if (this.decoder) {
			this.decoder.removeAllListeners('close');
			this.decoder.removeAllListeners('error');
			this.decoder.unpipe();
		}

		if (this.speaker) {
			destroySpeaker(this.speaker);
			this.speaker = null;
		}
	}

	pause() {
		this.readStream.unpipe();
		this.decoder.unpipe();
		destroySpeaker(this.speaker);
	}

	resume() {
		this.speaker = createSpeaker(this.onError);

		this.readStream.pipe(this.decoder);
		this.decoder.pipe(this.speaker);
	}

	getVolume(): number {
		return Math.floor(this.mpg123Util.getVolume(this.decoder.mh) * 100);
	}

	async setVolume(value: number): Promise<number> {
		this.mpg123Util.setVolume(this.decoder.mh, value / 100);
		await wait(VOLUME_CHANGE_TIMEOUT);

		return value;
	}

	private onError(err: string) {
		console.log('!!!!!!', err)
	}

	private onDecoderClosed() {}
}


export {SoundStream};
