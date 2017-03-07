$( document ).ready(function() {

	$("#toggle").click(function(){

		nodecg.sendMessage("changeVisibility");

	});
});

var viewers = nodecg.Replicant('ChannelViewersTotal', {defaultValue: 0});

viewers.on('change', function(newValue, oldValue) {
	console.log("Viewers from " + oldValue + "to new value " + newValue);
    document.getElementById("viewers").textContent = newValue;
});