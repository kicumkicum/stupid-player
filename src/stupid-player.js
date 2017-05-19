const IStupidPlayer = require('./interfaces/i-stupid-player');
const Router = require('./router');
const Speaker = require('speaker');
const events = require('events');
const fs = require('fs');
const http = require('http');
const https = require('https');
const lame = require('lame');
const mpg123Util = require('node-mpg123-util');
const util = require('util');



/**
 * @constructor
 * @implements {IStupidPlayer}
 */
module.exports = (function() {
	'use strict';
	return class StupidPlayer extends IStupidPlayer {
		constructor() {
			super();

			/**
			 * @type {Object}
			 * @private
			 */
			this._decoder = null;

			/**
			 * @type {Object}
			 * @private
			 */
			this._speaker = null;

			/**
			 * @type {number}
			 * @private
			 */
			this._offset = 0;

			/**
			 * @type {?number}
			 * @private
			 */
			this._offsetInterval = null;

			/**
			 * @type {StupidPlayer.ReadStream}
			 * @private
			 */
			this._readStream = null;

			/**
			 * @type {StupidPlayer.State}
			 * @private
			 */
			this._state = StupidPlayer.State.STOP;

			/**
			 * @type {Router}
			 */
			this._router = new Router;

			/**
			 * @const {number}
			 */
			this.VOLUME_CHANGE_TIMEOUT = 300;

			this._onDecoderClosed = this._onDecoderClosed.bind(this);
			this._onError = this._onError.bind(this);

			this.on(this.EVENT_PLAY, () => {
				this._offsetInterval = setInterval(() => {
					this._offset = this._offset + 100;
				}, 100);
			});

			this.on(this.EVENT_PAUSE, () => {
				if (this._offsetInterval !== null) {
					clearInterval(this._offsetInterval);
				}
				this._offsetInterval = null;
			});

			this.on(this.EVENT_STOP, () => {
				if (this._offsetInterval !== null) {
					clearInterval(this._offsetInterval);
				}
				this._offsetInterval = null;
				this._offset = 0;
			});
		}

		/**
		 * @override
		 */
		play(uri) {
			this._deinit();
			this._state = StupidPlayer.State.PLAY;

			// Only called on new playback
			this._offset = 0;

			this._emit(this.EVENT_PLAY);

			return this._router
				.route(uri)
				.then(this._makeDecoder.bind(this), this._onError);
		}

		/**
		 * @override
		 */
		pause() {
			if (this._state === StupidPlayer.State.PLAY) {
				this._state = StupidPlayer.State.PAUSE;
				this._pauseTimestamp = Date.now();
				if (this._decoder) {
					this._decoder.unpipe();
				}
			}

			return Promise.resolve()
				.then(() => {
					this._emit(this.EVENT_PAUSE)
				});
		}

		resume() {
			if (this._state === StupidPlayer.State.PAUSE) {
				this._state = StupidPlayer.State.PLAY;
				if (this._decoder) {
					this._decoder.pipe(new Speaker({}));
				}
			}

			return Promise.resolve()
				.then(() => {
					this._emit(this.EVENT_PLAY);
				});
		}

		togglePause() {
			if (this._state === StupidPlayer.State.PAUSE) {
				return this.resume();
			} else {
				return this.pause();
			}
		}

		/**
		 * @override
		 */
		stop() {
			if (this._state !== StupidPlayer.State.STOP) {
				this._state = StupidPlayer.State.STOP;
				this._deinit();
				this._emit(this.EVENT_STOP);
			}

			return Promise.resolve();
		}

		/**
		 * @return {?number}
		 */
		getVolume() {
			if (this._decoder) {
				return Math.floor(mpg123Util.getVolume(this._decoder.mh) * 100);
			} else {
				return null;
			}
		}

		/**
		 * @return {number}
		 */
		getOffset() {
			return this._offset;
		}

		/**
		 * @param {number} value
		 * @return {Promise<number>}
		 */
		setVolume(value) {
			return new Promise((resolve, reject) => {
				var resolver = () => {
					resolve(value);
					this._emit(this.EVENT_VOLUME_CHANGE, value);
				};

				if (this._decoder) {
					mpg123Util.setVolume(this._decoder.mh, value / 100);
					setTimeout(resolver, this.VOLUME_CHANGE_TIMEOUT);
				} else {
					reject(null);
				}
			});
		}

		/**
		 * @param {StupidPlayer.ReadStream} readStream
		 * @protected
		 */
		_makeDecoder(readStream) {
			if (this._state === StupidPlayer.State.PLAY) {
				readStream.on('error', this._onError);
				readStream.on('close', this._onDecoderClosed);

				this._readStream = readStream;
				this._decoder = readStream.pipe(new lame.Decoder);
				this._decoder
					.pipe(new Speaker({}))
					.on('error', this._onError)
					.on('close', this._onDecoderClosed);
			} else {
				this.stop();
			}
		}

		/**
		 * @protected
		 */
		_deinit() {
			if (this._readStream) {
				this._readStream.removeAllListeners('close');
				this._readStream.destroy();
				this._readStream.removeAllListeners('error');
				this._readStream = null;
			}

			if (this._decoder) {
				this._decoder.removeAllListeners('close');
				this._decoder.removeAllListeners('error');
				this._decoder.unpipe();
				this._decoder = null;
			}
		}

		_emit(event, opt_data) {
			//console.log('stupid-player emit', event);
			this.emit(event, opt_data);
		}

		/**
		 * @protected
		 */
		_onDecoderClosed() {
			return 	this.stop();
		}

		/**
		 * @param {string} error
		 * @protected
		 */
		_onError(error) {
			this._emit(this.EVENT_ERROR, error);
			return this._deinit();
		}

		/**
		 * @override
		 */
		get state() {
			return this._state;
		}

		/**
		 * @typedef {Stream}
		 */
		static ReadStream() {}
	};
})();
