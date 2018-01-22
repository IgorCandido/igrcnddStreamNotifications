'use strict';

/**
 * `Polymer.NodeCGReplicantTargetingBehavior` adds the `replicantName` and `replicantBundle` properties
 * to your element. `replicantBundle` is optional and defaults to the current bundle. Once both properties are
 * defined, the target replicant will become available as the `replicant` property.
 *
 * To listen to `change` events emitted by this replicant, add a method called `_replicantChanged` to your bundle.
 *
 *     _replicantChanged: function(oldVal, newVal, changes) {
 *          // do work...
 *     }
 *
 * The target replicant can be freely changed at any time.
 *
 * It is important to note that the replicant will not be declared until the element has been attached and the current
 * task has finished. This is to avoid two-way binding conflicts. For example, when binding to an `iron-input`
 * element, the `iron-input` will default to a `bind-value` of `""`, which will then be assigned to the Replicant.
 * @polymerBehavior
 */
Polymer.NodeCGReplicantTargetingBehavior = {

	/**
	 * Fired when a new replicant is targeted.
	 *
	 * @event retarget
	 */

	properties: {
		/**
		 * The name of the target replicant.
		 */
		replicantName: {
			type: String
		},

		/**
		 * The bundle namespace of the target replicant. If a NodeCG API context is available (`window.nodecg`),
		 * this defaults to the current bundle (`window.nodecg.bundleName`).
		 */
		replicantBundle: {
			type: String,
			value() {
				if (typeof window.nodecg === 'object') {
					return window.nodecg.bundleName;
				}
			}
		},

		/**
		 * The default value to provide to the replicant. Although this property is declared with a type of
		 * `Object`, this property can be of any type.
		 */
		replicantDefault: {
			type: Object
		}
	},

	get _hasChangeCallback() {
		return typeof this._replicantChanged === 'function';
	},

	observers: [
		'_targetChanged(replicantName, replicantBundle)'
	],

	attached() {
		this.async(function () {
			this._readyToDeclareReplicant = true;

			if (this.replicantName && this.replicantBundle) {
				this._declareReplicant(this.replicantName, this.replicantBundle);
			}
		});
	},

	_targetChanged(name, bundle) {
		// If there is an existing replicant, remove the event listener
		if (this.replicant && this._hasChangeCallback) {
			this.replicant.removeListener('change', this._replicantChanged);
		}

		this._declareReplicant(name, bundle);
	},

	_declareReplicant(name, bundle) {
		if (!this._readyToDeclareReplicant) {
			return;
		}

		if (this.replicantDefault) {
			this.replicant = NodeCG.Replicant(name, bundle, {defaultValue: this.replicantDefault});
		} else {
			this.replicant = NodeCG.Replicant(name, bundle);
		}

		if (this._hasChangeCallback) {
			this.replicant.on('change', this._replicantChanged.bind(this));
		}

		this.fire('retarget', {name, bundle}, {bubbles: false});
	}
};
