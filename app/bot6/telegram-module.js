const { Telegraf } = require('telegraf');

const bot = new Telegraf('2030223594:AAHSgmFyPbx_R2tQdW3RvQvJBIQ9qcbfwgs');
// 1988197681:AAHK5okW0zGFMV_3KlP1cwJRBRhoUK5D8Dk bot get id
bot.command('getId', ctx => {
    bot.telegram.sendMessage(ctx.chat.id, "Id of Group or Channel is: " + ctx.chat.id, {})
});

bot.command('image', (ctx) => ctx.replyWithPhoto({ url: 'https://picsum.photos/200/300/?random' }));
// Lấy telegram groupid bằng url
// https://api.telegram.org/bot1988197681:AAHK5okW0zGFMV_3KlP1cwJRBRhoUK5D8Dk/getUpdates
// https://api.telegram.org/bot2030223594:AAFp1rtEVsCAklvNE1gK3a36XE_yjQUPEis/getUpdates

bot.telegram.sendMessage(-1001717909764, "Bot tiến hành khởi động lại. Nhận tín hiệu từ Bot tín hiệu 6"); // Gửi tin nhắn 
bot.launch();
module.exports = bot;



