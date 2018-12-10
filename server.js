var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var path = require("path");
var Note = require("./models/Note");
var Article = require("./models/Article");

var axios = require("axios")
var cheerio = require("cheerio")

mongoose.Promise = Promise;

var app = express()
// morgan for the app
app.use(logger("dev"));
app.use(express.urlencoded({extended:true}))
app.use(express.json());
app.use(express.static("public"))
// handlebars
var exphbs = require("express-handlebars")
app.engine("handlebars",exphbs({
defaultLayout:"main",
partialsDir:path.join(__dirname,"/views/layouts/partials")
}))



// ROUTES
// grabs every doc in the articles array
app.get("/",function(req,res){
    Article.find({},function(error,data){
        if(error){
            console.log(error)
        }
        else{
            res.render("index",{articles:doc})
        }
    })
})

// get routes for scrape
app.get("/scrape",function(req,res){
  axios.get("http://www.nytimes.com",function(response){
      var $ = cheerio.load(response.data);

    $("article h3").each(function(i, element){
        var result = {};

        result.title = $(this).children("a").text();
        result.summary = $(this).children("a").text();
        result.link = $(this).children("a").attr("href")

        var entry = new Article(result)
        entry.save(function(err,datas){
            if(err){
                console.log(err)
            }
            else{
                console.log(datas)
            }
        });
    });
  }) 
  res.redirect("/")
})

// getting the articles being scrapped
app.get("/articles",function(req,res){
    Article.find({},function(err,data){
        if(err){
            console.log(err)
        }
        else{
            res.json(data)
        }
    });
});



// article by objectid
app.get("/articles/:id",function(req,res){
    Article.findOne({"_id":req.params.id})
    .populate("note")
    .exec(function(error,data){
        if(error){
            console.log(error)
        }
        else{
            res.json(data)
        }
    })
})

// create new note or replace 
app.post("/articles/:id",function(req,res){
    var newNote = new Note(req.body)
    newNote.save(function(err,data){
        if(err){
            console.log(err)
        }
        else{
            Article.findOneAndUpdate({"_id":req.params.id},{"notes":doc._id})
            .exec(function(err,result){
                if(err){
                    console.log(err)
                }
                else{
                    res.send(result)
                }
            });
        }
    });
});

app.listen(process.env.PORT || 3000,function(){
    console.log("app is running on Port 3000 !")
})



