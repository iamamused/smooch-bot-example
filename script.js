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
                .then((name) => bot.say(`Hi ${name}, I'm Welcome Bot!`))
                .then(() => bot.say('Let\'s get started'))
                .then(() => 'askEmail');
        }
    },

    askName: {
        prompt: (bot) => bot.say('What\'s your name?'),
        receive: (bot, message) => {
            const name = message.text;
            return bot.setProp('name', name)
                .then(() => bot.say(`Great! I'll call you ${name}
Is that OK? %[Yes](postback:yes) %[No](postback:no)`))
                .then(() => 'askEmail');
        }
    },

 	askEmail: {
        prompt: (bot) => bot.say('I\'ll also need your emails address please.'),
        receive: (bot, message) => {
            const email = message.text;
            return bot.setProp('email', email)
                .then(() => bot.say(`I have your email as ${email}.`))
                .then(() => 'finish');
        }
    },

    finish: {
        receive: (bot, message) => {
            return bot.getProp('name')
                .then((name) => bot.say(`Thanks ${name}, See you later!`))
                .then(() => 'finish');
        }
    }
});