const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
var MongoClient = require('mongodb').MongoClient;
var url = process.env.MONGODB_URI || "mongodb://localhost:27017/";

function addUser(user) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("tipbot-balances");
        var myobj = {
            name: `${user}`,
            address: "0x1234",
            balance: 10000,
            locked: 0
        };
        dbo.collection("users").insertOne(myobj, function(err, res) {
            if (err) throw err;
            console.log(`User ${user} registered.`);
            db.close();
        });
    });
}

function trytip(amount, reciver, sender) {
    return "0x1234567890";
}
client.on('ready', () => {
    client.user.setActivity(`Prefix: +, Serving ${client.guilds.size} servers`);
    console.log(`Bot Online and listening! Serving ${client.guilds.size} servers`);
});
client.on("guildCreate", guild => {
    // This event triggers when the bot joins a guild.
    console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
    client.user.setActivity(`Prefix: +, Serving ${client.guilds.size} servers`);
});

client.on("guildDelete", guild => {
    // this event triggers when the bot is removed from a guild.
    console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
    client.user.setActivity(`Prefix: +, Serving ${client.guilds.size} servers`);
});


client.on("message", (message) => {
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    if (!message.content.startsWith('+')) return
    const command = args.shift().toLowerCase();
    if (command === "ping") {
        const m = message.channel.send("Ping?");
        m.edit(`:ping_pong: Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
    }
    if (command === "poke") {
        message.channel.send("*slap*");
        console.log("User poked me!");
    }
    if (command === "tip") {
        if (!message.mentions.users.size) {
            return message.reply('you need to tag a user in order to tip them! ```+tip @user ammount```');
        }
        if (isNaN(args[1])) {
            const am = args[1];
            return message.reply(`${am} is not a valid ammount!`);
        }
        if (args[1] < (config.minimum_send / config.coin_units)) {
            const am = args[1];
            let min = config.minimum_send / config.coin_units;
            return message.reply(`Cannot tip less than ${min} AIO!`);
        }
        if (message.author.id === message.mentions.users.id) {
            return message.reply("You can't tip yourself.");
        }
        const ammount = args[1];
        const taggedUser = message.mentions.users.first();
        const result = trytip(ammount * config.coin_units, message.mentions.users.first(), message.author);
        if (result != "failed") {
            const hash = result;
            const sender = message.author;
            message.author.send(`Sent ${ammount} AIO to ${taggedUser}.`);
            taggedUser.send(`Recived ${ammount} AIO from ${sender}.`);
            console.log(`User: ${message.author} sent tip to user: ${taggedUser}, ammount: ${ammount}, hash: ${hash}`);
            const embed = new Discord.RichEmbed()
                .setTitle("Sent a tip!")
                .setURL(`https://explore.avrio.network/src/transaction?h=${hash}`)
                .setColor("#80ff00")
                .setDescription(`Sent ${ammount} AIO to ${taggedUser}!`)
                .setFooter(`Transaction Hash: ${hash}`)
                .setTimestamp();
            message.channel.send({
                embed
            })
        }
    }
    if (command === "balance") {
        MongoClient.connect(url).then(function(err, db) {
            if (err) {
                message.reply(`I am sorry, handling your request failed. Please try again. Error: ${JSON.stringify(err)}`);
                return console.log(`geting balance for user: ${message.author} gave error: ${JSON.stringify(err)} while connecting`);
            }
            var dbo = db.db("tipbot-balances");
            var query = {
                name: `${message.author}`
            };
            dbo.collection("users").findOne(query).then(function(err, result) {
                if (err) {
                    message.reply(`I am sorry, handling your request failed. Please try again. Error: ${JSON.stringify(err)}`);
                    return console.log(`getting balance for user: ${message.author} gave error: ${JSON.stringify(err)} while quering`);
                }
                console.log(result.length);
                if (result.length === 0) {
                    return message.reply("You haven't registered yet! Register with ```+register```");
                } else {
                    console.log(result);
                    let balance = result['balance'];
                    message.channel.send(`Your balance is ${balance} AIO`);
                }
                db.close();
            }).catch(function(err) {
                message.reply(`I am sorry, handling your request failed. Please try again. Error: ${JSON.stringify(err)}`);
                return console.log(`getting balance for user: ${message.author} gave error: ${JSON.stringify(err)} while quering`);
            });
        }).catch(function(err) {
            message.reply(`I am sorry, handling your request failed. Please try again. Error: ${JSON.stringify(err)}`);
            return console.log(`getting balance for user: ${message.author} gave error: ${JSON.stringify(err)} while connecting`);
        });
    }
    if (command === "register") {
        addUser(message.author.id);
        MongoClient.connect(url)
            .then(function(err, db) {
                if (err) {
                    message.reply(`I am sorry, handling your request failed. Please try again. Error: ${JSON.stringify(err)}`);
                    return console.log(`registering user: ${message.author} gave error: ${JSON.stringify(err)} while connecting`);
                }
                var dbo = db.db("tipbot-balances");
                var query = {
                    name: `${message.author}`
                };
                dbo.collection("users").findOne(query)
                    .then(function(err, result) {
                        if (err) {
                            message.reply(`I am sorry, handling your request failed. Please try again. Error: ${JSON.stringify(err)}`);
                            return console.log(`registering user: ${message.author} gave error: ${JSON.stringify(err)} while quering`);
                        };
                        let address = result['address'];
                        db.close();
                        return message.author.send(`Registered! Your deposit address is ${address}`);
                    }).catch(function(err) {
                        message.reply(`I am sorry, handling your request failed. Please try again. Error: ${JSON.stringify(err)}`);
                        return console.log(`registering user: ${message.author} gave error: ${JSON.stringify(err)} while quering`);
                    });
            }).catch(function(error) {
                message.reply(`I am sorry, handling your request failed. Please try again. Error: ${JSON.stringify(err)}`);
                return console.log(`registering user: ${message.author} gave error: ${JSON.stringify(err)} while connecting`);
            });
    }
    if (command === "address") {
        MongoClient.connect(url).then(function(err, db) {
            if (err) {
                message.reply(`I am sorry, handling your request failed. Please try again. Error: ${JSON.stringify(err)}`);
                return console.log(`getting address for user: ${message.author} gave error: ${JSON.stringify(err)} while connecting`);
            }
            var dbo = db.db("tipbot-balances");
            var query = {
                name: `${message.author}`
            };
            dbo.collection("users").findOne(query)
                .then(function(err, result) {
                    if (err) {
                        message.reply(`I am sorry, handling your request failed. Please try again. Error: ${JSON.stringify(err)}`);
                        return console.log(`getting address for user: ${message.author} gave error: ${JSON.stringify(err)} while quering`);
                    };
                    let address = result['address'];
                    db.close();
                    return message.channel.send(`Your deposit address is ${address}`);
                }).catch(function(err) {
                    message.reply(`I am sorry, handling your request failed. Please try again. Error: ${JSON.stringify(err)}`);
                    return console.log(`getting address for user: ${message.author} gave error: ${JSON.stringify(err)} while quering`);
                });
        }).catch(function(err) {
            message.reply(`I am sorry, handling your request failed. Please try again. Error: ${JSON.stringify(err)}`);
            return console.log(`getting address for user: ${message.author} gave error: ${JSON.stringify(err)} while connecting`);
        });
    }
    if (command === "invite") {
        return message.reply(`You can invite me to your discord server with ${config.invite_link}`);
    }
    if (command === "tester" && message.guild != null) { // do not allow dms
        if (args.len < 1) {
            message.reply("You need to provide at least one argument:");
            return message.channel.send("Usage: ```+tester leave, join or help```");
        } else {
            if (args[0] === "join") {
                var role = message.guild.roles.find(role => role.name === "Testers");
                message.member.addRole(role);
                message.reply("Welcome to the tester group! run ```+tester help``` to get help!");
            } else {
                if (args[0] === "help") {
                    return message.reply("To get started please check out the tasks in #avrio-bot-tasks, if you have any issues then please say so in #testers-help");
                } else {
                    if (args[0] === "leave") {
                        var role = message.guild.roles.find(role => role.name === "Testers");
                        message.member.removeRole(role);
                        return message.reply("We are sorry to see you go. If you change your mind you can rejoin with ```+tester join```");
                    } else {
                        message.reply("Sorry, i don't understand");
                        return message.channel.send("Usage: ```+tester leave, join or help```");
                    }
                }
            }
        }
    }
    if (command === "help") {
        const embed = new Discord.RichEmbed()
            .setTitle("Usage")
            .setColor("#ffffff")
            .setDescription("-- Wallet -- ```+tip @user amount``` - Tips user amount AIO ```+address``` -gets your avrio deposit address ```+balance``` - gets your current balance ```+register``` - creates your tip bot wallet -- Tester commands -- ```+tester join``` - joins the testing group ```+tester leave``` - leaves the tester group ```+tester help``` - displays help for tester -- bot -- ```+poke``` - checks the bot is online")
            .setFooter("Coded by Leo Cornelius., ")
            .setTimestamp();
        message.channel.send({
            embed
        })
    }
});
client.login(process.env.DISCORD_BOT_TOKEN || config.token);