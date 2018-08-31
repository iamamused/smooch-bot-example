'use strict';

const smoochBot = require('smooch-bot');
const MemoryStore = smoochBot.MemoryStore;
const MemoryLock = smoochBot.MemoryLock;
const Bot = smoochBot.Bot;
const Script = smoochBot.Script;
const StateMachine = smoochBot.StateMachine;
const requestPromise = require('request-promise-native');

const delay = require("../delay-promise");


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
                .then(delay(1000))
                .then(() => 'completeHubspotProfile');
        }
    },

 	completeHubspotProfile: {
        prompt: (bot) => bot.say('What\'s your email address?'),
        receive: (bot, message) => {
            const email = message.text;
            return bot.setProp('email', email)
                .then(() => bot.say(`Thanks, I have your email as ${email}.`))
                .then(() => 
            		bot.say(`Great ${bot.appUser.givenName}, I\'m going to set up an account with ${email} in our database...`)
					.then(() => requestPromise({
							method: 'POST',
							uri: process.env.HUBSPOT_URL,
							body: {
								firstname: bot.appUser.givenName,
								lastname: bot.appUser.surname,
								email: email,
								phone: ''
							},
							json: true
						})
						.catch(function (err) {
							console.error(err)
							bot.say('It looks like ' + err)
						}))
					.then((parsedBody) => { 
						console.log(parsedBody)
						if (parsedBody.message) {
							bot.say('It looks like ' + parsedBody.message)
						} else {
							bot.say('I\'ve adden the contact, thanks!')
						}
					}))
                .then(() => bot.say(`Thanks ${bot.appUser.givenName}, TTYL!`))
				.then(() => 'finish');
        }
    },

    finish: {
        receive: (bot, message) => {
            return bot.say('If you want to reset the bot, type \'reset\'')
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
},{'givenName':'test','surname':'user'});

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
