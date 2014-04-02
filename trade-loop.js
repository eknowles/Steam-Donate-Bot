var botuser = process.argv[2];
var otherid = process.argv[3];
var botfolder = 'bots/';
var fs = require('fs');
var steam = require('steam');
var SteamTrade = require('steam-trade');
var SteamTradeOffers = require('steam-tradeoffers');
var offers = new SteamTradeOffers();
var winston = require('winston');
var request = require('request');
var _ = require('underscore');
var spawn = require('child_process');
var serversFile = 'servers';
var secrets = require('./' + botfolder + botuser + '/' + botuser + '.secrets.js').secrets;
var sentryFile = botfolder + botuser + '/' + botuser + '.sentry';
var cookieFile = botfolder + botuser + '/' + botuser + '.cookies';
var webSessionId = null;
var cookies = null;
var waitingForTrade = false;
// Turn on timestamps
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {'timestamp': true});
// print process.argv
process.argv.forEach(function (val, index, array) {
    winston.info("Process Augment " + index + ': ' + val);
});
if (fs.existsSync(serversFile)) {
    steam.servers = JSON.parse(fs.readFileSync(serversFile));
} else {
    winston.warn("No servers file found, using defaults");
}
var sentry = undefined;
if (fs.existsSync(sentryFile)) {
    sentry = fs.readFileSync(sentryFile);
}
var bot = new steam.SteamClient();
winston.info("Logging into Steam");
bot.logOn({
    accountName  : secrets.username,
    password     : secrets.password,
    authCode     : secrets.guardCode,
    shaSentryfile: sentry
});
// Continuously try to connect if disconnected

setInterval(function () {
    if (!bot.loggedOn) {
        bot.logOn(secrets.username, secrets.password, sentry, secrets.guardCode);
    }
}, 60 * 1000);
bot.on('loggedOn', function () {
    winston.info("Logged on as " + secrets.username);
    winston.info("http://steamcommunity.com/id/" + secrets.profileId);
    bot.sendMessage(secrets.ownerId, 'I am online');
    bot.setPersonaState(steam.EPersonaState.Online);
    waitingForTrade = false;
    bot.addFriend(otherid);
});
bot.on('debug', console.log);
bot.on('error', function (error) {
    winston.error("Caught Steam error", error);
    canTrade = false;
});
bot.on('loggedOff', function () {
    winston.error("Logged off from Steam");
    canTrade = false;
});
bot.on('sentry', function (buffer) {
    winston.info("Sentry event fired");
    fs.writeFile(sentryFile, buffer);
});
bot.on('servers', function (servers) {
    fs.writeFile(serversFile, JSON.stringify(servers));
});
bot.on('friend', function (userId, relationship) {
    if (relationship === steam.EFriendRelationship.RequestInitiator) {
        winston.info("Friend event for " + userId + " type RequestInitiator [" + relationship + "]");
    }
    else if (relationship === steam.EFriendRelationship.Friend) {
        winston.info("Friend event for " + userId + " type Friend [" + relationship + "]");
    }
    else if (relationship === steam.EFriendRelationship.Ignored) {
        winston.info("Friend event for " + userId + " type Ignored [" + relationship + "]");
    }
    else if (relationship === steam.EFriendRelationship.RequestRecipient && !_.contains(secrets.blacklist, userId)) {
        bot.addFriend(userId);
    }
    else {
        winston.info("Friend event for " + userId + " type " + relationship);
    }
});
bot.on('friendMsg', function (userId, message, entryType) {
    if (entryType === steam.EChatEntryType.Typing) {
        winston.info("friendMsg (" + userId + ") is typing a message");
    }
    else if (entryType === steam.EChatEntryType.LeftConversation) {
        winston.info("friendMsg (" + userId + ") has left conversation");
    }
    else if (entryType === steam.EChatEntryType.ChatMsg) {
        winston.info("friendMsg (" + userId + ") MSG: " + message);
        if (userId === secrets.ownerId) {
            switch (message) {
                case 'export':
                    getInventoryHistory(false);
                    return;
                case 'unfriend':
                    removeAllFriends();
                    return;
                case 'friend':
                    addPendingFriends();
                    return;
                case 'remove':
                    winston.info("removing " + userId + " as a friend");
                    bot.removeFriend(userId);
                    return;
                case 'add':
                    winston.info("adding " + userId + " as a friend");
                    bot.addFriend(userId);
                    return;
                default:
                    return;
            }
        }
    }
    else {
        winston.info("friendMsg event by (" + userId + ") entryType " + entryType + " message " + message);
    }
});
bot.on('tradeProposed', function (tradeId, steamId) {
    winston.info("Trade from " + steamId + " proposed, ID " + tradeId);
    if (steamId === secrets.ownerId) {
        bot.respondToTrade(tradeId, true);
    }
    else {
        winston.info("Responding to trade");
        bot.respondToTrade(tradeId, false);
    }
});
bot.on('webSessionID', function (sessionId) {
    winston.info("Got webSessionID " + sessionId);
    webSessionId = sessionId;
    bot.webLogOn(function (newCookies) {
        winston.info("webLogOn returned " + newCookies);
        cookies = newCookies;
        storeCookieFile();
        canTrade = true;
        offers.setup(sessionId, newCookies);
        winston.info("cookies/session set up");
    });
});
bot.on('tradeOffers', function (number) {
    winston.info('Active trades: ' + number);
    if (number > 0) {
        offers.getOffers({get_received_offers: 1, active_only: 1, get_descriptions: 1}, function (error, body) {
            if (error) {
                console.log(error)
            } else {
                if (body.response.trade_offers_received) {
                    body.response.trade_offers_received.forEach(function (offer) {
                        if (offer.trade_offer_state == 2) {
                            if (offer.steamid_other == otherid) {
                                offers.acceptOffer(offer.tradeofferid, function () {
                                    winston.info('Trade offer from ' + offer.steamid_other + ' with ID=' + offer.tradeofferid + ' was accepted.');
                                    if (offer.message === 'return') {
                                        console.log(offer.items_to_recieve);
//                                        offers.makeOffer({
//                                            partnerSteamId: source,
//                                            itemsFromMe   : [
//                                                {   "appid"    : parseInt(Item.appid),
//                                                    "contextid": parseInt(Item.contextid),
//                                                    "amount"   : parseInt(Item.amount),
//                                                    "assetid"  : Item.id
//                                                }
//                                            ],
//                                            itemsFromThem : [],
//                                            message       : 'return'
//                                        }, function (error, object) {
//                                            if (error === null) {
//                                                winston.info("Trade offer send to  " + source + " Trade offer id: " + object.tradeofferid);
//                                            } else {
//                                                winston.info("Error in created trade offer: " + error);
//                                            }
//                                        });
                                    }
                                });
                            } else {
                                offers.declineOffer(offer.tradeofferid, function () {
                                    winston.info('Trade offer from ' + offer.steamid_other + ' with ID=' + offer.tradeofferid + ' was declined.');
                                });
                            }
                        }
                    });
                }
            }
        });
    }
});
function iteroffer(itemid){

    winston.info(itemid);
    offers.makeOffer({
        partnerSteamId: otherid,
        itemsFromMe   : [
            {   "appid"    : 730,
                "contextid": 2,
                "amount"   : 1,
                "assetid"  : '200556118'
            }
        ],
        itemsFromThem : [],
        message       : 'return'
    }, function (error, object) {
        if (error === null) {
            winston.info("Trade offer send to  " + otherid + " Trade offer id: " + object.tradeofferid);
        } else {
            winston.info("Error in created trade offer: " + error);
        }
    });
}
function giveContainers(source, appid, contextid) {
    offers.loadMyInventory(appid, contextid, function (error, items) {
        console.log('loadMyInventory');
        for (index in items) {
            var Item = items[index];
            if (Item.market_name === 'Sticker Capsule') {
                iteroffer(Item.id);
            }
        }
    });
}
setInterval(function () {
    giveContainers(otherid, 730, 2);
}, 10 * 1000);
function getmyitems(source, appid, contextid, callback) {
    var returnBotItems = [];
    var nonTradables = 0;
    var numItems = 0;
    offers.loadMyInventory(appid, contextid, function (error, items) {
        for (index in items) {
            var Item = items[index];
            if (Item.tradable === 0) {
                nonTradables += 1;
                continue
            } else {
                numItems += 1;
            }
            returnBotItems.push({
                "appid"    : parseInt(Item.appid),
                "contextid": parseInt(Item.contextid),
                "amount"   : parseInt(Item.amount),
                "assetid"  : Item.id
            });
        }
        if (nonTradables > 0) {
        }
        callback(source, returnBotItems, []);
    });
}
function makeOffer(source, botItemOffer, theirItemOffer, message) {
    winston.info('Started makeOffer');
    offers.makeOffer({
        partnerSteamId: source,
        itemsFromMe   : botItemOffer,
        itemsFromThem : theirItemOffer,
        message       : message
    }, function (error, object) {
        if (error === null) {
            winston.info("Trade offer send to  " + source + " Trade offer id: " + object.tradeofferid);
        } else {
            winston.info("Error in created trade offer: " + error);
        }
    });
}
var removeAllFriends = function () {
    _.each(bot.friends, function (relationship, friendId) {
        if (relationship === steam.EFriendRelationship.Friend && !_.contains(secrets.whitelist, friendId) && friendId !== secrets.ownerId) {
            winston.info("Removing friend with ID " + friendId);
            bot.removeFriend(friendId);
        }
    });
};
var addPendingFriends = function () {
    _.each(bot.friends, function (relationship, friendId) {
        if (relationship === steam.EFriendRelationship.RequestRecipient && !_.contains(secrets.blacklist, friendId)) {
            winston.info("Adding friend with ID " + friendId);
            bot.addFriend(friendId);
        }
    });
};
var splitCookie = function (cookieStr) {
    var index = cookieStr.indexOf("=");
    var name = cookieStr.substr(0, index);
    var value = cookieStr.substr(index + 1);
    return { name: name, value: value };
};
var cookieJar = function () {
    var jar = request.jar();
    _.each(cookies, function (cookieStr) {
        winston.info("adding cookie to jar", cookieStr);
        var reqCookie = request.cookie(cookieStr);
        jar.add(reqCookie);
    });
    return jar;
};
var findSteamIdInReportLink = function (reportLink) {
    var re = /javascript:ReportTradeScam\(\s*'(\d+)'/;
    var match = reportLink.match(re);
    return match && match.length > 0 ? match[1] : undefined;
};
var storeCookieFile = function () {
    var cookieStr = cookies.join('; ');
    fs.writeFile(cookieFile, cookieStr);
};
function oc(a) {
    var o = {};
    for (var i = 0; i < a.length; i++) {
        o[a[i]] = '';
    }
    return o;
}