const IStupidPlayer = require('./interfaces/i-stupid-player');
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
			 * @type {string}
			 * @private
			 */
			this._uri = null;

			/**
			 * @type {StupidPlayer.State}
			 * @private
			 */
			this._state = StupidPlayer.State.STOP;

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
			this._uri = uri;
			this._deinit();
			this._state = StupidPlayer.State.PLAY;
			this._emit(this.EVENT_PLAY, this._isStream(uri));

			if (this._isStream(uri)) {
				return this._playStream(uri);
			} else {
				return this._playFile(uri);
			}
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
				this._deinit();
				this._state = StupidPlayer.State.STOP;
				this._emit(this.EVENT_STOP);
			}

			return Promise.resolve();
		}

		/**
		 * @return {?number}
		 */
		getVolume() {
			if (this._decoder) {
				return mpg123Util.getVolume(this._decoder.mh);
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
					mpg123Util.setVolume(this._decoder.mh, value);
					setTimeout(resolver, this.VOLUME_CHANGE_TIMEOUT);
				} else {
					reject(null);
				}
			});
		}

		/**
		 * @param {string} url
		 * @return {Promise.<Format>}
		 * @protected
		 */
		_playStream(url) {
			return this._request(url)
				.then((res) => {
					return this._makeDecoder(res);
				});
		}

		/**
		 * @param {string} path
		 * @return {Promise.<Format>}
		 * @protected
		 */
		_playFile(path) {
			return new Promise((resolve, reject) => {
				this._readStream = fs.createReadStream(path);

				this._readStream.on('error', this._onError);

				return this
					._makeDecoder(this._readStream)
					.then((format) => {
						resolve(format);
					});
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
		 * @param {string} url
		 * @return {Promise.<Response>}
		 * @protected
		 */
		_request(url) {
			return new Promise((resolve, reject) => {
				var request = url.indexOf('https') === 0 ? https : http;
				this._readStream = request.get(url, (res, req) => {
					if (url === this._uri) {
						resolve(res);
					} else {
						reject(null);
					}
				});
				this._readStream.on('error', this._onError);
			});
		}

		/**
		 * @param {Response|ReadStream} res
		 * @return {Promise.<Format>}
		 * @protected
		 */
		_makeDecoder(res) {
			this._decoder = new lame.Decoder();
			this._decoder.on('error', this._onError);
			return new Promise((resolve, reject) => {
				if (this._checkConnect(res, this._onError) && this._state === StupidPlayer.State.PLAY) {// todo need simple method
					res.pipe(this._decoder);

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
		 * @param res
		 * @return {boolean}
		 * @protected
		 */
		_checkConnect(res) {
			var isOk = res.statusCode === 200;
			var isAudio = (res.headers['content-type'].indexOf('audio/mpeg') !== -1);

			return isOk && isAudio;
		}

		/**
		 * @param {string} uri
		 * @return {boolean}
		 * @protected
		 */
		_isStream(uri) {
			return uri.indexOf('http') === 0 || uri.indexOf('https') === 0;
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
		_destroyConnection() {
			if (!this._decoder) {
				this._readStream.on('error', function() {});// For catch error closing not oppened socket
			}
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

