const Discord = require("discord.js")
const client = new Discord.Client()
const config = require("./config.json")
const { Client } = require('pg');
const ms = require('ms')


const pgClient = new Client({
  connectionString: process.env.DATABASE_URL || 'postgres://pfqcrzxlhldklx:6cd2d3d9647b32915abf1c3f98d834413d2ceb1c4e3322cdb58059088b87c5f0@ec2-23-23-245-89.compute-1.amazonaws.com:5432/d22vi9ogr8b92k',
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
    console.log(String(client.channels.get('name', 'action_log')))
    client.user.setGame(`Use !Help for help.`);
    client.channels.forEach(function(val){
      //console.log(val)
      console.log(val.id)
      if (val.id === `392027118055194636`) {
      log = val  
    } 
    })
  });

client.on("message", async message => {
    if(message.author.bot && message.content.match(`Welcome to TLL! We hope you enjoy your stay.`)) return message.delete(2000)
    if(message.author.bot) return message.delete(10000)

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
      console.log(`Saving data`)
    }

    if (command === "verify" && message.channel.id == `391409706477813771`) {
      message.reply(`Welcome to TLL! We hope you enjoy your stay.`)
      message.member.addRole(message.guild.roles.find("name", "Verified")).catch(console.error);
  }else if (message.channel.id == `391409706477813771`) return message.delete()

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
     //  log.channel.send(`${message.author} has kicked ${member} for ${reason}`)
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
      message.channel.send(`${member}, you have been muted for ${ms(ms(time), {long:true})}`)
      setTimeout(function() {
        member.removeRole(muteRole.id)
        member.send(`You have been unmuted from The Logic Lounge.`)
      }, ms(time))

      
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
      
      await member.ban(reason)
        .catch(error => message.reply(`Sorry ${message.author} I couldn't ban because of : ${error}`));
      message.reply(`${member.user.tag} has been banned by ${message.author.tag} because: ${reason}`);
    }
    
    else if(command === "purge") {
        if(!message.member.roles.some(r=>["Administrator", "Moderator"].includes(r.name)) )
        return message.reply("Sorry, you don't have permissions to use this!");

      const deleteCount = parseInt(args[0], 10);
      
      if(!deleteCount || deleteCount < 2 || deleteCount > 100)
        return message.reply("Please provide a number between 2 and 100 for the number of messages to delete");

      const fetched = await message.channel.fetchMessages({count: deleteCount});
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
    }

    message.delete(5000)
  });

  client.login(process.env.BOT_TOKEN);
