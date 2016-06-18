var events = require("events");
var fs = require('fs');
var http = require('http');
var https = require('https');
var util = require('util');

var Promise = require('promise');
var Speaker = require('speaker');
var lame = require('lame');
var mpg123Util = require('node-mpg123-util');



/**
 * @constructor
 */
var StupidPlayer = function(uri) {
	this._decoder = null;
	this._speaker = null;
	this._readStream = null;
	this._uri = null;

	this._state = StupidPlayer.State.STOP;

	this._onDecoderFormatted = this._onDecoderFormatted.bind(this);
	this._onDecoderClosed = this._onDecoderClosed.bind(this);
	this._onError = this._onError.bind(this);
};
util.inherits(StupidPlayer, events.EventEmitter);


/**
 * @param {string} uri
 * @return {Promise.<Format>}
 */
StupidPlayer.prototype.play = function(uri) {
	this._uri = uri;
	this._deinit();
	this._state = StupidPlayer.State.PLAY;
	this._emit(this.EVENT_PLAY, this._isStream(uri));

	if (this._isStream(uri)) {
		return this._playStream(uri);
	} else {
		return this._playFile(uri);
	}
};


/**
 *
 */
StupidPlayer.prototype.stop = function() {
	if (this._state !== StupidPlayer.State.STOP) {
		this._deinit();
		this._state = StupidPlayer.State.STOP;
		this._emit(this.EVENT_STOP);
	}
};


/**
 * @param {number} value 0..1
 * @return {Promise.<number>}
 */
StupidPlayer.prototype.setVolume = function(value) {
	return new Promise(function(resolve, reject) {
		var resolver = function() {
			resolve(value);
			this._emit(this.EVENT_VOLUME_CHANGE, value);
		}.bind(this);

		if (this._decoder) {
			mpg123Util.setVolume(this._decoder.mh, value);
			setTimeout(resolver, this.VOLUME_CHANGE_TIMEOUT);
		} else {
			reject(null);
		}
	}.bind(this));
};


/**
 * @return {?number} 0..1
 */
StupidPlayer.prototype.getVolume = function() {
	if (this._decoder) {
		return mpg123Util.getVolume(this._decoder.mh);
	} else {
		return null;
	}
};


/**
 * @return {StupidPlayer.State}
 */
StupidPlayer.prototype.getState = function() {
	return this._state;
};


/**
 * @param {string} url
 * @return {Promise.<Format>}
 * @protected
 */
StupidPlayer.prototype._playStream = function(url) {
	return this._request(url)
		.then(function(res) {
			return this._makeDecoder(res);
		}.bind(this));
};


/**
 * @param {string} url
 * @return {Promise.<Response>}
 * @protected
 */
StupidPlayer.prototype._request = function(url) {
	return new Promise(function(resolve, reject) {
		var request = url.indexOf('https') === 0 ? https : http;
		this._readStream = request.get(url, function(res, req) {
			if (url === this._uri) {
				resolve(res);
			} else {
				reject(null);
			}
		}.bind(this));
		this._readStream.on('error', this._onError);
	}.bind(this));
};


/**
 * @param {string} path
 * @return {Promise.<Format>}
 * @protected
 */
StupidPlayer.prototype._playFile = function(path) {
	return new Promise(function(resolve, reject) {
		this._readStream = fs.createReadStream(path);

		this._readStream.on('error', this._onError);

		return this
			._makeDecoder(readStream)
			.then(function(format) {
				resolve(format);
			});
	}.bind(this));
};


/**
 *
 * @param format
 * @protected
 */
StupidPlayer.prototype._play = function(format) {
	if (this._state === StupidPlayer.State.STOP) {
		return;
	}
	this._speaker = new Speaker(format);
	this._pipedDecoder = this._decoder.pipe(this._speaker);
	this._pipedDecoder.on('close', this._onDecoderClosed);
};


/**
 *
 * @param {Response|ReadStream} res
 * @return {Promise.<Format>}
 * @protected
 */
StupidPlayer.prototype._makeDecoder = function(res) {
	this._decoder = new lame.Decoder();
	this._decoder.on('error', this._onError);
	return new Promise(function(resolve, reject) {
		if (this._checkConnect(res, this._onError) && this._state === StupidPlayer.State.PLAY) {// todo need simple method
			res.pipe(this._decoder);

			this._decoder.on('format', function(format) {
				this._onDecoderFormatted(format);
				resolve(format);
			}.bind(this));

		} else {
			this.stop();
		}
	}.bind(this));
};


/**
 *
 * @param res
 * @param callback
 * @return {boolean}
 * @protected
 */
StupidPlayer.prototype._checkConnect = function(res, callback) {
	var isOk = res.statusCode === 200;
	var isAudio = (res.headers['content-type'].indexOf('audio/mpeg') !== -1);

	if (!isOk || !isAudio) {
		return false;
	}

	return true;
};


/**
 *
 * @param {string} uri
 * @return {boolean}
 * @protected
 */
StupidPlayer.prototype._isStream = function(uri) {
	return uri.indexOf('http') === 0 || uri.indexOf('https') === 0;
};


/**
 *
 * @protected
 */
StupidPlayer.prototype._deinit = function() {
	this._closeConnection();
	if (this._speaker) {
		this._decoder.removeListener('error', this._onError);
		this._pipedDecoder.removeListener('close', this._onDecoderClosed);

		this._decoder.unpipe();
		this._speaker.end();

		this._speaker = null;
		this._decoder = null;
	}
};


/**
 *
 * @protected
 */
StupidPlayer.prototype._closeConnection = function() {
	if (this._readStream) {
		this._readStream.removeListener('error', this._onError);
		this._destroyConnection();
		this._readStream = null;
	}
};


/**
 *
 * @protected
 */
StupidPlayer.prototype._destroyConnection = function() {
	if (!this._decoder) {
		this._readStream.on('error', function() {});// For catch error closing not oppened socket
	}
	this._readStream.destroy();
};


/**
 *
 * @param format
 * @protected
 */
StupidPlayer.prototype._onDecoderFormatted = function(format) {
	this._play(format);
};


/**
 *
 * @protected
 */
StupidPlayer.prototype._onDecoderClosed = function() {
	this.stop();
};


/**
 *
 * @param {string} error
 * @protected
 */
StupidPlayer.prototype._onError = function(error) {
	this._deinit();
	this._emit(this.EVENT_ERROR, error);
};


/**
 * @param {string} event
 * @param {*?} opt_data
 * @protected
 */
StupidPlayer.prototype._emit = function(event, opt_data) {
//	console.log('stupid-player emit', event);
	this.emit(event, opt_data);
};


/**
 * @type {StupidPlayer.State}
 */
StupidPlayer.prototype._state;


/**
 *
 */
StupidPlayer.prototype._decoder;


/**
 *
 */
StupidPlayer.prototype._speaker;


/**
 *
 */
StupidPlayer.prototype._pipedDecoder;


/**
 * @type {string}
 */
StupidPlayer.prototype._uri;


/**
 * @type {StupidPlayer.ReadStream}
 */
StupidPlayer.prototype._readStream;


/**
 * @const {number}
 */
StupidPlayer.prototype.VOLUME_CHANGE_TIMEOUT = 300;


/**
 * @const {string}
 */
StupidPlayer.prototype.EVENT_PLAY = 'play';


/**
 * @const {string}
 */
StupidPlayer.prototype.EVENT_STOP = 'stop';


/**
 * Fired with: {number} volume
 * @const {string}
 */
StupidPlayer.prototype.EVENT_VOLUME_CHANGE = 'volume-change';


/**
 * Fired with: string
 * @const {string}
 */
StupidPlayer.prototype.EVENT_ERROR = 'error';


/**
 * @enum {string}
 */
StupidPlayer.State = {
	PLAY: 'play',
	STOP: 'stop',
	PAUSE: 'pause'
};


/**
 * @type {ClientRequest|ReadStream}
 */
StupidPlayer.ReadStream;


module.exports = StupidPlayer;
