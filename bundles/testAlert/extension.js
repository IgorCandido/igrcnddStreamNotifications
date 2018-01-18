module.exports = function(nodecg){
	const twitchApi = nodecg.extensions['lfg-twitchapi'];

	// Start polling of followers list
	require("./backgroundTask.js")(nodecg, twitchApi);
}
