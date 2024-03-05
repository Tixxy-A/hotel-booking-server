const mongoose= require('mongoose');


const booingSchema= new mongoose.Schema({
    place:{type:mongoose.Schema.Types.ObjectId,ref:'Place'},
    user:{type:mongoose.Schema.Types.ObjectId,required:true},
    checkIn:{type:Date,required:true},
    checkOut:{type:Date,required:true},
    numberOfGuests:{type:Number,required:true},
    price:{type:Number,required:true},
    name:{type:String,required:true},
    phone:{type:String,required:true},
})

module.exports=mongoose.model('Booking',booingSchema);