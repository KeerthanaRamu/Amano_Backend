const express = require('express');
var router = express.Router();
const moment = require('moment');
var pool = require('../db');
var jwt = require('jsonwebtoken');
var ACCESS_TOKEN_SECRET = "0cf22951fd77561b6eef4587d187050604b8256ece9c9e5b13e3161529094cdcbc0c0c3056da254d975799bb93e3eeb818dd0623345683e8fad04e163ef54rtd";
var nodeMailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');
var configData = require('../config');
var smsConfig=configData.smsConfig;
var enrollPrefix=configData.hostConfig.enrollPrefix;
var receiptPrefix=configData.hostConfig.receiptPrefix;
var webLink=configData.hostConfig.websiteLink;
var async = require('async');
var  request=require('request');


Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

function getDates(startDate, stopDate, scheduleDt,dateArray) {
    var currentDate = startDate;
    while (currentDate <= stopDate) {
        dateArray.push({
            endDate:moment(new Date(currentDate)).format("YYYY-MM-DD hh:mm"),
            startDate:moment(new Date(currentDate)).format("YYYY-MM-DD hh:mm"),
            id:scheduleDt.id,
            status_id:scheduleDt.status_id,
            lead_time:scheduleDt.lead_time,
            schedule_view:scheduleDt.schedule_view,
            employee_id:scheduleDt.employee_id,
            timeslot:scheduleDt.timeslot,
            timeslot_bin:scheduleDt.timeslot_bin,
            TimeSlot:scheduleDt.TimeSlot,
            status:scheduleDt.status,
            schedule_color:scheduleDt.schedule_color
        });
        currentDate = currentDate.addDays(1);
    }
    return dateArray;
}

const validateSession = (req,res,next)=>{
    console.log("callled!!!!!",req.session)
    if(!req.session.studentInfo){
        console.log("ifffff")
        res.status(200).send({'status':'Session Expired'});
    }else{
        console.log("else")
        next();
    }
}

let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        var baseRoot='';
        var studNum='';
        if(req.session.studentInfo){
            baseRoot='root/Students'
            studNum=(req.session.studentInfo.nric_number != null ? req.session.studentInfo.nric_number : req.session.studentInfo.passport_number);
        }else{
            baseRoot=req.body.baseRoot;
            var studentDetails = JSON.parse(req.body.studentDetails);
            studNum=(studentDetails.nric_number ? studentDetails.nric_number :studentDetails.passport_number)
        }
        const dest= baseRoot+'/'+ ('stud-'+studNum);
        console.log("dest-----",dest)
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

let transporter = nodeMailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    transportMethod: 'SMTP',
    auth: {
        user: 'info@smamano.my',
        pass: 'A5m4m4n01@'
    },
    secureConnection: 'false',
    tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
    }
});

// -----------check student logged in state---------------

router.get('/checkStudentLoggedIn', (req, res)=> {
    console.log("called--------",req.session.studentInfo);
        if(req.session.studentInfo){
          res.setHeader('Content-Type', 'application/json');
          res.status(200).send(true);
        }else{  
          res.setHeader('Content-Type', 'application/json'); 
          res.status(200).send(false);
        }
}) 

// ---------------get logged in student information------------------

router.get('/getStudentInfo', (req, res)=> {
    console.log("called--------",req.session.studentInfo);
        if(req.session.studentInfo){
            var studData=req.session.studentInfo;
            var dob = new Date(studData.date_of_birth);
            var difdt = new Date(new Date() - dob);
            var age= (difdt.toISOString().slice(0, 4) - 1970);
            studData.age=age;
          res.setHeader('Content-Type', 'application/json');
          res.status(200).send(studData);
        }else{  
          res.setHeader('Content-Type', 'application/json'); 
          res.status(200).send(req.session.studentInfo);
        }
}) 
  

// -----------------student logout-------------------------

router.get('/Studentlogout', (req, res)=> {
    console.log("I am called to logout------------")
    req.session.destroy();
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(true);
})


// -------------------set student registration details------------------    

router.post('/setStudentDetails',upload.fields([{
    name: 'photo', maxCount: 1
  }, 
  {
    name: 'nricFront', maxCount: 1
  },
  {
    name: 'nricRear', maxCount: 1
  },
  {
    name: 'passportFront', maxCount: 1
  },
  {
    name: 'workPermit', maxCount: 1
  },

]), function (req, res) {
    var studentDetails = JSON.parse(req.body.studentDetails);
    var baseRoot=req.body.baseRoot;
    console.log("studentDetails==========online!!!!!!!!!!!==",studentDetails,baseRoot);
    var dob = moment(new Date(studentDetails.date_of_birth)).format("YYYY-MM-DD");
    var status=1;
    var q="";
    var studNum=(studentDetails.nric_number ? studentDetails.nric_number :studentDetails.passport_number)
    console.log("req.files===",req.files)
    var photo_path =   baseRoot+'/'+ ('stud-'+studNum)+ '/'+(req.files.photo[0].fieldname+'.'+(req.files.photo[0].mimetype.split('/')[1]));
    var nricFront_path = (req.files.nricFront ? baseRoot+'/'+ ('stud-'+studNum)+ '/'+(req.files.nricFront[0].fieldname+'.'+(req.files.nricFront[0].mimetype.split('/')[1])) : '') ;
    var nricRear_path =  (req.files.nricRear ? baseRoot+'/'+ ('stud-'+studNum)+ '/'+(req.files.nricRear[0].fieldname+'.'+(req.files.photo[0].mimetype.split('/')[1])): '');
    var passportFront_path = (req.files.passportFront ?  baseRoot+'/'+ ('stud-'+studNum)+ '/'+(req.files.passportFront[0].fieldname+'.'+(req.files.passportFront[0].mimetype.split('/')[1])): '');
    var workPermit_path =  (req.files.workPermit ? baseRoot+'/'+ ('stud-'+studNum)+ '/'+(req.files.workPermit[0].fieldname+'.'+(req.files.workPermit[0].mimetype.split('/')[1])): '');

    if(studentDetails.nric_number != ''){
        var authToken=jwt.sign({ usertoken: studentDetails.nric_number }, ACCESS_TOKEN_SECRET);
        q="INSERT INTO student_details(name,nric_type,nric_number,date_of_birth,gender,placebirth_id,nationality_id,address_nric,address1,address2,postalcode_id,city,state,email_id,mobile_number,race_id,other_race,other_placebirth,prefered_lang_id,emergency_name,emergency_number,user_name,password,status_id,profile_img,authToken,is_active)  VALUES ('"+studentDetails.name+"','"+studentDetails.nricType+"','"+studentDetails.nric_number+"','"+dob+"','"+studentDetails.gender+"','"+studentDetails.placeBirth+"','"+studentDetails.nationality+"','"+studentDetails.ic_address+"','"+studentDetails.address1+"','"+studentDetails.address2+"','"+studentDetails.postalCode+"','"+studentDetails.city+"','"+studentDetails.state+"','"+studentDetails.email_address+"','"+studentDetails.mobile_number+"','"+studentDetails.race+"','"+studentDetails.other_race+"','"+studentDetails.otherPlaceOfBirth+"','"+studentDetails.preference+"','"+studentDetails.emergency_name+"','"+studentDetails.emergency_number+"','"+studentDetails.user_name+"','"+studentDetails.password+"','"+status+"','"+photo_path+"','"+authToken+"',1)"
    }else{
        var authToken=jwt.sign({ usertoken: studentDetails.passport_number }, ACCESS_TOKEN_SECRET);
        q="INSERT INTO student_details(name,nric_type,passport_number,date_of_birth,gender,placebirth_id,nationality_id,address_nric,address1,address2,postalcode_id,city,state,email_id,mobile_number,race_id,other_race,other_placebirth,prefered_lang_id,emergency_name,emergency_number,user_name,password,status_id,profile_img,authToken,is_active)  VALUES ('"+studentDetails.name+"','"+studentDetails.nricType+"','"+studentDetails.passport_number+"','"+dob+"','"+studentDetails.gender+"','"+studentDetails.placeBirth+"','"+studentDetails.nationality+"','"+studentDetails.ic_address+"','"+studentDetails.address1+"','"+studentDetails.address2+"','"+studentDetails.postalCode+"','"+studentDetails.city+"','"+studentDetails.state+"','"+studentDetails.email_address+"','"+studentDetails.mobile_number+"','"+studentDetails.race+"','"+studentDetails.other_race+"','"+studentDetails.otherPlaceOfBirth+"','"+studentDetails.preference+"','"+studentDetails.emergency_name+"','"+studentDetails.emergency_number+"','"+studentDetails.user_name+"','"+studentDetails.password+"','"+status+"','"+photo_path+"','"+authToken+"',1)"
    }
    pool.query("SELECT * FROM student_details WHERE user_name='"+studentDetails.user_name+"' and is_deleted=0", function (err, userExists) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(userExists){
            if(userExists.length > 0){
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send({'status': 'Already Exists' });
            }else{
                pool.query(q, function (err, studentData) {
                    if (err) {
                        console.log("Problem with MySQL productcatalog",err);
                    }
                    if(studentData){
                        console.log("studentData====",studentData);
                        pool.query("INSERT INTO student_document_details (student_id,nric_front,nric_rear,passport_front,work_permit_front) VALUES ('"+studentData.insertId+"','"+nricFront_path+"','"+nricRear_path+"','"+passportFront_path+"','"+workPermit_path+"')", function (err, studentDocData) {
                            if (err) {
                                console.log("Problem with MySQL productcatalog",err);
                            }
                            if(studentDocData){
                                //pool.release();
                                res.setHeader('Content-Type', 'application/json');
                                res.status(200).send({'status': 'Success' });
                            }
                        })
                    }
                })
            }
        }
    })
  });

 
// ------------------to check NRIC Number already exists------------------

  router.post('/checkNRICExistence', function (req, res) {
    var nric_number=req.body.nric_number;
    pool.query("SELECT * FROM student_details WHERE nric_number='"+nric_number+"' and is_deleted=0", function (err, nricExists) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(nricExists){
            var statusDt=(nricExists.length > 0 ? 'Already Exists' : 'New');
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status':statusDt});
        }
    })
})

// ------------------to check Passport Number already exists------------------

router.post('/checkPassportExistence', function (req, res) {
    var passport_number=req.body.passport_number;
    pool.query("SELECT * FROM student_details WHERE passport_number='"+passport_number+"' and is_deleted=0", function (err, passportExists) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(passportExists){
            var statusDt=(passportExists.length > 0 ? 'Already Exists' : 'New');
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status':statusDt});
        }
    })
})

// ------------------to check Username already exists------------------

router.post('/checkUsernameExistence', function (req, res) {
    var user_name=req.body.user_name;
    pool.query("SELECT * FROM student_details WHERE user_name='"+user_name+"' and is_deleted=0", function (err, userExists) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(userExists){
            var statusDt=(userExists.length > 0 ? 'Already Exists' : 'New');
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status':statusDt});
        }
    })
})

// --------------------student login-------------------------

router.post('/getLoginInfo', function (req, res) {
  var user_name=req.body.user_name;
  var password=req.body.password;
  pool.query("SELECT id,name,email_id,mobile_number,authToken,nric_number,passport_number,prefered_lang_id,nric_type,date_of_birth FROM student_details WHERE user_name='"+user_name+"' and password='"+password+"' and is_deleted=0 and is_active=1", function (err, studentData) {
      if (err) {
          console.log("Problem with MySQL productcatalog",err);
      }
      if(studentData){
        if(studentData.length > 0){
            pool.query("SELECT type as prefered_language FROM preference_master WHERE id='"+studentData[0].prefered_lang_id+"'", function (err, prefData) {
                if (err) {
                    console.log("Problem with MySQL productcatalog",err);
                }
                if(prefData){
                    pool.query("SELECT COUNT(*) as total FROM student_license_details WHERE student_id='"+studentData[0].id+"'", function (err, licenseData) {
                        if (err) {
                            console.log("Problem with MySQL productcatalog",err);
                        }
                        if(licenseData){
                            let studStatus=(licenseData[0].total > 0 ? 'Exists' : 'New');
                            studentData[0].prefered_language=prefData[0].prefered_language;
                            req.session.studentInfo=studentData[0];
                            console.log("studentData[0].authToken==",req.session.studentInfo,studStatus);
                            res.setHeader('Content-Type', 'application/json');
                            res.status(200).send({'status':'Success','level':studStatus,'authToken':studentData[0]});
                        }
                    })
                }
            })
        }else{
            //pool.release();
          res.setHeader('Content-Type', 'application/json');
          res.status(200).send({'status':'Failure'});
        }
      }
  })
});

// ------------get license list before login-----------------

router.get('/getLicenseList', function (req, res) {
  pool.query("SELECT id,license_class,minimum_age,license_desc_english,license_desc_malay,license_image FROM license_details WHERE is_deleted=0", function (err, licenseData) {
      if (err) {
          console.log("Problem with MySQL productcatalog",err);
      }
      if(licenseData){
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(licenseData);
      }
  })
});

// ---------------get license list after login------------------------------

router.post('/getLicenseListForCustomer',validateSession, function (req, res) {
  var licenseInfo=req.body.licenseInfo;
  console.log("licenseInfo=====",licenseInfo);
  pool.query("SELECT date_of_birth as dateOfBirth FROM student_details WHERE authToken='"+req.session.studentInfo.authToken+"'", function (err, studData) {
    if (err) {
        console.log("Problem with MySQL productcatalog",err);
    }
    if(studData){
      if(studData.length > 0){
        var dob = new Date(studData[0].dateOfBirth);
        console.log("dob",dob);
        var difdt = new Date(new Date() - dob);
        var age= (difdt.toISOString().slice(0, 4) - 1970)
        pool.query("SELECT id,license_class,minimum_age,license_desc_english,license_desc_malay,license_image FROM license_details WHERE (minimum_age <= "+age+" OR minimum_age IS NULL)  and cdl_requirement="+licenseInfo.cdl_license+"  and is_deleted=0", function (err, licenseData) {
          if (err) {
              console.log("Problem with MySQL productcatalog",err);
          }
          if(licenseData){
            for(i=0;i<licenseData.length;i++){
                licenseData[i].selected=false;
                licenseData[i].license_category=null;
            }
              res.setHeader('Content-Type', 'application/json');
              res.status(200).send(licenseData);
          }
        })
      }else{
        //pool.release();
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send({'status':'Oops!! Something went wrong'}); 
      } 
    }
  })
});

router.post('/getLicenseListPerBaseLicense',validateSession, function (req, res) {
    var existingLicense=req.body.existingLicense;
    var licenseInfo=req.body.licenseInfo;
    var base_license=req.body.base_license;
    console.log("licenseInfo=====",existingLicense,licenseInfo,base_license);
    pool.query("SELECT date_of_birth as dateOfBirth FROM student_details WHERE authToken='"+req.session.studentInfo.authToken+"'", function (err, studData) {
      if (err) {
          console.log("Problem with MySQL productcatalog",err);
      }
      if(studData){
        if(studData.length > 0){
          var dob = new Date(studData[0].dateOfBirth);
          console.log("dob",dob);
          var difdt = new Date(new Date() - dob);
          var age= (difdt.toISOString().slice(0, 4) - 1970);
          if(existingLicense.existingLicense_id == 1){
              q="SELECT a.*,a.license_desc_english as english,a.license_desc_malay as malay FROM license_details a WHERE (a.minimum_age <= "+age+" OR a.minimum_age IS NULL)  and a.cdl_requirement="+licenseInfo.cdl_license+"  and a.is_deleted=0 and a.is_active=1 and a.id='"+base_license.id+"'"
          }else{
            if(licenseInfo.cdl_license == '0'){
              q="SELECT a.*,a.license_desc_english as english,a.license_desc_malay as malay,b.license_category FROM license_details a JOIN advance_license_details b ON (a.minimum_age <= "+age+" OR a.minimum_age IS NULL)  and a.cdl_requirement="+licenseInfo.cdl_license+"  and a.is_deleted=0 and a.is_active=1 and a.id=b.ext_license_id and b.license_id='"+base_license.id+"' and b.license_category='Upgrade'"
            }else if(licenseInfo.cdl_license == '1'){
              q="SELECT a.*,a.license_desc_english as english,a.license_desc_malay as malay,b.license_category FROM license_details a JOIN advance_license_details b ON (a.minimum_age <= "+age+" OR a.minimum_age IS NULL)  and a.cdl_requirement="+licenseInfo.cdl_license+"  and a.is_deleted=0 and a.is_active=1 and a.id=b.ext_license_id and b.license_id='"+base_license.id+"'"
            }
          }
          pool.query(q, function (err, licenseData) {
            if (err) {
                console.log("Problem with MySQL productcatalog",err);
            }
            if(licenseData){
                for(i=0;i<licenseData.length;i++){
                    licenseData[i].selected=false;
                }
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send(licenseData);
            }
          })
        }else{
          //pool.release();
          res.setHeader('Content-Type', 'application/json');
          res.status(200).send({'status':'Oops!! Something went wrong'}); 
        } 
      }
    })
  });   

// ----------------------get package information based on license-------------

router.post('/getPackageInfo',validateSession, function (req, res) {
        var licenseInfo=req.body.licenseInfo;
        var licenseInfo2=req.body.licenseInfo2;
        var licenseList=req.body.licenseList;
        console.log("licenseInfo---getpackinfo--",licenseInfo,licenseList);
        var q='';
        if(licenseInfo.existingLicense_id == 1){
            q="SELECT b.*,c.english,c.malay FROM package_license_details a JOIN package_details b ON a.license_id IN ("+licenseList+") and a.package_id=b.id and b.l_license=1 JOIN package_type_master c ON b.package_type_id=c.id GROUP BY b.id"
        }else if(licenseInfo.existingLicense_id == 2 || licenseInfo.existingLicense_id == 3){
            if(licenseInfo2.cdl_license == '0'){
                q="SELECT b.*,c.english,c.malay FROM package_license_details a JOIN package_details b ON a.license_id IN ("+licenseList+") and a.package_id=b.id and b.upgrade=1 JOIN package_type_master c ON b.package_type_id=c.id GROUP BY b.id"
            }else if(licenseInfo2.cdl_license == '1'){
                q="SELECT b.*,c.english,c.malay FROM package_license_details a JOIN package_details b ON a.license_id IN ("+licenseList+") and a.package_id=b.id and b.l_license!=1 JOIN package_type_master c ON b.package_type_id=c.id GROUP BY b.id"
            }
        }else{
            q="SELECT b.*,c.english,c.malay FROM package_license_details a JOIN package_details b ON a.license_id IN ("+licenseList+") and a.package_id=b.id and b.l_license!=1 and b.upgrade!=1 JOIN package_type_master c ON b.package_type_id=c.id GROUP BY b.id"
        }
    pool.query(q, function (err, packInfo) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(packInfo){
            console.log("packInfo----------",packInfo);
            if(packInfo.length > 0){
                var idx = 0;
                    function updateLicenseLi(){
                        async.eachOfSeries(packInfo, function() {
                            packdt = packInfo[idx];
                            pool.query("SELECT a.*,b.id as licenseid,b.license_class,b.license_desc_english,b.license_desc_malay FROM package_license_details a JOIN license_details b ON a.package_id='"+packdt.id+"' and a.license_id=b.id", function (err, licenseInfo) {
                                if (err) {
                                    console.log("Problem with MySQL productcatalog",err);
                                }
                                if(licenseInfo){
                                    console.log("licenseInfo---------",licenseInfo)
                                    packdt.licenseClasses=[];
                                    packdt.licenseList=licenseInfo;
                                    idx++;
                                    if(idx === packInfo.length){
                                        console.log("packInfo======",packInfo)
                                        res.setHeader('Content-Type', 'application/json');
                                        res.status(200).send({'status':'Success','data':packInfo});
                                    }else{
                                        updateLicenseLi();   
                                    }
                                }
                            })
                        })
                    }
                updateLicenseLi();
            }else{
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send({'status':'Success','data':packInfo});
            }
        }
    })
});

// --------------check student applied already-----------------

router.post('/checkLicenseApplied',validateSession, function (req, res) {
    var packDt=req.body.packDt;
    var gdlLicense=req.body.gdlLicense;
    var psvLicense=req.body.psvLicense;
    console.log("---------------",packDt,typeof gdlLicense,psvLicense);
    var license_process='';
    if(gdlLicense == true && psvLicense == false){
        license_process='GDL';
    }else if(gdlLicense == false && psvLicense == true){
        license_process='PSV'; 
    }else if(gdlLicense == false && psvLicense == false){
        license_process='PDL';
    }
    console.log("checklicense---------------","SELECT a.* FROM student_enroll_details a JOIN student_license_details b ON a.student_id='"+req.session.studentInfo.id+"' and a.student_id=b.student_id and a.id=b.enroll_id and b.license_id IN ("+packDt.licenseIdList+") and b.status_id NOT IN (17,18) and b.license_process='"+license_process+"'");
    pool.query("SELECT a.* FROM student_enroll_details a JOIN student_license_details b ON a.student_id='"+req.session.studentInfo.id+"' and a.student_id=b.student_id and a.id=b.enroll_id and b.license_id IN ("+packDt.licenseIdList+") and b.status_id NOT IN (17,18) and b.license_process='"+license_process+"'", function (err, existsPack) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(existsPack){
            if(existsPack.length > 0){
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send({'status': 'Already Done' });
            }else{
                pool.query("SELECT name,email_id,mobile_number FROM student_details WHERE id='"+req.session.studentInfo.id+"'", function (err, studData) {
                    if (err) {
                        console.log("Problem with MySQL productcatalog",err);
                    }
                    if(studData){
                        res.setHeader('Content-Type', 'application/json');
                        res.status(200).send({'status': 'Success','data': studData});
                    }
                })
            }
            
        }
    })
});

// ----------------get license flow image per license-------------------

router.post('/getLicenseFlowImage',validateSession, function (req, res) {
    var packDt=req.body.packDt;
    console.log("---------",packDt);
    console.log("SELECT b.id,b.license_class,b.license_desc_english,b.license_desc_malay,b.license_flow FROM package_license_details a JOIN license_details b ON a.package_id='"+packDt.id+"' and a.license_id=b.id")
    pool.query("SELECT b.id,b.license_class,b.license_desc_english,b.license_desc_malay,b.license_flow FROM package_license_details a JOIN license_details b ON a.package_id='"+packDt.id+"' and a.license_id=b.id", function (err, packInfo) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(packInfo){
            console.log("packInfo----------",packInfo)
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(packInfo);
        }
    })
});

// ------------------ student applying license----------------

router.post('/setStudentPackageDetails',validateSession,upload.fields([{
    name: 'existing_license_front', maxCount: 1
  }, 
  {
    name: 'existing_license_rear', maxCount: 1
  },
]), function (req, res) {
    
    var baseRoot='root/Students/'+('stud-'+req.session.studentInfo.nric_number != null ? req.session.studentInfo.nric_number : req.session.studentInfo.passport_number);
    var packDt=JSON.parse(req.body.packDt);
    console.log("setStudentPackageDetails------------------",packDt);
    var licenseInfo=JSON.parse(req.body.licenseInfo);
    var existingId=(licenseInfo.existingLicense_id ? licenseInfo.existingLicense_id : null);
    var curDate=moment(new Date()).format("YYYY-MM-DD hh:mm");
    var license_expiry = licenseInfo.expiry_date ? moment(new Date(licenseInfo.expiry_date)).format("YYYY-MM-DD") : '';
    var payamount=packDt.payment_phase == 1 ? packDt.final_package_price : packDt.first_phase_amount;
    var gdlLicense=req.body.gdlLicense;
    var psvLicense=req.body.psvLicense;
    var payment_status=packDt.payment_phase == 1 ? 'Completed' : 'First Phase';
    var q="";
    var tranId='';

    if(gdlLicense == 'true' || psvLicense == 'true'){
            // if(GDL_License == 'true' && PSV_License == 'true'){
            //     license_process='GDL-PSV';
            //     license_status='27';
            //     lStatus=['19','27'];
            // }else
            if(gdlLicense == 'true' && psvLicense == 'false'){
                license_process='GDL';
                license_status='19';
                //lStatus=['19'];
            }else if(gdlLicense == 'false' && psvLicense == 'true'){
                license_process='PSV';
                license_status='27';
                //lStatus=['27'];
            }
        
        console.log("studInfo--------------",packDt,gdlLicense,psvLicense);
        pool.query("SELECT enrollment_no FROM student_enroll_details ORDER BY id DESC LIMIT 1", function (err, licenDt) {
            if (err) {
                console.log("Problem with MySQL productcatalog",err);
            }
            if(licenDt){
                var curYear=new Date().getFullYear();
                console.log("curYear----",curYear)
                if(licenDt.length > 0){
                    if((licenDt[0].enrollment_no).split("-")[1]  == curYear){
                        tranId=(enrollPrefix+'-'+curYear+'-'+zeroPad((Number((licenDt[0].enrollment_no).split("-")[2])+1),5)+packDt.licensePrefix)
                    }else{
                        tranId=(enrollPrefix+'-'+curYear+'-00001'+packDt.licensePrefix);
                    }
                }else{
                    tranId=(enrollPrefix+'-'+curYear+'-00001'+packDt.licensePrefix);
                }
                var studNum=(req.session.nric_number ? req.session.nric_number :req.session.passport_number)                
                if(req.files.existing_license_front && req.files.existing_license_rear){
                    console.log("if------------------");
                    var existing_license_front_path =  baseRoot+'/'+ ('stud-'+studNum)+ '/'+(req.files.existing_license_front[0].fieldname+'.'+(req.files.existing_license_front[0].mimetype.split('/')[1]));
                    var existing_license_rear_path =  baseRoot+'/'+ ('stud-'+studNum)+ '/'+(req.files.existing_license_rear[0].fieldname+'.'+(req.files.existing_license_rear[0].mimetype.split('/')[1]));
                    q="INSERT INTO student_enroll_details(student_id,enrollment_no,package_id,package_price,existing_license_id,expiry_date,existing_license_front,existing_license_back,created_by,payment_phase)  VALUES ('"+req.session.studentInfo.id+"','"+tranId+"','"+packDt.id+"','"+packDt.final_package_price+"',"+existingId+",'"+license_expiry+"','"+existing_license_front_path+"','"+existing_license_rear_path+"','"+req.session.studentInfo.id+"','"+packDt.payment_phase+"')"
                }else if(req.files.existing_license_front && !req.files.existing_license_rear){
                    var existing_license_front_path =  baseRoot+'/'+ ('stud-'+studNum)+ '/'+(req.files.existing_license_front[0].fieldname+'.'+(req.files.existing_license_front[0].mimetype.split('/')[1]));
                    q="INSERT INTO student_enroll_details(student_id,enrollment_no,package_id,package_price,existing_license_id,expiry_date,existing_license_front,created_by,payment_phase)  VALUES ('"+req.session.studentInfo.id+"','"+tranId+"','"+packDt.id+"','"+packDt.final_package_price+"',"+existingId+",'"+license_expiry+"','"+existing_license_front_path+"','"+req.session.studentInfo.id+"','"+packDt.payment_phase+"')"
                }else if(!req.files.existing_license_front && req.files.existing_license_rear){
                    var existing_license_rear_path =  baseRoot+'/'+ ('stud-'+studNum)+ '/'+(req.files.existing_license_rear[0].fieldname+'.'+(req.files.existing_license_rear[0].mimetype.split('/')[1]));
                    q="INSERT INTO student_enroll_details(student_id,enrollment_no,package_id,package_price,existing_license_id,expiry_date,existing_license_back,created_by,payment_phase)  VALUES ('"+req.session.studentInfo.id+"','"+tranId+"','"+packDt.id+"','"+packDt.final_package_price+"',"+existingId+",'"+license_expiry+"','"+existing_license_rear_path+"','"+req.session.studentInfo.id+"','"+packDt.payment_phase+"')"
        
                }else{
                    q="INSERT INTO student_enroll_details(student_id,enrollment_no,package_id,package_price,created_by,payment_phase)  VALUES ('"+req.session.studentInfo.id+"','"+tranId+"','"+packDt.id+"','"+packDt.final_package_price+"','"+req.session.studentInfo.id+"','"+packDt.payment_phase+"')"
                }
                pool.query(q, function (err, setReg) {
                    if (err) {
                        console.log("Problem with MySQL productcatalog",err);
                    } 
                    if(setReg){
                        var enrollId=setReg.insertId;
                        packDt.licenseList.forEach((licData,idx)=>{
                            var license_cat= packDt.l_license == '1' ? 'L-License' : (packDt.upgrade == '1' ? 'Upgrade' : licData.license_category);
                            console.log("license----category=============",license_cat);
                            pool.query("INSERT INTO student_license_details(student_id,enroll_id,license_id,status_id,payment_status,final_price,first_phase_price,second_phase_price,third_phase_price,license_process,license_category) VALUES ('"+req.session.studentInfo.id+"','"+enrollId+"','"+licData.license_id+"',2,'"+payment_status+"','"+licData.license_price+"',"+(licData.first_phase_amount ? licData.first_phase_amount : null)+","+(licData.second_phase_amount ? licData.second_phase_amount :null)+","+(licData.third_phase_amount ? licData.third_phase_amount :null)+",'"+license_process+"','"+licData.license_category+"')", function (err, setenrollLicense) {
                                if (err) {
                                    console.log("Problem with MySQL productcatalog",err);
                                } 
                                if(setenrollLicense){
                                    pool.query("INSERT INTO student_status_details (student_id,enroll_id,license_id,status_id,completed_date,updated_by) VALUES ('"+req.session.studentInfo.id+"','"+enrollId+"','"+licData.license_id+"',2,'"+curDate+"','"+req.session.studentInfo.id+"')", function (err, statusData) {
                                        if (err) {
                                            console.log("Problem with MySQL productcatalog",err);
                                        }
                                        if(statusData){
                                            if(idx === packDt.licenseList.length-1){
                                                pool.query("SELECT * FROM student_details WHERE id='"+req.session.studentInfo.id+"'", function (err, studData) {
                                                    if (err) {
                                                        console.log("Problem with MySQL productcatalog",err);
                                                    }
                                                    if(studData){
                                                        var studFinal=studData[0];
                                                        studFinal['enrollment_no']=tranId;
                                                        res.setHeader('Content-Type', 'application/json');
                                                        res.status(200).send({'data': studFinal });
                                                    }
                                                })
                                            }
                                        }
                                    })
                                }
                            })
                        })
                    }
                })
            }
        })
    }else{
        pool.query("SELECT enrollment_no FROM student_enroll_details ORDER BY id DESC LIMIT 1", function (err, licenDt) {
            if (err) {
                console.log("Problem with MySQL productcatalog",err);
            }
            if(licenDt){
                var curYear=new Date().getFullYear();
                console.log("curYear----",curYear)
                if(licenDt.length > 0){
                    if((licenDt[0].enrollment_no).split("-")[1]  == curYear){
                        tranId=(enrollPrefix+'-'+curYear+'-'+zeroPad((Number((licenDt[0].enrollment_no).split("-")[2])+1),5)+packDt.licensePrefix)
                    }else{
                        tranId=(enrollPrefix+'-'+curYear+'-00001'+packDt.licensePrefix);
                    }
                }else{
                    tranId=(enrollPrefix+'-'+curYear+'-00001'+packDt.licensePrefix);
                }
                // var tranId=(licenDt.length > 0 ? ('SM-'+(Number((licenDt[0].enrollment_no).split("-")[1])+1)) : 'SM-10000');
                var studNum=(req.session.nric_number ? req.session.nric_number :req.session.passport_number)                
                if(req.files.existing_license_front && req.files.existing_license_rear){
                    console.log("if------------------");
                    var existing_license_front_path =  baseRoot+'/'+ ('stud-'+studNum)+ '/'+(req.files.existing_license_front[0].fieldname+'.'+(req.files.existing_license_front[0].mimetype.split('/')[1]));
                    var existing_license_rear_path =  baseRoot+'/'+ ('stud-'+studNum)+ '/'+(req.files.existing_license_rear[0].fieldname+'.'+(req.files.existing_license_rear[0].mimetype.split('/')[1]));
                    q="INSERT INTO student_enroll_details(student_id,enrollment_no,package_id,package_price,existing_license_id,expiry_date,existing_license_front,existing_license_back,created_by,payment_phase)  VALUES ('"+req.session.studentInfo.id+"','"+tranId+"','"+packDt.id+"','"+packDt.final_package_price+"',"+existingId+",'"+license_expiry+"','"+existing_license_front_path+"','"+existing_license_rear_path+"','"+req.session.studentInfo.id+"','"+packDt.payment_phase+"')"
                }else if(req.files.existing_license_front && !req.files.existing_license_rear){
                    var existing_license_front_path =  baseRoot+'/'+ ('stud-'+studNum)+ '/'+(req.files.existing_license_front[0].fieldname+'.'+(req.files.existing_license_front[0].mimetype.split('/')[1]));
                    q="INSERT INTO student_enroll_details(student_id,enrollment_no,package_id,package_price,existing_license_id,expiry_date,existing_license_front,created_by,payment_phase)  VALUES ('"+req.session.studentInfo.id+"','"+tranId+"','"+packDt.id+"','"+packDt.final_package_price+"',"+existingId+",'"+license_expiry+"','"+existing_license_front_path+"','"+req.session.studentInfo.id+"','"+packDt.payment_phase+"')"
                }else if(!req.files.existing_license_front && req.files.existing_license_rear){
                    var existing_license_rear_path =  baseRoot+'/'+ ('stud-'+studNum)+ '/'+(req.files.existing_license_rear[0].fieldname+'.'+(req.files.existing_license_rear[0].mimetype.split('/')[1]));
                    q="INSERT INTO student_enroll_details(student_id,enrollment_no,package_id,package_price,existing_license_id,expiry_date,existing_license_back,created_by,payment_phase)  VALUES ('"+req.session.studentInfo.id+"','"+tranId+"','"+packDt.id+"','"+packDt.final_package_price+"',"+existingId+",'"+license_expiry+"','"+existing_license_rear_path+"','"+req.session.studentInfo.id+"','"+packDt.payment_phase+"')"
        
                }else{
                    q="INSERT INTO student_enroll_details(student_id,enrollment_no,package_id,package_price,created_by,payment_phase)  VALUES ('"+req.session.studentInfo.id+"','"+tranId+"','"+packDt.id+"','"+packDt.final_package_price+"','"+req.session.studentInfo.id+"','"+packDt.payment_phase+"')"
                }
                pool.query(q, function (err, setReg) {
                    if (err) {
                        console.log("Problem with MySQL productcatalog",err);
                    } 
                    if(setReg){
                        var enrollId=setReg.insertId;
                        packDt.licenseList.forEach((licData,idx)=>{
                            var license_cat= packDt.l_license == '1' ? 'L-License' : (packDt.upgrade == '1' ? 'Upgrade' : licData.license_category);
                            console.log("license----category=============",license_cat);
                            pool.query("INSERT INTO student_license_details(student_id,enroll_id,license_id,status_id,payment_status,final_price,first_phase_price,second_phase_price,third_phase_price,license_process,license_category) VALUES ('"+req.session.studentInfo.id+"','"+enrollId+"','"+licData.license_id+"',2,'"+payment_status+"','"+licData.license_price+"',"+(licData.first_phase_amount ? licData.first_phase_amount : null)+","+(licData.second_phase_amount ? licData.second_phase_amount :null)+","+(licData.third_phase_amount ? licData.third_phase_amount :null)+",'PDL','"+licData.license_category+"')", function (err, setenrollLicense) {
                                if (err) {
                                    console.log("Problem with MySQL productcatalog",err);
                                } 
                                if(setenrollLicense){
                                    pool.query("INSERT INTO student_status_details (student_id,enroll_id,license_id,status_id,completed_date,updated_by) VALUES ('"+req.session.studentInfo.id+"','"+enrollId+"','"+licData.license_id+"',2,'"+curDate+"','"+req.session.studentInfo.id+"')", function (err, statusData) {
                                        if (err) {
                                            console.log("Problem with MySQL productcatalog",err);
                                        }
                                        if(statusData){
                                            if(idx === packDt.licenseList.length-1){
                                                pool.query("SELECT * FROM student_details WHERE id='"+req.session.studentInfo.id+"'", function (err, studData) {
                                                    if (err) {
                                                        console.log("Problem with MySQL productcatalog",err);
                                                    }
                                                    if(studData){
                                                        var studFinal=studData[0];
                                                        studFinal['enrollment_no']=tranId;
                                                        res.setHeader('Content-Type', 'application/json');
                                                        res.status(200).send({'data': studFinal });
                                                    }
                                                })
                                            }
                                        }
                                    })
                                }
                            })
                        })
                    }
                })
            }
        })
    }
}); 


// -------------------get Enrollment Number for Schedule-------------

router.get('/getEnrollmentNumberForSchedule',validateSession, function (req, res) {
  pool.query("SELECT a.* FROM student_enroll_details a WHERE a.student_id='"+req.session.studentInfo.id+"' and a.is_removed=0", function (err, enrollData) {
      if (err) {
          console.log("Problem with MySQL productcatalog",err);
      }
      if(enrollData){
          console.log("getScheduleDetails======",enrollData);
          //pool.release();
          res.setHeader('Content-Type', 'application/json');
          res.status(200).send({'enrollData':enrollData});
      }
  })
});

// -------------------get license list per enroll-----------------------------

router.post('/getLicenseListPerEnroll',validateSession, function (req, res) {
    var studentId=req.body.studentId;
    var enrollId=req.body.enrollId;
    // and a.status_id NOT IN (16,17,18)
    pool.query("SELECT a.student_id,a.enroll_id,a.license_id,a.status_id,a.result,a.license_process,a.license_category,b.license_class,c.status,c.test_flag FROM student_license_details a JOIN license_details b ON a.student_id='"+studentId+"' and a.enroll_id='"+enrollId+"' and a.license_id=b.id JOIN status_list c ON a.status_id=c.id", function (err, licenseData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(licenseData){
            // console.log("getScheduleDetails======",scheduleList);
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status':'Success','licenseData':licenseData});
               
        }
    })
});  


//-------------check payment done for GDL Process-------------------------

router.post('/checkPaymentDoneForGDLProcess',validateSession, function (req, res) {
    var studentInfo=req.body.studentInfo;
    console.log("studentInfo===11111111==",studentInfo);
    var amountToBePaid='';
    pool.query("SELECT a.payment_phase,b.final_price,b.first_phase_price,b.second_phase_price,b.third_phase_price,b.status_id,b.result,c.test_flag,d.id as packageid,d.package_english,d.package_malay,d.package_offers,d.package_desc_english,d.package_desc_malay,e.license_class,e.license_desc_english,e.license_desc_malay,e.gdl_practical,e.psv_practical FROM student_enroll_details a JOIN student_license_details b ON a.student_id='"+studentInfo.student_id+"' and a.id='"+studentInfo.enroll_id+"' and a.student_id=b.student_id and a.id=b.enroll_id and b.license_id='"+studentInfo.license_id+"' JOIN status_list c ON b.status_id=c.id JOIN package_details d ON a.package_id=d.id JOIN license_details e ON b.license_id=e.id", function (err, licenseData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        } 
        if(licenseData){
            console.log("licenseData====111111111111111111111111111=====",licenseData);
            var practicalFlow=(studentInfo.license_process == 'GDL' ? licenseData[0].gdl_practical : licenseData[0].psv_practical)

            if(licenseData[0].test_flag == 'T' || licenseData[0].test_flag == 'R'){
                if(licenseData[0].result == 'Fail'){
                    if(licenseData[0].test_flag == 'T'){
                        pool.query("SELECT a.id,a.status,b.retest_amount,b.no_of_retest FROM status_list a JOIN retest_payment_details b ON a.id > "+studentInfo.status_id+" and a.license_process='"+studentInfo.license_process+"' and a.test_flag IN ('R') and a.id=b.status_id and b.license_id='"+studentInfo.license_id+"' and b.package_offers='"+licenseData[0].package_offers+"'  and b.is_deleted=0 ORDER BY a.id ASC LIMIT 1", function (err, retestAmt) {
                            if (err) {
                                console.log("Problem with MySQL productcatalog",err);
                            }
                            if(retestAmt){
                                if(retestAmt.length > 0){
                                    var no_of_retest=retestAmt[0].no_of_retest;
                                    pool.query("SELECT * FROM payment_details WHERE enroll_id='"+studentInfo.enroll_id+"' and license_id='"+studentInfo.license_id+"' and status_id='"+studentInfo.status_id+"' and payment_flag='Pay' and payment_status='Success'", function (err, payLength) {
                                        if (err) {
                                            console.log("Problem with MySQL productcatalog",err);
                                        }
                                        if(payLength){
                                            pool.query("SELECT * FROM student_status_details WHERE enroll_id='"+studentInfo.enroll_id+"' and license_id='"+studentInfo.license_id+"' and status_id='"+studentInfo.status_id+"' and result='Fail'", function (err, statusLength) {
                                                if (err) {
                                                    console.log("Problem with MySQL productcatalog",err);
                                                }
                                                if(statusLength){
                                                    if(statusLength.length <= Number(no_of_retest)){
                                                        res.setHeader('Content-Type', 'application/json');
                                                        res.status(200).send({'status':'Success','LicenseData':licenseData,'amountToBePaid':retestAmt[0].retest_amount,'nextStatus':retestAmt});
                                                    }else{
                                                        if(payLength.length == Number(statusLength.length - Number(no_of_retest))){
                                                            res.setHeader('Content-Type', 'application/json');
                                                            res.status(200).send({'status':'Success','LicenseData':licenseData,'amountToBePaid':retestAmt[0].retest_amount,'nextStatus':retestAmt});
                                                        }else{
                                                            res.setHeader('Content-Type', 'application/json');
                                                            res.status(200).send({'status':'Pay','LicenseData':licenseData,'amountToBePaid':retestAmt[0].retest_amount,'nextStatus':retestAmt});
                                                        }
                                                    }
                                                  
                                                }
                                            })
                                        }
                                    })
                                }else{
                                    res.setHeader('Content-Type', 'application/json');
                                    res.status(200).send({'status':'Pay Not Found','LicenseData':licenseData,'amountToBePaid':0,'nextStatus':retestAmt});
                                }
                                
                            }
                        })
                    }else if(licenseData[0].test_flag == 'R'){
                        pool.query("SELECT a.status_id,a.retest_amount,b.id,b.status,a.no_of_retest FROM retest_payment_details a JOIN status_list b ON a.status_id='"+studentInfo.status_id+"' and a.license_id='"+studentInfo.license_id+"' and a.package_offers='"+licenseData[0].package_offers+"' and a.is_deleted=0 and a.status_id=b.id", function (err, retestAmt) {
                            if (err) {
                                console.log("Problem with MySQL productcatalog",err);
                            }
                            if(retestAmt){
                                if(retestAmt.length > 0){
                                    var no_of_retest=retestAmt[0].no_of_retest;
                                    pool.query("SELECT * FROM payment_details WHERE enroll_id='"+studentInfo.enroll_id+"' and license_id='"+studentInfo.license_id+"' and status_id='"+studentInfo.status_id+"' and payment_flag='Pay' and payment_status='Success'", function (err, payLength) {
                                        if (err) {
                                            console.log("Problem with MySQL productcatalog",err);
                                        }
                                        if(payLength){
                                            pool.query("SELECT * FROM student_status_details WHERE enroll_id='"+studentInfo.enroll_id+"' and license_id='"+studentInfo.license_id+"' and status_id='"+studentInfo.status_id+"' and result='Fail'", function (err, statusLength) {
                                                if (err) {
                                                    console.log("Problem with MySQL productcatalog",err);
                                                }
                                                if(statusLength){
                                                    if(statusLength.length <= Number(no_of_retest)){
                                                        res.setHeader('Content-Type', 'application/json');
                                                        res.status(200).send({'status':'Success','LicenseData':licenseData,'amountToBePaid':retestAmt[0].retest_amount,'nextStatus':retestAmt});
                                                    }else{
                                                        if(payLength.length == Number(statusLength.length - Number(no_of_retest))){
                                                            res.setHeader('Content-Type', 'application/json');
                                                            res.status(200).send({'status':'Success','LicenseData':licenseData,'amountToBePaid':retestAmt[0].retest_amount,'nextStatus':retestAmt});
                                                        }else{
                                                            res.setHeader('Content-Type', 'application/json');
                                                            res.status(200).send({'status':'Pay','LicenseData':licenseData,'amountToBePaid':retestAmt[0].retest_amount,'nextStatus':retestAmt});
                                                        }
                                                    }
                                                    
                                                }
                                            })
                                        }
                                    })
                                }else{
                                    res.setHeader('Content-Type', 'application/json');
                                    res.status(200).send({'status':'Pay Not Found','LicenseData':licenseData,'amountToBePaid':0,'nextStatus':retestAmt});
                                }
                                
                            }
                        })
                    }
                }else if(licenseData[0].result == 'Pass'){
                    var qp='';
                    if(practicalFlow == 1){
                        qp="SELECT id,status FROM status_list WHERE id > "+studentInfo.status_id+" and license_process='"+studentInfo.license_process+"'and test_flag NOT IN ('R') ORDER BY id ASC LIMIT 1"
                    }else{
                        if(studentInfo.license_process == 'GDL'){
                            qp="SELECT id,status FROM status_list WHERE id > "+studentInfo.status_id+" and license_process='"+studentInfo.license_process+"'and test_flag NOT IN ('R') and id NOT IN (23,24,25) ORDER BY id ASC LIMIT 1"
                        }else{
                            qp="SELECT id,status FROM status_list WHERE id > "+studentInfo.status_id+" and license_process='"+studentInfo.license_process+"'and test_flag NOT IN ('R') and id NOT IN (31,32,33) ORDER BY id ASC LIMIT 1"
                        }
                    }
                    pool.query(qp, function (err, nextStatus) {
                        if (err) {
                            console.log("Problem with MySQL productcatalog",err);
                        }
                        if(nextStatus){
                            console.log("nextStatus=====",nextStatus);
                            if(nextStatus.length > 0){
                                res.setHeader('Content-Type', 'application/json');
                                res.status(200).send({'status':'Success','LicenseData':licenseData,'amountToBePaid':amountToBePaid,'nextStatus':nextStatus});
                            }else{
                                res.setHeader('Content-Type', 'application/json');
                                res.status(200).send({'status':'Completed','LicenseData':licenseData,'amountToBePaid':amountToBePaid,'nextStatus':nextStatus}); 
                            }
                        }
                    })
                }
            }else{
                var qp1='';
                    if(practicalFlow == 1){
                        qp1="SELECT id,status FROM status_list WHERE id > "+studentInfo.status_id+" and license_process='"+studentInfo.license_process+"' ORDER BY id ASC LIMIT 1"
                    }else{
                        if(studentInfo.license_process == 'GDL'){
                            qp1="SELECT id,status FROM status_list WHERE id > "+studentInfo.status_id+" and license_process='"+studentInfo.license_process+"' and id NOT IN (23,24,25) ORDER BY id ASC LIMIT 1"
                        }else{
                            qp1="SELECT id,status FROM status_list WHERE id > "+studentInfo.status_id+" and license_process='"+studentInfo.license_process+"' and id NOT IN (31,32,33) ORDER BY id ASC LIMIT 1"
                        }
                    }
                pool.query(qp1, function (err, nextStatus) {
                    if (err) {
                        console.log("Problem with MySQL productcatalog",err);
                    }
                    if(nextStatus){
                        console.log("nextStatus=====",nextStatus);
                        if(nextStatus.length > 0){
                            res.setHeader('Content-Type', 'application/json');
                            res.status(200).send({'status':'Success','LicenseData':licenseData,'amountToBePaid':amountToBePaid,'nextStatus':nextStatus});
                        }else{
                            res.setHeader('Content-Type', 'application/json');
                            res.status(200).send({'status':'Completed','LicenseData':licenseData,'amountToBePaid':amountToBePaid,'nextStatus':nextStatus}); 
                        }
                    }
                })
            }
        }
    })
})

//-------------check payment done for PDL Process-------------------------

router.post('/checkPaymentDone',validateSession, function (req, res) {
    var studentInfo=req.body.studentInfo;
    console.log("studentInfo===11111111==",studentInfo);
    var q="";
    if(studentInfo.license_category == 'Upgrade' || studentInfo.license_category == 'Advance' || studentInfo.license_category == 'L-License'){
        var statusId=studentInfo.status_id == 3 ? 7 :studentInfo.status_id;
        q="SELECT id,status FROM status_list WHERE id > "+statusId+" and license_process='"+studentInfo.license_process+"' ORDER BY id ASC LIMIT 1";
    }else{
        q="SELECT id,status FROM status_list WHERE id > "+studentInfo.status_id+" and license_process='"+studentInfo.license_process+"' ORDER BY id ASC LIMIT 1";
    }
    var amountToBePaid='';
    pool.query("SELECT a.payment_phase,b.final_price,b.first_phase_price,b.second_phase_price,b.third_phase_price,b.status_id,b.result,c.test_flag,d.id as packageid,d.package_english,d.package_malay,d.package_offers,d.package_desc_english,d.package_desc_malay,e.license_class,e.license_desc_english,e.license_desc_malay FROM student_enroll_details a JOIN student_license_details b ON a.student_id='"+studentInfo.student_id+"' and a.id='"+studentInfo.enroll_id+"' and a.student_id=b.student_id and a.id=b.enroll_id and b.license_id='"+studentInfo.license_id+"' JOIN status_list c ON b.status_id=c.id JOIN package_details d ON a.package_id=d.id JOIN license_details e ON b.license_id=e.id", function (err, licenseData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        } 
        if(licenseData){
            console.log("licenseData===000000000000000======",licenseData);
            if(licenseData[0].test_flag == 'T' || licenseData[0].test_flag == 'R'){
                if(licenseData[0].result == 'Fail'){
                    if(licenseData[0].test_flag == 'T'){
                        console.log("SELECT a.id,a.status,b.retest_amount,b.no_of_retest FROM status_list a JOIN retest_payment_details b ON a.id > "+studentInfo.status_id+" and a.license_process='"+studentInfo.license_process+"' and a.test_flag IN ('R') and a.id=b.status_id and b.license_id='"+studentInfo.license_id+"' and b.package_offers='"+licenseData[0].package_offers+"' and b.is_deleted=0 ORDER BY a.id ASC LIMIT 1")
                        pool.query("SELECT a.id,a.status,b.retest_amount,b.no_of_retest FROM status_list a JOIN retest_payment_details b ON a.id > "+studentInfo.status_id+" and a.license_process='"+studentInfo.license_process+"' and a.test_flag IN ('R') and a.id=b.status_id and b.license_id='"+studentInfo.license_id+"' and b.package_offers='"+licenseData[0].package_offers+"' and b.is_deleted=0 ORDER BY a.id ASC LIMIT 1", function (err, retestAmt) { //later
                            if (err) {
                                console.log("Problem with MySQL productcatalog",err);
                            }
                            if(retestAmt){
                                if(retestAmt.length > 0){
                                    var no_of_retest=retestAmt[0].no_of_retest;
                                    console.log("no_of_retest----,",no_of_retest)
                                    pool.query("SELECT * FROM payment_details WHERE enroll_id='"+studentInfo.enroll_id+"' and license_id='"+studentInfo.license_id+"' and status_id='"+studentInfo.status_id+"' and payment_flag='Pay' and payment_status='Success'", function (err, payLength) {
                                        if (err) {
                                            console.log("Problem with MySQL productcatalog",err);
                                        }
                                        if(payLength){
                                            pool.query("SELECT * FROM student_status_details WHERE enroll_id='"+studentInfo.enroll_id+"' and license_id='"+studentInfo.license_id+"' and status_id='"+studentInfo.status_id+"' and result='Fail'", function (err, statusLength) {
                                                if (err) {
                                                    console.log("Problem with MySQL productcatalog",err);
                                                }
                                                if(statusLength){
                                                    console.log("----f------,",payLength,statusLength)
                                                    if(statusLength.length <= Number(no_of_retest)){
                                                        res.setHeader('Content-Type', 'application/json');
                                                        res.status(200).send({'status':'Success','LicenseData':licenseData,'amountToBePaid':retestAmt[0].retest_amount,'nextStatus':retestAmt});
                                                    }else{
                                                        if(payLength.length == Number(statusLength.length - Number(no_of_retest))){
                                                            res.setHeader('Content-Type', 'application/json');
                                                            res.status(200).send({'status':'Success','LicenseData':licenseData,'amountToBePaid':retestAmt[0].retest_amount,'nextStatus':retestAmt});
                                                        }else{
                                                            res.setHeader('Content-Type', 'application/json');
                                                            res.status(200).send({'status':'Pay','LicenseData':licenseData,'amountToBePaid':retestAmt[0].retest_amount,'nextStatus':retestAmt});
                                                        }
                                                    }
                                                   
                                                }
                                            })
                                        }
                                    })
                                }else{
                                    res.setHeader('Content-Type', 'application/json');
                                    res.status(200).send({'status':'Pay Not Found','LicenseData':licenseData,'amountToBePaid':0,'nextStatus':retestAmt});
                                }
                                
                            }
                        })
                    }else if(licenseData[0].test_flag == 'R'){
                        pool.query("SELECT a.status_id,a.retest_amount,b.id,b.status,a.no_of_retest FROM retest_payment_details a JOIN status_list b ON a.status_id='"+studentInfo.status_id+"' and a.license_id='"+studentInfo.license_id+"' and a.package_offers='"+licenseData[0].package_offers+"' and a.is_deleted=0 and a.status_id=b.id", function (err, retestAmt) {
                            if (err) {
                                console.log("Problem with MySQL productcatalog",err);
                            }
                            if(retestAmt){
                                if(retestAmt.length > 0){
                                    var no_of_retest=retestAmt[0].no_of_retest;
                                    pool.query("SELECT * FROM payment_details WHERE enroll_id='"+studentInfo.enroll_id+"' and license_id='"+studentInfo.license_id+"' and status_id='"+studentInfo.status_id+"' and payment_flag='Pay' and payment_status='Success'", function (err, payLength) {
                                        if (err) {
                                            console.log("Problem with MySQL productcatalog",err);
                                        }
                                        if(payLength){
                                            pool.query("SELECT * FROM student_status_details WHERE enroll_id='"+studentInfo.enroll_id+"' and license_id='"+studentInfo.license_id+"' and status_id='"+studentInfo.status_id+"' and result='Fail'", function (err, statusLength) {
                                                if (err) {
                                                    console.log("Problem with MySQL productcatalog",err);
                                                }
                                                if(statusLength){
                                                    if(statusLength.length <= Number(no_of_retest)){
                                                        res.setHeader('Content-Type', 'application/json');
                                                        res.status(200).send({'status':'Success','LicenseData':licenseData,'amountToBePaid':retestAmt[0].retest_amount,'nextStatus':retestAmt});
                                                    }else{
                                                        if(payLength.length == Number(statusLength.length - Number(no_of_retest))){
                                                            res.setHeader('Content-Type', 'application/json');
                                                            res.status(200).send({'status':'Success','LicenseData':licenseData,'amountToBePaid':retestAmt[0].retest_amount,'nextStatus':retestAmt});
                                                        }else{
                                                            res.setHeader('Content-Type', 'application/json');
                                                            res.status(200).send({'status':'Pay','LicenseData':licenseData,'amountToBePaid':retestAmt[0].retest_amount,'nextStatus':retestAmt});
                                                        }
                                                    }
                                                    
                                                }
                                            })
                                        }
                                    })
                                }else{
                                    res.setHeader('Content-Type', 'application/json');
                                    res.status(200).send({'status':'Pay Not Found','LicenseData':licenseData,'amountToBePaid':0,'nextStatus':retestAmt});
                                }
                                
                            }
                        })
                    }
                }else if(licenseData[0].result == 'Pass'){
                    pool.query("SELECT id,status FROM status_list WHERE id > "+studentInfo.status_id+" and license_process='"+studentInfo.license_process+"'and test_flag NOT IN ('R') ORDER BY id ASC LIMIT 1", function (err, nextStatus) {
                        if (err) {
                            console.log("Problem with MySQL productcatalog",err);
                        }
                        if(nextStatus){
                            console.log("nextStatus=====",nextStatus);
                            if(nextStatus.length > 0){
                                if(licenseData[0].payment_phase == 1){
                                    if(nextStatus[0].id == 4){ //KPP01
                                        amountToBePaid=licenseData[0].final_price;
                                        console.log("if----------------")
                                        pool.query("SELECT * FROM payment_details WHERE enroll_id='"+studentInfo.enroll_id+"' and license_id='"+studentInfo.license_id+"' and status_id='"+studentInfo.status_id+"' and payment_flag='Pay' and payment_status='Success'", function (err, firstPay) {
                                            if (err) {
                                                console.log("Problem with MySQL productcatalog",err);
                                            }
                                            if(firstPay){
                                                if(firstPay.length>0){
                                                    res.setHeader('Content-Type', 'application/json');
                                                    res.status(200).send({'status':'Success','LicenseData':licenseData,'amountToBePaid':amountToBePaid,'nextStatus':nextStatus});
                                                }else{
                                                    res.setHeader('Content-Type', 'application/json');
                                                    res.status(200).send({'status':'Pay','LicenseData':licenseData,'amountToBePaid':amountToBePaid,'nextStatus':nextStatus});
                                                }
                                            }
                                        })
                                    }else{
                                        res.setHeader('Content-Type', 'application/json');
                                        res.status(200).send({'status':'Success','LicenseData':licenseData,'amountToBePaid':amountToBePaid,'nextStatus':nextStatus});
                                    }
                                }else if(licenseData[0].payment_phase == 2){
                                    var statusAvail=[4,11]; //KPP01,QTI Test
                                    amountToBePaid=(nextStatus[0].id == 4 ? licenseData[0].first_phase_price : licenseData[0].second_phase_price);
                                    console.log("2-------------------")
                                    if(statusAvail.includes(nextStatus[0].id)){
                                        pool.query("SELECT * FROM payment_details WHERE enroll_id='"+studentInfo.enroll_id+"' and license_id='"+studentInfo.license_id+"' and status_id='"+studentInfo.status_id+"' and payment_flag='Pay' and payment_status='Success'", function (err, secondPay) {
                                            if (err) {
                                                console.log("Problem with MySQL productcatalog",err);
                                            }
                                            if(secondPay){
                                                if(secondPay.length>0){
                                                    res.setHeader('Content-Type', 'application/json');
                                                    res.status(200).send({'status':'Success','LicenseData':licenseData,'amountToBePaid':amountToBePaid,'nextStatus':nextStatus});
                                                }else{
                                                    res.setHeader('Content-Type', 'application/json');
                                                    res.status(200).send({'status':'Pay','LicenseData':licenseData,'amountToBePaid':amountToBePaid,'nextStatus':nextStatus});
                                                }
                                            }
                                        })
                                    }else{
                                        res.setHeader('Content-Type', 'application/json');
                                        res.status(200).send({'status':'Success','LicenseData':licenseData,'amountToBePaid':amountToBePaid,'nextStatus':nextStatus});
                                    }
                                }else if(licenseData[0].payment_phase == 3){
                                    var statusAvail=[4,8,11]; //KPP01,KPP02,QTI Test
                                    console.log("3---------------------");
                                    amountToBePaid=(nextStatus[0].id == 4 ? licenseData[0].first_phase_price : (nextStatus[0].id == 8 ? licenseData[0].second_phase_price : licenseData[0].third_phase_price));
                                    if(statusAvail.includes(nextStatus[0].id)){
                                        pool.query("SELECT * FROM payment_details WHERE enroll_id='"+studentInfo.enroll_id+"' and license_id='"+studentInfo.license_id+"' and status_id='"+studentInfo.status_id+"' and payment_flag='Pay' and payment_status='Success'", function (err, ThirdPay) {
                                            if (err) {
                                                console.log("Problem with MySQL productcatalog",err);
                                            }
                                            if(ThirdPay){
                                                if(ThirdPay.length>0){
                                                    res.setHeader('Content-Type', 'application/json');
                                                    res.status(200).send({'status':'Success','LicenseData':licenseData,'amountToBePaid':amountToBePaid,'nextStatus':nextStatus});
                                                }else{
                                                    res.setHeader('Content-Type', 'application/json');
                                                    res.status(200).send({'status':'Pay','LicenseData':licenseData,'amountToBePaid':amountToBePaid,'nextStatus':nextStatus});
                                                }
                                            }
                                        })
                                    }else{
                                        res.setHeader('Content-Type', 'application/json');
                                        res.status(200).send({'status':'Success','LicenseData':licenseData,'amountToBePaid':amountToBePaid,'nextStatus':nextStatus});
                                    }
                                }
                                
                            }else{
                                res.setHeader('Content-Type', 'application/json');
                                res.status(200).send({'status':'Completed','LicenseData':licenseData,'amountToBePaid':amountToBePaid,'nextStatus':nextStatus}); 
                            }
                        }
                    })
                }
            }else{
                pool.query(q, function (err, nextStatus) {
                    if (err) {
                        console.log("Problem with MySQL productcatalog",err);
                    }
                    if(nextStatus){
                        console.log("nextStatus=====",nextStatus);
                        if(nextStatus.length > 0){
                            if(licenseData[0].payment_phase == 1){
                                if(nextStatus[0].id == 4){ //KPP01
                                    amountToBePaid=licenseData[0].final_price;
                                    console.log("if----------------")
                                    pool.query("SELECT * FROM payment_details WHERE enroll_id='"+studentInfo.enroll_id+"' and license_id='"+studentInfo.license_id+"' and status_id='"+studentInfo.status_id+"' and payment_flag='Pay' and payment_status='Success'", function (err, firstPay) {
                                        if (err) {
                                            console.log("Problem with MySQL productcatalog",err);
                                        }
                                        if(firstPay){
                                            if(firstPay.length>0){
                                                res.setHeader('Content-Type', 'application/json');
                                                res.status(200).send({'status':'Success','LicenseData':licenseData,'amountToBePaid':amountToBePaid,'nextStatus':nextStatus});
                                            }else{
                                                res.setHeader('Content-Type', 'application/json');
                                                res.status(200).send({'status':'Pay','LicenseData':licenseData,'amountToBePaid':amountToBePaid,'nextStatus':nextStatus});
                                            }
                                        }
                                    })
                                }else{
                                    res.setHeader('Content-Type', 'application/json');
                                    res.status(200).send({'status':'Success','LicenseData':licenseData,'amountToBePaid':amountToBePaid,'nextStatus':nextStatus});
                                }
                            }else if(licenseData[0].payment_phase == 2){
                                var statusAvail=[4,11]; //KPP01,QTI Test
                                amountToBePaid=(nextStatus[0].id == 4 ? licenseData[0].first_phase_price : licenseData[0].second_phase_price);
                                console.log("2-------------------")
                                if(statusAvail.includes(nextStatus[0].id)){
                                    pool.query("SELECT * FROM payment_details WHERE enroll_id='"+studentInfo.enroll_id+"' and license_id='"+studentInfo.license_id+"' and status_id='"+studentInfo.status_id+"' and payment_flag='Pay' and payment_status='Success'", function (err, secondPay) {
                                        if (err) {
                                            console.log("Problem with MySQL productcatalog",err);
                                        }
                                        if(secondPay){
                                            if(secondPay.length>0){
                                                res.setHeader('Content-Type', 'application/json');
                                                res.status(200).send({'status':'Success','LicenseData':licenseData,'amountToBePaid':amountToBePaid,'nextStatus':nextStatus});
                                            }else{
                                                res.setHeader('Content-Type', 'application/json');
                                                res.status(200).send({'status':'Pay','LicenseData':licenseData,'amountToBePaid':amountToBePaid,'nextStatus':nextStatus});
                                            }
                                        }
                                    })
                                }else{
                                    res.setHeader('Content-Type', 'application/json');
                                    res.status(200).send({'status':'Success','LicenseData':licenseData,'amountToBePaid':amountToBePaid,'nextStatus':nextStatus});
                                }
                            }else if(licenseData[0].payment_phase == 3){
                                var statusAvail=[4,8,11]; //KPP01,KPP02,QTI Test
                                console.log("3---------------------");
                                amountToBePaid=(nextStatus[0].id == 4 ? licenseData[0].first_phase_price : (nextStatus[0].id == 8 ? licenseData[0].second_phase_price : licenseData[0].third_phase_price));
                                if(statusAvail.includes(nextStatus[0].id)){
                                    pool.query("SELECT * FROM payment_details WHERE enroll_id='"+studentInfo.enroll_id+"' and license_id='"+studentInfo.license_id+"' and status_id='"+studentInfo.status_id+"' and payment_flag='Pay' and payment_status='Success'", function (err, ThirdPay) {
                                        if (err) {
                                            console.log("Problem with MySQL productcatalog",err);
                                        }
                                        if(ThirdPay){
                                            if(ThirdPay.length>0){
                                                res.setHeader('Content-Type', 'application/json');
                                                res.status(200).send({'status':'Success','LicenseData':licenseData,'amountToBePaid':amountToBePaid,'nextStatus':nextStatus});
                                            }else{
                                                res.setHeader('Content-Type', 'application/json');
                                                res.status(200).send({'status':'Pay','LicenseData':licenseData,'amountToBePaid':amountToBePaid,'nextStatus':nextStatus});
                                            }
                                        }
                                    })
                                }else{
                                    res.setHeader('Content-Type', 'application/json');
                                    res.status(200).send({'status':'Success','LicenseData':licenseData,'amountToBePaid':amountToBePaid,'nextStatus':nextStatus});
                                }
                            }
                            
                        }else{
                            res.setHeader('Content-Type', 'application/json');
                            res.status(200).send({'status':'Completed','LicenseData':licenseData,'amountToBePaid':amountToBePaid,'nextStatus':nextStatus}); 
                        }
                    }
                })
            }
        }
    })
});

// -------------get student schedule list based on status-------------------------------

router.post('/getSchedulePerEnroll',validateSession, function (req, res) {
  var studentInfo1=req.body.studentInfo;
  var statusid=req.body.statusid;
  var enrollData=req.body.enrollData;
  var curDate=moment(new Date()).format("YYYY-MM-DD");
  console.log("---------------getSchedulePerEnroll-------------",enrollData,studentInfo1,statusid,"SELECT * FROM student_status_details WHERE student_id='"+studentInfo1.student_id+"' and enroll_id='"+studentInfo1.enroll_id+"' and license_id='"+studentInfo1.license_id+"' and status_id='"+studentInfo1.status_id+"' ORDER BY id DESC LIMIT 1");
    pool.query("SELECT * FROM student_status_details WHERE student_id='"+studentInfo1.student_id+"' and enroll_id='"+studentInfo1.enroll_id+"' and license_id='"+studentInfo1.license_id+"' and status_id='"+studentInfo1.status_id+"' ORDER BY id DESC LIMIT 1", function (err, statusInfo) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(statusInfo){ 
            console.log("statusInfo-----",statusInfo);
            var completedDate=moment(new Date(statusInfo[0].completed_date)).format("YYYY-MM-DD");
            pool.query("SELECT a.*,BIN(a.timeslot) as TimeSlot,DATE(a.start_date) as start_Date,DATE(a.end_date) as end_Date,b.status,b.schedule_color FROM schedule_details a JOIN status_list b ON a.license_id='"+studentInfo1.license_id+"' and a.status_id=(SELECT id from status_list WHERE id = "+statusid+" and schedule=1 and license_process='"+studentInfo1.license_process+"' ORDER BY id ASC LIMIT 1) and  '"+completedDate+"' < DATE(a.start_date) and a.status_id=b.id and a.is_deleted=0 GROUP BY a.status_id,a.start_date,a.end_date", function (err, scheduleList) {
                if (err) {
                    console.log("Problem with MySQL productcatalog",err);
                }
                if(scheduleList){
                    var dateArray = new Array();
                    if(scheduleList.length > 0){
                        if(scheduleList[0].schedule_view == 'All'){
                            pool.query("SELECT a.*,BIN(a.timeslot) as TimeSlot,DATE_FORMAT(a.schedule_date, '%Y-%m-%d') as startDate,b.status,b.schedule_color FROM student_schedule_details a JOIN status_list b ON a.student_id='"+studentInfo1.student_id+"' and a.enroll_id='"+studentInfo1.enroll_id+"' and a.license_id='"+studentInfo1.license_id+"' and a.status_id='"+statusid+"' and a.schedule_view='All' and a.status_id=b.id GROUP BY a.status_id,a.schedule_date", function (err, existsSchedule) {
                                if (err) {
                                    console.log("Problem with MySQL productcatalog",err);
                                }
                                if(existsSchedule){
                                    if(enrollData.test_flag == 'R' && enrollData.result == 'Fail'){
                                        console.log("SELECT * FROM student_status_details WHERE student_id='"+studentInfo1.student_id+"' and enroll_id='"+studentInfo1.enroll_id+"' and license_id='"+studentInfo1.license_id+"' and status_id='"+statusid+"'")
                                        pool.query("SELECT * FROM student_status_details WHERE student_id='"+studentInfo1.student_id+"' and enroll_id='"+studentInfo1.enroll_id+"' and license_id='"+studentInfo1.license_id+"' and status_id='"+statusid+"'", function (err, statusCheck) {
                                            if (err) {
                                                console.log("Problem with MySQL productcatalog",err);
                                            }
                                            if(statusCheck){
                                                console.log("existsSchedule----",existsSchedule,statusCheck)
                                                if(existsSchedule.length == statusCheck.length){
                                                    console.log("1111111111!!!!!!!",existsSchedule)
                                                    res.setHeader('Content-Type', 'application/json');
                                                    res.status(200).send({'status':'Exists','scheduleList': []});
                                                }else{
                                                    console.log("1111111111!!!!!!!",existsSchedule)
                                                    res.setHeader('Content-Type', 'application/json');
                                                    res.status(200).send({'status':'Exists','scheduleList': existsSchedule});
                                                }
                                            }
                                        })
                                    }else{
                                        console.log("1111111111!!!!!!!",existsSchedule)
                                        res.setHeader('Content-Type', 'application/json');
                                        res.status(200).send({'status':'Exists','scheduleList': existsSchedule});
                                    }
                                }
                            })
                        }else{
                            var idx = 0;
                            function checkScheduled(){
                                async.eachOfSeries(scheduleList, function() {
                                    scheduleDt = scheduleList[idx];
                                    var dateList=getDates(scheduleDt.start_Date,scheduleDt.end_Date,scheduleDt,dateArray);
                                    idx++;
                                    if(idx == scheduleList.length){
                                        var idx1 = 0;
                                        function processScheduled(){
                                            async.eachOfSeries(dateList, function() {
                                                datedt = dateList[idx1];
                                            var checkDate=moment(new Date(datedt.startDate)).format("YYYY-MM-DD");
                                            pool.query("SELECT *,BIN(timeslot) as TimeSlot,DATE(schedule_date) as startDate FROM student_schedule_details WHERE student_id='"+studentInfo1.student_id+"' and enroll_id='"+studentInfo1.enroll_id+"' and license_id='"+studentInfo1.license_id+"' and status_id='"+statusid+"' and DATE(schedule_date)='"+checkDate+"'", function (err, existingSchedule) {
                                                if (err) {
                                                    console.log("Problem with MySQL productcatalog",err);
                                                }
                                                if(existingSchedule){
                                                    console.log("existingSchedule---------",existingSchedule)
                                                    if(existingSchedule.length > 0){
                                                        // datedt['schedule_color']='fc-event-success';
                                                        datedt['schedule_color']='green';
                                                        idx1++;
                                                        if(idx1 == dateList.length){
                                                            console.log("dateList====111111====",dateList);
        
                                                            res.setHeader('Content-Type', 'application/json');
                                                            res.status(200).send({'status':'New','scheduleList': dateList});
                                                        }else{
                                                            processScheduled();
                                                        }
                                                    }else{
                                                        datedt['schedule_color']='blue';
                                                        idx1++
                                                        if(idx1 == dateList.length){
                                                            console.log("dateList=====222222222===",dateList);
        
                                                            res.setHeader('Content-Type', 'application/json');
                                                            res.status(200).send({'status':'New','scheduleList': dateList});
                                                        }else{
                                                            processScheduled();
                                                        }
                                                    }
                                                }
                                            })
                                        })
                                    }
                                    processScheduled();
                                    }else{
                                        checkScheduled();
                                    }
                                })
                            }
                            checkScheduled();
                        }
                    }else{
                        res.setHeader('Content-Type', 'application/json');
                        res.status(200).send({'status':'New','scheduleList': scheduleList});
                    }
                    
                }
            })

        }
    }) 
            
});

//-------------get student particular schedule details-----------------------

router.post('/getSelectedScheduleInfoStudent',validateSession, function (req, res) {
    var calendarInfo=req.body.calendarInfo;
    var enrollData=req.body.enrollData;
    console.log("enrollData=======",calendarInfo,enrollData)
    var startDate = moment(new Date(enrollData.scheduleDate)).format("YYYY-MM-DD");
    var q="";
    if(calendarInfo.schedule_view == 'All'){
        q="SELECT a.*,BIN(a.timeslot) as TimeSlot,DATE(a.start_date) as startDate,DATE(a.end_date) as endDate,b.status,b.schedule_color FROM schedule_details a JOIN status_list b ON  a.status_id='"+enrollData.statusId+"' and a.license_id='"+enrollData.licenseId+"'  and a.status_id=b.id and '"+startDate+"' between DATE(a.start_date) AND DATE(a.end_date)  and a.is_deleted=0"
    }else{
        q="SELECT a.*,BIN(a.timeslot) as TimeSlot,DATE(a.start_date) as startDate,DATE(a.end_date) as endDate,b.status,b.schedule_color,c.name as employeeName FROM schedule_details a JOIN status_list b ON  a.status_id='"+enrollData.statusId+"' and a.license_id='"+enrollData.licenseId+"' and a.status_id=b.id and '"+startDate+"' between DATE(a.start_date) AND DATE(a.end_date)  and a.is_deleted=0 JOIN employee_details c ON a.employee_id=c.id"
    }
    pool.query(q, function (err, scheduleList) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        } 
        if(scheduleList){
                // console.log("getScheduleDetails======",scheduleList);
                console.log("SELECT *,BIN(timeslot) as TimeSlot,DATE(schedule_date) as startDate FROM student_schedule_details WHERE student_id='"+enrollData.studentId+"' and enroll_id='"+enrollData.enrollId+"' and license_id='"+enrollData.licenseId+"' and status_id='"+enrollData.statusId+"' and DATE(schedule_date)='"+startDate+"'")
            pool.query("SELECT *,BIN(timeslot) as TimeSlot,DATE(schedule_date) as startDate FROM student_schedule_details WHERE student_id='"+enrollData.studentId+"' and enroll_id='"+enrollData.enrollId+"' and license_id='"+enrollData.licenseId+"' and status_id='"+enrollData.statusId+"' and DATE(schedule_date)='"+startDate+"'", function (err, existingSchedule) {
                if (err) {
                    console.log("Problem with MySQL productcatalog",err);
                }
                if(existingSchedule){
                    console.log("existingSchedule======1================",existingSchedule)
                    //pool.release();
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).send({'status': 'Success','scheduleList': scheduleList,'existingSchedule':existingSchedule});
                }
            })
        }
    })
}); 

// -------------insert student schedule details-----------------------

router.post('/setStudentScheduleInfo',validateSession, function (req, res) {
    var finalArray=req.body.finalArray;
    var enrollData=req.body.enrollData;
    var rangelist=req.body.rangelist;
    var scheduleDate = moment(new Date(enrollData.scheduleDate)).format("YYYY-MM-DD");
    
    console.log("finalArray----",finalArray,rangelist);
    pool.query("DELETE FROM student_schedule_details WHERE student_id='"+enrollData.studentId+"' and enroll_id ='"+enrollData.enrollId+"' and license_id='"+enrollData.licenseId+"' and status_id='"+enrollData.statusId+"' and schedule_date='"+scheduleDate+"' and schedule_status=0", function (err, delData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(delData){
            finalArray.forEach((schedDt,idx)=>{
                var q="";
                if(enrollData.schedule_view == 'All'){
                    q="INSERT INTO student_schedule_details (student_id,enroll_id,license_id,status_id,schedule_date,timeslot,schedule_view) VALUES ('"+enrollData.studentId+"','"+enrollData.enrollId+"','"+enrollData.licenseId+"','"+enrollData.statusId+"','"+scheduleDate+"',(B'"+schedDt.timeSlot+"'),'"+enrollData.schedule_view+"')";
                }else{
                    q="INSERT INTO student_schedule_details (student_id,enroll_id,license_id,status_id,employee_id,schedule_date,timeslot,schedule_view) VALUES ('"+enrollData.studentId+"','"+enrollData.enrollId+"','"+enrollData.licenseId+"','"+enrollData.statusId+"','"+schedDt.selected.id+"','"+scheduleDate+"',(B'"+schedDt.timeSlot+"'),'"+enrollData.schedule_view+"')";
                }
                pool.query(q, function (err, enrollRes) {
                    if (err) {
                        console.log("Problem with MySQL productcatalog",err);
                    }
                    if(idx === finalArray.length-1){
                        pool.query("SELECT a.name,a.mobile_number,a.email_id,b.type as pref_language FROM student_details a JOIN preference_master b ON a.id='"+enrollData.studentId+"' and a.prefered_lang_id=b.id", function (err, studData) {
                            if (err) {
                                console.log("Problem with MySQL productcatalog",err);
                            }
                            if(studData){
                                pool.query("SELECT b.*,a.status FROM status_list a JOIN message_details b ON a.id='"+enrollData.statusId+"' and a.message_notification=1 and a.schedule=1 and a.id=b.status_id", function (err, messageInfo) {
                                    if (err) {
                                        console.log("Problem with MySQL productcatalog",err);
                                    }
                                    if(messageInfo){
                                        if(messageInfo.length>0){
                                            var messageData=messageInfo[0];
                                            console.log("messageInfo=======",messageInfo);
                                            var mobile_no=studData[0].mobile_number;
                                            var email_id=studData[0].email_id;     
                                            var pref_lang=studData[0].pref_language;
                                            var mailContent = messageData['message_'+pref_lang];
                                            var smsContent = messageData['message_'+pref_lang];
                                            console.log("-------------",email_id,mobile_no,smsContent);
                                            var smsOpt = {
                                                uri: smsConfig.url+'apiusername='+smsConfig.apiusername+'&apipassword='+smsConfig.apipassword+'&mobileno=+6'+mobile_no+'&senderid='+smsConfig.senderid+'&languagetype='+smsConfig.languagetype+'&message='+smsContent+' '+scheduleDate +' '+rangelist+'.' 
                                            };

                                            var mailOpt={
                                                from: 'info@smamano.my',
                                                to: email_id, // list of receivers
                                                subject: messageData.status+' Schedule', // Subject line
                                                html:'<html><h3>Dear '+studData[0].name+',</h3><br/>'+mailContent+' '+scheduleDate +' '+rangelist+'.</html>'    
                                            }
                                            
                                            function myNewFunc() {
                                                console.log("mailOpt===========",mailOpt,smsOpt,enrollData.statusId);
                                                transporter.sendMail(mailOpt, function (error, message) {
                                                    if (error) {
                                                        return console.log(error);
                                                    }
                                                    if (message) {
                                                        console.log("mail---------sent-----------",message)
                                                        request(smsOpt, function (error, response, body) {
                                                            console.log("error=nooooooooooo===", response.statusCode);

                                                            if (!error && (response.statusCode < 400)) {
                                                                console.log("error=nooooooooooo===", response.statusCode);
                                                                res.setHeader('Content-Type', 'application/json');
                                                                res.status(200).send({'status':'Success'});
                                                            }
                                                            if (error) {
                                                                console.log("error====", error);
                                                            }
                                                        })
                                                    }
                                                })
                                            }
                                            setTimeout(myNewFunc, 1500);
                                        }else{
                                            res.setHeader('Content-Type', 'application/json');
                                            res.status(200).send({'status':'Success'});
                                        }
                                    }
                                })                              
                            }
                            
                        }) 
                    
                    }
                })
            })
        }
    })
   
});

// -----------get enrollment number for schedule on redirecting from timeline---------------------

router.post('/getParticularEnroll', function (req, res) {
    var enrollData=req.body.enrollData;
    pool.query("SELECT a.* FROM student_enroll_details a WHERE a.id='"+enrollData.enroll_id+"' and a.is_removed=0", function (err, enroll_data) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(enroll_data){
            pool.query("SELECT a.student_id,a.enroll_id,a.license_id,a.status_id,a.license_process,b.license_class FROM student_license_details a JOIN license_details b ON a.student_id='"+enrollData.student_id+"' and a.enroll_id='"+enrollData.enroll_id+"' and a.license_id='"+enrollData.license_id+"' and a.license_id=b.id", function (err, license_data) {
                if (err) {
                    console.log("Problem with MySQL productcatalog",err);
                }
                if(enroll_data){
                  //pool.release();
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).send({'enrollData': enroll_data,'licenseData':license_data});
                }
            })
        }
    })
  });

// ----------to check session per week for schedule--------------------

router.post('/checkSessionPerWeek',validateSession, function (req, res) {
    var enrollData=req.body.enrollData;
    var startDate=moment(new Date(req.body.firstday)).format("YYYY-MM-DD");
    var endDate=moment(new Date(req.body.lastday)).format("YYYY-MM-DD");
    var slotSelected=req.body.slotSelected;
    console.log("checkSessionPerWeek-------enrollValue----------",enrollData);
    if(enrollData.schedule_view == 'All'){
        pool.query("SELECT * FROM student_schedule_details WHERE student_id='"+enrollData.studentId+"' and enroll_id='"+enrollData.enrollId+"' and license_id='"+enrollData.licenseId+"' and status_id='"+enrollData.statusId+"'", function (err, checkStudent) {
            if (err) {
                console.log("Problem with MySQL productcatalog",err);
            }
            if(checkStudent){
                console.log("checkStudent----------",checkStudent);
                if(checkStudent.length > 0){
                    if(enrollData.test_flag == 'R' && enrollData.result == 'Fail'){
                        pool.query("SELECT * FROM student_status_details WHERE student_id='"+enrollData.studentId+"' and enroll_id='"+enrollData.enrollId+"' and license_id='"+enrollData.licenseId+"' and status_id='"+enrollData.statusId+"'", function (err, statusCheck) {
                            if (err) {
                                console.log("Problem with MySQL productcatalog",err);
                            }
                            if(statusCheck){
                                if(checkStudent.length == statusCheck.length){
                                    res.setHeader('Content-Type', 'application/json');
                                    res.status(200).send({'status':'Success','numberOfHours':1});
                                }else{
                                    res.setHeader('Content-Type', 'application/json');
                                    res.status(200).send({'status':'onlyOnce','numberOfHours':1});
                                }
                            }
                        })
                    }else{
                        res.setHeader('Content-Type', 'application/json');
                        res.status(200).send({'status':'onlyOnce','numberOfHours':1});
                    }
                }else{
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).send({'status':'Success','numberOfHours':1});
                }
            }
        })
    }else{
        pool.query("SELECT * FROM status_list WHERE id='"+enrollData.statusId+"'", function (err, statusSessionInfo) {
            if (err) {
                console.log("Problem with MySQL productcatalog",err);
            }
            if(statusSessionInfo){
                var maxSlot=statusSessionInfo[0].total_session;
                pool.query("SELECT BIN(timeslot) as TimeSlot FROM student_schedule_details WHERE student_id='"+enrollData.studentId+"' and enroll_id='"+enrollData.enrollId+"' and license_id='"+enrollData.licenseId+"' and status_id='"+enrollData.statusId+"'", function (err, checkScheduleSlot) {
                    if (err) {
                        console.log("Problem with MySQL productcatalog",err);
                    }
                    if(checkScheduleSlot){
                        console.log("checkScheduleSlot=============",checkScheduleSlot);
                        if(checkScheduleSlot.length > 0){
                            var slotCompleted=0;
                            if(enrollData.test_flag == 'R' && enrollData.result == 'Fail'){
                                pool.query("SELECT * FROM student_status_details WHERE student_id='"+enrollData.studentId+"' and enroll_id='"+enrollData.enrollId+"' and license_id='"+enrollData.licenseId+"' and status_id='"+enrollData.statusId+"'", function (err, statusCheck) {
                                    if (err) {
                                        console.log("Problem with MySQL productcatalog",err);
                                    }
                                    if(statusCheck){
                                        if(checkScheduleSlot.length == statusCheck.length){
                                            res.setHeader('Content-Type', 'application/json');
                                            res.status(200).send({'status':'Success','numberOfHours':slotCompleted});
                                        }else{
                                            checkScheduleSlot.forEach((scheduledt,idx)=>{
                                                slotCompleted= slotCompleted+ scheduledt.TimeSlot.match(/1/g).length;
                                                if(idx === checkScheduleSlot.length-1){
                                                    console.log("slotCompleted---",slotCompleted,slotSelected+slotCompleted);
                                                    if(slotCompleted == maxSlot){
                                                        res.setHeader('Content-Type', 'application/json');
                                                        res.status(200).send({'status':'slotExceed','numberOfHours':slotCompleted,'maxSlot':maxSlot});
                                                    }else if(Number(slotSelected+slotCompleted) > maxSlot){
                                                        res.setHeader('Content-Type', 'application/json');
                                                        res.status(200).send({'status':'currentExceed','numberOfHours':(maxSlot-slotCompleted),'maxSlot':maxSlot});
                                                    }else{
                                                        if(enrollData.statusId == 8 || enrollData.statusId == 9){
                                                            pool.query("SELECT * FROM time_master", function (err, timeData) {
                                                                if (err) {
                                                                    console.log("Problem with MySQL productcatalog",err);
                                                                }
                                                                if(timeData){
                                                                    var noOfSession=timeData[0].no_of_session;
                                                                    pool.query("SELECT BIN(timeslot) as TimeSlot FROM student_schedule_details WHERE student_id='"+enrollData.studentId+"' and enroll_id='"+enrollData.enrollId+"' and license_id='"+enrollData.licenseId+"' and '" + startDate + "' <= DATE(schedule_date) AND DATE(schedule_date) <= '" + endDate + "'", function (err, sessionData) {
                                                                        if (err) {
                                                                            console.log("P roblem with MySQL productcatalog",err);
                                                                        }
                                                                        if(sessionData){
                                                                            console.log("sessionData-----",sessionData)
                                                                            var numberOfHours=0;
                                                                            if(sessionData.length > 0){
                                                                                sessionData.forEach((data,idx1)=>{
                                                                                    numberOfHours= numberOfHours+ ((data.TimeSlot == 0 || data.TimeSlot == null) ? 0 : data.TimeSlot.match(/1/g).length);
                                                                                    if(idx1 === sessionData.length - 1){
                                                                                        console.log("numberOfHours-------",numberOfHours);
                                                                                        if(numberOfHours == noOfSession){
                                                                                            res.setHeader('Content-Type', 'application/json');
                                                                                            res.status(200).send({'status':'Exceeded','numberOfHours':numberOfHours,'noOfSession':noOfSession,'maxSlot':maxSlot});
                                                                                        }else if(Number(numberOfHours + slotSelected) > noOfSession){
                                                                                            res.setHeader('Content-Type', 'application/json');
                                                                                            res.status(200).send({'status':'Exceeded','numberOfHours':numberOfHours,'noOfSession':noOfSession,'maxSlot':maxSlot});
                                                                                        }else{
                                                                                            res.setHeader('Content-Type', 'application/json');
                                                                                            res.status(200).send({'status':'Success','numberOfHours':numberOfHours,'noOfSession':noOfSession,'maxSlot':maxSlot});
                                                                                        }
                                                                                    }
                                                                                })
                                                                            }else{
                                                                                if(Number(slotSelected) > noOfSession){
                                                                                    res.setHeader('Content-Type', 'application/json');
                                                                                    res.status(200).send({'status':'Exceeded','numberOfHours':numberOfHours,'noOfSession':noOfSession,'maxSlot':maxSlot});
                                                                                }else{
                                                                                    res.setHeader('Content-Type', 'application/json');
                                                                                    res.status(200).send({'status':'Success','numberOfHours':numberOfHours,'noOfSession':noOfSession,'maxSlot':maxSlot});
                                                                                }
                                                                            }
                                                                        }
                                                                    })
                                                                }
                                                            })
                                                        }else{
                                                            res.setHeader('Content-Type', 'application/json');
                                                            res.status(200).send({'status':'Success','numberOfHours':slotCompleted,'maxSlot':maxSlot});
                                                        }
                                                    }
                                                }
                                            })
                                        }
                                    }
                                })
                            }else{
                                checkScheduleSlot.forEach((scheduledt,idx)=>{
                                    slotCompleted= slotCompleted+ scheduledt.TimeSlot.match(/1/g).length;
                                    if(idx === checkScheduleSlot.length-1){
                                        console.log("slotCompleted---",slotCompleted,slotSelected+slotCompleted);
                                        if(slotCompleted == maxSlot){
                                            res.setHeader('Content-Type', 'application/json');
                                            res.status(200).send({'status':'slotExceed','numberOfHours':slotCompleted,'maxSlot':maxSlot});
                                        }else if(Number(slotSelected+slotCompleted) > maxSlot){
                                            res.setHeader('Content-Type', 'application/json');
                                            res.status(200).send({'status':'currentExceed','numberOfHours':(maxSlot-slotCompleted),'maxSlot':maxSlot});
                                        }else{
                                            if(enrollData.statusId == 8 || enrollData.statusId == 9){
                                                pool.query("SELECT * FROM time_master", function (err, timeData) {
                                                    if (err) {
                                                        console.log("Problem with MySQL productcatalog",err);
                                                    }
                                                    if(timeData){
                                                        var noOfSession=timeData[0].no_of_session;
                                                        pool.query("SELECT BIN(timeslot) as TimeSlot FROM student_schedule_details WHERE student_id='"+enrollData.studentId+"' and enroll_id='"+enrollData.enrollId+"' and license_id='"+enrollData.licenseId+"' and '" + startDate + "' <= DATE(schedule_date) AND DATE(schedule_date) <= '" + endDate + "'", function (err, sessionData) {
                                                            if (err) {
                                                                console.log("P roblem with MySQL productcatalog",err);
                                                            }
                                                            if(sessionData){
                                                                console.log("sessionData-----",sessionData)
                                                                var numberOfHours=0;
                                                                if(sessionData.length > 0){
                                                                    sessionData.forEach((data,idx1)=>{
                                                                        numberOfHours= numberOfHours+ ((data.TimeSlot == 0 || data.TimeSlot == null) ? 0 : data.TimeSlot.match(/1/g).length);
                                                                        if(idx1 === sessionData.length - 1){
                                                                            console.log("numberOfHours-------",numberOfHours);
                                                                            if(numberOfHours == noOfSession){
                                                                                res.setHeader('Content-Type', 'application/json');
                                                                                res.status(200).send({'status':'Exceeded','numberOfHours':numberOfHours,'noOfSession':noOfSession,'maxSlot':maxSlot});
                                                                            }else if(Number(numberOfHours + slotSelected) > noOfSession){
                                                                                res.setHeader('Content-Type', 'application/json');
                                                                                res.status(200).send({'status':'Exceeded','numberOfHours':numberOfHours,'noOfSession':noOfSession,'maxSlot':maxSlot});
                                                                            }else{
                                                                                res.setHeader('Content-Type', 'application/json');
                                                                                res.status(200).send({'status':'Success','numberOfHours':numberOfHours,'noOfSession':noOfSession,'maxSlot':maxSlot});
                                                                            }
                                                                        }
                                                                    })
                                                                }else{
                                                                    if(Number(slotSelected) > noOfSession){
                                                                        res.setHeader('Content-Type', 'application/json');
                                                                        res.status(200).send({'status':'Exceeded','numberOfHours':numberOfHours,'noOfSession':noOfSession,'maxSlot':maxSlot});
                                                                    }else{
                                                                        res.setHeader('Content-Type', 'application/json');
                                                                        res.status(200).send({'status':'Success','numberOfHours':numberOfHours,'noOfSession':noOfSession,'maxSlot':maxSlot});
                                                                    }
                                                                }
                                                            }
                                                        })
                                                    }
                                                })
                                            }else{
                                                res.setHeader('Content-Type', 'application/json');
                                                res.status(200).send({'status':'Success','numberOfHours':slotCompleted,'maxSlot':maxSlot});
                                            }
                                        }
                                    }
                                })
                            }
                        }else{
                            if(Number(slotSelected) > maxSlot){
                                res.setHeader('Content-Type', 'application/json');
                                res.status(200).send({'status':'currentExceed','numberOfHours':maxSlot,'maxSlot':maxSlot});
                            }else{
                                res.setHeader('Content-Type', 'application/json');
                                res.status(200).send({'status':'Success','numberOfHours':0,'maxSlot':maxSlot});
                            }
                        }
                    }
                })
            }
        })
        
    }
});

// -----------------status list for timeline-------------------------

router.post('/getStatusListForTimeLine', function (req, res) {
    var enrollvalue=req.body.enrollvalue;
    console.log("enrollvalue============",enrollvalue)
    if(enrollvalue.license_category == 'Upgrade' || enrollvalue.license_category == 'Advance' || enrollvalue.license_category == 'L-License'){
        pool.query("SELECT * FROM status_list WHERE license_process='"+enrollvalue.license_process+"' and id NOT IN (4,5,6,7)", function (err, statusData) {
            if (err) {
                console.log("Problem with MySQL productcatalog",err);
            }
            if(statusData){
                var statusId=(enrollvalue.status_id == 2 ? 2 : (enrollvalue.status_id == 3 ? 7 : enrollvalue.status_id))
                pool.query("SELECT * FROM status_list WHERE license_process='"+enrollvalue.license_process+"' and id > '"+statusId+"' ORDER BY id ASC LIMIT 1", function (err, nextStatus) {
                    if (err) {
                        console.log("Problem with MySQL productcatalog",err);
                    }
                    if(nextStatus){
                        res.setHeader('Content-Type', 'application/json');
                        res.status(200).send({'statusData':statusData,'nextStatus':nextStatus});
                    }
                })
            }
        })
    }else{
        pool.query("SELECT * FROM status_list WHERE license_process='"+enrollvalue.license_process+"'", function (err, statusData) {
            if (err) {
                console.log("Problem with MySQL productcatalog",err);
            }
            if(statusData){
                pool.query("SELECT * FROM status_list WHERE license_process='"+enrollvalue.license_process+"' and id > '"+enrollvalue.status_id+"' ORDER BY id ASC LIMIT 1", function (err, nextStatus) {
                    if (err) {
                        console.log("Problem with MySQL productcatalog",err);
                    }
                    if(nextStatus){
                        res.setHeader('Content-Type', 'application/json');
                        res.status(200).send({'statusData':statusData,'nextStatus':nextStatus});
                    }
                })
            }
        })
    }
    
}); 


// ----------------show timeline for student--------------------------- 

router.post('/checkStudentTimeLine',validateSession, function (req, res) {
    var enrollValue=req.body.enrollValue;
    pool.query("SELECT a.*,b.cur_date FROM student_status_details a JOIN student_details b ON a.student_id='"+req.session.studentInfo.id+"' and a.enroll_id='"+enrollValue.enroll_id+"' and a.license_id='"+enrollValue.license_id+"' and a.student_id=b.id", function (err, timelineData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(timelineData){
          if(timelineData.length > 0){
              var idx=0;
              function getPaymentInfo(){
                  async.eachOfSeries(timelineData, function() {
                      timeDt = timelineData[idx];
                      pool.query("SELECT * FROM payment_details WHERE student_id='"+req.session.studentInfo.id+"' and enroll_id='"+enrollValue.enroll_id+"' and license_id='"+enrollValue.license_id+"' and status_id='"+timeDt.status_id+"' and payment_status='Success' ORDER BY id DESC LIMIT 1", function (err, payData) {
                          if (err) {
                              console.log("Problem with MySQL productcatalog",err);
                          }
                          if(payData){
                              timeDt.payInfo=payData;
                              idx++;
                              if(idx == timelineData.length){
                                  pool.query("SELECT a.enrollment_no,a.payment_phase,b.*,c.package_english,c.package_malay,c.package_offers,d.license_class FROM student_enroll_details a JOIN student_license_details b ON a.id='"+enrollValue.enroll_id+"' and a.id=b.enroll_id and b.license_id='"+enrollValue.license_id+"' JOIN package_details c ON a.package_id=c.id JOIN license_details d ON b.license_id=d.id", function (err, licenseInfo) {
                                      if (err) {
                                          console.log("Problem with MySQL productcatalog",err);
                                      }
                                      if(licenseInfo){
                                          //pool.release();
                                          res.setHeader('Content-Type', 'application/json');
                                          res.status(200).send({'timelineData':timelineData,'LicenseData':licenseInfo});
                                      }
                                  })
                              }else{
                                  getPaymentInfo();
                              }
                          }
                      }) 
                  })
              }
              getPaymentInfo();
          }else{
              pool.query("SELECT a.enrollment_no,b.*,c.package_english,c.package_malay,c.package_offers,d.license_class FROM student_enroll_details a JOIN student_license_details b ON a.id='"+enrollValue.enroll_id+"' and a.id=b.enroll_id and b.license_id='"+enrollValue.license_id+"' JOIN package_details c ON a.package_id=c.id JOIN license_details d ON b.license_id=d.id", function (err, licenseInfo) {
                  if (err) {
                      console.log("Problem with MySQL productcatalog",err);
                  }
                  if(licenseInfo){
                      //pool.release();
                      res.setHeader('Content-Type', 'application/json');
                      res.status(200).send({'timelineData':timelineData,'LicenseData':licenseInfo});
                  }
              })
          }
      }
    })
  });
  
 
  // ------------------check status list for update PDL---------------------------

  router.post('/getStatusListForStudent',validateSession, function (req, res) {
      var enrollValue=req.body.enrollValue;
      console.log("enrollValue-------------------",enrollValue)
    pool.query("SELECT a.status_id,a.result,b.test_flag,a.LDL_license_no,a.LDL_expiry_date,a.PDL_license_no,a.PDL_expiry_date,a.license_process FROM student_license_details a JOIN status_list b ON a.enroll_id='"+enrollValue.enroll_id+"' and a.license_id='"+enrollValue.license_id+"' and a.status_id > 2 and a.status_id=b.id", function (err, testStatus) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(testStatus){
            if(testStatus.length > 0){
            console.log("testStatus------------",testStatus)
            if(testStatus[0].test_flag == 'T' || testStatus[0].test_flag == 'R'){
              if(testStatus[0].result == 'Fail'){
                  if(testStatus[0].test_flag == 'T'){
                      pool.query("SELECT * FROM status_list WHERE owner_id=(SELECT id FROM role_master WHERE role='Student') and license_process='"+testStatus[0].license_process+"'  and id NOT IN (16,17,18) and test_flag IN ('R') and id > (SELECT status_id FROM student_license_details WHERE enroll_id='"+enrollValue.enroll_id+"' and license_id='"+enrollValue.license_id+"' ) ORDER BY id ASC LIMIT 1", function (err, statusList) {
                          if (err) {
                              console.log("Problem with MySQL productcatalog",err);
                          }
                          if(statusList){
                            if(statusList.length > 0){
                                console.log("getScheduleDetails======",statusList);
                                if(statusList[0].schedule ==  1){
                                    pool.query("SELECT *,DATE(schedule_date) as scheduled_date FROM student_schedule_details WHERE enroll_id='"+enrollValue.enroll_id+"' and license_id='"+enrollValue.license_id+"' and status_id='"+statusList[0].id+"' ORDER by id DESC LIMIT 1", function (err, scheduleExists) {
                                        if (err) {
                                            console.log("Problem with MySQL productcatalog",err);
                                        }
                                        if(scheduleExists.length>0){
                                            console.log("scheduleExists----------",scheduleExists)
                                            res.setHeader('Content-Type', 'application/json');
                                            res.status(200).send({'data': statusList,'scheduleDt':scheduleExists,'expiryData':testStatus});
                                        }else{
                                            res.setHeader('Content-Type', 'application/json');
                                            res.status(200).send({'data': [],'scheduleDt':[],'expiryData':testStatus});
                                        }
                                    })
                                }else{
                                    res.setHeader('Content-Type', 'application/json');
                                    res.status(200).send({'data': statusList,'scheduleDt':[],'expiryData':testStatus});
                                }
                            }else{
                                console.log("getScheduleDetails======",statusList);
                                res.setHeader('Content-Type', 'application/json');
                                res.status(200).send({'data': statusList,'scheduleDt':[],'expiryData':testStatus});
                            }
                          }
                      })
                  }else if(testStatus[0].test_flag == 'R'){
                      pool.query("SELECT * FROM status_list WHERE owner_id=(SELECT id FROM role_master WHERE role='Student') and license_process='"+testStatus[0].license_process+"' and id NOT IN (16,17,18) and id='"+testStatus[0].status_id+"'", function (err, statusList) {
                          if (err) {
                              console.log("Problem with MySQL productcatalog",err);
                          }
                          if(statusList){
                            if(statusList.length > 0){
                                console.log("getScheduleDetails======",statusList);
                                if(statusList[0].schedule ==  1){
                                    pool.query("SELECT *,DATE(schedule_date) as scheduled_date FROM student_schedule_details WHERE enroll_id='"+enrollValue.enroll_id+"' and license_id='"+enrollValue.license_id+"' and status_id='"+statusList[0].id+"' ORDER by id DESC LIMIT 1", function (err, scheduleExists) {
                                        if (err) {
                                            console.log("Problem with MySQL productcatalog",err);
                                        }
                                        if(scheduleExists.length>0){
                                            pool.query("SELECT *,DATE(schedule_date) as scheduled_date FROM student_schedule_details WHERE enroll_id='"+enrollValue.enroll_id+"' and license_id='"+enrollValue.license_id+"' and status_id='"+statusList[0].id+"'", function (err, scheduleCountExists) {
                                                if (err) {
                                                    console.log("Problem with MySQL productcatalog",err);
                                                }
                                                if(scheduleCountExists){
                                                    pool.query("SELECT * FROM student_status_details WHERE enroll_id='"+enrollValue.enroll_id+"' and license_id='"+enrollValue.license_id+"' and status_id='"+statusList[0].id+"'", function (err, statusCheck) {
                                                        if (err) {
                                                            console.log("Problem with MySQL productcatalog",err);
                                                        }
                                                        if(statusCheck){
                                                            if(scheduleCountExists.length == statusCheck.length){
                                                                res.setHeader('Content-Type', 'application/json');
                                                                res.status(200).send({'data': [],'scheduleDt':[],'expiryData':testStatus});
                                                            }else{
                                                                console.log("scheduleExists----------",scheduleExists)
                                                                res.setHeader('Content-Type', 'application/json');
                                                                res.status(200).send({'data': statusList,'scheduleDt':scheduleExists,'expiryData':testStatus});
                                                            }
                                                        }
                                                    })
                                                }
                                            })
                                        }else{
                                            res.setHeader('Content-Type', 'application/json');
                                            res.status(200).send({'data': [],'scheduleDt':[],'expiryData':testStatus});
                                        }
                                    })
                                }else{
                                    res.setHeader('Content-Type', 'application/json');
                                    res.status(200).send({'data': statusList,'scheduleDt':[],'expiryData':testStatus});
                                }
                            }else{
                                console.log("getScheduleDetails======",statusList);
                                res.setHeader('Content-Type', 'application/json');
                                res.status(200).send({'data': statusList,'scheduleDt':[],'expiryData':testStatus});
                            }
                          }
                      })
                  }
              }else if(testStatus[0].result == 'Pass'){
                  console.log("SELECT * FROM status_list WHERE owner_id=(SELECT id FROM role_master WHERE role='Student')  and id NOT IN (16,17,18) and test_flag NOT IN ('R') and id > (SELECT status_id FROM student_license_details WHERE enroll_id='"+enrollValue.enroll_id+"' and license_id='"+enrollValue.license_id+"') ORDER BY id ASC LIMIT 1")
                  pool.query("SELECT * FROM status_list WHERE owner_id=(SELECT id FROM role_master WHERE role='Student') and license_process='"+testStatus[0].license_process+"'  and id NOT IN (16,17,18) and test_flag NOT IN ('R') and id > (SELECT status_id FROM student_license_details WHERE enroll_id='"+enrollValue.enroll_id+"' and license_id='"+enrollValue.license_id+"' ) ORDER BY id ASC LIMIT 1", function (err, statusList) {
                      if (err) {
                          console.log("Problem with MySQL productcatalog",err);
                      }
                      if(statusList){
                          if(statusList.length > 0){
                              console.log("getScheduleDetails======",statusList);
                              if(statusList[0].schedule ==  1){
                                  pool.query("SELECT *,DATE(schedule_date) as scheduled_date FROM student_schedule_details WHERE enroll_id='"+enrollValue.enroll_id+"' and license_id='"+enrollValue.license_id+"' and status_id='"+statusList[0].id+"' ORDER by id DESC LIMIT 1", function (err, scheduleExists) {
                                      if (err) {
                                          console.log("Problem with MySQL productcatalog",err);
                                      }
                                      if(scheduleExists.length>0){
                                          console.log("scheduleExists----------",scheduleExists)
                                          res.setHeader('Content-Type', 'application/json');
                                          res.status(200).send({'data': statusList,'scheduleDt':scheduleExists,'expiryData':testStatus});
                                      }else{
                                          res.setHeader('Content-Type', 'application/json');
                                          res.status(200).send({'data': [],'scheduleDt':[],'expiryData':testStatus});
                                      }
                                  })
                              }else{
                                  res.setHeader('Content-Type', 'application/json');
                                  res.status(200).send({'data': statusList,'scheduleDt':[],'expiryData':testStatus});
                              }
                          }else{
                              console.log("getScheduleDetails======",statusList);
                              res.setHeader('Content-Type', 'application/json');
                              res.status(200).send({'data': statusList,'scheduleDt':[],'expiryData':testStatus});
                          }
                      }
                  })
              }
            }else{
                console.log("SELECT * FROM status_list WHERE owner_id=(SELECT id FROM role_master WHERE role='Student')  and id NOT IN (16,17,18) and id > (SELECT status_id FROM student_license_details WHERE enroll_id='"+enrollValue.enroll_id+"' and license_id='"+enrollValue.license_id+"' ) ORDER BY id ASC LIMIT 1")
              pool.query("SELECT * FROM status_list WHERE owner_id=(SELECT id FROM role_master WHERE role='Student') and license_process='"+testStatus[0].license_process+"'  and id NOT IN (16,17,18) and id > (SELECT status_id FROM student_license_details WHERE enroll_id='"+enrollValue.enroll_id+"' and license_id='"+enrollValue.license_id+"' ) ORDER BY id ASC LIMIT 1", function (err, statusList) {
                  if (err) {
                      console.log("Problem with MySQL productcatalog",err);
                  }
                  if(statusList){
                      if(statusList.length > 0){
                          console.log("getScheduleDetails==11111111111111111====",statusList);
                          if(statusList[0].schedule ==  1){
                              pool.query("SELECT *,DATE(schedule_date) as scheduled_date FROM student_schedule_details WHERE enroll_id='"+enrollValue.enroll_id+"' and license_id='"+enrollValue.license_id+"' and status_id='"+statusList[0].id+"'", function (err, scheduleExists) {
                                  if (err) {
                                      console.log("Problem with MySQL productcatalog",err);
                                  }
                                  if(scheduleExists.length>0){
                                      console.log("scheduleExists---------",scheduleExists)
                                      res.setHeader('Content-Type', 'application/json');
                                      res.status(200).send({'data': statusList,'scheduleDt':scheduleExists,'expiryData':testStatus});
                                  }else{
                                      res.setHeader('Content-Type', 'application/json');
                                      res.status(200).send({'data': [],'scheduleDt':[],'expiryData':testStatus});
                                  }
                              })
                          }else{
                              res.setHeader('Content-Type', 'application/json');
                              res.status(200).send({'data': statusList,'scheduleDt':[],'expiryData':testStatus});
                          }
                      }else{
                          console.log("getScheduleDetails======",statusList);
                          res.setHeader('Content-Type', 'application/json');
                          res.status(200).send({'data': statusList,'scheduleDt':[],'expiryData':testStatus});
                      }
                  }
              })
            }
            }else{
              console.log("getScheduleDetails======");
              res.setHeader('Content-Type', 'application/json');
              res.status(200).send({'data': [],'scheduleDt':[],'expiryData':[]});
            }
        }
    })
  });
  
 // ------------------check status list for update GDL/PSV---------------------------
 
  router.post('/getStatusListForStudentOfGDL',validateSession, function (req, res) {
      var enrollValue=req.body.enrollValue;
    pool.query("SELECT a.status_id,a.result,b.test_flag,a.LDL_license_no,a.LDL_expiry_date,a.PDL_license_no,a.PDL_expiry_date,a.license_process FROM student_license_details a JOIN status_list b ON a.enroll_id='"+enrollValue.enroll_id+"' and a.license_id='"+enrollValue.license_id+"' and a.status_id=b.id", function (err, testStatus) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(testStatus){
            if(testStatus.length > 0){
            console.log("testStatus------------",testStatus)
            if(testStatus[0].test_flag == 'T' || testStatus[0].test_flag == 'R'){
              if(testStatus[0].result == 'Fail'){
                  if(testStatus[0].test_flag == 'T'){
                      pool.query("SELECT * FROM status_list WHERE owner_id=(SELECT id FROM role_master WHERE role='Student') and license_process='"+testStatus[0].license_process+"' and test_flag IN ('R') and id > (SELECT status_id FROM student_license_details WHERE enroll_id='"+enrollValue.enroll_id+"' and license_id='"+enrollValue.license_id+"' ) ORDER BY id ASC LIMIT 1", function (err, statusList) {
                          if (err) {
                              console.log("Problem with MySQL productcatalog",err);
                          }
                          if(statusList){
                            if(statusList.length > 0){
                                console.log("getScheduleDetails======",statusList);
                                if(statusList[0].schedule ==  1){
                                    pool.query("SELECT *,DATE(schedule_date) as scheduled_date FROM student_schedule_details WHERE enroll_id='"+enrollValue.enroll_id+"' and license_id='"+enrollValue.license_id+"' and status_id='"+statusList[0].id+"'", function (err, scheduleExists) {
                                        if (err) {
                                            console.log("Problem with MySQL productcatalog",err);
                                        }
                                        if(scheduleExists.length>0){
                                            res.setHeader('Content-Type', 'application/json');
                                            res.status(200).send({'data': statusList,'scheduleDt':scheduleExists,'expiryData':testStatus});
                                        }else{
                                            res.setHeader('Content-Type', 'application/json');
                                            res.status(200).send({'data': [],'scheduleDt':[],'expiryData':testStatus});
                                        }
                                    })
                                }else{
                                    res.setHeader('Content-Type', 'application/json');
                                    res.status(200).send({'data': statusList,'scheduleDt':[],'expiryData':testStatus});
                                }
                            }else{
                                console.log("getScheduleDetails======",statusList);
                                res.setHeader('Content-Type', 'application/json');
                                res.status(200).send({'data': statusList,'scheduleDt':[],'expiryData':testStatus});
                            }
                          }
                      })
                  }else if(testStatus[0].test_flag == 'R'){
                      pool.query("SELECT * FROM status_list WHERE owner_id=(SELECT id FROM role_master WHERE role='Student') and license_process='"+testStatus[0].license_process+"'  and id='"+testStatus[0].status_id+"'", function (err, statusList) {
                          if (err) {
                              console.log("Problem with MySQL productcatalog",err);
                          }
                          if(statusList){
                            if(statusList.length > 0){
                                console.log("getScheduleDetails======",statusList);
                                if(statusList[0].schedule ==  1){
                                    pool.query("SELECT *,DATE(schedule_date) as scheduled_date FROM student_schedule_details WHERE enroll_id='"+enrollValue.enroll_id+"' and license_id='"+enrollValue.license_id+"' and status_id='"+statusList[0].id+"'", function (err, scheduleExists) {
                                        if (err) {
                                            console.log("Problem with MySQL productcatalog",err);
                                        }
                                        if(scheduleExists.length>0){
                                            pool.query("SELECT *,DATE(schedule_date) as scheduled_date FROM student_schedule_details WHERE enroll_id='"+enrollValue.enroll_id+"' and license_id='"+enrollValue.license_id+"' and status_id='"+statusList[0].id+"'", function (err, scheduleCountExists) {
                                                if (err) {
                                                    console.log("Problem with MySQL productcatalog",err);
                                                }
                                                if(scheduleCountExists){
                                                    pool.query("SELECT * FROM student_status_details WHERE enroll_id='"+enrollValue.enroll_id+"' and license_id='"+enrollValue.license_id+"' and status_id='"+statusList[0].id+"'", function (err, statusCheck) {
                                                        if (err) {
                                                            console.log("Problem with MySQL productcatalog",err);
                                                        }
                                                        if(statusCheck){
                                                            if(scheduleCountExists.length == statusCheck.length){
                                                                res.setHeader('Content-Type', 'application/json');
                                                                res.status(200).send({'data': [],'scheduleDt':[],'expiryData':testStatus});
                                                            }else{
                                                                console.log("scheduleExists----------",scheduleExists)
                                                                res.setHeader('Content-Type', 'application/json');
                                                                res.status(200).send({'data': statusList,'scheduleDt':scheduleExists,'expiryData':testStatus});
                                                            }
                                                        }
                                                    })
                                                }
                                            })
                                        }else{
                                            res.setHeader('Content-Type', 'application/json');
                                            res.status(200).send({'data': [],'scheduleDt':[],'expiryData':testStatus});
                                        }
                                    })
                                }else{
                                    res.setHeader('Content-Type', 'application/json');
                                    res.status(200).send({'data': statusList,'scheduleDt':[],'expiryData':testStatus});
                                }
                            }else{
                                console.log("getScheduleDetails======",statusList);
                                res.setHeader('Content-Type', 'application/json');
                                res.status(200).send({'data': statusList,'scheduleDt':[],'expiryData':testStatus});
                            }
                          }
                      })
                  }
              }else if(testStatus[0].result == 'Pass'){
                  console.log("SELECT * FROM status_list WHERE owner_id=(SELECT id FROM role_master WHERE role='Student')  and id NOT IN (16,17,18) and test_flag NOT IN ('R') and id > (SELECT status_id FROM student_license_details WHERE enroll_id='"+enrollValue.enroll_id+"' and license_id='"+enrollValue.license_id+"' ) ORDER BY id ASC LIMIT 1")
                  pool.query("SELECT * FROM status_list WHERE owner_id=(SELECT id FROM role_master WHERE role='Student') and license_process='"+testStatus[0].license_process+"' and test_flag NOT IN ('R') and id > (SELECT status_id FROM student_license_details WHERE enroll_id='"+enrollValue.enroll_id+"' and license_id='"+enrollValue.license_id+"' ) ORDER BY id ASC LIMIT 1", function (err, statusList) {
                      if (err) {
                          console.log("Problem with MySQL productcatalog",err);
                      }
                      if(statusList){
                          if(statusList.length > 0){
                              console.log("getScheduleDetails======",statusList);
                              if(statusList[0].schedule ==  1){
                                  pool.query("SELECT *,DATE(schedule_date) as scheduled_date FROM student_schedule_details WHERE enroll_id='"+enrollValue.enroll_id+"' and license_id='"+enrollValue.license_id+"' and status_id='"+statusList[0].id+"'", function (err, scheduleExists) {
                                      if (err) {
                                          console.log("Problem with MySQL productcatalog",err);
                                      }
                                      if(scheduleExists.length>0){
                                          res.setHeader('Content-Type', 'application/json');
                                          res.status(200).send({'data': statusList,'scheduleDt':scheduleExists,'expiryData':testStatus});
                                      }else{
                                          res.setHeader('Content-Type', 'application/json');
                                          res.status(200).send({'data': [],'scheduleDt':[],'expiryData':testStatus});
                                      }
                                  })
                              }else{
                                  res.setHeader('Content-Type', 'application/json');
                                  res.status(200).send({'data': statusList,'scheduleDt':[],'expiryData':testStatus});
                              }
                          }else{
                              console.log("getScheduleDetails======",statusList);
                              res.setHeader('Content-Type', 'application/json');
                              res.status(200).send({'data': statusList,'scheduleDt':[],'expiryData':testStatus});
                          }
                      }
                  })
              }
            }else{
                console.log("SELECT * FROM status_list WHERE owner_id=(SELECT id FROM role_master WHERE role='Student')  and id NOT IN (16,17,18) and id > (SELECT status_id FROM student_license_details WHERE enroll_id='"+enrollValue.enroll_id+"' and license_id='"+enrollValue.license_id+"' ) ORDER BY id ASC LIMIT 1")
              pool.query("SELECT * FROM status_list WHERE owner_id=(SELECT id FROM role_master WHERE role='Student') and license_process='"+testStatus[0].license_process+"' and id > (SELECT status_id FROM student_license_details WHERE enroll_id='"+enrollValue.enroll_id+"' and license_id='"+enrollValue.license_id+"' ) ORDER BY id ASC LIMIT 1", function (err, statusList) {
                  if (err) {
                      console.log("Problem with MySQL productcatalog",err);
                  }
                  if(statusList){
                      if(statusList.length > 0){
                          console.log("getScheduleDetails======",statusList);
                          if(statusList[0].schedule ==  1){
                              pool.query("SELECT *,DATE(schedule_date) as scheduled_date FROM student_schedule_details WHERE enroll_id='"+enrollValue.enroll_id+"' and license_id='"+enrollValue.license_id+"' and status_id='"+statusList[0].id+"'", function (err, scheduleExists) {
                                  if (err) {
                                      console.log("Problem with MySQL productcatalog",err);
                                  }
                                  if(scheduleExists.length>0){
                                      res.setHeader('Content-Type', 'application/json');
                                      res.status(200).send({'data': statusList,'scheduleDt':scheduleExists,'expiryData':testStatus});
                                  }else{
                                      res.setHeader('Content-Type', 'application/json');
                                      res.status(200).send({'data': [],'scheduleDt':[],'expiryData':testStatus});
                                  }
                              })
                          }else{
                              res.setHeader('Content-Type', 'application/json');
                              res.status(200).send({'data': statusList,'expiryData':testStatus});
                          }
                      }else{
                          console.log("getScheduleDetails======",statusList);
                          res.setHeader('Content-Type', 'application/json');
                          res.status(200).send({'data': statusList,'expiryData':testStatus});
                      }
                  }
              })
            }
            }else{
              console.log("getScheduleDetails======");
              res.setHeader('Content-Type', 'application/json');
              res.status(200).send({'data': [],'expiryData':[]});
            }
        }
    })
  });

// --------------to get status list----------------------------

  router.get('/getStatusList',validateSession, function (req, res) {
    pool.query("SELECT id,status FROM status_list", function (err, licenseData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(licenseData){
            res.setHeader('Content-Type', 'application/json'); 
            res.status(200).send(licenseData);
        }
    })
  });
  
// --------------------view Instructor details from timeline---------------------
  
  router.post('/viewInstructorDetails',validateSession, function (req, res) {
      var enrollData=req.body.enrollData;
      var statusid=req.body.statusid;
      console.log("enrollData=====",enrollData);
    pool.query("SELECT BIN(a.timeslot) as TimeSlot,DATE(a.schedule_date) as scheduleDate,a.schedule_status,b.name,b.mobile_no,b.email_id FROM student_schedule_details a JOIN employee_details b ON a.student_id='"+enrollData.student_id+"' and a.enroll_id='"+enrollData.enroll_id+"' and a.license_id='"+enrollData.license_id+"' and a.status_id='"+statusid+"' and a.employee_id=b.id ORDER BY a.schedule_date DESC", function (err, insData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(insData){
            res.setHeader('Content-Type', 'application/json'); 
            res.status(200).send({'insData':insData});
        }
    })
  });

  router.post('/updateStudentStatusInfo',validateSession, function (req, res) {
    var enrollData=req.body.enrollData;
    var statusdt=req.body.statusdt;
    var curDate=moment(new Date()).format("YYYY-MM-DD hh:mm");
    var marks=statusdt.marks != '' ? statusdt.marks : null;
    var rating=statusdt.rating != '' ? statusdt.rating : null;
    console.log("marks-----",marks)
      pool.query("INSERT INTO student_status_details (student_id,enroll_id,license_id,status_id,result,rating,marks,remarks,completed_date,updated_by) VALUES ('"+req.session.studentInfo.id+"','"+enrollData.enroll_id+"','"+enrollData.license_id+"','"+statusdt.status_id+"','"+statusdt.result+"',"+rating+","+marks+",'"+statusdt.remarks+"','"+curDate+"','"+req.session.studentInfo.id+"')", function (err, updateStatus) {
          if (err) {
              console.log("Problem with MySQL productcatalog",err);
          }
          if(updateStatus){
          pool.query("UPDATE student_license_details SET status_id='"+statusdt.status_id+"',result='"+statusdt.result+"' WHERE student_id='"+req.session.studentInfo.id+"' and enroll_id='"+enrollData.enroll_id+"' and license_id='"+enrollData.license_id+"'", function (err, studData) {
              if (err) {
                  console.log("Problem with MySQL productcatalog",err);
              }
              if(studData){
                  res.setHeader('Content-Type', 'application/json');
                  res.status(200).send({'status':'Success'});
              }
          })
          }
      })
  });


  router.get('/getOverallTimeDetails', function (req, res) {
pool.query("SELECT * FROM time_master", function (err, timeData) {
    if (err) {
        console.log("Problem with MySQL productcatalog",err);
    }
    if(timeData){
        //pool.release();
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send({'data': timeData});
    }
})
  });





router.post('/setCustomerContactDetails',validateSession, function (req, res) {
    var customerObj=req.body.customerObj;
    pool.query("INSERT INTO customer_contact_details (name,email_id,mobile_no,subject,message) VALUES ('"+customerObj.name+"','"+customerObj.email_id+"','"+customerObj.mobile_no+"','"+customerObj.subject+"','"+customerObj.message+"')", function (err, statusList) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(statusList){
            let mailOptions = {
                from: 'info@smamano.my',
                to: 'info@smamano.my', // list of receivers
                subject: 'Customer Contact Details', // Subject line
                html: '<html><table style="border: 1px solid #dee2e6;margin-left: auto;margin-right: auto;width: 75%; text-align: center;background-color: #f3f3f3;"><tr><th colspan="7" style="background-color: #2c99e6; color: white;padding-right: 100px;">Customer Details</th></tr> <tr><th></th><th></th><th></th><th>Customer Name</th><td>' + customerObj.name + '</td><th></th></th><th></tr><tr><th></th><th></th></th><th><th>Mobile No</th><td>' + customerObj.mobile_no + '</td><th></th><th></th></tr><tr><th></th><th></th></th><th><th>Email id</th><td>' + customerObj.email_id + '</td><th></th><th></th></tr><tr><th></th><th></th></th><th><th>Subject</th><td>' + customerObj.subject + '</td><th></th><th></th></tr><tr><th></th><th></th></th><th><th>Message</th><td>' + customerObj.message + '</td><th></th><th></th></tr></table></html>',

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
        }
    })
  });


  router.post('/sendForgotPasswordLink', function (req, res) {
    var email_id=req.body.email_id;
    pool.query("SELECT * FROM student_details WHERE email_id='"+email_id+"' and is_deleted=0 and is_active=1", function (err, emailExists) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(emailExists){
            if(emailExists.length > 0){
                var tokenUrl=webLink+"/resetpassword/"+emailExists[0].authToken;
                let mailOptions = {
                    from: 'info@smamano.my',
                    to: email_id, // list of receivers
                    subject: 'Forgot Password Mail', // Subject line
                    html:'<html><h3>Dear '+emailExists[0].name+',</h3><center><h2>Forgot Password</h2></center><br/><br/><center><p>Please click the below link to set your new password</p><a href='+tokenUrl+'>'+webLink+'/resetpassword</a></center></html>'    
                };
                function myNewFunc() {
                    transporter.sendMail(mailOptions, function (error, message) {
                        if (error) {
                            return console.log(error);
                        }
                        if (message) {
                            console.log("getScheduleDetails======",statusList);
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
      pool.query("Update student_details set password='"+resetInfo.password+"' where authToken='"+resetInfo.authToken+"'", function (err, updateStatus) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(updateStatus){
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status':'Success'});
        }
    })
  });

  router.post('/deleteStudentSchedule',validateSession, function (req, res) {
    var enrollData=req.body.enrollData;
    var scheduleDate = moment(new Date(enrollData.scheduleDate)).format("YYYY-MM-DD");
    
    console.log("enrollData----",enrollData);
    pool.query("DELETE FROM student_schedule_details WHERE student_id='"+enrollData.studentId+"' and enroll_id ='"+enrollData.enrollId+"' and status_id='"+enrollData.statusId+"' and schedule_date='"+scheduleDate+"'  and schedule_status=0", function (err, delData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(delData){
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status':'Success'});
        }
    })
})

  
function zeroPad(num,total){
    console.log(num)
    return num.toString().padStart(Number(total), "0");
}

  router.post('/setPaymentDetails',validateSession, function (req, res) {
    var enrollValue=req.body.enrollValue;
    var amountToBePaid=req.body.amountToBePaid;
    console.log("pay-------enrollValue----------",enrollValue)
    pool.query("INSERT INTO payment_details (student_id,enroll_id,status_id,payment_amount,payment_flag,payment_status) VALUES ('"+enrollValue.student_id+"','"+enrollValue.id+"','"+enrollValue.status_id+"',"+amountToBePaid+",'Pay','Success')", function (err, enrollData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(enrollData){
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status':'Success'});
        }
    })
  });

  
// ----------to get base license list--------------

router.get('/getBaseLicenseList', function (req, res) {
    pool.query("SELECT * FROM license_details WHERE is_deleted=0 and is_active=1", function (err, licenseData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(licenseData){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(licenseData);
        }
    })
       
});
  

  module.exports = router;  