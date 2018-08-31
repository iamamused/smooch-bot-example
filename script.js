'use strict';

const Script = require('smooch-bot').Script;

module.exports = new Script({  
    processing: {
        prompt: (bot) => bot.say('Beep boop...'),
        receive: () => 'processing'
    },
    
    start: {
        receive: (bot) => {
            return bot.say(`Hi ${bot.appUser.givenName}, I'm Welcome Bot!`)
                .then(() => bot.say('Let\'s get started'))
                .then(() => 'askEmail');
        }
    },

 	askEmail: {
        prompt: (bot) => bot.say('What\'s your email address?'),
        receive: (bot, message) => {
            const email = message.text;
            return bot.setProp('email', email)
                .then(() => bot.say(`Thanks, I have your email as ${email}.`))
                .then(() => 'storeInHubspot');
        }
    },

 	storeInHubspot: {
        receive: (bot) => {
            return bot.getProp('email')
            	.then((email) => bot.say(`Great ${bot.appUser.givenName}, I\'m going to set up an account with ${email} in our database...`))
                .then(() => 'finish');
        }
        
    },

    finish: {
        receive: (bot, message) => {
            return bot.say(`Thanks ${bot.appUser.givenName}, See you later!`)
                .then(() => bot.say('If you want to reset the bot, type \'reset\''))
                .then(() => 'finish');
        }
    }
});