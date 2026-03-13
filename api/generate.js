export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { imageBase64 } = req.body;
        if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

        const falKey = process.env.FAL_KEY;
        if (!falKey) return res.status(500).json({ error: 'Server missing FAL Key' });

        console.log("1. Image received! Pinging Fal.ai (LTX Video Fast)...");

        // Format the Base64 string so Fal knows it is a JPEG
        const dataUri = `data:image/jpeg;base64,${imageBase64}`;

        // Hitting the ultra-fast LTX model
        const falResponse = await fetch("https://fal.run/fal-ai/ltx-2/image-to-video/fast", {
            method: "POST",
            headers: {
                "Authorization": `Key ${falKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                image_url: dataUri,
                // Hardcoded prompt tailored for live wallpapers:
                prompt: "Cinematic subtle motion, seamless loop, high quality, 4k resolution, beautiful lighting, highly detailed.",
                duration: 6 // 6 seconds is the perfect length for a looping wallpaper
            })
        });

        if (!falResponse.ok) {
            const errorText = await falResponse.text();
            console.error("Fal Error:", errorText);
            return res.status(500).json({ error: "Fal failed to generate video: " + errorText });
        }

        const data = await falResponse.json();
        
        console.log("2. Video Generated! Fal URL:", data.video.url);

        // Send the real Fal video URL back to your Android app
        return res.status(200).json({
            success: true,
            videoUrl: data.video.url
        });

    } catch (error) {
        console.error("API Error:", error);
        return res.status(500).json({ error: error.message });
    }
                }
