'use strict';

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

module.exports = function (dashboardDir, bundle) {
	const panels = [];

	// If the dashboard folder exists but the nodecg.dashboardPanels property doesn't, throw an error.
	if (fs.existsSync(dashboardDir) && typeof bundle.dashboardPanels === 'undefined') {
		throw new Error(`${bundle.name} has a "dashboard" folder, ` +
			'but no "nodecg.dashboardPanels" property was found in its package.json');
	}

	// If nodecg.dashboardPanels exists but the dashboard folder doesn't, throw an error.
	if (!fs.existsSync(dashboardDir) && typeof bundle.dashboardPanels !== 'undefined') {
		throw new Error(`${bundle.name} has a "nodecg.dashboardPanels" property in its package.json, ` +
			'but no "dashboard" folder');
	}

	// If neither the folder nor the manifest exist, return an empty array.
	if (!fs.existsSync(dashboardDir) && typeof bundle.dashboardPanels === 'undefined') {
		return panels;
	}

	bundle.dashboardPanels.forEach((panel, index) => {
		const missingProps = [];
		if (typeof panel.name === 'undefined') {
			missingProps.push('name');
		}

		if (typeof panel.title === 'undefined') {
			missingProps.push('title');
		}

		if (typeof panel.file === 'undefined') {
			missingProps.push('file');
		}

		if (missingProps.length) {
			throw new Error(`Panel #${index} could not be parsed as it is missing the following properties: ` +
				`${missingProps.join(', ')}`);
		}

		// Check if this bundle already has a panel by this name
		const dupeFound = panels.some(p => p.name === panel.name);
		if (dupeFound) {
			throw new Error(`Panel #${index} (${panel.name}) has the same name as another panel in ${bundle.name}.`);
		}

		const filePath = path.join(dashboardDir, panel.file);

		// check that the panel file exists, throws error if it doesn't
		if (!fs.existsSync(filePath)) {
			throw new Error(`Panel file "${panel.file}" in bundle "${bundle.name}" does not exist.`);
		}

		const $ = cheerio.load(fs.readFileSync(filePath));

		// Check that the panel has a <head> tag, which we need to inject our scripts.
		if ($('head').length < 1) {
			throw new Error(`Panel "${path.basename(panel.file)}" in bundle "${bundle.name}" has no <head>, ` +
				'and therefore cannot have scripts injected. Add a <head> tag to it.');
		}

		// Check that the panel has a DOCTYPE
		const html = $.html();
		if (!html.match(/(<!doctype )/ig)) {
			throw new Error(`Panel "${path.basename(panel.file)}" in bundle "${bundle.name}" has no DOCTYPE,` +
				'panel resizing will not work. Add <!DOCTYPE html> to it.');
		}

		panel.path = filePath;
		panel.width = panel.width || 1;
		panel.dialog = Boolean(panel.dialog); // No undefined please
		panel.headerColor = panel.headerColor || '#9f9bbd';

		panel.html = $.html();

		panels.push(panel);
	});

	return panels;
};
