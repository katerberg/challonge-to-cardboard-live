# Challonge to Cardboard Live

This is a node layer to allow you to run a tournament using Challonge and have it be visible in the Cardboard Live overlay on Twitch

### Running Once

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


### Running on a timer

Usually when running a tournament, you will want to ensure that your results are showing regularly without having to rerun the script.
To make this happen, you will need to have a timer that runs this script regularly. Adding the following your `crontab` will do so on Linux systems.

```
*/10 * * * * /Users/mark.katerberg/src/challonge-to-cardboard-live/cronstart.sh >> /Users/mark.katerberg/cc.log 2>&1
```

Since this will write your standings file as well as your creds to wherever the script is run from, you may need to create a `~/creds` folder.
