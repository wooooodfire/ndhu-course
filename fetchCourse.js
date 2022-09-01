const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

const fecthCourse = async (result, studentID, password) => {
	const browser = await puppeteer.launch({
		args: ["--disable-setuid-sandbox"],
		// executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
		headless: true,
	});
	const page = await browser.newPage();
	page.on("dialog", async (dialog) => {
		await dialog.accept();
	});
	try {
		await page.goto(
			"https://sys.ndhu.edu.tw/aa/class/subjselect/Default.aspx?lang=tw",
			{ timeout: 13000 }
		);
		await page.type("#ContentPlaceHolder1_ed_StudNo", studentID);
		await page.type("#ContentPlaceHolder1_ed_pass", password);
		await Promise.all([
			page.click("#ContentPlaceHolder1_BtnLogin"),
			page.waitForNavigation(),
		]);
	} catch (e) {
		console.log(e);
		return;
	}

	const body = await page.content();
	const $ = await cheerio.load(body);
	const tableTr = $("#ContentPlaceHolder1_grd_selects tr");

	for (let i = 1; i < tableTr.length; i++) {
		// 走訪 tr
		const tableTd = tableTr.eq(i).find("td");
		const course = tableTd.eq(2).text();
		const teacher = tableTd.eq(4).text();
		const time = tableTd.eq(5).text();
		const location = tableTd
			.eq(6)
			.text()
			.substring(tableTd.eq(6).text().indexOf("/") + 1);

		// 建立物件並(push)存入結果
		result.push(Object.assign({ course, time, teacher, location }));
	}
	await browser.close();
};

module.exports = fecthCourse;
