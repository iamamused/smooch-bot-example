'use strict';

const smoochBot = require('smooch-bot');
const MemoryStore = smoochBot.MemoryStore;
const MemoryLock = smoochBot.MemoryLock;
const Bot = smoochBot.Bot;
const Script = smoochBot.Script;
const StateMachine = smoochBot.StateMachine;


class ConsoleBot extends Bot {
    constructor(options) {
        super(options);
    }

    say(text) {
        return new Promise((resolve) => {
            console.log(text);
            resolve();
        });
    }
}

class AppUserBot extends ConsoleBot {
    constructor(options,user) {
        super(options);
        this.appUser = user;
    }
}


let script = new Script({  
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


const userId = 'testUserId';
const store = new MemoryStore();
const lock = new MemoryLock();
const bot = new AppUserBot({
    store,
    lock,
    userId
},{});

const stateMachine = new StateMachine({
    script,
    bot,
    userId
});

process.stdin.on('data', function(data) {
    stateMachine.receiveMessage({
        text: data.toString().trim()
    })
        .catch((err) => {
            console.error(err);
            console.error(err.stack);
        });
});
