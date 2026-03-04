const Post = require('../models/postModel');

exports.getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find()
        .sort({ createdAt: -1 })
        .populate('author', 'username school profilePicture role');

        res.status(200).json({
            status: 'success',
            results: posts.length,
            data: {
                posts
            }
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};

exports.getPost = async (req,res) => {
    try {
        const post = await Post.findById(req.params.id)
        .populate('author', 'username school profilePicture role');

        if(!post){
            return res.status(404).json({
                status: 'fail',
                message: 'Nincs ilyen poszt'
            })
        };

        res.status(200).json({
            status: 'success',
            data: {
                post
            }
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};

exports.createPost = async (req, res) => {
    try {
        req.body.author = req.user._id;

        const post = await Post.create(req.body);

        res.status(201).json({
            status: 'success',
            data: {
                post: post
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.updatePost = async (req, res) => {
    try {
        req.post.set(req.body); //req.body mezőit ráírja a dokumentumra
        await req.post.save(); //validációk lefutnak, pre-save hook-ok lefutnak, ment

        res.status(200).json({
            status: 'success',
            data: {
                post: req.post
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.deletePost = async (req, res) => {
    try {
        await req.post.deleteOne();

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}