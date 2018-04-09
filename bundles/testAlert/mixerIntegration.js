const Mixer = require('beam-client-node');
const app = require('express')();
const oauth2 = require('simple-oauth2')

const client = new Mixer.Client(new Mixer.DefaultRequestRunner());

module.exports = function(nodecg){
  let channelId;
  var regexLinks = new RegExp('<(?<url>[a-zA-Z0-9/&=?]*)>.*rel=\\"(?<relation>[a-zA-Z]*)\\"');

  var oauthClient = oauth2.create({
		client : {
			id: '3836da539dc25dc874a72078c178daa2b438975665fd6e14'
		},
		auth: {
		 tokenHost: 'https://mixer.com/',
		 tokenPath: '/api/v1/oauth/token',
		 authorizePath: '/oauth/authorize'
	 },
	 options: {
        useBasicAuthorizationHeader: false,
    }
	});

	const authorizationUri = oauthClient.authorizationCode.authorizeURL({
	  redirect_uri: 'http://localhost:9090/testAlert/callback',
	  scope: 'channel:analytics:self achievement:view:self',
	  state: '3(#0/!~',
	});

	app.get('/testAlert/testAuth', (req, res) => {
	  console.log(authorizationUri);
	  res.redirect(authorizationUri);
	});

	app.get('/testAlert/callback', async (req, res) => {
	  const code = req.query.code;
	  const options = {
			code: code,
			redirect_uri: 'http://localhost:9090/testAlert/callback'
	  };

	  try {
			console.log("getting token");

	    const result = await oauthClient.authorizationCode.getToken(options);

	    console.log('The resulting token: ', result);

	    const token = oauthClient.accessToken.create(result);

			client.use(new Mixer.OAuthProvider(client, {
		    tokens: {
		        access: token.token.access_token,
		        expires: Date.now() + (365 * 24 * 60 * 60 * 1000)
		    }
			}));

			client.request('GET', 'users/current')
			.then(response => {
			    console.log(response.body);
					return response;
			}).then(response =>{
				console.log(response.body);
        channelId = response.body.channel.id;
			})



	    return res.redirect("/dashboard")
	  } catch(error) {
	    console.error('Access Token Error', error.message);
	    return res.status(500).json('Authentication failed');
	  }
	});

  parsePagination = function(linkInfo){
    var links = linkInfo.split(',');

    forearch(link : links){
      var r = regexLinks.exec(link);
      console.log("Link parsed " + JSON.stringify(r));
    }
  }

  parseFollowers = function(response){
    var pagination = response.headers.link;
    var info = parsePagination(pagination);
  }

  this.followers = function(){
    if(channelId != null){
      client.request('GET', `channels/${channelId}/follow?limit=10&page=0`)
      .then(res => {
          const body = JSON.stringify(res);
          parseFollowers(res);

          console.log(`You have ${body} total viewers...`);
      });
    }
  }


	nodecg.mount(app);

  return this;
}
