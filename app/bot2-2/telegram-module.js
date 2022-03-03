const { Telegraf } = require('telegraf');

const bot = new Telegraf('1972059217:AAGcQpSyzaezMuDk0gp9Z9dTm5jLSR5fZw0'); // tradding-bot
bot.command('start', ctx => {
    console.log(ctx.from)
    bot.telegram.sendMessage(ctx.chat.id, 'hello there! Welcome to my new telegram bot.', {})
});

bot.command('image', (ctx) => ctx.replyWithPhoto({ url: 'https://picsum.photos/200/300/?random' }));

bot.telegram.sendMessage(-1001595893591, "Bot tiến hành khởi động lại. Nhận tín hiệu từ Bot tín hiệu 2"); // Gửi tin nhắn
module.exports = bot;



