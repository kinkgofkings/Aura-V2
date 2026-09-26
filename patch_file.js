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
fs.writeFileSync('src/components/stories/StoriesReel.tsx', code);
