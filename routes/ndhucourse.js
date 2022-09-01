const express = require('express');
const router = express.Router();
const { google } = require("googleapis");

const fetchCourse = require("../fetchCourse");
const createEvents = require("../createEvents");

const isData = (req, res, next) => {
	if (
		req.session.allCourse &&
		req.session.calendarID &&
		req.session.dateStart &&
		req.session.dateEnd
	)
		next();
	else return next(new Error("Losing Data"));
};

router.get("/", (req, res) => {
	res.render("ndhucourse/home", { messages: req.flash("failed"), title:'課表轉換器' });
});

router.post("/", async (req, res) => {
	const { studentID, password, calendarID, dateStart, dateEnd } = req.body;

	if (new Date(dateStart) > new Date(dateEnd)) {
		req.flash("failed", "Error! 寒暑假開始日不得小於開學日");
		return res.redirect("/ndhucourse");
	}

	req.session.dateStart = dateStart;
	req.session.dateEnd = dateEnd;
	if (calendarID.length === 0) req.session.calendarID = "primary";
	else req.session.calendarID = calendarID;
	
	const result = [];
	await fetchCourse(result, studentID, password);

	if (result.length > 0) {
		req.session.allCourse = result;
		res.render("ndhucourse/show", { result: result, title:'課表轉換器'});
	} else {
		req.flash(
			"failed",
			"Error! 請檢查帳號密碼，或稍後再試。如無法使用可以幫忙回報，謝謝！"
		);
		res.redirect("/ndhucourse");
	}
});

router.get("/google", async (req, res) => {
	const YOUR_CLIENT_ID = process.env.YOUR_CLIENT_ID;
	const YOUR_CLIENT_SECRET = process.env.YOUR_CLIENT_SECRET;
	const YOUR_REDIRECT_URL = process.env.YOUR_REDIRECT_URL;

	const oauth2Client = new google.auth.OAuth2(
		YOUR_CLIENT_ID,
		YOUR_CLIENT_SECRET,
		YOUR_REDIRECT_URL
	);
	// generate a url that asks permissions for Blogger and Google Calendar scopes
	const scopes = ["https://www.googleapis.com/auth/calendar"];

	const url = oauth2Client.generateAuthUrl({
		// 'online' (default) or 'offline' (gets refresh_token)
		access_type: "offline",
		// If you only need one scope you can pass it as a string
		scope: scopes[0],
	});
	res.redirect(url);
});

router.get("/google/callback", isData, async (req, res, next) => {
	const code = req.query.code;

	const YOUR_CLIENT_ID = process.env.YOUR_CLIENT_ID;
	const YOUR_CLIENT_SECRET = process.env.YOUR_CLIENT_SECRET;
	const YOUR_REDIRECT_URL = process.env.YOUR_REDIRECT_URL;

	const oauth2Client = new google.auth.OAuth2(
		YOUR_CLIENT_ID,
		YOUR_CLIENT_SECRET,
		YOUR_REDIRECT_URL
	);
	const events = createEvents(
		req.session.allCourse,
		req.session.dateStart,
		req.session.dateEnd
	);
	const calendarID = req.session.calendarID;

	oauth2Client.getToken(code, async (err, token) => {
		if (err) return console.error("Error retrieving access token", err);
		oauth2Client.setCredentials(token);
		// Store the token to disk for later program executions
		await calendarPost(oauth2Client);
	});

	const calendarPost = async (auth) => {
		const calendar = google.calendar({ version: "v3", auth });
		const createCustomTimeout = (seconds) => {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					resolve();
				}, seconds * 1000);
			});
		};
		for (thisEvent of events) {
			calendar.events.insert(
				{
					auth: auth,
					calendarId: calendarID,
					resource: thisEvent,
				},
				function (err) {
					if (err) {
						console.log(
							`There was an error contacting the Calendar service: ${err}`
						);
					}
					console.log(`Event created`);
				}
			);
			await createCustomTimeout(0.5);
		}
	};

	req.session.destroy(() => {
		console.log("Session destroyed");
	});

	res.redirect("/ndhucourse/success");
});

router.get("/success", (req, res) => {
	res.render("ndhucourse/success", {title:'成功 - 課表轉換器'});
});

module.exports = router;