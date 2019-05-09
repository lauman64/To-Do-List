//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
//const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-Alan:test123@cluster0-8xpvz.mongodb.net/todolistDB", {
  useNewUrlParser: true
});

const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }
});

const customListSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  items: [itemsSchema]

});

const List = mongoose.model("List", customListSchema);

const Item = mongoose.model("Item", itemsSchema);

const task1 = new Item({
  name: "Buy coffee"
});

const task2 = new Item({
  name: "Make coffee"
});

const task3 = new Item({
  name: "Drink coffee"
});

const defaultTask = [task1, task2, task3];



function firstRun() {
  Item.insertMany(defaultTask, function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log("Success! Things are saved to the DB");
    }
  });
};


function saveItem(data) {
  let newItem = new Item({
    name: data
  });
  newItem.save(function(err, item) {
    if (err) {
      console.log(err);
    } else {
      console.log("New item saved to DB.")
    }
  });
};

function deleteItem(itemId) {
  let condition = {
    _id: itemId
  };
  Item.deleteOne(condition, function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log("Task deleted.")
    }
  });
};

app.get("/", function(req, res) {
  Item.find({}, function(err, results) {
    if (results.length === 0) {
      firstRun();
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: results
      });
    }
  });

});

app.post("/", function(req, res) {

  const listName = req.body.list;
  const item = req.body.newItem;
  if (item.length > 0) {
    if(listName === "Today"){
      saveItem(item);
      res.redirect("/");
    }else{
      List.findOne({
        name: listName
      }, function(err, foundList){
        if(!err){
          foundList.items.push({name: item});
          foundList.save();
          res.redirect("/" + listName);
        }
      })
    }
  } else {
    console.log("Task is empty, therefore not added to the list.");
  }
});

app.post("/delete", function(req, res) {
  //console.log(req.params);
  const listName = req.body.listName;
  const itemId = req.body.deleteBox;

  if(listName === "Today"){
    deleteItem(itemId);
    res.redirect("/");
  }else{
    List.findOneAndUpdate({
      name: listName
    },{
      $pull:{items: {_id: itemId}}
    },function(err, results){
      if(!err){
        res.redirect("/" + listName);
      }
    })
  }

  //res.redirect("/");
});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({
    name: customListName
  }, function(err, results) {
    if (!err) {
      if (!results) {
        const list = new List({
          name: customListName,
          items: defaultTask
        });
        list.save();
        console.log("Created a new List entry: " + customListName);
        res.redirect("/" + customListName);
      } else {
        console.log(customListName + " entry exists.");
        res.render("list", {
          listTitle: customListName,
          newListItems: results.items
        });
      }
    }
  });
});

app.get("/about", function(req, res) {
  res.render("about");
});


app.get("/favicon.ico", function(req, res){
    res.sendStatus(204);
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
