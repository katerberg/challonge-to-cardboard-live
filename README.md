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
  "username": "CARDBOARD_LIVE_USERNAME",
  "password": "CARDBOARD_LIVE_PASSWORD",
  "tournament": "CARDBOARD_LIVE_TOURNAMENT_ID"
}
```

```js
yarn
yarn start
```

