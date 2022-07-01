// const job = require('./app/bot1/cronjob-module');
const dailyjob = require('./app/daily-task-cron');
// const job1_2 = require('./app/bot1-2/cronjob-module');
// const job2 = require('./app/bot2/cronjob-module');
// const job2_2 = require('./app/bot2-2/cronjob-module');
// const job3 = require('./app/bot3/cronjob-module');
// const job3_2 = require('./app/bot3-2/cronjob-module');
// const job4 = require('./app/bot4/cronjob-module');
// const job6 = require('./app/bot6/cronjob-module');
// const job6_2 = require('./app/bot6-2/cronjob-module');
// const job5 = require('./app/bot5/cronjob-module');
// const job5_2 = require('./app/bot5-2/cronjob-module');
// const job7 = require('./app/bot7/cronjob-module');
// const job7_2 = require('./app/bot7-2/cronjob-module');
// const job_i = require('./app/bot-i/cronjob-module');
//const job4 = require('./app/bot4/cronjob-module');

//const job8 = require('./app/bot-co-san/bot8/cronjob-module');
// const job9 = require('./app/bot-co-san/bot9/cronjob-module');

const kingai15 = require('./app/kingai/bot-king-1.5/cronjob-module');

// const job9 = require('./app/bot-co-san/bet-truyen/cronjob-module');
const job9 = require('./app/bot-co-san/bet-truyen-2/cronjob-module');

const jobtest = require('./app/testing/cronjob-module');
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

