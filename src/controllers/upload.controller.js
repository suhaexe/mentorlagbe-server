export const uploadImage = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ message: "No image provided" });

    const base64Data = image.split(",")[1];
    
    const formData = new FormData();
    formData.append("image", base64Data);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_KEY}`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      res.json({ url: data.data.url });
    } else {
      res.status(500).json({ message: "ImgBB upload failed", error: data });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};