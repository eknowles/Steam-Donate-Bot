# Welcome to Steam Donate Bot.
Built with Node.js to interface with Steam.

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



![CS:GO Case](http://cdn.steamcommunity.com/economy/image/IoCCzrHasVcgweSG31itpprMSH_1qr8X9A83nDu-5QHri7U16Mb3RYAY-Hj5OPEogssTOPy1vxPyBDCOOqjyC-TJsj_-0-pOu1X6ZPFkvzuA2UhqkPPxFucOAcw7_6IHvd72Pq-TsELQAq12pSegbJGBCz_6svMc814_niepqQDrg_RiqY31ToM=/62fx62f)![CS:GO Case](http://cdn.steamcommunity.com/economy/image/IoCCzrHasVcgweSG31itpprMSH_1qr8X9A83nDu-5QHri7U16Mb3RYAY-Hj5OPEogssTOPy1vxPyBDCOOqjyC-TJsj_-0-pOu1X6ZPFkvzuA2UhqkPPxFucOAcw7_6IHvd72Pq-TsELQAq12pSegbJGBCz_6svMc814_niepqQDrg_RiqY31ToM=/62fx62f)![CS:GO Case](http://cdn.steamcommunity.com/economy/image/IoCCzrHasVcgweSG31itpprMSH_1qr8X9A83nDu-5QHri7U16Mb3RYAY-Hj5OPEogssTOPy1vxPyBDCOOqjyC-TJsj_-0-pOu1X6ZPFkvzuA2UhqkPPxFucOAcw7_6IHvd72Pq-TsELQAq12pSegbJGBCz_6svMc814_niepqQDrg_RiqY31ToM=/62fx62f)![CS:GO Case](http://cdn.steamcommunity.com/economy/image/IoCCzrHasVcgweSG31itpprMSH_1qr8X9A83nDu-5QHri7U16Mb3RYAY-Hj5OPEogssTOPy1vxPyBDCOOqjyC-TJsj_-0-pOu1X6ZPFkvzuA2UhqkPPxFucOAcw7_6IHvd72Pq-TsELQAq12pSegbJGBCz_6svMc814_niepqQDrg_RiqY31ToM=/62fx62f)![CS:GO Case](http://cdn.steamcommunity.com/economy/image/IoCCzrHasVcgweSG31itpprMSH_1qr8X9A83nDu-5QHri7U16Mb3RYAY-Hj5OPEogssTOPy1vxPyBDCOOqjyC-TJsj_-0-pOu1X6ZPFkvzuA2UhqkPPxFucOAcw7_6IHvd72Pq-TsELQAq12pSegbJGBCz_6svMc814_niepqQDrg_RiqY31ToM=/62fx62f)![CS:GO Case](http://cdn.steamcommunity.com/economy/image/IoCCzrHasVcgweSG31itpprMSH_1qr8X9A83nDu-5QHri7U16Mb3RYAY-Hj5OPEogssTOPy1vxPyBDCOOqjyC-TJsj_-0-pOu1X6ZPFkvzuA2UhqkPPxFucOAcw7_6IHvd72Pq-TsELQAq12pSegbJGBCz_6svMc814_niepqQDrg_RiqY31ToM=/62fx62f)![CS:GO Case](http://cdn.steamcommunity.com/economy/image/IoCCzrHasVcgweSG31itpprMSH_1qr8X9A83nDu-5QHri7U16Mb3RYAY-Hj5OPEogssTOPy1vxPyBDCOOqjyC-TJsj_-0-pOu1X6ZPFkvzuA2UhqkPPxFucOAcw7_6IHvd72Pq-TsELQAq12pSegbJGBCz_6svMc814_niepqQDrg_RiqY31ToM=/62fx62f)![CS:GO Case](http://cdn.steamcommunity.com/economy/image/IoCCzrHasVcgweSG31itpprMSH_1qr8X9A83nDu-5QHri7U16Mb3RYAY-Hj5OPEogssTOPy1vxPyBDCOOqjyC-TJsj_-0-pOu1X6ZPFkvzuA2UhqkPPxFucOAcw7_6IHvd72Pq-TsELQAq12pSegbJGBCz_6svMc814_niepqQDrg_RiqY31ToM=/62fx62f)![CS:GO Case](http://cdn.steamcommunity.com/economy/image/IoCCzrHasVcgweSG31itpprMSH_1qr8X9A83nDu-5QHri7U16Mb3RYAY-Hj5OPEogssTOPy1vxPyBDCOOqjyC-TJsj_-0-pOu1X6ZPFkvzuA2UhqkPPxFucOAcw7_6IHvd72Pq-TsELQAq12pSegbJGBCz_6svMc814_niepqQDrg_RiqY31ToM=/62fx62f)

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
* child_process

## Take items by type
If you have items that you just will never use or be able to sell, you can donate them by adding the bot and giving it a command, the bot will check your inventory and make you an offer.

