const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./models/User");
const Post = require("./models/Post");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const fs = require("fs");

const salt = bcrypt.genSaltSync(10);
const secret = process.env.SECRET;

//middlewares
app.use(
    cors({
        credentials: true,
        origin: [
            "https://bejewelled-speculoos-273f33.netlify.app",
            "http://localhost:3000",
            "https://my-blog-ram.vercel.app",
        ],

        methods: ["GET", "POST", "PUT", "DELETE"],
    })
);
app.use(express.json());
app.use(cookieParser());
const uploadMiddleware = multer({ dest: "./uploads" });
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Internal Server Error" });
});

//connect to database
mongoose
    .connect(process.env.CONNECT)
    .then(() => {
        console.log("Database connected");
    })
    .catch((error) => {
        console.error("Error connecting to the database:", error);
    });

//requests
app.post("/register", async (req, res) => {
    const { username, password } = req.body;

    try {
        // check if username is already taken
        const user = await User.findOne({ username });
        if (user) {
            return res
                .status(409)
                .json({ error: "Username is already taken." });
        } else {
            // create new user
            const userDoc = await User.create({
                username,
                password: bcrypt.hashSync(password, salt),
            });
            res.json(userDoc);
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const userDoc = await User.findOne({ username });

        if (!userDoc) {
            return res.status(401).json({ err: "User not Registered" });
        }

        const passOk = bcrypt.compareSync(password, userDoc.password);

        if (passOk) {
            jwt.sign(
                { username, id: userDoc._id },
                secret,
                {},
                (err, token) => {
                    if (err) {
                        return res
                            .status(500)
                            .json({ err: "Token generation failed" });
                    }
                    res.cookie("token", token, { httpOnly: true }).json({
                        id: userDoc._id,
                        username,
                    });
                }
            );
        } else {
            res.status(401).json({ err: "Wrong Password!" });
        }
    } catch (err) {
        res.status(500).json({ err: "Internal Server Error" });
    }
});

app.get("/profile", (req, res) => {
    const { token } = req.cookies;
    if (!token) {
        return res
            .status(401)
            .json({ error: "Unauthorized - JWT must be provided" });
    }
    jwt.verify(token, secret, {}, (err, info) => {
        if (err) throw err;
        res.json(info);
    });
});

app.post("/logout", (req, res) => {
    res.cookie("token", "").json("ok");
});

app.post("/post", uploadMiddleware.single("file"), async (req, res) => {
    const { originalname, path } = req.file;
    const parts = originalname.split(".");
    const ext = parts[parts.length - 1];
    const newPath = path + "." + ext;
    fs.renameSync(path, newPath);

    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) => {
        if (err) throw err;
        const { title, summary, content } = req.body;
        const postDoc = await Post.create({
            title,
            summary,
            content,
            cover: newPath,
            author: info.id,
        });
        res.json(postDoc);
    });
});

app.put("/post", uploadMiddleware.single("file"), (req, res) => {
    let newPath = null;
    if (req.file) {
        const { originalname, path } = req.file;
        const parts = originalname.split(".");
        const ext = parts[parts.length - 1];
        newPath = path + "." + ext;
        fs.renameSync(path, newPath);
    }

    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) => {
        if (err) throw err;
        const { id, title, summary, content } = req.body;
        const postDoc = await Post.findById(id);
        const isAuthor =
            JSON.stringify(postDoc.author) === JSON.stringify(info.id);
        if (!isAuthor) {
            return res.status(400).json("you are not the author");
        }
        await postDoc.updateOne({
            title,
            summary,
            content,
            cover: newPath ? newPath : postDoc.cover,
        });
        res.json(postDoc);
    });
});

app.get("/post", async (req, res) => {
    res.json(
        await Post.find()
            .populate("author", ["username"])
            .sort({ createdAt: -1 })
            .limit(20)
    );
});

app.get("/post/:id", async (req, res) => {
    const { id } = req.params;
    const postDoc = await Post.findById(id).populate("author", ["username"]);
    res.json(postDoc);
});

app.get("/test", (req, res) => {
    const test = "test";
    res.json({ test });
});

//server running
const port = process.env.PORT;
app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});
