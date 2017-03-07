module.exports = function(nodecg){
	const twitchApi = nodecg.extensions['lfg-twitchapi'];

	require("./backgroundTask.js")(nodecg, twitchApi);
}