'use strict';

const smoochBot = require('smooch-bot');
const MemoryLock = smoochBot.MemoryLock;
const SmoochApiStore = smoochBot.SmoochApiStore;
const SmoochApiBot = smoochBot.SmoochApiBot;
const StateMachine = smoochBot.StateMachine;
const app = require('../app');
const script = require('../script');
const SmoochCore = require('smooch-core');
const jwt = require('../jwt');

const name = 'SmoochBot';
const avatarUrl = 'https://s.gravatar.com/avatar/f91b04087e0125153623a3778e819c0a?s=80';
const store = new SmoochApiStore({
    jwt
});
const lock = new MemoryLock();
const webhookTriggers = ['message:appUser', 'postback'];
const util = require('util')

class AppUserBot extends SmoochApiBot {
    constructor(options,user) {
        super(options);
        this.appUser = user;
    }
}

function createWebhook(smoochCore, target) {
    return smoochCore.webhooks.create({
        target,
        triggers: webhookTriggers
    })
        .then((res) => {
            console.log('Smooch webhook created with target', res.webhook.target);
        })
        .catch((err) => {
            console.error('Error creating Smooch webhook:', err);
            console.error(err.stack);
        });
}

function updateWebhook(smoochCore, existingWebhook) {
    return smoochCore.webhooks.update(existingWebhook._id, {
        triggers: webhookTriggers
    })
        .then((res) => {
            console.log('Smooch webhook updated with missing triggers', res.webhook.target);
        })
        .catch((err) => {
            console.error('Error updating Smooch webhook:', err);
            console.error(err.stack);
        });
}

// Create a webhook if one doesn't already exist
if (process.env.SERVICE_URL) {
    console.log('Has SERVICE_URL %s, %s', process.env.SERVICE_URL);
    console.log('SMOOCH_KEY_ID %s', process.env.SMOOCH_KEY_ID);
    console.log('SMOOCH_SECRET %s', process.env.SMOOCH_SECRET);

    const target = process.env.SERVICE_URL.replace(/\/$/, '') + '/webhook';
    //const smoochCore = new SmoochCore({
    //    jwt
    //});
    const smoochCore = new SmoochCore({
    	keyId: process.env.SMOOCH_KEY_ID,
    	secret: process.env.SMOOCH_SECRET,
    	scope: 'account', // account or app
	});
    smoochCore.webhooks.list()
        .then((res) => {
            const existingWebhook = res.webhooks.find((w) => w.target === target);

            if (!existingWebhook) {
                return createWebhook(smoochCore, target);
            }

            const hasAllTriggers = webhookTriggers.every((t) => {
                return existingWebhook.triggers.indexOf(t) !== -1;
            });

            if (!hasAllTriggers) {
                updateWebhook(smoochCore, existingWebhook);
            }
        });
} else {
    console.log('does not hav SERVICE_URL %s', process.env.SERVICE_URL);
}

function createBot(appUser) {
    const userId = appUser.userId || appUser._id;
    console.log('Create bot for user: %s', userId);
    console.log(util.inspect(appUser, false, null));
    return new AppUserBot({
        name,
        avatarUrl,
        lock,
        store,
        userId
    },appUser);
}

function handleMessages(req, res) {
    const messages = req.body.messages.reduce((prev, current) => {
        if (current.role === 'appUser') {
            prev.push(current);
        }
        return prev;
    }, []);

    if (messages.length === 0) {
        return res.end();
    }

    const stateMachine = new StateMachine({
        script,
        bot: createBot(req.body.appUser)
    });

    stateMachine.receiveMessage(messages[0])
        .then(() => res.end())
        .catch((err) => {
            console.error('SmoochBot error:', err);
            console.error(err.stack);
            res.end();
        });
}

function handlePostback(req, res) {
    const postback = req.body.postbacks[0];
    if (!postback || !postback.action) {
        res.end();
    }

    createBot(req.body.appUser).say(`You said: ${postback.action.text} (payload was: ${postback.action.payload})`)
        .then(() => res.end());
}

app.post('/webhook', function(req, res, next) {
    const trigger = req.body.trigger;

    switch (trigger) {
        case 'message:appUser':
            handleMessages(req, res);
            break;

        case 'postback':
            handlePostback(req, res);
            break;

        default:
            console.log('Ignoring unknown webhook trigger:', trigger);
    }
});

var server = app.listen(process.env.PORT || 8000, function() {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Smooch Bot listening at http://%s:%s', host, port);
});
