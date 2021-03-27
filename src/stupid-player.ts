import {EventEmitter} from 'events';
import {Router, SReadStream} from './router';
import * as Speaker from 'speaker';
import * as lame from 'lame';
import * as mpg123Util from 'node-mpg123-util';

export enum State {
	PAUSE = 'pause',
	PLAY = 'play',
	STOP = 'stop',
}

export default class StupidPlayer extends EventEmitter {
	private decoder: (Decoder|null) = null;
	private speaker: Speaker|null = null;
	private mpg123Util: Mpg123Util = mpg123Util;
	private offset: number = 0;
	private offsetInterval: (NodeJS.Timer|null) = null;
	private readStream: (SReadStream|null) = null;
	private state: State = State.STOP;
	private router: Router = new Router;

	private readonly VOLUME_CHANGE_TIMEOUT: number = 300;

	readonly EVENT_ERROR: string = 'event-error';
	readonly EVENT_PAUSE: string = 'event-pause';
	readonly EVENT_PLAY: string = 'event-play';
	readonly EVENT_STOP: string = 'event-stop';
	readonly EVENT_VOLUME_CHANGE: string = 'event-volume-change';

	constructor() {
		super();

		this.onDecoderClosed = this.onDecoderClosed.bind(this);
		this.onError = this.onError.bind(this);

		this.on(this.EVENT_PLAY, () => {
			this.offsetInterval = setInterval(() => {
				this.offset = this.offset + 100;
			}, 100);
		});

		this.on(this.EVENT_PAUSE, () => {
			if (this.offsetInterval !== null) {
				clearInterval(this.offsetInterval);
			}
			this.offsetInterval = null;
		});
	}

	play(uri): Promise<void> {
		this.deinit();
		this.state = State.PLAY;

		// Only called on new playback
		this.offset = 0;

		this._emit(this.EVENT_PLAY);

		return this.router
			.route(uri)
			.then((readStream) => this.makeDecoder(readStream), this.onError);
	}

	pause(): Promise<void> {
		if (this.state === State.PLAY) {
			this.state = State.PAUSE;

			if (this.decoder) {
				this.decoder.unpipe();
			}
		}

		return Promise.resolve()
			.then(() => this._emit(this.EVENT_PAUSE));
	}

	resume(): Promise<void> {
		if (this.state === State.PAUSE) {
			this.state = State.PLAY;
			if (this.decoder) {
				this.decoder.pipe(new Speaker({}));
			}
		}

		return Promise.resolve()
			.then(() => this._emit(this.EVENT_PLAY));
	}

	togglePause(): Promise<void> {
		if (this.state === State.PAUSE) {
			return this.resume();
		} else {
			return this.pause();
		}
	}

	stop(): Promise<void> {
		if (this.state !== State.STOP) {
			this.state = State.STOP;

			if (this.offsetInterval !== null) {
				clearInterval(this.offsetInterval);
				this.offsetInterval = null;
			}
			this.offset = 0;

			this.deinit();
			this._emit(this.EVENT_STOP);
		}

		return Promise.resolve();
	}
	
	getVolume(): (number|null) {
		if (this.decoder) {
			return Math.floor(this.mpg123Util.getVolume(this.decoder.mh) * 100);
		} else {
			return null;
		}
	}

	getOffset(): number {
		return this.offset;
	}
	
	setVolume(value): Promise<number> {
		return new Promise((resolve, reject) => {
			const resolver = () => {
				resolve(value);
				this._emit(this.EVENT_VOLUME_CHANGE, value);
			};

			if (this.decoder) {
				// TODO: перенести в свойство класса
				this.mpg123Util.setVolume(this.decoder.mh, value / 100);
				setTimeout(resolver, this.VOLUME_CHANGE_TIMEOUT);
			} else {
				reject(null);
			}
		});
	}

	getState(): State {
		return this.state;
	}

	private makeDecoder(readStream: SReadStream) {
		if (this.state === State.PLAY) {
			readStream.on('error', this.onError);
			readStream.on('close', this.onDecoderClosed);

			this.readStream = readStream;
			this.decoder = readStream.pipe(new lame.Decoder);
			this.speaker = new Speaker({});
			this.speaker.on('error', this.onError);

			this.decoder
				.pipe(this.speaker)
				.on('error', this.onError)
				.on('close', this.onDecoderClosed);
		} else {
			this.stop();
		}
	}

	private deinit() {
		this.state = State.STOP;

		if (this.speaker) {
			this.speaker.close();
			this.speaker.removeAllListeners('error');
			this.speaker = null;
		}

		if (this.readStream) {
			this.readStream.removeAllListeners('close');
			this.readStream.destroy();
			this.readStream.removeAllListeners('error');
			this.readStream = null;
		}

		if (this.decoder) {
			this.decoder.removeAllListeners('close');
			this.decoder.removeAllListeners('error');
			this.decoder.unpipe();
			this.decoder = null;
		}
	}

	private _emit(event: string, data?: any) {
		//console.log('stupid-player _emit', event);
		this.emit(event, data);
	}
	
	private onDecoderClosed() {
		return 	this.stop();
	}

	private onError(error: string): void {
		this._emit(this.EVENT_ERROR, error);

		if (this.state !== State.STOP) {
			this.deinit();
		}
	}
}


interface Mpg123Util {
	getVolume(mh: Buffer): number;
	setVolume(mh: Buffer, volume: number);
}

interface Decoder extends SReadStream {
	mh: Buffer;
}
