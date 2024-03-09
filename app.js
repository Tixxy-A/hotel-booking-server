const express = require('express')
const cors = require('cors')
const bodyparser = require('body-parser');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cookieparser = require('cookie-parser');
const User = require('./model/User');
const Place = require('./model/Place');
const Booking=require('./model/Booking');
const imageDownloader = require('image-downloader')
const multer = require('multer');
const fs = require('fs');
require('dotenv').config()

const app = express()
app.use(express.json());
app.use(cookieparser());
app.use('/uploads', express.static(__dirname + '/uploads'));


app.use(cors({
    credentials: true,
    
}))
mongoose.connect(process.env.MONGOURL);


app.post('https://airbnc-ff6p.onrender.com/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await User.create({ name: name, email: email, password: hashedPassword });
        res.json(user);
    } catch (e) {
        res.status(422).json({ message: 'cannot register user' });
    }

})
app.post('https://airbnc-ff6p.onrender.com/login', async (req, res) => {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email: email });
    //console.log(existingUser);
    if (existingUser) {
        const isMatch = await bcrypt.compare(password, existingUser.password);

        if (isMatch) {
            const token = jwt.sign({ email: existingUser.email, id: existingUser._id, name: existingUser.name }, process.env.JWTSECRET);
            res.cookie('token', token).json(existingUser);
        }
        else {
            res.status(401).json({ message: 'invalid password' });
        }
    } else {
        res.status(401).json({ message: 'invalid email' })
    }

});

app.post('https://airbnc-ff6p.onrender.com/logout', (req, res) => {
    res.cookie('token', '').json(true);
})

app.get('/profile', async (req, res) => {
    const { token } = req.cookies;
    if (token) {
        jwt.verify(token, process.env.JWTSECRET, {}, (err, user) => {
            if (err) {
                res.status(401).json({ message: 'invalid token' })
            }
            res.json(user);
        });

    }
    else {

        res.json(false);
    }
});

app.post('https://airbnc-ff6p.onrender.com/add-by-link', async (req, res) => {
    const { link } = req.body;
    // console.log(link);
    const newName = 'photo' + Date.now() + '.jpg';
    try {
        const rep = await imageDownloader.image({
            url: link,
            dest: __dirname + '/uploads/' + newName,
        })
    } catch (err) {
        console.log(err);
    }
    res.json(newName);
})

const photosMiddleware = multer({ dest: 'uploads/' });
app.post('https://airbnc-ff6p.onrender.com/upload', photosMiddleware.array('photos', 100), async (req, res) => {
    const uploadedFiles = [];
    for (let i = 0; i < req.files.length; i++) {
        console.log(req.files[i]);
        const { path, originalname } = req.files[i];
        const extt = originalname.split('.');
        const ext = extt[extt.length - 1];
        const newPath = path + '.' + ext;
        fs.renameSync(path, newPath);
        const arr = newPath.substring(8);
        // console.log(arr);
        uploadedFiles.push(arr);
    } 
    res.json(uploadedFiles);
})


app.get('https://airbnc-ff6p.onrender.comhttps://airbnc-ff6p.onrender.com/places',async(req,res)=>{
    const allplace=await Place.find({});
    res.json(allplace);
})


app.post('https://airbnc-ff6p.onrender.com/places', async(req, res) => {
    const { token } = req.cookies;
    if (token) {
        jwt.verify(token, process.env.JWTSECRET, {}, (err, user) => {
            if (err) {
                res.status(401).json({ message: 'invalid token' })
            }
            else {
                try {
                    const { title, address, perks, 
                        addedphotos, checkin, checkout, 
                        maxguest, extrainfo, description ,price } = req.body;
                    const newPlace = Place.create({ title, description,
                         owner: user.id, perks, 
                         photos: addedphotos, checkIn: checkin,
                          checkOut: checkout, maxguest, extrainfo, price }).then(resp=>{
                              res.json(resp);
                          })
                }catch(e){
                    console.log(e);
                }
                
            }
        })
    }
    else {
        res.status(401).json({ message: 'invalid token' })
    }
})

app.get('https://airbnc-ff6p.onrender.com/user-places',(req,res)=>{
    const {token}=req.cookies;
    jwt.verify(token,process.env.JWTSECRET,{},async (err,data)=>{
        if(err){
            res.status(401).json({message:'invalid token'});
        }
        else{
            await Place.find({owner:data.id}).then(resp=>{
                res.json(resp);
            })
        }
    })
})

app.get('https://airbnc-ff6p.onrender.com/places/:id',async(req,res)=>{

    const {id}=req.params;
    const placdoc=await Place.findById(id);
    res.json(placdoc);
})

app.put('https://airbnc-ff6p.onrender.com/places/:id',async(req,res)=>{
    const {id}=req.params;
    const {token}=req.cookies;
    const {title,address,addedphotos,description,
        perks,extrainfo, checkIn: checkin,
         checkOut: checkout, maxguest} =req.body;
    jwt.verify(token,process.env.JWTSECRET,{},async (err,data)=>{
        if(err){
            res.status(401).json({message:'invalid token'});
        }
        else{
            await Place.findByIdAndUpdate(id,{title,address,description,
                perks,extrainfo,photos:addedphotos,checkIn:checkin,
                checkOut:checkout,maxguest}).then(resp=>{
                    res.json(resp);
                })
        }
    })
})

app.get('https://airbnc-ff6p.onrender.com/booking',async (req, res)=>{
    const {token}=req.cookies;
    jwt.verify(token,process.env.JWTSECRET,{},async (err,data)=>{
        if(err){
            res.status(401).json({message:'invalid token'});
        }
        else{
            const bookings=await Booking.find({user:data.id}).populate('place');
                res.json(bookings);
            
        }
    })
})

app.post('https://airbnc-ff6p.onrender.com/booking',async(req,res)=>{
    const {checkIn,checkOut,numberOfGuest,name,mobile,price,place}=req.body;
    const {token}=req.cookies;
    jwt.verify(token,process.env.JWTSECRET,{},async (err,data)=>{
        if(err){
            res.status(401).json({message:'invalid token'});
        }
        else{
            const booked=await Booking.create({
                place,
                user:data.id,
                checkIn,
                checkOut,
                numberOfGuests:numberOfGuest,
                name,
                phone:mobile,
                price,

            })
            res.json(booked);
        }
    })
    
       
    
})

app.listen(3001, () => {
    console.log('running on port 3001')
})
