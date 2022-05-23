var mysql = require('mysql');


var dbconfig={
    host: 'localhost',
    port:'3306',
    user: 'root', 
    password: '', 
    database: 'kanaga_new',
    poolLimit:50,
};


//- Create the pool variable
var pool = mysql.createPool(dbconfig);

//- Establish a new pool
pool.getConnection(function(err){
    if(err) {
        // mysqlErrorHandling(pool, err);
        console.log("\n\t *** Cannot establish a pool with the database. ***");

        pool = reconnect(pool);
    }else {
        console.log("\n\t *** New pool established with the database. ***")
    }
});

//- Repool function
function reconnect(pool){
    console.log("\n New pool tentative...");

    //- Destroy the current pool variable
    if(pool) 
    // pool.release();

    //- Create a new one
    var pool = mysql.createpool(dbconfig);

    //- Try to reconnect
    pool.getConnection(function(err){
        if(err) {
            //- Try to connect every 2 seconds.
            setTimeout(reconnect, 2000);
        }else {
            console.log("\n\t *** New pool established with the database. ***")
            return pool;
        }
    });
}

//- Error listener
pool.on('error', function(err) {

    //- The server close the pool.
    if(err.code === "PROTOCOL_pool_LOST"){    
        console.log("/!\\ Cannot establish a pool with the database. /!\\ ("+err.code+")");
        pool = reconnect(pool);
    }

    //- pool in closing
    else if(err.code === "PROTOCOL_ENQUEUE_AFTER_QUIT"){
        console.log("/!\\ Cannot establish a pool with the database. /!\\ ("+err.code+")");
        pool = reconnect(pool);
    }

    //- Fatal error : pool variable must be recreated
    else if(err.code === "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR"){
        console.log("/!\\ Cannot establish a pool with the database. /!\\ ("+err.code+")");
        pool = reconnect(pool);
    }

    //- Error because a pool is already being established
    else if(err.code === "PROTOCOL_ENQUEUE_HANDSHAKE_TWICE"){
        console.log("/!\\ Cannot establish a pool with the database. /!\\ ("+err.code+")");
        pool = reconnect(pool);
    }

    //- Anything else
    else{
        console.log("/!\\ Cannot establish a pool with the database. /!\\ ("+err.code+")");
        pool = reconnect(pool);
    }

});


module.exports = pool;