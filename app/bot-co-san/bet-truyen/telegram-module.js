const { Telegraf } = require('telegraf');

const bot = new Telegraf('5458315720:AAHdaVg4MjG1QzV1lr2DNOAP5YP2lwJje6I'); // tradding_4341_bot
// 1988197681:AAHK5okW0zGFMV_3KlP1cwJRBRhoUK5D8Dk bot get id
bot.command('getId', ctx => {
    bot.telegram.sendMessage(ctx.chat.id, "Id of Group or Channel is: " + ctx.chat.id, {})
});

bot.command('image', (ctx) => ctx.replyWithPhoto({ url: 'https://picsum.photos/200/300/?random' }));
// Lấy telegram groupid bằng url
// https://api.telegram.org/bot1988197681:AAHK5okW0zGFMV_3KlP1cwJRBRhoUK5D8Dk/getUpdates
// https://api.telegram.org/bot5458315720:AAHdaVg4MjG1QzV1lr2DNOAP5YP2lwJje6I/getUpdates
// Nếu bị dính lỗi Something went wrong, please try again hãy revoke lại bot

bot.telegram.sendMessage(-1001637172736, "Khởi động phương pháp bệt truyền 4 bóng"); // Gửi tin nhắn 
bot.launch();
module.exports = bot;



