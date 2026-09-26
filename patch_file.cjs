const fs = require('fs');
let code = fs.readFileSync('src/components/stories/StoriesReel.tsx', 'utf8');
code = code.replace(
`  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        soundEffects.playTap();
        setStoryImageUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };`,
`  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try {
      const compressedUrl = await compressImage(file, 1080, 1920, 0.7);
      soundEffects.playTap();
      setStoryImageUrl(compressedUrl);
    } catch (e) {
      console.warn('Failed to compress story image:', e);
    }
  };`);

code = code.replace(
`  const takeSnapshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 720;
      canvas.height = videoRef.current.videoHeight || 1280;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setStoryImageUrl(dataUrl);
        soundEffects.playTap();
      }
      stopCamera();
    }
  };`,
`  const takeSnapshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      let w = videoRef.current.videoWidth || 720;
      let h = videoRef.current.videoHeight || 1280;
      if (w > 1080 || h > 1920) {
        const ratio = Math.min(1080 / w, 1920 / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setStoryImageUrl(dataUrl);
        soundEffects.playTap();
      }
      stopCamera();
    }
  };`);
fs.writeFileSync('src/components/stories/StoriesReel.tsx', code);
