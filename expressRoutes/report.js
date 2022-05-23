
const express = require('express');
var router = express.Router();
const moment = require('moment');
const pool = require('../db');
var db = require('../db');
var async = require('async');

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

router.post('/getRegistrationReportForAdmin',validateSession, function (req, res) {
    var dateObj=req.body.dateObj;
    var startDate = moment(new Date(dateObj.from_date)).format("YYYY-MM-DD");
    var endDate = moment(new Date(dateObj.to_date)).format("YYYY-MM-DD");
    pool.query("SELECT a.id,a.profile_img,a.name,c.english as nric_english,c.malay as nric_malay,a.nric_number,a.passport_number,a.date_of_birth,a.gender,d.english as placebirth_english,d.malay as placebirth_malay,e.country_name,a.address_nric,a.address1,a.address2,f.postal_code,a.city,a.state,a.email_id,a.mobile_number,g.english as race_english,g.malay as race_malay,a.other_race,h.english as pref_english,h.malay as pref_malay,a.emergency_name,a.emergency_number,a.user_name,a.password FROM student_details a JOIN nrictype_master c ON '" + startDate + "' <= DATE(a.cur_date) AND DATE(a.cur_date) <= '" + endDate + "' and a.nric_type=c.id JOIN place_of_birth_master d ON a.placebirth_id=d.id JOIN citizenship_master e ON a.nationality_id=e.id JOIN postalcode_master f ON a.postalcode_id=f.id JOIN race_master g ON a.race_id=g.id JOIN preference_master h ON a.prefered_lang_id=h.id", function (err, studData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(studData){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'data':studData});
        }
    })
});


router.post('/getRevenueReportForAdmin',validateSession, function (req, res) {
    var dateObj=req.body.dateObj;
    var startDate = moment(new Date(dateObj.from_date)).format("YYYY-MM-DD");
    var endDate = moment(new Date(dateObj.to_date)).format("YYYY-MM-DD");
    pool.query("SELECT f.name,c.enrollment_no,d.package_english,d.package_malay,e.english,e.malay,c.package_price,h.license_class,a.payment_amount as amountPaid,g.status FROM payment_details a JOIN student_license_details b ON '" + startDate + "' <= DATE(a.payment_date) AND DATE(a.payment_date) <= '" + endDate + "' and a.payment_flag='Pay' and a.enroll_id=b.enroll_id and a.student_id=b.student_id  and a.license_id=b.license_id  JOIN student_enroll_details c ON b.enroll_id=c.id and b.student_id=c.student_id JOIN package_details d ON c.package_id=d.id JOIN payment_phases_master e ON c.payment_phase=e.id JOIN student_details f ON b.student_id=f.id JOIN status_list g ON b.status_id=g.id JOIN license_details h ON a.license_id=h.id", function (err, studData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(studData){
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'data':studData});
        }
    })
});


router.get('/getCurrentDaySalesReport',validateSession, function (req, res) {
    var curDate = moment(new Date()).format("YYYY-MM-DD");
    pool.query("SELECT f.profile_img,f.name,f.nric_number,f.passport_number,c.enrollment_no,d.package_english,d.package_malay,e.english,e.malay,g.license_class,a.payment_amount FROM payment_details a JOIN student_license_details b ON DATE(a.payment_date)='"+curDate+"' and a.enroll_id=b.id and a.license_id=b.license_id JOIN student_enroll_details c ON b.enroll_id=c.id JOIN package_details d ON c.package_id=d.id JOIN payment_phases_master e ON c.payment_phase=e.id JOIN student_details f ON a.student_id=f.id JOIN license_details g ON b.license_id=g.id", function (err, studData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(studData){
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'data':studData});
        }
    })
});



router.post('/getLformFilterData',validateSession, function (req, res) {
    var lformData=req.body.lformData;
    pool.query("SELECT d.name,d.nric_number,d.passport_number,d.email_id,d.mobile_number,d.id,d.nric_type,d.date_of_birth,d.gender,d.placebirth_id,d.nationality_id,d.address_nric,d.postalcode_id,d.city,d.state,d.race_id,a.final_price,b.package_id,b.enrollment_no,e.package_english,e.package_malay,b.package_price,f.postal_code,g.english as place_english,g.malay as place_malay,c.license_class FROM student_license_details a JOIN student_enroll_details b ON a.status_id='"+lformData.status+"' and a.student_id=b.student_id and a.enroll_id=b.id JOIN license_details c ON a.license_id=c.id JOIN student_details d ON a.student_id=d.id JOIN package_details e ON b.package_id=e.id JOIN postalcode_master f  ON d.postalcode_id=f.id JOIN place_of_birth_master g ON d.placebirth_id=g.id", function (err, studData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(studData){
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status':'Success','data':studData});
        }
    })
});


router.post('/getDateFilteredData',validateSession, function (req, res) {
    var lformData=req.body.lformData;
    var fromDate = moment(new Date(lformData.from_date)).format("YYYY-MM-DD");
    var toDate = moment(new Date(lformData.to_date)).format("YYYY-MM-DD");
    var q="";
    if(lformData.status == 1){
        q="SELECT d.name,d.nric_number,d.passport_number,d.email_id,d.mobile_number,d.id,d.nric_type,d.date_of_birth,d.gender,d.placebirth_id,d.nationality_id,d.address_nric,d.postalcode_id,d.city,d.state,d.race_id,a.final_price,b.package_id,b.enrollment_no,e.package_english,e.package_malay,b.package_price,f.postal_code,g.english as place_english,g.malay as place_malay,c.license_class FROM student_license_details a JOIN student_enroll_details b ON a.status_id='"+lformData.status+"' and a.student_id=b.student_id and a.enroll_id=b.id JOIN license_details c ON a.license_id=c.id JOIN student_details d ON a.student_id=d.id and '" + fromDate + "' <= DATE(d.cur_date) AND DATE(d.cur_date) <= '" + toDate + "' JOIN package_details e ON b.package_id=e.id JOIN postalcode_master f  ON d.postalcode_id=f.id JOIN place_of_birth_master g ON d.placebirth_id=g.id"
    }else{
        q="SELECT d.name,d.nric_number,d.passport_number,d.email_id,d.mobile_number,d.id,d.nric_type,d.date_of_birth,d.gender,d.placebirth_id,d.nationality_id,d.address_nric,d.postalcode_id,d.city,d.state,d.race_id,a.final_price,b.package_id,b.enrollment_no,e.package_english,e.package_malay,b.package_price,f.postal_code,g.english as place_english,g.malay as place_malay,c.license_class FROM student_license_details a JOIN student_enroll_details b ON a.status_id='"+lformData.status+"' and '" + fromDate + "' <= DATE(b.cur_date) AND DATE(b.cur_date) <= '" + toDate + "' and a.student_id=b.student_id and a.enroll_id=b.id JOIN license_details c ON a.license_id=c.id JOIN student_details d ON a.student_id=d.id JOIN package_details e ON b.package_id=e.id JOIN postalcode_master f  ON d.postalcode_id=f.id JOIN place_of_birth_master g ON d.placebirth_id=g.id"
    }
    pool.query(q, function (err, studData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(studData){
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status':'Success','data':studData});
        }
    })
});

router.get('/getNRICNumberForPendingReport',validateSession, function (req, res) {
    pool.query("SELECT id,nric_number,date_of_birth FROM student_details WHERE nric_number IS NOT NULL and id IN (SELECT student_id FROM student_license_details WHERE status_id=2)", function (err, studData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(studData){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(studData);
        }
    })
});

router.get('/getPassportNumberForPendingReport',validateSession, function (req, res) {
    pool.query("SELECT id,passport_number,date_of_birth FROM student_details WHERE passport_number IS NOT NULL and id IN (SELECT student_id FROM student_license_details WHERE status_id=2)", function (err, studData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(studData){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(studData);
        }
    })
});


router.post('/getPendingReport',validateSession, function (req, res) {
    var pendingFormValue=req.body.pendingFormValue;
    var studentId=req.body.studentId;
    var q='';
    var startDate = moment(new Date(pendingFormValue.from_date)).format("YYYY-MM-DD");
    var endDate = moment(new Date(pendingFormValue.to_date)).format("YYYY-MM-DD");
    if(pendingFormValue.from_date != '' && pendingFormValue.to_date != '' && studentId != ''){
        console.log("1111111=========");
      q="SELECT a.id as enroll_id,a.enrollment_no,c.id,c.name,c.nric_number,c.passport_number,c.email_id,c.mobile_number,c.date_of_birth,c.gender,c.address_nric,c.city,c.state,d.package_english,d.package_malay,a.payment_phase,b.license_id,SUM(b.final_price) as final_price,SUM(b.first_phase_price) as first_phase_price FROM student_enroll_details a JOIN student_license_details b ON a.is_removed=0 and a.student_id="+studentId+" and a.student_id=b.student_id and a.id=b.enroll_id and b.status_id=2 JOIN student_details c ON a.student_id=c.id JOIN package_details d ON a.package_id=d.id GROUP BY b.enroll_id";
    }else if(pendingFormValue.from_date == '' && pendingFormValue.to_date == '' && studentId != ''){
        console.log("2222222=========");
        q="SELECT a.id as enroll_id,a.enrollment_no,c.id,c.name,c.nric_number,c.passport_number,c.email_id,c.mobile_number,c.date_of_birth,c.gender,c.address_nric,c.city,c.state,d.package_english,d.package_malay,a.payment_phase,b.license_id,SUM(b.final_price) as final_price,SUM(b.first_phase_price) as first_phase_price FROM student_enroll_details a JOIN student_license_details b ON a.is_removed=0 and a.student_id="+studentId+" and a.student_id=b.student_id and a.id=b.enroll_id and b.status_id=2 JOIN student_details c ON a.student_id=c.id JOIN package_details d ON a.package_id=d.id GROUP BY b.enroll_id";
    }else if(pendingFormValue.from_date != '' && pendingFormValue.to_date != '' && studentId == ''){
        q="SELECT a.id as enroll_id,a.enrollment_no,c.id,c.name,c.nric_number,c.passport_number,c.email_id,c.mobile_number,c.date_of_birth,c.gender,c.address_nric,c.city,c.state,d.package_english,d.package_malay,a.payment_phase,b.license_id,SUM(b.final_price) as final_price,SUM(b.first_phase_price) as first_phase_price FROM student_enroll_details a JOIN student_license_details b ON '" + startDate + "' <= DATE(a.cur_date) AND DATE(a.cur_date) <= '" + endDate + "' and a.is_removed=0 and a.student_id=b.student_id and a.id=b.enroll_id and b.status_id=2 JOIN student_details c ON a.student_id=c.id JOIN package_details d ON a.package_id=d.id GROUP BY b.enroll_id";
    }

    pool.query(q, function (err, studData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(studData){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'data':studData});
        }
    })
});



router.post('/getStudentLicenseDetails',validateSession, function (req, res) {
    var studData=req.body.studData;
    pool.query("SELECT a.enrollment_no,b.*,c.package_english,c.package_malay,c.package_desc_english,c.package_desc_malay,c.package_offers,d.license_class,d.license_desc_english,d.license_desc_malay,e.english as package_type_english,e.malay as package_type_malay,f.english as payment_phase_english,f.malay as payment_phase_malay FROM student_enroll_details a JOIN student_license_details b ON a.id='"+studData.enroll_id+"' and a.id=b.enroll_id and b.license_id='"+studData.license_id+"' JOIN package_details c ON a.package_id=c.id JOIN license_details d ON b.license_id=d.id JOIN package_type_master e ON c.package_type_id=e.id JOIN payment_phases_master f ON a.payment_phase=f.id", function (err, packageData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(packageData){
            res.setHeader('Content-Type', 'application/json');
             res.status(200).send({'data':packageData});
           
        }
    })
});

router.post('/setPendingPaymentDetails',validateSession, function (req, res) {
    var studData=req.body.studData;
    var payment_type=req.body.payment_type;
    var reference_no=req.body.reference_no;
    var payamount=req.body.payamount;
    var curDate=moment(new Date()).format("YYYY-MM-DD hh:mm");
    console.log("studData====",studData,payment_type,reference_no,payamount);
    pool.query("SELECT * FROM student_license_details WHERE student_id='"+studData.id+"' and enroll_id='"+studData.enroll_id+"'", function (err, licenseInfo) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(licenseInfo){
            licenseInfo.forEach((licData,idx)=>{
                var payAmt= studData.payment_phase == 1 ? licData.final_price : licData.first_phase_price
                var q="";
                if(payment_type == 'Cash'){
                    q="INSERT INTO payment_details (student_id,enroll_id,license_id,status_id,payment_amount,payment_flag,payment_status,receipt_no,payment_method) VALUES ('"+studData.id+"','"+studData.enroll_id+"','"+licData.license_id+"',3,'"+payAmt+"','Pay','Success','"+reference_no+"','"+payment_type+"')";
                }else if(payment_type == 'Card'){
                    q="INSERT INTO payment_details (student_id,enroll_id,license_id,status_id,payment_amount,payment_flag,payment_status,transaction_id,payment_method) VALUES ('"+studData.id+"','"+studData.enroll_id+"','"+licData.license_id+"',3,'"+payAmt+"','Pay','Success','"+reference_no+"','"+payment_type+"')";
                }else if(payment_type == 'Cheque'){
                    q="INSERT INTO payment_details (student_id,enroll_id,license_id,status_id,payment_amount,payment_flag,payment_status,cheque_no,payment_method) VALUES ('"+studData.id+"','"+studData.enroll_id+"','"+licData.license_id+"',3,'"+payAmt+"','Pay','Success','"+reference_no+"','"+payment_type+"')";
                }
            
                pool.query(q, function (err, setpay) {
                    if (err) {
                        console.log("Problem with MySQL productcatalog",err);
                    }
                    if(setpay){
                        pool.query("INSERT INTO student_status_details (student_id,enroll_id,license_id,status_id,completed_date,updated_by) VALUES ('"+studData.id+"','"+studData.enroll_id+"','"+licData.license_id+"',3,'"+curDate+"','"+req.session.userInfo.id+"')", function (err, setstatus) {
                            if (err) {
                                console.log("Problem with MySQL productcatalog",err);
                            }
                            if(setstatus){
                                pool.query("UPDATE student_license_details SET status_id=3 WHERE student_id='"+studData.id+"' and enroll_id='"+studData.enroll_id+"' and license_id='"+licData.license_id+"'", function (err, setupstatus) {
                                    if (err) {
                                        console.log("Problem with MySQL productcatalog",err);
                                    }
                                    if(setupstatus){
                                        //pool.release();
                                        if(idx === licenseInfo.length - 1){
                                            res.setHeader('Content-Type', 'application/json');
                                            res.status(200).send(setupstatus);
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



router.post('/deleteStudentDetails',validateSession, function (req, res) {
    var rowToBeDeleted=req.body.rowToBeDeleted;
    console.log("rowToBeDeleted-----------",rowToBeDeleted)
    pool.query("DELETE FROM student_enroll_details WHERE id='"+rowToBeDeleted.enroll_id+"' and student_id='"+rowToBeDeleted.id+"'", function (err, enrollDel) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(enrollDel){
            pool.query("DELETE FROM student_license_details WHERE enroll_id='"+rowToBeDeleted.enroll_id+"' and student_id='"+rowToBeDeleted.id+"'", function (err, licDel) {
                if (err) {
                    console.log("Problem with MySQL productcatalog",err);
                }
                if(licDel){
                    pool.query("DELETE FROM student_status_details WHERE enroll_id='"+rowToBeDeleted.enroll_id+"' and student_id='"+rowToBeDeleted.id+"' and status_id=2", function (err, statusDel) {
                        if (err) {
                            console.log("Problem with MySQL productcatalog",err);
                        }
                        if(statusDel){
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



router.get('/getPendingScheduleStatus',validateSession, function (req, res) {
    pool.query("SELECT a.* FROM status_list a JOIN schedule_details b ON b.schedule_view='All' and b.status_id=a.id GROUP BY b.status_id", function (err, studData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(studData){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(studData);
        }
    })
});


router.post('/getPendingScheduleDetails',validateSession, function (req, res) {
    var statusId=req.body.status;
    var q="";
    if(statusId < 8){ 
        q="SELECT c.name,c.nric_number,c.passport_number,c.mobile_number,d.package_english,d.package_malay,e.license_class,a.student_id,a.enroll_id,a.license_id,a.status_id,a.result,b.payment_phase FROM student_license_details a JOIN student_enroll_details b ON a.status_id=IF((SELECT test_flag from status_list WHERE id=a.status_id) = 'T',(SELECT id from status_list where id < "+statusId+" and test_flag != 'R' order by id DESC LIMIT 1),(SELECT id from status_list where id < "+statusId+" order by id DESC LIMIT 1)) and a.license_category NOT IN ('Upgrade','L-License','Advance') and a.student_id=b.student_id and a.enroll_id=b.id JOIN student_details c ON a.student_id=c.id JOIN package_details d ON b.package_id=d.id JOIN license_details e ON a.license_id=e.id";
    }else{
        q="SELECT c.name,c.nric_number,c.passport_number,c.mobile_number,d.package_english,d.package_malay,e.license_class,a.student_id,a.enroll_id,a.license_id,a.status_id,a.result,b.payment_phase FROM student_license_details a JOIN student_enroll_details b ON a.status_id=IF((SELECT test_flag from status_list WHERE id=a.status_id) = 'T',(SELECT id from status_list where id < "+statusId+" and test_flag != 'R' order by id DESC LIMIT 1),(SELECT id from status_list where id < "+statusId+" order by id DESC LIMIT 1)) and a.student_id=b.student_id and a.enroll_id=b.id JOIN student_details c ON a.student_id=c.id JOIN package_details d ON b.package_id=d.id JOIN license_details e ON a.license_id=e.id";
    }
    console.log(q)
    pool.query(q, function (err, studData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(studData){
            //pool.release();
            var idx = 0;
            var finalStudData=[];
            function getFilteredStudent(){
                async.eachOfSeries(studData, function() {
                    stud = studData[idx];
                    pool.query("SELECT * FROM student_schedule_details WHERE student_id='"+stud.student_id+"' and enroll_id='"+stud.enroll_id+"' and license_id='"+stud.license_id+"' and status_id='"+statusId+"'", function (err, scheduleDt) {
                        if (err) {
                            console.log("Problem with MySQL productcatalog",err);
                        }
                        if(scheduleDt){
                            console.log("scheduleDt--------------",scheduleDt)
                            if(scheduleDt.length > 0){
                                idx++;
                                if(idx === studData.length){
                                    res.setHeader('Content-Type', 'application/json');
                                    res.status(200).send(finalStudData);
                                }else{
                                    getFilteredStudent();
                                }
                            }else{
                                if(stud.payment_phase == 1){
                                    if(statusId == 4){ //KPP01
                                        console.log("if----------------")
                                        pool.query("SELECT * FROM payment_details WHERE enroll_id='"+stud.enroll_id+"' and license_id='"+stud.license_id+"' and status_id='"+stud.status_id+"' and payment_flag='Pay' and payment_status='Success'", function (err, firstPay) {
                                            if (err) {
                                                console.log("Problem with MySQL productcatalog",err);
                                            }
                                            if(firstPay){
                                                if(firstPay.length>0){
                                                    finalStudData.push(stud);
                                                    idx++;
                                                    if(idx === studData.length){
                                                        res.setHeader('Content-Type', 'application/json');
                                                        res.status(200).send(finalStudData);
                                                    }else{
                                                        getFilteredStudent();
                                                    }
                                                }else{
                                                    idx++;
                                                    if(idx === studData.length){
                                                        res.setHeader('Content-Type', 'application/json');
                                                        res.status(200).send(finalStudData);
                                                    }else{
                                                        getFilteredStudent();
                                                    }
                                                }
                                            }
                                        })
                                    }else{
                                        finalStudData.push(stud);
                                        idx++;
                                        if(idx === studData.length){
                                            res.setHeader('Content-Type', 'application/json');
                                            res.status(200).send(finalStudData);
                                        }else{
                                            getFilteredStudent();
                                        }
                                    }
                                }else if(stud.payment_phase == 2){
                                    var statusAvail=[4,11]; //KPP01,QTI Test
                                    console.log("2-------------------")
                                    if(statusAvail.includes(statusId)){
                                        pool.query("SELECT * FROM payment_details WHERE enroll_id='"+stud.enroll_id+"' and license_id='"+stud.license_id+"' and status_id='"+stud.status_id+"' and payment_flag='Pay' and payment_status='Success'", function (err, secondPay) {
                                            if (err) {
                                                console.log("Problem with MySQL productcatalog",err);
                                            }
                                            if(secondPay){
                                                if(secondPay.length>0){
                                                    finalStudData.push(stud);
                                                    idx++;
                                                    if(idx === studData.length){
                                                        res.setHeader('Content-Type', 'application/json');
                                                        res.status(200).send(finalStudData);
                                                    }else{
                                                        getFilteredStudent();
                                                    }
                                                }else{
                                                    idx++;
                                                    if(idx === studData.length){
                                                        res.setHeader('Content-Type', 'application/json');
                                                        res.status(200).send(finalStudData);
                                                    }else{
                                                        getFilteredStudent();
                                                    }
                                                }
                                            }
                                        })
                                    }else{
                                        finalStudData.push(stud);
                                        idx++;
                                        if(idx === studData.length){
                                            res.setHeader('Content-Type', 'application/json');
                                            res.status(200).send(finalStudData);
                                        }else{
                                            getFilteredStudent();
                                        }
                                    }
                                }else if(stud.payment_phase == 3){
                                    var statusAvail=[4,8,11]; //KPP01,KPP02,QTI Test
                                    console.log("3---------------------");
                                    if(statusAvail.includes(statusId)){
                                        pool.query("SELECT * FROM payment_details WHERE enroll_id='"+stud.enroll_id+"' and license_id='"+stud.license_id+"' and status_id='"+stud.status_id+"' and payment_flag='Pay' and payment_status='Success'", function (err, ThirdPay) {
                                            if (err) {
                                                console.log("Problem with MySQL productcatalog",err);
                                            }
                                            if(ThirdPay){
                                                if(ThirdPay.length>0){
                                                    finalStudData.push(stud);
                                                    idx++;
                                                    if(idx === studData.length){
                                                        res.setHeader('Content-Type', 'application/json');
                                                        res.status(200).send(finalStudData);
                                                    }else{
                                                        getFilteredStudent();
                                                    }
                                                }else{
                                                    idx++;
                                                    if(idx === studData.length){
                                                        res.setHeader('Content-Type', 'application/json');
                                                        res.status(200).send(finalStudData);
                                                    }else{
                                                        getFilteredStudent();
                                                    }
                                                }
                                            }
                                        })
                                    }else{
                                        finalStudData.push(stud);
                                        idx++;
                                        if(idx === studData.length){
                                            res.setHeader('Content-Type', 'application/json');
                                            res.status(200).send(finalStudData);
                                        }else{
                                            getFilteredStudent();
                                        }
                                    }
                                }
                            }
                        }
                    }) 
                })
            }
            getFilteredStudent();

        }
    })
});



module.exports = router;  