const events = require('events');



/**
 * @interface
 */
module.exports = (function() {
	'use strict';
	return class IStupidPlayer extends events.EventEmitter {
		constructor() {
			super();

			/**
			 * @const {string}
			 */
			this.EVENT_PLAY = 'play';

			/**
			 * @const {string}
			 */
			this.EVENT_STOP = 'stop';

			/**
			 * Fired with: {number} volume
			 * @const {string}
			 */
			this.EVENT_VOLUME_CHANGE = 'volume-change';

			/**
			 * Fired with: string
			 * @const {string}
			 */
			this.EVENT_ERROR = 'error';
		}

		/**
		 * @param {string} url
		 * @return {Promise<undefined>}
		 */
		play(url) {
			throw 'IStupidPlayer.play not implemented';
		}

		/**
		 * @return {Promise<undefined>}
		 */
		pause() {
			throw 'IStupidPlayer.pause not implemented';
		}

		/**
		 * @return {Promise<undefined>}
		 */
		stop() {
			throw 'IStupidPlayer.stop not implemented';
		}

		/**
		 * @return {number} 0..100
		 */
		getVolume() {
			throw 'IStupidPlayer.[[Get]]volume not implemented';
		}

		/**
		 * @param {number} value 0..100
		 */
		setVolume(value) {
			throw 'IStupidPlayer.[[Set]]volume not implemented';
		}

		/**
		 * @return {IStupidPlayer.State}
		 */
		get state() {
			throw 'IStupidPlayer.[[Get]]state not implemented';
		}

		/**
		 * @enum {string}
		 */
		static get State() {
			return {
				PAUSE: 'pause',
				PLAY: 'play',
				STOP: 'stop'
			};
		}
	};
})();
