const ws = require('ws');

let pubsub
pubsub = function(namespace){

  namespace = function(url, channelId, accessToken, nodecg){
      let hearthbeatInterval;

      function handleReceive(message){
        var messageObject = JSON.parse(message);

        nodecg.log.info("Received: " + JSON.stringify(messageObject))

        if(messageObject.type == "PONG"){
          nodecg.log.info("PONG")
        }

        if(messageObject.type == "RECONNECT"){
          nodecg.log.info("RECONNECT")
        }

        if(messageObject.type == "MESSAGE"){
          let type
          var messageContent = JSON.parse(messageObject.data.message);

          if(messageObject.topic.indexOf('channel-bits') > 0){
            type = "bits"
          }

          if(messageObject.topic.indexOf('channel-subscribe')){
            type = "subs"
          }

          onReceive(messageObject.data.topic, type, messageContent)
        }
      }

      function handleClose(message){
        if(hearthbeatInterval != null){
          clearInterval(hearthbeatInterval);
        }

        that.onClose(message);
      }

      websocket = new ws(url)

      that = this;

      websocket.on("open", function(){
        that.hearthbeatInterval = setInterval(() => {
                                                      nodecg.log.info("pinging");
                                                      that.sendMessage({"type": "PING"})
                                                    }, 10000)

        websocket.on("message", handleReceive)
        websocket.on("close", handleClose)
        that.onOpen();
      })

      this.subscribe = function(type){
        let topic
        if(type == "bits"){
          topic = "channel-bits-events-v1."
        }

        if(type == "subs"){
          topic = "channel-subscribe-events-v1."
        }

        that.sendMessage({"type":"LISTEN","nonce": ""+ Math.floor(Math.random() * (9000 - 0 + 1)) + 0,"data":{"topics":[topic+channelId],"auth_token":accessToken}})
      }

      this.sendMessage = function(message, callback){
        nodecg.log.info("Sending: " + JSON.stringify(message))
        websocket.send(JSON.stringify(message), callback)
      }

      // Handle a message to a topic
      this.onReceive = function(topic, type, message){}

      // Handle open of connection
      this.onOpen = function(){}

      // Handle close of connection
      this.onClose = function(code, reason) {}
  }

  return namespace;

}(pubsub || {})

module.exports = pubsub
