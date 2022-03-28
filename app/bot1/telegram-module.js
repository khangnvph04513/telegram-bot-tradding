const { Telegraf } = require('telegraf');

const bot = new Telegraf('5180731345:AAEnjTn_15NEsbsxB1PK74y1-_wnJzzwoqE'); // tradding-bot
bot.command('start', ctx => {
    console.log(ctx.from)
    bot.telegram.sendMessage(ctx.chat.id, 'hello there! Welcome to my new telegram bot.', {})
});

bot.command('image', (ctx) => ctx.replyWithPhoto({ url: 'https://picsum.photos/200/300/?random' }));
// Lấy telegram groupid bằng url
// https://api.telegram.org/bot5180731345:AAEnjTn_15NEsbsxB1PK74y1-_wnJzzwoqE/getUpdates
bot.telegram.sendMessage(-1001492649224, "Bot tiến hành khởi động lại. Nhận tín hiệu từ Bot tín hiệu 1"); // Gửi tin nhắn
module.exports = bot;



