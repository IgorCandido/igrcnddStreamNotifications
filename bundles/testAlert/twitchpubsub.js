const ws = require('ws');

let pubsub
pubsub = function(namespace){

  namespace = function(url, channelId, accessToken, nodecg){
      let hearthbeatInterval;

      function handleReceive(message){
        var messageObject = JSON.parse(message);

        if(messageObject.type == "RECONNECT"){
          nodecg.log.info("RECONNECT")
          this.connect();
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

      function generateNonce(){
        return ""+ Math.floor(Math.random() * (9000 - 0 + 1)) + 0
      }

      this.connect = function() {
        websocket = new ws(url)

        that = this;

        websocket.on("open", function(){
          that.hearthbeatInterval = setInterval(() => {
                                                        that.sendMessage({"type": "PING"})
                                                      }, 10000)

          websocket.on("message", handleReceive)
          websocket.on("close", handleClose)
          that.onOpen();
        })
      }

      this.subscribe = function(type){
        let topic
        if(type == "bits"){
          topic = "channel-bits-events-v1."
        }

        if(type == "subs"){
          topic = "channel-subscribe-events-v1."
        }

        that.sendMessage({"type":"LISTEN","nonce": generateNonce(),"data":{"topics":[topic+channelId],"auth_token":accessToken}})
      }

      this.sendMessage = function(message, callback){
        websocket.send(JSON.stringify(message), callback)
      }

      // Handle a message to a topic
      this.onReceive = function(topic, type, message){}

      // Handle open of connection
      this.onOpen = function(){}

      // Handle close of connection
      this.onClose = function(code, reason) {}

      this.connect();
  }

  return namespace;

}(pubsub || {})

module.exports = pubsub
