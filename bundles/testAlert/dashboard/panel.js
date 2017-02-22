$( document ).ready(function() {
	$("#toggle").click(function(){
	nodecg.sendMessage("changeVisibility", false);
	});
});
