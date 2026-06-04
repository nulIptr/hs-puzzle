# Test the constructed cards API
$headers = @{
  "accept" = "application/json, text/javascript, */*; q=0.01"
  "accept-language" = "zh-CN,zh;q=0.9,en;q=0.8"
  "content-type" = "application/json"
  "priority" = "u=1, i"
  "referer" = "https://hs.blizzard.cn/"
  "sec-ch-ua" = '"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"'
  "sec-ch-ua-mobile" = "?0"
  "sec-ch-ua-platform" = '"Windows"'
  "sec-fetch-dest" = "empty"
  "sec-fetch-mode" = "cors"
  "sec-fetch-site" = "same-site"
  "user-agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36"
}

$body = '{"page":1,"page_size":200,"class":"all","mana_cost":[],"sort":"manaCost:asc","set":"standard","text_filter":"","attack":-1,"faction":"","health":-1,"keyword":"","minion_type":"","rarity":"","spell_school":"","type":""}'

try {
  $response = Invoke-RestMethod -Uri "https://webapi.blizzard.cn/hs-cards-api-server/api/web/cards/constructed" -Method Post -Headers $headers -Body $body -ContentType "application/json"
  $response | ConvertTo-Json -Depth 10 | Out-File -FilePath "test_response.json" -Encoding utf8
  Write-Host "Success!"
  Write-Host "Keys: $($response.PSObject.Properties.Name -join ', ')"
} catch {
  Write-Host "Error: $_"
}
