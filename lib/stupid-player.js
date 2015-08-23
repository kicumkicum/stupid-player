var events = require("events");
var fs = require('fs');
var http = require('http');
var https = require('https');
var util = require('util');

var Speaker = require('speaker');
var lame = require('lame');
var mpg123Util = require('node-mpg123-util');



/**
 * @param {string} urlOrPath
 * @constructor
 */
StupidPlayer = function(urlOrPath) {
	this._decoder = null;
	this._speaker = null;
	this._request = null;

	this._src = urlOrPath;

	this._onDecoderFormatted = this._onDecoderFormatted.bind(this);
	this._onDecoderClosed = this._onDecoderClosed.bind(this);

	this.play(urlOrPath);
};
util.inherits(StupidPlayer, events.EventEmitter);


/**
 * @param {string} uri
 */
StupidPlayer.prototype.play = function(uri) {
	if (this._isStream()) {
		this.playStream(uri);
	} else {
		this.playFile(uri);
	}
};


/**
 * @param {string} url
 */
StupidPlayer.prototype.playStream = function(url) {
	var request = url.indexOf('https') === 0 ? https : http;
	this._request = request.get(url, this._makeDecoder.bind(this));
	this._request.on('error', function(error) {
		this._emit('error', error);
	}.bind(this));
};


/**
 * @param {string} path
 */
StupidPlayer.prototype.playFile = function(path) {
	var readStream = fs.createReadStream(path);
	readStream.on('error', function(error) {
		this._emit('error', error);
	}.bind(this));
	this._makeDecoder(readStream);
};


/**
 *
 */
StupidPlayer.prototype.stop = function() {
	if (this._state !== this.state.STOP) {
		this._emit(this.EVENT_STOP);
		this._state = this.state.STOP;
		this.deinit();
	}
};


/**
 * @param {number} value 0..1
 */
StupidPlayer.prototype.setVolume = function(value) {
	if (this._decoder) {
		mpg123Util.setVolume(this._decoder.mh, value);
		this._emit(this.EVENT_VOLUME_CHANGE, value);
	}
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
	this.closeConnection();
	if (this._speaker instanceof Speaker) {
		this._decoder.removeListener('format', this._onDecoderFormatted);
		this._decoder.pipe(this._speaker).removeListener('close', this._onDecoderClosed);
		this._decoder.unpipe();
		this._speaker.end();
		this._speaker = null;
		// todo add this.decoder = null;
	}
};


/**
 * 
 */
StupidPlayer.prototype.closeConnection = function() {
	if (this._request) {
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
 * @protected
 */
StupidPlayer.prototype._makeDecoder = function(res) {
	if (!this._isStream() || this._checkConnect(res, function() {})) {
		this._decoder = new lame.Decoder();
		res.pipe(this._decoder);
		this._decoder.on('format', this._onDecoderFormatted);
		this._decoder.on('error', function(error) {
			this._emit(this.EVENT_ERROR, error);
		}.bind(this));
	} else {
		this._state = this.state.STOP;
		this._emit(this.EVENT_STOP);
	}
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
		this._decoder.pipe(this._speaker).on('close', this._onDecoderClosed);
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
	if (event === this.EVENT_ERROR) {
		if (this._request) {
			this._request = null;
		} else {
			return;
		}
	}

	this.emit(event, opt_data);
};


/**
 *
 * @protected
 */
StupidPlayer.prototype._onDecoderFormatted = function() {
	this._play();
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
 */
StupidPlayer.prototype._decoder;


/**
 *
 */
StupidPlayer.prototype._speaker;


/**
 * @type {string}
 */
StupidPlayer.prototype._src;


/**
 * @type {ClientRequest}
 */
StupidPlayer.prototype._request;


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
