const Mixer = require('beam-client-node');
const app = require('express')();
const oauth2 = require('simple-oauth2')

const client = new Mixer.Client(new Mixer.DefaultRequestRunner());

let nextFollow;

module.exports = function(nodecg){
  let channelId;
  nextFollow = nodecg.Replicant('mixerNextFollowrss');
  var regexLinks = new RegExp('</api/v[0-9]+/([a-zA-Z0-9/&=?]*)>.*rel=\"([a-zA-Z]*)\"');

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
        if(nextFollow.value == null){
          nextFollow.value = `channels/${channelId}/follow?limit=10&page=0`;
        }
			})



	    return res.redirect("/dashboard")
	  } catch(error) {
	    console.error('Access Token Error', error.message);
	    return res.status(500).json('Authentication failed');
	  }
	});

  parsePagination = function(linkInfo){
    var links = linkInfo.split(',');
    var parseLinks = []

    for(let i=0; i < links.length; ++i){
      var r = regexLinks.exec(links[i]);
      console.log("Link parsed " + JSON.stringify(r) + " match[0] " + r[0] + " match[1] " + r[1]+ " match[2] " + r[2]);
      parseLinks[i] = {url: r[1], relation: r[2]}
    }

    return parseLinks;
  }

  parseFollowers = function(response){
    var pagination = response.headers.link;
    var info = parsePagination(pagination);
    return {followers: response.body, pagination: info}
  }

  this.followers = function(){
    if(channelId != null){
      url = nextFollow.value
      console.log("next fetch url "+url)
      client.request('GET', url)
      .then(res => {
          const body = JSON.stringify(res);
          var followers = parseFollowers(res);

          console.log(`You have followers: ${JSON.stringify(followers.followers)} and pagination: ${JSON.stringify(followers.pagination)}`);
          nextFollow.value = followers.pagination.find((element) =>{
            return element.relation == "next";
          }).url;
          return followers;
      });
    }
  }


	nodecg.mount(app);

  return this;
}
