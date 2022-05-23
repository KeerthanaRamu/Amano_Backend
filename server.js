const express = require('express');
var app = express();
var cors = require('cors')
const http = require("http");
const https = require("https");
const bodyparser = require('body-parser');
const path = require('path')
var db = require('./db');
const session=require('express-session');
const MySQLStore = require("express-mysql-session")(session);
const fs=require('fs');
var bcrypt = require('bcrypt')

app.use(cors({
    origin: ["https://localhost:4200","https://localhost:4500","https://localhost:4800"],
    methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD"],
    credentials: true,
}))

app.set(db);
app.use(bodyparser.json({limit: '50mb'}));
app.use(bodyparser.urlencoded({ extended: true }));

var sessionStore = new MySQLStore({
  expiration: 10800000,
  createDatabaseTable: true,
  schema:{
      tableName: 'sessiontbl',
      columnNames:{
          session_id: 'sesssion_id',
          expires: 'expires',
          data: 'data'
      }
  }
},db)

app.use( session({
  secret: 'mySecretSession',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite:'none', secure:true }
}))

app.use(express.static(__dirname + '/'));

app.use(express.static(path.join(__dirname, '../Minisedia-Amano-05-03-22-b4-GDL/dist/'))) // BUT ON PRODUCTION -> nginx

login = require('./expressRoutes/login');
instructor = require('./expressRoutes/instructor');
superAdmin = require('./expressRoutes/superadmin');
webRoutes = require('./expressRoutes/webRoutes');
applyLicense = require('./expressRoutes/applyLicense');
onlineCustomer = require('./expressRoutes/onlineCustomer');
report = require('./expressRoutes/report');


app.use('/login', login);
app.use('/instructor', instructor);
app.use('/superAdmin', superAdmin);
app.use('/webRoutes', webRoutes);
app.use('/applyLicense', applyLicense);
app.use('/onlineCustomer', onlineCustomer);
app.use('/report', report);



app.use(function (request, response, next) {
  response.header("Access-Control-Allow-Credentials", "true");
  response.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  response.header('Access-Control-Allow-Headers', 'Origin, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Response-Time, X-PINGOTHER, X-CSRF-Token,Authorization');
  response.header("Set-Cookie: cross-site-cookie=whatever; SameSite=None; Secure");
  next();
});

app.use((err, req, res, next)=> {
  console.log("I am-----500-----------")
  res.status(500);
  res.send("Oops, something went wrong.");
  next();
});

app.get('*', (req, res) => {
  return res.sendFile(path.join(__dirname, '../Minisedia-Amano-05-03-22-b4-GDL/dist/main/index.html'))
})

bcrypt.hash('su@123$',10, function(err, hash) {
  // console.log("hash====",hash)
})

var privatekey =  fs.readFileSync('C:/xampp/apache/crt/localhost/server.key', 'utf8');
var certificate=  fs.readFileSync('C:/xampp/apache/crt/localhost/server.crt', 'utf8');
var credentials = {key:privatekey,cert:certificate};
var httpsServer = https.createServer(credentials,app);

httpsServer.listen(8080);
// app.listen(4000, () =>
//   console.log('Express server is runnig  mysql at port no : 4000'));

