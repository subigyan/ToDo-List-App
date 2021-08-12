const express = require("express");
const bodyParser = require("body-parser");
const { join } = require("path");
// const date = require(join(__dirname, "date.js"));
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// let items = ["Laugh", "Sleep", "Cry"];
// let workItems = ["work"];

mongoose.connect(
  "mongodb://localhost:27017/todoListDB",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
mongoose.set("useFindAndModify", false);
const itemSchema = {
  name: {
    type: String,
  },
};

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to the Todo List",
});

const item2 = new Item({
  name: "Click + to add a new todo",
});

const item3 = new Item({
  name: "← Check to remove your todo",
});

const defaultItems = [item1, item2, item3];

let listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema],
});

let List = new mongoose.model("List", listSchema);

app.get("/favicon.ico", (req, res) => {
  return "your faveicon";
});

app
  .route("/")
  .get(function (req, res) {
    // let day = date.getDate();
    Item.find({}, async function (err, items) {
      if (items.length === 0) {
        await Item.insertMany(defaultItems, function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully saved default items to DB.");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", { title: "Today", newListItems: items });
      }
    });
  })
  .post((req, res) => {
    let itemName = req.body.newItem;
    let listName = req.body.submitBtn;
    const newItem = new Item({
      name: itemName,
    });

    if (listName == "today") {
      if (itemName != "") {
        newItem.save();
        res.redirect("/");
      } else {
        res.redirect("/");
      }
    } else {
      if (itemName != "") {
        console.log(listName);
        List.findOne({ name: listName }, async function (err, foundList) {
          foundList.items.push(newItem);
          await foundList.save();
          res.redirect(`/${listName}`);
        });
      } else {
        res.redirect(`/${listName}`);
      }
    }
  });

app.get("/:customListName", (req, res) => {
  const customListName = _.lowerCase(req.params.customListName);
  List.findOne({ name: customListName }, async function (err, foundLists) {
    if (!err) {
      if (foundLists) {
        res.render("list", {
          title: `${customListName.toUpperCase()} TODO`,
          newListItems: foundLists.items,
        });
      } else {
        console.log(123);
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        await list.save();
        res.redirect(`/${customListName}`);
      }
    }
  });
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  console.log(listName);
  if (listName === "today") {
    Item.findByIdAndDelete(checkedItemId, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully removed the item");
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (err) {
          console.log(err);
        } else {
          res.redirect(`/${listName}`);
        }
      }
    );
  }
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.listen(3000, function () {
  console.log("The server is running on port 3000");
});

// let currentDay = today.getDay();
// const days = [
//   "Sunday",
//   "Monday",
//   "Tuesday",
//   "Wednesday",
//   "Thursday",
//   "Friday",
//   "Saturday",
// ];
// let day = days[currentDay];
// let dayKind = "";
// if (currentDay == 6) {
//   dayKind = "Weekend";
// } else {
//   dayKind = "Weekday";
// }
