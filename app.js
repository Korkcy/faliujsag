const express = require('express');
const morgan = require('morgan');
const postRouter = require('./routes/postRoutes');
const authRouter = require('./routes/authRoutes');
const answerCrudRouter = require('./routes/answerCrudRoutes');
const globalErrorHandler = require('./middlewares/errorMiddleware');
const userRouter = require("./routes/userRoutes");

const app = express();

if(process.env.NODE_ENV === 'development'){app.use(morgan('dev'))};
app.use(express.json());
app.use(express.static(`${__dirname}/public/test`));

app.use((req,res,next) =>{
    console.log('Hello from the middleware 🤗');
    next();
});

app.use((req,res,next)=>{
    req.requestTime = new Date().toISOString();
    next();
});

app.use('/api/v1/posts', postRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/answers', answerCrudRouter);
app.use("/api/v1/users", userRouter);

app.use(globalErrorHandler);

module.exports = app;