var express = require('express');
var app = express();
var expressValidator = require("express-validator");
var bodyParser = require("body-parser");
var path = require("path");
var session = require("express-session");
var cookieParser = require("cookie-parser");
var fs = require('fs')
var cors = require('cors');
var multer  = require('multer')
const { check, validationResult } = require('express-validator/check');
var userTable = require('./db/users.js');
var propertyTable = require('./db/property.js');
var fetch = require('node-fetch');
const uuidv1 = require('uuid/v1');
const port = process.env.PORT || 3501;

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },

    filename: function (req, file, cb) {      
    cb(null,file.originalname);
    }
});
var upload = multer({ storage: storage }).any();


//app.use(cors());
//app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(cors({ origin: 'https://homerental.herokuapp.com', credentials: true }));
//app.use(cors({ origin:"http://54.183.202.246:3500", credentials:true }));

app.use(function(req, res, next) {
    //const url = "http://localhost:3000";
    const url = "https://homerental.herokuapp.com"
    //const url = "http://ec2-54-183-194-12.us-west-1.compute.amazonaws.com:3500"
    //const url = "http://54.183.202.246:3500";
    res.setHeader('Access-Control-Allow-Origin', url);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers');
    res.setHeader('Cache-Control', 'no-cache');
    next();
  });



app.use(session({
    secret: 'usersecurestring',
    resave: false,
    saveUninitialized: false,
    duration            : 60 * 60 * 1000,    // Overall duration of Session : 30 minutes : 1800 seconds
    activeDuration      :  5 * 60 * 1000
}));


//body and cookie parser
app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: true })); 
app.use(cookieParser())


app.get("/start",(request,response)=>{
    response.status(200).json({
        'msg' : 'Welcome'
    })
})

// LOGIN POST REQUEST WITH MONGO
app.post("/login",function(request,response){
    
    const username = request.body.username;
    const password = request.body.password;
    
    console.log(request.body);
    userTable.check_user_credentials(username,password).then((result)=>{
        console.log(result);
        var data = {
            userid:result.userid,
            username:result.username,
            firstname:result.firstname,
            lastname:result.lastname
        }

        request.session.user = data;
        response.cookie('username',data,{maxAge: 900000, httpOnly: false, path : '/'});
        console.log(data);
        response.status(200).json({
                userExists:true,
                user:data,
                errors:[]
            });

    }).catch((error)=>{
        console.log(error);
        response.status(201).json({
            userExists:false,
            user:{},
            errors:[{msg:error}]
        });
    }); 
});


// SIGN UP POST REQUEST WITH MONGO
app.post("/signup",function(request,response){
    
    var user = Object.assign({},request.body);

    console.log(user);
    userTable.signup_user(user).then((result)=>{
        
        var data = {
            userid:result.userid,
            username:result.username,
            firstname:result.firstname,
            lastname:result.lastname
        }
        
        request.session.user = data;
        response.cookie('username',data,{maxAge: 900000, httpOnly: false, path : '/'});
        console.log("user created")
        response.status(200).json({
            userExists:true,
            user:data,
            errors:[]
        });
    })
    .catch((error)=>{
        response.status(201).json({
            userExists:false,
            user:{},
            errors:[{msg:"Username already exists"}]
        });
    });
});


// WITH MONGO
app.post('/addProperty',(req, res) =>{
    
    upload(req, res,(err) =>{
        if (err) {
            // An error occurred when uploading
            console.log(err);
            res.status(201).json({
                msg : "There was a propblem in uploading your file"
            })
        }
        const property = JSON.parse(req.body.property);

        console.log(property);
        const ownerid = req.body.ownerid;
        const{propertyid,photos} = property;
        
        propertyTable.addProperty(ownerid,property).then((msg)=>{
            console.log("Property addition" +msg);
            res.status(200).json({
                msg
            });
            //movePhotosToDirectory(propertyid,photos);
            
        }).catch((msg)=>{
            res.status(201).json({
                msg
            });
            
        });

    });
    
});

async function movePhotosToDirectory(propertyid,photos){
    
    if(!fs.existsSync(`./uploads/${propertyid}`)){
        fs.mkdirSync(`./uploads/${propertyid}`);
    }
    photos.forEach((element) => {
        var source = `./uploads/${element}`;
        var destination =  `./uploads/${propertyid}/${element}`
        //fs.rename(source,destination);
        fs.copyFileSync(source, destination);
    });
    
}


/** */
app.get("/property/:propertyid",(request,response)=>{

    const propertyid = request.params.propertyid;

    console.log(propertyid);
    if(propertyid=="" || propertyid==" " || typeof(propertyid)=="undefined"){
        response.sendStatus(201);
    }

    typeof
    propertyTable.retrievePropertyDetails(propertyid).then((property)=>{
        console.log(property);
        response.status(200).json({
            property
        });

    }).catch((error)=>{
        console.log(error);
        response.sendStatus(201);
    })
    
});

/** */
app.post('/search',function(request,response){
    const data = request.body;
    console.log(data);

    if(JSON.stringify(data) == "{}"){
        response.sendStatus(201);
    }

    
    propertyTable.searchCriteria(data).then((search)=>{
        
        console.log("searching properties");
        console.log(search);
        response.status(200).json({
            search
        });

    }).catch((error)=>{
        
        response.sendStatus(201);
    });
    

});


app.get("/ownerlisting/:ownerid/:stepper",function(req,response){
    const {ownerid,stepper} = req.params;
    console.log("Properties of "+ownerid);
    
   propertyTable.ownerPropertyListing(ownerid,stepper).then((properties)=>{

    response.status(200).json({'listings' : properties });

    console.log(properties);
   }).catch((error)=>{
       console.log(error);
       response.sendStatus(201);
   });
   
});

app.get("/image/:name",function(req,res){
    const name = req.params.name;
    const mime = "image/"+name.slice(-3);
    fs.readFile("./uploads/"+name,function(err,content){
        if(err){
            console.log(err);
        }else{
            res.writeHead(200,{'content-type':mime});
            res.end(content,'binary');
        }
    });
});

/***/
app.post("/booking/:propertyid",function(request,response){
    const propertyid = request.params.propertyid;
    var data = request.body;
    console.log("Data needed for booking");
    console.log(data);

    propertyTable.booking(propertyid,data).then((msg)=>{
        response.sendStatus(200);

    }).catch((error)=>{
        console.log(error);
        response.sendStatus(201);
    });

});


/** */
app.get("/tripboards/:userid/:page",(request,response)=>{
    const {userid,page} = request.params;

    console.log("Tripboards of "+userid);
    propertyTable.tripboards(userid,page).then((trips)=>{

        console.log(trips);
        response.status(200).json({trips});

    }).catch((error)=>{
        console.log(error);
        response.sendStatus(201);
    });
    
});


app.post("/profile/:userid", (request,response)=>{
    const userid=request.params.userid;
    const data = request.body;
    console.log(userid);
    userTable.updateprofile(data,userid).then((docs)=>{
        if(docs.nModified == 1){
            console.log(docs);
            response.status(200).json({
                user : docs
            });
        }else{
            response.sendStatus(201);    
        }
        
    }).catch((error)=>{
        console.log(error);
        response.sendStatus(201);
    })

});

app.get("/profile/:userid", (request,response)=>{
    const userid = request.params.userid;

    userTable.getProfile(userid).then((user)=>{
        response.status(200).json({
            user:user
        });
    }).catch((error)=>{
        response.sendStatus(201);
    });
});


//Messages

/**  Post message both in User and owner**/
app.post("/message/:userid",(request,response)=>{
    
    
    const userid = request.params.userid;
    const data = request.body;
    const {ownerid,ownername,username,message,propertyid} = data;
    
    
    if(![userid,ownerid,ownername,username,message,propertyid].every(Boolean)){
        response.sendStatus(201);
    }else{
        console.log("Message that has been posted")
        
        console.log(data);
        propertyTable.messageToTravellerAndOwner(userid,data).then((msg)=>{
            response.sendStatus(200);
        }).catch((error)=>{
            response.sendStatus(201);
        });
    }

});

app.get("/inbox/:userid", (request,response)=>{
    const userid = request.params.userid;
    console.log(userid);
    propertyTable.fetchUserMessages(userid).then((messages)=>{
        response.status(200).json({ messages });
    }).catch((error)=>{
        console.log(error);
        response.status(201).json({ error });
    })
});

var server = app.listen(port,()=>{
    console.log(port)
    if(port === 3501){
        console.log("Homeaway server has started to listen at http://localhost:3501");
    }else{
        console.log("Homeaway server has started to listen at http://homerental-backend.herokuapp.com");
    }
    
});
     
