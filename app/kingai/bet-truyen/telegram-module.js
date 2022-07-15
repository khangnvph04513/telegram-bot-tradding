const { Telegraf } = require('telegraf');

const bot = new Telegraf('5426498590:AAHsLO4SNFVbPJ-JAL9FKCJYYM362QSd-JM'); // tradding_4341_bot
// 1988197681:AAHK5okW0zGFMV_3KlP1cwJRBRhoUK5D8Dk bot get id
bot.command('getId', ctx => {
    bot.telegram.sendMessage(ctx.chat.id, "Id of Group or Channel is: " + ctx.chat.id, {})
});

bot.command('image', (ctx) => ctx.replyWithPhoto({ url: 'https://picsum.photos/200/300/?random' }));
// https://api.telegram.org/bot5426498590:AAHsLO4SNFVbPJ-JAL9FKCJYYM362QSd-JM/getUpdates

bot.telegram.sendMessage(-1001746315808, "Chào mừng đến với phương pháp bệt truyền"); // Gửi tin nhắn 
bot.launch();
module.exports = bot;



