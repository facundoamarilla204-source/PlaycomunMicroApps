import JSZip from "jszip"
import { ImageItem } from "./types"

export async function createAndDownloadZip(
  items: ImageItem[],
  zipFileName = "imagenes-optimizadas-playcomun.zip"
): Promise<{ count: number; sizeBytes: number }> {
  const completedItems = items.filter(
    (item) => item.status === "completed" && item.result?.blob
  )

  if (completedItems.length === 0) {
    throw new Error("No hay imágenes completadas para incluir en el ZIP")
  }

  const zip = new JSZip()
  const nameCounts: Record<string, number> = {}

  for (const item of completedItems) {
    if (!item.result?.blob) continue

    let fileName = item.result.fileName
    const ext = item.result.extension

    // Disambiguate duplicate filenames inside ZIP
    if (nameCounts[fileName]) {
      nameCounts[fileName]++
      const base = fileName.slice(0, fileName.lastIndexOf("."))
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
  }, 1500)

  return {
    count: completedItems.length,
    sizeBytes: zipBlob.size,
  }
}
