const { Telegraf } = require('telegraf');

const bot = new Telegraf('5136783605:AAFAq3c6ZzFSP_H_4XR8h95V77Tsd3IyqlA'); // tradding_4341_bot
// 1988197681:AAHK5okW0zGFMV_3KlP1cwJRBRhoUK5D8Dk bot get id
bot.command('getId', ctx => {
    bot.telegram.sendMessage(ctx.chat.id, "Id of Group or Channel is: " + ctx.chat.id, {})
});

bot.command('image', (ctx) => ctx.replyWithPhoto({ url: 'https://picsum.photos/200/300/?random' }));
// Lấy telegram groupid bằng url
// https://api.telegram.org/bot5136783605:AAFAq3c6ZzFSP_H_4XR8h95V77Tsd3IyqlA/getUpdates
// Nếu bị dính lỗi Something went wrong, please try again hãy revoke lại bot

bot.telegram.sendMessage(-1001543369584, "Khởi động phương pháp KingAI 1.7"); // Gửi tin nhắn 
bot.launch();
module.exports = bot;



