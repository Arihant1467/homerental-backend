const bcrypt = require('bcrypt');
var MongoClient = require('mongodb').MongoClient;
//const mongo_url = "mongodb://localhost:27017/HomeAway"; // Localhost url
//const mongo_url = "mongodb://127.0.0.1:36820"; // EC2 Local url
const mongo_url = "mongodb://arihantsai:Arihant*1467@ds052827.mlab.com:52827/homeaway-arihant"
//const mongo_url = "mongodb://arihant:arihant1467@ds052827.mlab.com:52827/homeaway-arihant"
var _db;

const connectMongo = async function(){
    try{
        const db = await MongoClient.connect(mongo_url,{useNewUrlParser:true});
        _db = db
        return Promise.resolve(db);
    }catch(error){
        return Promise.reject("Could not connect to db");
    }
}



module.exports = {_db,connectMongo};

/*
    const db_connection =connectMongo().then((db_connection)=>{
        const homeAwayDB = db_connection.db("HomeAway");

        var query = {"properties.propertyid": "930bf0bb-b09e-4c6c-bb81-d0bf3274d673","properties.$":0}
        


        


    }).catch((error)=>{
        console.log(error);
    })
*/
/*
    Get all properties based on form criteria
    var query = [
            { $unwind: "$properties" },
            {
                $match: {
                    "properties.city": /San/i,
                    "properties.accomodate": { $gte: 2 }
                }
            }
        ]


        const docs = homeAwayDB.collection("users").aggregate(query).toArray((err,docs)=>{
            console.log("documents");
            docs.forEach((props,index)=>{
                console.log(props.properties);
                
            })
           // console.log(err);
        });  
        
    Get a particular property
    db.users.findOne( 
        {"properties.propertyid": "930bf0bb-b09e-4c6c-bb81-d0bf3274d673"},
        {"properties.$":1}
    )

    homeAwayDB.collection("users").findOne({"properties.propertyid": "930bf0bb-b09e-4c6c-bb81-d0bf3274d673"},(err,docs)=>{
            console.log("documents");
            console.log(docs);
           
        });
*/
