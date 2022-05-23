const express = require('express');
var router = express.Router();
const moment = require('moment');
var pool = require('../db');
var jwt = require('jsonwebtoken');
var ACCESS_TOKEN_SECRET = "0cf22951fd77561b6eef4587d187050604b8256ece9c9e5b13e3161529094cdcbc0c0c3056da254d975799bb93e3eeb818dd0623345683e8fad04e163ef54rtd";
const multer = require('multer');
const fs = require('fs');
var  request=require('request');
var nodeMailer = require('nodemailer');
var configData = require('../config');
var cron = require('node-cron');
var smsConfig=configData.smsConfig;
var apiUrl=configData.hostConfig.apiUrl;
var async = require('async');


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
    if(!req.session.userInfo){
        console.log("ifffff")
        res.status(200).send({'status':'Session Expired'});
    }else{
        console.log("else")
        next();
    }
}

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

// ------------to get the list of race----------

router.get('/getRaceList', function (req, res) {
    pool.query("SELECT * FROM race_master", function (err, raceData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(raceData){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(raceData);
        }
    })

});

// -----------to get the list of nric type----------------

router.get('/getNRICTypeList', function (req, res) {
   pool.query("SELECT * FROM nrictype_master", function (err, nricType) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(nricType){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(nricType);
        }
    })
});

// ---------to get nationality list-----------

router.get('/getNationalityList', function (req, res) {
    pool.query("SELECT * FROM citizenship_master", function (err, nationalityData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(nationalityData){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(nationalityData);
        }
    })
});

// --------------to get list of pincode--------------

router.get('/getPostalCode', function (req, res) {
    pool.query("SELECT * FROM postalcode_master GROUP BY postal_code", function (err, nationalityData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(nationalityData){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(nationalityData);
        }
    })
});

// -----------------to get existing license master----------

router.get('/getExistingLicense', function (req, res) {
    pool.query("SELECT * FROM existing_license_master", function (err, licenseData) {
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

// --------------to get preference list--------------------

router.get('/getPreferenceList', function (req, res) {
    pool.query("SELECT * FROM preference_master", function (err, prefData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(prefData){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(prefData);
        }
    })
       
});

// -----------------to get place of birth list----------------------

router.get('/getPlaceBirth', function (req, res) {
    pool.query("SELECT * FROM place_of_birth_master", function (err, prefData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(prefData){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(prefData);
        }
    })
});

// ---------------to check NRIC Number already exists-----------------

router.post('/checkNRICExistence',validateSession, function (req, res) {
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

// ---------------to check Passport Number already exists-----------------


router.post('/checkPassportExistence',validateSession, function (req, res) {
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

// ---------------to check Username already exists-----------------


router.post('/checkUsernameExistence', validateSession,function (req, res) {
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

// ---------------get list of students--------------------


router.get('/getStudentListPerClient',validateSession, function (req, res) {
    pool.query("SELECT * FROM student_details WHERE is_deleted=0", function (err, studData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(studData){
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'data':studData});
        }
    })
        
});

let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        var baseRoot=req.body.baseRoot;
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

// --------------------register student details-------------

router.post('/setStudentDetails',validateSession,upload.fields([{
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
    var baseRoot=req.body.baseRoot;
    var personalDetails = JSON.parse(req.body.personalDetails);
    console.log("personalDetails===",personalDetails);
    var race = req.body.race;
    var nricType = req.body.nricType;
    var nationality = req.body.nationality;
    var postalCode = req.body.postalCode;
    var preference = req.body.preference;
    var placeBirth = req.body.placeBirth;
    var PreferenceDetails = JSON.parse(req.body.preferenceDetails);
    var dob = moment(new Date(personalDetails.date_of_birth)).format("YYYY-MM-DD");
    var status=1;
    var q="";
    console.log("-------------------------")
    var photo_path =   baseRoot+'/'+(req.files.photo[0].fieldname+'.'+(req.files.photo[0].mimetype.split('/')[1]));
    var nricFront_path = (req.files.nricFront ? baseRoot+ '/'+(req.files.nricFront[0].fieldname+'.'+(req.files.nricFront[0].mimetype.split('/')[1])) : '') ;
    var nricRear_path =  (req.files.nricRear ? baseRoot+ '/'+(req.files.nricRear[0].fieldname+'.'+(req.files.nricRear[0].mimetype.split('/')[1])): '');
    var passportFront_path = (req.files.passportFront ?  baseRoot+ '/'+(req.files.passportFront[0].fieldname+'.'+(req.files.passportFront[0].mimetype.split('/')[1])): '');
    var workPermit_path =  (req.files.workPermit ? baseRoot+ '/'+(req.files.workPermit[0].fieldname+'.'+(req.files.workPermit[0].mimetype.split('/')[1])): '');

    var q="";
    console.log("photo=============",photo_path);
    if(personalDetails.nric_number != ''){
        var authToken=jwt.sign({ usertoken: personalDetails.nric_number }, ACCESS_TOKEN_SECRET);
        q="INSERT INTO student_details(name,nric_type,nric_number,date_of_birth,gender,placebirth_id,nationality_id,address_nric,address1,address2,postalcode_id,city,state,email_id,mobile_number,race_id,other_race,other_placebirth,prefered_lang_id,emergency_name,emergency_number,user_name,password,created_by,status_id,profile_img,authToken,is_active)  VALUES ('"+personalDetails.name+"','"+nricType+"','"+personalDetails.nric_number+"','"+dob+"','"+personalDetails.gender+"','"+placeBirth+"','"+nationality+"','"+personalDetails.ic_address+"','"+personalDetails.address1+"','"+personalDetails.address2+"','"+postalCode+"','"+personalDetails.city+"','"+personalDetails.state+"','"+personalDetails.email_address+"','"+personalDetails.mobile_number+"','"+race+"','"+personalDetails.other_race+"','"+personalDetails.other_placebirth+"','"+preference+"','"+PreferenceDetails.emergency_name+"','"+PreferenceDetails.emergency_number+"','"+PreferenceDetails.user_name+"','"+PreferenceDetails.password+"','"+req.session.userInfo.id+"','"+status+"','"+photo_path+"','"+authToken+"',1)"
    }else{
        var authToken=jwt.sign({ usertoken: personalDetails.passport_number }, ACCESS_TOKEN_SECRET);
            personalDetails.passport_number=personalDetails.passport_number.concat(personalDetails.nationality_code);
        q="INSERT INTO student_details(name,nric_type,passport_number,date_of_birth,gender,placebirth_id,nationality_id,address_nric,address1,address2,postalcode_id,city,state,email_id,mobile_number,race_id,other_race,other_placebirth,prefered_lang_id,emergency_name,emergency_number,user_name,password,created_by,status_id,profile_img,authToken,is_active)  VALUES ('"+personalDetails.name+"','"+nricType+"','"+personalDetails.passport_number+"','"+dob+"','"+personalDetails.gender+"','"+placeBirth+"','"+nationality+"','"+personalDetails.ic_address+"','"+personalDetails.address1+"','"+personalDetails.address2+"','"+postalCode+"','"+personalDetails.city+"','"+personalDetails.state+"','"+personalDetails.email_address+"','"+personalDetails.mobile_number+"','"+race+"','"+personalDetails.other_race+"','"+personalDetails.other_placebirth+"','"+preference+"','"+PreferenceDetails.emergency_name+"','"+PreferenceDetails.emergency_number+"','"+PreferenceDetails.user_name+"','"+PreferenceDetails.password+"','"+req.session.userInfo.id+"','"+status+"','"+photo_path+"','"+authToken+"',1)"
    }
    pool.query("SELECT * FROM student_details WHERE user_name='"+PreferenceDetails.user_name+"' and is_deleted=0", function (err, userExists) {
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

// -----------------update student details----------------------
  
  router.post('/updateConfirmStudentDetails',validateSession,upload.fields([{
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

    var baseRoot=req.body.baseRoot;
    var personalDetails = JSON.parse(req.body.personalDetails);
    console.log("personalDetails===",personalDetails);
    var race = req.body.race;
    var nricType = req.body.nricType;
    var nationality = req.body.nationality;
    var postalCode = req.body.postalCode;
    var preference = req.body.preference;
    var placeBirth = req.body.placeBirth;
    console.log("req.body.isActive=====",typeof req.body.isActive);
    var isActive=(req.body.isActive == 'true' ? 1 : 0);
    var documentDetails=JSON.parse(req.body.documentDetails);
    var PreferenceDetails = JSON.parse(req.body.preferenceDetails);
    var dob = moment(new Date(personalDetails.date_of_birth)).format("YYYY-MM-DD");

    var photo_path =  (req.files.photo != undefined ? ( baseRoot+ '/'+(req.files.photo[0].fieldname+'.'+(req.files.photo[0].mimetype.split('/')[1]))) :  documentDetails.photo_edit);
    var nricFront_path = (req.files.nricFront != undefined? (baseRoot+ '/'+(req.files.nricFront[0].fieldname+'.'+(req.files.nricFront[0].mimetype.split('/')[1]))) :  documentDetails.nric_front_edit) ;
    var nricRear_path =  (req.files.nricRear!= undefined ? (baseRoot+ '/'+(req.files.nricRear[0].fieldname+'.'+(req.files.nricRear[0].mimetype.split('/')[1]))): documentDetails.nric_rear_edit);
    var passportFront_path = (req.files.passportFront != undefined?  (baseRoot+ '/'+(req.files.passportFront[0].fieldname+'.'+(req.files.passportFront[0].mimetype.split('/')[1]))): documentDetails.passport_front_edit);
    var workPermit_path =  (req.files.workPermit != undefined ? (baseRoot+ '/'+(req.files.workPermit[0].fieldname+'.'+(req.files.workPermit[0].mimetype.split('/')[1]))): documentDetails.work_permit_edit);
    var q="";

    if(personalDetails.nric_number != ''){
        q="UPDATE student_details SET name='"+personalDetails.name+"',nric_type='"+nricType+"',nric_number='"+personalDetails.nric_number+"',passport_number=null,date_of_birth='"+dob+"',gender='"+personalDetails.gender+"',placebirth_id='"+placeBirth+"',nationality_id='"+nationality+"',address_nric='"+personalDetails.ic_address+"',address1='"+personalDetails.address1+"',address2='"+personalDetails.address2+"',postalcode_id='"+postalCode+"',city='"+personalDetails.city+"',state='"+personalDetails.state+"',email_id='"+personalDetails.email_address+"',mobile_number='"+personalDetails.mobile_number+"',race_id='"+race+"',other_race='"+personalDetails.other_race+"',other_placebirth='"+personalDetails.other_placebirth+"',prefered_lang_id='"+preference+"',emergency_name='"+PreferenceDetails.emergency_name+"',emergency_number='"+PreferenceDetails.emergency_number+"',user_name='"+PreferenceDetails.user_name+"',password='"+PreferenceDetails.password+"',updated_by='"+req.session.userInfo.id+"',profile_img='"+photo_path+"',is_active='"+isActive+"' WHERE  id='"+personalDetails.id+"'";
    }else{
        q="UPDATE student_details SET name='"+personalDetails.name+"',nric_type='"+nricType+"',nric_number=null,passport_number='"+personalDetails.passport_number+"',date_of_birth='"+dob+"',gender='"+personalDetails.gender+"',placebirth_id='"+placeBirth+"',nationality_id='"+nationality+"',address_nric='"+personalDetails.ic_address+"',address1='"+personalDetails.address1+"',address2='"+personalDetails.address2+"',postalcode_id='"+postalCode+"',city='"+personalDetails.city+"',state='"+personalDetails.state+"',email_id='"+personalDetails.email_address+"',mobile_number='"+personalDetails.mobile_number+"',race_id='"+race+"',other_race='"+personalDetails.other_race+"',other_placebirth='"+personalDetails.other_placebirth+"',prefered_lang_id='"+preference+"',emergency_name='"+PreferenceDetails.emergency_name+"',emergency_number='"+PreferenceDetails.emergency_number+"',user_name='"+PreferenceDetails.user_name+"',password='"+PreferenceDetails.password+"',updated_by='"+req.session.userInfo.id+"',profile_img='"+photo_path+"',is_active='"+isActive+"' WHERE  id='"+personalDetails.id+"'"
    }

    pool.query(q, function (err, studentData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(studentData){
            pool.query("UPDATE student_document_details SET nric_front='"+nricFront_path+"',nric_rear='"+nricRear_path+"',passport_front='"+passportFront_path+"',work_permit_front='"+workPermit_path+"' WHERE student_id='"+personalDetails.id+"'", function (err, studentDocData) {
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
       
  });

//   ------------------edit student details--------------------
  
  router.post('/getStudentDetailToEdit',validateSession, function (req, res) {
    var studentId=req.body.studentId;
    pool.query("SELECT * FROM student_details WHERE id='"+studentId+"'", function (err, studentData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(studentData){
            pool.query("SELECT * FROM student_document_details WHERE student_id='"+studentId+"'", function (err, docData) {
                if (err) {
                    console.log("Problem with MySQL productcatalog",err);
                }
                if(docData){
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).send({'status':'Success','studData':studentData,'docData':docData});
                }
            })
        }
    })
       
});

// ---------to get particular student details------------------------

router.post('/getParticularStudentDetails',validateSession, function (req, res) {
    var studentId=req.body.studentId;
    pool.query("SELECT a.*,b.english as nric_english,b.malay as nric_malay,c.english as place_english,c.malay as place_malay,d.country_name,e.postal_code,f.english as race_english,f.malay as race_malay,g.english as pref_english,g.malay as pref_malay FROM student_details a JOIN nrictype_master b ON  a.id='"+studentId+"' and a.nric_type=b.id JOIN place_of_birth_master c ON a.placebirth_id=c.id JOIN citizenship_master d ON a.nationality_id=d.id JOIN postalcode_master e ON a.postalcode_id=e.id JOIN race_master f ON a.race_id=f.id JOIN preference_master g ON a.prefered_lang_id=g.id", function (err, studentData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(studentData){
            pool.query("SELECT * FROM student_document_details WHERE student_id='"+studentId+"'", function (err, docData) {
                if (err) {
                    console.log("Problem with MySQL productcatalog",err);
                }
                if(docData){
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).send({'studData':studentData,'docData':docData});
                }
            })
        }
    })
});

// -------------delete student details------------------

  
router.post('/deleteStudentDetails', validateSession,function (req, res) {
    var rowToDelete=req.body.rowToDelete;
    pool.query("UPDATE student_details SET is_deleted=1,updated_by='"+req.session.userInfo.id+"' WHERE id='"+rowToDelete.id+"'", function (err, deldata) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(deldata){
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status':'Success'});
        }
    })
});

// --------------insert admin license details---------------------

  router.post('/setLicenseDetails',validateSession,upload.fields([{
        name: 'licenseImage', maxCount: 1
    }, 
    {
        name: 'licenseFlow', maxCount: 1
    },

    ]),  function (req, res) {
        var baseRoot=req.body.baseRoot;
        var licenseData = JSON.parse(req.body.licenseData);
        var license_type = JSON.parse(req.body.license_type);
        var license_selected = JSON.parse(req.body.license_selected);
        var cdl_req=licenseData.cdl_req == true ? 1 : 0;
        var gdl_practical=licenseData.gdlPractical == true ? 1 : 0;
        var psv_practical=licenseData.psvPractical == true ? 1 : 0;
        var q='';

        console.log("license_type----------------",licenseData,license_type,license_selected)

        var license_img_path =  baseRoot+'/'+(req.files.licenseImage[0].fieldname+'.'+(req.files.licenseImage[0].mimetype.split('/')[1]));
        var license_flow_path = baseRoot+ '/'+(req.files.licenseFlow[0].fieldname+'.'+(req.files.licenseFlow[0].mimetype.split('/')[1]));

        if(licenseData.minimum_age){
            q="INSERT INTO license_details (license_class,minimum_age,cdl_requirement,license_desc_english,license_desc_malay,criteria_english,criteria_malay,license_image,license_flow,created_by,gdl_practical,psv_practical) VALUES ('"+licenseData.license_class+"',"+licenseData.minimum_age+","+cdl_req+",'"+licenseData.license_desc_english+"','"+licenseData.license_desc_malay+"','"+licenseData.criteria_english+"','"+licenseData.criteria_malay+"','"+license_img_path+"','"+license_flow_path+"','"+req.session.userInfo.id+"','"+gdl_practical+"','"+psv_practical+"')"
        }else{
            q="INSERT INTO license_details (license_class,cdl_requirement,license_desc_english,license_desc_malay,criteria_english,criteria_malay,license_image,license_flow,created_by,gdl_practical,psv_practical) VALUES ('"+licenseData.license_class+"',"+cdl_req+",'"+licenseData.license_desc_english+"','"+licenseData.license_desc_malay+"','"+licenseData.criteria_english+"','"+licenseData.criteria_malay+"','"+license_img_path+"','"+license_flow_path+"','"+req.session.userInfo.id+"','"+gdl_practical+"','"+psv_practical+"')"
        }
        pool.query("SELECT * FROM license_details WHERE license_class='"+licenseData.license_class+"' and is_deleted=0", function (err, licenseExists) {
            if (err) {
                console.log("Problem with MySQL productcatalog",err);
            }
            if(licenseExists){
                if(licenseExists.length > 0){
                    //pool.release();
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).send({'status': 'License Class Already Exists!!!!!' });
                }else{
                    pool.query(q, function (err, setlicense) {
                        if (err) {
                            console.log("Problem with MySQL productcatalog",err);
                        }
                        if(setlicense){
                            if(licenseData.upgradeLicense == true && licenseData.advanceLicense == true){
                                pool.query("INSERT INTO advance_license_details (license_id,license_category,ext_license_id) VALUES ('"+setlicense.insertId+"','Upgrade','"+license_type.id+"')", function (err, setUpgradeLic) {
                                    if (err) {
                                        console.log("Problem with MySQL productcatalog",err);
                                    }
                                    if(setUpgradeLic){
                                        license_selected.forEach((licData,idx)=>{
                                            pool.query("INSERT INTO advance_license_details (license_id,license_category,ext_license_id) VALUES ('"+setlicense.insertId+"','Advance','"+licData.id+"')", function (err, setAdvanceLic) {
                                                if (err) {
                                                    console.log("Problem with MySQL productcatalog",err);
                                                }
                                                if(setAdvanceLic){
                                                    if(idx === license_selected.length-1){
                                                        res.setHeader('Content-Type', 'application/json');
                                                        res.status(200).send({'status': 'Success' });
                                                    }
                                                }
                                            })
                                        })
                                    }
                                })
                            }else if(licenseData.upgradeLicense == true && licenseData.advanceLicense == false){
                                pool.query("INSERT INTO advance_license_details (license_id,license_category,ext_license_id) VALUES ('"+setlicense.insertId+"','Upgrade','"+license_type.id+"')", function (err, setUpgradeLic) {
                                    if (err) {
                                        console.log("Problem with MySQL productcatalog",err);
                                    }
                                    if(setUpgradeLic){
                                        res.setHeader('Content-Type', 'application/json');
                                        res.status(200).send({'status': 'Success' });
                                    }
                                })
                            }else if(licenseData.upgradeLicense == false && licenseData.advanceLicense == true){
                                license_selected.forEach((licData,idx)=>{
                                    pool.query("INSERT INTO advance_license_details (license_id,license_category,ext_license_id) VALUES ('"+setlicense.insertId+"','Advance','"+licData.id+"')", function (err, setAdvanceLic) {
                                        if (err) {
                                            console.log("Problem with MySQL productcatalog",err);
                                        }
                                        if(setAdvanceLic){
                                            if(idx === license_selected.length-1){
                                                res.setHeader('Content-Type', 'application/json');
                                                res.status(200).send({'status': 'Success' });
                                            }
                                        }
                                    })
                                })
                            }else{
                                res.setHeader('Content-Type', 'application/json');
                                res.status(200).send({'status': 'Success' });
                            }
                        }
                    })
                }
            }
        })
  })

//   -------------get list of license -------------

  router.get('/getLicenseListPerClient', validateSession,function (req, res) {
    pool.query("SELECT id,license_class,minimum_age,license_desc_english,license_desc_malay FROM license_details WHERE is_deleted=0", function (err, licenseData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(licenseData){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'data':licenseData});
        }
    })
})


// ---------get license class list-----------

router.get('/getLicenseClassList', validateSession,function (req, res) {
    pool.query("SELECT id,license_class FROM license_details WHERE is_deleted=0 and is_active=1", function (err, licenseData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(licenseData){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'data':licenseData});
        }
    })
       
});

// ----------delete license class----------------

router.post('/deleteLicenseDetails',validateSession, function (req, res) {
    var rowToDelete=req.body.rowToDelete;
    pool.query("UPDATE license_details SET is_deleted=1,updated_by='"+req.session.userInfo.id+"' WHERE id='"+rowToDelete.id+"'", function (err, deldata) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(deldata){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status':'Success'});
        }
    })
});

// ----------------edit license----------------

router.post('/getLicenseToEdit',validateSession, function (req, res) {
    var licenseId=req.body.licenseId;
    pool.query("SELECT * FROM license_details WHERE id='"+licenseId+"'", function (err, licenseData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(licenseData){
            pool.query("SELECT a.*,b.license_class FROM advance_license_details a JOIN license_details b ON a.license_id='"+licenseId+"' and a.ext_license_id=b.id", function (err, advanceList) {
                if (err) {
                    console.log("Problem with MySQL productcatalog",err);
                }
                if(advanceList){
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).send({'data':licenseData,"advanceList":advanceList});
                }
              
            })
        }
    })
      
});

// -------------update license details---------------

router.post('/updateLicenseDetails',validateSession,upload.fields([{
    name: 'licenseImage', maxCount: 1
}, 
{
    name: 'licenseFlow', maxCount: 1
},

]), function (req, res) {
        var baseRoot=req.body.baseRoot;
        var licenseData = JSON.parse(req.body.licenseData);
        var license_type = JSON.parse(req.body.license_type);
        var license_selected = JSON.parse(req.body.license_selected);
        var cdl_req=licenseData.cdl_req == true ? 1 : 0;
        var gdl_practical=licenseData.gdlPractical == true ? 1 : 0;
        var psv_practical=licenseData.psvPractical == true ? 1 : 0;
        var isActive=(licenseData.isActive == true ? 1 : 0);
        var license_img_path = (req.files.licenseImage != undefined ? (baseRoot+'/'+(req.files.licenseImage[0].fieldname+'.'+(req.files.licenseImage[0].mimetype.split('/')[1]))):licenseData.license_image);
        var license_flow_path = (req.files.licenseFlow != undefined ? (baseRoot+ '/'+(req.files.licenseFlow[0].fieldname+'.'+(req.files.licenseFlow[0].mimetype.split('/')[1]))):licenseData.license_flow);
        console.log("licenseData-------",licenseData,isActive)
        pool.query("UPDATE license_details SET minimum_age="+(licenseData.minimum_age ? licenseData.minimum_age : 'NULL')+",cdl_requirement="+cdl_req+",license_desc_english='"+licenseData.license_desc_english+"',license_desc_malay='"+licenseData.license_desc_malay+"',criteria_english='"+licenseData.criteria_english+"',criteria_malay='"+licenseData.criteria_malay+"',license_image='"+license_img_path+"',license_flow='"+license_flow_path+"',updated_by='"+req.session.userInfo.id+"',gdl_practical='"+gdl_practical+"',psv_practical='"+psv_practical+"',is_active='"+isActive+"' WHERE  id='"+licenseData.id+"'", function (err, setlicense) {
            if (err) {
                console.log("Problem with MySQL productcatalog",err);
            }
            if(setlicense){
                pool.query("DELETE FROM advance_license_details WHERE license_id='"+licenseData.id+"'", function (err, deleteLicense) {
                    if (err) {
                        console.log("Problem with MySQL productcatalog",err);
                    }
                    if(deleteLicense){
                        if(licenseData.upgradeLicense == true && licenseData.advanceLicense == true){
                            pool.query("INSERT INTO advance_license_details (license_id,license_category,ext_license_id) VALUES ('"+licenseData.id+"','Upgrade','"+license_type.id+"')", function (err, setUpgradeLic) {
                                if (err) {
                                    console.log("Problem with MySQL productcatalog",err);
                                }
                                if(setUpgradeLic){
                                    license_selected.forEach((licData,idx)=>{
                                        pool.query("INSERT INTO advance_license_details (license_id,license_category,ext_license_id) VALUES ('"+licenseData.id+"','Advance','"+licData.id+"')", function (err, setAdvanceLic) {
                                            if (err) {
                                                console.log("Problem with MySQL productcatalog",err);
                                            }
                                            if(setAdvanceLic){
                                                if(idx === license_selected.length-1){
                                                    res.setHeader('Content-Type', 'application/json');
                                                    res.status(200).send({'status': 'Success' });
                                                }
                                            }
                                        })
                                    })
                                }
                            })
                        }else if(licenseData.upgradeLicense == true && licenseData.advanceLicense == false){
                            pool.query("INSERT INTO advance_license_details (license_id,license_category,ext_license_id) VALUES ('"+licenseData.id+"','Upgrade','"+license_type.id+"')", function (err, setUpgradeLic) {
                                if (err) {
                                    console.log("Problem with MySQL productcatalog",err);
                                }
                                if(setUpgradeLic){
                                    res.setHeader('Content-Type', 'application/json');
                                    res.status(200).send({'status': 'Success' });
                                }
                            })
                        }else if(licenseData.upgradeLicense == false && licenseData.advanceLicense == true){
                            license_selected.forEach((licData,idx)=>{
                                pool.query("INSERT INTO advance_license_details (license_id,license_category,ext_license_id) VALUES ('"+licenseData.id+"','Advance','"+licData.id+"')", function (err, setAdvanceLic) {
                                    if (err) {
                                        console.log("Problem with MySQL productcatalog",err);
                                    }
                                    if(setAdvanceLic){
                                        if(idx === license_selected.length-1){
                                            res.setHeader('Content-Type', 'application/json');
                                            res.status(200).send({'status': 'Success' });
                                        }
                                    }
                                })
                            })
                        }else{
                            res.setHeader('Content-Type', 'application/json');
                            res.status(200).send({'status': 'Success' });
                        }
                    }
                })
               
            }
        })
  })


// -------------get package type list------------

router.get('/getPakageTypeList', validateSession,function (req, res) {
    pool.query("SELECT * FROM package_type_master", function (err, licenseData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(licenseData){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'data':licenseData});
        }
    })
       
});

// ------------get payment phase list-------------

router.get('/getPaymentPhases', validateSession,function (req, res) {
    pool.query("SELECT * FROM payment_phases_master", function (err, paymentPhaseData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(paymentPhaseData){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'data':paymentPhaseData});
        }
    })
       
});

// -----insert package details-------------------

router.post('/setPackageDetails',validateSession, function (req, res) {
        // var baseRoot=req.body.baseRoot;
        var PackageFormData = req.body.PackageFormData;
        var package_type = req.body.package_type;
        var license_type = req.body.license_type;
        var payment_phase=req.body.payment_phase;
        // const file = req.file;
        // var package_path =  baseRoot+'/'+(file.fieldname+'.'+(file.mimetype.split('/')[1]));
        console.log("PackageFormData--------------",PackageFormData)
        pool.query("SELECT * FROM package_details WHERE (package_english='"+PackageFormData.package_english+"' or package_malay='"+PackageFormData.package_malay+"') and is_deleted=0", function (err, packageExists) {
            if (err) {
                console.log("Problem with MySQL productcatalog",err);
            }
            if(packageExists){
                if(packageExists.length > 0){
                    //pool.release();
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).send({'status': 'Package Already Exists!!!!!' });
                }else{
                    pool.query("INSERT INTO package_details (package_type_id,package_offers,package_english,package_malay,package_price,promo_discount,final_package_price,package_desc_english,package_desc_malay,payment_phase,package_phase_desc_english,package_phase_desc_malay,global_view,upgrade,l_license,created_by) VALUES ('"+package_type.id+"','"+PackageFormData.package_offers+"','"+PackageFormData.package_english+"','"+PackageFormData.package_malay+"',"+PackageFormData.package_price+","+PackageFormData.promo_discount+","+PackageFormData.final_package_price+",'"+PackageFormData.package_desc_english+"','"+PackageFormData.package_desc_malay+"','"+payment_phase+"','"+PackageFormData.package_phase_desc_english+"','"+PackageFormData.package_phase_desc_malay+"','"+(PackageFormData.global_view == true ? 1 : 0)+"','"+(PackageFormData.upgrade == true ? 1 : 0)+"','"+(PackageFormData.l_license == true ? 1 : 0)+"','"+req.session.userInfo.id+"')", function (err, setPackage) {
                        if (err) {
                            console.log("Problem with MySQL productcatalog",err);
                        }
                        if(setPackage){
                            if(package_type.id == 1){
                                // ---------combo------------------
                                license_type.forEach((licData,idx)=>{
                                    pool.query("INSERT INTO package_license_details (package_id,license_id,license_price,first_phase_amount,second_phase_amount,third_phase_amount) VALUES ('"+setPackage.insertId+"','"+licData.id+"','"+licData.license_price+"',"+licData.first_phase+","+licData.second_phase+","+licData.third_phase+")", function (err, setPack) {
                                        if (err) {
                                            console.log("Problem with MySQL productcatalog",err);
                                        }
                                        if(setPack){
                                            if(idx === license_type.length-1){
                                                //pool.release();
                                                res.setHeader('Content-Type', 'application/json');
                                                res.status(200).send({'status': 'Success' });
                                            }
                                        }
                                    })
                                })
                            }
                            if(package_type.id == 2){
                                // -----------Single---------------
                                license_type.forEach((licData,idx)=>{
                                    pool.query("INSERT INTO package_license_details (package_id,license_id,license_price,first_phase_amount,second_phase_amount,third_phase_amount) VALUES ('"+setPackage.insertId+"','"+licData.id+"','"+PackageFormData.final_package_price+"',"+(PackageFormData.first_phase_amount ? PackageFormData.first_phase_amount : null)+","+(PackageFormData.second_phase_amount ? PackageFormData.second_phase_amount :null)+","+(PackageFormData.third_phase_amount ? PackageFormData.third_phase_amount :null)+")", function (err, setPack) {
                                        if (err) {
                                            console.log("Problem with MySQL productcatalog",err);
                                        }
                                        if(setPack){
                                            if(idx === license_type.length-1){
                                                //pool.release();
                                                res.setHeader('Content-Type', 'application/json');
                                                res.status(200).send({'status': 'Success' });
                                            }
                                        }
                                    })
                                })
                            }
                        }
                    })
                }
            }
        })
});

// -----------get package list-----------------------------
  
router.get('/getPackageListPerClient',validateSession, function (req, res) {
    pool.query("SELECT a.id,a.final_package_price,a.payment_phase,a.global_view,a.package_offers,b.english,b.malay,c.english as phase_english,c.malay as phase_malay FROM package_details a JOIN package_type_master b ON a.package_type_id=b.id and a.is_deleted=0 JOIN payment_phases_master c ON a.payment_phase=c.id", function (err, packageData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(packageData){
            if(packageData.length > 0){
                var idx = 0;
                function getPackData(){
                    async.eachOfSeries(packageData, function() {
                            pkdata = packageData[idx];
                            pkdata['license_data']=[];
                            pool.query("SELECT b.license_class FROM package_license_details a JOIN license_details b ON a.package_id='"+pkdata.id+"' and a.license_id=b.id", function (err, packLicData) {
                                if (err) {
                                    console.log("Problem with MySQL productcatalog",err);
                                }
                                if(packLicData){
                                    console.log("packLicData===",packLicData)
                                    for(i=0;i<packLicData.length;i++){
                                        pkdata['license_data'].push(packLicData[i].license_class)
                                    }
                                    idx++;
                                    if(idx === packageData.length){
                                        console.log("idx-------------")
                                        //pool.release();
                                        res.setHeader('Content-Type', 'application/json');
                                        res.status(200).send({'data':packageData});
                                    }else{
                                        getPackData();
                                    }
                                }
                            })
                        })
                }
                getPackData();
            }else{
                console.log("packageData---elsee---",packageData);
                //pool.release();
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send({'data':packageData});
            }
            
        }
    })
});


router.get('/getPackageInfoToExport',validateSession, function (req, res) {
    pool.query("SELECT b.english,a.package_offers,a.package_english,a.package_malay,c.english as phase_english,e.license_class,d.license_price,d.first_phase_amount,d.second_phase_amount,d.third_phase_amount,a.package_price,a.promo_discount,a.final_package_price,a.package_desc_english,a.package_desc_malay,a.package_phase_desc_english,a.package_phase_desc_malay,a.global_view FROM package_details a JOIN package_type_master b ON a.package_type_id=b.id and a.is_deleted=0 JOIN payment_phases_master c ON a.payment_phase=c.id JOIN package_license_details d JOIN license_details e ON a.id=d.package_id and d.license_id=e.id", function (err, packageData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(packageData){
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'data':packageData});
        }
    })
});


// ---------------update package list-----------------

router.post('/UpdatePackageDetails',validateSession, function (req, res) {
        // var baseRoot=req.body.baseRoot;
        var PackageFormData = req.body.PackageFormData;
        var package_type = req.body.package_type;
        var license_type =req.body.license_type;
        var payment_phase=req.body.payment_phase; 
        // const file = req.file;
        // var package_path =  (file != undefined ? (baseRoot+'/'+(file.fieldname+'.'+(file.mimetype.split('/')[1]))): PackageFormData.package_image);
        console.log("license_type------------",license_type)
        pool.query("UPDATE package_details SET package_type_id='"+package_type.id+"',package_offers='"+PackageFormData.package_offers+"',package_price="+PackageFormData.package_price+",promo_discount="+PackageFormData.promo_discount+",final_package_price="+PackageFormData.final_package_price+",package_desc_english='"+PackageFormData.package_desc_english+"',package_desc_malay='"+PackageFormData.package_desc_malay+"',payment_phase='"+payment_phase+"',package_phase_desc_english='"+PackageFormData.package_phase_desc_english+"',package_phase_desc_malay='"+PackageFormData.package_phase_desc_malay+"',global_view='"+(PackageFormData.global_view == true ? 1 : 0)+"',upgrade='"+(PackageFormData.upgrade == true ? 1 : 0)+"',l_license='"+(PackageFormData.l_license == true ? 1 : 0)+"',updated_by='"+req.session.userInfo.id+"' WHERE id='"+PackageFormData.id+"'", function (err, updatelicense) {
            if (err) {
                console.log("Problem with MySQL productcatalog",err);
            }
            if(updatelicense){
                if(package_type.id == 1){
                    // ---------combo------------------
                    license_type.forEach((licData,idx)=>{
                        pool.query("UPDATE package_license_details SET license_price='"+licData.license_price+"',first_phase_amount='"+licData.first_phase_amount+"',second_phase_amount='"+licData.second_phase_amount+"',third_phase_amount='"+licData.third_phase_amount+"' WHERE package_id='"+licData.package_id+"' and license_id='"+licData.license_id+"'", function (err, setPack) {
                            if (err) {
                                console.log("Problem with MySQL productcatalog",err);
                            }
                            if(setPack){
                                if(idx === license_type.length-1){
                                    //pool.release();
                                    res.setHeader('Content-Type', 'application/json');
                                    res.status(200).send({'status': 'Success' });
                                }
                            }
                        })
                    })
                }
                if(package_type.id == 2){
                    // -----------Single---------------
                    license_type.forEach((licData,idx)=>{
                        pool.query("UPDATE package_license_details SET license_price='"+PackageFormData.final_package_price+"',first_phase_amount="+(PackageFormData.first_phase_amount ? PackageFormData.first_phase_amount : null)+",second_phase_amount="+(PackageFormData.second_phase_amount ? PackageFormData.second_phase_amount :null)+",third_phase_amount="+(PackageFormData.third_phase_amount ? PackageFormData.third_phase_amount :null)+" WHERE package_id='"+licData.package_id+"' and license_id='"+licData.license_id+"'", function (err, setPack) {
                            if (err) {
                                console.log("Problem with MySQL productcatalog",err);
                            }
                            if(setPack){
                                if(idx === license_type.length-1){
                                    //pool.release();
                                    res.setHeader('Content-Type', 'application/json');
                                    res.status(200).send({'status': 'Success' });
                                }
                            }
                        })
                    })
                }
            } 
        })
  });

//   --------------------edit package details-----------------

  
  router.post('/getPackageToEdit',validateSession, function (req, res) {
    var packageId=req.body.packageId;
    pool.query("SELECT * FROM package_details WHERE id='"+packageId+"'", function (err, packageData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(packageData){
            if(packageData.length > 0){
                packageData.forEach((pkdata,idx)=>{
                    pkdata['license_list']=[];
                    pool.query("SELECT a.*,b.license_class FROM package_license_details a JOIN license_details b ON a.package_id='"+pkdata.id+"' and a.license_id=b.id", function (err, packLicData) {
                        if (err) {
                            console.log("Problem with MySQL productcatalog",err);
                        }
                        if(packLicData){
                            pkdata['licenseData']=packLicData;
                            for(i=0;i<packLicData.length;i++){
                                pkdata['license_list'].push(packLicData[i].license_class)
                            }
                            pkdata['license_data']=packLicData;
                            if(idx === packageData.length-1){
                                //pool.release();
                                res.setHeader('Content-Type', 'application/json');
                                res.status(200).send({'data':packageData});
                            }
                        }
                    })
                })
            }else{
                //pool.release();
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send({'data':packageData});
            }
        }
    })
       
});

// ----------delete package details--------------------


router.post('/deletePackageDetails',validateSession, function (req, res) {
    var rowToDelete=req.body.rowToDelete;
    pool.query("UPDATE package_details SET is_deleted=1,updated_by='"+req.session.userInfo.id+"' WHERE id='"+rowToDelete.id+"'", function (err, deldata) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(deldata){
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status':'Success'});
        }
    })
       
});

// ---------get license type list------------------

router.get('/getLicenseTypeList',validateSession, function (req, res) {
    pool.query("SELECT * FROM license_type_master", function (err, licenseData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(licenseData){
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'data':licenseData});
        }
    })
});


// -----------insert prerequisites details---------------------
router.post('/setPreRequisiteDetails',validateSession, function (req, res) {
    var license_type=req.body.license_type;
    var preRequisitesList=req.body.preRequisitesList;
    var reqDocumentsList=req.body.reqDocumentsList;
    preRequisitesList.forEach((preReqData,idx)=>{
        pool.query("INSERT INTO prerequisites_details (license_type_id,pre_requisites_english,pre_requisites_malay,created_by) VALUES ('"+license_type.id+"','"+preReqData.preReq_english+"','"+preReqData.preReq_malay+"','"+req.session.userInfo.id+"')", function (err, reqData) {
            if (err) {
                console.log("Problem with MySQL productcatalog",err);
            }
            if(reqData){
                if(idx === preRequisitesList.length-1){
                    reqDocumentsList.forEach((reqDocData,idx1)=>{
                        pool.query("INSERT INTO required_documents_details (license_type_id,req_documents_english,req_documents_malay,created_by) VALUES ('"+license_type.id+"','"+reqDocData.reqDoc_english+"','"+reqDocData.reqDoc_malay+"','"+req.session.userInfo.id+"')", function (err, reqDocData) {
                            if (err) {
                                console.log("Problem with MySQL productcatalog",err);
                            }
                            if(reqDocData){
                                if(idx1 === reqDocumentsList.length-1){
                                    //pool.release();
                                    res.setHeader('Content-Type', 'application/json');
                                    res.status(200).send({'status':'Success'});
                                }
                            }
                        })
                    })
                }
               
            }
        })
    })
  
});

// -----------get prerequisites details---------------------

router.get('/getPreRequisitesDetails',validateSession, function (req, res) {
    pool.query("SELECT a.*,c.license_class FROM prerequisites_details a JOIN prerequisites_license_details b ON a.is_deleted=0 and a.pre_req_id=b.pre_req_id JOIN license_details c ON b.license_id=c.id GROUP BY a.pre_req_id", function (err, preReqData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(preReqData){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'data':preReqData});
        }
    })
        
});

// -----------edit prerequisites details---------------------

router.post('/getPreRequisitesDetailsToEdit',validateSession, function (req, res) {
    var license_type=req.body.license_type;
    pool.query("SELECT a.*,b.code,b.english,b.malay FROM prerequisites_details a JOIN license_type_master b ON a.license_type_id='"+license_type+"' and a.is_deleted=0 and a.license_type_id=b.id", function (err, preReqData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(preReqData){
            pool.query("SELECT a.*,b.code,b.english,b.malay FROM required_documents_details  a JOIN license_type_master b ON a.license_type_id='"+license_type+"' and a.is_deleted=0 and a.license_type_id=b.id", function (err, reqDocData) {
                if (err) {
                    console.log("Problem with MySQL productcatalog",err);
                }
                if(reqDocData){
                    //pool.release();
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).send({'preReqData':preReqData,'reqDocData':reqDocData});
                }
            })
        }
    })
});

// -----------check prerequisites details--exists-------------------


router.post('/checkPreRequistiesExistence', validateSession,function (req, res) {
    var license_type=req.body.license_type;
    pool.query("SELECT * FROM prerequisites_details WHERE license_type_id='"+license_type+"'", function (err, preReqData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(preReqData){
            var status=(preReqData.length > 0 ? 'Exists' :'Success');
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status':status});
        }
    })
        
});

// -----------delete prerequisites details---------------------

router.post('/deletePrequisitesDetails',validateSession, function (req, res) {
    var rowToDelete=req.body.rowToDelete;
    pool.query("DELETE FROM prerequisites_details WHERE license_type_id='"+rowToDelete.license_type_id+"'", function (err, deldata) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(deldata){
            pool.query("DELETE FROM required_documents_details WHERE license_type_id='"+rowToDelete.license_type_id+"'", function (err, deldata) {
                if (err) {
                    console.log("Problem with MySQL productcatalog",err);
                }
                if(deldata){
                    //pool.release();
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).send({'status':'Success'});
                }
            })
        }
    })
});

// -----------update prerequisites details---------------------

router.post('/updatePreRequisiteDetails', validateSession,function (req, res) {
    var license_type=req.body.license_type;
    var preRequisitesList=req.body.preRequisitesList;
    var reqDocumentsList=req.body.reqDocumentsList;
    pool.query("DELETE FROM prerequisites_details WHERE license_type_id='"+license_type.id+"'", function (err, delData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(delData){
            preRequisitesList.forEach((preReqData,idx)=>{
                pool.query("INSERT INTO prerequisites_details (license_type_id,pre_requisites_english,pre_requisites_malay,created_by) VALUES ('"+license_type.id+"','"+preReqData.preReq_english+"','"+preReqData.preReq_malay+"','"+req.session.userInfo.id+"')", function (err, reqData) {
                    if (err) {
                        console.log("Problem with MySQL productcatalog",err);
                    }
                    if(reqData){
                        if(idx === preRequisitesList.length-1){
                            pool.query("DELETE FROM required_documents_details WHERE license_type_id='"+license_type.id+"'", function (err, delData) {
                                if (err) {
                                    console.log("Problem with MySQL productcatalog",err);
                                }
                                if(delData){
                                    reqDocumentsList.forEach((reqDocData,idx1)=>{
                                        pool.query("INSERT INTO required_documents_details (license_type_id,req_documents_english,req_documents_malay,created_by) VALUES ('"+license_type.id+"','"+reqDocData.reqDoc_english+"','"+reqDocData.reqDoc_malay+"','"+req.session.userInfo.id+"')", function (err, reqDocData) {
                                            if (err) {
                                                console.log("Problem with MySQL productcatalog",err);
                                            }
                                            if(reqDocData){
                                                if(idx1 === reqDocumentsList.length-1){
                                                    //pool.release();
                                                    res.setHeader('Content-Type', 'application/json');
                                                    res.status(200).send({'status':'Success'});
                                                }
                                            }
                                        })
                                    })
                                }
                            })
                        }
                    }
                })
            })
        }
    })
  
});

// ------------to get schedule view assignment(employeeee)------------------------------

router.post('/getScheduleViewAssignList',validateSession, function (req, res) {
    var schedule_view = req.body.schedule_view;
    var license_type = req.body.license_type.id;
    console.log("license_type=========",license_type);
    pool.query("SELECT b.* FROM employee_license_details a JOIN employee_details b ON a.license_id='"+license_type+"' and a.employee_id=b.id and b.role_id=(SELECT id FROM role_master WHERE role='"+schedule_view+"') and b.is_deleted=0", function (err, AssignList) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(AssignList){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'data': AssignList});
        }
    })
  });

//   -----------------to get schedule edit view--------------
  
  router.post('/getScheduleEditView',validateSession, function (req, res) {
    var editData = req.body.editData;
    console.log("editData====",editData);
    var start_date = moment(new Date(editData.startDate)).format("YYYY-MM-DD");
    var end_date = moment(new Date(editData.endDate)).format("YYYY-MM-DD");
    var q="";
    if(editData.schedule_view == 'All'){
        q="SELECT a.*,BIN(a.timeslot) as TimeSlot,b.license_class FROM schedule_details a JOIN license_details b ON a.status_id='"+editData.schedule_name+"' and a.license_id='"+editData.license_id+"' and '" + start_date + "' = DATE(a.start_date) AND '" + end_date + "' = DATE(a.end_date) and a.is_deleted=0 and a.license_id=b.id"
    }else{
        q="SELECT a.*,BIN(a.timeslot) as TimeSlot,b.name as employee_name,c.license_class FROM schedule_details a JOIN employee_details b ON a.status_id='"+editData.schedule_name+"' and a.license_id='"+editData.license_id+"' and '" + start_date + "' = DATE(a.start_date) AND '" + end_date + "' = DATE(a.end_date) and a.is_deleted=0 and a.employee_id=b.id JOIN license_details c ON a.license_id=c.id"
    }
    pool.query(q, function (err, AssignList) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(AssignList){
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status':'Success','data': AssignList});
        }
    })
  });

//   ---------get status list---------------
  
  router.get('/getScheduleList',validateSession, function (req, res) {
    pool.query("SELECT * FROM status_list WHERE schedule=1", function (err, AssignList) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(AssignList){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'data': AssignList});
        }
    })
  });

//   -------insert schedule details----------------------
  
  router.post('/setScheduleDetails',validateSession, function (req, res) {
    var calendarData = req.body.calendarData;
    var viewAssign_selected=req.body.viewAssign_selected;
    var timeSlot=req.body.timeSlot;
    var license_type=req.body.license_type;
    var start_date = moment(new Date(calendarData.startDate)).format("YYYY-MM-DD");
    var end_date = moment(new Date(calendarData.endDate)).format("YYYY-MM-DD");
    console.log("calendarData==11111111111111111111=",timeSlot);
    if(calendarData.schedule_view == 'All'){
        pool.query("SELECT * FROM schedule_details WHERE schedule_view = 'All' and status_id='"+calendarData.schedule_name+"' and license_id='"+license_type.id+"' and ((timeslot & B'"+timeSlot+"') !=0) and (('" + start_date + "' <= DATE(start_date) AND DATE(end_date) <= '" + start_date + "') OR ('" + end_date + "' <= DATE(start_date) AND DATE(end_date) <= '" + end_date + "'))", function (err, scheduleCheck) {
            if (err) {
                console.log("Problem with MySQL productcatalog",err);
            }
            if(scheduleCheck.length > 0){
                console.log("exxists===check--insert=All===",scheduleCheck);
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send({'status': 'Already Exists'});
            }else{
                pool.query("INSERT INTO schedule_details (status_id,license_id,schedule_view,start_date,end_date,timeslot,timeslot_bin,created_by) VALUES ('"+calendarData.schedule_name+"','"+license_type.id+"','"+calendarData.schedule_view+"','"+start_date+"','"+end_date+"',(B'"+timeSlot+"'),'"+timeSlot+"','"+req.session.userInfo.id+"')", function (err, setAssign) {
                    if (err) {
                        console.log("Problem with MySQL productcatalog",err);
                    }
                    if(setAssign){
                        //pool.release();
                        res.setHeader('Content-Type', 'application/json');
                        res.status(200).send({'status': 'Success'});
                    }
                })
            }
        })
    }else{
        if(viewAssign_selected.length > 0){
            viewAssign_selected.forEach((assign,idx)=>{
                pool.query("SELECT * FROM schedule_details WHERE employee_id='"+assign.id+"' and ((timeslot & B'"+timeSlot+"') !=0) and (('" + start_date + "' <= DATE(start_date) AND DATE(end_date) <= '" + start_date + "') OR ('" + end_date + "' <= DATE(start_date) AND DATE(end_date) <= '" + end_date + "'))", function (err, scheduleCheck) {
                    if (err) {
                        console.log("Problem with MySQL productcatalog",err);
                    }
                    if(scheduleCheck.length > 0){
                        console.log("exxists===check--insert=ins===",scheduleCheck);
                        res.setHeader('Content-Type', 'application/json');
                        res.status(200).send({'status': 'Already Exists'});
                    }else{
                        pool.query("SELECT * FROM schedule_details WHERE status_id='"+calendarData.schedule_name+"' and license_id='"+license_type.id+"' and employee_id='"+assign.id+"' and '" + start_date + "' = DATE(start_date) AND '" + end_date + "' = DATE(end_date)", function (err, updateCheck) {
                            if (err) {
                                console.log("Problem with MySQL productcatalog",err);
                            }
                            if(updateCheck.length > 0){
                                console.log("Update------timeslot-----ins----",updateCheck);
                                pool.query("UPDATE schedule_details SET timeslot=timeslot +(B'"+timeSlot+"'), updated_by='"+req.session.userInfo.id+"',timeslot_bin='"+timeSlot+"'  WHERE status_id='"+calendarData.schedule_name+"' and license_id='"+license_type.id+"' and employee_id='"+assign.id+"' and ('" + start_date + "' = DATE(start_date) AND '" + end_date + "' = DATE(end_date))", function (err, setAssign) {
                                    if (err) {
                                        console.log("Problem with MySQL productcatalog",err);
                                    }
                                    if(setAssign){
                                        if(idx === viewAssign_selected.length-1){
                                            //pool.release();
                                            res.setHeader('Content-Type', 'application/json');
                                            res.status(200).send({'status': 'Success'});
                                        }
                                    }
                                })
                            }else{
                                console.log("Insert----new-------------------");
                                pool.query("INSERT INTO schedule_details (status_id,schedule_view,start_date,end_date,employee_id,license_id,timeslot,timeslot_bin,created_by) VALUES ('"+calendarData.schedule_name+"' ,'"+calendarData.schedule_view+"','"+start_date+"','"+end_date+"','"+assign.id+"','"+license_type.id+"',(B'"+timeSlot+"'),'"+timeSlot+"','"+req.session.userInfo.id+"')", function (err, setAssign) {
                                    if (err) {
                                        console.log("Problem with MySQL productcatalog",err);
                                    }
                                    if(setAssign){
                                        if(idx === viewAssign_selected.length-1){
                                            //pool.release();
                                            res.setHeader('Content-Type', 'application/json');
                                            res.status(200).send({'status': 'Success'});
                                        }
                                    }
                                })
                            }
                        })
                    }
                })
            })
        }
    }
    
  });

// --------------to get schedule details-----------------------

  router.get('/getScheduleDetails',validateSession, function (req, res) {
    pool.query("SELECT a.*,BIN(a.timeslot) as TimeSlot,DATE_FORMAT(a.start_date, '%Y-%m-%d') as startDate,DATE_FORMAT(a.end_date, '%Y-%m-%d') as endDate,b.status,b.schedule_color,c.license_class FROM schedule_details a JOIN status_list b ON a.status_id=b.id and a.is_deleted=0 JOIN license_details c ON a.license_id=c.id GROUP BY a.status_id,a.license_id,a.start_date,a.end_date", function (err, scheduleList) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(scheduleList){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status': 'Success','data': scheduleList});
        }
    })
  });

//   ---------------update schedule details-----------------

  router.post('/updateScheduleDetails', validateSession,function (req, res) {
    var calendarData = req.body.calendarData;
    var timeslot=req.body.timeslot;
    if(calendarData.length > 0){
        calendarData.forEach((calendardt,idx)=>{
            pool.query("UPDATE schedule_details SET timeslot=(B'"+timeslot+"'),timeslot_bin='"+timeslot+"',updated_by='"+req.session.userInfo.id+"' WHERE id='"+calendardt.id+"'", function (err, setAssign) {
            if (err) {
                console.log("Problem with MySQL productcatalog",err);
            }
            if(setAssign){
                if(idx === calendarData.length-1){
                    //pool.release();
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).send({'status': 'Success'});
                }
            }
            })
        }) 
    }
  });

//   --------delete schedule details---------------------------
  
  router.post('/deleteScheduleDetails',validateSession, function (req, res) {
    var calendarData = req.body.calendarData;
    calendarData.forEach((calendarDt,idx)=>{
        pool.query("DELETE FROM schedule_details WHERE id='"+calendarDt.id+"'", function (err, AssignList) {
            if (err) {
                console.log("Problem with MySQL productcatalog",err);
            }
            if(AssignList){
                if(idx === calendarData.length-1){
                    //pool.release();
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).send({'status': 'Success'});
                }
            }
        })
    })
  });

//   -----------get retest  status list-----------------------------------

  router.get('/getRetestList', function (req, res) {
    pool.query("SELECT * FROM status_list WHERE test_flag='R'", function (err, AssignList) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(AssignList){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'data': AssignList});
        }
    })
  });

  //   -----------get retest details -----------------------------------

  
  router.get('/getRetestDetails',validateSession, function (req, res) {
    pool.query("SELECT a.*,c.license_class,b.status FROM retest_payment_details a JOIN status_list b ON a.status_id=b.id and a.is_deleted=0 JOIN license_details c ON a.license_id=c.id", function (err, retestData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(retestData){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'data': retestData});
        }
    })
  });

    //   -----------get retest exists details -----------------------------------

  router.post('/checkRetestExists', validateSession,function (req, res) {
    var retest_status = req.body.retest_status;
    var license_type = req.body.license_type;
    console.log("retest_status===",retest_status,license_type);
    pool.query("SELECT * FROM retest_payment_details WHERE status_id='"+retest_status.retest_type+"' and license_id='"+license_type.id+"' and package_offers='"+retest_status.package_offers+"' and is_deleted=0", function (err, retestExists) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(retestExists){
            var status=retestExists.length>0 ?'Exists':'Success';
            console.log("status===",status);
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status': status});
        }
    })
  });
  
    //   -----------insert retest details -----------------------------------


  router.post('/setRetestPayment',validateSession, function (req, res) {
    var retestData = req.body.retestData;
    var license_type = req.body.license_type;
    pool.query("SELECT * FROM retest_payment_details WHERE status_id='"+retestData.retest_type+"' and license_id='"+license_type.id+"' and package_offers='"+retestData.package_offers+"' and is_deleted=0", function (err, retestExists) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(retestExists){
            if(retestExists.length > 0){
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send({'status': 'Exists'});
            }else{
                pool.query("INSERT INTO retest_payment_details (status_id,license_id,package_offers,no_of_retest,retest_amount,created_by) VALUES ('"+retestData.retest_type+"','"+license_type.id+"','"+retestData.package_offers+"','"+retestData.no_of_times+"','"+retestData.retest_payment_amount+"','"+req.session.userInfo.id+"')", function (err, AssignList) {
                    if (err) {
                        console.log("Problem with MySQL productcatalog",err);
                    }
                    if(AssignList){
                        //pool.release();
                        res.setHeader('Content-Type', 'application/json');
                        res.status(200).send({'status': 'Success'});
                    }
                })
            }
            
        }
    })
  });
    //   -----------update retest details -----------------------------------


  router.post('/updateRetestPayment',validateSession, function (req, res) {
    var retestData = req.body.retestData;
    pool.query("UPDATE retest_payment_details SET retest_amount='"+retestData.retest_payment_amount+"',no_of_retest='"+retestData.no_of_times+"',updated_by='"+req.session.userInfo.id+"' WHERE id='"+retestData.id+"'", function (err, AssignList) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(AssignList){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status': 'Success'});
        }
    })
  });

    //   -----------delete retest details -----------------------------------

  router.post('/deleteRetestPayment',validateSession, function (req, res) {
    var retestData = req.body.retestData;
    pool.query("DELETE FROM retest_payment_details WHERE status_id='"+retestData.status_id+"' and license_id='"+retestData.license_id+"' and package_offers='"+retestData.package_offers+"'", function (err, AssignList) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(AssignList){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status': 'Success'});
        }
    })
  });

//   ------------get message status list---------------

  router.get('/getMessageList', function (req, res) {
    pool.query("SELECT * FROM status_list WHERE message_notification=1", function (err, messageList) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(messageList){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'data': messageList});
        }
    })
  });

  //   ------------insert message details---------------

  router.post('/setMessageDetails',validateSession, function (req, res) {
    var msgData = req.body.msgData;
    pool.query("SELECT * FROM message_details WHERE status_id='"+msgData.message_type+"'", function (err, msgExists) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(msgExists){
            if(msgExists.length > 0){
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send({'status': 'Exists'});
            }else{
                pool.query("INSERT INTO message_details (status_id,message_english,message_malay,created_by) VALUES ('"+msgData.message_type+"','"+msgData.message_english+"','"+msgData.message_malay+"','"+req.session.userInfo.id+"')", function (err, msgData) {
                    if (err) {
                        console.log("Problem with MySQL productcatalog",err);
                    }
                    if(msgData){
                        //pool.release();
                        res.setHeader('Content-Type', 'application/json');
                        res.status(200).send({'status': 'Success'});
                    }
                })
            }
        }
    })
  });

    //   ------------get message details---------------


  router.get('/getMessageDetails',validateSession, function (req, res) {
    pool.query("SELECT a.*,b.status FROM message_details a JOIN status_list b ON a.status_id=b.id and a.is_deleted=0", function (err, retestData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(retestData){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'data': retestData});
        }
    })
  });

    //  ------------check message existence details---------------

  router.post('/checkMessagetExists',validateSession, function (req, res) {
    var msg_status = req.body.msg_status;
    console.log("msg_status===",msg_status)
    pool.query("SELECT * FROM message_details WHERE status_id='"+msg_status+"'", function (err, retestExists) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(retestExists){
            var status=retestExists.length>0 ?'Exists':'Success';
            //pool.release();
            console.log("status===",status)
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status': status});
        }
    })
  });

//------------update message details---------------

  router.post('/updateMessageDetails',validateSession, function (req, res) {
    var msgData = req.body.msgData;
    pool.query("UPDATE message_details SET message_english='"+msgData.message_english+"',message_malay='"+msgData.message_malay+"',updated_by='"+req.session.userInfo.id+"' WHERE status_id='"+msgData.message_type+"'", function (err, AssignList) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(AssignList){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status': 'Success'});
        }
    })
  });

    // ------------delete message details---------------


  router.post('/deleteMessageDetails',validateSession, function (req, res) {
    var msgData = req.body.msgData;
    pool.query("DELETE FROM message_details WHERE status_id='"+msgData.status_id+"'", function (err, AssignList) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(AssignList){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status': 'Success'});
        }
    })
  });


// ------------insert time details---------------------------------

  router.post('/setTimeDetails',validateSession, function (req, res) {
    var timeData = req.body.timeData;
    pool.query("INSERT INTO time_master (working_hour_from,working_hour_to,rest_hour_from,rest_hour_to,cut_overtime,no_of_session,created_by) VALUES ('"+timeData.working_hour_from+"','"+timeData.working_hour_to+"','"+timeData.rest_hour_from+"','"+timeData.rest_hour_to+"','"+timeData.cut_over_time+"','"+timeData.no_of_session+"','"+req.session.userInfo.id+"')", function (err, msgData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(msgData){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status': 'Success'});
        }
    })
  });

  // ------------update time details---------------------------------

  router.post('/updateTimeDetails',validateSession, function (req, res) {
    var timeData = req.body.timeData;
    pool.query("UPDATE time_master SET cut_overtime='"+timeData.cut_over_time+"',no_of_session='"+timeData.no_of_session+"' WHERE id='"+timeData.id+"'", function (err, msgData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(msgData){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status': 'Success'});
        }
    })
  });
  
// ------------get time details---------------------------------

  router.get('/getTimeDetails',validateSession,function (req, res) {
    pool.query("SELECT * FROM time_master", function (err, timeData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(timeData){
            console.log("timeData=========",timeData)
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'data': timeData});
        }
    })
  });

//   --------get refund status list----------------

  router.get('/getRefundList', validateSession,function (req, res) {
    pool.query("SELECT * FROM status_list WHERE refund=1", function (err, refundList) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(refundList){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'data': refundList});
        }
    })
  });

//   --------check refund exists details----------------

  
  router.post('/checkRefundExists',validateSession, function (req, res) {
    var refundData = req.body.refundData;
    var license_type=req.body.license_type;
    console.log("refundData===",refundData)
    pool.query("SELECT * FROM refund_details WHERE status_id='"+refundData.refund_type+"' and license_id='"+license_type+"' and package_offers='"+refundData.package_offers+"'", function (err, retestExists) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(retestExists){
            var status=retestExists.length>0 ?'Exists':'Success';
            console.log("status===",status);
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status': status});
        }
    })
  });

  //   --------insert refund details----------------

  
  router.post('/setRefundDetails',validateSession, function (req, res) {
    var refundData = req.body.refundData;
    var license_type=req.body.license_type;
    pool.query("SELECT * FROM refund_details WHERE status_id='"+refundData.refund_type+"' and license_id='"+license_type+"' and package_offers='"+refundData.package_offers+"'", function (err, retestExists) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(retestExists){
            if(retestExists.length > 0){
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send({'status': 'Exists'});
            }else{
                pool.query("INSERT INTO refund_details (status_id,license_id,package_offers,refund_amount,refund_mode,created_by) VALUES ('"+refundData.refund_type+"','"+license_type+"','"+refundData.package_offers+"','"+refundData.refund_amount+"','"+refundData.refund_mode+"','"+req.session.userInfo.id+"')", function (err, AssignList) {
                    if (err) {
                        console.log("Problem with MySQL productcatalog",err);
                    }
                    if(AssignList){
                        res.setHeader('Content-Type', 'application/json');
                        res.status(200).send({'status': 'Success'});
                    }
                })
            }
          
        }
    })
  });
  
//   --------get refund details---------------

  router.get('/getRefundDetails',validateSession, function (req, res) {
    pool.query("SELECT a.*,b.status,c.license_class FROM refund_details a JOIN status_list b ON a.status_id=b.id JOIN license_details c ON a.license_id=c.id", function (err, retestData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(retestData){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'data': retestData});
        }
    })
  });

  //   --------update refund details----------------

  router.post('/updateRefundDetails',validateSession, function (req, res) {
    var refundData = req.body.refundData;
    var license_type = req.body.license_type;
    pool.query("UPDATE refund_details SET refund_amount='"+refundData.refund_amount+"',refund_mode='"+refundData.refund_mode+"',updated_by='"+req.session.userInfo.id+"' WHERE status_id='"+refundData.refund_type+"' and license_id='"+license_type+"' and package_offers='"+refundData.package_offers+"'", function (err, AssignList) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(AssignList){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status': 'Success'});
        }
    })
  });

  //   --------delete refund details----------------

  
  router.post('/deleteRefund',validateSession, function (req, res) {
    var refundData = req.body.refundData;
    var license_type = req.body.license_type;
    pool.query("DELETE FROM refund_details WHERE status_id='"+refundData.status_id+"' and license_id='"+license_type+"' and package_offers='"+refundData.package_offers+"'", function (err, AssignList) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(AssignList){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status': 'Success'});
        }
    })
  });


// ------------to get All NRIC Number for Timeline---------------------

router.get('/getAllNRICNumber', function (req, res) {
    pool.query("SELECT id,name,nric_number,date_of_birth,gender,mobile_number,email_id,address_nric,city,state,cur_date FROM student_details WHERE nric_number IS NOT NULL and is_deleted=0 and is_active=1", function (err, licenseData) {
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

// ------------to get All Passport Number for Timeline---------------------


router.get('/getAllPassportNumber', function (req, res) {
    pool.query("SELECT id,name,date_of_birth,gender,mobile_number,email_id,address_nric,city,state,passport_number,cur_date FROM student_details WHERE passport_number IS NOT NULL and is_deleted=0 and is_active=1", function (err, licenseData) {
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

// ------------to get Enroll Number list---------------------------------


router.post('/getEnrollmentNumberList',validateSession, function (req, res) {
    var studentid=req.body.studentdt;
    pool.query("SELECT id,enrollment_no,student_id FROM student_enroll_details WHERE student_id='"+studentid+"' and is_removed=0", function (err, licenseData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(licenseData){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status':'Success','data':licenseData});
        }
    })
});

 
// ----------------------------  Student Schedule--------------------------------------------------

// ----------------get NRIC Number list for Schedule----------------------

router.get('/getNRICNumberForStudentSchedule', function (req, res) {
    pool.query("SELECT id,nric_number,name,email_id,mobile_number,address_nric,city,state,gender,date_of_birth FROM student_details WHERE nric_number IS NOT NULL and is_deleted=0 and is_active=1", function (err, licenseData) {
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


// ----------------get Passport Number list for Schedule----------------------

router.get('/getPassportNumberForStudentSchedule', function (req, res) {
    pool.query("SELECT id,passport_number,name,email_id,mobile_number,address_nric,city,state,gender,date_of_birth FROM student_details WHERE passport_number IS NOT NULL and is_deleted=0 and is_active=1", function (err, licenseData) {
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


// ----------------get Enrollment Number list for Schedule----------------------

router.post('/getEnrollmentNumberForSchedule',validateSession, function (req, res) {
    var studentId=req.body.studentId;
    // and a.status_id NOT IN (16,17,18)
    pool.query("SELECT a.* FROM student_enroll_details a WHERE  a.student_id='"+studentId+"' and a.is_removed=0", function (err, enrollData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(enrollData){
            // console.log("getScheduleDetails======",scheduleList);
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status':'Success','enrollData':enrollData});
               
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

router.post('/getStudentSchedulePerEnroll',validateSession, function (req, res) {
    var studentInfo=req.body.studentInfo;
    var statusId=req.body.statusId;
    var curDate=moment(new Date()).format("YYYY-MM-DD");
    console.log("studentInfo====per enrolllllllll=======",studentInfo,statusId);
    // if(status_id)
    pool.query("SELECT * FROM student_status_details WHERE student_id='"+studentInfo.student_id+"' and enroll_id='"+studentInfo.enroll_id+"' and license_id='"+studentInfo.license_id+"' and status_id='"+studentInfo.status_id+"' ORDER BY id DESC LIMIT 1", function (err, statusInfo) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(statusInfo){
            console.log("statusInfo-----",statusInfo);
            var completedDate=moment(new Date(statusInfo[0].completed_date)).format("YYYY-MM-DD");
            pool.query("SELECT a.*,BIN(a.timeslot) as TimeSlot,DATE(a.start_date) as start_Date,DATE(a.end_date) as end_Date,b.status,b.schedule_color FROM schedule_details a JOIN status_list b ON a.license_id='"+studentInfo.license_id+"' and a.status_id=(SELECT id from status_list WHERE id = "+statusId+" and schedule=1 and license_process='"+studentInfo.license_process+"' ORDER BY id ASC LIMIT 1) and '" + completedDate + "' < DATE(a.start_date) and a.status_id=b.id and a.is_deleted=0 GROUP BY a.status_id,a.start_date,a.end_date", function (err, scheduleList) {
                if (err) {
                    console.log("Problem with MySQL productcatalog",err);
                }
                if(scheduleList){
                    var dateArray = new Array();
                    if(scheduleList.length > 0){
                        console.log("scheduleList============",scheduleList)
                        var idx = 0;
                            function checkScheduled(){
                                async.eachOfSeries(scheduleList, function() {
                                    scheduleDt = scheduleList[idx];
                                    var dateList=getDates(scheduleDt.start_Date,scheduleDt.end_Date,scheduleDt,dateArray);
                                    idx++;
                                    if(idx == scheduleList.length){
                                        console.log("dateList----------",dateList);
                                        var idx1 = 0;
                                        function processScheduled(){
                                            async.eachOfSeries(dateList, function() {
                                                datedt = dateList[idx1];
                                                var checkDate=moment(new Date(datedt.startDate)).format("YYYY-MM-DD");
                                                pool.query("SELECT *,BIN(timeslot) as TimeSlot,DATE(schedule_date) as startDate FROM student_schedule_details WHERE student_id='"+studentInfo.student_id+"' and enroll_id='"+studentInfo.enroll_id+"' and license_id='"+studentInfo.license_id+"' and status_id='"+statusId+"' and DATE(schedule_date)='"+checkDate+"'", function (err, existingSchedule) {
                                                    if (err) {
                                                        console.log("Problem with MySQL productcatalog",err);
                                                    }
                                                    if(existingSchedule){
                                                        if(existingSchedule.length > 0){
                                                            console.log("datedt-------",datedt);
                                                            // datedt['schedule_color']='fc-event-success';
                                                            datedt['schedule_color']='fc-event-success';
                                                            idx1++;
                                                            if(idx1 == dateList.length){
                                                                console.log("dateList====111111====",dateList);
            
                                                                res.setHeader('Content-Type', 'application/json');
                                                                res.status(200).send({'status':'Success','scheduleList': dateList});
                                                            }else{
                                                                processScheduled();
                                                            }
                                                        }else{
                                                            // datedt['schedule_color']='fc-event-primary';
                                                            idx1++
                                                            if(idx1 == dateList.length){
                                                                console.log("dateList=====222222222===",dateList);
            
                                                                res.setHeader('Content-Type', 'application/json');
                                                                res.status(200).send({'status':'Success','scheduleList': dateList});
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
                    }else{
                        res.setHeader('Content-Type', 'application/json');
                        res.status(200).send({'status':'Success','scheduleList': scheduleList});
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
    console.log("enrollData=======",calendarInfo)
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
            pool.query("SELECT *,BIN(timeslot) as TimeSlot,DATE(schedule_date) as startDate FROM student_schedule_details WHERE student_id='"+enrollData.studentId+"' and enroll_id='"+enrollData.enrollId+"' and license_id='"+enrollData.licenseId+"' and status_id='"+enrollData.statusId+"' and DATE(schedule_date)='"+startDate+"'", function (err, existingSchedule) {
                if (err) {
                    console.log("Problem with MySQL productcatalog",err);
                }
                if(existingSchedule){
                    pool.query("SELECT COUNT(*) as scheduleCount FROM student_schedule_details WHERE license_id='"+enrollData.licenseId+"' and status_id='"+enrollData.statusId+"' and DATE(schedule_date)='"+startDate+"'", function (err, schedCount) {
                        if (err) {
                            console.log("Problem with MySQL productcatalog",err);
                        }
                        if(schedCount){
                            //pool.release();
                            res.setHeader('Content-Type', 'application/json');
                            res.status(200).send({'status': 'Success','scheduleList': scheduleList,'existingSchedule':existingSchedule,'schedCount':schedCount});
                        }
                    })
                }
            })
        }
    })
}); 

//----------------insert student schedule details------------------------------

router.post('/setStudentScheduleInfo',validateSession, function (req, res) {
    var finalArray=req.body.finalArray;
    var enrollData=req.body.enrollData;
    var rangelist=req.body.rangelist;
    var scheduleDate = moment(new Date(enrollData.scheduleDate)).format("YYYY-MM-DD");
    
    console.log("finalArray----",finalArray,enrollData);
    pool.query("DELETE FROM student_schedule_details WHERE student_id='"+enrollData.studentId+"' and enroll_id ='"+enrollData.enrollId+"' and license_id='"+enrollData.licenseId+"' and status_id='"+enrollData.statusId+"' and schedule_date='"+scheduleDate+"'  and schedule_status=0", function (err, delData) {
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
                                                        request(smsOpt, function (error, response, body) {
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

//----------------insert student schedule details for KPP01------------------------------

router.post('/setStudentScheduleInfoForKPP01',validateSession, function (req, res) {
    var enrollData=req.body.enrollData;
    var scheduleDate = moment(new Date(enrollData.scheduleDate)).format("YYYY-MM-DD");
    
    console.log("enrollData----",enrollData);
    pool.query("DELETE FROM student_schedule_details WHERE student_id='"+enrollData.studentId+"' and enroll_id ='"+enrollData.enrollId+"' and license_id='"+enrollData.licenseId+"' and status_id='"+enrollData.statusId+"' and schedule_date='"+scheduleDate+"' and schedule_status=0", function (err, delData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(delData){
            pool.query("INSERT INTO student_schedule_details (student_id,enroll_id,license_id,status_id,schedule_date,schedule_view) VALUES ('"+enrollData.studentId+"','"+enrollData.enrollId+"','"+enrollData.licenseId+"','"+enrollData.statusId+"','"+scheduleDate+"','"+enrollData.schedule_view+"')", function (err, setSchedule) {
                if (err) {
                    console.log("Problem with MySQL productcatalog",err);
                }
                if(setSchedule){
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
                                            uri: smsConfig.url+'apiusername='+smsConfig.apiusername+'&apipassword='+smsConfig.apipassword+'&mobileno=+6'+mobile_no+'&senderid='+smsConfig.senderid+'&languagetype='+smsConfig.languagetype+'&message='+smsContent+' '+scheduleDate +'.' 
                                        };

                                        var mailOpt={
                                            from: 'info@smamano.my',
                                            to: email_id, // list of receivers
                                            subject: messageData.status+' Schedule', // Subject line
                                            html:'<html><h3>Dear '+studData[0].name+',</h3><br/>'+mailContent+' '+scheduleDate +' .</html>'    
                                        }
                                        
                                        function myNewFunc() {
                                            console.log("mailOpt===========",mailOpt,smsOpt,enrollData.statusId);
                                            transporter.sendMail(mailOpt, function (error, message) {
                                                if (error) {
                                                    return console.log(error);
                                                }
                                                if (message) {
                                                    request(smsOpt, function (error, response, body) {
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
        }
    })
});

// ----------------------delete student schedule details--------------------------------------

router.post('/deleteStudentSchedule',validateSession, function (req, res) {
    var enrollData=req.body.enrollData;
    var scheduleDate = moment(new Date(enrollData.scheduleDate)).format("YYYY-MM-DD");
    
    console.log("enrollData----",enrollData);
    pool.query("DELETE FROM student_schedule_details WHERE student_id='"+enrollData.studentId+"' and enroll_id ='"+enrollData.enrollId+"' and license_id='"+enrollData.licenseId+"' and status_id='"+enrollData.statusId+"' and schedule_date='"+scheduleDate+"' and schedule_status=0", function (err, delData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(delData){
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status':'Success'});
        }
    })
})

// ------------------- insert payment details---------------------------------------

router.post('/setPaymentDetails',validateSession, function (req, res) {
    var amountToBePaid=req.body.amountToBePaid;
    var payment_type=req.body.payment_type;
    var reference_no=req.body.reference_no;
    var license_type=req.body.license_type;
    var q="";
    if(payment_type == 'Cash'){
        q="INSERT INTO payment_details (student_id,enroll_id,license_id,status_id,payment_amount,payment_flag,payment_status,receipt_no,payment_method) VALUES ('"+license_type.student_id+"','"+license_type.enroll_id+"','"+license_type.license_id+"','"+license_type.status_id+"','"+amountToBePaid+"','Pay','Success','"+reference_no+"','"+payment_type+"')";
    }else if(payment_type == 'Card'){
        q="INSERT INTO payment_details (student_id,enroll_id,license_id,status_id,payment_amount,payment_flag,payment_status,transaction_id,payment_method) VALUES ('"+license_type.student_id+"','"+license_type.enroll_id+"','"+license_type.license_id+"','"+license_type.status_id+"','"+amountToBePaid+"','Pay','Success','"+reference_no+"','"+payment_type+"')";
    }else if(payment_type == 'Cheque'){
        q="INSERT INTO payment_details (student_id,enroll_id,license_id,status_id,payment_amount,payment_flag,payment_status,cheque_no,payment_method) VALUES ('"+license_type.student_id+"','"+license_type.enroll_id+"','"+license_type.license_id+"','"+license_type.status_id+"','"+amountToBePaid+"','Pay','Success','"+reference_no+"','"+payment_type+"')";
    }
    console.log("pay-------license_type----------",license_type,amountToBePaid)
    pool.query(q, function (err, enrollData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(enrollData){
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status':'Success'});
        }
    })
});

// --------------------check session per week----------------------------------

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

// ---------------------------Timeline----------------------------------------------

// --------------to get status list----------------------------

router.get('/getStatusList', function (req, res) {
    pool.query("SELECT id,status FROM status_list", function (err, licenseData) {
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

// ---------------to get status list for timeline--------------------


router.post('/getStatusListForTimeLine', function (req, res) {
    var enrollvalue=req.body.enrollvalue;
    console.log("enrollvalue============",enrollvalue);
    if(enrollvalue.license_category == 'Upgrade' || enrollvalue.license_category == 'Advance' || enrollvalue.license_category == 'L-License'){
        pool.query("SELECT * FROM status_list WHERE license_process='"+enrollvalue.license_process+"' and id NOT IN (4,5,6,7)", function (err, statusData) {
            if (err) {
                console.log("Problem with MySQL productcatalog",err);
            }
            if(statusData){
                var statusId=(enrollvalue.status_id == 3 ? 7 : enrollvalue.status_id)
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

router.post('/checkTimelineForStudent',validateSession, function (req, res) {
    var studentdt=req.body.studentdt;
    console.log("studentdt===========",studentdt)
    var studentid=studentdt.student_id;
    var tranid=studentdt.enroll_id;
    var licenseid=studentdt.license_id;
    pool.query("SELECT * FROM student_status_details WHERE student_id='"+studentid+"' and enroll_id='"+tranid+"' and license_id='"+licenseid+"'", function (err, timelineData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(timelineData){
            if(timelineData.length > 0){
                var idx=0;
                function getPaymentInfo(){
                    async.eachOfSeries(timelineData, function() {
                        timeDt = timelineData[idx];
                        pool.query("SELECT * FROM payment_details WHERE student_id='"+studentid+"' and enroll_id='"+tranid+"' and license_id='"+licenseid+"' and status_id='"+timeDt.status_id+"' and payment_status='Success' ORDER BY id DESC LIMIT 1", function (err, payData) {
                            if (err) {
                                console.log("Problem with MySQL productcatalog",err);
                            }
                            if(payData){
                                timeDt.payInfo=payData;
                                idx++;
                                if(idx == timelineData.length){
                                    pool.query("SELECT a.enrollment_no,b.*,c.package_english,c.package_malay,c.package_offers,d.license_class FROM student_enroll_details a JOIN student_license_details b ON a.id='"+tranid+"' and a.id=b.enroll_id and b.license_id='"+licenseid+"' JOIN package_details c ON a.package_id=c.id JOIN license_details d ON b.license_id=d.id", function (err, licenseInfo) {
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
                pool.query("SELECT a.enrollment_no,b.*,c.package_english,c.package_malay,c.package_offers,d.license_class FROM student_enroll_details a JOIN student_license_details b ON a.id='"+tranid+"' and a.id=b.enroll_id and b.license_id='"+licenseid+"' JOIN package_details c ON a.package_id=c.id JOIN license_details d ON b.license_id=d.id", function (err, licenseInfo) {
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


// ---------------------show student info---------------------------------
router.post('/getStudPackageInfo',validateSession, function (req, res) {
    var enrollValue=req.body.enrollValue;
    console.log("pay-------enrollValue----------",enrollValue)
    pool.query("SELECT a.enrollment_no,b.*,c.package_english,c.package_malay,c.package_desc_english,c.package_desc_malay,c.package_offers,d.license_class,d.license_desc_english,d.license_desc_malay FROM student_enroll_details a JOIN student_license_details b ON a.id='"+enrollValue.enroll_id+"' and a.id=b.enroll_id and b.license_id='"+enrollValue.license_id+"' JOIN package_details c ON a.package_id=c.id JOIN license_details d ON b.license_id=d.id", function (err, packageData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(packageData){
            console.log("packageData====",packageData);
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status':'Success','data':packageData});
        }
    })
});

// --------------------view Instructor details from timeline---------------------

router.post('/viewInstructorDetails',validateSession, function (req, res) {
    var enrollData=req.body.enrollData;
    var statusid=req.body.statusid;
    console.log("enrollData=====",enrollData);
  pool.query("SELECT BIN(a.timeslot) as TimeSlot,DATE(a.schedule_date) as scheduleDate,a.schedule_status,a.schedule_remarks,b.name,b.mobile_no,b.email_id FROM student_schedule_details a JOIN employee_details b ON a.student_id='"+enrollData.student_id+"' and a.enroll_id='"+enrollData.enroll_id+"' and a.license_id='"+enrollData.license_id+"' and a.status_id='"+statusid+"' and a.employee_id=b.id ORDER BY a.schedule_date DESC", function (err, insData) {
      if (err) {
          console.log("Problem with MySQL productcatalog",err);
      }
      if(insData){
          console.log("insData===========",insData)
          res.setHeader('Content-Type', 'application/json'); 
          res.status(200).send({'insData':insData});
      }
  })
});

// ------------------check status list for update PDL---------------------------

router.post('/getStatusListForStudent',validateSession, function (req, res) {
    var enrollValue=req.body.enrollValue;
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
                }else if(testStatus[0].test_flag == 'R'){
                    pool.query("SELECT * FROM status_list WHERE owner_id=(SELECT id FROM role_master WHERE role='Student') and license_process='"+testStatus[0].license_process+"' and id NOT IN (16,17,18) and id='"+testStatus[0].status_id+"'", function (err, statusList) {
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
            }else if(testStatus[0].result == 'Pass'){
                console.log("SELECT * FROM status_list WHERE owner_id=(SELECT id FROM role_master WHERE role='Student')  and id NOT IN (16,17,18) and test_flag NOT IN ('R') and id > (SELECT status_id FROM student_license_details WHERE enroll_id='"+enrollValue.enroll_id+"' and license_id='"+enrollValue.license_id+"' ) ORDER BY id ASC LIMIT 1")
                pool.query("SELECT * FROM status_list WHERE owner_id=(SELECT id FROM role_master WHERE role='Student') and license_process='"+testStatus[0].license_process+"'  and id NOT IN (16,17,18) and test_flag NOT IN ('R') and id > (SELECT status_id FROM student_license_details WHERE enroll_id='"+enrollValue.enroll_id+"' and license_id='"+enrollValue.license_id+"' ) ORDER BY id ASC LIMIT 1", function (err, statusList) {
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
            pool.query("SELECT * FROM status_list WHERE owner_id=(SELECT id FROM role_master WHERE role='Student') and license_process='"+testStatus[0].license_process+"'  and id NOT IN (16,17,18) and id > (SELECT status_id FROM student_license_details WHERE enroll_id='"+enrollValue.enroll_id+"' and license_id='"+enrollValue.license_id+"' ) ORDER BY id ASC LIMIT 1", function (err, statusList) {
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

// ---------------------update student status-------------------------------------

router.post('/updateStudentStatusInfo',validateSession, function (req, res) {
    var enrollValue=req.body.enrollValue;
    var statusdt=req.body.statusdt;
    console.log("enrollValue----------",enrollValue,statusdt);
    var curDate=moment(new Date()).format("YYYY-MM-DD hh:mm");
    var marks=statusdt.marks != '' ? statusdt.marks : null;
    var rating=statusdt.rating != '' ? statusdt.rating : null;
      console.log("marks-----",marks)
      console.log("INSERT INTO student_status_details (student_id,enroll_id,license_id,status_id,result,rating,marks,remarks,completed_date,updated_by) VALUES ('"+enrollValue.student_id+"','"+enrollValue.enroll_id+"','"+enrollValue.license_id+"','"+statusdt.status_id+"','"+statusdt.result+"',"+rating+","+marks+",'"+statusdt.remarks+"','"+curDate+"','"+req.session.userInfo.id+"')")
      pool.query("INSERT INTO student_status_details (student_id,enroll_id,license_id,status_id,result,rating,marks,remarks,completed_date,updated_by) VALUES ('"+enrollValue.student_id+"','"+enrollValue.enroll_id+"','"+enrollValue.license_id+"','"+statusdt.status_id+"','"+statusdt.result+"',"+rating+","+marks+",'"+statusdt.remarks+"','"+curDate+"','"+req.session.userInfo.id+"')", function (err, updateStatus) {
          if (err) {
              console.log("Problem with MySQL productcatalog",err);
          }
          if(updateStatus){
            pool.query("UPDATE student_license_details SET status_id='"+statusdt.status_id+"',result='"+statusdt.result+"' WHERE student_id='"+enrollValue.student_id+"' and enroll_id='"+enrollValue.enroll_id+"' and license_id='"+enrollValue.license_id+"'", function (err, studData) {
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


// --------------------------------------------------license processing--------------

//-----------get NRIC Number for processing---------------------

router.get('/getNRICNumberToApplyRefund', function (req, res) {
    pool.query("SELECT id,nric_number,name,date_of_birth,gender,mobile_number,email_id,address_nric,city,state FROM student_details WHERE nric_number IS NOT NULL and is_deleted=0 and is_active=1", function (err, licenseData) {
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

//-----------get Passport Number for processing---------------------


router.get('/getPassportNumberToApplyRefund', function (req, res) {
    pool.query("SELECT id,passport_number,name,date_of_birth,gender,mobile_number,email_id,address_nric,city,state FROM student_details WHERE passport_number IS NOT NULL and is_deleted=0 and is_active=1", function (err, licenseData) {
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

// -------------checking data for license process-----------------------

router.post('/checkForLicenseProcess',validateSession, function (req, res) {
    var enrolldata=req.body.enrolldata;
    var studentid=enrolldata.student_id;
    var enrollid=enrolldata.enroll_id;
    console.log("pay-------enrollValue----------",studentid,enrollid)
    pool.query("SELECT a.enrollment_no,b.*,c.package_english,c.package_malay,c.package_offers,d.license_class FROM student_enroll_details a JOIN student_license_details b ON a.id='"+enrollid+"' and a.id=b.enroll_id and b.license_id='"+enrolldata.license_id+"' JOIN package_details c ON a.package_id=c.id JOIN license_details d ON b.license_id=d.id", function (err, packageData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(packageData){
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status':'Success','data':packageData});
        }
    })
});

router.post('/setLicenseProcessing',validateSession, function (req, res) {
    var enrolldata=req.body.enrolldata
    var studentid=enrolldata.student_id;
    var enrollid=enrolldata.enroll_id;
    var licenseProcessData=req.body.licenseProcessData;
    var license_expiry=moment(new Date(licenseProcessData.expiry_date)).format("YYYY-MM-DD");
    console.log("pay-------enrollValue----------",licenseProcessData);
    var q="";
    var q1="";
    var currentStatus='';
    if(licenseProcessData.license_type  == 'LDL'){
        q="UPDATE student_license_details SET LDL_license_no='"+licenseProcessData.license_no+"',LDL_expiry_date='"+license_expiry+"',LDL_renewal_amount="+licenseProcessData.renewal_amount+" WHERE student_id='"+studentid+"' and enroll_id='"+enrollid+"' and license_id='"+enrolldata.license_id+"'"
        q1="SELECT * FROM message_details WHERE status_id=7 and is_deleted=0";
        currentStatus="LDL is Ready"
    }else if(licenseProcessData.license_type  == 'PDL'){
        q="UPDATE student_license_details SET PDL_license_no='"+licenseProcessData.license_no+"',PDL_expiry_date='"+license_expiry+"',PDL_renewal_amount="+licenseProcessData.renewal_amount+" WHERE student_id='"+studentid+"' and enroll_id='"+enrollid+"' and license_id='"+enrolldata.license_id+"'"
        q1="SELECT * FROM message_details WHERE status_id=15 and is_deleted=0";
        currentStatus="PDL is Ready"
    }
    else if(licenseProcessData.license_type  == 'GDL'){
        q="UPDATE student_license_details SET GDL_license_no='"+licenseProcessData.license_no+"',GDL_expiry_date='"+license_expiry+"',GDL_renewal_amount="+licenseProcessData.renewal_amount+" WHERE student_id='"+studentid+"' and enroll_id='"+enrollid+"' and license_id='"+enrolldata.license_id+"'"
        q1="SELECT * FROM message_details WHERE status_id=26 and is_deleted=0";
        currentStatus="GDL is Ready"
    }
    else if(licenseProcessData.license_type  == 'PSV'){
        q="UPDATE student_license_details SET PSV_license_no='"+licenseProcessData.license_no+"',PSV_expiry_date='"+license_expiry+"',PSV_renewal_amount="+licenseProcessData.renewal_amount+" WHERE student_id='"+studentid+"' and enroll_id='"+enrollid+"' and license_id='"+enrolldata.license_id+"'"
        q1="SELECT * FROM message_details WHERE status_id=34 and is_deleted=0";
        currentStatus="PSV is Ready"
    }
    pool.query(q, function (err, licProcess) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(licProcess){
            pool.query("SELECT a.name,a.mobile_number,a.email_id,b.type as pref_language FROM student_details a JOIN preference_master b ON a.id='"+studentid+"' and a.prefered_lang_id=b.id", function (err, studData) {
                if (err) {
                    console.log("Problem with MySQL productcatalog",err);
                }
                if(studData){
                    pool.query(q1, function (err, messageInfo) {
                        if (err) {
                            console.log("Problem with MySQL productcatalog",err);
                        }
                        if(messageInfo){
                            if(messageInfo.length > 0){
                                var messageData=messageInfo[0];
                                console.log("messageInfo=======",studData);
                                var mobile_no=studData[0].mobile_number;
                                var email_id=studData[0].email_id;     
                                var pref_lang=studData[0].pref_language;
                                var mailContent = messageData['message_'+pref_lang];
                                var smsContent = messageData['message_'+pref_lang];
                                console.log("-------------",email_id,mobile_no,smsContent);
                                var smsOpt = {
                                    uri: smsConfig.url+'apiusername='+smsConfig.apiusername+'&apipassword='+smsConfig.apipassword+'&mobileno=+6'+mobile_no+'&senderid='+smsConfig.senderid+'&languagetype='+smsConfig.languagetype+'&message='+smsContent+'' 
                                };

                                var mailOpt={
                                    from: 'info@smamano.my',
                                    to: email_id, // list of receivers
                                    subject: currentStatus, // Subject line
                                    html:'<html><h3>Dear '+studData[0].name+',</h3><br/>'+mailContent+'</html>'    
                                }
                                
                                function myNewFunc() {
                                    console.log("mailOpt===========",mailOpt,smsOpt);
                                    transporter.sendMail(mailOpt, function (error, message) {
                                        if (error) {
                                            return console.log(error);
                                        }
                                        if (message) {
                                            request(smsOpt, function (error, response, body) {
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
});


//-----------get refund details for students---------------------


router.post('/getRefundDetailsForStudents',validateSession, function (req, res) {
    var enrolldata=req.body.enrolldata;
    var studentid=enrolldata.student_id;
    var enrollid=enrolldata.enroll_id;
    var licenseid=enrolldata.license_id
    pool.query("SELECT f.name,b.enrollment_no,a.status_id,a.enroll_id,a.license_id,c.license_class,b.payment_phase,d.package_english,d.package_malay,d.package_offers,e.english,e.malay,a.final_price,g.status,h.payment_amount as amountPaid,i.status as payment_level FROM student_license_details a JOIN student_enroll_details b ON a.student_id='"+studentid+"' and a.enroll_id='"+enrollid+"' and a.license_id='"+licenseid+"' and a.student_id=b.student_id and a.enroll_id=b.id JOIN license_details c ON a.license_id=c.id JOIN package_details d ON b.package_id=d.id JOIN payment_phases_master e ON b.payment_phase=e.id JOIN student_details f ON a.student_id=f.id JOIN status_list g ON a.status_id=g.id and g.refund=1 JOIN payment_details h ON a.student_id=h.student_id and a.enroll_id=h.enroll_id and a.license_id=h.license_id and h.payment_flag='Pay' and h.payment_status='Success' JOIN status_list i ON h.status_id=i.id", function (err, payHeader) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(payHeader){
            // console.log("Nuber of one's------",bitdt.match(/1/g).length);
            if(payHeader.length > 0){
                var paydt=payHeader[0];
                pool.query("SELECT * FROM refund_details WHERE status_id IN (SELECT id FROM status_list WHERE id <= '"+paydt.status_id+"') and license_id='"+licenseid+"' and package_offers='"+paydt.package_offers+"'", function (err, refundInfo) {
                    if (err) {
                        console.log("Problem with MySQL productcatalog",err);
                    }  
                    if(refundInfo){
                        if(refundInfo.length > 0){
                            var refundAmount=0;
                            var idx = 0;
                            function refundCalculation(){
                                async.eachOfSeries(refundInfo, function() {
                                    refunddt = refundInfo[idx];
                                    if(refunddt.refund_mode ==  'Per Hour'){
                                        pool.query("SELECT BIN(a.timeslot) as TimeSlot FROM student_schedule_details WHERE student_id='"+studentid+"' and enroll_id='"+enrollid+"' and license_id='"+licenseid+"' and status_id='"+paydt.status_id+"'", function (err, scheduleDt) {
                                            if (err) {
                                                console.log("Problem with MySQL productcatalog",err);
                                            }
                                            if(scheduleDt){
                                                console.log("scheduleDt---------",scheduleDt);
                                                var numberOfHours=0;
                                                scheduleDt.forEach((data,idx1)=>{
                                                    numberOfHours= numberOfHours+ ((data.TimeSlot == 0 || data.TimeSlot == null) ? 0 : data.TimeSlot.match(/1/g).length);
                                                    if(idx1 === scheduleDt.length - 1){
                                                        refunddt.numberOfHours=numberOfHours;
                                                        refundAmount = refundAmount+(numberOfHours * refunddt.refund_amount);
                                                        idx++;
                                                        if(idx == refundInfo.length){
                                                            res.setHeader('Content-Type', 'application/json');
                                                            res.status(200).send({'status':'Success','data':payHeader,'refundInfo':refundInfo,'refundAmount':refundAmount});
                                                        }else{
                                                            refundCalculation();
                                                        }
                                                    }
                                                })
                                            }
                                        })  
                                    }else{
                                        refundAmount=refundAmount + refunddt.refund_amount;
                                        idx++;
                                        if(idx == refundInfo.length){
                                            res.setHeader('Content-Type', 'application/json');
                                            res.status(200).send({'status':'Success','data':payHeader,'refundInfo':refundInfo,'refundAmount':refundAmount});
                                        }else{
                                            refundCalculation();
                                        }
                                    }
                                })
                            }
                            refundCalculation();

                        }else{
                            res.setHeader('Content-Type', 'application/json');
                            res.status(200).send({'status':'Success','data':payHeader,'refundInfo':[],'refundAmount':0});
                        }
                    }
                })
            }else{
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send({'status':'Success','data':payHeader});
            }
        }
    })
});

// -----------set refund confirmation details--------------

router.post('/setRefundConfirmation',validateSession, function (req, res) {
    var enrolldata=req.body.enrolldata;
    var studentid=enrolldata.student_id;
    var enrollid=enrolldata.enroll_id;
    var licenseid=enrolldata.license_id
    var refundAmount=req.body.refundAmount;
    var remarks=req.body.remarks;
    var curDate=moment(new Date()).format("YYYY-MM-DD hh:mm");

    pool.query("INSERT INTO payment_details(student_id,enroll_id,license_id,status_id,payment_flag,payment_amount,payment_status,remarks) VALUES('"+studentid+"','"+enrollid+"','"+licenseid+"',17,'Refund','"+refundAmount+"','Success','"+remarks+"')", function (err, payHeader) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(payHeader){
            pool.query("INSERT INTO student_status_details(student_id,enroll_id,license_id,status_id,completed_date,updated_by) VALUES('"+studentid+"','"+enrollid+"','"+licenseid+"','17','"+curDate+"','"+req.session.userInfo.id+"')", function (err, payHeader) {
                if (err) {
                    console.log("Problem with MySQL productcatalog",err);
                }
                if(payHeader){
                    pool.query("UPDATE student_license_details SET status_id='17' WHERE student_id='"+studentid+"' and enroll_id='"+enrollid+"' and license_id='"+licenseid+"'", function (err, payHeader) {
                        if (err) {
                            console.log("Problem with MySQL productcatalog",err);
                        }
                        if(payHeader){
                            //pool.release();
                            res.setHeader('Content-Type', 'application/json');
                            res.status(200).send({'status':'Success'});
                        }
                    })
                }
            })
        }
    })
});

//------------------check for renewal process---------------------------------------


router.post('/checkForRenewalProcess',validateSession, function (req, res) {
    var enrolldata=req.body.enrolldata;
    var studentid=enrolldata.student_id;
    var enrollid=enrolldata.enroll_id;
    var licenseid=enrolldata.license_id;
    var statusid=enrolldata.status_id;
    var curdate = moment(new Date()).format("YYYY-MM-DD");
    var q="";
    pool.query("SELECT * FROM student_license_details WHERE student_id='"+studentid+"' and enroll_id='"+enrollid+"' and license_id='"+licenseid+"'", function (err, licenseData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(licenseData){
            var licenseInfo=licenseData[0];
            console.log("licenseInfo-----------------",licenseInfo)
            if(enrolldata.license_process == 'PDL'){ 
                if(licenseInfo.LDL_license_no != null && licenseInfo.PDL_license_no == null && statusid >= 7){
                    console.log("LDL----renewal-------------------")
                    q="SELECT b.id,b.enrollment_no,b.student_id,a.license_id,a.status_id,a.result,DATE(a.LDL_expiry_date) as expiryDate,a.LDL_renewal_amount as renewalAmount FROM student_license_details a JOIN student_enroll_details b ON  a.student_id='"+studentid+"' and a.enroll_id='"+enrollid+"' and a.license_id='"+licenseid+"' and '"+curdate+"' <= DATE(a.LDL_expiry_date) and a.student_id=b.student_id and a.enroll_id=b.id";  
                }
                else if(licenseInfo.LDL_license_no != null && licenseInfo.PDL_license_no != null && statusid >= 15){
                    console.log("PDL----renewal-------------------")
                    q="SELECT b.id,b.enrollment_no,b.student_id,a.license_id,a.status_id,a.result,DATE(a.PDL_expiry_date) as expiryDate,a.PDL_renewal_amount as renewalAmount FROM student_license_details a JOIN student_enroll_details b ON  a.student_id='"+studentid+"' and a.enroll_id='"+enrollid+"' and a.license_id='"+licenseid+"' and '"+curdate+"' <= DATE(a.PDL_expiry_date) and a.student_id=b.student_id and a.enroll_id=b.id";  
                }else{
                    console.log("else------------")
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).send({'status':'Success','data':[]});
                }
            }else if(enrolldata.license_process == 'GDL'){
                q="SELECT b.id,b.enrollment_no,b.student_id,a.license_id,a.status_id,a.result,DATE(a.GDL_expiry_date) as expiryDate,a.GDL_renewal_amount as renewalAmount FROM student_license_details a JOIN student_enroll_details b ON  a.student_id='"+studentid+"' and a.enroll_id='"+enrollid+"' and a.license_id='"+licenseid+"' and a.status_id IN (16,26) and a.GDL_license_no IS NOT NULL and '"+curdate+"' <= DATE(a.GDL_expiry_date) and a.student_id=b.student_id and a.enroll_id=b.id"
            }else if(enrolldata.license_process == 'PSV'){
                q="SELECT b.id,b.enrollment_no,b.student_id,a.license_id,a.status_id,a.result,DATE(a.PSV_expiry_date) as expiryDate,a.PSV_renewal_amount as renewalAmount FROM student_license_details a JOIN student_enroll_details b ON  a.student_id='"+studentid+"' and a.enroll_id='"+enrollid+"' and a.license_id='"+licenseid+"' and a.status_id IN (16,34) and a.PSV_license_no IS NOT NULL and '"+curdate+"' <= DATE(a.PSV_expiry_date) and a.student_id=b.student_id and a.enroll_id=b.id"
            }
            if(q != ''){
                pool.query(q, function (err, enrollDetails) {
                    if (err) {
                        console.log("Problem with MySQL productcatalog",err);
                    }
                    if(enrollDetails){
                        console.log("enrollDetails===============",enrollDetails)
                        //pool.release();
                        res.setHeader('Content-Type', 'application/json');
                        res.status(200).send({'status':'Success','data':enrollDetails});
                    }
                })
            }
        }
    })
});


router.post('/setRenewalDetails',validateSession, function (req, res) {
    var renewalDetails=req.body.renewalDetails;
    var payment_type=req.body.payment_type;
    var reference_no=req.body.reference_no;
    console.log("renewalDetails------------",renewalDetails,payment_type,reference_no);
    console.log("INSERT INTO payment_details (student_id,enroll_id,license_id,status_id,payment_amount,payment_flag,payment_status,receipt_no,payment_method) VALUES ('"+renewalDetails.student_id+"','"+renewalDetails.id+"','"+renewalDetails.license_id+"','"+renewalDetails.status_id+"','"+renewalDetails.renewalAmount+"','Renewal','Success','"+reference_no+"','"+payment_type+"')")
    var q="";
    if(payment_type == 'Cash'){
        q="INSERT INTO payment_details (student_id,enroll_id,license_id,status_id,payment_amount,payment_flag,payment_status,receipt_no,payment_method) VALUES ('"+renewalDetails.student_id+"','"+renewalDetails.id+"','"+renewalDetails.license_id+"','"+renewalDetails.status_id+"','"+renewalDetails.renewalAmount+"','Renewal','Success','"+reference_no+"','"+payment_type+"')";
    }else if(payment_type == 'Card'){
        q="INSERT INTO payment_details (student_id,enroll_id,license_id,status_id,payment_amount,payment_flag,payment_status,transaction_id,payment_method) VALUES ('"+renewalDetails.student_id+"','"+renewalDetails.id+"','"+renewalDetails.license_id+"','"+renewalDetails.status_id+"','"+renewalDetails.renewalAmount+"','Renewal','Success','"+reference_no+"','"+payment_type+"')";
    }else if(payment_type == 'Cheque'){
        q="INSERT INTO payment_details (student_id,enroll_id,license_id,status_id,payment_amount,payment_flag,payment_status,cheque_no,payment_method) VALUES ('"+renewalDetails.student_id+"','"+renewalDetails.id+"','"+renewalDetails.license_id+"','"+renewalDetails.status_id+"','"+renewalDetails.renewalAmount+"','Renewal','Success','"+reference_no+"','"+payment_type+"')";
    }
    pool.query(q, function (err, enrollDetails) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(enrollDetails){
            pool.query("SELECT * FROM student_status_details WHERE student_id='"+renewalDetails.student_id+"' and enroll_id='"+renewalDetails.id+"' and license_id='"+renewalDetails.license_id+"' and status_id NOT IN (16) ORDER BY id DESC LIMIT 1", function (err, lastStatus) {
                if (err) {
                    console.log("Problem with MySQL productcatalog",err);
                }
                if(lastStatus){
                    var statusToUpdate=lastStatus[0].status_id;
                    console.log("statusToUpdate======",statusToUpdate)
                    pool.query("UPDATE student_license_details SET status_id="+statusToUpdate+" WHERE student_id='"+renewalDetails.student_id+"' and enroll_id='"+renewalDetails.id+"' and license_id='"+renewalDetails.license_id+"'", function (err, statusUpdate) {
                        if (err) {
                            console.log("Problem with MySQL productcatalog",err);
                        }
                        if(statusUpdate){
                            res.setHeader('Content-Type', 'application/json');
                            res.status(200).send({'status':'Success','data':statusUpdate});
                        }
                    })
                }
            })
        }
    })
});



// ----------------cron API-----------------------------------------------------------

router.get('/updateRenewalStatus',validateSession, function (req, res) {
    console.log("Calllled______checkRenewal_______")
    var curdate = moment(new Date()).format("YYYY-MM-DD");
    pool.query("SELECT * FROM student_license_details WHERE status_id NOT IN (17,18)", function (err, chekRenew) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(chekRenew){
            console.log("chekRenew==========",chekRenew);
            if(chekRenew.length > 0){
                var idx = 0;
                function checkRenewal(){
                    async.eachOfSeries(chekRenew, function() {
                        chkdata = chekRenew[idx];
                        if(chkdata.license_process == 'PDL'){
                            if(chkdata.LDL_license_no != null && chkdata.PDL_license_no != null){
                                var today=new Date(chkdata.PDL_expiry_date);
                                if(today == curdate){
                                    pool.query("UPDATE student_license_details SET status_id=16 WHERE student_id='"+chkdata.student_id+"' and enroll_id='"+chkdata.enroll_id+"' and license_id='"+chkdata.license_id+"'", function (err, statusUpdate) {
                                        if (err) {
                                            console.log("Problem with MySQL productcatalog",err);
                                        }
                                        if(statusUpdate){
                                            pool.query("INSERT INTO student_status_details(student_id,enroll_id,license_id,status_id,completed_date,updated_by) VALUES('"+chkdata.student_id+"','"+chkdata.enroll_id+"','"+chkdata.license_id+"','16','"+curDate+"','"+req.session.userInfo.id+"')", function (err, setStatus) {
                                                if (err) {
                                                    console.log("Problem with MySQL productcatalog",err);
                                                }
                                                if(setStatus){
                                                    if(idx == chekRenew.length > 0){
                                                        res.setHeader('Content-Type', 'application/json');
                                                        res.status(200).send({'data':chekRenew});
                                                    }
                                                }
                                            })
                                        }
                                    })
                                }else{
                                    idx++;
                                    if(idx == chekRenew.length){
                                        res.setHeader('Content-Type', 'application/json');
                                        res.status(200).send({'data':chekRenew});
                                    }else{
                                        checkRenewal();
                                    }
                                }
                            }else if(chkdata.LDL_license_no != null && chkdata.PDL_license_no == null){
                                var today=new Date(chkdata.LDL_expiry_date);
                                if(today == curdate){
                                    pool.query("UPDATE student_license_details SET status_id=16 WHERE student_id='"+chkdata.student_id+"' and enroll_id='"+chkdata.enroll_id+"' and license_id='"+chkdata.license_id+"'", function (err, statusUpdate) {
                                        if (err) {
                                            console.log("Problem with MySQL productcatalog",err);
                                        }
                                        if(statusUpdate){
                                            pool.query("INSERT INTO student_status_details(student_id,enroll_id,license_id,status_id,completed_date,updated_by) VALUES('"+chkdata.student_id+"','"+chkdata.enroll_id+"','"+chkdata.license_id+"','16','"+curDate+"','"+req.session.userInfo.id+"')", function (err, setStatus) {
                                                if (err) {
                                                    console.log("Problem with MySQL productcatalog",err);
                                                }
                                                if(setStatus){
                                                    if(idx == chekRenew.length > 0){
                                                        res.setHeader('Content-Type', 'application/json');
                                                        res.status(200).send({'data':chekRenew});
                                                    }
                                                }
                                            })
                                        }
                                    })
                                }else{
                                    idx++;
                                    if(idx == chekRenew.length){
                                        res.setHeader('Content-Type', 'application/json');
                                        res.status(200).send({'data':chekRenew});
                                    }else{
                                        checkRenewal();
                                    }
                                }
                            }else{
                                idx++;
                                if(idx == chekRenew.length){
                                    res.setHeader('Content-Type', 'application/json');
                                    res.status(200).send({'data':chekRenew});
                                }else{
                                    checkRenewal();
                                }
                            }
                        }
                        else{
                            var exp_date=(chkdata.license_process == 'GDL' ? chkdata.GDL_expiry_date : chkdata.PSV_expiry_date)
                            var today=new Date(exp_date);
                            if(today == curdate){
                                pool.query("UPDATE student_license_details SET status_id=16 WHERE student_id='"+chkdata.student_id+"' and enroll_id='"+chkdata.enroll_id+"' and license_id='"+chkdata.license_id+"'", function (err, statusUpdate) {
                                    if (err) {
                                        console.log("Problem with MySQL productcatalog",err);
                                    }
                                    if(statusUpdate){
                                        pool.query("INSERT INTO student_status_details(student_id,enroll_id,license_id,status_id,completed_date,updated_by) VALUES('"+chkdata.student_id+"','"+chkdata.enroll_id+"','"+chkdata.license_id+"','16','"+curDate+"','"+req.session.userInfo.id+"')", function (err, setStatus) {
                                            if (err) {
                                                console.log("Problem with MySQL productcatalog",err);
                                            }
                                            if(setStatus){
                                                if(idx == chekRenew.length > 0){
                                                    res.setHeader('Content-Type', 'application/json');
                                                    res.status(200).send({'data':chekRenew});
                                                }
                                            }
                                        })
                                    }
                                })
                            }else{
                                idx++;
                                if(idx == chekRenew.length){
                                    res.setHeader('Content-Type', 'application/json');
                                    res.status(200).send({'data':chekRenew});
                                }else{
                                    checkRenewal();
                                }
                            }
                        }   
                    })
                }
                checkRenewal();
            }else{
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send({'data':chekRenew});
            }
        }
    })
});

router.get('/updateExpiryStatus',validateSession, function (req, res) {
    console.log("Calllled______updateExpiryStatus_______")
    var curdate = moment(new Date()).format("YYYY-MM-DD");
    pool.query("SELECT * FROM student_license_details WHERE status_id NOT IN (17,18)", function (err, chekExpiry) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(chekExpiry){
            console.log("chekExpiry==========",chekExpiry);
            if(chekExpiry.length > 0){
                var idx = 0;
                function checkRenewal(){
                    async.eachOfSeries(chekExpiry, function() {
                        chkdata = chekExpiry[idx];
                        if(chkdata.license_process == 'PDL'){
                            if(chkdata.LDL_license_no != null && chkdata.PDL_license_no != null){
                                var expiryDate=add_years(new Date(chkdata.PDL_expiry_date),2)
                                if(new Date(expiryDate) < curdate){
                                    pool.query("UPDATE student_license_details SET status_id=18 WHERE student_id='"+chkdata.student_id+"' and enroll_id='"+chkdata.enroll_id+"' and license_id='"+chkdata.license_id+"'", function (err, statusUpdate) {
                                        if (err) {
                                            console.log("Problem with MySQL productcatalog",err);
                                        }
                                        if(statusUpdate){
                                            pool.query("INSERT INTO student_status_details(student_id,enroll_id,license_id,status_id,completed_date,updated_by) VALUES('"+chkdata.student_id+"','"+chkdata.enroll_id+"','"+chkdata.license_id+"','18','"+curDate+"','"+req.session.userInfo.id+"')", function (err, setStatus) {
                                                if (err) {
                                                    console.log("Problem with MySQL productcatalog",err);
                                                }
                                                if(setStatus){
                                                    idx++;
                                                    if(idx == chekExpiry.length){
                                                        res.setHeader('Content-Type', 'application/json');
                                                        res.status(200).send({'data':chekExpiry});
                                                    }else{
                                                        checkRenewal();
                                                    }
                                                }
                                            })
                                        }
                                    })
                                }else{
                                    idx++;
                                    if(idx == chekExpiry.length){
                                        res.setHeader('Content-Type', 'application/json');
                                        res.status(200).send({'data':chekExpiry});
                                    }else{
                                        checkRenewal();
                                    }
                                }
                            }else if(chkdata.LDL_license_no != null && chkdata.PDL_license_no == null){
                                var expiryDate=add_years(new Date(chkdata.LDL_expiry_date),2)
                                if(new Date(expiryDate) < curdate){
                                    pool.query("UPDATE student_license_details SET status_id=18 WHERE student_id='"+chkdata.student_id+"' and enroll_id='"+chkdata.enroll_id+"' and license_id='"+chkdata.license_id+"'", function (err, statusUpdate) {
                                        if (err) {
                                            console.log("Problem with MySQL productcatalog",err);
                                        }
                                        if(statusUpdate){
                                            pool.query("INSERT INTO student_status_details(student_id,enroll_id,license_id,status_id,completed_date,updated_by) VALUES('"+chkdata.student_id+"','"+chkdata.enroll_id+"','"+chkdata.license_id+"','18','"+curDate+"','"+req.session.userInfo.id+"')", function (err, setStatus) {
                                                if (err) {
                                                    console.log("Problem with MySQL productcatalog",err);
                                                }
                                                if(setStatus){
                                                    idx++;
                                                    if(idx == chekExpiry.length){
                                                        res.setHeader('Content-Type', 'application/json');
                                                        res.status(200).send({'data':chekExpiry});
                                                    }else{
                                                        checkRenewal();
                                                    }
                                                }
                                            })
                                        }
                                    })
                                }else{
                                    idx++;
                                    if(idx == chekExpiry.length){
                                        res.setHeader('Content-Type', 'application/json');
                                        res.status(200).send({'data':chekExpiry});
                                    }else{
                                        checkRenewal();
                                    }
                                }
                            }else{
                                idx++;
                                if(idx == chekExpiry.length){
                                    res.setHeader('Content-Type', 'application/json');
                                    res.status(200).send({'data':chekExpiry});
                                }else{
                                    checkRenewal();
                                }
                            }
                        }
                        else{
                            var exp_date=(chkdata.license_process == 'GDL' ? chkdata.GDL_expiry_date : chkdata.PSV_expiry_date)
                            var expiryDate=add_years(new Date(exp_date),2)
                            if(new Date(expiryDate) < curdate){
                                pool.query("UPDATE student_license_details SET status_id=18 WHERE student_id='"+chkdata.student_id+"' and enroll_id='"+chkdata.enroll_id+"' and license_id='"+chkdata.license_id+"'", function (err, statusUpdate) {
                                    if (err) {
                                        console.log("Problem with MySQL productcatalog",err);
                                    }
                                    if(statusUpdate){
                                        pool.query("INSERT INTO student_status_details(student_id,enroll_id,license_id,status_id,completed_date,updated_by) VALUES('"+chkdata.student_id+"','"+chkdata.enroll_id+"','"+chkdata.license_id+"','18','"+curDate+"','"+req.session.userInfo.id+"')", function (err, setStatus) {
                                            if (err) {
                                                console.log("Problem with MySQL productcatalog",err);
                                            }
                                            if(setStatus){
                                                idx++;
                                                if(idx == chekExpiry.length){
                                                    res.setHeader('Content-Type', 'application/json');
                                                    res.status(200).send({'data':chekExpiry});
                                                }else{
                                                    checkRenewal();
                                                }
                                            }
                                        })
                                    }
                                })
                            }else{
                                idx++;
                                if(idx == chekExpiry.length){
                                    res.setHeader('Content-Type', 'application/json');
                                    res.status(200).send({'data':chekExpiry});
                                }else{
                                    checkRenewal();
                                }
                            }
                        }   
                    })
                }
                checkRenewal();
            }else{
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send({'data':chekExpiry});
            }
        }
    })
})

router.get('/sendRenewalNotification', function (req, res) {
    console.log("Calllled______sendRenewalNotification_______")
    var curdate = moment(new Date()).format("YYYY-MM-DD");
    pool.query("SELECT a.*,b.name,b.email_id,b.mobile_number,c.type as pref_language FROM student_license_details a JOIN student_details b ON b.is_deleted=0 and b.is_active=1 and a.status_id NOT IN (17,18) and a.student_id=b.id JOIN preference_master c ON b.prefered_lang_id=c.id", function (err, chekExpiry) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(chekExpiry){
            console.log("chekExpiry==========",chekExpiry);
            if(chekExpiry.length > 0){
                var idx = 0;
                function checkRenewal(){
                    async.eachOfSeries(chekExpiry, function() {
                        chkdata = chekExpiry[idx];
                        if(chkdata.license_process == 'PDL'){
                            if(chkdata.LDL_license_no != null && chkdata.PDL_license_no != null){
                                var today=new Date(chkdata.PDL_expiry_date);
                                var notifyDate=new Date(today.getFullYear(), today.getMonth(), today.getDate()-14);
                                if(new Date(notifyDate) == curdate){
                                    pool.query("SELECT b.*,a.status FROM status_list a JOIN message_details b ON a.id=16 and a.message_notification=1 and a.id=b.status_id", function (err, messageInfo) {
                                        if (err) {
                                            console.log("Problem with MySQL productcatalog",err);
                                        }
                                        if(messageInfo){
                                            if(messageInfo.length>0){
                                                var messageData=messageInfo[0];
                                                var mobile_no=chkdata.mobile_number;
                                                var email_id=chkdata.email_id;     
                                                var pref_lang=chkdata.pref_language;
                                                var mailContent = messageData['message_'+pref_lang];
                                                var smsContent = messageData['message_'+pref_lang];
                                                console.log("-------------",email_id,mobile_no,smsContent);
                                                var smsOpt = {
                                                    uri: smsConfig.url+'apiusername='+smsConfig.apiusername+'&apipassword='+smsConfig.apipassword+'&mobileno=+6'+mobile_no+'&senderid='+smsConfig.senderid+'&languagetype='+smsConfig.languagetype+'&message='+smsContent+'' 
                                                };

                                                var mailOpt={
                                                    from: 'info@smamano.my',
                                                    to: email_id, // list of receivers
                                                    subject: currentStatus, // Subject line
                                                    html:'<html><h3>Dear '+studData[0].name+',</h3><br/>'+mailContent+'</html>'    
                                                }
                                                
                                                function myNewFunc() {
                                                    console.log("mailOpt===========",mailOpt,smsOpt);
                                                    transporter.sendMail(mailOpt, function (error, message) {
                                                        if (error) {
                                                            return console.log(error);
                                                        }
                                                        if (message) {
                                                            request(smsOpt, function (error, response, body) {
                                                                if (!error && (response.statusCode < 400)) {
                                                                    console.log("error=nooooooooooo===", response.statusCode);
                                                                    idx++;
                                                                    if(idx == chekExpiry.length){
                                                                        res.setHeader('Content-Type', 'application/json');
                                                                        res.status(200).send({'data':chekExpiry});
                                                                    }else{
                                                                        checkRenewal();
                                                                    }
                                                                }
                                                                if (error) {
                                                                    console.log("error====", error);
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                                setTimeout(myNewFunc, 1500);
                                            }
                                        }
                                    })
                                }else{
                                    idx++;
                                    if(idx == chekExpiry.length){
                                        res.setHeader('Content-Type', 'application/json');
                                        res.status(200).send({'data':chekExpiry});
                                    }else{
                                        checkRenewal();
                                    }
                                }
                            }else if(chkdata.LDL_license_no != null && chkdata.PDL_license_no == null){
                                var today=new Date(chkdata.LDL_expiry_date);
                                var notifyDate=new Date(today.getFullYear(), today.getMonth(), today.getDate()-14);
                                if(new Date(notifyDate) == curdate){
                                    pool.query("SELECT b.*,a.status FROM status_list a JOIN message_details b ON a.id=16 and a.message_notification=1 and a.id=b.status_id", function (err, messageInfo) {
                                        if (err) {
                                            console.log("Problem with MySQL productcatalog",err);
                                        }
                                        if(messageInfo){
                                            if(messageInfo.length>0){
                                                var messageData=messageInfo[0];
                                                var mobile_no=chkdata.mobile_number;
                                                var email_id=chkdata.email_id;     
                                                var pref_lang=chkdata.pref_language;
                                                var mailContent = messageData['message_'+pref_lang];
                                                var smsContent = messageData['message_'+pref_lang];
                                                console.log("-------------",email_id,mobile_no,smsContent);
                                                var smsOpt = {
                                                    uri: smsConfig.url+'apiusername='+smsConfig.apiusername+'&apipassword='+smsConfig.apipassword+'&mobileno=+6'+mobile_no+'&senderid='+smsConfig.senderid+'&languagetype='+smsConfig.languagetype+'&message='+smsContent+'' 
                                                };

                                                var mailOpt={
                                                    from: 'info@smamano.my',
                                                    to: email_id, // list of receivers
                                                    subject: currentStatus, // Subject line
                                                    html:'<html><h3>Dear '+studData[0].name+',</h3><br/>'+mailContent+'</html>'    
                                                }
                                                
                                                function myNewFunc() {
                                                    console.log("mailOpt===========",mailOpt,smsOpt);
                                                    transporter.sendMail(mailOpt, function (error, message) {
                                                        if (error) {
                                                            return console.log(error);
                                                        }
                                                        if (message) {
                                                            request(smsOpt, function (error, response, body) {
                                                                if (!error && (response.statusCode < 400)) {
                                                                    console.log("error=nooooooooooo===", response.statusCode);
                                                                    idx++;
                                                                    if(idx == chekExpiry.length){
                                                                        res.setHeader('Content-Type', 'application/json');
                                                                        res.status(200).send({'data':chekExpiry});
                                                                    }else{
                                                                        checkRenewal();
                                                                    }
                                                                }
                                                                if (error) {
                                                                    console.log("error====", error);
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                                setTimeout(myNewFunc, 1500);
                                            }
                                        }
                                    })
                                }else{
                                    idx++;
                                    if(idx == chekExpiry.length){
                                        res.setHeader('Content-Type', 'application/json');
                                        res.status(200).send({'data':chekExpiry});
                                    }else{
                                        checkRenewal();
                                    }
                                }
                            }else{
                                idx++;
                                if(idx == chekExpiry.length){
                                    res.setHeader('Content-Type', 'application/json');
                                    res.status(200).send({'data':chekExpiry});
                                }else{
                                    checkRenewal();
                                }
                            }
                        }
                        else{
                            var exp_date=(chkdata.license_process == 'GDL' ? chkdata.GDL_expiry_date : chkdata.PSV_expiry_date)
                            var today=new Date(exp_date);
                            var notifyDate=new Date(today.getFullYear(), today.getMonth(), today.getDate()-14);
                            if(new Date(notifyDate) == curdate){
                                pool.query("SELECT b.*,a.status FROM status_list a JOIN message_details b ON a.id=16 and a.message_notification=1 and a.id=b.status_id", function (err, messageInfo) {
                                    if (err) {
                                        console.log("Problem with MySQL productcatalog",err);
                                    }
                                    if(messageInfo){
                                        if(messageInfo.length>0){
                                            var messageData=messageInfo[0];
                                            var mobile_no=chkdata.mobile_number;
                                            var email_id=chkdata.email_id;     
                                            var pref_lang=chkdata.pref_language;
                                            var mailContent = messageData['message_'+pref_lang];
                                            var smsContent = messageData['message_'+pref_lang];
                                            console.log("-------------",email_id,mobile_no,smsContent);
                                            var smsOpt = {
                                                uri: smsConfig.url+'apiusername='+smsConfig.apiusername+'&apipassword='+smsConfig.apipassword+'&mobileno=+6'+mobile_no+'&senderid='+smsConfig.senderid+'&languagetype='+smsConfig.languagetype+'&message='+smsContent+'' 
                                            };

                                            var mailOpt={
                                                from: 'info@smamano.my',
                                                to: email_id, // list of receivers
                                                subject: currentStatus, // Subject line
                                                html:'<html><h3>Dear '+studData[0].name+',</h3><br/>'+mailContent+'</html>'    
                                            }
                                            
                                            function myNewFunc() {
                                                console.log("mailOpt===========",mailOpt,smsOpt);
                                                transporter.sendMail(mailOpt, function (error, message) {
                                                    if (error) {
                                                        return console.log(error);
                                                    }
                                                    if (message) {
                                                        request(smsOpt, function (error, response, body) {
                                                            if (!error && (response.statusCode < 400)) {
                                                                console.log("error=nooooooooooo===", response.statusCode);
                                                                idx++;
                                                                if(idx == chekExpiry.length){
                                                                    res.setHeader('Content-Type', 'application/json');
                                                                    res.status(200).send({'data':chekExpiry});
                                                                }else{
                                                                    checkRenewal();
                                                                }
                                                            }
                                                            if (error) {
                                                                console.log("error====", error);
                                                            }
                                                        })
                                                    }
                                                })
                                            }
                                            setTimeout(myNewFunc, 1500);
                                        }
                                    }
                                })
                            }else{
                                idx++;
                                if(idx == chekExpiry.length){
                                    res.setHeader('Content-Type', 'application/json');
                                    res.status(200).send({'data':chekExpiry});
                                }else{
                                    checkRenewal();
                                }
                            }
                        }   
                    })
                }
                checkRenewal();
            }else{
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send({'data':chekExpiry});
            }
        }
    })
});
 
function add_years(dt,n) 
 {
    return new Date(dt.setFullYear(dt.getFullYear() + n));      
 }


cron.schedule('0 18 * * *', () => { // it will rut at 6 pm everyday
    console.log('Runing a job at ************', new Date());
    const options = { 
        method: 'GET',
        uri: apiUrl+'/webRoutes/updateRenewalStatus/'
    }
    request(options, function (error, response, body) {
        if (response) {
            console.log("checkRenewal------reponse---------------");
            // response.setHeader('Content-Type', 'application/json');
            // response.status(200).send({'status':'Success','numberOfHours':numberOfHours});
           //  response.end();
        }
        if(error){
            console.log("error---------",error)
        }
    })
})

cron.schedule('0 20 * * *', () => { // it will rut at 8 pm everyday
    console.log('Runing a job at ************', new Date());
    const options = {
        method: 'GET',
        uri: apiUrl+'/webRoutes/updateExpiryStatus/'
    }
    request(options, function (error, response, body) {
        if (response) {
            console.log("checkRenewal------reponse---------------");
            // response.setHeader('Content-Type', 'application/json');
            // response.status(200).send({'status':'Success','numberOfHours':numberOfHours});
            //response.end();
        }
        if(error){
            console.log("error---------",error)
        }
    })
})

cron.schedule('0 10 * * *', () => { // it will rut at 8 pm everyday
    console.log('Runing a job at ************', new Date(),apiUrl);
    const optionsRenew = {
        method: 'GET',
        uri: apiUrl+'/webRoutes/sendRenewalNotification'
    }
    request(optionsRenew, function (error, response, body) {
        if (response) {
            console.log("checkRenewal------reponse---------------");
            // response.setHeader('Content-Type', 'application/json');
            // response.status(200).send({'status':'Success','numberOfHours':numberOfHours});
           // response.end();
        }
        if(error){
            console.log("error---------",error)
        }
    })
})


module.exports = router; 