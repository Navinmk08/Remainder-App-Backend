require('dotenv').config()
const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")

//app config
const app = express()
app.use(express.json())
app.use(express.urlencoded())
app.use(cors())

//DB config
mongoose.connect('mongodb://127.0.0.1:27017/reminderAppDB',{
    useNewUrlParser:true,
    useUnifiedTopology: true
}, () => console.log("DB connected"));
const reminderSchema = new mongoose.Schema({
    reminderMsg: String,
    remindAt: String,
    isReminder: Boolean
})
const Reminder = new mongoose.model("reminder",reminderSchema)
// mongoose.set('useFindAndModify', false);


//Whatsapp reminding functionality

// 
const checkReminders = async () => {
    try {
      const reminderList = await Reminder.find({}).exec();
  
      if (reminderList && reminderList.length > 0) {
        for (const reminder of reminderList) {
          if (!reminder.isReminder) {
            const now = new Date();
            if (new Date(reminder.remindAt) - now < 0) {
              const updatedReminder = await Reminder.findByIdAndUpdate(reminder._id, { isReminder: true }).exec();
              
              if (updatedReminder) {
                const accountSid = process.env.ACCOUNT_SID;
                const authToken = process.env.AUTH_TOKEN;
                const client = require('twilio')(accountSid, authToken);
                const message = await client.messages.create({
                  body: reminder.reminderMsg,
                  from: 'whatsapp:+14155238886',
                  to: 'whatsapp:+919566324335'
                });
                console.log(message.sid);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };
  
  setInterval(checkReminders, 1000);
  



//API routes
app.get("/getAllReminder",(req,res) =>{
    Reminder.find({},(err,reminderList) => {
        if(err){
            console.log(err)
        }
        if(reminderList){
            res.send(reminderList)
        }
    })
})
app.post("/addReminder",(req,res) => {
    const { reminderMsg, remindAt } = req.body
    const reminder = new Reminder({
    reminderMsg,
    remindAt,
    isReminded: false
    })
    reminder.save(err => {
        if(err){
            console.log(err)
        }
        Reminder.find({},(err,reminderList) => {
            if(err){
                console.log(err)
            }
            if(reminderList){
                res.send(reminderList)
            }
        })
    })

})
app.post("/deleteReminder",(req,res) => {
    Reminder.deleteOne({_id: req.body.id},() => {
        Reminder.find({},(err,reminderList) => {
            if(err){
                console.log(err)
            }
            if(reminderList){
                res.send(reminderList)
            }
        })
    })
})

app.listen(9000, () => console.log("Be started"))