import {EventEmitter} from 'events';
import {Router, SReadStream} from './router';
import {SoundStream} from "./sound-stream";

export enum State {
	PAUSE = 'pause',
	PLAY = 'play',
	STOP = 'stop',
}

export default class StupidPlayer extends EventEmitter {
	private offset: number = 0;
	private offsetInterval: (NodeJS.Timer|null) = null;
	private readStream: (SReadStream|null) = null;
	private state: State = State.STOP;
	private router: Router = new Router;
	private _speaker: SoundStream = new SoundStream();

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

			this._speaker.pause();
		}

		return Promise.resolve()
			.then(() => this._emit(this.EVENT_PAUSE));
	}

	resume(): Promise<void> {
		if (this.state === State.PAUSE) {
			this.state = State.PLAY;

			this._speaker.resume();
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

	getOffset(): number {
		return this.offset;
	}

	getVolume(): (number|null) {
		return this._speaker.getVolume();
	}

	async setVolume(value): Promise<void> {
		await this._speaker.setVolume(value);
	}

	getState(): State {
		return this.state;
	}

	private makeDecoder(readStream: SReadStream) {
		if (this.state === State.PLAY) {
			readStream.on('error', this.onError);
			readStream.on('close', this.onDecoderClosed);

			this.readStream = readStream;
			this._speaker.connect(readStream);
		} else {
			this.stop();
		}
	}

	private deinit() {
		console.log('deinit')
		this.state = State.STOP;

		if (this.readStream) {
			console.log('deinit::in::if::readStream')

			this.readStream.removeAllListeners('close');
			this.readStream.destroy();
			this.readStream.removeAllListeners('error');
			this.readStream = null;
		}

		this._speaker.destroy();
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
