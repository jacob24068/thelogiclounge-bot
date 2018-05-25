const Discord = require("discord.js")
const client = new Discord.Client()
const config = require("./config.json")
const { Client } = require('pg');
const ms = require('ms')
const Meth = require('mathjs');

const pgClient = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

pgClient.connect();

let saveData = {}

pgClient.query(`SELECT * FROM userdata`, null, (err, res) => {
    if (!err) {
        saveData = JSON.parse(res.rows[0].info)
    }
  })

const save = function() {
  pgClient.query(`DELETE FROM userdata`, null, (err, res) => {
    if (err) {console.log(err.stack)}
  })
  pgClient.query(`INSERT INTO userdata(info) VALUES($1)`, [JSON.stringify(saveData)], (err, res) => {
    if (err) {console.log(err.stack)}
  })
}

let progress = 0
let log

client.on("ready", () => {
    console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`); 
    client.user.setPresence({ game: { name: '!help', type: 0 } });
    log = client.channels.get(`392027118055194636`)
  });

function sortByKey(jsObj){
  	var sortedArray = [];
  	for(var i in jsObj)
  	{
		sortedArray.push([i, jsObj[i]]);
	}
	return sortedArray.sort(function(a,b) {return Number(a)>Number(b)});
}

function ordinal_suffix_of(i) {
  var j = i % 10,
      k = i % 100;
  if (j == 1 && k != 11) {
      return i + "st";
  }
  if (j == 2 && k != 12) {
      return i + "nd";
  }
  if (j == 3 && k != 13) {
      return i + "rd";
  }
  return i + "th";
}

const mathparsestuff = [
    ["[+-]", "±"],
    ["[theta]", "θ"],
    ["[sqrt]", "√"],
    ["[sum]", "Σ"],
    ["[function]", "∫"],
    ["[propto]", "∝"],
    ["[infinity]", "∞"],
    ["[not equal to]", "≠"],
    ["[about equal]", "≈"],
    ["[congruent]", "≅"],
    ["[-+]", "∓"],
    ["[>=]", "≥"],
    ["[<=]", "≤"],
    ["[<<]", "≪"],
    ["[>>]", "≫"],
    ["[x]", "×"],
    ["[*]", "×"],
    ["[-]", "−"],
    ["[/]", "÷"],
    ["[deg]", "°"],
    ["[rightang]", "∟"],
    ["[perpindicular]", "⊥"],
    ["[parallel]", "| |"],
    ["[triangle]", "Δ"],
    ["[distance]", "|x-y|"],
    ["[pi]", "π"],
    ["[x]", "x"],
    ["[equivance]", "≡"],
    ["[equalbydefnition]", "≜"],
    ["[sigma]", "∑"],
    ["[goldenratio]", "φ"]
]

client.on("message", async message => {
    if (!message.guild) return
    if (message.channel.id == `392027118055194636`) return
    if(message.author.bot && message.content.match(`Welcome to TLL! We hope you enjoy your stay.`)) return
    if(message.author.bot) return

    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();


    if (!saveData[message.author.id]) {
      saveData[message.author.id] = 0
    }

    let userData = saveData[message.author.id];
    saveData[message.author.id] = userData + 1

    if (userData > 2000 && !message.member.roles.some(r=>["Regular Poster"].includes(r.name))){
      message.member.addRole(message.guild.roles.find('name', 'Regular Poster'))
    }

    progress++

    if (progress == 100) {
      save()
      progress = 1
    }

    if (command === "verify" && message.channel.id == `391409706477813771`) {
      log.send(`${message.author} has verified at ${Date()}`)
      message.reply(`Welcome to TLL! We hope you enjoy your stay.`)
      message.member.addRole(message.guild.roles.find("name", "Verified")).catch(console.error);
  }else if (message.channel.id == `391409706477813771`) return

    if(message.content.indexOf(config.prefix) !== 0) return;

    

    if(command === "kick") {
      if(!message.member.roles.some(r=>["Administrator", "Moderator"].includes(r.name)) )
        return message.reply("Sorry, you don't have permissions to use this!");
      
      let member = message.mentions.members.first();
      if(!member)
        return message.reply("Please mention a valid member of this server");
      if(!member.kickable) 
        return message.reply("I cannot kick this user! Do they have a higher role? Do I have kick permissions?");

      let reason = args.slice(1).join(' ');
      if(!reason)
        return message.reply("Please indicate a reason for the kick!");
      
      await member.kick(reason)
        .catch(error => message.reply(`Sorry ${message.author} I couldn't kick because of : ${error}`));
      message.reply(`${member.user.tag} has been kicked by ${message.author.tag} because: ${reason}`);
      log.send(`${member.user.tag} has been kicked by ${message.author.tag} because: ${reason} at ${Date()}`)
      // log.channel.send(`${message.author} has kicked ${member} for ${reason}`)
    }

    else if (command === "mute") {
      if(!message.member.roles.some(r=>["Administrator", "Moderator"].includes(r.name)) )
        return message.reply("Sorry, you don't have permissions to use this!");
      let muteRole = message.guild.roles.find('name', 'Muted')
      let member = message.mentions.members.first()
      if(!member)
      return message.reply("Please mention a valid member of this server");
      let time = args.slice(1).join(' ');
      if(!time)
        return message.reply("Please indicate a time for the mute!");
      member.addRole(muteRole.id)
     // log.channel.send(`${message.author} has muted ${member} for ${ms(ms(time), {long:true})}`)
      message.channel.send(`${member}, you have been muted for ${ms(ms(time), {long:true})}`)
      log.send(`${member} muted by ${message.author} for ${ms(ms(time), {long:true})} at ${Date()}`)
      setTimeout(function() {
        member.removeRole(muteRole.id)
        member.send(`You have been unmuted from The Logic Lounge.`)
      }, ms(time))

      
    }

    else if (command === "unmute") {
      if(!message.member.roles.some(r=>["Administrator", "Moderator"].includes(r.name)) )
        return message.reply("Sorry, you don't have permissions to use this!");
      let muteRole = message.guild.roles.find('name', 'Muted')
      let member = message.mentions.members.first()
      if(!member)
      return message.reply("Please mention a valid member of this server");
      
      member.removeRole(muteRole.id)

      log.send(`${member} unmuted by ${message.author} at ${Date()}`)
    }
    
    else if (command === "points") {
        let member = message.mentions.members.first()
        if (member) { message.channel.send(`${member.displayName} has ${saveData[member.id]} point${saveData[member.id] == 1 && "" || "s"}.`);
        }else{message.channel.send(`${message.member.displayName}, you have ${saveData[message.author.id]} point${saveData[message.author.id] == 1 && "" || "s"}.`);}

    }
    
    else if(command === "ban") {
      if(!message.member.roles.some(r=>["Administrator"].includes(r.name)) )
        return message.reply("Sorry, you don't have permissions to use this!");
      
      let member = message.mentions.members.first();
      if(!member)
        return message.reply("Please mention a valid member of this server");
      if(!member.bannable) 
        return message.reply("I cannot ban this user! Do they have a higher role? Do I have ban permissions?");
  
      let reason = args.slice(1).join(' ');
      if(!reason)
        return message.reply("Please indicate a reason for the ban!");
    // log.channel.send(`${message.author} has banned ${member} for ${reason}`)
      await member.ban(reason)
        .catch(error => message.reply(`Sorry ${message.author} I couldn't ban because of : ${error}`));
      message.reply(`${member.user.tag} has been banned by ${message.author.tag} because: ${reason}`);
      log.send(`${member.user} has been banned by ${message.author} because: ${reason} at ${Date()}`)
    } else if (command === "parsemath") {
        let newstring = message.content.substr(11)
        mathparsestuff.forEach(function(Item) {
            newstring.replace(Item[0], Item[1])
            console.log(Item[0])
            console.log(Item[1])
            console.log("--")
        })
        message.channel.send({
            "embed": {
              "title": "Math Parse­­­­",
              "color": Number("0x"+Math.floor(Math.random()*16777215).toString(16)),
              "author": {
                "name": "The Logic Lounge Bot",
                "icon_url": "https://i.imgur.com/R7TRyNo.png"
              },
              "fields": [
                {
                  "name": `Input - ${message.content.substr(11)}`,
                  "value": `Output - ${newstring}`
                }
              ]
            }
          })       
    }
    
    else if(command === "purge") {
      return
        if(!message.member.roles.some(r=>["Administrator", "Moderator"].includes(r.name)) )
        return message.reply("Sorry, you don't have permissions to use this!");

      const deleteCount = parseInt(args[0], 10);
      
      console.log(deleteCount)
      if(!deleteCount || deleteCount < 2 || deleteCount > 100)
        return message.reply("Please provide a number between 2 and 100 for the number of messages to delete");
      const fetched = await message.channel.fetchMessages({count: deleteCount});
     // log.channel.send(`${message.author} has purged ${deleteCount} messages in ${message.channel.name}`)
      message.channel.bulkDelete(fetched)
        .catch(error => message.reply(`Couldn't delete messages because of: ${error}`));
    }else if(command === "forcesave") {
      if (!message.author.id == `188386891182112769`) return;
      save()
      message.channel.send(`All data successfully saved`)
    }else if (command === "setposts") {
    if (!message.author.id == `188386891182112769`) return;
    let member = message.mentions.members.first()
    if(!member)
    return message.reply("Please mention a valid member of this server");
    let time = args.slice(1).join(' ');
    if(!time) return message.reply("Please indicate a time for the mute!");    
    saveData[member.id] = Number(time) 

    }else if (command === "math") {
      let math = Meth.eval(message.content.substring(6))
      message.channel.send({
        "embed": {
          "title": "­­­­",
          "color": Number("0x"+Math.floor(Math.random()*16777215).toString(16)),
          "author": {
            "name": "The Logic Lounge Bot",
            "icon_url": "https://i.imgur.com/R7TRyNo.png"
          },
          "fields": [
            {
              "name": `Question - ${message.content.substring(6)}`,
              "value": `Answer - ${math}`
            }
          ]
        }
      })

    }else if (command === "leaderboard") {
      const keys = Object.keys(saveData);
      let newT = {}
      for(let i=0;i<keys.length;i++){
        let key = keys[i];
        newT[saveData[key]] = key
      }
      const sorted = sortByKey(newT)
      var arr = [];
      for (var prop in newT) {
          arr.push(newT[prop]);
      }
      const a = arr.length - 1
      for(var i = 0; i <= 9; i++) {
      if (!message.guild.members.get(arr[a-i])) {
       delete saveData[arr[a-i]]
        }
      }
      const member = message.mentions.members.first()
      let number = args.slice(0).join(' ');
      if (member) {
        for (var i = 0, row; row = arr[i]; i++) {
          if (row == member.id) {
            message.channel.send(`${member.displayName} is in ${ordinal_suffix_of(arr.length-i)} place, with ${saveData[member.id].toLocaleString()} points.`)
            break
          }
        }
      }else if (number) {
        let b = arr.length
        if (arr[b - number]) {
          let mem = message.guild.members.get(arr[b-number])
          message.channel.send(` ${mem.displayName} is in ${ordinal_suffix_of(number)} place is, with ${saveData[mem.id].toLocaleString()} points.`)
        }else return message.channel.send(`There is no person in ${ordinal_suffix_of(number)} place.`)
      }else{
      message.channel.send({
        "embed": {
          "title": "The Logic Lounge Leaderboard",
          "color": Number("0x"+Math.floor(Math.random()*16777215).toString(16)),
          "author": {
            "name": "The Logic Lounge Bot",
            "icon_url": "https://i.imgur.com/R7TRyNo.png"
          },
          "fields": [
            {
              "name": "1 - " + String(message.guild.members.get(arr[a]).displayName),
              "value": saveData[arr[a]].toLocaleString() + " points (Ahead "+(saveData[arr[a]] - saveData[arr[a-1]]).toLocaleString()+" points)"
            },
            {
              "name": "2 - " + String(message.guild.members.get(arr[a-1]).displayName),
              "value": saveData[arr[a - 1]].toLocaleString() + " points (Ahead "+(saveData[arr[a - 1]] - saveData[arr[a - 2]]).toLocaleString()+" points)"
            },
            {
              "name": "3 - " + String(message.guild.members.get(arr[a-2]).displayName),
              "value": saveData[arr[a - 2]].toLocaleString() + " points (Ahead "+(saveData[arr[a - 2]] - saveData[arr[a - 3]]).toLocaleString()+" points)"
            },
            {
              "name": "4 - " + String(message.guild.members.get(arr[a-3]).displayName),
              "value": saveData[arr[a - 3]].toLocaleString() + " points (Ahead "+(saveData[arr[a - 3]] - saveData[arr[a - 4]]).toLocaleString()+" points)"
            },
            {
              "name": "5 - " + String(message.guild.members.get(arr[a-4]).displayName),
              "value": saveData[arr[a - 4]].toLocaleString() + " points (Ahead "+(saveData[arr[a - 4]] - saveData[arr[a - 5]]).toLocaleString()+" points)"
            },
            {
              "name": "6 - " + String(message.guild.members.get(arr[a-5]).displayName),
              "value": saveData[arr[a - 5]].toLocaleString() + " points (Ahead "+(saveData[arr[a - 5]] - saveData[arr[a - 6]]).toLocaleString()+" points)"
            },
            {
              "name": "7 - " + String(message.guild.members.get(arr[a-6]).displayName),
              "value": saveData[arr[a - 6]].toLocaleString() + " points (Ahead "+(saveData[arr[a - 6]] - saveData[arr[a - 7]]).toLocaleString()+" points)"
            },
            {
              "name": "8 - " + String(message.guild.members.get(arr[a-7]).displayName),
              "value": saveData[arr[a - 7]].toLocaleString() + " points (Ahead "+(saveData[arr[a - 7]] - saveData[arr[a - 8]]).toLocaleString()+" points)"
            },
            {
              "name": "9 - " + String(message.guild.members.get(arr[a-8]).displayName),
              "value": saveData[arr[a - 8]].toLocaleString() + " points (Ahead "+(saveData[arr[a - 8]] - saveData[arr[a - 9]]).toLocaleString()+" points)"
            },
            {
              "name": "10 - " + String(message.guild.members.get(arr[a-9]).displayName),
              "value": saveData[arr[a - 9]].toLocaleString() + " points (Ahead "+(saveData[arr[a - 9]] - saveData[arr[a - 10]]).toLocaleString()+" points)"
            }
          ]
        }
      })}
    }
    else if (command === "help") {
      if(message.member.roles.some(r=>["Administrator", "Moderator"].includes(r.name)) ) { message.author.send({
        "embed": {
          "title": "The Logic Lounge Help",
          "color": Number("0x"+Math.floor(Math.random()*16777215).toString(16)),
          "author": {
            "name": "The Logic Lounge Bot",
            "icon_url": "https://i.imgur.com/R7TRyNo.png"
          },
          "fields": [
            {
              "name": "Your available commands (Moderator+)",
              "value": `!mute <user> <time> - Mutes given user for given time (User will not be able to talk in voice channel, or text channel, although will be able to listen/read.
!unmute <user> - Unmutes given user.
!kick <user> <reason> - Kicks user for given reason (Please use this, over actually clicking a user, for the reason statement.)
!ban <user> <reason> - Bans user for given reason (Please use this, over actually clicking a user, for the reason statement.)
!purge <number: 0-100> - Purges given amount of messages from chat.`
            },
            {
              "name": "Your available commands (Standard User)",
              "value": `!leaderboard - Returns top 10 highest posters in chat.
!leaderboard <number> - Returns the user who is in the given place in chat.
!leaderboard <mention> - Returns the mentioned user's place, and amount of points.
!points - Returns your points
!points <mention> - Returns given users points.
!math <equation> - Solves given math equation.`
            }
          ]
        }
      })}else{message.author.send({
        "embed": {
          "title": "The Logic Lounge Help",
          "color": Number("0x"+Math.floor(Math.random()*16777215).toString(16)),
          "author": {
            "name": "The Logic Lounge Bot",
            "icon_url": "https://i.imgur.com/R7TRyNo.png"
          },
          "fields": [
            {
              "name": "Your available commands (Standard User)",
              "value": `!leaderboard - Returns top 10 highest posters in chat.
!leaderboard <number> - Returns the user who is in the given place in chat.
!leaderboard <mention> - Returns the mentioned user's place, and amount of points.
!points - Returns your points
!points <mention> - Returns given users points.
!math <equation> - Solves given math equation.`
            }
          ]
        }

      })}
      message.reply(`I have DM'ed you commands.`)
    }
  });

  
client.login(process.env.BOT_TOKEN);
