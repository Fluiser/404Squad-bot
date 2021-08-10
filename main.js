const {Client, WebhookClient, MessageEmbed} = require('discord.js');
const http = require('http');
const https = require('https');
const bot = new Client();
const config = require('./config.json');
let reaction_message;
let guild;
const privateVoiceChannels = new Set();
bot.login(config.token);

const stack_wait = new Map();

function play(connection, oldHttpStream) {
    if(oldHttpStream && !oldHttpStream.destroyed)
        oldHttpStream.destroy();
    (config.radio.startsWith('https') ? https : http).get(config.radio, res => {
        connection.play(res);
        res.on('end', () => play(connection, res));
        res.on('error', () => play(connection, res));
    });
}

async function changeNick(member) {
    if(!member.manageable) return;
    const findNickname = member.displayName.replace(/[^A-ZА-Я0-9 ]/gi, '');
    if(member.displayName != findNickname) {
        await member.setNickname(findNickname || 'username' + member.user.discriminator);
    }
}

// HAHA. Discord.js@v12 - what the fuck you doing?
// You cache system - shit.

bot.on('guildMemberUpdate', (o, newmember) => {if(o.displayName != newmember.displayName) changeNick(newmember)});
bot.on('guildMemberAdd', member => changeNick(member));

bot.on('ready', async () => {
    bot.user.setPresence({status: 'dnd', activity: {name: 'you', type: 'WATCHING'}})
        .then(() => console.log('set activity.', bot.user.tag));

    reaction_message = config.reaction.channel ? await bot.channels.cache.get(config.reaction.channel).messages.fetch(config.reaction.message) || {} : {};

    guild = bot.guilds.cache.get(config.reaction.guild);
    
    if(config.cacheAllMembers)
        await guild.members.fetch();

    const voiceChannel = bot.channels.cache.get(config.voiceChannel);
    if(voiceChannel) {
        voiceChannel.join()
            .then(voiceConnection => {
                play(voiceConnection);
                voiceConnection.on('end', () => play(voiceConnection));
            }).catch(console.log);
    }
});

bot.on('message', async message => {
    if(!config.admins.includes(message.author.id) || !message.content.startsWith(config.prefix)) return;
    const args = message.content.split(' ');
    switch(args.slice(config.prefix).toLowerCase())
    {
        case 'eval':
            try { eval(args.join(' ')); } catch {}
        break;
        case 'reboot':
            process.exit();
        break;
    }
});

function stack_add(user_id) {
    stack_wait.set(user_id, new Promise(resolve => {
        setTimeout(() => {
            resolve(void 0);
            stack_wait.delete(user_id);
        }, 500);
    }));
}

bot.on('raw', async event => {
    if(event.t !== "MESSAGE_REACTION_REMOVE" && event.t !== "MESSAGE_REACTION_ADD") return;
    if(event.d.message_id !== reaction_message.id) return;
    if(stack_wait.has(event.d.user_id)) await stack_wait.get(event.d.user_id);
    const reaction = event.d.emoji && (event.d.emoji.name || event.d.emoji.id);
    const role = config.reaction.roles[reaction];
    if(!role) return;
    const member = guild.members.cache.get(event.d.user_id);
    if(event.t === "MESSAGE_REACTION_REMOVE" && member.roles.cache.has(role)) {
        await member.roles.remove(role);
        stack_add(event.d.user_id);
        return;
    }
    if(event.t === "MESSAGE_REACTION_ADD" && !member.roles.cache.has(role)) {
        await member.roles.add(role);
        stack_add(event.d.user_id);
        return;
    }
});

if(config.privateVoiceChannels.main_id) {

    async function exitFromVoice(member, channel) {
        if(!privateVoiceChannels.has(channel.id)) return;
        if(channel.members.filter(member => !member.user.bot).size < 1) {
            privateVoiceChannels.delete(channel.id);
            if(!channel.deleted)
                try {await channel.delete(); } catch { /* DJS suck on events handles. (And 13version suck).*/ }
            return;
        } 
    }
    
    async function joinToVoice(state, channel) {
        if(channel.id === config.privateVoiceChannels.main_id) {
            const voice = await channel.guild.channels.create(`Pr. ${state.member.displayName.slice(0, 16)}`, {
                type: 'voice',
                parent: config.privateVoiceChannels.parent,
                position: config.privateVoiceChannels.position,
                permissionOverwrites: [
                    {
                        id: state.member.user.id,
                        allow: ['MANAGE_CHANNELS', 'MANAGE_ROLES', 'CONNECT', 'SPEAK']
                    },
                    {
                        id: channel.guild.id,
                        deny: ['CONNECT']
                    }
                ]
            }); // Eeeeeah. End voice call function.
            privateVoiceChannels.add(voice.id);
            state.setChannel(voice);
        }
    }

    bot.on('voiceStateUpdate', async(o, n) => {
        if(o.channel) {
            await exitFromVoice(o.member, o.channel);
            return; // This makes abuse harder.
        }
        if(n.channel) {
            await joinToVoice(n, n.channel);
        }
    });
}

if(config['auto-images']) {
    async function sender(_client, send) {
        const _data = await _client.gets();
        for(const img of _data) {
            await send(img);
            await (new Promise(r => setTimeout(r, 2000, void 0))); //sleep
        }
    }

    const cfg = config['auto-images'];
    const explicit = cfg.webhook.explicit && new WebhookClient(cfg.webhook.explicit.id, cfg.webhook.explicit.token);
    const safe = cfg.webhook.safe && new WebhookClient(cfg.webhook.safe.id, cfg.webhook.safe.token);
    const c = require('./imageClient');
    for(const [id, path] of Object.entries(cfg.sources))
    {
        const _client = new c(path, id);
        const send = async(img) => {
            const w = img.rating === 'e' ? explicit : safe;
            if(w && img.score > 5 && ['.png', '.jpg', '.jpeg', '.webm', '.bmp'].some(format => img.file_url.endsWith(format)))
                await w.send(new MessageEmbed().setImage(img.file_url).setFooter(img.id + '/' + img.score));
        };
        // sender(_client, send); // just test.
        // Posts not 
        setInterval(sender, 60000*60*6, _client, send); // sleep for 6 hours
    }
}