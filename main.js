const fetch = require('isomorphic-unfetch');
fs = require('fs')
const { app_key, app_secret, target_type, check_freq } = require('./config.json')
//config.json:
/*
{
    "app_key": "pushed app key",
    "app_secret": "pushed app secret",
    "target_type": "app",
    "check_freq" : "cron times for checking for new launches"
} 
*/
const axios = require('axios')
const cron = require('node-cron')

// determine timezone
const utc_offset = ((new Date().getTimezoneOffset()) * -1) / 60 
console.log(`Timezone: UTC+${utc_offset}`)
// note that notifications are sent relative to local time on the server, the utc offset is used because rocketlaunch returns launch time in utc

cron.schedule("* * * * *", () => { //checks for new launches
	try {
		//Read previous data
		const date = new Date();
		console.log(`${date.getHours()} : Checking for new launches...`)
		fs.readFile('previous.json', 'utf8', function (err, data) {
			if (err) {
				console.error("No previous launch data found!")
			}
			const [previous] = Array(JSON.parse(data))
			const [oldResult] = previous.result
			fetch("https://fdo.rocketlaunch.live/json/launches/next/1", { method: "Get" })
				.then(res => res.json())
				.then((response => {
					const [list] = Array(response)
					const [mission] = list.result
					//If there is a new launch, update previous.json and send a notification
					if (mission.id != oldResult.id) {
						console.log(`${date.getHours()} New launch found: ${mission.name}`)
						fs.writeFileSync("previous.json", JSON.stringify(response), 'utf8');
						const message = `Next launch: ${mission.launch_description}`
						const payload = {
							"app_key": app_key,
							"app_secret": app_secret,
							"target_type": target_type,
							"content": message
						}
						console.log(`${date.getHours()} : Notification sent: ${payload.content}`)
						axios.post("https://api.pushed.co/1/push", data = payload)
					} //if the launch info has been modified, update previous.json send a notification. 
					else if (mission.modified != oldResult.modified) {
						console.log(`${date.getHours()} Launch date updated: ${mission.name}`)
						fs.writeFileSync("previous.json", JSON.stringify(response), 'utf8');
						const message = `Launch info modified: ${mission.launch_description}`
						const payload = {
							"app_key": app_key,
							"app_secret": app_secret,
							"target_type": target_type,
							"content": message
						}
						console.log(`${date.getHours()} : Notification sent: ${payload.content}`)
						axios.post("https://api.pushed.co/1/push", data = payload)
					}
				})
				)
		});
	} catch (err) {
		console.log(`${date.getHours()} : Error while getting data: ${err.message}`)
	}
});

cron.schedule('0 * * * *', () => { //checks every hour if a launch is about to happen
	try {
		const date = new Date();
		fs.readFile('previous.json', 'utf8', function (err, data) {
			if (err) {
				console.error("No previous launch data found!")
			}
			console.log(`${date.getHours()} : Checking launch time...`)
			const [previous] = Array(JSON.parse(data))
			const [oldResult] = previous.result
			const time = oldResult.win_open
			// sends a notification if the rocket launches in less than one hour
			if (date.getHours() == (parseInt(time.slice(11, -4)) + utc_offset) && date.getDate() == time.slice(8, -7)) {
				console.log(`${date.getHours()} : Launching soon. (at ${hourLocal})`)
				const payload = {
					"app_key": app_key,
					"app_secret": app_secret,
					"target_type": target_type,
					"content": `Launching soon: ${oldResult.provider.name} ${oldResult.vehicle.name} in around ${oldResult.win_open.slice(14, -1)} mins from ${oldResult.pad.location.name}`
				}
				console.log(`${date.getHours()} : Notification sent: ${payload.content}`)
				axios.post("https://api.pushed.co/1/push", data = payload)
			}
		})
	} catch (err) {
		console.log(`${date.getHours()} : Error while getting data: ${err.message}`)
	}
})

console.log("Started checking for launches.")
