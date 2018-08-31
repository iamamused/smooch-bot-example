'use strict';

const Script = require('smooch-bot').Script;

module.exports = new Script({  
    processing: {
        prompt: (bot) => bot.say('Beep boop...'),
        receive: () => 'processing'
    },
    
    start: {
        receive: (bot) => {
            return bot.getProp('firstname')
                .then((firstname) => bot.say(`Hi ${firstname}, I'm Welcome Bot!`))
                .then(() => bot.say('Let\'s get started'))
                .then(() => 'askEmail');
        }
    },

    askName: {
        prompt: (bot) => bot.say('What\'s your given (first) name?'),
        receive: (bot, message) => {
            const firstname = message.text;
            return bot.setProp('firstname', firstname)
                .then(() => bot.say(`Great! I'll call you ${firstname}
Is that OK? %[Yes](postback:yes) %[No](postback:no)`))
                .then(() => 'askEmail');
        }
    },

 	askEmail: {
        prompt: (bot) => bot.say('What\'s your email address?'),
        receive: (bot, message) => {
            const email = message.text;
            return bot.setProp('email', email)
                .then(() => bot.say(`I have your email as ${email}.`))
                .then(() => 'finish');
        }
    },

    finish: {
        receive: (bot, message) => {
	        bot.store.set('yourUserId', 'state', 'processing')
            return bot.getProp('firstname')
                .then((firstname) => bot.say(`Thanks ${firstname}, See you later!`))
                .then(() => bot.say('If you want to reset the bot, type \'reset\''))
                .then(() => 'finish');
        }
    }
});