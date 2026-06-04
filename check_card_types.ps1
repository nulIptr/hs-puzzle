
# 检查card_type_id的分布
$ErrorActionPreference = "Stop"

$data = Get-Content "c:\open\hs-puzzle\hs_cards_complete.json" -Raw | ConvertFrom-Json
$cards = $data.cards

Write-Host "总卡牌数: $($cards.Count)"
Write-Host "`ncard_type_id 分布:"

$typeCounts = @{}
foreach ($card in $cards) {
    $typeId = $card.card_type_id
    if (-not $typeCounts.ContainsKey($typeId)) {
        $typeCounts[$typeId] = 0
    }
    $typeCounts[$typeId]++
}

$typeCounts.GetEnumerator() | Sort-Object { [int]$_.Key } | ForEach-Object {
    Write-Host "  ID=$($_.Key): $($_.Value) 张"
    # 显示几张样例
    $samples = $cards | Where-Object { $_.card_type_id -eq $_.Key } | Select-Object -First 3
    foreach ($sample in $samples) {
        Write-Host "    - $($sample.name) (id:$($sample.id))"
    }
}

