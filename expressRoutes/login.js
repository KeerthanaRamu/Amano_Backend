const express = require('express');
var router = express.Router();
var pool = require('../db');
const moment = require('moment');
const multer = require('multer');
const fs = require('fs');
var nodeMailer = require('nodemailer');
var configData = require('../config');
var appLink=configData.hostConfig.applicationLink;

var bcrypt = require('bcrypt')

const validateSession = (req,res,next)=>{
  if(!req.session.userInfo){
      res.status(200).send({'status':'Session Expired'});
  }else{
      next();
  }
}

let transporter = nodeMailer.createTransport({
//  service: 'gmail',
  host: 'mail.smamano.my',
  port: 465,
  secure: true,
  transportMethod: 'SMTP',
  auth: {
      user: 'info@smamano.my',
      pass: 'A5m4m4n01@'
  },  
});

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
      var baseRoot=req.body.baseRoot;
      console.log("baseRoot===================q",baseRoot)
      const dest= baseRoot;
      fs.access(dest, function (error) {
          if (error) {
            console.log("Directory does not exist.");
            return fs.mkdir(dest,{ recursive: true }, (error) => cb(error, dest));
          } else {
            console.log("Directory exists.");
            return cb(null, dest);
          }
        });
  },
  filename: (req, file, cb) => {
      console.log("file---iii---",file);
    cb(null, file.fieldname+'.'+(file.mimetype.split('/')[1]))
  }
});

let upload = multer({
  storage: storage
});


router.post('/getLoginUser', (req, res)=> {
  var username = req.body.username;
  var password = req.body.password;
    pool.query("SELECT a.*,b.role FROM employee_details a JOIN role_master b ON a.user_name='"+username+"' and a.password='"+password+"' and a.is_deleted=0 and a.role_id=b.id", function (err, empData) {
      if (err) {
          console.log("Problem with MySQL productcatalog",err);
      }
      if (empData) {
         if(empData.length > 0){
            req.session.userInfo=empData[0];
            console.log("req.session.userInfo======",req.session.userInfo)
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'data': empData });
         }else{
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'data': empData });
         }
         
      }
    })
    
});


router.get('/checkUserLoggedIn', (req, res)=> {
  if(req.session.userInfo){
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send({'status': 'Success','data':req.session.userInfo });
  }else{
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send({'data': 'Failure' });
  }
})

router.get('/logout', (req, res)=> {
  console.log("I am called to logout------------")
  req.session.destroy();
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send({'data': 'Success' });
})

router.post('/updateUserCredentials',validateSession, function (req, res) { //2db
  var userInfo = req.body.userInfo;
  if(userInfo.user_name == userInfo.new_username){
    pool.query("UPDATE employee_details SET password='"+userInfo.new_password+"' WHERE authToken='"+req.session.userInfo.authToken+"'", function (err, rows) {
      if (err) {
          console.log("Problem with MySQL productcatalog",err);
      }
      if (rows) {
          
          res.setHeader('Content-Type', 'application/json');
          res.status(200).send({'status':'Success'});
      }    
    });
  }else{
    pool.query("SELECT * FROM employee_details WHERE user_name='"+userInfo.new_username+"'", function (err, userExists) {
      if (err) {
          console.log("Problem with MySQL productcatalog",err);
      }
      if (userExists.length > 0) {
          res.setHeader('Content-Type', 'application/json');
          res.status(200).send({'status':'Already Exists'});
      }else{
        pool.query("UPDATE employee_details SET user_name='"+userInfo.new_username+"',password='"+userInfo.new_password+"' WHERE authToken='"+req.session.userInfo.authToken+"'", function (err, userdone) {
          if (err) {
              console.log("Problem with MySQL productcatalog",err);
          }
          if (userdone) {
            
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status':'Success'});
          }  
        })
      }    
    });
  }
});

router.post('/updateAccountDetails', validateSession,upload.single('file'),function (req, res) {  //2db
  console.log("calledddd")
  var baseRoot=req.body.baseRoot;
  var userInfo = JSON.parse(req.body.accountData);
  const file = req.file; 
  console.log("baseroot==========",baseRoot)
  console.log("correctedPath-----------",req.file)
  var q="";
  if(req.file){
    console.log("if=========");
    var correctedPath =  baseRoot+'/'+(file.fieldname+'.'+(file.mimetype.split('/')[1]));
    q="UPDATE employee_details SET name='"+userInfo.name+"',mobile_no='"+userInfo.mobile_no+"',email_id='"+userInfo.email_id+"',img='"+correctedPath+"' WHERE authToken='"+req.session.userInfo.authToken+"'"
  }else{
    console.log("else")
    q="UPDATE employee_details SET name='"+userInfo.name+"',mobile_no='"+userInfo.mobile_no+"',email_id='"+userInfo.email_id+"' WHERE authToken='"+req.session.userInfo.authToken+"'"
  }
  console.log(q)
    pool.query(q, function (err, rows) {
      if (err) {
          console.log("Problem with MySQL productcatalog",err);
      }
      if (rows) {
        
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send({'status':'Success'});
      } 
  });
})


router.post('/sendForgotPasswordLink', function (req, res) {
  var email_id=req.body.emailid;
  pool.query("SELECT * FROM employee_details WHERE email_id='"+email_id+"'", function (err, emailExists) {
      if (err) {
          console.log("Problem with MySQL productcatalog",err);
      }
      if(emailExists){
        console.log("emailExists====",emailExists)
          if(emailExists.length > 0){
              var tokenUrl=appLink+"/#/authentication/reset-password/"+emailExists[0].authToken;
              let mailOptions = {
                  from: 'info@smamano.my',
                  to: email_id, // list of receivers
                  subject: 'Forgot Password Mail', // Subject line
                  html:'<html><h3>Dear '+emailExists[0].name+',</h3><center><h2>Forgot Password</h2></center><br/><br/><center><p>Please click the below link to set your new password</p><a href='+tokenUrl+'>'+appLink+'/resetpassword</a></center></html>'    
              };
              function myNewFunc() {
                  transporter.sendMail(mailOptions, function (error, message) {
                      if (error) {
                          return console.log(error);
                      }
                      if (message) {
                          console.log("message Sent======",message);
                          res.setHeader('Content-Type', 'application/json');
                          res.status(200).send({'status': 'Success'});
                      }
                  })
              }
              setTimeout(myNewFunc, 1500);
          }else{
              res.setHeader('Content-Type', 'application/json');
              res.status(200).send({'status': 'Email Does Not Exists!!'});
          } 
      }
  })
});

router.post('/updatePasswordDetails', function (req, res) {
  var resetInfo=req.body.resetInfo;  
    pool.query("Update employee_details set password='"+resetInfo.password+"' where authToken='"+resetInfo.authToken+"'", function (err, updateStatus) {
      if (err) {
          console.log("Problem with MySQL productcatalog",err);
      }
      if(updateStatus){
          res.setHeader('Content-Type', 'application/json');
          res.status(200).send({'status':'Success'});
      }
  })
});

router.get('/getDashboardCount', function (req, res) {
 pool.query("SELECT COUNT(id) as TotalStudents FROM student_details WHERE  is_deleted=0", function (err, totalStudents) {
    if (err) {
        console.log("Problem with MySQL productcatalog",err);
    }
    if (totalStudents) {
      pool.query("SELECT COUNT(id) as NewStudents FROM student_details WHERE  is_deleted=0 and status_id IN(1,2)", function (err, newStudents) {
          if (err) {
              console.log("Problem with MySQL productcatalog",err);
          }
          if (newStudents) {
            pool.query("SELECT COUNT(id) as TotalEmployees FROM employee_details WHERE  is_deleted=0 and role_id NOT IN(1,2,3)", function (err, totalEmployees) {
                if (err) {
                    console.log("Problem with MySQL productcatalog",err);
                }
                if (totalEmployees) {
                  pool.query("SELECT SUM(payment_amount) as TotalRevenue FROM payment_details", function (err, totalRevenue) {
                      if (err) {
                          console.log("Problem with MySQL productcatalog",err);
                      }
                      if (totalRevenue) {
                          
                          res.setHeader('Content-Type', 'application/json');
                          res.status(200).send({'TotalStudents':(totalStudents.length > 0 ?totalStudents[0].TotalStudents : 0),
                          'NewStudents':(newStudents.length > 0 ?newStudents[0].NewStudents : 0),
                          'TotalEmployees':(totalEmployees.length >0 ?totalEmployees[0].TotalEmployees : 0),
                          'TotalRevenue':(totalRevenue.length > 0 ?totalRevenue[0].TotalRevenue:0)});
                      }    
                    });
                }    
              });
          }    
        });
    }    
  });
});


router.get('/getDashboardSalesReport', function (req, res) {
  var today=moment(new Date()).format("YYYY-MM-DD");
  var currentDate = new Date();
  var previousDate = currentDate.setDate(currentDate.getDate()- 1);
  var yesterday=moment(new Date(previousDate)).format("YYYY-MM-DD");
  var firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  var lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  var startDate=moment(new Date(firstDay)).format("YYYY-MM-DD");
  var endDate=moment(new Date(lastDay)).format("YYYY-MM-DD");
 pool.query("SELECT SUM(payment_amount)  as TodaySales FROM payment_details WHERE  DATE(payment_date)='"+today+"'", function (err, newSales) {
    if (err) {
        console.log("Problem with MySQL productcatalog",err);
    }
    if (newSales) {
      pool.query("SELECT SUM(payment_amount) as YesterdaySales FROM payment_details WHERE  DATE(payment_date)='"+yesterday+"'", function (err, oldSales) {
          if (err) {
              console.log("Problem with MySQL productcatalog",err);
          }
          if (oldSales) {
            pool.query("SELECT SUM(payment_amount) as MonthSales FROM payment_details WHERE  '" + startDate + "' <= DATE(payment_date) AND DATE(payment_date) <= '" + endDate + "'", function (err, monthSales) {
                if (err) {
                    console.log("Problem with MySQL productcatalog",err);
                }
                if (monthSales) {
                    
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).send({'TodaySales':(newSales.length > 0 ? newSales[0].TodaySales : 0),
                    'YesterdaySales':(oldSales.length > 0 ? oldSales[0].YesterdaySales: 0),
                    'MonthSales':(monthSales.length > 0 ? monthSales[0].MonthSales : 0)});
                  }    
              });
            }    
        });
      }    
  });
});


router.get('/getDashboardRegistrationReport', function (req, res) {
  var today=moment(new Date()).format("YYYY-MM-DD");
  var currentDate = new Date();
  var previousDate = currentDate.setDate(currentDate.getDate()- 1);
  var yesterday=moment(new Date(previousDate)).format("YYYY-MM-DD");
  var firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  var lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  var startDate=moment(new Date(firstDay)).format("YYYY-MM-DD");
  var endDate=moment(new Date(lastDay)).format("YYYY-MM-DD");
  pool.query("SELECT COUNT(id) as TodayStudents FROM student_details WHERE  is_deleted=0 and DATE(cur_date)='"+today+"'", function (err, newStudents) {
    if (err) {
        console.log("Problem with MySQL productcatalog",err);
    }
    if (newStudents) {
      pool.query("SELECT COUNT(id) as YesterdayStudents FROM student_details WHERE  is_deleted=0 and DATE(cur_date)='"+yesterday+"'", function (err, oldStudents) {
          if (err) {
              console.log("Problem with MySQL productcatalog",err);
          }
          if (oldStudents) {
            pool.query("SELECT COUNT(id) as MonthStudents FROM student_details WHERE  is_deleted=0 and '" + startDate + "' <= DATE(cur_date) AND DATE(cur_date) <= '" + endDate + "'", function (err, monthStudents) {
                if (err) {
                    console.log("Problem with MySQL productcatalog",err);
                }
                if (monthStudents) {
                    
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).send({'TodayStudents':(newStudents.length > 0 ? newStudents[0].TodayStudents : 0),
                    'YesterdayStudents':(oldStudents.length > 0 ? oldStudents[0].YesterdayStudents : 0),
                    'MonthStudents':(monthStudents.length > 0 ? monthStudents[0].MonthStudents : 0)});
                  }    
              });
            }    
        });
      }    
  });
});


router.get('/getStudentMonthlyReport', function (req, res) {
  pool.query("SELECT year(cur_date) as Year,month(cur_date) as Month,count(id) as Student from student_details group by year(cur_date),month(cur_date) order by year(cur_date),month(cur_date)", function (err, monthlyData) {
    if (err) {
        console.log("Problem with MySQL productcatalog",err);
    }
    if (monthlyData) {
      console.log("monthlyData------------",monthlyData);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).send({'data':monthlyData});
    }    
  });
});



router.get('/getSalesMonthlyReport', function (req, res) {
  pool.query("SELECT year(payment_date) as Year,month(payment_date) as Month,sum(payment_amount) as Sales from payment_details group by year(payment_date),month(payment_date) order by year(payment_date),month(payment_date)", function (err, monthlyData) {
    if (err) {
        console.log("Problem with MySQL productcatalog",err);
    }
    if (monthlyData) {
      
      res.setHeader('Content-Type', 'application/json');
      res.status(200).send({'data':monthlyData});
    }    
  });
});


module.exports = router;