# Welcome to Steam Donation Bot.
Built with Node.js to interface with Steam.

Add my bot and give it a command!
http://steamcommunity.com/id/loungecompanion

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

## Admins
If you want the bot to give you it's inventory you make a simple request via Steam chat. Start with `give` followed by the inventory you want to receive. For example.

```give csgo```

Will make a trade request to you will all of it's items in csgo. So far I've enabled `csgo` `tf2` `steam` `dota2`

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

