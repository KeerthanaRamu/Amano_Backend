const express = require('express');
var router = express.Router();
var pool = require('../db');
const moment = require('moment');
const multer = require('multer');
const fs = require('fs');
var CryptoJS = require("crypto-js");
var async = require('async');
var configData = require('../config');
var enrollPrefix=configData.hostConfig.enrollPrefix;
var receiptPrefix=configData.hostConfig.receiptPrefix;
var url = require('url');
const { Console } = require('console');


// status_id IN (1,15) and

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


// -------------- to get list of NRIC Number available to apply license-----------------

  
router.get('/getNRICNumberToApplyLicense',validateSession, function (req, res) {
    pool.query("SELECT id,name,nric_number,date_of_birth,gender,mobile_number,email_id,address_nric,city,state,nric_type FROM student_details WHERE nric_number IS NOT NULL and is_deleted=0 and is_active=1", function (err, studData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(studData){
            if(studData.length > 0){
                studData.forEach((stud,idx)=>{
                    var dob = new Date(stud.date_of_birth);
                    var difdt = new Date(new Date() - dob);
                    var age= (difdt.toISOString().slice(0, 4) - 1970);
                    stud.age=age;
                    if(idx === studData.length-1){
                        res.setHeader('Content-Type', 'application/json');
                        res.status(200).send(studData);
                    }
                })
            }
 
        }
    })
});

// -------------- to get list of Passport Number available to apply license-----------------


router.get('/getPassportNumberToApplyLicense',validateSession, function (req, res) {
    pool.query("SELECT id,name,passport_number,date_of_birth,gender,mobile_number,email_id,address_nric,city,state,nric_type FROM student_details WHERE passport_number IS NOT NULL and is_deleted=0 and is_active=1", function (err, licenseData) {
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

// -------------------get license list based on AGE and CDL req-----------------

router.post('/getValidLicenseByIcNumber',validateSession, function (req, res) {
    var icData=req.body.icData;
    var cdl_license=req.body.cdl_license;
    var dob = new Date(icData.date_of_birth);
    var difdt = new Date(new Date() - dob);
    var age= (difdt.toISOString().slice(0, 4) - 1970)
    console.log("age=====",age,difdt,cdl_license);
    pool.query("SELECT *,license_desc_english as english,license_desc_malay as malay FROM license_details WHERE (minimum_age <= "+age+" OR minimum_age IS NULL)  and cdl_requirement="+cdl_license+" and is_deleted=0 and is_active=1", function (err, licenseData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(licenseData){
            for(i=0;i<licenseData.length;i++){
                licenseData[i].selected=false;
                licenseData[i].license_category=null;
            }
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status':'Success','data':licenseData});
        }
    })
});

// -------------------get license list based on AGE and CDL req-----------------

router.post('/getValidLicenseByCDL',validateSession, function (req, res) {
    var cdl_license=req.body.cdl_license;
    var dateOfBirth=req.body.dateOfBirth;
    var dob = new Date(dateOfBirth);
    var difdt = new Date(new Date() - dob);
    var age= (difdt.toISOString().slice(0, 4) - 1970)
    console.log("age=====",age,difdt);
    pool.query("SELECT *,license_desc_english as english,license_desc_malay as malay FROM license_details WHERE (minimum_age <= "+age+" OR minimum_age IS NULL)  and cdl_requirement="+cdl_license+"  and is_deleted=0 and is_active=1", function (err, licenseData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(licenseData){
            for(i=0;i<licenseData.length;i++){
                licenseData[i].selected=false;
                licenseData[i].license_category=null;
            }
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status':'Success','data':licenseData});
        }
    })
});


// --------------------get license list based on Base License-----------------

router.post('/getLicenseListPerBaseLicense',validateSession, function (req, res) {
    console.log("----------------getLicenseListPerBaseLicense---------------------")
    var base_license=req.body.base_license;
    var licenseInfo=req.body.licenseInfo;
    var dateOfBirth=req.body.dateOfBirth;
    var existing_licenseData=req.body.existing_licenseData;
    console.log("existing_licenseData------",existing_licenseData)
    var dob = new Date(dateOfBirth);
    var difdt = new Date(new Date() - dob);
    var age= (difdt.toISOString().slice(0, 4) - 1970)
    console.log("age=====",age,difdt);
    console.log("base_license=====",base_license,licenseInfo, typeof licenseInfo.cdl_license);
    var q="";
    if(existing_licenseData.id == 1){
        q="SELECT a.*,a.license_desc_english as english,a.license_desc_malay as malay FROM license_details a WHERE (a.minimum_age <= "+age+" OR a.minimum_age IS NULL)  and a.cdl_requirement="+licenseInfo.cdl_license+"  and a.is_deleted=0 and a.is_active=1 and a.id='"+base_license.id+"'"
    }else{
        if(licenseInfo.cdl_license == '0'){
            q="SELECT a.*,a.license_desc_english as english,a.license_desc_malay as malay,b.license_category FROM license_details a JOIN advance_license_details b ON (a.minimum_age <= "+age+" OR a.minimum_age IS NULL)  and a.cdl_requirement="+licenseInfo.cdl_license+"  and a.is_deleted=0 and a.is_active=1 and a.id=b.ext_license_id and b.license_id='"+base_license.id+"' and b.license_category='Upgrade'"
        }else if(licenseInfo.cdl_license == '1'){
            q="SELECT a.*,a.license_desc_english as english,a.license_desc_malay as malay,b.license_category FROM license_details a JOIN advance_license_details b ON (a.minimum_age <= "+age+" OR a.minimum_age IS NULL)  and a.cdl_requirement="+licenseInfo.cdl_license+"  and a.is_deleted=0 and a.is_active=1 and a.id=b.ext_license_id and b.license_id='"+base_license.id+"'"
        }
    }
   
    console.log(q)
    pool.query(q, function (err, licenseData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(licenseData){
            for(i=0;i<licenseData.length;i++){
                licenseData[i].selected=false;
            }
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status':'Success','data':licenseData});
        }
    })
  
});

// -------------get Package information based on License selected-----------------

router.post('/getPackageInfoForLicense',validateSession, function (req, res) {
    var existingLicenseInfo=req.body.existingLicenseInfo;
    var cdl_license=req.body.cdl_license;
    var licenseList=req.body.licenseList;
    console.log("licenseList---",licenseList,existingLicenseInfo,cdl_license);
    var q='';
    if(existingLicenseInfo.id == 1){
        q="SELECT b.*,c.english,c.malay FROM package_license_details a JOIN package_details b ON a.license_id IN ("+licenseList+") and a.package_id=b.id and b.l_license=1 JOIN package_type_master c ON b.package_type_id=c.id GROUP BY b.id"
    }else if(existingLicenseInfo.id == 2 || existingLicenseInfo.id == 3){
        if(cdl_license == '0'){
            q="SELECT b.*,c.english,c.malay FROM package_license_details a JOIN package_details b ON a.license_id IN ("+licenseList+") and a.package_id=b.id and b.upgrade=1 JOIN package_type_master c ON b.package_type_id=c.id GROUP BY b.id"
        }else if(cdl_license == '1'){
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
                                    console.log("licenseInfo----IDX-----",licenseInfo,idx)
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

// ----------------get license flow image per license-------------------

router.post('/getLicenseFlowImage',validateSession, function (req, res) {
    var packDt=req.body.packDt;
    pool.query("SELECT b.id,b.license_class,b.license_desc_english,b.license_desc_malay,b.license_flow FROM package_license_details a JOIN license_details b ON a.package_id='"+packDt.id+"' and a.license_id=b.id", function (err, packInfo) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(packInfo){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(packInfo);
        }
    })
});

// ------------------------check packge is applied already----------------

router.post('/checkLicenseApplied',validateSession, function (req, res) {
    var packDt=req.body.packDt;
    var nricInfo=req.body.nricInfo;
    var passportInfo=req.body.passportInfo;
    var studentId=(nricInfo? nricInfo.id : passportInfo.id);
    var gdlLicense=req.body.gdlLicense;
    var psvLicense=req.body.psvLicense;
    console.log("---------------",gdlLicense,psvLicense)
    if(gdlLicense == true && psvLicense == false){
        license_process='GDL';
    }else if(gdlLicense == false && psvLicense == true){
        license_process='PSV';
    }else if(gdlLicense == false && psvLicense == false){
        license_process='PDL';
    }
    console.log("checklicense---------------",license_process,packDt);
    pool.query("SELECT a.* FROM student_enroll_details a JOIN student_license_details b ON a.student_id='"+studentId+"' and a.student_id=b.student_id and a.id=b.enroll_id and b.license_id IN ("+packDt.licenseIdList+") and b.status_id NOT IN (17,18) and b.license_process='"+license_process+"'", function (err, existsPack) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(existsPack){
            if(existsPack.length > 0){
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send({'status': 'Already Done' });
            }else{
                pool.query("SELECT name,email_id,mobile_number FROM student_details WHERE id='"+studentId+"'", function (err, studData) {
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


// --------------------applying license----------------------------

router.post('/setCustomerPackageDetails',validateSession,upload.fields([{
    name: 'existing_license_front', maxCount: 1
  }, 
  {
    name: 'existing_license_rear', maxCount: 1
  },
]), function (req, res) {
    var baseRoot=req.body.baseRoot;
    var packDt=JSON.parse(req.body.packDt);
    var nricInfo=JSON.parse(req.body.nricInfo);
    var passportInfo=JSON.parse(req.body.passportInfo);
    var existingLicenseInfo=JSON.parse(req.body.existingLicenseInfo);
    var studInfo=JSON.parse(req.body.studInfo);
    var studentId=(nricInfo? nricInfo.id : passportInfo.id);     
    var existingId=(existingLicenseInfo ? existingLicenseInfo.id : null);
    var curDate=moment(new Date()).format("YYYY-MM-DD hh:mm");
    var license_expiry = req.body.expiry_date ? moment(new Date(req.body.expiry_date)).format("YYYY-MM-DD") : '';
    var payamount=packDt.payamount;
    var payment_status=packDt.payment_phase == 1 ? 'Completed' : 'First Phase';
    var payment_type=req.body.payment_type;
    var reference_no=req.body.reference_no;
    var GDL_License=req.body.GDL_License;
    var PSV_License=req.body.PSV_License;
    console.log("studInfo--------------",packDt,GDL_License,PSV_License);
    var tranId='';
    var q1="";
    var q="";
    var license_process='';
    var license_status='';
    if(GDL_License == 'true' || PSV_License == 'true'){
         if(GDL_License == 'true' && PSV_License == 'false'){
            license_process='GDL';
            license_status='19';
        }else if(GDL_License == 'false' && PSV_License == 'true'){
            license_process='PSV';
            license_status='27';
        }
        pool.query("SELECT enrollment_no FROM student_enroll_details ORDER BY id DESC LIMIT 1", function (err, licenDt) {
            if (err) {
                console.log("Problem with MySQL productcatalog",err);
            }
            if(licenDt){
                console.log("licenDt========",licenDt)
                var curYear=new Date().getFullYear();
                console.log("curYear----",curYear)
                if(licenDt.length > 0){
                    if((licenDt[0].enrollment_no).split("-")[1]  == curYear){
                        tranId=(enrollPrefix+'-'+curYear+'-'+zeroPad((Number((licenDt[0].enrollment_no).split("-")[2])+1),5)+packDt.licensePrefix)
                    }else{
                        tranId=(enrollPrefix+'-'+curYear+'-00001'+packDt.licensePrefix)
                    }
                }else{
                    tranId=(enrollPrefix+'-'+curYear+'-00001'+packDt.licensePrefix)
                }
                if(req.files.existing_license_front && req.files.existing_license_rear){
                    var existing_license_front_path = baseRoot+'/'+(req.files.existing_license_front[0].fieldname+'.'+(req.files.existing_license_front[0].mimetype.split('/')[1])); 
                    var existing_license_rear_path = baseRoot+'/'+(req.files.existing_license_rear[0].fieldname+'.'+(req.files.existing_license_rear[0].mimetype.split('/')[1])); 
                    q="INSERT INTO student_enroll_details(student_id,enrollment_no,package_id,package_price,existing_license_id,expiry_date,existing_license_front,existing_license_back,created_by,payment_phase)  VALUES ('"+studentId+"','"+tranId+"','"+packDt.id+"','"+packDt.final_package_price+"',"+existingId+",'"+license_expiry+"','"+existing_license_front_path+"','"+existing_license_rear_path+"','"+req.session.userInfo.id+"','"+packDt.payment_phase+"')"
                }else if(req.files.existing_license_front && !req.files.existing_license_rear){
                    var existing_license_front_path =  baseRoot+'/'+(req.files.existing_license_front[0].fieldname+'.'+(req.files.existing_license_front[0].mimetype.split('/')[1])); 
                    q="INSERT INTO student_enroll_details(student_id,enrollment_no,package_id,package_price,existing_license_id,expiry_date,existing_license_front,created_by,payment_phase)  VALUES ('"+studentId+"','"+tranId+"','"+packDt.id+"','"+packDt.final_package_price+"',"+existingId+",'"+license_expiry+"','"+existing_license_front_path+"','"+req.session.userInfo.id+"','"+packDt.payment_phase+"')"
        
                }else if(!req.files.existing_license_front && req.files.existing_license_rear){
                    var existing_license_rear_path = baseRoot+'/'+(req.files.existing_license_rear[0].fieldname+'.'+(req.files.existing_license_rear[0].mimetype.split('/')[1])); 
                    q="INSERT INTO student_enroll_details(student_id,enrollment_no,package_id,package_price,existing_license_id,expiry_date,created_by,existing_license_back,payment_phase)  VALUES ('"+studentId+"','"+tranId+"','"+packDt.id+"','"+packDt.final_package_price+"',"+existingId+",'"+license_expiry+"','"+existing_license_rear_path+"','"+req.session.userInfo.id+"','"+packDt.payment_phase+"')"
        
                }else{
                    q="INSERT INTO student_enroll_details(student_id,enrollment_no,package_id,package_price,created_by,payment_phase)  VALUES ('"+studentId+"','"+tranId+"','"+packDt.id+"','"+packDt.final_package_price+"','"+req.session.userInfo.id+"','"+packDt.payment_phase+"')"
                }
                console.log(q)
                pool.query(q, function (err, setReg) {
                    if (err) {
                        console.log("Problem with MySQL productcatalog",err);
                    } 
                    if(setReg){
                        var enrollId=setReg.insertId;
                        packDt.licenseList.forEach((licData,idx)=>{
                            var license_cat= packDt.l_license == '1' ? 'L-License' : (packDt.upgrade == '1' ? 'Upgrade' : licData.license_category);
                            console.log("license----category=============",license_cat);
                            pool.query("INSERT INTO student_license_details(student_id,enroll_id,license_id,status_id,payment_status,final_price,first_phase_price,second_phase_price,third_phase_price,license_process,license_category) VALUES ('"+studentId+"','"+enrollId+"','"+licData.license_id+"','"+license_status+"','"+payment_status+"','"+licData.license_price+"',"+(licData.first_phase_amount ? licData.first_phase_amount : null)+","+(licData.second_phase_amount ? licData.second_phase_amount :null)+","+(licData.third_phase_amount ? licData.third_phase_amount :null)+",'"+license_process+"','"+license_cat+"')", function (err, setenrollLicense) {
                                if (err) {
                                    console.log("Problem with MySQL productcatalog",err);
                                } 
                                if(setenrollLicense){
                                        var payAmt= packDt.payment_phase == 1 ? licData.license_price : licData.first_phase_amount
                                        if(payment_type == 'Cash'){
                                            q1="INSERT INTO payment_details (student_id,enroll_id,license_id,status_id,payment_amount,payment_flag,payment_status,receipt_no,payment_method) VALUES ('"+studentId+"','"+enrollId+"','"+licData.license_id+"','"+license_status+"','"+payAmt+"','Pay','Success','"+reference_no+"','"+payment_type+"')";
                                        }else if(payment_type == 'Card'){
                                            q1="INSERT INTO payment_details (student_id,enroll_id,license_id,status_id,payment_amount,payment_flag,payment_status,transaction_id,payment_method) VALUES ('"+studentId+"','"+enrollId+"','"+licData.license_id+"','"+license_status+"','"+payAmt+"','Pay','Success','"+reference_no+"','"+payment_type+"')";
                                        }else if(payment_type == 'Cheque'){
                                            q1="INSERT INTO payment_details (student_id,enroll_id,status_id,license_id,payment_amount,payment_flag,payment_status,cheque_no,payment_method) VALUES ('"+studentId+"','"+enrollId+"','"+licData.license_id+"','"+license_status+"','"+payAmt+"','Pay','Success','"+reference_no+"','"+payment_type+"')";
                                        }
                                        pool.query(q1, function (err, paydata) {
                                            if (err) {
                                                console.log("Problem with MySQL productcatalog",err);
                                            }
                                            if(paydata){
                                                pool.query("INSERT INTO student_status_details (student_id,enroll_id,license_id,status_id,completed_date,updated_by) VALUES ('"+studentId+"','"+enrollId+"','"+licData.license_id+"','"+license_status+"','"+curDate+"','"+req.session.userInfo.id+"')", function (err, statusData) {
                                                    if (err) {
                                                        console.log("Problem with MySQL productcatalog",err);
                                                    }
                                                    if(idx === packDt.licenseList.length-1){
                                                        res.setHeader('Content-Type', 'application/json');
                                                        res.status(200).send({'status': 'Success', 'tranId':tranId });
                                                    }
                                                })
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
                    if(((licenDt[0].enrollment_no).split("-")[1])  == curYear){
                        tranId=(enrollPrefix+'-'+curYear+'-'+zeroPad((Number((licenDt[0].enrollment_no).split("-")[2])+1),5)+packDt.licensePrefix)
                    }else{
                        tranId=(enrollPrefix+'-'+curYear+'-00001'+packDt.licensePrefix)
                    }
                }else{
                    tranId=(enrollPrefix+'-'+curYear+'-00001'+packDt.licensePrefix)
                }
                console.log("tranId=========",tranId)
                if(req.files.existing_license_front && req.files.existing_license_rear){
                    var existing_license_front_path = baseRoot+'/'+(req.files.existing_license_front[0].fieldname+'.'+(req.files.existing_license_front[0].mimetype.split('/')[1])); 
                    var existing_license_rear_path = baseRoot+'/'+(req.files.existing_license_rear[0].fieldname+'.'+(req.files.existing_license_rear[0].mimetype.split('/')[1])); 
                    q="INSERT INTO student_enroll_details(student_id,enrollment_no,package_id,package_price,existing_license_id,expiry_date,existing_license_front,existing_license_back,created_by,payment_phase)  VALUES ('"+studentId+"','"+tranId+"','"+packDt.id+"','"+packDt.final_package_price+"',"+existingId+",'"+license_expiry+"','"+existing_license_front_path+"','"+existing_license_rear_path+"','"+req.session.userInfo.id+"','"+packDt.payment_phase+"')"
                }else if(req.files.existing_license_front && !req.files.existing_license_rear){
                    var existing_license_front_path =  baseRoot+'/'+(req.files.existing_license_front[0].fieldname+'.'+(req.files.existing_license_front[0].mimetype.split('/')[1])); 
                    q="INSERT INTO student_enroll_details(student_id,enrollment_no,package_id,package_price,existing_license_id,expiry_date,existing_license_front,created_by,payment_phase)  VALUES ('"+studentId+"','"+tranId+"','"+packDt.id+"','"+packDt.final_package_price+"',"+existingId+",'"+license_expiry+"','"+existing_license_front_path+"','"+req.session.userInfo.id+"','"+packDt.payment_phase+"')"
        
                }else if(!req.files.existing_license_front && req.files.existing_license_rear){
                    var existing_license_rear_path = baseRoot+'/'+(req.files.existing_license_rear[0].fieldname+'.'+(req.files.existing_license_rear[0].mimetype.split('/')[1])); 
                    q="INSERT INTO student_enroll_details(student_id,enrollment_no,package_id,package_price,existing_license_id,expiry_date,created_by,existing_license_back,payment_phase)  VALUES ('"+studentId+"','"+tranId+"','"+packDt.id+"','"+packDt.final_package_price+"',"+existingId+",'"+license_expiry+"','"+existing_license_rear_path+"','"+req.session.userInfo.id+"','"+packDt.payment_phase+"')"
        
                }else{
                    q="INSERT INTO student_enroll_details(student_id,enrollment_no,package_id,package_price,created_by,payment_phase)  VALUES ('"+studentId+"','"+tranId+"','"+packDt.id+"','"+packDt.final_package_price+"','"+req.session.userInfo.id+"','"+packDt.payment_phase+"')"
                }
                console.log(q)
                pool.query(q, function (err, setReg) {
                    if (err) {
                        console.log("Problem with MySQL productcatalog",err);
                    } 
                    if(setReg){
                        var enrollId=setReg.insertId;
                        packDt.licenseList.forEach((licData,idx)=>{
                            var license_cat= packDt.l_license == '1' ? 'L-License' : (packDt.upgrade == '1' ? 'Upgrade' : licData.license_category);
                            console.log("license----category=============",license_cat);
                            pool.query("INSERT INTO student_license_details(student_id,enroll_id,license_id,status_id,payment_status,final_price,first_phase_price,second_phase_price,third_phase_price,license_process,license_category) VALUES ('"+studentId+"','"+enrollId+"','"+licData.license_id+"','3','"+payment_status+"','"+licData.license_price+"',"+(licData.first_phase_amount ? licData.first_phase_amount : null)+","+(licData.second_phase_amount ? licData.second_phase_amount :null)+","+(licData.third_phase_amount ? licData.third_phase_amount :null)+",'PDL','"+license_cat+"')", function (err, setenrollLicense) {
                                if (err) {
                                    console.log("Problem with MySQL productcatalog",err);
                                } 
                                if(setenrollLicense){
                                        pool.query("INSERT INTO student_status_details (student_id,enroll_id,license_id,status_id,completed_date,updated_by) VALUES ('"+studentId+"','"+enrollId+"','"+licData.license_id+"',2,'"+curDate+"','"+req.session.userInfo.id+"')", function (err, statusData) {
                                            if (err) {
                                                console.log("Problem with MySQL productcatalog",err);
                                            }
                                            if(statusData){
                                                var payAmt= packDt.payment_phase == 1 ? licData.license_price : licData.first_phase_amount
                                                    if(payment_type == 'Cash'){
                                                        q1="INSERT INTO payment_details (student_id,enroll_id,license_id,status_id,payment_amount,payment_flag,payment_status,receipt_no,payment_method) VALUES ('"+studentId+"','"+enrollId+"','"+licData.license_id+"',3,'"+payAmt+"','Pay','Success','"+reference_no+"','"+payment_type+"')";
                                                    }else if(payment_type == 'Card'){
                                                        q1="INSERT INTO payment_details (student_id,enroll_id,license_id,status_id,payment_amount,payment_flag,payment_status,transaction_id,payment_method) VALUES ('"+studentId+"','"+enrollId+"','"+licData.license_id+"',3,'"+payAmt+"','Pay','Success','"+reference_no+"','"+payment_type+"')";
                                                    }else if(payment_type == 'Cheque'){
                                                        q1="INSERT INTO payment_details (student_id,enroll_id,license_id,status_id,payment_amount,payment_flag,payment_status,cheque_no,payment_method) VALUES ('"+studentId+"','"+enrollId+"','"+licData.license_id+"',3,'"+payAmt+"','Pay','Success','"+reference_no+"','"+payment_type+"')";
                                                    }
                                                    pool.query(q1, function (err, paydata) {
                                                        if (err) {
                                                            console.log("Problem with MySQL productcatalog",err);
                                                        }
                                                        if(paydata){
                                                            pool.query("INSERT INTO student_status_details (student_id,enroll_id,license_id,status_id,completed_date,updated_by) VALUES ('"+studentId+"','"+enrollId+"','"+licData.license_id+"',3,'"+curDate+"','"+req.session.userInfo.id+"')", function (err, statusData) {
                                                                if (err) {
                                                                    console.log("Problem with MySQL productcatalog",err);
                                                                }
                                                                if(statusData){
                                                                    if(idx === packDt.licenseList.length-1){
                                                                        res.setHeader('Content-Type', 'application/json');
                                                                        res.status(200).send({'status': 'Success', 'tranId':tranId });
                                                                    }
                                                                }
                                                            })
                                                        }
                                                    })
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

// --------to get auto generated receipt no---------------------

router.get('/getAutoReceiptNumber', function (req, res){
    pool.query("SELECT * FROM payment_details WHERE payment_method='Cash' and receipt_no IS NOT NULL ORDER BY id DESC LIMIT 1", function (err, receiptData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        } 
        if(receiptData){
            var receiptNo='';
            var curYear=new Date().getFullYear();
            console.log("curYear----",curYear)
            if(receiptData.length > 0){
                if((receiptData[0].receipt_no).split("-")[1]  == curYear){
                    receiptNo=(receiptPrefix+'-'+curYear+'-'+zeroPad((Number((receiptData[0].receipt_no).split("-")[2])+1),5))
                }else{
                    receiptNo=(receiptPrefix+'-'+curYear+'-00001')
                }
            }else{
                receiptNo=(receiptPrefix+'-'+curYear+'-00001')
            }
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status': 'Success', 'receiptNo':receiptNo });
            
        }
    })
})


// ------------------------check packge is applied already for update----------------

router.post('/checkLicenseAppliedForUpdate',validateSession, function (req, res) {
    var packDt=req.body.packDt;
    console.log("checklicense---------------",packDt);
    pool.query("SELECT a.* FROM student_enroll_details a JOIN student_license_details b ON a.student_id='"+packDt.student_id+"' and a.student_id=b.student_id and a.id=b.enroll_id and b.license_id IN ("+packDt.license_id+") and b.status_id NOT IN (17,18) and b.license_process='"+packDt.license_process+"'", function (err, existsPack) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(existsPack){
            if(existsPack.length > 0){
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send({'status': 'Already Done' });
            }else{
                pool.query("SELECT name,email_id,mobile_number FROM student_details WHERE id='"+packDt.student_id+"'", function (err, studData) {
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


// ------------get payment result from gateway-------------------------

router.get('/paymentResult', function (req, res) {
    var curDate=moment(new Date()).format("YYYY-MM-DD hh:mm");
    console.log("req.session.studentInfo.id=========",req.session.studentInfo.id)
   // var hashvalue = CryptoJS.hash_hmac('sha256', secretkey.concat(status_id,order_id,transaction_id,msg), secretkey);
	console.log("searchParams==========", req.query); 
	var url_parts = url.parse(req.url, true).query;
	console.log("url_parts==========", url_parts); 
    var order_id=url_parts.order_id.split("_")[0];
    var payamount=url_parts.amount_paid;
    var payStatus=url_parts.txn_status == 1 ? 'Success' : 'Failed';
    var transactionId=url_parts.transaction_id; 
    var msg=url_parts.txn_msg;
    var payMethod=url_parts.transaction_type;
    var licenseDt=url_parts.order_id.split("_");
    console.log("----",licenseDt[1],licenseDt[2])
    if(licenseDt[2] && licenseDt[2] != undefined){
      //--------------------combo payment------->Initial Payment----------------------------
       var licenseArr=[licenseDt[1],licenseDt[2]];
       console.log("licenseArr-------------",licenseArr)
       licenseArr.forEach((licDt,idx)=>{
        pool.query("SELECT a.payment_phase,b.* FROM student_enroll_details a JOIN student_license_details b ON a.enrollment_no='"+order_id+"' and a.student_id=b.student_id and a.id=b.enroll_id and b.license_id='"+licDt+"'", function (err, studData) {
                if (err) {
                    console.log("Problem with MySQL productcatalog",err);
                } 
                if(studData){
                    var studentId=studData[0].student_id;
                    var enrollId=studData[0].enroll_id;
                    var status_id=studData[0].status_id;
                    var payAmt=(studData[0].payment_phase == 1 ? studData[0].final_price : studData[0].first_phase_price)
                    var license_status='';
                    if(status_id == 2){
                        license_status='3';
                    }else{
                        license_status=status_id;
                    }
                    pool.query("INSERT INTO payment_details (student_id,enroll_id,license_id,status_id,payment_amount,payment_flag,payment_status,transaction_id,msg,payment_method,created_by) VALUES ('"+studentId+"','"+enrollId+"','"+licDt+"','"+license_status+"','"+payAmt+"','Pay','"+payStatus+"','"+transactionId+"','"+msg+"','"+payMethod+"','"+req.session.studentInfo.id+"')", function (err, paydata) {
                        if (err) {
                            console.log("Problem with MySQL productcatalog",err);
                        }
                        if(paydata){
                            // ----if success
                            if(url_parts.txn_status == 1){
                                pool.query("INSERT INTO student_status_details (student_id,enroll_id,license_id,status_id,completed_date,updated_by) VALUES ('"+studentId+"','"+enrollId+"','"+licDt+"','"+license_status+"','"+curDate+"','"+req.session.studentInfo.id+"')", function (err, statusData) {
                                    if (err) {
                                        console.log("Problem with MySQL productcatalog",err);
                                    }
                                    if(statusData){
                                        pool.query("UPDATE student_license_details SET status_id='"+license_status+"' WHERE student_id='"+studentId+"' and enroll_id='"+enrollId+"' and license_id='"+licDt+"'", function (err, statusData) {
                                            if (err) {
                                                console.log("Problem with MySQL productcatalog",err);
                                            }
                                            if(statusData){
                                                //pool.release();
                                                if(idx === licenseArr.length -1){
                                                    res.setHeader('Content-Type', 'application/json');
                                                    res.redirect('https://smamano.my/#/schedule-list');
                                                }
                                            }
                                        })
                                    }
                                })
                            }else{
                                if(idx === licenseArr.length -1){
                                    res.setHeader('Content-Type', 'application/json');
                                    res.redirect('https://smamano.my');
                                }
                            }
                            
                        }
                    })
                }
            })
       })
    }else{
        //--------------------Single Payment------------------------------------------------
        var licenseId=licenseDt[1];
        console.log("-----single--licenseid--------------",licenseId,order_id);
        pool.query("SELECT * FROM student_license_details WHERE enroll_id=(SELECT id FROM student_enroll_details WHERE enrollment_no='"+order_id+"') and license_id='"+licenseId+"'", function (err, studData) {
            if (err) {
                console.log("Problem with MySQL productcatalog",err);
            } 
            if(studData){
                console.log("studData====",studData)
                var studentId=studData[0].student_id;
                var enrollId=studData[0].enroll_id;
                var status_id=studData[0].status_id;
                var license_status='';
                if(status_id == 2){
                    license_status='3';
                }else{
                    license_status=status_id;
                }
                pool.query("INSERT INTO payment_details (student_id,enroll_id,license_id,status_id,payment_amount,payment_flag,payment_status,transaction_id,msg,payment_method,created_by) VALUES ('"+studentId+"','"+enrollId+"','"+licenseId+"','"+license_status+"','"+payamount+"','Pay','"+payStatus+"','"+transactionId+"','"+msg+"','"+payMethod+"','"+req.session.studentInfo.id+"')", function (err, paydata) {
                    if (err) {
                        console.log("Problem with MySQL productcatalog",err);
                    }
                    if(paydata){
                        // ----if success
                        if(url_parts.txn_status == 1){
                            pool.query("INSERT INTO student_status_details (student_id,enroll_id,license_id,status_id,completed_date,updated_by) VALUES ('"+studentId+"','"+enrollId+"','"+licenseId+"','"+license_status+"','"+curDate+"','"+req.session.studentInfo.id+"')", function (err, statusData) {
                                if (err) {
                                    console.log("Problem with MySQL productcatalog",err);
                                }
                                if(statusData){
                                    pool.query("UPDATE student_license_details SET status_id='"+license_status+"' WHERE student_id='"+studentId+"' and enroll_id='"+enrollId+"' and license_id='"+licenseId+"'", function (err, statusData) {
                                        if (err) {
                                            console.log("Problem with MySQL productcatalog",err);
                                        }
                                        if(statusData){
                                            //pool.release();
                                            res.setHeader('Content-Type', 'application/json');
                                            res.redirect('https://smamano.my/#/schedule-list');
                                        }
                                    })
                                }
                            })
                        }else{
                            res.setHeader('Content-Type', 'application/json');
                            res.redirect('https://smamano.my');
                        }
                        
                    }
                })
            }
        })
    }
    
});

function zeroPad(num,total){
    console.log(num)
    return num.toString().padStart(Number(total), "0");
}



module.exports = router;