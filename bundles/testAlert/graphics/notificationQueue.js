var notifications;
var queue = function Queue(namespace){
	var innerQueue = [];

	function execute(action) {
		  if(namespace.showingAlert){
				return;
			}

			namespace.showingAlert = true;
			action.show().then(
													setTimeout(() => {
														 								action.hide().then(function(done) {
																							namespace.showingAlert = false;
																							setTimeout(namespace.dispatch, 2000);
																						})
																					}, action.showtime));

	}

	namespace.showingAlert = false;

	// Tries to execute event if not possible queues it
	// Returns: true event can execute imediatly, false it was queue and should execute.
	namespace.queue = function (action){
								if(namespace.showingAlert){
									console.log("queuing");
									innerQueue.unshift(action);
									return;
								}

								execute(action)
							}

	namespace.dispatch = function (){
								console.log("poping");
								var action = innerQueue.pop();
								if(action != null){
									console.log("dispaching popped");
									execute(action);
									return;
								}

								console.log("nothing popped");
							}

	return namespace;
}(notifications || {});
