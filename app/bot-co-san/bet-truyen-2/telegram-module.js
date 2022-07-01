const { Telegraf } = require('telegraf');

const bot = new Telegraf('5404614381:AAEA7u4ckwHjZeKHfAhrIRi0Ak5HalhBu30');
bot.command('getId', ctx => {
    bot.telegram.sendMessage(ctx.chat.id, "Id of Group or Channel is: " + ctx.chat.id, {})
});

bot.command('image', (ctx) => ctx.replyWithPhoto({ url: 'https://picsum.photos/200/300/?random' }));

// https://api.telegram.org/bot5404614381:AAEA7u4ckwHjZeKHfAhrIRi0Ak5HalhBu30/getUpdates
// Nếu bị dính lỗi Something went wrong, please try again hãy revoke lại bot

bot.telegram.sendMessage(-1001659621186, "Khởi động phương pháp bệt 2 bóng"); // Gửi tin nhắn 
bot.launch();
module.exports = bot;



