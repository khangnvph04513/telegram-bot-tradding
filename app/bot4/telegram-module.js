const { Telegraf } = require('telegraf');

const bot = new Telegraf('5121570335:AAFdWsXBnpEktJ3xDFwSfTDWyptg2HewcLg');
//const bot = new Telegraf('1977842671:AAGJf6GW3pZ7SAaOu2oMeN7KHCJkUx8GGrM');

// 1988197681:AAHK5okW0zGFMV_3KlP1cwJRBRhoUK5D8Dk bot get id
bot.command('getId', ctx => {
    bot.telegram.sendMessage(ctx.chat.id, "Id of Group or Channel is: " + ctx.chat.id, {})
});

bot.command('image', (ctx) => ctx.replyWithPhoto({ url: 'https://picsum.photos/200/300/?random' }));
// Lấy telegram groupid bằng url
// https://api.telegram.org/bot5121570335:AAFlYd78ADyM40ELlY29mDzXbQhgf_Q1ViA/getUpdates
// https://api.telegram.org/bot2064641820:AAHU5jo6GuBKnvZpptFgD9WUhtE76DL78sY/getUpdates

//bot.telegram.sendMessage(-1001787581503, "Bot tiến hành khởi động lại. Nhận tín hiệu từ Bot tín hiệu 4"); // Gửi tin nhắn 
bot.telegram.sendMessage(-1001787581503, "Chào mừng đến với phương pháp nối bóng"); // Gửi tin nhắn 
bot.launch();
module.exports = bot;



