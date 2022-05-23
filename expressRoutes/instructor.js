const express = require('express');
var router = express.Router();
var db = require('../db');
const moment = require('moment');
const pool = require('../db');
var async = require('async');


function zeroPad(num,total){
    console.log(num)
    return num.toString().padStart(Number(total), "0");
}

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
            license_id:scheduleDt.license_id,
            license_class:scheduleDt.license_class,
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

// ------------to get All NRIC Number for Timeline---------------------

router.get('/getNRICNumberForInsTimeline', function (req, res) {
    pool.query("SELECT b.id,b.name,b.date_of_birth,b.gender,b.mobile_number,b.email_id,b.address_nric,b.city,b.state,b.nric_number,b.cur_date FROM student_schedule_details a JOIN student_details b ON a.employee_id='"+req.session.userInfo.id+"' and a.student_id=b.id and b.is_deleted=0 group by a.student_id", function (err, licenseData) {
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


router.get('/getPassportNumberForInsTimeline', function (req, res) {
    pool.query("SELECT b.id,b.name,b.date_of_birth,b.gender,b.mobile_number,b.email_id,b.address_nric,b.city,b.state,b.passport_number,b.cur_date FROM student_schedule_details a JOIN student_details b ON a.employee_id='"+req.session.userInfo.id+"' and a.student_id=b.id and b.is_deleted=0 group by a.student_id", function (err, licenseData) {
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

router.get('/getScheduleDetailsForInstructor', validateSession,function (req, res) {
    console.log("SELECT a.*,BIN(a.timeslot) as TimeSlot,DATE(a.start_date) as start_Date,DATE(a.end_date) as end_Date,b.status,b.schedule_color FROM schedule_details a JOIN status_list b ON a.employee_id='"+req.session.userInfo.id+"' and a.license_id IN (SELECT license_id FROM employee_license_details WHERE employee_id='"+req.session.userInfo.id+"') and a.status_id=b.id and a.is_deleted=0 GROUP BY a.status_id,a.license_id,a.start_date,a.end_date")
  pool.query("SELECT a.*,BIN(a.timeslot) as TimeSlot,DATE(a.start_date) as start_Date,DATE(a.end_date) as end_Date,b.status,b.schedule_color,c.license_class FROM schedule_details a JOIN status_list b ON a.employee_id='"+req.session.userInfo.id+"' and a.license_id IN (SELECT license_id FROM employee_license_details WHERE employee_id='"+req.session.userInfo.id+"') and a.status_id=b.id and a.is_deleted=0 JOIN license_details c ON a.license_id=c.id GROUP BY a.status_id,a.license_id,a.start_date,a.end_date", function (err, AssignList) {
      if (err) {
          console.log("Problem with MySQL productcatalog",err);
      }
      if(AssignList){
        var dateArray = new Array();
            if(AssignList.length > 0){
                console.log("AssignList============",AssignList)
                var idx = 0;
                    function checkScheduled(){
                        async.eachOfSeries(AssignList, function() {
                            scheduleDt = AssignList[idx];
                            var dateList=getDates(scheduleDt.start_Date,scheduleDt.end_Date,scheduleDt,dateArray);
                            idx++;
                            if(idx == AssignList.length){
                                console.log("dateList----------",dateList);
                                var idx1 = 0;
                                function processScheduled(){
                                    async.eachOfSeries(dateList, function() {
                                        datedt = dateList[idx1];
                                        var checkDate=moment(new Date(datedt.startDate)).format("YYYY-MM-DD");
                                        pool.query("SELECT a.*,BIN(a.timeslot) as TimeSlot,DATE(a.schedule_date) as startDate,b.status,b.schedule_color FROM student_schedule_details a JOIN status_list b ON a.employee_id='"+req.session.userInfo.id+"' and DATE(a.schedule_date)='"+checkDate+"' and a.status_id='"+datedt.status_id+"' and a.status_id=b.id", function (err, existingSchedule) {
                                            if (err) {
                                                console.log("Problem with MySQL productcatalog",err);
                                            }
                                            if(existingSchedule){
                                                if(existingSchedule.length > 0){
                                                    var compSchedule=existingSchedule.filter(el=>el.schedule_status == 1);
                                                    console.log("existingSchedule-------",existingSchedule);
                                                    // datedt['schedule_color']='fc-event-success';
                                                    datedt['schedule_color']=(existingSchedule.length == compSchedule.length ? 'fc-event-grey' : 'fc-event-success');
                                                    idx1++;
                                                    if(idx1 == dateList.length){
                                                        console.log("dateList====111111====",dateList);
    
                                                        res.setHeader('Content-Type', 'application/json');
                                                        res.status(200).send({'status':'New','data': dateList});
                                                    }else{
                                                        processScheduled();
                                                    }
                                                }else{
                                                    datedt['schedule_color']='fc-event-primary';
                                                    idx1++
                                                    if(idx1 == dateList.length){
                                                        console.log("dateList=====222222222===",dateList);
    
                                                        res.setHeader('Content-Type', 'application/json');
                                                        res.status(200).send({'status':'New','data': dateList});
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
      }
  })
});

router.post('/getStudentDetailsForInstructor',validateSession, function (req, res) {
    var calendarData=req.body.calendarData;
    console.log("Callleddddd=========",calendarData)

    var startDate = moment(new Date(calendarData.startDate)).format("YYYY-MM-DD");
    pool.query("SELECT d.id,d.name,d.nric_number,d.passport_number,d.mobile_number,d.email_id,a.id as schedule_id,a.license_id,a.status_id as sch_status_id,a.enroll_id,b.enrollment_no,BIN(a.timeslot) as TimeSlot,CAST(a.timeslot as UNSIGNED) as timeslot_bit,a.schedule_status FROM student_schedule_details a JOIN student_enroll_details b ON DATE(a.schedule_date)='"+startDate+"' and a.status_id='"+calendarData.statusid+"' and a.license_id='"+calendarData.license_id+"' and a.employee_id='"+req.session.userInfo.id+"' and a.student_id=b.student_id and a.enroll_id=b.id JOIN student_details d ON a.student_id=d.id", function (err, AssignList) {
      if (err) {
          console.log("Problem with MySQL productcatalog",err);
      }
      if(AssignList){
          //pool.release();
          console.log("AssignList======viewwwww======",AssignList)
          res.setHeader('Content-Type', 'application/json');
          res.status(200).send({'data': AssignList});
      }
  })
});

router.post('/getStatusListPerRole',validateSession, function (req, res) {
    var custData=req.body.custData;
    console.log("custData======",custData);
    console.log("SELECT * FROM status_list WHERE owner_id IN (5,6) and id > '"+custData.curStatus+"' and id IN (SELECT status_id from student_schedule_details WHERE employee_id='"+req.session.userInfo.id+"' and student_id='"+custData.id+"') ORDER BY id ASC LIMIT 1")
    pool.query("SELECT * FROM status_list WHERE owner_id IN (5,6) and id > '"+custData.curStatus+"' and id IN (SELECT status_id from student_schedule_details WHERE employee_id='"+req.session.userInfo.id+"' and student_id='"+custData.id+"') ORDER BY id ASC LIMIT 1", function (err, statusList) {
      if (err) {
          console.log("Problem with MySQL productcatalog",err);
      }
      if(statusList){
          console.log("statusList-----",statusList)
          res.setHeader('Content-Type', 'application/json');
          res.status(200).send({'data': statusList});
      }
  })
});


router.get('/getStudentListPerInstructor',validateSession, function (req, res) {
    pool.query("SELECT b.*,c.enrollment_no,d.status_id as curStatus,a.enroll_id,a.license_id,e.status as current_status FROM student_schedule_details a JOIN student_details b ON a.employee_id='"+req.session.userInfo.id+"' and a.student_id=b.id and b.is_deleted=0 JOIN student_enroll_details c ON a.enroll_id=c.id JOIN student_license_details d ON c.id=d.enroll_id and a.license_id=d.license_id JOIN status_list e ON d.status_id=e.id group by a.enroll_id,a.license_id", function (err, studData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(studData){
            if(studData.length > 0){
                var idx=0;
                function checkForStatus(){
                    async.eachOfSeries(studData, function() {
                        stud = studData[idx];
                        pool.query("SELECT * FROM status_list WHERE owner_id IN (5,6) and id > '"+stud.curStatus+"' and id IN (SELECT status_id from student_schedule_details WHERE employee_id='"+req.session.userInfo.id+"' and student_id='"+stud.id+"' and enroll_id='"+stud.enroll_id+"' and license_id='"+stud.license_id+"') ORDER BY id ASC LIMIT 1", function (err, statusList) {
                            if (err) {
                                console.log("Problem with MySQL productcatalog",err);
                            }
                            if(statusList){
                                if(statusList.length > 0){
                                    var next_status=statusList[0];
                                    stud.nextStatus=next_status.status;
                                    console.log("checkForStatus();-----",stud)
                                    pool.query("SELECT SUM(schedule_status) as schedule_count FROM student_schedule_details WHERE student_id='"+stud.id+"' and enroll_id='"+stud.enroll_id+"' and license_id='"+stud.license_id+"' and status_id='"+next_status.id+"' GROUP BY student_id,enroll_id,license_id,status_id", function (err, statusCheck) {
                                        if (err) {
                                            console.log("Problem with MySQL productcatalog",err);
                                        }
                                        if(statusCheck){
                                            stud.scheduleCount=(statusCheck.length > 0 ? statusCheck[0].schedule_count : 0);
                                            stud.maxCount=(next_status.id == 8 ? 6 : (next_status.id == 9 ? 10 :(next_status.id == 11 ? 1 : (next_status.id == 12 ? 1 : 0))))
                                            stud.statusColor=(stud.scheduleCount == stud.maxCount ? 'green' : 'red')
                                            stud.todisplay= stud.nextStatus +' ('+stud.scheduleCount+'/'+stud.maxCount+')';
                                            idx++;
                                            if(idx == studData.length){
                                                console.log("studData-------",studData);
                                                res.setHeader('Content-Type', 'application/json');
                                                res.status(200).send({'data':studData});
                                            }else{
                                                checkForStatus();
                                            }
                                            
                                        }
                                    })
                                }else{
                                    idx++;
                                    if(idx == studData.length){
                                        console.log("studData-------",studData);
                                        res.setHeader('Content-Type', 'application/json');
                                        res.status(200).send({'data':studData});
                                    }else{
                                        checkForStatus();
                                    }
                                }
                            }
                        })
                    })
                }
                checkForStatus();
            }else{
                console.log("studData-------",studData);
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send({'data':studData});
            }
        }
    })
})


router.post('/updateScheduleStatus',validateSession, function (req, res) {
    var studentData=req.body.studentData;
    console.log("studentData======",studentData);
    studentData.forEach((studDt,idx)=>{
        pool.query("UPDATE student_schedule_details SET schedule_status=1,schedule_remarks='"+studDt.sch_remarks+"' WHERE id='"+studDt.schedule_id+"' and student_id='"+studDt.id+"' and enroll_id='"+studDt.enrollid+"' and license_id='"+studDt.license_id+"'", function (err, studData) {
            if (err) {
                console.log("Problem with MySQL productcatalog",err);
            }
            if(studData){
                if(idx === studentData.length-1){
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).send({'status':'Success'});
                }
            }
        })
    })
});

router.post('/updateStudentStatusInfo',validateSession, function (req, res) {
    var studentInfo=req.body.studentInfo;
    var statusdt=req.body.statusdt;
    var marks=statusdt.marks != '' ? statusdt.marks : null;
      console.log("marks-----",marks)
    var curDate=moment(new Date()).format("YYYY-MM-DD hh:mm");

    pool.query("INSERT INTO student_status_details (student_id,enroll_id,license_id,status_id,result,marks,remarks,completed_date,updated_by) VALUES ('"+studentInfo.id+"','"+studentInfo.enroll_id+"','"+studentInfo.license_id+"','"+statusdt.status_id+"','"+statusdt.result+"',"+marks+",'"+statusdt.remarks+"','"+curDate+"','"+req.session.userInfo.id+"')", function (err, updateStatus) {
      if (err) {
          console.log("Problem with MySQL productcatalog",err);
      }
      if(updateStatus){
        pool.query("UPDATE student_license_details SET status_id='"+statusdt.status_id+"',result='"+statusdt.result+"' WHERE student_id='"+studentInfo.id+"' and enroll_id='"+studentInfo.enroll_id+"' and license_id='"+studentInfo.license_id+"'", function (err, studData) {
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





router.post('/checkScheduleCompleted',validateSession, function (req, res) {
    var studData=req.body.studData;
    var status_id=req.body.status_id;
    console.log("studentData======",studData,status_id);
        pool.query("SELECT SUM(schedule_status) as schedule_count FROM student_schedule_details WHERE student_id='"+studData.id+"' and enroll_id='"+studData.enroll_id+"' and license_id='"+studData.license_id+"' and status_id='"+status_id+"' GROUP BY student_id,enroll_id,license_id,status_id", function (err, studData) {
            if (err) {
                console.log("Problem with MySQL productcatalog",err);
            }
            if(studData){
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send({'data':studData});
            }
        })
});

module.exports = router;