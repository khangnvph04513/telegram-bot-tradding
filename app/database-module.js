//var mysql = require('mysql');
var mysql = require('mysql2');
const _ = require('lodash');
const api = require('./server');

var connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '1234',
    //password: 'aA123456789^Aa@',
    database: 'tradding_db'
});
connection.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});




module.exports.inserRessult = function (lastResult) {
    var sql = `INSERT INTO tradding_data (result, timestamp) VALUES (${lastResult}, UNIX_TIMESTAMP(current_timestamp()))`;
    connection.query(sql, function (err, result) {
        if (err) throw err;
        console.log("1 record inserted");
    });
}

module.exports.getLastResult = function () {
    return new Promise((resolve, reject) => {
        connection.query("select * from tradding_data order by id desc limit 1", function (err, result, fields) {
            if (err) reject(err);
            resolve(result[0]);
        });
    });
}
// Lấy 3 kết quả gần nhất
module.exports.getLastDataTraddingByLimit = function (limit) {
    return new Promise((resolve, reject) => {
        connection.query(`select * from tradding_data order by id desc limit ${limit}`, function (err, result, fields) {
            if (err) reject(err);
            resolve(result);
        });
    });
}


// Lấy số dư hiện tại
module.exports.getBotInfo = function (botId) {
    return new Promise((resolve, reject) => {
        console.log(`select * from bot where id=${botId}`);
        connection.query(`select * from bot where id=${botId}`, function (err, result, fields) {
            if (err) reject(err);
            if (result.length === 0) {
                reject(new Error("getBotInfo"));
            }
            resolve(result[0]);
        });
    });
}

// update số dư
module.exports.updateBugget = function (botId, budget) {
    return new Promise((resolve, reject) => {
        connection.query(`update bot set budget=${budget} where id = ${botId}`, function (err, result, fields) {
            if (err) reject(err);
            resolve(result);
        });
    });
}
// ghi kết quả lệnh vừa rồi
module.exports.insertToStatistics = function (botId, result, isQuickOrder, traddingData, interest) {
    return new Promise((resolve, reject) => {
        var sql = `INSERT INTO statistics (result, bot_id, created_time, is_quick_order, tradding_data, interest) VALUES ('${result}', ${botId}, NOW(), ${isQuickOrder}, ${traddingData}, ${interest})`;
        connection.query(sql, function (err, result) {
            if (err) throw err;
            resolve(result);
        });
    });

}

module.exports.getLastStatistics = function (botId) {
    return new Promise((resolve, reject) => {
        connection.query(`select * from statistics where bot_id=${botId} order by id desc limit 1`, function (err, result, fields) {
            if (err) reject(err);
            // if (result.length === 0) {
            //     reject(null);
            // }
            resolve(result[0]);
        });
    });
}


module.exports.getLastTraddingResult = function (botId) {
    return new Promise((resolve, reject) => {
        connection.query(`select * from statistics where bot_id=${botId} and result!='NOT_ORDER' order by id desc limit 1`, function (err, result, fields) {
            if (err) reject(err);
            if (result.length === 0) {
                reject(new Error("getLastTraddingResult"));
            }
            resolve(result[0]);
        });
    });
}


module.exports.statistic = function (botId, timeAfter) {
    return new Promise((resolve, reject) => {
        console.log(`select * from statistics where bot_id=${botId} and is_statistics=0 and result != 'NOT_ORDER' order by id desc limit ${timeAfter}`);
        connection.query(`select * from statistics where bot_id=${botId} and is_statistics=0  and result != 'NOT_ORDER' order by id desc limit ${timeAfter}`, function (err, result, fields) {
            if (err) reject(err);
            if (result.length >= timeAfter) {
                resolve(result);
            } else {
                console.log("Has Not data for statistics");
            }

        });
    });
}

module.exports.updateStatusForStatistics = function (botId) {
    return new Promise((resolve, reject) => {
        connection.query(`update statistics set is_statistics=1 where bot_id=${botId} and is_statistics=0`, function (err, result, fields) {
            if (err) throw err;
            resolve(result);
        });
    });
}

module.exports.insertOrder = function (order, price, isQuickOrder, botId) {
    if (price !== 0) {
        api.sendApiToCopyTrade(order, price, isQuickOrder, botId);
    }
    return new Promise((resolve, reject) => {
        //console.log(`insert into orders(orders, price, is_quick_order, created_time, bot_id) values (${order}, ${price}, ${isQuickOrder}, NOW(), ${botId});`);
        connection.query(`insert into orders(orders, price, is_quick_order, created_time, bot_id) values (${order}, ${price}, ${isQuickOrder}, NOW(), ${botId})`, function (err, result, fields) {
            if (err) throw err;
            console.log("INSERT ORDER!");
            resolve(result);
        });
    });
}

module.exports.getOrder = function (botId) {
    return new Promise((resolve, reject) => {
        connection.query(`select * from orders where bot_id=${botId} order by id desc limit 1`, function (err, result, fields) {
            if (err) reject(err);
            if (result.length === 0) {
                //insertOrder(0, 0, 0, botId);
                resolve(null);
            }
            resolve(result[0]);
        });
    });
}

module.exports.statisticDay = function (botId, timeAfter) {
    return new Promise((resolve, reject) => {
        console.log(`select * from statistics where bot_id=${botId} and created_time >= CURDATE() and result!='NOT_ORDER' order by id DESC`);
        connection.query(`select * from statistics where bot_id=${botId} and created_time >= CURDATE() and result!='NOT_ORDER' order by id DESC`, function (err, result, fields) {
            console.log(result.length);
            if (err) reject(err);
            let statisticTimeAfter = _.filter(result, ['is_statistics', 0]);
            if (statisticTimeAfter.length >= timeAfter) {
                resolve(result);
            } else {
            }
        });
    });
}


module.exports.initSessionVolatility = function (botId) {
    return new Promise((resolve, reject) => {
        return new Promise((resolve, reject) => {
            connection.query(`update bot set session_volatility=0, is_running=1 where id=${botId}`, function (err, result, fields) {
                if (err) throw err;
                resolve(result);
            });
        });
    });

}

module.exports.stopOrStartBot = function (botId, isRunning) {
    console.log(`update bot set is_running=${isRunning}, updated_at=now() where id=${botId}`);
    return new Promise((resolve, reject) => {
        connection.query(`update bot set is_running=${isRunning}, updated_at=now() where id=${botId}`, function (err, result, fields) {
            if (err) throw err;
            resolve(result);
            console.log("Change bot status");
        });
    });
}

module.exports.updateVolatiltyOfBot = function (botId, volatility) {
    return new Promise((resolve, reject) => {
        connection.query(`update bot set session_volatility=${volatility} where id=${botId}`, function (err, result, fields) {
            if (err) throw err;
            resolve(result);
            console.log("UPDATE VOLATILITY");
        });
    });
}

module.exports.getStatisticByLimit = function (botId, limit) {
    return new Promise((resolve, reject) => {
        console.log(`select * from statistics where bot_id=${botId} order by id DESC limit ${limit}`);
        connection.query(`select * from statistics where bot_id=${botId} order by id DESC limit ${limit}`, function (err, result, fields) {
            console.log(result.length);
            if (err) reject(err);
            resolve(result);
        });
    });
}


module.exports.getLastOrder = function (botId) {
    return new Promise((resolve, reject) => {
        console.log(`select * from orders where bot_id=${botId} order by id desc limit 1`);
        connection.query(`select * from orders where bot_id=${botId} order by id desc limit 1`, function (err, result, fields) {
            if (err) reject(err);
            if (result.length === 0) {
                reject(null);
            }
            resolve(result[0]);
        });
    });
}

module.exports.clearDataStatistic = function () {
    return new Promise((resolve, reject) => {
        console.log(`Xóa dữ liệu thống kê`);
        connection.query(`delete from statistics`, function (err, result, fields) {
            if (err) throw err;
            resolve(result);
            console.log("Đã xóa");
        });
    });
}

module.exports.clearDataOrders = function () {
    return new Promise((resolve, reject) => {
        console.log(`Xóa dữ liệu đánh lệnh`);
        connection.query(`delete from orders`, function (err, result, fields) {
            if (err) throw err;
            resolve(result);
            console.log("Đã xóa");
        });
    });
}

module.exports.clearData = function () {
    return new Promise((resolve, reject) => {
        console.log(`Xóa kết quả`);
        connection.query(`delete from tradding_data`, function (err, result, fields) {
            if (err) throw err;
            resolve(result);
            console.log("Đã xóa");
        });
    });
}

module.exports.initBot = function () {
    return new Promise((resolve, reject) => {
        connection.query(`update bot set is_running=1, updated_at=now(), session_volatility = 0, budget=100`, function (err, result, fields) {
            if (err) throw err;
            resolve(result);
        });
    });
}

module.exports.getGroupTelegramByBot = function (botId) {
    return new Promise((resolve, reject) => {
        connection.query(`select tg.group_id from users_group_bot ugb
        join telegram_group tg on tg.id = ugb.group_id 
        where ugb.bot_id = ${botId} and ugb.del_flg = 0
        group by tg.group_id`, function (err, result, fields) {
            if (err) reject(err);
            resolve(result);
        });
    });
}

module.exports.getSettingByKey = function (key) {
    return new Promise((resolve, reject) => {
        connection.query(`select * from setting where config_key='${key}'`, function (err, result, fields) {
            if (err) reject(err);
            if (result.length === 0) {
                resolve(null);
            }
            resolve(result[0]);
        });
    });
}


module.exports.updateSetting = function (key, value) {
    console.log(`update setting set value='${value}' where config_key = '${key}'`);
    var sql = `update setting set value='${value}' where config_key = '${key}'`;
    connection.query(sql, function (err, result) {
        if (err) throw err;
        console.log("update setting");
    });
}


module.exports.insertSetting = function (key, value) {
    var sql = `INSERT INTO setting (config_key, value) VALUES ('${key}', '${value}')`;
    connection.query(sql, function (err, result) {
        if (err) throw err;
    });
}


module.exports.stopAll = function () {
    return new Promise((resolve, reject) => {
        connection.query(`update bot set is_active=0, updated_at=now()`, function (err, result, fields) {
            if (err) throw err;
            resolve(result);
        });
    });
}

module.exports.startAll = function () {
    return new Promise((resolve, reject) => {
        connection.query(`update bot set is_active=1, updated_at=now()`, function (err, result, fields) {
            if (err) throw err;
            resolve(result);
        });
    });
}



module.exports.stopAllGroup = function () {
    return new Promise((resolve, reject) => {
        connection.query(`update users_group_bot set del_flg=1`, function (err, result, fields) {
            if (err) throw err;
            resolve(result);
        });
    });
}

// kiểm tra kết quả có phải ở hàng 1 hay là không, (hàng 1 số phút khi tạo sẽ lẻ)
module.exports.checkRowOneForStatistic = function () {
    var createdMinute = new Date().getMinutes();
    if (createdMinute % 2 !== 0) {
        return false;
    }
    return true;
}

module.exports.checkRowOneForOrder = function () {
    var createdMinute = new Date().getMinutes();
    if (createdMinute % 2 !== 0) {
        return true;
    }
    return false;
}
