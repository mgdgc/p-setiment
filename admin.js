// Express
const express = require('express');
const router = express.Router();

// IP Request
const requestIp = require('request-ip');

// JSON 파일을 읽기 위한 FS 모듈
const fs = require('fs');

// Mariadb
const mysql = require('mysql2/promise');
const db_auth = JSON.parse(fs.readFileSync(__dirname + '/db_auth.json'));

// DB Initialzation
const dbPool = mysql.createPool({
    host: 'localhost',
    user: db_auth.username,
    password: db_auth.password,
    database: 'panza_setiment',
    multipleStatements: true
});

// 관리자 계정
const adminAccount = JSON.parse(fs.readFileSync(__dirname + '/admin_auth.json'));

// 관리자 페이지
router.get('/', function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }
    res.render('admin');
});

// 로그인 페이지
router.get('/login', function (req, res) {
    res.sendFile(__dirname + '/static/login.html');
});

// 로그인 처리
router.post('/login', function (req, res) {
    const adminId = req.body.adminId;
    const adminPw = req.body.adminPw;

    // 관리자 인증
    if (adminId == adminAccount.adminId && adminPw == adminAccount.adminPw) {
        req.session.admin = {};
        req.session.admin.adminId = adminId;
        req.session.admin.adminPw = adminPw;
        req.session.save(function (error) {
            if (error) throw error;
            res.redirect('/admin');
        });
    } else {
        sendError(res, "관리자 ID 혹은 비밀번호가 다릅니다.", "/admin/login");
    }
});

router.get('/upload', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const connection = await dbPool.getConnection();

    const sql = 'select * from upload order by date desc;';
    const [uploads] = await connection.query(sql);

    connection.release();

    res.render('admin_upload', { uploads: uploads });
});

router.post('/upload', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const title = req.body.title;
    const url = req.body.url;
    const date = req.body.date;

    const connection = await dbPool.getConnection();

    const sql = 'insert into upload (title, url, date) values (?, ?, ?);';
    await connection.query(sql, [title, url, date]);

    connection.release();

    res.redirect('/admin');
});

router.get('/upload/:id/edit', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const id = req.params.id;

    const connection = await dbPool.getConnection();

    const sql = 'select * from upload where _id = ?;';
    const [upload] = await connection.query(sql, [id]);

    connection.release();

    res.render('admin_edit.ejs', { upload: upload, promise: null });
});

router.post('/upload/:id/edit', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const id = req.params.id;
    const title = req.body.title;
    const url = req.body.url;
    const date = req.body.date;

    const connection = await dbPool.getConnection();

    const sql = 'update upload set title = ?, url = ?, date = ? where _id = ?;';
    await connection.query(sql, [title, url, date, id]);

    connection.release();

    res.redirect('/admin/upload');
});

router.get('/upload/:id/delete', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const id = req.params.id;

    const connection = await dbPool.getConnection();

    const sql = 'delete from upload where _id = ?;';
    await connection.query(sql, [id]);

    connection.release();

    res.redirect('/admin/upload');
});

router.get('/promise', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const connection = await dbPool.getConnection();

    const sql = 'select * from promise;';
    const [promises] = await connection.query(sql);

    connection.release();

    res.render('admin_promise', { promises: promises });
});

router.post('/promise', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const promise = req.body.promise;

    const connection = await dbPool.getConnection();

    const sql = 'insert into promise (promise) values (?);';
    await connection.query(sql, [promise]);

    connection.release();

    res.redirect('/admin');
});

router.get('/promise/:id/edit', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const id = req.params.id;

    const connection = await dbPool.getConnection();

    const sql = 'select * from promise where _id = ?;';
    const [promise] = await connection.query(sql, [id]);

    connection.release();

    res.render('admin_edit.ejs', { upload: null, promise: promise });
});

router.post('/promise/:id/edit', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const id = req.params.id;
    const promise = req.body.promise;
    const status = req.body.status;
    const report = req.body.report;

    const connection = await dbPool.getConnection();

    const sql = 'update promise set promise = ?, `status` = ?, report = ? where _id = ?;';
    await connection.query(sql, [promise, status, report, id]);

    connection.release();

    res.redirect('/admin/promise');
});

router.get('/promise/:id/delete', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const id = req.params.id;

    const connection = await dbPool.getConnection();

    const sql = 'delete from promise where _id = ?;';
    await connection.query(sql, [id]);

    connection.release();

    res.redirect('/admin/promise');
});

router.post('/calibrate', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const calibrate = req.body.calibrate;

    const connection = await dbPool.getConnection();

    const sql = 'insert into calibrate (score) values (?);';
    await connection.query(sql, [calibrate]);

    connection.release();

    res.redirect('/admin');
});


module.exports = router;

// 에러 페이지로 이동
function sendError(res, message, redirect) {
    res.redirect('/error?message=' + message + '&redirect=' + redirect);
}