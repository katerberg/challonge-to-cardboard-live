# Challonge to Cardboard Live

This is a node layer to allow you to run a tournament using Challonge and have it be visible in the Cardboard Live overlay on Twitch

### Running

Populate your creds folder with two files
```challonge.json
{
  "user": "YOUR_USER_NAME",
  "api_key": "API_KEY_FOR_CHALLONGE",
  "tournament": "CHALLONGE_TOURNAMENT_ID"
}
```

```cardboardLive.json
{
  "bearer_token": "BEARER_TOKEN_FROM_CARDBOARD_LIVE",
  "tournament": "CARDBOARD_LIVE_TOURNAMENT_ID"
}
```

```js
yarn
yarn start
```

