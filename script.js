'use strict';

const Script = require('smooch-bot').Script;
const requestPromise = require('request-promise-native');
const delay = require("../delay-promise");

module.exports = new Script({  
    processing: {
        prompt: (bot) => bot.say('Beep boop...'),
        receive: () => 'processing'
    },
    
    start: {
        receive: (bot) => {
            return bot.say(`Hi ${bot.appUser.givenName}, I'm Welcome Bot!`)
                .then(() => bot.setTypingActivity(true))
                .then(delay(1000))
                .then(() => bot.setTypingActivity(false))
                .then(() => bot.say('Let\'s get started'))
                .then(() => bot.setTypingActivity(true))
                .then(delay(1000))
                .then(() => bot.setTypingActivity(false))
                .then(() => 'completeHubspotProfile');
        }
    },

 	completeHubspotProfile: {
        prompt: (bot) => bot.say('What\'s your email address?'),
        receive: (bot, message) => {
            const email = message.text;
            return bot.setProp('email', email)
                .then(() => bot.setTypingActivity(true))
                .then(delay(1500))
                .then(() => bot.setTypingActivity(false))
                .then(() => bot.say(`Great ${bot.appUser.givenName}, I\'m going to set up an account with ${email} in our database...`))
                .then(() => bot.setTypingActivity(true))
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
						bot.say('I\'ve adden the contact.')
					}
				})
                .then(() => bot.say(`Thanks ${bot.appUser.givenName}, TTYL!`))
                .then(() => bot.setTypingActivity(false))
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