var botuser = process.argv[2];
var botfolder = 'bots/';
var csgoid = '730';
var playThese = ['10', '570', '440'];
var fs = require('fs');
var crypto = require('crypto');
var steam = require('steam');
var SteamTrade = require('steam-trade');
var SteamTradeOffers = require('steam-tradeoffers');
var offers = new SteamTradeOffers();
var winston = require('winston');
var request = require('request');
var cheerio = require('cheerio');
var uuid = require('node-uuid');
var _ = require('underscore');
var spawn = require('child_process');
var serversFile = 'servers';
var secrets = require('./' + botfolder + botuser + '/' + botuser + '.secrets.js').secrets;
var sentryFile = botfolder + botuser + '/' + botuser + '.sentry';
var cookieFile = botfolder + botuser + '/' + botuser + '.cookies';
var webSessionId = null;
var cookies = null;
var canTrade = false;
var paused = false;
var autoFriendRemoveTimeout = 10 * 60 * 1000;
var helptext = 'Available Commands:'
var mycommands = [
    'Steam:',
    'take cards - Trading Cards',
    'take icons - Emoticons',
    'take backgrounds - Backgrounds',
    'take boosters - Booster Packs',
    ' ',
    'Counter-Strike: Global Offensive:',
    'take cases - Base Grade Containers',
    'take consumer - Consumer Grade Skins'
];
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
    canTrade = false;
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
bot.on('chatInvite', function (chatRoomID, chatRoomName, patronID) {
    winston.info(bot.users[patronID].playerName + ' invited bot to ' + chatRoomName + ' chat room');
    if (patronID !== secrets.ownerId) {
        bot.joinChat(chatRoomID); // autojoin on invite
    }
});
bot.on('chatMsg', function (clanId, message, entryType, chatterId) {
    winston.info('chatMsg event ' + entryType + ' for ' + chatterId + ' message ' + message);
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
        winston.info("Added " + userId + " as a friend");
        bot.addFriend(userId);
        setTimeout(function () {
            bot.sendMessage(userId, "Thanks for adding me! Enter a command or make me a trade offer. Please make a donation within the next 5 minutes so I can keep my friend list down.");
            sendHelp(userId);
        }, 1000);

        setTimeout(function () {
            bot.sendMessage(userId, "If you would like to make a donation again in the future, just make me a trade request or add me to Steam friends!");
            bot.removeFriend(userId);
        }, autoFriendRemoveTimeout);

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
        if (message.indexOf('take ') === 0) {
            var requested = message.substring('take '.length);
            bot.sendMessage(userId, "Making a trade offer for you now...");
            scrap(userId, requested, makeOffer);
            return;
        }
        if (userId === secrets.ownerId) {
            if (message.indexOf('game ') === 0) {
                var gameId = message.substring('game '.length);
                bot.gamesPlayed([gameId]);
                winston.info("Admin requested bot joins game id " + gameId);
                return;
            }
            if (message.indexOf('give ') === 0) {
                var game = message.substring('game '.length);
                var appid = convertGameId(game)[0];
                var contextid = convertGameId(game)[1];
                bot.sendMessage(secrets.ownerId, "Making a trade offer for you now " + appid + ", " + contextid + "...");
                getmyitems(userId, appid, contextid, makeOffer);
                return;
            }
            if (message.indexOf('name ') === 0) {
                var name = message.substring('name '.length);
                bot.setPersonaName(name);
                winston.info("Changed name to " + name);
                return;
            }
            switch (message) {
                case 'pause':
                    paused = true;
                    bot.setPersonaState(steam.EPersonaState.Snooze);
                    winston.info("PAUSED");
                    return;
                case 'unpause':
                    paused = false;
                    bot.setPersonaState(steam.EPersonaState.LookingToTrade);
                    winston.info("UNPAUSED");
                    return;
                case 'export anon':
                    getInventoryHistory(true);
                    return;
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
                    sendHelp(userId);
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
bot.on('sessionStart', function (steamId) {
    winston.info("sessionStart " + steamId);
    if (!canTrade) {
        winston.info("Not ready to trade with " + steamId);
    } else {
        var steamTrade = new SteamTrade();
        steamTrade.sessionID = webSessionId;
        _.each(cookies, function (cookie) {
            winston.info("setting cookie " + cookie);
            steamTrade.setCookie(cookie);
        });
        steamTrade.open(steamId, function () {
            bot.sendMessage(secrets.ownerId, "Trade Session Opened with " + bot.users[steamId].playerName + ' [' + steamId + ']');
            winston.info("steamTrade opened with " + steamId);
            steamTrade.on('ready', function () {
                winston.info("User is ready to trade " + steamId);
                readyUp(steamTrade, steamId);
            });
            steamTrade.on('chatMsg', function (message) {
                if (steamId === secrets.ownerId) {
                    if (message === 'give') {
                        winston.warn("Admin requested all items from trade chat.");
                        steamTrade.chatMsg('Hi, I\'m just adding items now. Please wait...');
                        steamTrade.loadInventory('730', '2', function (items) {
                            itemsAvailable = items.length;
                            //                            console.log(items);
                            steamTrade.chatMsg('I have ' + itemsAvailable + ' items available for transfer.');
                            steamTrade.addItems(items);
                        });
                    } else {
                        winston.info("chatMsg from " + steamId, message);
                        if (message.indexOf('http://steamcommunity.com/id/' + secrets.profileId + '/inventory') !== 0) {
                            winston.info("Bad link");
                        }
                        else if (message === 'http://steamcommunity.com/id/' + secrets.profileId + '/inventory/') {
                            winston.info("Wrong link");
                        }
                        else {
                            parseInventoryLink(steamTrade, message, function (item) {
                                if (!item) {
                                    winston.info("No item returned");
                                    steamTrade.chatMsg(itemNotFoundMessage);
                                }
                                else {
                                    steamTrade.addItems([item], function (res) {
                                        if (!res || res.length < 1 || res[0].error) {
                                            steamTrade.chatMsg('I can\'t add that item');
                                        }
                                        else {
                                            steamTrade.chatMsg('Item Added');
                                        }
                                    });
                                }
                            });
                        }
                    }
                }
            });
            steamTrade.on('end', function (status, getItems) {
                winston.info("Trade ended with status " + status);
                if (status === 'timeout') {
                    bot.sendMessage(steamId, 'Oops, sorry ' + bot.users[steamId].playerName + ', trade has timed out. Try making a trade offer towards.');
                    bot.sendMessage(secrets.ownerId, "Trade TIMED with " + bot.users[steamId].playerName + " [" + steamId + "]");
                    //                    bot.trade(steamId);
                }
                if (status === 'cancelled') {
                    bot.sendMessage(steamId, 'It appears you cancelled the trade. If you change your mind just add me to Steam again :)');
                    bot.sendMessage(secrets.ownerId, "Trade CANCELLED with " + bot.users[steamId].playerName + " [" + steamId + "]");
                    //                    bot.removeFriend(steamId);
                }
                if (status == 'failed') {
                    bot.sendMessage(steamId, 'Oops, sorry ' + bot.users[steamId].playerName + ', trade has failed for some reason. Please try again later.');
                    bot.sendMessage(secrets.ownerId, "Trade FAILED with " + bot.users[steamId].playerName + " [" + steamId + "]")
                    //                    bot.trade(steamId);
                }
                if (status === 'complete') {
                    getItems(function (items) {
                        bot.sendMessage(steamId, 'Thanks ' + bot.users[steamId].playerName + ' for donating! You are awesome :squirtyay:');
                        //                        console.log(items);
                        for (item in items) {
                            console.log(items[item].name);
                            console.log(items[item]);
                            bot.sendMessage(secrets.ownerId, 'http://steamcommunity.com/id/loungecompanion/inventory#' + items[item].appid + '_' + items[item].contextid + '_' + items[item].id)
                        }
                        bot.sendMessage(secrets.ownerId, "Trade COMPLETE with " + bot.users[steamId].playerName + " [" + steamId + "]");
                        winston.info("Items received " + items);
                        //                        bot.removeFriend(steamId);
                    });
                }
                canTrade = true;
                //                bot.setPersonaState(steam.EPersonaState.LookingToTrade);
            });
        });
    }
});
bot.on('tradeOffers', function (number) {
    winston.info('tradeOffers hit with a code ' + number);
    if (number > 0) {
        offers.getOffers({get_received_offers: 1, active_only: 1, get_descriptions: 1}, function (error, body) {
            if (error) {
                console.log(error)
            } else {
                if (body.response.trade_offers_received) {
                    body.response.trade_offers_received.forEach(function (offer) {
                        if (offer.trade_offer_state == 2) {
                            if (offer.items_to_give) {
                                var itemCount = 0;
                                for (x in offer.items_to_give) {
                                    itemCount += 1;
                                }
                                if (offer.steamid_other == secrets.ownerId) {
                                    offers.acceptOffer(offer.tradeofferid, function () {
                                        winston.info('Trade offer from ' + offer.steamid_other + ' with ID=' + offer.tradeofferid + ' was accepted.');
                                        bot.sendMessage(secrets.ownerId, 'Trade offer from ' + offer.steamid_other + ' with ID=' + offer.tradeofferid + ' was accepted.');
                                    });
                                } else {
                                    offers.declineOffer(offer.tradeofferid, function () {
                                        winston.info('Trade offer from ' + offer.steamid_other + ' with ID=' + offer.tradeofferid + ' was declined.');
                                        bot.sendMessage(secrets.ownerId, 'User ' + offer.steamid_other + ' tried to steal ' + itemCount + ' items from my inventory');
                                        bot.sendMessage(offer.steamid_other, 'You tried to take ' + itemCount + ' items from my inventory. I only accept trades that give me items.');
                                    });
                                }
                            } else {
                                offers.acceptOffer(offer.tradeofferid, function () {
                                    winston.info('Trade offer from ' + offer.steamid_other + ' with ID=' + offer.tradeofferid + ' was accepted.');
                                    bot.sendMessage(secrets.ownerId, 'Trade offer from ' + offer.steamid_other + ' with ID=' + offer.tradeofferid + ' was accepted.');
                                    if (offer.message) {
                                        bot.sendMessage(secrets.ownerId, 'Message: ' + offer.message);
                                    }
                                    for (item in offer.items_to_receive) {
                                        bot.sendMessage(secrets.ownerId, "http://steamcommunity.com/id/" + secrets.profileId + "/inventory/#" + offer.items_to_receive[item].appid + "_" + offer.items_to_receive[item].contextid + "_" + offer.items_to_receive[item].assetid);
                                    }
                                });
                            }
                        }
                    });
                }
            }
        });
    }
});
function sendHelp(user) {
    bot.sendMessage(user, helptext);
    for (line in mycommands) {
        bot.sendMessage(user, mycommands[line]);
    }
}
function scrap(source, requested, callback) {
    var botin = [];
    var botout = [];
    var scrap = [];
    var filtertype = 1; // 1= .type 2= tags[2].name
    if (requested == 'cases') {
        appid = 730;
        contextid = 2;
        scrap.push('Base Grade Container');
        filtertype = 1;
    } else if (requested == 'consumer') {
        appid = 730;
        contextid = 2;
        scrap.push('Consumer Grade');
        filtertype = 3;
    } else if (requested == 'cards') {
        appid = 753;
        contextid = 6;
        scrap.push('Trading Card');
        filtertype = 2;
    } else if (requested == 'icons') {
        appid = 753;
        contextid = 6;
        scrap.push('Emoticon');
        filtertype = 2;
    } else if (requested == 'backgrounds') {
        appid = 753;
        contextid = 6;
        scrap.push('Profile Background');
        filtertype = 2;
    } else if (requested == 'boosters') {
        appid = 753;
        contextid = 6;
        scrap.push('Booster Pack');
        filtertype = 2;
    }
    offers.loadPartnerInventory(source, appid, contextid, function (error, items) {
        for (index in items) {
            if (filtertype == 1) {
                if (items[index].type in oc(scrap)) {
                    botin.push({
                        "appid"    : parseInt(items[index].appid),
                        "contextid": parseInt(items[index].contextid),
                        "amount"   : parseInt(items[index].amount),
                        "assetid"  : items[index].id
                    });
                }
            } else if (filtertype == 2) {
                if (items[index]['tags'][2].name in oc(scrap)) {
                    botin.push({
                        "appid"    : parseInt(items[index].appid),
                        "contextid": parseInt(items[index].contextid),
                        "amount"   : parseInt(items[index].amount),
                        "assetid"  : items[index].id
                    });
                }
            } else if (filtertype == 3) {
                if (items[index]['tags'][1].name in oc(scrap)) {
                    botin.push({
                        "appid"    : parseInt(items[index].appid),
                        "contextid": parseInt(items[index].contextid),
                        "amount"   : parseInt(items[index].amount),
                        "assetid"  : items[index].id
                    });
                }
            }
        }
        callback(source, botout, botin);
    });
}
function convertGameId(game) {
    switch (game) {
        case 'csgo':
            return [730, 2];
        case 'steam':
            return [753, 6];
        case 'tf2':
            return [440, 2];
        case 'dota2':
            return [570, 2];
    }
}
function getmyitems(source, appid, contextid, callback) {
    var returnBotItems = [];
    var nonefornow = [];
    var shitidontwant = [];
    offers.loadMyInventory(appid, contextid, function (error, items) {
        for (index in items) {
            if (items[index].type in oc(shitidontwant)) {
                // do nothing
            } else {
                returnBotItems.push({
                    "appid"    : parseInt(items[index].appid),
                    "contextid": parseInt(items[index].contextid),
                    "amount"   : parseInt(items[index].amount),
                    "assetid"  : items[index].id
                });
            }
        }
        callback(source, returnBotItems, nonefornow);
    });
}
function makeOffer(source, botItemOffer, theirItemOffer, message) {
    offers.makeOffer({
        partnerSteamId: source,
        itemsFromMe   : botItemOffer,
        itemsFromThem : theirItemOffer,
        message       : message
    }, function (error, object) {
        if (error === null) {
            winston.info("Trade offer send to  " + source + " Trade offer id: " + object.tradeofferid);
            bot.sendMessage(source, "I've sent you a trade offer with the item(s): https://steamcommunity.com/tradeoffer/" + object.tradeofferid + "/");
            bot.sendMessage(secrets.ownerId, object.tradeofferid + " Trade offer send to: " + bot.users[source].playerName);
        } else {
            winston.info("Error in created trade offer: " + error);
            bot.sendMessage(source, "Error in making trade offer: " + error);
        }
    });
}
var parseInventoryLink = function (steamTrade, message, callback) {
    var prefix = 'http://steamcommunity.com/id/' + secrets.profileId + '/inventory/#';
    if (message.indexOf(prefix) !== 0) {
        prefix = 'http://steamcommunity.com/id/' + secrets.profileId + '/inventory#';
    }
    if (message.indexOf(prefix) !== 0) {
        return callback();
    }
    else {
        var itemDetails = message.substring(prefix.length);
        winston.info("Parsed item details " + itemDetails);
        if (!itemDetails) {
            return callback();
        }
        var splitDetails = itemDetails.split("_");
        winston.info("Split item details", splitDetails);
        if (splitDetails.length !== 3) {
            return callback();
        }
        var appId = splitDetails[0];
        var contextId = splitDetails[1];
        steamTrade.loadInventory(appId, contextId, function (items) {
            if (!items) {
                return callback();
            }
            else {
                var result = null;
                _.each(items, function (item) {
                    if (item.id === splitDetails[2]) {
                        result = item;
                    }
                });
                return callback(result);
            }
        });
    }
};
var readyUp = function (steamTrade, steamId) {
    steamTrade.ready(function () {
        winston.info("Set my offerings as ready with " + steamId);
        steamTrade.confirm(function () {
            winston.info("Confirmed trade with " + steamId);
        });
    });
};
var getInventoryHistory = function (anonymous) {
    var jar = cookieJar();
    var results = [];
    requestHistoryPage(1, jar, results, function () {
        fs.writeFileSync(botuser + '.trades.csv', '"Trade ID","Date","Time",' + (anonymous ? "Encrypted User" : "User") + ',"Direction","Item"\n');
        _.each(results, function (historyItem) {
            winston.info("historyItem", historyItem);
            fs.appendFileSync(botuser + '.trades.csv', formatHistoryItem(historyItem, anonymous));
        });
    });
};
var formatHistoryItem = function (historyItem, anonymous) {
    var hmac = crypto.createHmac("sha1", secrets.hmacSecret);
    hmac.update(historyItem.user);
    encryptedUser = hmac.digest("hex");
    var row = '"' + historyItem.tradeId + '",';
    row += '"' + historyItem.date + '",';
    row += '"' + historyItem.time + '",';
    row += '"' + (anonymous ? encryptedUser : historyItem.user) + '",';
    row += '"' + historyItem.type + '",';
    row += '"' + historyItem.item + '"\n';
    return row;
};
var requestHistoryPage = function (pageNum, jar, results, callback) {
    var url = 'http://steamcommunity.com/id/' + secrets.profileId + '/inventoryhistory/?p=' + pageNum;
    winston.info("requesting page " + url);
    request({ url: url, jar: jar }, function (error, response, body) {
        if (error) {
            winston.error("request error", error);
        }
        else {
            $ = cheerio.load(body);
            var lastPage = true;
            $('.pagebtn').each(function (i, elem) {
                var $elem = $(elem);
                if ($elem.text() === '>' && !$elem.hasClass('disabled')) {
                    lastPage = false;
                }
            });
            $('.tradehistoryrow').each(function (i, elem) {
                winston.info("processing row");
                var date = $(elem).find('.tradehistory_date').text();
                var time = $(elem).find('.tradehistory_timestamp').text();
                var user = $(elem).find('.tradehistory_event_description a').attr('href');
                var tradeId = uuid.v4();
                $(elem).find('.tradehistory_items_received .history_item .history_item_name').each(function (i, itemElem) {
                    results.push({ tradeId: tradeId, date: date, time: time, user: user, type: 'Received', item: $(itemElem).text() });
                });
                $(elem).find('.tradehistory_items_given .history_item .history_item_name').each(function (i, itemElem) {
                    results.push({ tradeId: tradeId, date: date, time: time, user: user, type: 'Given', item: $(itemElem).text() });
                });
            });
            if (lastPage) {
                winston.info('got to last page');
                return callback();
            }
            else {
                requestHistoryPage(pageNum + 1, jar, results, callback);
            }
        }
    });
};
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