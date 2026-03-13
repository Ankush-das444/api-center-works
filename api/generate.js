export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { imageBase64 } = req.body;
        const hfToken = process.env.HUGGING_FACE_TOKEN;

        if (!imageBase64) return res.status(400).json({ error: 'No image provided' });
        if (!hfToken) return res.status(500).json({ error: 'Server missing HF Token' });

        console.log("1. Received Image from Android! Converting to binary...");
        
        // Convert the Base64 string from Android back into a raw image file
        const imageBuffer = Buffer.from(imageBase64, 'base64');

        // We are using Stable Video Diffusion (The best open-source Image-to-Video model)
        const hfUrl = "https://api-inference.huggingface.co/models/stabilityai/stable-video-diffusion-img2vid-xt";

        console.log("2. Pinging Hugging Face API...");
        const hfResponse = await fetch(hfUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${hfToken}`,
                "Content-Type": "application/octet-stream"
            },
            body: imageBuffer
        });

        // Handle "Server Waking Up" Status
        if (hfResponse.status === 503) {
            console.log("Hugging Face server is asleep. Waking it up...");
            return res.status(200).json({ 
                success: false, 
                message: "The AI server is waking up! Please tap generate again in 30 seconds." 
            });
        }

        if (!hfResponse.ok) {
            const errorText = await hfResponse.text();
            console.error("HF Error:", errorText);
            return res.status(500).json({ error: "Hugging Face failed to generate video." });
        }

        console.log("3. Video Generated! Uploading to temporary storage...");
        
        // Hugging Face returns the raw video file. We upload it to a free host so Android can download it.
        const videoBuffer = await hfResponse.arrayBuffer();
        
        // Using file.io for temporary free video hosting
        const fileIoForm = new FormData();
        const blob = new Blob([videoBuffer], { type: 'video/mp4' });
        fileIoForm.append('file', blob, 'live_wallpaper.mp4');

        const fileIoResponse = await fetch("https://file.io/?expires=1d", {
            method: "POST",
            body: fileIoForm
        });

        const fileIoData = await fileIoResponse.json();

        if (fileIoData.success) {
            console.log("4. Success! Sending video link to Android:", fileIoData.link);
            return res.status(200).json({
                success: true,
                message: "Video generated successfully!",
                videoUrl: fileIoData.link
            });
        } else {
            throw new Error("Failed to upload video to temporary storage.");
        }

    } catch (error) {
        console.error("API Error:", error);
        return res.status(500).json({ error: error.message });
    }
            }
