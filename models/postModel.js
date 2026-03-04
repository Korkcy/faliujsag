const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Egy posztnak kell legyen címe!'],
        trim: true,
        minLength: [10, 'A cím legalább 10 karakter kell hogy legyen!'],
        maxLength: [100, 'A cím nem lehet több 100 karakternél!']
    },
    description: {
        type: String,
        required: [true, 'Egy posztnak kell hogy legyen leírása!'],
        trim: true
    },
    ratingsAverage: {
        type: Number,
        default: null,
        min: [1, 'Az értékelés nem lehet kevesebb 1-nél!'],
        max: [10, 'Az értékelés nem lehet nagyobb 10-nél!'],
        set: val => Math.round(val *10)/10
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    answersCount: {
        type: Number,
        default: 0
    },
    viewsCount: {
        type: Number,
        default: 0
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Egy posztnak kell hogy legyen szerzője!']
    }
},
{
    timestamps: true  //Automatikusan hozzáadja a createdAt és updatedAt mezőket
}
);

const Post = mongoose.model('Post', postSchema);

module.exports = Post;