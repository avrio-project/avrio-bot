const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
var MongoClient = require('mongodb').MongoClient;
var url = process.env.MONGODB_URI;
function addUser(user) {
      MongoClient.connect(url, function(err, db) {
  	if (err) throw err;
  	var dbo = db.db("tipbot-balances");
  	var myobj = { name: `${user}`, address: "0x1234", balance: 102, locked: 0 };
        dbo.collection("users").insertOne(myobj, function(err, res) {
        if (err) throw err;
        console.log(`1 entry inserted: ${myobj}`);
        db.close();
      });
});
}
function getAddress(user) {
 MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("tipbot-balances");
      var query = { name: `${user}` };
      dbo.collection("users").find(query).toArray(function(err, result) {
        if (err) throw err;
        let address =  result[0]['address'];
        console.log(address);
        return address;

        db.close();
      });
    });
}
function trytip(amount, user) {
    return "ok";
}
function getBalance(user) {
    let bal = -1;
    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("tipbot-balances");
      var query = { name: `${user}` };
      dbo.collection("users").find(query).toArray(function(err, result) {
        if (err) throw err;
        console.log(result.length);
        if (result.length === 0) {
    	    bal = "null";
	}else {
	    console.log(`${result[0]['balance']}`);
            bal = result[0]['balance'];
        }
        db.close();
      });
    });
    return bal;
}
client.on("ready", () => {
  console.log("Bot Online");
});
 
client.on("message", (message) => {
const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();  
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
    if (message.author === message.mentions) {
        return message.reply("Nice try, but you cant tip your self!");
    }  
    const ammount = args[1];
    const taggedUser = message.mentions.users.first();
//	message.channel.send(`Tipped ${ammount} to user: ${taggedUser.username}`);
    const result = trytip(ammount, taggedUser);
    if (result === "ok") {
      const hash = "Err(None)";
      const balancenew = getBalance(message.author) - ammount;
      const sender = message.author;
      const balancenewrec = getBalance(taggedUser) + ammount;
      message.author.send(`Sent ${ammount} AIO to ${taggedUser}, new balance ${balancenew}`);
      taggedUser.send(`Recived ${ammount} AIO from ${sender}. Your new balance is ${balancenewrec}`);
      console.log(`User: ${message.author} sent tip to user: ${taggedUser}, ammount: ${ammount}, hash: ${hash}`);
      const embed = new Discord.RichEmbed()
      .setTitle("Sent a tip!")
      .setURL(`https://explore.avrio.network/src/transaction?h=${hash}`)
      .setColor("#80ff00")
      .setDescription(`Sent ${ammount} AIO to ${taggedUser}!`)
      .setFooter(`Transaction Hash: ${hash}`)
      .setTimestamp();
      message.channel.send({embed})
    }
  }
if (command === "balance") {
    const balance = getBalance(message.author);
    console.log(`balance: ${getBalance(message.author)}`);
    if(getBalance(message.author) === "null") {
         return message.reply("You havent registered yet! Register with ```+register```");
     }
     message.channel.send(`Your balance is ${balance} AIO`);
  }
if (command === "register") {
    addUser(message.author);
    const address = getAddress(message.author);
    return message.author.send(`Registered! Your deposit address is ${address}`);
}
if (command === "address") {
    //addUser(message.author);
    const address = getAddress(message.author);
    return message.author.send(`Your deposit address is ${address}`);
}
if (command === "tester") {
    if(args.len < 1) {
      message.reply("You need to provide at least one argument:");
      return message.channel.send("Usage: ```+tester leave, join or help```");
    } else {
      if (args[0] === "join") {
        var role = message.guild.roles.find(role => role.name === "Testers");
        message.member.addRole(role);
        message.reply("Welcome to the tester group! run ```+tester help``` to get help!");
       } else 
        {
          if(args[0] === "help") {
            return message.reply("To get started please check out the tasks in #avrio-bot-tasks, if you have any issues then please say so in #testers-help");
           }
          else 
          {
            if(args[0] === "leave") {
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
			.setColor(#ffffff)
			.setDescription("-- Wallet -- ```+tip @user amount``` - Tips user amount AIO ```+address``` -gets your avrio deposit address ```+balance``` - gets your current balance ```+register``` - creates your tip bot wallet -- Tester commands -- ```+tester join``` - joins the testing group ```+tester leave``` - leaves the tester group ```+tester help``` - displays help for tester -- bot -- ```+poke``` - checks the bot is online")
			.setFooter("Coded by Leo Cornelius., ")
			.setImage("http://i.imgur.com/yVpymuV.png")
			.setTimestamp();
		message.channel.send({embed})
	}
// if you are trying to deploy your self comment out the following
client.login(process.env.DISCORD_BOT_TOKEN);
// and uncomment the following and set your token in config.json
// client.login(config.token);
