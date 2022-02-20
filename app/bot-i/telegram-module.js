const { Telegraf } = require('telegraf');

const bot = new Telegraf('2101013506:AAFFe5X5S_gFNMSiNh9OAMSC8M9MqPM39lc');
// 1988197681:AAHK5okW0zGFMV_3KlP1cwJRBRhoUK5D8Dk bot get id
bot.command('getId', ctx => {
    bot.telegram.sendMessage(ctx.chat.id, "Id of Group or Channel is: " + ctx.chat.id, {})
});

bot.command('image', (ctx) => ctx.replyWithPhoto({ url: 'https://picsum.photos/200/300/?random' }));
// Lấy telegram groupid bằng url
// https://api.telegram.org/bot2101013506:AAFFe5X5S_gFNMSiNh9OAMSC8M9MqPM39lc/getUpdates
// https://api.telegram.org/bot2030223594:AAFp1rtEVsCAklvNE1gK3a36XE_yjQUPEis/getUpdates

bot.telegram.sendMessage(-1001681337509, "Bot tiến hành khởi động lại. Nhận tín hiệu từ Bot tín hiệu tích hợp"); // Gửi tin nhắn 
bot.launch();
module.exports = bot;



