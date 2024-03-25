import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bodyParser from "body-parser";
const PORT = 3001;
const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
const date = new Date();

function getTime(){
  var hrs = date.getHours().toString();
  if(hrs.length===1){
    hrs="0"+mins;
  }
  var mins = date.getMinutes().toString();
  if(mins.length===1){
    mins="0"+mins;
  }
  return (hrs+":"+mins);
}

await mongoose.connect("mongodb://localhost:27017").then((res, e) => {
  if (e) {
    console.log(e.message);
  }
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  fName: String,
  lName: String,
  password: String,
  //   groups: [mongoose.SchemaTypes.ObjectId],
  groups: [String],
});

const messageSchema = new mongoose.Schema({
  sender: String,
  content: String,
  time: String,
});

const groupSchema = new mongoose.Schema({
  groupName: {
    type: String,
    require: true,
    unique: true,
  },
  //   participants: [mongoose.SchemaTypes.ObjectId],
  participants: [String],
  messages: [messageSchema],
});

const User = mongoose.model("user", userSchema);
const Group = mongoose.model("group", groupSchema);

// const grp = await Group.findOneAndUpdate({groupName: "roommates"},{$set: {messages: messageObjs}},{new: true});

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.post("/register", async (req, res) => {
  try {
    console.log(req.body);
    const user = await User.create({
      username: req.body.username,
      fName: req.body.fName,
      lName: req.body.lName,
      password: req.body.password,
      groups: [],
    });
    res.status(201).json(user);
    console.log("user is", user);
  } catch (e) {
    res.send(e.message);
  }
});

app.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if(user===null){
      res.status(404).json({message: "User not found."});
    }
    else if (req.body.password === user.password) {
      res.status(200).json(user);
    } else {
      res
        .status(404)
        .json({ message: "Invalid combination of username and password" });
    }
  } catch (e) {
    res.json({ message: e.message });
  }
});

async function addToGroup(username, groupName) {
  const user = await User.findOne({ username: username });
  const alreadyAdded = false;
  user.groups.map((group) => {
    if (group === groupName) {
      alreadyAdded = true;
      return;
    }
  });
  if (!alreadyAdded) {
    await User.findOneAndUpdate(
      { username: username },
      { $push: { groups: groupName } }
    );
    await Group.findOneAndUpdate(
      { groupName: groupName },
      { $push: { participants: username } },
      { new: true }
    );
  }
}

app.post("/newGroup", async (req, res) => {
  try {
    // const participantIds = await req.body.participants.map(
    //   async (participantUsername) => {
    //     const participant = await User.findOne({
    //       username: participantUsername,
    //     });
    //     console.log(participant._id);
    //     return participant._id;
    //   }
    // );
    const group = await Group.create({
      groupName: req.body.groupName,
    });
    await req.body.participants.map(async (participantUsername) => {
      await addToGroup(participantUsername, req.body.groupName);
    });
    res.status(201).json(group);
    console.log(group);
  } catch (error) {
    res.json({ message: error.message });
  }
});

app.get("/getGroup/:groupName",async (req,res)=>{
  try {
    const groupObj = await Group.findOne({groupName: req.params.groupName});
    res.status(200).json(groupObj);
  } catch (error) {
    res.json({message: error.message});
  }
});

app.post("/sendMsg",async (req,res)=>{
  try {
    const groupObj = await Group.findOneAndUpdate({groupName: req.body.groupName},{$push: {messages: {sender: req.body.sender, content: req.body.content, time: getTime()}}},{new: true});
    res.status(200).json({message: "Message Sent"});
  } catch (error) {
    res.json({message: error.message});
  }
})

app.listen(PORT, () => {
  console.log(`Server is listening on ${PORT}`);
});
