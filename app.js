require("dotenv").config();

const express = require("express");
const app = express();
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const flash = require("connect-flash");
const helmet = require("helmet");
const favicon = require('serve-favicon');
const {google} = require('googleapis');
 
const ndhucourseRoutes = require('./routes/ndhucourse');

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use(favicon(__dirname + '/public/images/favicon.ico'));

google.options({
	http2: true,
});

// helmet
const fontSrc = ["https://fonts.googleapis.com", "https://fonts.gstatic.com"];
const styleSrc = ["https://fonts.googleapis.com"];

app.use(helmet());
app.use(
	helmet.contentSecurityPolicy({
		directives: {
			defaultSrc: [],
			connectSrc: ["'self'"],
			scriptSrc: ["'unsafe-inline'", "'unsafe-hashes'", "'self'"],
			styleSrc: ["'self'", "'unsafe-inline'", ...styleSrc],
			workerSrc: ["'self'"],
			objectSrc: [],
			imgSrc: ["'self'"],
			fontSrc: ["'self'", ...fontSrc],
		},
	})
);

// session and redis
const secret = process.env.SECRET;
const session = require("express-session");
const Redis = require("ioredis");
let RedisStore = require("connect-redis")(session);
let redisClient = new Redis({ password: process.env.REDIS_PWD});
redisClient.on('connect', ()=>{
	console.log('connecting with redis')
})
redisClient.on('error', ()=>{
	console.log('connection error')
})

app.set('trust proxy',1);
app.use(
	session({
		name: "session",
		secret,
		resave: false,
		saveUninitialized: true,
		proxy: true,
		store: new RedisStore({ client: redisClient }),
		cookie: {
			httpOnly: true,
			secure: true,
			expires: Date.now() + 1000 * 60 * 10,
			maxAge: 1000 * 60 * 10,
		},
	})
);
app.use(flash());
app.use(function (req, res, next) {
	if (!req.session) return next(new Error("oh no")); // handle error
	next(); // otherwise continue
});

app.get('/', (req, res)=>{
	res.render('home', {title:'woodfire'});
});

app.get('/privacypolicy', (req, res, next)=>{
	res.render('privacypolicy', {title:'Privacy Policy'})
})

app.use('/ndhucourse', ndhucourseRoutes);

app.use((req, res, next) => {
	res.status(404).render("notfound", {title:'not found'});
});

app.use((err, req, res, next) => {
	console.log("**********ERROR**********");
	console.log(err);
	res.status(500).render("error", {title:'error'});
});

const port = process.env.PORT;

app.listen(port, () => {
	console.log(`listening on port ${port}`);
});
