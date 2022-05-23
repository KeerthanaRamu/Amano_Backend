const express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var ACCESS_TOKEN_SECRET = "0cf22951fd77561b6eef4587d187050604b8256ece9c9e5b13e3161529094cdcbc0c0c3056da254d975799bb93e3eeb818dd0623345683e8fad04e163ef54rtd";
var pool = require('../db');
var bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');
var async = require('async');

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


  router.post('/setEmployeeDetails',upload.single('file'),function (req, res) {
    var baseRoot=req.body.baseRoot;
    var userData = JSON.parse(req.body.UserData);
    var license_type =JSON.parse(req.body.license_type);
    const file = req.file;
    console.log("baseroot==========",baseRoot,userData)
    var correctedPath =  (req.file ? (baseRoot+'/'+(file.fieldname+'.'+(file.mimetype.split('/')[1])) ) : '');
    console.log("correctedPath===========",correctedPath)
        pool.query("SELECT * FROM employee_details WHERE user_name='"+userData.user_name+"' and is_deleted=0", function (err, UserExists) {
            if (err) {
                console.log("Problem with MySQL productcatalog",err);
            }
            if (UserExists.length > 0) {
                //pool.release();
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send({'status': 'Already Exists' });
            }else{
            var authToken=jwt.sign({ usertoken: userData.user_name }, ACCESS_TOKEN_SECRET);
            //   bcrypt.hash(userData.password,10, function(err, hash) {
            //       console.log("hash====",hash)
                pool.query("INSERT INTO employee_details (name,last_name,user_name,password,role_id,authToken,img,mobile_no,email_id) VALUES ('"+userData.name+"','"+userData.last_name+"','"+userData.user_name+"','"+userData.password+"','"+userData.role+"','"+authToken+"','"+correctedPath+"','"+userData.mobile_no+"','"+userData.email_id+"')", function (err, setEmployee) {
                    if (err) {
                        console.log("Problem with MySQL productcatalog",err);
                    }
                    if(setEmployee){
                        if(license_type.length > 0){
                            license_type.forEach((licData,idx)=>{
                                pool.query("INSERT INTO employee_license_details (employee_id,license_id) VALUES ('"+setEmployee.insertId+"','"+licData.id+"')", function (err, setPack) {
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
                        }else{
                            res.setHeader('Content-Type', 'application/json');
                            res.status(200).send({'status': 'Success' });
                        }
                    }
                })
            // })
            }    
        });
  });

  
  router.get('/getUserList', function (req, res) {
    pool.query("SELECT a.*,c.role FROM employee_details a JOIN role_master c ON a.is_deleted=0 and a.role_id=c.id", function (err, getUser) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(getUser){
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(getUser);
        }
    })
});


router.get('/getRoleList', function (req, res) {
    pool.query("SELECT * FROM role_master WHERE id NOT IN (1,2)", function (err, roleData) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(roleData){
            //pool.release();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(roleData);
        }
    })
});

router.post('/updateUserDetails',upload.single('file'), function (req, res) {
    var baseRoot=req.body.baseRoot;
    const file = req.file;
    var userData = JSON.parse(req.body.UserData);
    console.log("userData----------",userData,req.file)
    var correctedPath = ( req.file != undefined ? (baseRoot+'/'+(file.fieldname+'.'+(file.mimetype.split('/')[1]))) : userData.img);
       console.log("correctedPath=====",correctedPath)
        pool.query("UPDATE employee_details SET name='"+userData.name+"',last_name='"+userData.last_name+"',password='"+userData.password+"',img='"+correctedPath+"',mobile_no='"+userData.mobile_no+"',email_id='"+userData.email_id+"' WHERE id='"+userData.id+"'", function (err, userUpdate) {
            if (err) {
                console.log("Problem with MySQL productcatalog",err);
            }
            if(userUpdate){
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send({'status': 'Success' });
            }
        })
  });

  router.post('/deleteUserDetails', function (req, res) {
    var userData = req.body.userData;
    pool.query("UPDATE employee_details SET is_deleted=1 WHERE id='"+userData.id+"'", function (err, delUser) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(delUser){
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send({'status': 'Success' });
        }
    })
  });


  router.get('/getEmployeeList', function (req, res) {
     pool.query("SELECT a.*,c.role FROM employee_details a JOIN role_master c ON a.is_deleted=0 and a.role_id NOT IN('1','2','3') and a.role_id=c.id", function (err, empList) {
        if (err) {
            console.log("Problem with MySQL productcatalog",err);
        }
        if(empList){
            if(empList.length > 0){
                var idx = 0;
                function emploeeLicense(){
                    async.eachOfSeries(empList, function() {
                        empdt = empList[idx];
                        empdt['license_list']=[];
                        pool.query("SELECT b.license_class FROM employee_license_details a JOIN license_details b ON a.employee_id='"+empdt.id+"' and a.license_id=b.id", function (err, empLicData) {
                            if (err) {
                                console.log("Problem with MySQL productcatalog",err);
                            }
                            if(empLicData){
                                for(i=0;i<empLicData.length;i++){
                                    empdt['license_list'].push(empLicData[i].license_class)
                                }
                                empdt['license_data']=empLicData;
                                idx++;
                                if(idx === empList.length){
                                    //pool.release();
                                    res.setHeader('Content-Type', 'application/json');
                                    res.status(200).send(empList);
                                }else{
                                    emploeeLicense();  
                                }
                            }
                        })
                    })
                }
                emploeeLicense();  
            }else{
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send(empList);
            }
        }
    })
});
module.exports = router;