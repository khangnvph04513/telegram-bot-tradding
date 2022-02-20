const cron = require('cron');
const database = require('./database-module');
var shell = require('shelljs');
const job = new cron.CronJob({
    cronTime: '0 0 0 * * *',
    onTick: async function() {
        console.log("Migrate data vào đầu ngày");
        clearDataStatistic();
        clearDataOrders();
        clearData();
        initBot();
    },
    start: true,
    timeZone: 'Asia/Ho_Chi_Minh' // Lưu ý set lại time zone cho đúng 
});
job.start();

const jobRestart = new cron.CronJob({
    cronTime: '0 0 0 * * *',
    onTick: async function() {
        shell.exec('pm2 restart tradding-data', function(code, output) {
            console.log('Exit code:', code);
            console.log('Program output:', output);
          });
    },
    start: true,
    timeZone: 'Asia/Ho_Chi_Minh' // Lưu ý set lại time zone cho đúng 
});
jobRestart.start();

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
async function clearDataStatistic() {
    return await database.clearDataStatistic();
}

async function clearDataOrders() {
    return await database.clearDataOrders();
}

async function clearData() {
    return await database.clearData();
}

async function initBot() {
    return await database.initBot();
}

module.exports = job;