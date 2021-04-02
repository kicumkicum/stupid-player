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

//@ts-ignore
const createSound = (onError, onClose, readStream) => {
	const decoder = new lame.Decoder();
	const speaker = new Speaker({});

	decoder.on('close', onClose);
	decoder.on('error', onError);
	speaker.on('error', onError);

	readStream
		.pipe(decoder)
		.pipe(speaker);

	return {
		speaker,
		decoder,
	};
};
//@ts-ignore
const destroySound = (speaker, onError) => {
	const noopErrorHandler = () => {};

	speaker.removeListener('error', onError);

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
		this.onDecoderClosed = this.onDecoderClosed.bind(this);
	}

	pipe(readStream: Readable) {
		this.unpipe();

		const {decoder, speaker} = createSound(this.onError, this.onDecoderClosed, readStream);

		this.decoder = decoder;
		this.speaker = speaker;
		this.readStream = readStream;
	}

	unpipe() {
		if (this.readStream) {
			this.readStream.unpipe();
			this.readStream = null;
		}

		if (this.decoder) {
			this.decoder.unpipe();
			this.decoder.removeListener('error', this.onError);
			this.decoder.removeListener('close', this.onDecoderClosed);
			this.decoder = null;
		}

		if (this.speaker) {
			destroySound(this.speaker, this.onError);
			this.speaker = null;
		}
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
