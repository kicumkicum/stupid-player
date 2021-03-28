import {SReadStream} from "./router";
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

class SoundStream {
	private decoder: lame.Decoder | null = null;
	private speaker: Speaker | null = null;
	private mpg123Util: Mpg123Util = mpg123Util;
	private _stream: any;
	private _r: any;

	constructor() {
		this.onError = this.onError.bind(this);
        //
        // this.decoder.on('error', this.onError);
        // this.speaker.on('error', this.onError);
	}

	connect(readStream: SReadStream) {
		this.decoder = new lame.Decoder();
		this.speaker = new Speaker({});

		this.speaker.on('error', this.onError);
		this._r = readStream;

		this._stream = readStream.pipe(this.decoder);

		this._stream
			.pipe(this.speaker)
			.on('error', this.onError)
			.on('close', this.onDecoderClosed);

	}

	destroy() {
		if (this._stream) {
			this._stream.unpipe();
			this._stream = null;
		}

		if (this.decoder) {
			this.decoder.removeAllListeners('close');
			this.decoder.removeAllListeners('error');
			this.decoder.unpipe();
		}

		if (this.speaker) {
			const s = this.speaker;
			setImmediate(() => s.removeAllListeners('error'));
			this.speaker.close();
		}
	}

	pause() {
		this.decoder.unpipe();
	}

	resume() {
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
