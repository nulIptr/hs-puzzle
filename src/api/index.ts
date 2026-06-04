function getConstructedCards() {
  return fetch("https://webapi.blizzard.cn/hs-cards-api-server/api/web/cards/constructed", {
  "headers": {
    "accept": "application/json, text/javascript, */*; q=0.01",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
    "content-type": "application/json",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Chromium\";v=\"148\", \"Google Chrome\";v=\"148\", \"Not/A)Brand\";v=\"99\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site"
  },
  "referrer": "https://hs.blizzard.cn/",
  "body": "{\"page\":1,\"page_size\":200,\"class\":\"all\",\"mana_cost\":[],\"sort\":\"manaCost:asc\",\"set\":\"standard\",\"text_filter\":\"\",\"attack\":-1,\"faction\":\"\",\"health\":-1,\"keyword\":\"\",\"minion_type\":\"\",\"rarity\":\"\",\"spell_school\":\"\",\"type\":\"\"}",
  "method": "POST",
  "mode": "cors",
  "credentials": "omit"
});
}