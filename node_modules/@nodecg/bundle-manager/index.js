'use strict';

const path = require('path');
const EventEmitter = require('events').EventEmitter;
const fs = require('fs.extra');
const Promise = require('bluebird');
const semver = require('semver');
const chokidar = require('chokidar');
const parseBundle = require('nodecg-bundle-parser');

// Start up the watcher, but don't watch any files yet.
// We'll add the files we want to watch later, in the startWatching() method.
const watcher = chokidar.watch([
	'!**/*___jb_*___',        // Ignore temp files created by JetBrains IDEs
	'!**/node_modules/**',    // Ignore node_modules folders
	'!**/bower_components/**' // Ignore bower_components folders
], {
	ignored: /[/\\]\./,
	persistent: true,
	ignoreInitial: true,
	followSymlinks: true
});

const emitter = new EventEmitter();
const _bundles = [];
let log;
let _rootPath;
let _backoffTimer = null;
let _hasChanged = {};
let _initialized = false;
let bundlesPath;

module.exports = emitter;

/**
 * Constructs a bundle-manager.
 * @param rootPath {String} - The directory where NodeCG's "bundles" and "cfg" folders can be found.
 * @param nodecgVersion {String} - The value of "version" in NodeCG's package.json.
 * @param nodecgConfig {Object} - The global NodeCG config.
 * @param Logger {Function} - A preconfigured @nodecg/logger constructor.
 * @return {Object} - A bundle-manager instance.
 */
module.exports.init = function (rootPath, nodecgVersion, nodecgConfig, Logger) {
	if (_initialized) {
		throw new Error('Cannot initialize when already initialized');
	}

	_initialized = true;

	_rootPath = rootPath;
	log = new Logger('nodecg/lib/bundles');
	log.trace('Loading bundles');

	const installNpmDeps = require('./lib/npm_installer')(nodecgConfig, Logger);
	const installBowerDeps = require('./lib/bower_installer')(nodecgConfig, Logger);
	bundlesPath = path.join(rootPath, '/bundles');

	// Create the "bundles" dir if it does not exist.
	/* istanbul ignore if: We know this code works and testing it is tedious, so we don't bother to test it. */
	if (!fs.existsSync(bundlesPath)) {
		fs.mkdirpSync(bundlesPath);
	}

	/* istanbul ignore next */
	watcher.on('add', filePath => {
		const bundleName = _extractBundleName(filePath);

		// In theory, the bundle parser would have thrown an error long before this block would execute,
		// because in order for us to be adding a panel HTML file, that means that the file would have been missing,
		// which the parser does not allow and would throw an error for.
		// Just in case though, its here.
		if (_isPanelHTMLFile(bundleName, filePath)) {
			handleChange(bundleName);
		}
	});

	watcher.on('change', filePath => {
		const bundleName = _extractBundleName(filePath);

		if (_isManifest(bundleName, filePath)) {
			handleChange(bundleName);
		} else if (_isPanelHTMLFile(bundleName, filePath)) {
			handleChange(bundleName);
		}
	});

	watcher.on('unlink', filePath => {
		const bundleName = _extractBundleName(filePath);

		if (_isPanelHTMLFile(bundleName, filePath)) {
			// This will cause NodeCG to crash, because the parser will throw an error due to
			// a panel's HTML file no longer being present.
			handleChange(bundleName);
		} else if (_isManifest(bundleName, filePath)) {
			log.debug('Processing removed event for', bundleName);
			log.info('%s\'s package.json can no longer be found on disk, ' +
				'assuming the bundle has been deleted or moved', bundleName);
			module.exports.remove(bundleName);
			emitter.emit('bundleRemoved', bundleName);
		}
	});

	/* istanbul ignore next */
	watcher.on('error', error => {
		log.error(error.stack);
	});

	// Do an initial load of each bundle in the "bundles" folder.
	// During runtime, any changes to a bundle's "dashboard" folder will trigger a re-load of that bundle,
	// as will changes to its `package.json`.
	const bowerPromises = [];
	fs.readdirSync(bundlesPath).forEach(bundleFolderName => {
		const bundlePath = path.join(bundlesPath, bundleFolderName);
		if (!fs.statSync(bundlePath).isDirectory()) {
			return;
		}

		if (nodecgConfig && nodecgConfig.bundles && nodecgConfig.bundles.disabled.indexOf(bundleFolderName) > -1) {
			log.debug('Not loading bundle ' + bundleFolderName + ' as it is disabled in config');
			return;
		}

		// Parse each bundle and push the result onto the _bundles array
		let bundle;
		const bundleCfgPath = path.join(rootPath, '/cfg/', bundleFolderName + '.json');
		if (fs.existsSync(bundleCfgPath)) {
			bundle = parseBundle(bundlePath, bundleCfgPath);
		} else {
			bundle = parseBundle(bundlePath);
		}

		// Check if the bundle is compatible with this version of NodeCG
		if (!semver.satisfies(nodecgVersion, bundle.compatibleRange)) {
			log.error('%s requires NodeCG version %s, current version is %s',
				bundle.name, bundle.compatibleRange, nodecgVersion);
			return;
		}

		// This block can probably be removed in 0.8, but let's leave it for 0.7 just in case.
		/* istanbul ignore next: Given how strict nodecg-bundle-parser is,
		 it should not be possible for "bundle" to be undefined. */
		if (typeof bundle === 'undefined') {
			log.error('Could not load bundle in directory', bundleFolderName);
			return;
		}

		_bundles.push(bundle);

		if (bundle.dependencies && {}.hasOwnProperty.call(nodecgConfig, 'autodeps') ? nodecgConfig.autodeps.npm : true) {
			installNpmDeps(bundle);
		}

		const bowerPromise = installBowerDeps(bundle);
		bowerPromises.push(bowerPromise);
	});

	// Once all the bowerPromises have been resolved, start up the bundle watcher and emit "allLoaded"
	return Promise.all(bowerPromises)
		.then(() => {
			watcher.add([
				bundlesPath + '/**/dashboard/**', // Watch dashboard folders
				bundlesPath + '/**/package.json'  // Watch bundle package.json files
			]);
		})
		.catch(
			/* istanbul ignore next */
			err => {
				log.error(err.stack);
			}
		);
};

/**
 * Returns a shallow-cloned array of all currently active bundles.
 * @returns {Array.<Object>}
 */
module.exports.all = function () {
	return _bundles.slice(0);
};

/**
 * Returns the bundle with the given name. undefined if not found.
 * @param name {String} - The name of the bundle to find.
 * @returns {Object|undefined}
 */
module.exports.find = function (name) {
	const len = _bundles.length;
	for (let i = 0; i < len; i++) {
		if (_bundles[i].name === name) {
			return _bundles[i];
		}
	}
};

/**
 * Adds a bundle to the internal list, replacing any existing bundle with the same name.
 * @param bundle {Object}
 */
module.exports.add = function (bundle) {
	/* istanbul ignore if: Again, it shouldn't be possible for "bundle" to be undefined, but just in case... */
	if (!bundle) {
		return;
	}

	// remove any existing bundles with this name
	if (module.exports.find(bundle.name)) {
		module.exports.remove(bundle.name);
	}

	_bundles.push(bundle);
};

/**
 * Removes a bundle with the given name from the internal list. Does nothing if no match found.
 * @param bundleName {String}
 */
module.exports.remove = function (bundleName) {
	const len = _bundles.length;
	for (let i = 0; i < len; i++) {
		// TODO: this check shouldn't have to happen, idk why things in this array can sometimes be undefined
		if (!_bundles[i]) {
			continue;
		}

		if (_bundles[i].name === bundleName) {
			_bundles.splice(i, 1);
		}
	}
};

/**
 * Only used by tests.
 */
module.exports._stopWatching = function () {
	watcher.unwatch([
		bundlesPath + '/**/dashboard/**', // Unwatch dashboard folders
		bundlesPath + '/**/package.json'  // Unwatch bundle package.json files
	]);
};

/**
 * Emits a `bundleChanged` event for the given bundle.
 * @param bundleName {String}
 */
function handleChange(bundleName) {
	const bundle = module.exports.find(bundleName);

	/* istanbul ignore if: I don't think it's possible for "bundle" to be undefined here, but just in case... */
	if (!bundle) {
		return;
	}

	if (_backoffTimer) {
		log.debug('Backoff active, delaying processing of change detected in', bundleName);
		_hasChanged[bundleName] = true;
		resetBackoffTimer();
	} else {
		log.debug('Processing change event for', bundleName);
		resetBackoffTimer();

		let reparsedBundle;
		const bundleCfgPath = path.join(_rootPath, '/cfg/', bundleName + '.json');
		if (fs.existsSync(bundleCfgPath)) {
			reparsedBundle = parseBundle(bundle.dir, bundleCfgPath);
		} else {
			reparsedBundle = parseBundle(bundle.dir);
		}

		module.exports.add(reparsedBundle);
		emitter.emit('bundleChanged', reparsedBundle);
	}
}

/**
 * Resets the backoff timer used to avoid event thrashing when many files change rapidly.
 */
function resetBackoffTimer() {
	clearTimeout(_backoffTimer);
	_backoffTimer = setTimeout(() => {
		_backoffTimer = null;
		for (const bundleName in _hasChanged) {
			/* istanbul ignore if: Standard hasOwnProperty check, doesn't need to be tested */
			if (!{}.hasOwnProperty.call(_hasChanged, bundleName)) {
				continue;
			}

			log.debug('Backoff finished, emitting change event for', bundleName);
			handleChange(bundleName);
		}
		_hasChanged = {};
	}, 500);
}

/**
 * Returns the name of a bundle that owns a given path.
 * @param filePath {String} - The path of the file to extract a bundle name from.
 * @returns {String} - The name of the bundle that owns this path.
 * @private
 */
function _extractBundleName(filePath) {
	const parts = filePath.replace(bundlesPath, '').split(path.sep);
	return parts[1];
}

/**
 * Checks if a given path is a panel HTML file of a given bundle.
 * @param bundleName {String}
 * @param filePath {String}
 * @returns {Boolean}
 * @private
 */
function _isPanelHTMLFile(bundleName, filePath) {
	const bundle = module.exports.find(bundleName);
	if (bundle) {
		return bundle.dashboard.panels.some(panel => {
			return panel.path.endsWith(filePath);
		});
	}

	return false;
}

/**
 * Checks if a given path is the manifest file for a given bundle.
 * @param bundleName {String}
 * @param filePath {String}
 * @returns {Boolean}
 * @private
 */
function _isManifest(bundleName, filePath) {
	return path.dirname(filePath).endsWith(bundleName) && path.basename(filePath) === 'package.json';
}
