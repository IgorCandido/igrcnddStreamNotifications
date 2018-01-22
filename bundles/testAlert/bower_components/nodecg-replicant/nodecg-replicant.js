/* eslint-env node */
/* eslint-disable accessor-pairs */
'use strict';

const clone = require('clone');

Polymer({
	is: 'nodecg-replicant',

	properties: {
		value: {
			type: Object,
			observer: '_exposedValueChanged',
			notify: true
		}
	},

	/**
	 * Fired when the value of the target replicant changes.
	 * @event change
	 */

	hostAttributes: {
		hidden: true
	},

	behaviors: [
		Polymer.NodeCGReplicantTargetingBehavior
	],

	_exposedValueChanged: function (newVal) {
		if (!this._ignoreExposedValueObserver && this.replicant) {
			this.replicant.value = newVal;
			return this.replicant.value;
		}
	},

	_replicantChanged: function (newVal, oldVal, operations) {
		const clonedNewVal = clone(newVal);
		this._ignoreExposedValueObserver = true;
		this.value = clonedNewVal;
		this._ignoreExposedValueObserver = false;
		this.fire('change', {
			newVal: clonedNewVal,
			oldVal: oldVal,
			operations: operations
		}, {bubbles: false});
	}
});
