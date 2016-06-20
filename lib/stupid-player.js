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
			this._onDecoderFormatted = this._onDecoderFormatted.bind(this);
			this._onError = this._onError.bind(this);
		}

		/**
		 * @override
		 */
		play(uri) {
			this._deinit();
			this._state = StupidPlayer.State.PLAY;
			this._emit(this.EVENT_PLAY);

			return this._router
				.route(uri)
				.then(this._makeDecoder.bind(this));
		}

		/**
		 * @override
		 */
		pause() {
			return Promise.resolve();
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
		 * @param {*} format
		 * @protected
		 */
		_play(format) {
			if (this._state === StupidPlayer.State.STOP) {
				return;
			}
			this._speaker = new Speaker(format);
			this._pipedDecoder = this._decoder.pipe(this._speaker);
			this._pipedDecoder.on('close', this._onDecoderClosed);
		}

		/**
		 * @param {Stream} readStream
		 * @return {Promise.<Format>}
		 * @protected
		 */
		_makeDecoder(readStream) {
			this._readStream = readStream;
			this._decoder = new lame.Decoder();

			this._decoder.on('error', this._onError);
			this._readStream.on('error', this._onError);

			return new Promise((resolve, reject) => {
				if (this._state === StupidPlayer.State.PLAY) {// todo need simple method
					this._readStream.pipe(this._decoder);

					this._decoder.on('format', (format) => {
						this._onDecoderFormatted(format);
						resolve(format);
					});

				} else {
					this.stop();
				}
			});
		}

		/**
		 * @protected
		 */
		_deinit() {
			this._closeConnection();
			if (this._speaker) {
				this._decoder.removeListener('error', this._onError);
				this._pipedDecoder.removeListener('close', this._onDecoderClosed);

				this._decoder.unpipe();
				this._speaker.end();

				this._speaker = null;
				this._decoder = null;
			}
		}

		/**
		 * @protected
		 */
		_closeConnection() {
			if (this._readStream) {
				this._readStream.removeListener('error', this._onError);
				this._destroyConnection();
				this._readStream = null;
			}
		}

		/**
		 * @protected
		 */
		_destroyConnection() {
			this._readStream.once('error', function() {});// For catch error closing not oppened socket
			this._readStream.destroy();
		}

		_emit(event, opt_data) {
			//console.log('stupid-player emit', event);
			this.emit(event, opt_data);
		}

		/**
		 * @param format
		 * @protected
		 */
		_onDecoderFormatted(format) {
			return this._play(format);
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
	};
})();

/**
 * @typedef {ClientRequest|ReadStream} StupidPlayer.ReadStream
 */

