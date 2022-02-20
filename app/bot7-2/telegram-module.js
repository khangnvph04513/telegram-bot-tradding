const { Telegraf } = require('telegraf');

const bot = new Telegraf('2126603713:AAGX6Gpd2U82DlOQqN88RemWxjNPzYPilsM');
// 1988197681:AAHK5okW0zGFMV_3KlP1cwJRBRhoUK5D8Dk bot get id
bot.command('getId', ctx => {
    bot.telegram.sendMessage(ctx.chat.id, "Id of Group or Channel is: " + ctx.chat.id, {})
});

bot.command('image', (ctx) => ctx.replyWithPhoto({ url: 'https://picsum.photos/200/300/?random' }));
// Lấy telegram groupid bằng url
// https://api.telegram.org/bot2126603713:AAGX6Gpd2U82DlOQqN88RemWxjNPzYPilsM/getUpdates
// https://api.telegram.org/bot1740325065:AAGNCtKTLmsYpkmQOG_HlU7TuDxHIxouGgg/getUpdates
// Nếu bị dính lỗi Something went wrong, please try again hãy revoke lại bot

bot.telegram.sendMessage(-1001476880042, "Bot tiến hành khởi động, nhận tín hiệu từ bot tín hiệu 7.2"); // Gửi tin nhắn 
bot.launch();
module.exports = bot;



