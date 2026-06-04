# Fetch all Hearthstone card data and metadata

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

# Function to fetch data with retries
function Fetch-Data {
  param($Url, $Body = $null, $Method = "Get")
  $retryCount = 0
  $maxRetries = 3
  
  while ($retryCount -lt $maxRetries) {
    try {
      if ($Body) {
        $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers -Body $Body -ContentType "application/json"
      } else {
        $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers
      }
      return $response
    } catch {
      $retryCount++
      if ($retryCount -eq $maxRetries) {
        throw $_
      }
      Write-Host "Retrying... ($retryCount/$maxRetries)"
      Start-Sleep -Seconds 2
    }
  }
}

Write-Host "Fetching metadata..."

# Fetch metadata
$filterData = Fetch-Data -Url "https://webapi.blizzard.cn/hs-cards-api-server/api/web/cards/constructed/filter"
$setData = Fetch-Data -Url "https://webapi.blizzard.cn/hs-cards-api-server/api/web/cards/constructed/set"
$classData = Fetch-Data -Url "https://webapi.blizzard.cn/hs-cards-api-server/api/web/cards/constructed/class"

Write-Host "Fetching all cards..."

# Collect all cards
$allCards = @()

# Try fetching with set="all" first
Write-Host "Trying set='all'..."
$page = 1
$pageSize = 200
do {
  $body = @{
    page = $page
    page_size = $pageSize
    class = "all"
    mana_cost = @()
    sort = "manaCost:asc"
    set = "all"
    text_filter = ""
    attack = -1
    faction = ""
    health = -1
    keyword = ""
    minion_type = ""
    rarity = ""
    spell_school = ""
    type = ""
  } | ConvertTo-Json -Depth 10
  
  $response = Fetch-Data -Url "https://webapi.blizzard.cn/hs-cards-api-server/api/web/cards/constructed" -Body $body -Method "Post"
  
  if ($response.code -eq 0 -and $response.data.list) {
    $allCards += $response.data.list
    Write-Host "Page ${page}: $($response.data.list.Count) cards (Total: $($allCards.Count))"
    if ($response.data.list.Count -lt $pageSize) {
      break
    }
  } else {
    Write-Host "No more cards or error"
    break
  }
  
  $page++
} while ($true)

# If that didn't get enough, try iterating through all sets
if ($allCards.Count -lt 100) {
  Write-Host "Trying all sets individually..."
  $allSets = @()
  foreach ($category in $setData.data.list) {
    foreach ($subcategory in $category.subcategories) {
      $allSets += $subcategory
    }
  }
  
  foreach ($set in $allSets) {
    Write-Host "Processing set: $($set.name) ($($set.id))"
    $page = 1
    do {
      $body = @{
        page = $page
        page_size = $pageSize
        class = "all"
        mana_cost = @()
        sort = "manaCost:asc"
        set = $set.id.ToString()
        text_filter = ""
        attack = -1
        faction = ""
        health = -1
        keyword = ""
        minion_type = ""
        rarity = ""
        spell_school = ""
        type = ""
      } | ConvertTo-Json -Depth 10
      
      $response = Fetch-Data -Url "https://webapi.blizzard.cn/hs-cards-api-server/api/web/cards/constructed" -Body $body -Method "Post"
      
      if ($response.code -eq 0 -and $response.data.list) {
        $allCards += $response.data.list
        Write-Host "  Page ${page}: $($response.data.list.Count) cards (Total: $($allCards.Count))"
        if ($response.data.list.Count -lt $pageSize) {
          break
        }
      } else {
        break
      }
      
      $page++
    } while ($true)
  }
}

# Remove duplicate cards by id
Write-Host "Removing duplicates..."
$uniqueCards = $allCards | Sort-Object -Property id -Unique

Write-Host "Total unique cards: $($uniqueCards.Count)"

# Prepare final data
$finalData = @{
  metadata = @{
    filter = $filterData.data
    set = $setData.data
    class = $classData.data
  }
  cards = $uniqueCards
  lastUpdated = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
}

# Save to files
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$finalData | ConvertTo-Json -Depth 20 | Out-File -FilePath "c:\open\hs-puzzle\hs_cards_complete.json" -Encoding utf8
Write-Host "Data saved to hs_cards_complete.json"

# Also save metadata separately
$finalData.metadata | ConvertTo-Json -Depth 20 | Out-File -FilePath "c:\open\hs-puzzle\hs_metadata.json" -Encoding utf8
Write-Host "Metadata saved to hs_metadata.json"

Write-Host "Done!"
