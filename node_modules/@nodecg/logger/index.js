'use strict';

const path = require('path');
const format = require('util').format;
const fs = require('fs.extra');
const winston = require('winston');

/**
 * Enum logging level values.
 * @enum {String}
 */
const ENUM_LEVELS = { // eslint-disable-line no-unused-vars
	trace: 'The highest level of logging, logs everything.',
	debug: 'Less spammy than trace, includes most info relevant for debugging.',
	info: 'The default logging level. Logs useful info, warnings, and errors.',
	warn: 'Only logs warnings and errors.',
	error: 'Only logs errors.'
};

/**
 * A factory that configures and returns a Logger constructor.
 * @param [initialOpts] {Object} - Configuration for the logger.
 *
 * @param [initialOpts.console] {Object} - Configuration for the console logging.
 * @param [initialOpts.console.enabled=false] {Boolean} - Whether to enable console logging.
 * @param [initialOpts.console.level="info"] {ENUM_LEVELS} - The level of logging to output to the console.
 *
 * @param [initialOpts.file] {Object} - Configuration for file logging.
 * @param initialOpts.file.path {String} - Where the log file should be saved.
 * @param [initialOpts.file.enabled=false] {Boolean} - Whether to enable file logging.
 * @param [initialOpts.file.level="info"] {ENUM_LEVELS} - The level of logging to output to file.
 *
 * @param [initialOpts.replicants=false] {Boolean} - Whether to enable logging specifically for the Replicants system.
 *
 * @param [rollbar] {Object} - A pre-configured server-side Rollbar npm package instance.
 *
 * @returns {function} - A constructor used to create discrete logger instances.
 */
module.exports = function (initialOpts, rollbar) {
	initialOpts = initialOpts || {};
	initialOpts.console = initialOpts.console || {};
	initialOpts.file = initialOpts.file || {};
	initialOpts.file.path = initialOpts.file.path || 'logs/nodecg.log';

	const consoleTransport = new winston.transports.Console({
		name: 'nodecgConsole',
		prettyPrint: true,
		colorize: true,
		level: initialOpts.console.level || 'info',
		silent: !initialOpts.console.enabled,
		stderrLevels: ['warn', 'error']
	});

	const fileTransport = new winston.transports.File({
		name: 'nodecgFile',
		json: false,
		prettyPrint: true,
		filename: initialOpts.file.path,
		level: initialOpts.file.level || 'info',
		silent: !initialOpts.file.enabled
	});

	winston.addColors({
		trace: 'green',
		debug: 'cyan',
		info: 'white',
		warn: 'yellow',
		error: 'red'
	});

	const mainLogger = new (winston.Logger)({
		transports: [consoleTransport, fileTransport],
		levels: {
			trace: 4,
			debug: 3,
			info: 2,
			warn: 1,
			error: 0
		}
	});

	/**
	 * Constructs a new Logger instance that prefixes all output with the given name.
	 * @param name {String} - The label to prefix all output of this logger with.
	 * @returns {Object} - A Logger instance.
	 * @constructor
	 */
	class Logger {
		constructor(name) {
			this.name = name;
		}

		trace() {
			arguments[0] = '[' + this.name + '] ' + arguments[0];
			mainLogger.trace.apply(mainLogger, arguments);
		}

		debug() {
			arguments[0] = '[' + this.name + '] ' + arguments[0];
			mainLogger.debug.apply(mainLogger, arguments);
		}

		info() {
			arguments[0] = '[' + this.name + '] ' + arguments[0];
			mainLogger.info.apply(mainLogger, arguments);
		}

		warn() {
			arguments[0] = '[' + this.name + '] ' + arguments[0];
			mainLogger.warn.apply(mainLogger, arguments);
		}

		error() {
			arguments[0] = '[' + this.name + '] ' + arguments[0];
			mainLogger.error.apply(mainLogger, arguments);

			if (rollbar) {
				rollbar.reportMessage(format(...arguments), 'error');
			}
		}

		replicants() {
			if (!Logger._shouldLogReplicants) {
				return;
			}

			arguments[0] = '[' + this.name + '] ' + arguments[0];
			mainLogger.info.apply(mainLogger, arguments);
		}

		static globalReconfigure(opts) {
			_configure(opts);
		}
	}

	Logger._winston = mainLogger;

	// A messy bit of internal state used to determine if the special-case "replicants" logging level is active.
	Logger._shouldLogReplicants = Boolean(initialOpts.replicants);

	_configure(initialOpts);

	function _configure(opts) {
		// Initialize opts with empty objects, if nothing was provided.
		opts = opts || {};
		opts.console = opts.console || {};
		opts.file = opts.file || {};

		if (typeof opts.console.enabled !== 'undefined') {
			consoleTransport.silent = !opts.console.enabled;
		}

		if (typeof opts.console.level !== 'undefined') {
			consoleTransport.level = opts.console.level;
		}

		if (typeof opts.file.enabled !== 'undefined') {
			fileTransport.silent = !opts.file.enabled;
		}

		if (typeof opts.file.level !== 'undefined') {
			fileTransport.level = opts.file.level;
		}

		if (typeof opts.file.path !== 'undefined') {
			fileTransport.filename = opts.file.path;

			// Make logs folder if it does not exist.
			if (!fs.existsSync(path.dirname(opts.file.path))) {
				fs.mkdirpSync(path.dirname(opts.file.path));
			}
		}

		if (typeof opts.replicants !== 'undefined') {
			Logger._shouldLogReplicants = opts.replicants;
		}
	}

	return Logger;
};
