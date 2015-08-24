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
 * @param {string} uri
 * @constructor
 */
StupidPlayer = function(uri) {
	this._decoder = null;
	this._speaker = null;
	this._request = null;

	this._src = uri;

	this._onDecoderFormatted = this._onDecoderFormatted.bind(this);
	this._onDecoderClosed = this._onDecoderClosed.bind(this);
	this._onError = this._onError.bind(this);
};
util.inherits(StupidPlayer, events.EventEmitter);


/**
 * @return {Promise.<Format>}
 */
StupidPlayer.prototype.play = function() {
	var uri = this._src;
	if (this._isStream()) {
		return this.playStream(uri);
	} else {
		return this.playFile(uri);
	}
};


/**
 * @param {string} url
 * @return {Promise.<Format>}
 */
StupidPlayer.prototype.playStream = function(url) {
	return new Promise(function(resolve, reject) {
		var request = url.indexOf('https') === 0 ? https : http;

		this._request = request.get(url, function(res, req) {
			this._makeDecoder(res)
				.then(function(format) {
					resolve(format);
				});
		}.bind(this));

		this._request.once('error', this._onError);
	}.bind(this));
};


/**
 * @param {string} path
 * @return {Promise.<Format>}
 */
StupidPlayer.prototype.playFile = function(path) {
	return new Promise(function(resolve, reject) {
		var readStream = fs.createReadStream(path);

		readStream.once('error', this._onError);

		return this
			._makeDecoder(readStream)
			.then(function(format) {
				resolve(format);
			});
	}.bind(this));
};


/**
 *
 */
StupidPlayer.prototype.stop = function() {
	if (this._state !== this.state.STOP) {
		this._state = this.state.STOP;
		this._emit(this.EVENT_STOP);
		this.deinit();
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
 * 
 */
StupidPlayer.prototype.deinit = function() {
	this._closeConnection();
	if (this._speaker) {
		this._decoder.removeListener('error', this._onError);

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
	if (this._request) {
		this._request.removeListener('error', this._onError);
		this._request.destroy();
		this._request = null;
	}
};


/**
 * 
 * @return {boolean}
 * @protected
 */
StupidPlayer.prototype._isStream = function() {
	var src = this._src;
	return src.indexOf('http') === 0 || src.indexOf('https') === 0;
};


/**
 * 
 * @param res
 * @return {Promise.<Format>}
 * @protected
 */
StupidPlayer.prototype._makeDecoder = function(res) {
	return new Promise(function(resolve, reject) {
		if (!this._isStream() || this._checkConnect(res, function() {})) {// todo need simple method
			this._decoder = new lame.Decoder();
			res.pipe(this._decoder);

			this._decoder.once('format', function(format) {
				this._onDecoderFormatted(format);
				resolve(format);
			}.bind(this));

			this._decoder.on('error', this._onError);

		} else {
			this._state = this.state.STOP;
			this._emit(this.EVENT_STOP);
		}
	}.bind(this));
};


/**
 * 
 * @param format
 * @protected
 */
StupidPlayer.prototype._play = function(format) {
	if (this._state !== this.state.STOP) {
		this._speaker = new Speaker(format);

		this._emit(this.EVENT_START, this._isStream());
		this._state = this.state.PLAY;

		this._pipedDecoder = this._decoder.pipe(this._speaker);
		this._pipedDecoder.once('close', this._onDecoderClosed);
	}
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
	if (!isOk) {
		callback(new Error('resource invalid'));
		return false;
	}
	if (!isAudio) {
		callback(new Error('resource type is unsupported'));
		return false;
	}
	return true;
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
	if (this._request) {
		this._request = null;
	} else {
		return;
	}
	this._emit(this.EVENT_ERROR, error);
};


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
StupidPlayer.prototype._src;


/**
 * @type {ClientRequest}
 */
StupidPlayer.prototype._request;


/**
 * @const {number}
 */
StupidPlayer.prototype.VOLUME_CHANGE_TIMEOUT = 300;


/**
 * @const {string}
 */
StupidPlayer.prototype.EVENT_START = 'start';


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
StupidPlayer.prototype.state = {
	PLAY: 'play',
	STOP: 'stop',
	PAUSE: 'pause'
};


module.exports = StupidPlayer;
