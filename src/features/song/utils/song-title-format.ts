/**
 * 格式化歌曲標題顯示文字
 *
 * 用途：
 * 後端或檔案來源可能會出現複本後綴，例如：
 * - 愛你一萬年__2
 * - 愛你一萬年_2
 *
 * UI 顯示時不希望顯示這種後綴，因此只在顯示層移除。
 *
 * 注意：
 * 這個函式只應該用在 UI 顯示。
 * 不要用它修改 song.title 原始資料，也不要拿格式化後的 title 去查 API / S3。
 */
export function formatDisplaySongTitle(title: string) {
  return title.replace(/_{1,2}\d+$/, '');
}
