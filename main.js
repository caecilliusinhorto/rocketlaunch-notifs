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

function check_launches() {
    //Read previous data
    fs.readFile('previous.json', 'utf8', function (err, data) {
        if (err) {
            console.error("Please make sure you have run `npm run setup`.")
        }
        const [previous] = Array(JSON.parse(data))
        const [oldResult] = previous.result
        const oldId = oldResult.id
        fetch("https://fdo.rocketlaunch.live/json/launches/next/1", { method: "Get" })
            .then(res => res.json())
            .then((response => {
                const [list] = Array(response)
                const [mission] = list.result
                    //If there is a new launch, update previous.json and send a notification
                    if (mission.id != oldId) {
                        fs.writeFileSync("previous.json", JSON.stringify(response), 'utf8');
                        let message = mission.launch_description
                        let payload = {
                            "app_key": app_key,
                            "app_secret": app_secret,
                            "target_type": target_type,
                            "content": message
                        }
                        axios.post("https://api.pushed.co/1/push", data = payload)
                    } 
            })
            )
    });
}

cron.schedule('0 7,4 * * *', () => {
    check_launches() //checks for new launches every hour
});
