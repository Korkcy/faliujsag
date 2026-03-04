const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    text: {
        type: String,
        required: [true, "Egy válasznak kell hogy legyen tartalma"],
        trim: true,
        minlength: [2, "A válasz túl rövid"],
        maxlength: [2000, "A válasz túl hosszú (max 2000 karakter)"]
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: [true, "A válasznak tartoznia kell egy poszthoz"],
        index: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "A válasznak kell egy szerző"],
        index: true
    },
    likes: {
        type: Number,
        default: 0,
        min: 0
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Answer',
        default: null
    },
    isDeleted: {
        type: Boolean,
        default: false,
        select: false
    }
},
{
    timestamps: true,
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
}
);

answerSchema.virtual('isEdited').get(function () {
    return this.updatedAt.getTime() !== this.createdAt.getTime();
});

answerSchema.index({ post: 1, createdAt: -1}); 
//növekvő sorrendben indexeli a postot és csökkenőben a createdAt-et
//így egyszerűbb a sort-olás legújabbtól a legrégebbiig

const Answer = mongoose.model('Answer', answerSchema);

module.exports = Answer;