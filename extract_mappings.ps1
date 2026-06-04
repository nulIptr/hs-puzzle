
# 提取元数据映射
$ErrorActionPreference = "Stop"

$data = Get-Content "c:\open\hs-puzzle\hs_cards_complete.json" -Raw | ConvertFrom-Json
$cards = $data.cards

# 筛选随从卡牌（card_type_id=4）
$minionCards = $cards | Where-Object { $_.card_type_id -eq 4 }
Write-Host "随从卡牌数量: $($minionCards.Count)"

# 提取职业映射
$classMap = @{}
foreach ($card in $minionCards) {
    if ($card.class_id -and -not $classMap.ContainsKey($card.class_id)) {
        $classMap[$card.class_id] = @{ id = $card.class_id; name = $null; count = 0 }
    }
    if ($card.class_id) {
        $classMap[$card.class_id].count++
    }
}

# 提取种族映射
$minionTypeMap = @{}
foreach ($card in $minionCards) {
    if ($card.minion_type_id -and $card.minion_type_id -ne 0 -and -not $minionTypeMap.ContainsKey($card.minion_type_id)) {
        $minionTypeMap[$card.minion_type_id] = @{ id = $card.minion_type_id; name = $null; count = 0 }
    }
    if ($card.minion_type_id -and $card.minion_type_id -ne 0) {
        $minionTypeMap[$card.minion_type_id].count++
    }
}

# 提取卡牌系列映射
$setMap = @{}
foreach ($card in $minionCards) {
    if ($card.card_set_id -and -not $setMap.ContainsKey($card.card_set_id)) {
        $setMap[$card.card_set_id] = @{ id = $card.card_set_id; name = $null; count = 0 }
    }
    if ($card.card_set_id) {
        $setMap[$card.card_set_id].count++
    }
}

# 提取稀有度映射
$rarityMap = @{}
foreach ($card in $minionCards) {
    if ($card.rarity_id -and -not $rarityMap.ContainsKey($card.rarity_id)) {
        $rarityMap[$card.rarity_id] = @{ id = $card.rarity_id; name = $null; count = 0 }
    }
    if ($card.rarity_id) {
        $rarityMap[$card.rarity_id].count++
    }
}

# 从hs_metadata.json中查找名称
$metaData = Get-Content "c:\open\hs-puzzle\hs_metadata.json" -Raw | ConvertFrom-Json

# 尝试从卡牌数据推断名称（通过统计规律）
Write-Host "`n职业ID和出现次数:"
$classMap.GetEnumerator() | Sort-Object { [int]$_.Key } | ForEach-Object {
    Write-Host "  ID=$($_.Key): $($_.Value.count) 张"
}

Write-Host "`n种族ID和出现次数:"
$minionTypeMap.GetEnumerator() | Sort-Object { [int]$_.Key } | ForEach-Object {
    Write-Host "  ID=$($_.Key): $($_.Value.count) 张"
}

Write-Host "`n稀有度ID和出现次数:"
$rarityMap.GetEnumerator() | Sort-Object { [int]$_.Key } | ForEach-Object {
    Write-Host "  ID=$($_.Key): $($_.Value.count) 张"
}

Write-Host "`n系列ID和出现次数（前20）:"
$setMap.GetEnumerator() | Sort-Object { [int]$_.Key } | Select-Object -First 20 | ForEach-Object {
    Write-Host "  ID=$($_.Key): $($_.Value.count) 张"
}

# 保存映射文件
$mappings = @{
    classes = $classMap.Values | Sort-Object id
    minionTypes = $minionTypeMap.Values | Sort-Object id
    rarities = $rarityMap.Values | Sort-Object id
    sets = $setMap.Values | Sort-Object id
}

$mappings | ConvertTo-Json -Depth 10 | Out-File "c:\open\hs-puzzle\mappings.json" -Encoding utf8
Write-Host "`n映射已保存到 mappings.json"

