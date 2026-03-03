import { useCallback } from "react";
import { useQuizStore } from "@src/store/quizStore";
import { generateExportFiles } from "@src/lib/exportEngine";
import { zipSync, strToU8 } from "fflate";

export function useExport() {
  const quizData = useQuizStore((s) => s.quizData);
  const defaultW = useQuizStore((s) => s.defaultW);
  const defaultH = useQuizStore((s) => s.defaultH);

  const exportQuiz = useCallback(() => {
    if (quizData.frames.length < 2) {
      alert("Please add at least 2 frames before exporting.");
      return;
    }
    const files = generateExportFiles(quizData, defaultW, defaultH);
    const folder = `quiz_bls_${defaultW}x${defaultH}`;
    const zipped = zipSync({
      [`${folder}/index.html`]: strToU8(files.html),
      [`${folder}/ad.css`]: strToU8(files.css),
      [`${folder}/ad.js`]: strToU8(files.js),
    });
    const blob = new Blob([zipped as unknown as Uint8Array<ArrayBuffer>], {
      type: "application/zip",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${folder}.zip`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [quizData, defaultW, defaultH]);

  return { exportQuiz };
}
