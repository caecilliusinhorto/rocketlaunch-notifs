const fetch = require('isomorphic-unfetch');
fs = require('fs')
const { app_key, app_secret, target_type } = require('./config.json')
//config.json:
/*
{
    "app_key": "pushed app key",
    "app_secret": "pushed app secret",
    "target_type": "app"
} 
*/
const axios = require('axios')
const cron = require('node-cron')

// determine timezone
let date1 = new Date()
let utc_offset
if (date1.getTimezoneOffset() < 0) {
    utc_offset = (date1.getTimezoneOffset() * -1)/60
    console.log(`Timezone: UTC+${utc_offset}`)
} else {
    utc_offset = date1.getTimezoneOffset() / 60
}

function check_launches() {
    try {
        //Read previous data
        let date = new Date();
        console.log(`${date.getHours()} : Checking for new launches...`)
        fs.readFile('previous.json', 'utf8', function (err, data) {
            if (err) {
                console.error("Please make sure you have run `npm run setup`.")
            }
            const [previous] = Array(JSON.parse(data))
            const [oldResult] = previous.result
            const oldId = oldResult.id
            const oldUpdate = oldResult.modified
            fetch("https://fdo.rocketlaunch.live/json/launches/next/1", { method: "Get" })
                .then(res => res.json())
                .then((response => {
                    const [list] = Array(response)
                    const [mission] = list.result
                    //If there is a new launch, update previous.json and send a notification
                    if (mission.id != oldId ) {
                        console.log(`${date.getHours()} New launch found: ${mission.name}`)
                        fs.writeFileSync("previous.json", JSON.stringify(response), 'utf8');
                        let message = `Next launch: ${mission.launch_description}`
                        let payload = {
                            "app_key": app_key,
                            "app_secret": app_secret,
                            "target_type": target_type,
                            "content": message
                        }
                        console.log(`${date.getHours()} : Notification sent: ${payload.content}`)
                        axios.post("https://api.pushed.co/1/push", data = payload)
                    } //if the launch info has been modified, update previous.json send a notification. 
                    else if (mission.modified != oldUpdate) { 
                        console.log(`${date.getHours()} Launch date updated: ${mission.name}`)
                        fs.writeFileSync("previous.json", JSON.stringify(response), 'utf8');
                        let message = `Launch info modified: ${mission.launch_description}`
                        let payload = {
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
}

function launchtime() {
    try {
        let date = new Date();
        fs.readFile('previous.json', 'utf8', function (err, data) {
            if (err) {
                console.error("Please make sure you have run `npm run setup`.")
            }
            console.log(`${date.getHours()} : Checking launch time...`)
            const [previous] = Array(JSON.parse(data))
            const [oldResult] = previous.result
            let time = oldResult.win_open
            let hourUTC = time.slice(11, -4)
            let hourLocal = parseInt(hourUTC) + utc_offset
            let day = time.slice(8, -7)
            let currentHour = date.getHours()
            let currentDay = date.getDate()
            // sends a notification if the rocket launches in less than one hour
            if (currentHour == hourLocal && currentDay == day) {
                console.log(`${date.getHours()} : Launching soon. (at ${hourLocal})`)
                let payload = {
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
}

cron.schedule('0 0,8,16 * * *', () => {
    check_launches() //checks for new launches every 8 hours
});

cron.schedule('0 * * * *', () => {
    launchtime()//checks for launch time at every hour
})

console.log("Started checking for launches.")