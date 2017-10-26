// server.js
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var PORT = 4041;



//phantom mysql
const Nightmare = require('nightmare')
require('nightmare-upload')(Nightmare);
var nightmare = Nightmare({show: true, height: 980,width: 1920 })

var mysql = require('mysql');

var connection = mysql.createConnection({host : 'localhost',user : 'root',password : '',database : 'forums',});

var userString = 'Select id,userid,password from users where status = "0"';

app.use(express.static(__dirname + '/public'));
//redirect / to our index.html file
app.get('/', function(req, res,next) {
    res.sendFile(__dirname + '/public/index.html');
});




io.on('connection', function(client) {
    console.log('Client connected...');

    client.on('restart', function(data) {
           process.exit();

    });

    //START POSTING TOTOGUN
    client.on('clicked', function(data) {

        var time = data.timer * 60000;
        var sitetitle = data.sitetitle;
        var subject = data.subject;
        var siteaddress = data.siteaddress;
        var message = data.message;
        var file = data.file;
        connection.query(userString,function(error,rows,field){

                console.log("RUNNING...");
                nightmare.goto('https://www.dajaba.org/index.php?mid=ad&page=2&act=dispMemberLoginForm')
                .wait('body')
                .insert('input#uid', rows[0].userid/*"kinggod79"*/)
                .insert('input#upw', rows[0].password/*"qwas1357"*/)
                .click('#fo_member_login > fieldset > div:nth-child(2) > input')
                .wait(10000)
                .then(function (result) {
                    console.log("Go to search now..")
                    return start(nightmare,0,data,rows) //and finally run the function again since it's still here
                })
                .catch((error) => {
                    console.log('First error')
                    return start(nightmare,0,data,rows)
                });
        });

        function start(nightmare,count,data,rows){
            console.log(rows[count].password)
            var pass=rows[count].password;
            var userid = rows[count].userid;

            return nightmare
                    .goto('https://www.dajaba.org/index.php?mid=ad&act=dispMemberLogout')
                    .wait(3000)
                    .goto('https://www.dajaba.org/index.php?mid=ad&act=dispBoardWrite')
                    .wait(10000)
                    //.wait(10000)
                    .evaluate(function() {
                        document.querySelector('input.idpw_id').value = ''
                        document.querySelector('input.idpw_pass').value = ''
                    })
                    .wait(3000)
                    .insert('input.idpw_id', userid)
                    .wait(3000)
                    .insert('input.idpw_pass', pass)
                    .wait(3000)
                    .click('span.loginbutton > input[type="submit"]')
                    .wait(3000)
                    .exists('div.popup_footer')
                    .then(function(result){
                        if(result)
                        {
                            console.log("Comment Click")
                            return commentClick(nightmare,count,data,rows)
                        }
                        else
                        {
                            console.log("comment Only")
                            return commentOnly(nightmare,count,data,rows)
                        }
                    })
                    .catch((error) => {
                        console.log('ERROR START')
                        return start(nightmare,count,data,rows)

        });
        }



        /*//INITIAL SEARCH DAJABA
        function search(nightmare,count,data,rows){

            return nightmare
                .goto('https://www.dajaba.org/ad')
                .wait(5000)
                .goto('https://www.dajaba.org/index.php?mid=ad&act=dispBoardWrite')
                .wait(10000)
                .exists('div.popup_footer')
                .then(function(result){
                    if(result)
                    {
                        console.log("CommenClick")
                        return commentClick(nightmare,count,data,rows)
                    }
                    else
                    {
                        console.log("CommenOnly")
                        return commentOnly(nightmare,count,data,rows)
                    }
                })
                .catch((error) => {

                    console.log('ERROR SEARCH')
                    return search(nightmare,count,data,rows)

                });
        }*/


        function commentClick(nightmare,count,data,rows){

            return nightmare
                .wait('body')
                .wait(10000)
                .click('div.popup_footer')
                .exists('#bd > form > table.et_vars.exForm.bd_tb > tbody > tr:nth-child(1) > td > input')
                .then(function(results){
                    console.log(results)
                    if(results){
                        return insertComment(nightmare,count,data,rows)
                    }
                    else{
                        return start(nightmare,count+1,data,rows)
                    }
                })

        }

        function commentOnly(nightmare,count,data,rows){

            return nightmare
                .wait('body')
                .wait(10000)
                .exists('#bd > form > table.et_vars.exForm.bd_tb > tbody > tr:nth-child(1) > td > input')
                .then(function(results){
                    console.log(results)
                    if(results){
                        return insertComment(nightmare,count,data,rows)
                    }
                    else{
                        return start(nightmare,count+1,data,rows)
                    }
                })

        }


    function insertComment(nightmare,count,data,rows){

        return nightmare
       /* .evaluate(function() {
            document.querySelector('#postTitle').value = ''
            document.querySelector('#bd > form > table.et_vars.exForm.bd_tb > tbody > tr:nth-child(1) > td > input').value = ''
            document.querySelector('#bd > form > table.et_vars.exForm.bd_tb > tbody > tr:nth-child(2) > td > input').value = ''
            document.querySelector('#cke_1_contents iframe').contentWindow.document.body.querySelector('p').innerHTML = ''
        })*/
        .insert('#postTitle',subject)
        .wait(5000)
        .insert('#bd > form > table.et_vars.exForm.bd_tb > tbody > tr:nth-child(1) > td > input',sitetitle)
        .wait(5000)
        .insert('#bd > form > table.et_vars.exForm.bd_tb > tbody > tr:nth-child(2) > td > input',siteaddress)
        .wait(5000)
        .wait("#cke_1_contents iframe")
        .wait(5000)
        .upload("#xe-fileupload",file)
        .evaluate((message) => {
            document.querySelector('#cke_1_contents iframe').contentWindow.document.body.querySelector('p').innerHTML =
                document.querySelector('#cke_1_contents iframe').contentWindow.document.body.querySelector('p').innerHTML + '<br><p>' + message.replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br/><br/>") + '</p>'
                //document.querySelector('#bd > form > div.regist > input.bd_btn.blue').click()
        },message)
        .wait(10000)
        .click('input.bd_btn.blue')
        .wait(5000)
        .then(function(result)
        {
            console.log("Next Post");
            setTimeout(function () {
                console.log('Successfully Posted')
                return start(nightmare,count,data,rows)
            },time);

        })
        .catch((error) => {
            setTimeout(function () {
                console.log('Error Commenting')
                return start(nightmare,count,data,rows)
            },time);

        });
    }



    });


});



server.listen( PORT, "127.0.0.1", 34, function(){
    console.log( "Server listening on port:%s", PORT );
});