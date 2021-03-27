import {SReadStream} from "./router";
import * as Speaker from 'speaker';
import * as lame from 'lame';
import * as mpg123Util from 'node-mpg123-util';

const VOLUME_CHANGE_TIMEOUT = 300;

interface Mpg123Util {
	getVolume(mh: Buffer): number;
	setVolume(mh: Buffer, volume: number);
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

	constructor() {
		this.onError = this.onError.bind(this);
        //
        // this.decoder.on('error', this.onError);
        // this.speaker.on('error', this.onError);
	}

	connect(readStream: SReadStream) {
		this.decoder = new lame.Decoder();
		this._stream = readStream.pipe(this.decoder);

		this.speaker = new Speaker({});
		this.speaker.on('error', this.onError);

		this._stream
			.pipe(this.speaker)
			.on('error', this.onError)
			.on('close', this.onDecoderClosed);

	}

	destroy() {
		console.log('SS:destroy')
		if (this.decoder) {
			this.decoder.removeAllListeners('close');
			this.decoder.removeAllListeners('error');
			this.decoder.unpipe();
		}

		if (this.speaker) {
			this.speaker.close();
			// this.speaker.removeAllListeners('error');
		}

		if (this._stream) {
			// this._stream.unpipe();
			this._stream = null;
		}
	}

	pause() {
		this.decoder.unpipe();
	}

	resume() {
		this.decoder.pipe(new Speaker({}));
	}

	getVolume(): number {
		return Math.floor(this.mpg123Util.getVolume(this.decoder.mh) * 100);
	}

	async setVolume(value: number): Promise<number> {
		this.mpg123Util.setVolume(this.decoder.mh, value / 100);
		await wait(VOLUME_CHANGE_TIMEOUT);

		return value;
	}

	private onError(err) {
		console.log('!!!!!!', err)
	}

	private onDecoderClosed() {}
}


export {SoundStream};
