var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var path = require("path");
var Note = require("./models/Note");
var Article = require("./models/Article");
var axios = require("axios");
var cheerio = require("cheerio");


mongoose.connect("mongodb://localhost:27107/unitPopulator",{useNewUrlParser:true})

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
  axios.get("http://www.nytimes.com").then(function(response){
      var $ = cheerio.load(response.data);

    $("article h3").each(function(i, element){
        var result = {};

        result.title = $(this).children("a").text();
        result.summary = $(this).children("a").text();
        result.link = $(this).children("a").attr("href")

    db.Article.create(result).then(function(dbArticle){
        console.log(dbArticle)
    })
    .catch(function(err){
        return res.json(err)
    });
    });
    res.send("scrape complete")
  });
  
});

// getting the articles being scrapped
app.get("/articles",function(req,res){
    db.Article.find({})
    .then(function(dbArticle){
        res.json(dbArticle)
    })
    .catch(function(err){
        res.json(err)
    })
});



// article by objectid
app.get("/articles/:id",function(req,res){
    db.Article.findOne({_id:req.params.id})
.populate("note")
.then(function(dbArticle){
    res.json(dbArticle)
})
.catch(function(err){
    res.json(err)
})
});

// create new note or replace 
app.post("/articles/:id",function(req,res){
    db.Note.create(req.body)
    .then(function(dbNote){
        return db.Article.findOneAndUpdate({_id: req.params.id},{note:dbNote._d},{new:true})
    })
    .then(function(dbArticle){
        res.json(dbArticle)
    })
    .catch(function(err){
        res.json(err)
    });
});

app.listen(process.env.PORT || 3000,function(){
    console.log("app is running on Port 3000 !")
})



