'use strict';

const fs = require('fs');
const path = require('path');
const bower = require('bower');
const util = require('util');

module.exports = function (config, Logger) {
	const log = new Logger('bundle-manager/lib/bower_installer');

	return function (bundle) {
		return new Promise((resolve, reject) => {
			if ({}.hasOwnProperty.call(config, 'autodeps') ? !config.autodeps.bower : false) {
				log.trace('Skipping Bower dependencies install for bundle', bundle.name);
				process.nextTick(resolve);
				return;
			}

			// Do nothing if bower.json does not exist
			const packagejsonPath = path.join(bundle.dir, 'bower.json');
			if (!fs.existsSync(packagejsonPath)) {
				log.trace('No Bower dependencies to install for bundle', bundle.name);
				process.nextTick(resolve);
				return;
			}

			const installCmd = bower.commands.install(undefined, undefined, {cwd: bundle.dir});
			installCmd.on('end', () => {
				log.trace('Successfully installed Bower dependencies for bundle', bundle.name);
				resolve();
			});
			installCmd.on('error', /* istanbul ignore next */ error => {
				reject(new Error(
					util.format('[%s] Failed to install Bower dependencies:', bundle.name, error.message)
				));
			});
		});
	};
};
