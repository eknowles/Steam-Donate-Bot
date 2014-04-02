# Welcome to Steam Donation Bot.
Built with Node.js to interface with Steam.

Add my bot and give it a command!
http://steamcommunity.com/id/loungecompanion

http://i.gyazo.com/03c73a770b5f05fabac94692844fc3a6.png

## Commands
Add the bot and send it a message through Steam chat with the prefix `take` and it will build you a trade offer.

### Counter-Strike: Global Offensive
`take cases` - Sends a trade offer asking for all of your Base Grade Containers

`take consumer` - Sends a trade offer asking for all of your Consumer Grade skins (these are usually dropped during games and are of the lowest quality)

### Steam
`take cards` - Sends a trade offer asking for all of your Trading Cards

`take icons` - Sends a trade offer asking for all of your Emoticons

`take backgrounds` - Sends a trade offer asking for all of your Backgrounds

`take boosters` - Sends a trade offer asking for all of your Booster Packs

## Admin Commands
### Get Items
If you want the bot to give you it's inventory you make a simple request via Steam chat. Start with `give` followed by the inventory you want to receive. For example.

```give csgo```

Will make a trade request to you will all of it's items in csgo. So far I've enabled `csgo` `tf2` `steam` `dota2`

### Control
`add` - Bot will send you a friend request

`remove` - Bot will remove you from it's friend list

`game 730` - Bot will tell Steam its joined a game (replace 730 with whatever appid you want)

`give csgo` - Bot will send you a trade request of all its items in the game inventory

`pause` - Bot will set its status to Snooze

`unpause` - Bot will set its status to LookingToTrade

`export` - Bot will export a CSV file of its inventory history

`unfriend` - Bot will clean its friend list

`friend` - Bot will add any pending friend requests

`name BOT` - Bot will change its name to BOT (replace BOT with whatever name you want)


## Requirements
You will have to use `npm install` for most of these execpt for node-steam-tradeoffers.
* winston
* cheerio
* node-uuid
* underscore
* crypto
* steam
* steam-trade
* steam-trade-offers

### Take items by type
If you have items that you just will never use or be able to sell, you can donate them by adding the bot and giving it a command, the bot will check your inventory and make you an offer.

