const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'A felhasználó meg kell adja az email címét'],
        lowercase: true,
        unique: true,
        validate: [validator.isEmail, 'A felhasználónak érvényes email cím kell']
    },
    username: {
        type: String,
        required: [true, 'A felhasználó meg kell adja a felhasználónevét'],
        trim: true,
        unique: true,
        maxlength: [50, 'Egy felhasználónév nem lehet hosszabb 50 karakternél']        
    },
    password: {
        type: String,
        required: [true, 'A felhasználó meg kell adja a jelszavát'],
        minLength: [8, 'A jelszó legalább 8 karakter hosszú kell hogy legyen'],
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Jelszó megerősítés kötelező'],
        validate: {
            validator: function (el) {
                return el === this.password;
            },
            message: 'A két jelszó nem egyezik'
        }
    },
    role: {
        type: String,
        required: [true, 'A felhasználónak kell hogy legyen jogosultsága'],
        enum: ['user', 'admin'],
        default: 'user'
    },
    profilePicture: {
        type: String,
        default: null
    },
    school: {
        type: String
    }
},
{
    timestamps: true
}
);

userSchema.pre('save', async function (){
    if (!this.isModified('password')) return; //Ha már hashelve van tovább

    this.password = await bcrypt.hash(this.password, 12); //12 salt rounds (biztonság/sebesség egyensúly)
    this.passwordConfirm = undefined; //csak validálásohoz kellett
});

//Login controllerbe ellenőrző metódus:
/*
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword)
}
*/

const User = mongoose.model('User', userSchema)

module.exports = User;