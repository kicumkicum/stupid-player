import * as events from 'events';

export interface IStupidPlayer extends events.EventEmitter {
	/**
	 * Fired with: {number} volume
	 */
	EVENT_VOLUME_CHANGE: string;

	/**
	 * Fired with: {string}
	 */
	EVENT_ERROR: string;

	EVENT_PLAY: string;
	EVENT_PAUSE: string;
	EVENT_STOP: string;

	play(url: string): Promise<undefined>;
	pause(): Promise<undefined>;
	resume(): Promise<undefined>;
	togglePause(): Promise<undefined>;
	stop(): Promise<undefined>;
	getVolume(): Promise<number>;
	setVolume(value: number): Promise<number>;
	getState(): State;
}

export enum State {
	PAUSE,
	PLAY,
	STOP
}
