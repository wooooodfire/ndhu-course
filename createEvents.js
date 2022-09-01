const createEvents = (allCourse, dateStart, dateEnd) => {
	const events = [];

	// 處理起始日期（禮拜一幾號、禮拜二幾號）
	// startWeekday = {'0': '2022-09-04', '1': '2022-09-05', ... , '6': '2022-09-03'}
	let firstDate = new Date(dateStart);
	let startWeekday = new Object();
	
	for(let i = 0; i < 7; i++){
		startWeekday[firstDate.getDay()]= firstDate.toISOString().slice(0,10);
		firstDate.setDate(firstDate.getDate() + 1);
	}

	// 建立event
	for (let i = 0; i < allCourse.length; i++) {
		let courseTime = allCourse[i].time.split('/');
		// 分割課程時間 ['', '四9', '四10', '四11', '五12']

		let weekdayCount = []; // 儲存星期+count [{week:'四', count:3}, {week:'五', count:1}]
		let count = 1;
		for (let j = 1; j < courseTime.length; j++) {
			if (
				j + 1 < courseTime.length && // 連堂
				courseTime[j].substring(0, 1) === courseTime[j + 1].substring(0, 1) &&
				parseInt(courseTime[j].slice(1)) + 1 === parseInt(courseTime[j + 1].slice(1))
			) {
				count += 1;
				continue;
			}
			let week = courseTime[j].substring(0, 1);
			weekdayCount.push(Object.assign({ week, count }));
			count = 1;
		}

		for (let j = 0; j < weekdayCount.length; j++) {
            //換算開始的時間(節數+5)
			let myNumber = parseInt(courseTime[count].slice(1)) + 5;
			let courseTimeStart = ('0' + myNumber).slice(-2); //變成兩位數 e.g. 01, 03
            
			count += weekdayCount[j].count - 1;

            //換算結束的時間(節數+6)
			myNumber = parseInt(courseTime[count].slice(1)) + 6;
			let courseTimeEnd = ('0' + myNumber).slice(-2);
			count += 1;

			let eventStart = '2022-09-12';

			if (weekdayCount[j].week === "一") {
				eventStart = startWeekday['1'];
			} else if (weekdayCount[j].week === "二") {
				eventStart = startWeekday['2'];
			} else if (weekdayCount[j].week === "三") {
				eventStart = startWeekday['3'];
			} else if (weekdayCount[j].week === "四") {
				eventStart = startWeekday['4'];
			} else if (weekdayCount[j].week === "五") {
				eventStart = startWeekday['5'];
			} else if (weekdayCount[j].week === "六") {
				eventStart = startWeekday['6'];
			} else if (weekdayCount[j].week === "日") {
				eventStart = startWeekday['0'];
			}

			let endWeekly = dateEnd.replaceAll('-', '') + 'T000000Z';

			let event = {
				summary: allCourse[i].course,
				location: allCourse[i].location.substring(allCourse[i].location.indexOf('/') + 1),
				description: `老師${allCourse[i].teacher}`,
				start: {
					dateTime: `${eventStart}T${courseTimeStart}:00:00+08:00`,
					timeZone: 'Etc/GMT+8',
				},
				end: {
					dateTime: `${eventStart}T${courseTimeEnd}:00:00+08:00`,
					timeZone: 'Etc/GMT+8',
				},
				recurrence: [`RRULE:FREQ=WEEKLY;UNTIL=${endWeekly}`],
				reminders: {
					useDefault: false,
					overrides: [{ method: 'popup', minutes: 10 }],
				},
			};
			events.push(event);
		}
	}
    return events;
};

module.exports = createEvents;