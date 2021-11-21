const { Telegraf } = require('telegraf');

const bot = new Telegraf('2064641820:AAH_DbBnqk8wnfiMQbobDTaHW6ZDRS4ldU8');
// 1988197681:AAHK5okW0zGFMV_3KlP1cwJRBRhoUK5D8Dk bot get id
bot.command('getId', ctx => {
    bot.telegram.sendMessage(ctx.chat.id, "Id of Group or Channel is: " + ctx.chat.id, {})
});

bot.command('image', (ctx) => ctx.replyWithPhoto({ url: 'https://picsum.photos/200/300/?random' }));
// Lấy telegram groupid bằng url
// https://api.telegram.org/bot1988197681:AAHK5okW0zGFMV_3KlP1cwJRBRhoUK5D8Dk/getUpdates
// https://api.telegram.org/bot2064641820:AAHU5jo6GuBKnvZpptFgD9WUhtE76DL78sY/getUpdates

bot.telegram.sendMessage(-1001787581503, "Bot tiến hành khởi động lại. Nhận tín hiệu từ Bot tín hiệu 4"); // Gửi tin nhắn 
bot.launch();
module.exports = bot;



