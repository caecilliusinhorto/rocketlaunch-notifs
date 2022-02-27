const fetch = require('isomorphic-unfetch');
fs = require('fs')
const axios = require('axios')
const { phoneNumber, apiKey} = require('./config.json')
/* config.json:
{
    "apiKey":"CallMeBot signal API key",
    "phoneNumber":"phone number to sent notifications to "
} 
*/

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
                        //fs.writeFileSync("previous.json", JSON.stringify(response), 'utf8');
                        const message = mission.launch_description
                        const encodedMessage = encodeURIComponent(message.slice(0, -1))
                        console.log(encodedMessage)
                        //TODO: fix this
                        //axios.get(`https://api.callmebot.com/signal/send.php?phone=${phoneNumber}&apikey=${apiKey}&text=${encodedMessage}`)
                    } 
            })
            )
    });
}

check_launches()