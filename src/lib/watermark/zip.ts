import JSZip from "jszip"
import { WatermarkImageItem } from "./types"

export async function createAndDownloadWatermarkZip(
  items: WatermarkImageItem[],
  zipFileName = "imagenes-con-marca-de-agua.zip"
): Promise<{ count: number; sizeBytes: number }> {
  const completedItems = items.filter(
    (item) => item.status === "completed" && item.result?.blob
  )

  if (completedItems.length === 0) {
    throw new Error("No hay imágenes procesadas con éxito para descargar en ZIP")
  }

  const zip = new JSZip()
  const nameCounts: Record<string, number> = {}

  for (const item of completedItems) {
    if (!item.result?.blob) continue

    let fileName = item.result.fileName
    const lastDot = fileName.lastIndexOf(".")
    const base = lastDot > 0 ? fileName.substring(0, lastDot) : fileName
    const ext = lastDot > 0 ? fileName.substring(lastDot + 1) : "jpg"

    // Deduplicate file names inside the zip archive
    if (nameCounts[fileName]) {
      nameCounts[fileName]++
      fileName = `${base}-${nameCounts[fileName]}.${ext}`
    } else {
      nameCounts[fileName] = 1
    }

    zip.file(fileName, item.result.blob)
  }

  const zipBlob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  })

  // Trigger browser download
  const downloadUrl = URL.createObjectURL(zipBlob)
  const a = document.createElement("a")
  a.href = downloadUrl
  a.download = zipFileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  setTimeout(() => {
    URL.revokeObjectURL(downloadUrl)
  }, 2000)

  return {
    count: completedItems.length,
    sizeBytes: zipBlob.size,
  }
}
