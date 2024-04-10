// Express
const express = require('express');
const router = express.Router();

// IP Request
const requestIp = require('request-ip');

// Crypto
const crypto = require('crypto');

// JSON 파일을 읽기 위한 FS 모듈
const fs = require('fs');

// Mariadb
const mysql = require('mysql2/promise');
const { start } = require('repl');
const db_auth = JSON.parse(fs.readFileSync(__dirname + '/db_auth.json'));

// DB Initialzation
const dbPool = mysql.createPool({
    host: 'localhost',
    user: db_auth.username,
    password: db_auth.password,
    database: 'panza_setiment',
    multipleStatements: true
});

router.get('/', async function (req, res) {
    const connection = await dbPool.getConnection();

    const date = new Date();
    const startDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-01';
    const endDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-31';
    const prevDate = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    const prevStartDate = prevDate.getFullYear() + '-' + (prevDate.getMonth() + 1) + '-01';
    const prevEndDate = prevDate.getFullYear() + '-' + (prevDate.getMonth() + 1) + '-31';

    const [uploads] = await connection.query('select * from upload where date between ? and ? order by `date` desc;', [startDate, endDate]);
    const [prevUploads] = await connection.query('select * from upload where date between ? and ? order by `date` desc;', [prevStartDate, prevEndDate]);

    const [promises] = await connection.query('select * from promise;');

    const likeSql = 'select ' +
        'count(*) as `all`, ' +
        'count(case when date between ? and ? then 1 end) as thisMonth ' +
        'from `like`;';
    const [likes] = await connection.query(likeSql, [startDate, endDate]);
    const sadSql = 'select ' +
        'count(case when date between ? and ? then 1 end) as thisMonth, ' +
        'count(*) as `all` ' +
        'from `sad`;';
    const [sads] = await connection.query(sadSql, [startDate, endDate]);

    const [calibrate] = await connection.query('select * from calibrate order by _id desc limit 1;');

    connection.release();

    var uploadScore = uploads.length;
    if (uploadScore > 0 && uploadScore <= 2) {
        uploadScore = uploadScore / 2.0 * 100;
    } else if (uploadScore > 2) {
        uploadScore = 100.0;
    }

    var prevUploadScore = prevUploads.length;
    if (prevUploadScore > 0 && prevUploadScore <= 2) {
        prevUploadScore = prevUploadScore / 2.0 * 100;
    } else if (prevUploadScore > 2) {
        prevUploadScore = 100.0;
    }

    var promiseTotal = 0;
    for (var i = 0; i < promises.length; i++) {
        promiseTotal += promises[i].status;
    }
    var promiseScore = 0;
    if (promiseTotal > 0) {
        promiseScore = parseFloat(promiseTotal) / (promises.length * 2) * 100;
    }

    var promiseSuccess = 0;
    var promiseHalf = 0;
    var promiseFail = 0;
    for (var i = 0; i < promises.length; i++) {
        const promise = promises[i];
        if (promise.status == 2) {
            promiseSuccess += 1;
        } else if (promise.status == 1) {
            promiseHalf += 1;
        } else {
            promiseFail += 1;
        }
    }

    var likeScore = likes[0].thisMonth;
    if (likeScore > 0) {
        likeScore = likeScore / (likes[0].thisMonth + sads[0].thisMonth) * 100;
    }

    var allLikeScore = likes[0].all;
    if (allLikeScore > 0) {
        allLikeScore = likes[0].all / (likes[0].all + sads[0].all) * 100;
    }

    var totalScore = (uploadScore > 0 ? uploadScore / 3.0 : 0) +
        (promiseScore > 0 ? promiseScore / 3.0 : 0) +
        (likeScore > 0 ? likeScore / 3.0 : 0) +
        calibrate[0].score;

    res.render('index', { 
        calibrate: calibrate[0].score, 
        totalScore: totalScore, 
        uploads: {
            score: uploadScore,
            prevScore: prevUploadScore,
            thisMonth: uploads, 
            prevMonth: prevUploads, 
        },
        promises: {
            score: promiseScore,
            list: promises,
            success: promiseSuccess,
            half: promiseHalf,
            fail: promiseFail
        },
        likes: {
            allScore: allLikeScore,
            score: likeScore,
            allLikes: likes[0].all,
            thisMonthLikes: likes[0].thisMonth,
            allSads: sads[0].all,
            thisMonthSads: sads[0].thisMonth,
            allCount: likes[0].all + sads[0].all,
            count: likes[0].thisMonth + sads[0].thisMonth
        }
    });
});

router.get('/get', async function (req, res){
    const connection = await dbPool.getConnection();

    const date = new Date();
    const startDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-01';
    const endDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-31';
    const prevDate = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    const prevStartDate = prevDate.getFullYear() + '-' + (prevDate.getMonth() + 1) + '-01';
    const prevEndDate = prevDate.getFullYear() + '-' + (prevDate.getMonth() + 1) + '-31';

    const [uploads] = await connection.query('select * from upload where date between ? and ? order by `date` desc;', [startDate, endDate]);
    const [prevUploads] = await connection.query('select * from upload where date between ? and ? order by `date` desc;', [prevStartDate, prevEndDate]);

    const [promises] = await connection.query('select * from promise;');

    const likeSql = 'select ' +
        'count(*) as `all`, ' +
        'count(case when date between ? and ? then 1 end) as thisMonth ' +
        'from `like`;';
    const [likes] = await connection.query(likeSql, [startDate, endDate]);
    const sadSql = 'select ' +
        'count(case when date between ? and ? then 1 end) as thisMonth, ' +
        'count(*) as `all` ' +
        'from `sad`;';
    const [sads] = await connection.query(sadSql, [startDate, endDate]);

    const [calibrate] = await connection.query('select * from calibrate order by _id desc limit 1;');

    connection.release();

    var uploadScore = uploads.length;
    if (uploadScore > 0 && uploadScore <= 2) {
        uploadScore = uploadScore / 4.0 * 100 / 3;
    } else if (uploadScore > 2) {
        uploadScore = 100.0;
    }

    var prevUploadScore = prevUploads.length;
    if (prevUploadScore > 0 && prevUploadScore <= 2) {
        prevUploadScore = prevUploadScore / 4.0 * 100 / 3;
    } else if (prevUploadScore > 2) {
        prevUploadScore = 100.0;
    }

    var promiseTotal = 0;
    for (var i = 0; i < promises.length; i++) {
        promiseTotal += promises[i].status;
    }
    var promiseScore = 0;
    if (promiseTotal > 0) {
        promiseScore = parseFloat(promiseTotal) / (promises.length * 2) * 100;
    }

    var promiseSuccess = 0;
    var promiseHalf = 0;
    var promiseFail = 0;
    for (var i = 0; i < promises.length; i++) {
        const promise = promises[i];
        if (promise.status == 2) {
            promiseSuccess += 1;
        } else if (promise.status == 1) {
            promiseHalf += 1;
        } else {
            promiseFail += 1;
        }
    }

    var likeScore = likes[0].thisMonth.length;
    if (likeScore > 0) {
        likeScore = likeScore / (likes[0].thisMonth.length + sads[0].thisMonth.length) * 100;
    }

    var allLikeScore = likes[0].all.length;
    if (allLikeScore > 0) {
        allLikeScore = likes[0].all / (likes[0].all.length + sads[0].all.length) * 100;
    }

    var totalScore = (uploadScore > 0 ? uploadScore / 3.0 : 0) +
        (promiseScore > 0 ? promiseScore / 3.0 : 0) +
        (likeScore > 0 ? likeScore / 3.0 : 0) +
        calibrate[0].score;

    res.send({ 
        dates: {
            date: date,
            startDate: startDate,
            endDate: endDate,
            prevDate: prevDate,
            prevStartDate: prevStartDate,
            prevEndDate: prevEndDate
        },
        calibrate: calibrate[0].score, 
        totalScore: totalScore, 
        uploads: {
            score: uploadScore,
            prevScore: prevUploadScore,
            thisMonth: uploads, 
            prevMonth: prevUploads, 
        },
        promises: {
            score: promiseScore,
            list: promises,
            success: promiseSuccess,
            half: promiseHalf,
            fail: promiseFail
        },
        likes: {
            allScore: allLikeScore,
            score: likeScore,
            allLikes: likes[0].all,
            thisMonthLikes: likes[0].thisMonth,
            allSads: sads[0].all,
            thisMonthSads: sads[0].thisMonth,
            allCount: likes[0].all + sads[0].all,
            count: likes[0].thisMonth + sads[0].thisMonth
        }
    });
});

router.get('/get/uploads', async function (req, res) {
    const connection = await dbPool.getConnection();

    const startDate = req.params.startDate;
    const endDate = req.params.endDate;

    // Get uploads
    const [uploads] = await connection.query('select * from upload where date between ? and ? order by `date` desc;', [startDate, endDate]);

    connection.release();

    return uploads;
});

router.get('/get/promises', async function (req, res) {
    const connection = await dbPool.getConnection();

    const [promiseTop] = await connection.query('select * from promise order by _id desc limit 5;');
    const promiseSql = 'select ' + 
        'count(case when `status` = 2 then 1 end) as done ' +
        'count(case when `status` = 1 then 1 end) as half ' +
        'count(case when `status` = 0 then 1 end) as fail ' +
        'from promise;';
    const [promises] = await connection.query(promiseSql);

    connection.release();

    return {done: promises[0].done, half: promises[0].half, fail: promises[0].fail, top: promiseTop};
});

router.get('/get/likes', async function (req, res) {
    const connection = await dbPool.getConnection();

    const date = new Date();
    const startDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-01';
    const endDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-31';
    const prevDate = new Date(date.getFullYear(), date.getMonth() - 1, 1);

    const likeSql = 'select ' +
        'count(*) as `all`, ' +
        'count(case when date between ? and ? then 1 end) as thisMonth ' +
        'from `like`;';
    const [likes] = await connection.query(likeSql, [startDate, endDate]);
    const sadSql = 'select ' +
        'count(case when date between ? and ? then 1 end) as thisMonth, ' +
        'count(*) as `all` ' +
        'from `sad`;';
    const [sads] = await connection.query(sadSql, [startDate, endDate]);

    connection.release();
    
    return {likes: likes, sads: sads};
});


router.get('/like', async function (req, res) {
    const ip = requestIp.getClientIp(req);
    const digested = crypto.createHash('sha256').update(ip).digest('hex');

    const connection = await dbPool.getConnection();
    const sqlLikeCount = 'select * from `like` where ipaddr = ? and `date` = curdate();';
    const [likeCount] = await connection.query(sqlLikeCount, [digested]);

    if (likeCount.length < 5) {
        const sqlLike = 'insert into `like` (ipaddr) values (?);';
        await connection.query(sqlLike, [digested]);
        res.redirect('/');
    } else {
        sendError(res, "하루에 5번만 할 수 있어요.", "/");
    }

    connection.release();
});

router.get('/sad', async function (req, res) {
    const ip = requestIp.getClientIp(req);
    const digested = crypto.createHash('sha256').update(ip).digest('base64');;

    const connection = await dbPool.getConnection();
    const sqlLikeCount = 'select * from sad where ipaddr = ? and `date` = curdate();';
    const [likeCount] = await connection.query(sqlLikeCount, [digested]);

    if (likeCount.length < 5) {
        const sqlLike = 'insert into sad (ipaddr) values (?);';
        await connection.query(sqlLike, [digested]);
        res.redirect('/');
    } else {
        sendError(res, "하루에 5번만 할 수 있어요.", "/");
    }

    connection.release();
});



module.exports = router;

// 에러 페이지로 이동
function sendError(res, message, redirect) {
    res.redirect('/error?message=' + message + '&redirect=' + redirect);
}